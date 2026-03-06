// Shared modifier types and logic used by both the item-add and item-edit panels.

export interface ModifierOption {
  id: string;
  name: string;
  price?: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  /** Minimum options that must be selected (0 or undefined = optional). */
  minSelect?: number;
  /** Maximum options that can be selected (undefined = unlimited). */
  maxSelect?: number;
  options: ModifierOption[];
}

export const BEVERAGE_KEYWORDS = [
  "cortado",
  "matcha",
  "latte",
  "cappuccino",
  "espresso",
  "coffee",
  "tea",
  "americano",
  "mocha",
];

export const BEVERAGE_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: "variations",
    name: "Variations",
    maxSelect: 1,
    options: [
      { id: "8oz", name: "8oz", price: 5.5 },
      { id: "12oz", name: "12oz", price: 6.0 },
    ],
  },
  {
    id: "milk",
    name: "Milk",
    minSelect: 1,
    maxSelect: 1,
    options: [
      { id: "Oat", name: "Oat" },
      { id: "Whole", name: "Whole" },
      { id: "Skim", name: "Skim" },
      { id: "Hemp", name: "Hemp" },
      { id: "Soy", name: "Soy" },
      { id: "Coconut", name: "Coconut" },
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    maxSelect: 1,
    options: [
      { id: "Hot", name: "Hot" },
      { id: "Iced", name: "Iced" },
      { id: "Cold", name: "Cold" },
    ],
  },
  {
    id: "add-ons",
    name: "Add-ons",
    options: [
      { id: "Vanilla syrup", name: "Vanilla syrup", price: 1.0 },
      { id: "Extra shot", name: "Extra shot", price: 1.0 },
      { id: "Drizzle", name: "Drizzle", price: 1.0 },
      { id: "Honey", name: "Honey" },
    ],
  },
];

export const BAKERY_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: "add-ons",
    name: "Add-ons",
    options: [
      { id: "Warmed", name: "Warmed" },
      { id: "Butter", name: "Butter", price: 0.5 },
      { id: "Jam", name: "Jam", price: 0.5 },
    ],
  },
];

export function getModifierGroups(item: { name: string }): ModifierGroup[] {
  const isBeverage = BEVERAGE_KEYWORDS.some((kw) =>
    item.name.toLowerCase().includes(kw)
  );
  return isBeverage ? BEVERAGE_MODIFIER_GROUPS : BAKERY_MODIFIER_GROUPS;
}

export function isGroupRequirementUnmet(
  group: ModifierGroup,
  draftModifiers: string[]
): boolean {
  if (!group.minSelect) return false;
  const selectedCount = group.options.filter((o) =>
    draftModifiers.includes(o.id)
  ).length;
  return selectedCount < group.minSelect;
}

export function computeNewModifiers(
  group: ModifierGroup,
  optionId: string,
  current: string[]
): string[] {
  const groupOptionIds = group.options.map((o) => o.id);
  const currentInGroup = current.filter((m) => groupOptionIds.includes(m));
  const isSelected = currentInGroup.includes(optionId);

  let nextInGroup: string[];
  if (isSelected) {
    nextInGroup = currentInGroup.filter((m) => m !== optionId);
  } else if (group.maxSelect === 1) {
    nextInGroup = [optionId];
  } else if (group.maxSelect && currentInGroup.length >= group.maxSelect) {
    return current;
  } else {
    nextInGroup = [...currentInGroup, optionId];
  }

  return [
    ...current.filter((m) => !groupOptionIds.includes(m)),
    ...nextInGroup,
  ];
}

/** Returns true if any modifier group has a required selection (minSelect > 0). */
export function itemRequiresSelection(item: { name: string }): boolean {
  return getModifierGroups(item).some((g) => g.minSelect && g.minSelect > 0);
}
