# Validation — 2026-09-05

## Automated checks

| Check               | Result                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| `npm install`       | Completed; exact resolved dependencies captured in package-lock.json       |
| `npm run build`     | Passed with Next.js 16.3.4 / webpack; all eight content routes prerendered |
| `npm run lint`      | Passed with zero warnings                                                  |
| `npm run typecheck` | Passed                                                                     |
| `npm run test`      | 5 tests passed                                                             |

The tests verify multilingual parameter parsing and range boundaries, empty-input handling, cancellation of generation on navigation, deterministic and bounded geometry for every lattice topology, scale-dependent geometry, and inclusive date filtering.

## Browser checks

- Desktop homepage visually reviewed; mobile header/menu opened and closed.
- All eight content pages checked at 390 / 768 / 1024 / 1440 / 1920 iframe widths: 40 layout measurements, no document horizontal overflow or overflowing heading, paragraph, or button text after fixes. The test browser uses a 15 px non-overlay scrollbar, so usable document widths are 375 / 753 / 1009 / 1425 / 1905 px respectively. This is responsive browser QA, not a physical iPhone test.
- Corrected the mobile name heading's clipping and a rotated discipline-arrow overflow.
- Architecture: a five-bay, one-depth prompt without a screen wall and with roof height 5.2 generated matching JSON. Busy state disabled repeated submission. JSON and parameter-preview components share the same editable parameter state.
- Lattice: Kelvin / Honeycomb selection, keyboard cell-size change, and Z-compression selection were exercised. Z mock metrics changed to 12.7 MPa / 0.22 mm / 9.8 MPa.
- RecoveryX: Leg Press + 7D produced 150 kg, 0 kg change, and four sessions. Exercise and date controls changed the displayed chart and metrics.
- JIKO: timer start / pause increments correctly, category selection updates the live record, and the 390 px layout has no horizontal overflow.
- Drum tower: floor count changed from seven to eight and the geometry projection / camera control remained functional.
- A hydration mismatch in SVG point titles was found and repaired by rendering each title as one string. A standalone RecoveryX recheck and subsequent drum-tower interaction returned no site React errors or warnings. Browser-extension metadata errors were distinguished from application logs.
- All temporary responsive-testing pages were removed from the delivered project.

## Limits

The available browser disables WebGL. The R3F renderer, scene components and GLB loader pass compilation and type checks; generated geometry is unit-tested, but actual GPU rendering, orbiting, auto-rotation and GLB rendering could not be visually validated in this environment. The WebGL capability gate and interactive SVG projection fallback were exercised successfully. Confirm GPU appearance and performance in a WebGL2-capable local browser before an important live presentation.

No real project photos, videos, GLB assets, resume PDF, contact URLs, AI API, Grasshopper service or ANSYS data were supplied. Their slots and integration paths are implemented and documented, with all current mock outputs marked. External services, research validity, real-device GPU performance and Vercel publication are outside the performed checks.

Reduced-motion handling is implemented through CSS, MotionConfig and useReducedMotion, with automatic model rotation off by default. A physical-device accessibility audit and OS reduced-motion emulation were not performed.
