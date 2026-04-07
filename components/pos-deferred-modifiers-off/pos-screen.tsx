"use client";

/**
 * Fork of Standard (cafe) POS screen — edit here without affecting other checkout variants.
 * Shared UI lives under @/components/pos/*.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { StatusBar } from "@/components/pos/status-bar";
import { MenuGrid } from "@/components/pos/menu-grid";
import { ItemEditPanel, type DraftItemOptions } from "@/components/pos/item-edit-panel";
import { ItemAddPanel } from "@/components/pos/item-add-panel";
import { CartSection } from "@/components/pos/cart-section";
import { FulfillmentMethodModal } from "@/components/pos/fulfillment-method-modal";
import { BottomNavigation } from "@/components/pos/bottom-navigation";
import { SettingsPage } from "@/components/pos/settings-page";
import { ChargeScreen } from "@/components/pos/charge-screen";
import type { CartItem, MenuItem, NavItem } from "@/lib/pos-types";
import { POS_ORDER_FULFILLMENTS } from "@/lib/pos-types";
import {
  itemRequiresSelection,
  getDefaultModifiers,
  getModifierPriceDelta,
  getModifierGroups,
  isGroupRequirementUnmet,
} from "@/lib/modifiers";
import {
  cartHasIncompleteItems,
  cartItemHasIncompleteRequirements,
} from "@/lib/cart-validation";

function getUnmetRequiredModifierGroups(
  item: { name: string },
  modifiers: string[]
) {
  return getModifierGroups(item).filter(
    (g) =>
      g.minSelect &&
      g.minSelect > 0 &&
      isGroupRequirementUnmet(g, modifiers)
  );
}

function getFirstUnmetModifierGroupId(
  item: { name: string },
  modifiers: string[]
): string | null {
  return getUnmetRequiredModifierGroups(item, modifiers)[0]?.id ?? null;
}

/** One missing group → section-specific copy; multiple → generic. */
function getIncompleteItemToastMessage(
  item: { name: string },
  modifiers: string[]
): string {
  const unmet = getUnmetRequiredModifierGroups(item, modifiers);
  if (unmet.length === 1) {
    return `Select an option from ${unmet[0].name}.`;
  }
  return "Make required selections to continue.";
}

const TAX_RATE = 0.05;
const ADD_DRAFT_ID = "__draft_add__";
/** Same duration as validation toast; UI reverts to blue/gray after this with CSS transition. */
const INCOMPLETE_HIGHLIGHT_MS = 4000;

export function POSScreenDeferredModifiersOff() {
  const [activeTab, setActiveTab] = useState<NavItem>("checkout");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  /** Red/coral “missing requirement” styling only after failed Add/Save; auto-clears with toast timing. */
  const [incompleteRequirementHighlightActive, setIncompleteRequirementHighlightActive] =
    useState(false);
  const incompleteHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerIncompleteRequirementHighlight = useCallback(() => {
    setIncompleteRequirementHighlightActive(true);
    if (incompleteHighlightTimerRef.current) {
      clearTimeout(incompleteHighlightTimerRef.current);
    }
    incompleteHighlightTimerRef.current = setTimeout(() => {
      setIncompleteRequirementHighlightActive(false);
      incompleteHighlightTimerRef.current = null;
    }, INCOMPLETE_HIGHLIGHT_MS);
  }, []);

  const clearIncompleteRequirementHighlight = useCallback(() => {
    if (incompleteHighlightTimerRef.current) {
      clearTimeout(incompleteHighlightTimerRef.current);
      incompleteHighlightTimerRef.current = null;
    }
    setIncompleteRequirementHighlightActive(false);
  }, []);

  useEffect(
    () => () => {
      if (incompleteHighlightTimerRef.current) {
        clearTimeout(incompleteHighlightTimerRef.current);
      }
    },
    []
  );

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftQuantity, setDraftQuantity] = useState(1);
  const [draftModifiers, setDraftModifiers] = useState<string[]>([]);
  const [draftOptions, setDraftOptions] = useState<DraftItemOptions>({
    note: "",
    fulfillmentMethod: "for-here",
    taxes: [],
    discounts: [],
    serviceCharges: [],
  });

  // Item being configured before being added to the cart (has required selections).
  const [addingItem, setAddingItem] = useState<MenuItem | null>(null);
  const [addDraftQuantity, setAddDraftQuantity] = useState(1);
  const [addDraftModifiers, setAddDraftModifiers] = useState<string[]>([]);
  const [addDraftOptions, setAddDraftOptions] = useState<DraftItemOptions>({
    note: "",
    fulfillmentMethod: "for-here",
    taxes: [],
    discounts: [],
    serviceCharges: [],
  });

  // Toast + scroll signal for the add panel validation.
  const [addToastMessage, setAddToastMessage] = useState<string | null>(null);
  const [addScrollSignal, setAddScrollSignal] = useState<{ groupId: string; nonce: number } | null>(null);
  const [editScrollSignal, setEditScrollSignal] = useState<{ groupId: string; nonce: number } | null>(null);

  const [orderFulfillment, setOrderFulfillment] = useState("for-here");
  const [fulfillmentModalOpen, setFulfillmentModalOpen] = useState(false);

  const [updateToastMessage, setUpdateToastMessage] = useState<string | null>(null);

  // Slide-in animation for the toast.
  const activeToast = addToastMessage ?? updateToastMessage;
  const [toastVisible, setToastVisible] = useState(false);
  const toastRafRef = useRef<number | null>(null);
  const isEditingMode = editingItemId != null;

  useEffect(() => {
    if (activeToast) {
      toastRafRef.current = requestAnimationFrame(() => {
        toastRafRef.current = requestAnimationFrame(() => setToastVisible(true));
      });
    } else {
      setToastVisible(false);
    }
    return () => {
      if (toastRafRef.current != null) cancelAnimationFrame(toastRafRef.current);
    };
  }, [activeToast]);

  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => { setAddToastMessage(null); setUpdateToastMessage(null); }, 4000);
    return () => clearTimeout(t);
  }, [activeToast]);

  // When the add panel is open, show a draft row in the cart so the user can
  // see how the item-in-progress affects the order total in real time.
  const draftCartItem: CartItem | null = addingItem
    && !isEditingMode
    ? {
        id: ADD_DRAFT_ID,
        name: addingItem.name,
        price: addingItem.price,
        quantity: addDraftQuantity,
        description: addingItem.description,
        modifiers: addDraftModifiers.length ? addDraftModifiers : undefined,
      }
    : null;

  const editingDraftItem: CartItem | null = editingItemId
    ? (() => {
        const base = cartItems.find((item) => item.id === editingItemId);
        if (!base) return null;
        return {
          ...base,
          quantity: draftQuantity,
          modifiers: draftModifiers.length ? draftModifiers : undefined,
          note: draftOptions.note || undefined,
          fulfillmentMethod: draftOptions.fulfillmentMethod,
          taxes: draftOptions.taxes,
          discounts: draftOptions.discounts,
          serviceCharges: draftOptions.serviceCharges,
        };
      })()
    : null;

  const displayItems = editingDraftItem
    ? cartItems.map((item) => (item.id === editingDraftItem.id ? editingDraftItem : item))
    : draftCartItem
      ? [...cartItems, draftCartItem]
      : cartItems;

  const subtotal = displayItems.reduce(
    (sum, item) =>
      sum +
      (item.price + getModifierPriceDelta(item, item.modifiers ?? [])) *
        item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleMenuItemSelect = useCallback((item: MenuItem) => {
    // Entering add flow should always exit edit flow.
    setEditingItemId(null);
    setEditScrollSignal(null);
    if (itemRequiresSelection(item)) {
      clearIncompleteRequirementHighlight();
      // Open the add panel so the user can make required selections first.
      setAddingItem(item);
      setAddDraftQuantity(1);
      setAddDraftModifiers(getDefaultModifiers(item));
      setAddDraftOptions({ note: "", fulfillmentMethod: "for-here", taxes: [], discounts: [], serviceCharges: [] });
    } else {
      // No required selections — add (or bump) directly.
      setCartItems((prev) => {
        const existing = prev.find((c) => c.id === item.id);
        if (existing) {
          return prev.map((c) =>
            c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
          );
        }
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            description: item.description,
            note: "",
            fulfillmentMethod: "for-here",
            taxes: [],
            discounts: [],
            serviceCharges: [],
          },
        ];
      });
    }
  }, [clearIncompleteRequirementHighlight]);

  const handleAddConfirm = useCallback(() => {
    if (!addingItem) return;
    clearIncompleteRequirementHighlight();
    setAddToastMessage(null);
    const uniqueId = `${addingItem.id}-${Date.now()}`;
    setCartItems((prev) => [
      ...prev,
      {
        id: uniqueId,
        name: addingItem.name,
        price: addingItem.price,
        quantity: addDraftQuantity,
        description: addingItem.description,
        modifiers: addDraftModifiers.length ? addDraftModifiers : undefined,
        note: addDraftOptions.note || undefined,
        fulfillmentMethod: addDraftOptions.fulfillmentMethod,
        taxes: addDraftOptions.taxes,
        discounts: addDraftOptions.discounts,
        serviceCharges: addDraftOptions.serviceCharges,
      },
    ]);
    setAddingItem(null);
  }, [
    addingItem,
    addDraftQuantity,
    addDraftModifiers,
    addDraftOptions,
    clearIncompleteRequirementHighlight,
  ]);

  const handleAddCancel = useCallback(() => {
    clearIncompleteRequirementHighlight();
    setAddingItem(null);
    setAddToastMessage(null);
    setAddScrollSignal(null);
  }, [clearIncompleteRequirementHighlight]);

  const handleAddAttempt = useCallback(() => {
    if (!addingItem) return;
    const draftCartItem: CartItem = {
      id: ADD_DRAFT_ID,
      name: addingItem.name,
      price: addingItem.price,
      quantity: addDraftQuantity,
      description: addingItem.description,
      modifiers: addDraftModifiers.length ? addDraftModifiers : undefined,
    };
    if (cartItemHasIncompleteRequirements(draftCartItem)) {
      const firstGroup = getFirstUnmetModifierGroupId(addingItem, addDraftModifiers);
      if (firstGroup) {
        setAddScrollSignal({ groupId: firstGroup, nonce: Date.now() });
      }
      setAddToastMessage(
        getIncompleteItemToastMessage(addingItem, addDraftModifiers)
      );
      triggerIncompleteRequirementHighlight();
      return;
    }
    handleAddConfirm();
  }, [
    addingItem,
    addDraftQuantity,
    addDraftModifiers,
    handleAddConfirm,
    triggerIncompleteRequirementHighlight,
  ]);

  const handleItemClick = useCallback(
    (id: string) => {
      const item = cartItems.find((i) => i.id === id);
      if (!item) return;

      clearIncompleteRequirementHighlight();

      if (editingItemId && editingItemId !== id) {
        const prevItem = cartItems.find((i) => i.id === editingItemId);
        setCartItems((prev) =>
          prev.map((ci) =>
            ci.id === editingItemId
              ? { ...ci, quantity: draftQuantity, modifiers: draftModifiers, note: draftOptions.note || undefined, fulfillmentMethod: draftOptions.fulfillmentMethod, taxes: draftOptions.taxes, discounts: draftOptions.discounts, serviceCharges: draftOptions.serviceCharges }
              : ci
          )
        );
        if (prevItem) {
          setUpdateToastMessage(`${prevItem.name} updated.`);
        }
      }

      if (addingItem) {
        const uniqueId = `${addingItem.id}-${Date.now()}`;
        setCartItems((prev) => [
          ...prev,
          {
            id: uniqueId,
            name: addingItem.name,
            price: addingItem.price,
            quantity: addDraftQuantity,
            description: addingItem.description,
            modifiers: addDraftModifiers.length ? addDraftModifiers : undefined,
            note: addDraftOptions.note || undefined,
            fulfillmentMethod: addDraftOptions.fulfillmentMethod,
            taxes: addDraftOptions.taxes,
            discounts: addDraftOptions.discounts,
            serviceCharges: addDraftOptions.serviceCharges,
          },
        ]);
        setUpdateToastMessage(`${addingItem.name} added.`);
      }

      setAddingItem(null);
      setAddToastMessage(null);
      setAddScrollSignal(null);
      setEditingItemId(id);
      setEditScrollSignal(null);
      setDraftQuantity(item.quantity);
      setDraftModifiers(item.modifiers?.length ? item.modifiers : getDefaultModifiers(item));
      setDraftOptions({
        note: item.note ?? "",
        fulfillmentMethod: item.fulfillmentMethod ?? "for-here",
        taxes: item.taxes ?? [],
        discounts: item.discounts ?? [],
        serviceCharges: item.serviceCharges ?? [],
      });
    },
    [
      cartItems,
      editingItemId,
      draftQuantity,
      draftModifiers,
      draftOptions,
      addingItem,
      addDraftQuantity,
      addDraftModifiers,
      addDraftOptions,
      clearIncompleteRequirementHighlight,
    ]
  );

  const handleRequirementClick = useCallback(
    (itemId: string, groupId: string) => {
      if (addingItem && itemId === ADD_DRAFT_ID) {
        setAddScrollSignal({ groupId, nonce: Date.now() });
        return;
      }

      clearIncompleteRequirementHighlight();

      const item = cartItems.find((i) => i.id === itemId);
      if (!item) return;

      if (addingItem) {
        const uniqueId = `${addingItem.id}-${Date.now()}`;
        setCartItems((prev) => [
          ...prev,
          {
            id: uniqueId,
            name: addingItem.name,
            price: addingItem.price,
            quantity: addDraftQuantity,
            description: addingItem.description,
            modifiers: addDraftModifiers.length ? addDraftModifiers : undefined,
            note: addDraftOptions.note || undefined,
            fulfillmentMethod: addDraftOptions.fulfillmentMethod,
            taxes: addDraftOptions.taxes,
            discounts: addDraftOptions.discounts,
            serviceCharges: addDraftOptions.serviceCharges,
          },
        ]);
        setUpdateToastMessage(`${addingItem.name} added.`);
      }

      setAddingItem(null);
      setAddToastMessage(null);
      setAddScrollSignal(null);
      if (editingItemId !== itemId) {
        setEditingItemId(itemId);
        setDraftQuantity(item.quantity);
        setDraftModifiers(item.modifiers?.length ? item.modifiers : getDefaultModifiers(item));
        setDraftOptions({
          note: item.note ?? "",
          fulfillmentMethod: item.fulfillmentMethod ?? "for-here",
          taxes: item.taxes ?? [],
          discounts: item.discounts ?? [],
          serviceCharges: item.serviceCharges ?? [],
        });
      }

      setEditScrollSignal({ groupId, nonce: Date.now() });
    },
    [
      addingItem,
      cartItems,
      editingItemId,
      addDraftQuantity,
      addDraftModifiers,
      addDraftOptions,
      clearIncompleteRequirementHighlight,
    ]
  );

  const handleEditCancel = useCallback(() => {
    clearIncompleteRequirementHighlight();
    setEditingItemId(null);
    setEditScrollSignal(null);
  }, [clearIncompleteRequirementHighlight]);

  const handleEditDone = useCallback(() => {
    if (!editingItemId) return;
    const base = cartItems.find((i) => i.id === editingItemId);
    if (!base) return;

    const draftCartItem: CartItem = {
      ...base,
      quantity: draftQuantity,
      modifiers: draftModifiers.length ? draftModifiers : undefined,
      note: draftOptions.note || undefined,
      fulfillmentMethod: draftOptions.fulfillmentMethod,
      taxes: draftOptions.taxes,
      discounts: draftOptions.discounts,
      serviceCharges: draftOptions.serviceCharges,
    };

    if (cartItemHasIncompleteRequirements(draftCartItem)) {
      const firstGroup = getFirstUnmetModifierGroupId(base, draftModifiers);
      if (firstGroup) {
        setEditScrollSignal({ groupId: firstGroup, nonce: Date.now() });
      }
      setAddToastMessage(
        getIncompleteItemToastMessage(base, draftModifiers)
      );
      triggerIncompleteRequirementHighlight();
      return;
    }

    clearIncompleteRequirementHighlight();
    setAddToastMessage(null);
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              quantity: draftQuantity,
              modifiers: draftModifiers,
              note: draftOptions.note || undefined,
              fulfillmentMethod: draftOptions.fulfillmentMethod,
              taxes: draftOptions.taxes,
              discounts: draftOptions.discounts,
              serviceCharges: draftOptions.serviceCharges,
            }
          : item
      )
    );
    setEditingItemId(null);
    setEditScrollSignal(null);
  }, [
    editingItemId,
    cartItems,
    draftQuantity,
    draftModifiers,
    draftOptions,
    clearIncompleteRequirementHighlight,
    triggerIncompleteRequirementHighlight,
  ]);

  const handleModifiersChange = useCallback((modifiers: string[]) => {
    setDraftModifiers(modifiers);
  }, []);

  const handleOptionsChange = useCallback((options: DraftItemOptions) => {
    setDraftOptions(options);
  }, []);

  const handleCompItem = useCallback(() => {
    console.log("Comp item:", editingItemId);
  }, [editingItemId]);

  const handleRemoveItem = useCallback(() => {
    clearIncompleteRequirementHighlight();
    setCartItems((prev) => prev.filter((item) => item.id !== editingItemId));
    setEditingItemId(null);
    setEditScrollSignal(null);
  }, [editingItemId, clearIncompleteRequirementHighlight]);

  const handleRemoveCartItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    if (editingItemId === id) setEditingItemId(null);
  }, [editingItemId]);

  const handleClearCart = useCallback(() => {
    clearIncompleteRequirementHighlight();
    setCartItems([]);
    setEditingItemId(null);
    setAddingItem(null);
  }, [clearIncompleteRequirementHighlight]);

  const handleSave = useCallback(() => {
    console.log("Saving order...", cartItems);
  }, [cartItems]);

  const [showChargeScreen, setShowChargeScreen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const handlePay = useCallback(() => {
    if (cartHasIncompleteItems(displayItems)) {
      setAddToastMessage("Make required selections to continue.");
      return;
    }
    setShowChargeScreen(true);
  }, [displayItems]);

  const editingItem = cartItems.find((i) => i.id === editingItemId) ?? null;

  return (
    <div className="relative flex flex-col h-full w-full bg-black">
      <StatusBar />

      <div className="flex-1 min-h-0 relative flex flex-col">
        {activeTab === "more" ? (
          <SettingsPage variantLabel="Deferred: Off" onLoadingChange={setSettingsLoading} />
        ) : (
          <>
            <div className="flex flex-1 min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
              {editingItem ? (
                <ItemEditPanel
                  item={editingItem}
                  draftQuantity={draftQuantity}
                  draftModifiers={draftModifiers}
                  draftOptions={draftOptions}
                  onQuantityChange={setDraftQuantity}
                  onModifiersChange={handleModifiersChange}
                  onOptionsChange={handleOptionsChange}
                  onCompItem={handleCompItem}
                  onRemoveItem={handleRemoveItem}
                  scrollSignal={editScrollSignal}
                  incompleteRequirementHighlightActive={
                    incompleteRequirementHighlightActive
                  }
                />
              ) : addingItem ? (
                <ItemAddPanel
                  item={addingItem}
                  onCancel={handleAddCancel}
                  draftQuantity={addDraftQuantity}
                  draftModifiers={addDraftModifiers}
                  draftOptions={addDraftOptions}
                  onQuantityChange={setAddDraftQuantity}
                  onModifiersChange={setAddDraftModifiers}
                  onOptionsChange={setAddDraftOptions}
                  scrollSignal={addScrollSignal}
                  incompleteRequirementHighlightActive={
                    incompleteRequirementHighlightActive
                  }
                />
              ) : (
                <MenuGrid onAddItem={handleMenuItemSelect} />
              )}
            </div>

            <div className="w-[320px] flex-shrink-0">
              <CartSection
                items={displayItems}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onSave={handleSave}
                onPay={handlePay}
                editingItemId={editingItemId}
                activeComboSlotId={null}
                onItemClick={handleItemClick}
                onRequirementClick={handleRequirementClick}
                onEditCancel={handleEditCancel}
                onEditDone={handleEditDone}
                isAddMode={!!addingItem && !isEditingMode}
                addingItemId={addingItem && !isEditingMode ? ADD_DRAFT_ID : null}
                onAddCancel={handleAddCancel}
                onAdd={handleAddAttempt}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                orderFulfillmentLabel={
                  orderFulfillment !== "for-here"
                    ? POS_ORDER_FULFILLMENTS.find((f) => f.id === orderFulfillment)?.label ?? orderFulfillment
                    : undefined
                }
                onFulfillmentHeaderClick={
                  orderFulfillment !== "for-here" ? () => setFulfillmentModalOpen(true) : undefined
                }
                onFulfillmentClick={() => setFulfillmentModalOpen(true)}
              />
            </div>
          </div>

          <FulfillmentMethodModal
            open={fulfillmentModalOpen}
            onOpenChange={setFulfillmentModalOpen}
            selectedId={orderFulfillment}
            onSelect={setOrderFulfillment}
            options={POS_ORDER_FULFILLMENTS}
          />

          {showChargeScreen && (
            <div className="absolute inset-0 z-10 flex flex-col justify-end">
              <ChargeScreen total={total} onClose={() => setShowChargeScreen(false)} />
            </div>
          )}
          </>
        )}
      </div>

      {!showChargeScreen && !settingsLoading && (
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {activeToast && (
        <div
          className="absolute left-1/2 z-50 w-[600px] max-w-[calc(100%-32px)] transition-transform duration-300 ease-out"
          style={{
            bottom: "78px",
            transform: `translateX(-50%) translateY(${toastVisible ? "0" : "200%"})`,
          }}
        >
          <div className={`flex items-center gap-3 px-4 py-4 rounded-[16px] shadow-xl ${addToastMessage ? "bg-[#cc0023]" : "bg-[#232323]"}`}>
            {addToastMessage ? (
              <AlertCircle className="w-6 h-6 text-white shrink-0" />
            ) : (
              <CheckCircle className="w-6 h-6 text-[#00a63e] shrink-0" />
            )}
            <p className="flex-1 text-[16px] text-white leading-6">{activeToast}</p>
            <button onClick={() => { setAddToastMessage(null); setUpdateToastMessage(null); }} className="shrink-0">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
