# QR dependencies

Self-hosted runtime assets; no package install, lifecycle scripts, transitive runtime dependencies, remote QR service or network calls in these two files. Source scan found no fetch, XMLHttpRequest, eval or new Function. This is a scoped review, not a guarantee of absence of vulnerabilities.

- qrcode-generator 1.4.4: MIT; npm archive https://registry.npmjs.org/qrcode-generator/-/qrcode-generator-1.4.4.tgz; SHA512 integrity verified against registry metadata before extraction.
  Runtime qrcode.js: 56694 bytes; SHA256 18ae399f81182bc9de916e9c77b195df20cc58d6f2d55a62b085a299f1bf1780.
- jsqr 1.4.0: Apache-2.0; npm archive https://registry.npmjs.org/jsqr/-/jsqr-1.4.0.tgz; SHA512 integrity verified against registry metadata before extraction.
  Runtime jsQR.js: 256885 bytes; SHA256 bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859.

Generator archive omits full license; full upstream MIT notice saved from commit83b7e8fe3fddd3b0368dbafd6ce56995bd25e3c8 (LICENSE). Initial1.4.4 tag URL404; no source replacement. Decoder Apache2 notice comes directly from package. Original generator license header retained.

Compatibility: plain browser JavaScript on Mac/Android/iOS; camera uses HTTPS getUserMedia, decoder operates on bounded local RGBA frames. ~314 KiB uncompressed runtime assets, decode bounded640px at5fps. No daemon/model, GPU or paid API. Stop camera on close/hide/pagehide; remove gift-qr.js script tags and these assets to roll back UI only, preserving gift schema/credit logic. Physical device performance unverified.
