# GIS Design QA

## Comparison target

- Source visual truth: `/var/folders/tz/nhkgh3ls6bn_7h_g4_g1620h0000gn/T/codex-clipboard-508aa289-b984-440b-923d-11e579f6d83d.png`
- Browser-rendered implementation: `/private/tmp/gis-implementation-final.png`
- Focused modal evidence: `/private/tmp/gis-modal-final.png`
- Combined comparison evidence: `/private/tmp/gis-design-comparison.png`
- Source pixels: 1308 × 774 at the supplied 1× density.
- Implementation pixels: 1440 × 900 at a 1440 × 900 CSS viewport; the in-app browser capture was normalized to a 1× PNG for comparison.
- Combined comparison: source resized proportionally to 1440 × 852, a 32 px separator, then the 1440 × 900 implementation.
- State: light theme, `Trends → Mobile and Web GIS → Geospatial Clients` expanded. The source shows every branch expanded, while the implementation intentionally shows one progressive hover path because the requested default and interaction model require collapsed descendants.

## Findings

- No actionable P0, P1, or P2 differences remain.
- P3, intentional product integration: the reference uses a compact generic sans-serif on a bare white canvas; the implementation uses the existing iPRISM Inter typography, glass shell, sidebar, and light/dark tokens. Branch color, hierarchy, direction, root treatment, and curved topology preserve the reference’s design language inside the established product system.
- P3, intentional interaction addition: terminal nodes include small outlined information points that are absent from the source image but required by the brief. Their focus and hover states remain visually subordinate to the branch labels.

## Required fidelity surfaces

- Fonts and typography: Inter is used consistently with the current app. Category, intermediate, and terminal nodes step down from 1 rem to 0.68 rem with stable one-line labels. Modal display and body weights remain readable at both themes.
- Spacing and layout rhythm: the GIS root, three left categories, and two right categories match the source ordering. Depth spacing was compressed to keep terminal labels inside the desktop map viewport; mobile starts horizontally centered on the GIS root and remains pannable.
- Colors and visual tokens: the five source families are preserved as blue, orange, yellow, green, and teal. The map works on the existing light and dark surfaces, and focus indicators use the app accent.
- Image quality and asset fidelity: the source contains no photographic or illustrative assets to reproduce. Branches are drawn at device pixel ratio on canvas, keeping curves crisp without raster upscaling; the supplied iPRISM logo remains the existing source asset.
- Copy and content: the five top-level labels and all visible hierarchy labels follow the supplied map. Every terminal branch has an original explanation plus one or more official source/tool links. ArcGIS Explorer is explicitly marked retired and directs users to ArcGIS Field Maps.
- Icons and controls: no replacement icons were introduced. Terminal information points are semantic buttons with practical 22 px controls around the smaller visible dot.
- Accessibility: branch controls expose `aria-expanded`, terminal points have descriptive labels, the detail panel is a labelled modal dialog, Escape and Close dismiss it, focus returns to the triggering point, reduced motion is respected, and keyboard focus reveals the same progressive hierarchy.

## Interaction and responsive verification

- Initial render showed exactly five branch controls and zero leaf points.
- Hovering `Definition` revealed its two children; moving to `A Science` revealed the next level; moving to `Allied Fields` exposed all six terminal children and their information points.
- Moving away collapsed the map from seven visible nodes back to five after the short grace period.
- Click/tap pinning, Reset map, terminal modal opening, backdrop/Close/Escape dismissal, source links, and retired-product status were checked.
- ArcGIS Explorer opened with two official Esri links and its supported successor guidance.
- Checked at 1440 × 900 and 1280 × 720 desktop viewports, 390 × 844 mobile, and both light and dark themes.
- The browser console was checked after the primary interactions; no warnings or errors were present.

## Comparison history

1. P2: terminal modals without a status rendered an empty warning strip. Added a specific hidden state for `.gis-modal-status`; standard topic modals now omit it, while retired products still show guidance.
2. P2: a narrow viewport initially opened at the far-left edge of the wide map. Added automatic root centering on mount/reset and reduced mobile category type slightly so all five first-level labels remain legible.
3. P2: third-level labels on the expanded right branch could clip at the desktop map edge. Reduced horizontal depth spacing from 150 px to 120 px; the final Google Earth and ArcGIS Explorer labels and points now remain inside the shell.
4. P2 accessibility: focus initially returned to a detached terminal-point element after modal dismissal because the hover layer had re-rendered. The selected path is now pinned while the dialog is open, visibility-equivalent focus updates avoid unnecessary re-renders, and Escape returns focus to the current terminal point.
5. Post-fix comparison: branch order, palette, curvature, label hierarchy, progressive visibility, modal presentation, focus behavior, and viewport resilience were rechecked with no remaining P0/P1/P2 findings.

## Follow-up polish

- Optional P3: add branch-specific microcopy to the Reset control’s tooltip if future user testing shows people need more explanation of hover versus pinned click/tap behavior.

final result: passed
