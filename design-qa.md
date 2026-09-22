# Coming soon — current design QA

final result: passed

## Visual target and scope

The latest user amendment takes precedence over the initial reference:
- Restore the original DAYA logo at top left and `Ibiza · 38°59′N` at top right.
- Restore the transparent footer with the Persian soul / Modern expression signature, Until then, stay close, Instagram, Get in touch and copyright.
- Remove the newsletter form and black footer bar.
- Use the main site's Cormorant Garamond for the display heading and signature.
- Preserve the pomegranate edge composition and single-viewport behavior.

Original composition source: `C:/Users/rusty/AppData/Local/Temp/codex-clipboard-sGunOJ.png` (1920 × 1080), previously reviewed alongside the implementation. Header, typography and footer intentionally differ according to the latest request.

## Evidence

Preview: `http://127.0.0.1:5173/coming-soon/`.

Current screenshots: `output/coming-soon-qa/{375x667,390x844,768x1024,1440x900,1920x1080,320x568,844x390}.png`.
All captures use matching CSS/pixel dimensions and deviceScaleFactor 1.
Full views at 1440 × 900, 1920 × 1080, 375 × 667 and 320 × 568 were opened and visually inspected against the latest scoped changes. Full-resolution views clearly expose all controls and text; additional focused crops were unnecessary.

## Review

- Typography: local Cormorant Garamond 400 for heading and signature; small labels retain the main site's Manrope convention.
- Layout: centered two-line heading; logo and coordinates align across the top; footer uses the original three-group desktop layout and compact two-column mobile layout.
- Colors: existing slate/plum backdrop and cream text retained. Footer background is transparent with a subtle divider.
- Images: same transparent pomegranate PNGs, no new image generation. Existing DAYA wordmark loaded.
- Content: requested footer copy and contact destinations restored; no form, signup text, newsletter endpoint, or information dialogs remain.
- One initial small-screen issue was fixed: the old short-window font rule made the heading too small at 320 × 568 and forced the footer signature onto three lines. Adjusted responsive heading and signature sizes. Final 320 × 568 capture shows a prominent title and two-line signature.
- No remaining actionable P0/P1/P2 findings.

## Validation

`npm run qa:coming-soon` passed at all seven listed sizes:
- HTML/body and scene dimensions equal viewport dimensions.
- No vertical or horizontal scrolling; wheel input does not scroll.
- Logo, coordinates, heading and each footer group are within viewport; no footer column overlap.
- Cormorant Garamond applied; transparent footer verified; newsletter controls absent.
- All images load, decorative images ignore pointer events.
- Logo has visible keyboard focus and navigates to the original homepage.
- Instagram and email link destinations verified.
- Reduced-motion preference disables transitions.
- Browser console errors: none.

`npm run build` and `git diff --check` passed.

Automated report: `output/coming-soon-qa/report.json`.
Physical-device browser chrome and keyboard behavior were not tested.
