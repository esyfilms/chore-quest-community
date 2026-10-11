# Credits and asset sources

The community edition ships a generic robot and fictional sample accounts. The robot is drawn from rectangles by [generate-buddy.py](scripts/generate-buddy.py), using Python's standard library. No private mascot artwork, reference photograph or external generation service is used by that script. Its PNGs have transparent backgrounds, and its launcher icons use a cream tile.

## Graphics and effects

| Source | What is used | License and source record |
| --- | --- | --- |
| [Drawably](https://github.com/danielwh2/drawably), Daniel Belyi | Selected seeded geometry for sketch buttons, outlines and panels; adapted into static SVG assets | MIT, [notice](assets/sketch/DRAWABLY-LICENSE.txt). Source 0.4.2, commit `013c1a2dadf8d5b87c92698f18a60682711e4bfc`; [generator](scripts/sketch-assets.mjs) and `scripts/vendor/drawably` |
| [Thinking Orbs](https://github.com/Jakubantalik/thinking-orbs), Jakub Antalik | Orbit geometry adapted into a 12-frame vector pixel loader | MIT, [notice](assets/sketch/THINKING-ORBS-LICENSE.txt). Commit `de85557ca220332586d070d8788c0e1d6e877a0d`; [generator](scripts/orb-assets.mjs) and `scripts/vendor/thinking-orbs` |
| [vgpu](https://github.com/vercel-labs/vgpu), Vercel | Adapted holographic WGSL effect, hosted by the app's own WebGPU code with CSS fallback | MIT, [notice](assets/shaders/VGPU-LICENSE.txt), [shader](assets/shaders/holographic-card.wgsl). Pinned source commit `9c23f6c02db06cff4a4c4d38656c0e6f1bda203f`, [example source](https://github.com/vercel-labs/vgpu/tree/9c23f6c02db06cff4a4c4d38656c0e6f1bda203f/apps/docs/examples/holographic-card). The vgpu package is not installed |
| OpenAI image generation | Generic coin, wallet, dishes and bed illustrations, including transparent PNG/WebP revisions | Generated project artwork, shared under the project MIT license to the extent applicable. No external stock-art source or paid asset pack is claimed |
| Project pixel icons | Small chore illustrations authored as vector rectangles | Project MIT license; [generator](scripts/pixel-icons.mjs) |
| Buddy robot | New, procedurally drawn robot frames and launcher icons | Project MIT license; [generator](scripts/generate-buddy.py) |

SVG sketch/orb assets are generated locally from the retained source subsets. They are adaptations, not claims that the complete upstream libraries are installed or audited. The card works without WebGPU; effects pause or simplify for reduced motion and hidden views.

## Fonts

- **Patrick Hand**, designed by Patrick Wagesreiter: [Google Fonts source](https://github.com/google/fonts/tree/aeb9574d3cb4ab2ac5de70a8c730b11662281803/ofl/patrickhand). Bundled in `assets/fonts`, under [SIL OFL 1.1](assets/fonts/PATRICK-HAND-OFL.txt).
- **Pixelify Sans**, The Pixelify Sans Project Authors: [source](https://github.com/eifetx/Pixelify-Sans), bundled as `assets/quest.ttf`, under [SIL OFL 1.1](assets/FONT-LICENSE.txt).

Both fonts are self-hosted. The app does not request fonts from a remote font service.

## QR code libraries

- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4, Kazuhiko Arase, MIT: [notice](assets/vendor/qr/GENERATOR-LICENSE).
- [jsQR](https://github.com/cozmo/jsQR) 1.4.0, Apache-2.0: [notice](assets/vendor/qr/DECODER-LICENSE).

The bundled files, versions and checksums are recorded in [QR provenance](assets/vendor/qr/PROVENANCE.md). They run locally; QR camera frames are not uploaded to a decoding service. Camera permissions and browser support still apply.

## Development assistance

OpenAI Codex assisted with design implementation, animation, tests, documentation, source review and preparation of this public edition. The project was directed and reviewed by its human maintainer. AI assistance is not an endorsement by any upstream author or a substitute for independent security review.

Third-party notices remain in their source and asset folders. The root MIT license does not replace the OFL, Apache or MIT notices attached to those files.

Generic raster files are distributed without embedded generation/container provenance metadata. The artwork itself is unchanged, and AI generation is still credited here. This metadata cleanup does not alter third-party license notices.
