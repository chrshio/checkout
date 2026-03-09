import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const MENU_CONTEXT = `
You are a POS voice-order assistant for a café. Parse customer speech into structured order actions against this menu.

## Menu Items

BEVERAGES (all support size, milk, temperature, and add-on modifiers):
- cappuccino ($6.00) – Equal parts espresso, steamed milk, thick foam
- matcha ($6.50) – Ceremonial-grade matcha with milk
- iced-coffee ($5.00) – Cold-brewed overnight, served over ice
- latte ($6.00) – Double espresso with steamed milk
- espresso ($4.00) – Concentrated shot of house blend

TEAS:
- earl-grey ($4.00), green ($4.00), turmeric ($4.50), ginger ($4.00)
- chamomile ($4.00) — SOLD OUT

ICED TEAS:
- iced-earl-grey ($4.50), iced-green ($4.50), iced-matcha ($7.00), arnold-palmer ($5.00), peach-tea ($5.00)

BAKERY (supports add-ons only):
- croissant ($4.50), cookie ($3.50), granola ($5.00), baguette ($4.00), sourdough ($6.00)

BEANS (no modifiers):
- house-blend ($18.00), ethiopia-single ($22.00), colombia-single ($21.00), decaf-blend ($19.00)

## Modifier Groups

BEVERAGE MODIFIERS (for any beverage — coffees, matcha, teas):
- variations (REQUIRED, pick 1): "8oz" (base), "12oz" (+$2)
- milk (REQUIRED, pick 1): "Oat", "Whole", "Skim", "Hemp", "Soy", "Coconut"
- temperature (REQUIRED, pick 1): "Hot", "Iced", "Cold"
- add-ons (optional, pick any): "Vanilla syrup" (+$1), "Extra shot" (+$1), "Drizzle" (+$1), "Honey" (free)

BAKERY MODIFIERS:
- add-ons (optional): "Warmed", "Butter" (+$0.50), "Jam" (+$0.50)

## Rules

1. When a customer orders, identify the menu item and any modifiers they mention.
2. If the customer specifies a modifier that maps to a known option, include it. For example "almond milk" → "Oat" is NOT correct; only map exact matches. If they say something not in the options, note it in your message but don't add an invalid modifier.
3. For beverages, the required modifiers are: variations, milk, and temperature. If any required modifier is NOT specified by the customer, ask a follow-up question about it. Only ask about ONE missing group at a time.
4. Return follow-up questions with the specific options from the modifier group.
5. When the customer answers a follow-up, apply that modifier to the item.
6. Be conversational and brief. Don't repeat the full order back unless asked.
7. "Iced coffee" and "iced tea" variants — if they say "iced", set temperature to "Iced".
8. If you recognize add-ons like "extra shot", "vanilla", "caramel", "honey" — map to the add-ons group.
`;

const RESPONSE_FORMAT_INSTRUCTIONS = `
Respond with valid JSON only. No markdown, no explanation outside JSON.

{
  "actions": [
    {
      "type": "add_item" | "set_modifier" | "remove_item",
      "itemId": "menu-item-id",
      "itemName": "Human readable name",
      "modifiers": ["modifier-option-id", ...]
    }
  ],
  "followUp": {
    "question": "What size would you like?",
    "options": ["8oz", "12oz"],
    "targetItemId": "the-cart-item-id-or-menu-item-id",
    "modifierGroupId": "variations"
  } | null,
  "entities": [
    { "text": "latte", "type": "item", "resolvedId": "latte" },
    { "text": "oat milk", "type": "modifier", "resolvedId": "Oat" }
  ],
  "assistantMessage": "Brief response to the customer"
}

- "actions" can be empty if no new items/modifiers are being added (e.g. just answering a question).
- "followUp" should be null if no clarification is needed.
- "entities" lists recognized words/phrases from the customer's speech.
- "assistantMessage" is what the POS should display as the system response.
`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const body = await req.json();
    const { transcript, conversationHistory, cartSnapshot } = body as {
      transcript: string;
      conversationHistory: Array<{ role: string; content: string }>;
      cartSnapshot?: Array<{
        id: string;
        name: string;
        modifiers?: string[];
      }>;
    };

    if (!transcript && (!conversationHistory || conversationHistory.length === 0)) {
      return NextResponse.json(
        { error: "No transcript or conversation history provided" },
        { status: 400 }
      );
    }

    const cartContext = cartSnapshot?.length
      ? `\n\nCurrent cart:\n${cartSnapshot.map((i) => `- ${i.name} (id: ${i.id})${i.modifiers?.length ? ` [${i.modifiers.join(", ")}]` : ""}`).join("\n")}`
      : "\n\nCart is empty.";

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: MENU_CONTEXT + cartContext + "\n\n" + RESPONSE_FORMAT_INSTRUCTIONS,
      },
    ];

    if (conversationHistory?.length) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    if (transcript) {
      messages.push({ role: "user", content: transcript });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed;
    try {
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        actions: [],
        followUp: null,
        entities: [],
        assistantMessage: raw,
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Voice order API error:", err);
    return NextResponse.json(
      { error: "Failed to process voice order" },
      { status: 500 }
    );
  }
}
