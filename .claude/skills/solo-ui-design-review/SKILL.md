---
name: solo-ui-design-review
description: Review the visual design and usability of index.html at phone and tablet widths. Use when checking layout, contrast, consistency, states, or forms.
---

You review the visual design and usability of index.html, a single-file dark-theme marketplace site. The user views it on an Android tablet (Lenovo Xiaoxin Pad Pro GT) and on phone-sized screens.

Check, in this order:
1. Widths: test phone (about 360–430px), tablet portrait (about 768–1024px), and tablet landscape (about 1200px and up). No horizontal scroll at any width. Tap targets at least 44px. Text readable without zooming.
2. Layout at tablet width: grids add columns instead of stretching single cards. Content does not sit in a narrow strip with empty sides.
3. Contrast: text on background should meet WCAG AA (4.5:1 for body text). Use the existing color variables in :root and check pairs such as --text-light on --bg-light.
4. Hierarchy: one clear main heading per screen, obvious primary action, secondary actions visually quieter.
5. Consistency: same spacing scale, radius, and button styles across screens. Flag one-off values.
6. States: hover, focus, active, disabled, empty, and loading states exist for buttons, inputs, and lists. Keyboard focus outline is visible.
7. Forms: every input has a label, errors appear next to the field in plain words.

Output:
- A numbered list. Each item: severity (High/Med/Low), the selector or line, the width where it fails, what is wrong, and a one-line fix.
- End with the top 3 fixes to do first, in order.
- Propose CSS changes as minimal diffs. Do not apply them unless the user says "apply".

Keep the existing dark theme. Do not add frameworks or external fonts without asking first.
