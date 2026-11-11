# Placeholder icons and share image

These files are text-only placeholders: the word "Skilled" in the theme foreground colour (`#f5f5f5`) on the dark theme background (`#0a0a0a`), from `:root` in `src/app/globals.css`. They stand in until a real Skilled mark is supplied (owner decision, issue #85).

| File | Size | Used by |
| --- | --- | --- |
| `icon-192-placeholder.png` | 192 x 192 | `src/app/manifest.ts` |
| `icon-512-placeholder.png` | 512 x 512 | `src/app/manifest.ts` |
| `og-image-placeholder.png` | 1200 x 630 | `src/app/layout.tsx` (Open Graph and Twitter image) |

To replace them, keep the same file names and sizes, or update the paths in `manifest.ts` and `layout.tsx` and the verifier in `scripts/verify-metadata.mjs` if the names change.
