"use client";

interface CartFooterProps {
  onSave: () => void;
  onPay: () => void;
  disabled?: boolean;
  isEditMode?: boolean;
  onCancel?: () => void;
  onDone?: () => void;
  isAddMode?: boolean;
  onAddCancel?: () => void;
  onAdd?: () => void;
  addDisabled?: boolean;
}

export function CartFooter({
  onSave,
  onPay,
  disabled,
  isEditMode,
  onCancel,
  onDone,
  isAddMode,
  onAddCancel,
  onAdd,
  addDisabled,
}: CartFooterProps) {
  if (isAddMode) {
    return (
      <div className="flex items-center gap-3 px-0 py-4">
        <button
          onClick={onAddCancel}
          className="flex-1 py-4 rounded-full bg-[#f0f0f0] text-[#101010] font-medium text-base transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onAdd}
          className="flex-1 py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors"
        >
          Add
        </button>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <div className="flex items-center gap-3 px-0 py-4">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-full bg-[#f0f0f0] text-[#101010] font-medium text-base transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-0 py-4">
      <button
        onClick={onSave}
        disabled={disabled}
        className="flex-1 py-4 rounded-full bg-[#f0f0f0] text-[#101010] font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save
      </button>
      <button
        onClick={onPay}
        disabled={disabled}
        className="flex-1 py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Pay
      </button>
    </div>
  );
}
