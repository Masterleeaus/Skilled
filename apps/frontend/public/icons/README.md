# Brand icons and share image

These files are the SkilledAt.Work brand mark, generated from the brand pack in `public/brand/skilledatwork/Website-Ready/Logos/` (issue #174).

| File | Size | Source | Used by |
| --- | --- | --- | --- |
| `icon-192.png` | 192 x 192 | `emblem-360x307.png`, transparent background, centred with 12% padding | `src/app/manifest.ts`, `src/app/layout.tsx` (icon) |
| `icon-512.png` | 512 x 512 | `emblem-360x307.png`, transparent background, centred with 12% padding | `src/app/manifest.ts`, `src/app/layout.tsx` (icon) |
| `og-image.png` | 1200 x 630 | `logo-dark-650x218.png` on `#0a0a0a` (the `--background` token in `src/app/globals.css`) | `src/app/layout.tsx` (Open Graph and Twitter image) |

To regenerate, crop each source to its visible pixels, scale it to fit the canvas and paste it centred. Keep the file names and sizes, or update `manifest.ts`, `layout.tsx` and `scripts/verify-metadata.mjs` if they change.
