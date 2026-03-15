# Printer Groups – Design Addendum

Apply these design decisions when implementing the Printer Groups feature.

## 1. Printer Group page (Create group full-page editor) – use cards

- **Do not** use dividers for the left-side layout.
- **Use cards** for the left column, matching the printer settings page on web:
  - Group name in a card (or top card)
  - Each settings section (Receipts, In-person order tickets, Online and kiosk order tickets, Ticket stubs, Void tickets) in its own **card** with the same styling as the cards on the printer settings web page (e.g. `rounded-2xl border border-black/10 bg-white`, section blocks inside cards).

## 2. Buttons and text links – project conventions

- **Primary actions:** Use **primary black buttons** (e.g. `bg-[#101010]` / black fill), like the existing “Add device” button on the printers page. Do **not** use blue primary buttons for “Create group”, “Next”, “Save”, “Skip”, etc.
- **Text links:** Use **on-the-line text links** (same color as body text, no blue, optional underline on hover/focus), not blue underlined links. Apply to all “Edit”, “Edit printer group”, and similar links across:
  - Create group modal
  - Create printer group page (full-page editor)
  - Grouped printer detail view (e.g. “Edit printer group”)

Reference existing patterns in `printer-detail-web.tsx` and `printer-settings-web-screen.tsx` for button and link classes.
