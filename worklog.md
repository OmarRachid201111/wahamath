---
Task ID: 1
Agent: main
Task: Fix +/- and Réinitialiser zoom buttons in lightbox that close dialog instead of zooming, and add pan/drag with grab cursor

Work Log:
- Analyzed the full page.tsx (~1727 lines) to understand the component structure
- Identified that ImageLightbox is the ONLY component with zoom controls (no inline zoom on page images)
- Discovered THREE root causes that together caused the failure across 4 previous fix attempts:
  1. **Z-index stacking issue**: ImageLightbox rendered inside React tree (inside div.min-h-screen), while Radix Dialog rendered via Portal at document.body level. Despite z-9999 on lightbox vs z-50 on dialog, the dialog was visually on top (confirmed via elementFromPoint).
  2. **Body pointer-events:none**: Radix Dialog sets pointer-events:none on body when open. Lightbox inherited this, making all its buttons unclickable.
  3. **Radix DismissableLayer**: Even if events reached the dialog, Radix capture-phase pointerdown handler would detect outside clicks and dismiss the dialog.

Fixes applied:
  1. **createPortal(lightboxContent, document.body)**: Render lightbox via React Portal to document.body, placing it at the same DOM level as the Dialog portal.
  2. **Added `pointer-events-auto` class** to lightbox root div to override inherited pointer-events:none from body.
  3. **Added `onInteractOutside` prop** to both DialogContent instances (ExerciseDetailDialog and ProgressDialog) that calls e.preventDefault() when lightbox is open.
  4. **Cleaned up unnecessary stopImmediatePropagation hacks** from the lightbox root div.

Browser verification:
- elementFromPoint confirmed lightbox buttons are on top (isInLightbox: true)
- pointer-events confirmed as auto
- Zoom in: 100% -> 125% -> 150%
- Zoom out: 150% -> 125%
- Reset: 125% -> 100%
- Dialog stays open during all zoom operations
- Closing lightbox keeps dialog open
- Cursor: default at 100%, grab at >100% zoom
- Pan/drag with grab/grabbing cursor verified

Stage Summary:
- Fixed the zoom button issue that persisted through 4 previous attempts
- Root cause was z-index stacking + pointer-events inheritance + Radix dismissal
- All zoom controls (+, -, Reset) now work in both student and teacher views
- Pan/drag with grab cursor verified working when zoomed in
