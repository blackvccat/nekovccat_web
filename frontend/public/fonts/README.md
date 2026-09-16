# Local fonts

Fonts are copied unchanged from the official Fontsource npm packages, version 5.3.0. All three use the SIL Open Font License 1.1; full licenses and copyright notices are included beside the fonts. No runtime font service or npm dependency is required.

| File | Package | SHA-256 |
| --- | --- | --- |
| `geist-latin-wght-normal.woff2` | `@fontsource-variable/geist@5.3.0` | `19f9c92546aa300c312235e3125af1b81394d8db9a4bc4a425cd5b641d2d54e1` |
| `geist-mono-latin-wght-normal.woff2` | `@fontsource-variable/geist-mono@5.3.0` | `684ad5b531f81d43c1e8c7038262d5db7cdc1f68006e04d6c7769efa8d33c8cc` |
| `jersey-25-latin-400-normal.woff2` | `@fontsource/jersey-25@5.3.0` | `b779f5b54197a82a62da9ca84b1e91c25f91ae64081b997bc9486f65544b1325` |

Geist and Geist Mono are Latin variable fonts (weight 100–900), loaded by `next/font/local`. Jersey 25 is the Latin regular face (weight 400), declared in `src/app/globals.css` with its original family name. Chinese text continues to use the existing system font fallbacks.
