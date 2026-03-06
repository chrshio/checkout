"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/lib/pos-types";
import { getModifierGroups, isGroupRequirementUnmet } from "@/lib/modifiers";

interface CartItemsProps {
  items: CartItem[];
  editingItemId?: string | null;
  addingItemId?: string | null;
  onItemClick?: (id: string) => void;
  onRemoveItem?: (id: string) => void;
}

function CartItemRow({
  item,
  isEditing,
  isDraft,
  isFaded,
  onClick,
  onRemove,
}: {
  item: CartItem;
  isEditing: boolean;
  isDraft: boolean;
  isFaded: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const didMoveRef = useRef(false);

  const REMOVE_WIDTH = 80;
  const SNAP_THRESHOLD = 36;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraft) return;
    startXRef.current = e.clientX;
    didMoveRef.current = false;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 4) didMoveRef.current = true;
    const base = isOpen ? -REMOVE_WIDTH : 0;
    setTranslateX(Math.max(-REMOVE_WIDTH, Math.min(0, base + delta)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const totalDelta = e.clientX - startXRef.current;
    startXRef.current = null;
    setIsDragging(false);

    let nowOpen: boolean;
    if (isOpen) {
      nowOpen = totalDelta <= SNAP_THRESHOLD;
    } else {
      nowOpen = totalDelta < -SNAP_THRESHOLD;
    }

    setIsOpen(nowOpen);
    setTranslateX(nowOpen ? -REMOVE_WIDTH : 0);
  };

  const handleContentClick = () => {
    if (didMoveRef.current) return;
    if (isOpen) {
      setIsOpen(false);
      setTranslateX(0);
      return;
    }
    onClick?.();
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setTranslateX(0);
    onRemove?.();
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl border-2 overflow-hidden",
        isEditing || isDraft ? "border-[#101010]" : "border-transparent",
        isFaded ? "opacity-40" : "opacity-100"
      )}
    >
      {/* Red remove button — revealed when content slides left */}
      {!isDraft && onRemove && (
        <div className="absolute right-0 inset-y-0 w-[80px] bg-[#cc0023] flex items-center justify-center">
          <button
            onClick={handleRemoveClick}
            className="w-full h-full flex items-center justify-center"
          >
            <span className="text-white font-semibold text-[15px]">Remove</span>
          </button>
        </div>
      )}

      {/* Sliding card content */}
      <div
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleContentClick}
        className={cn(
          "relative bg-white pt-[12px] pb-[12px] px-4",
          !isDraft && "cursor-pointer"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-base font-medium text-[#101010]">
              {item.name}
            </p>
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="space-y-0">
                {item.modifiers.map((modifier, index) => (
                  <p key={index} className="text-sm text-[#888888]">
                    {modifier}
                  </p>
                ))}
              </div>
            )}
            {getModifierGroups(item)
              .filter((g) => isGroupRequirementUnmet(g, item.modifiers ?? []))
              .map((g) => (
                <p key={g.id} className="text-[12px] font-semibold text-[#005ad9]">
                  Select {g.minSelect} {g.name}
                </p>
              ))
            }
          </div>
          <p
            className={cn(
              "text-base text-[#101010]",
              item.quantity === 1 ? "font-normal" : "font-medium"
            )}
          >
            ${(item.price * item.quantity).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CartItems({ items, editingItemId, addingItemId, onItemClick, onRemoveItem }: CartItemsProps) {
  const hasEditingItem = editingItemId != null;
  const hasAddingItem = addingItemId != null;

  return (
    <div className="rounded-2xl border border-[#e5e5e5] bg-[#ffffff] p-0">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-20 text-[#959595]">
          No items in cart
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {items.map((item) => {
            const isEditing = editingItemId === item.id;
            const isDraft = addingItemId === item.id;
            const isFaded = (hasEditingItem && !isEditing) || (hasAddingItem && !isDraft);
            return (
              <CartItemRow
                key={item.id}
                item={item}
                isEditing={isEditing}
                isDraft={isDraft}
                isFaded={isFaded}
                onClick={!isDraft && onItemClick ? () => onItemClick(item.id) : undefined}
                onRemove={!isDraft && onRemoveItem ? () => onRemoveItem(item.id) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
