"use client";

import { CartHeader } from "./cart-header";
import { CartItems } from "./cart-items";
import { PricingSummary } from "./pricing-summary";
import { CartFooter } from "./cart-footer";
import type { CartItem } from "@/lib/pos-types";

interface CartSectionProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  onSave: () => void;
  onPay: () => void;
  editingItemId?: string | null;
  onItemClick?: (id: string) => void;
  onEditCancel?: () => void;
  onEditDone?: () => void;
  isAddMode?: boolean;
  addingItemId?: string | null;
  onAddCancel?: () => void;
  onAdd?: () => void;
  addDisabled?: boolean;
  onRemoveItem?: (id: string) => void;
}

export function CartSection({
  items,
  subtotal,
  tax,
  total,
  onSave,
  onPay,
  editingItemId,
  onItemClick,
  onEditCancel,
  onEditDone,
  isAddMode,
  addingItemId,
  onAddCancel,
  onAdd,
  addDisabled,
  onRemoveItem,
}: CartSectionProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isEditMode = editingItemId != null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white pr-6">
        <CartHeader itemCount={0} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white pr-6">
      <CartHeader itemCount={itemCount} disabled={isEditMode || isAddMode} />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <CartItems
            items={items}
            editingItemId={editingItemId}
            addingItemId={addingItemId}
            onItemClick={onItemClick}
            onRemoveItem={onRemoveItem}
          />
          <PricingSummary subtotal={subtotal} tax={tax} total={total} isFaded={isEditMode || isAddMode} />
        </div>
      </div>

      <div className="mt-auto">
        <CartFooter
          onSave={onSave}
          onPay={onPay}
          disabled={items.length === 0}
          isEditMode={isEditMode}
          onCancel={onEditCancel}
          onDone={onEditDone}
          isAddMode={isAddMode}
          onAddCancel={onAddCancel}
          onAdd={onAdd}
          addDisabled={addDisabled}
        />
      </div>
    </div>
  );
}
