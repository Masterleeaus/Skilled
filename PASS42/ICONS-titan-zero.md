# PASS42: Titan Zero icon batches inventory

Scope: the three Titan Zero batch zips were extracted to `/home/claude/work/icons/titan-zero/`. The manifest is `curriculum/icons/TITAN-ZERO-ICON-MANIFEST.csv` (98 rows). No images were copied into the repo, nothing under `apps/`, the schema or lesson files was changed, and nothing was committed.

## Counts

| Batch | Source zip | PNG | Other files | Apps | Variant set per app |
|---|---|---|---|---|---|
| 01 Logos | 4bdb6447 | 40 | README.txt, manifest.json | 10 | light/dark x transparent/background |
| 02 Apps | 01b32164 | 40 | README.txt | 10 | light/dark x card/icon crop |
| 03 Command, Web Agent, Meta Cockpit | 3b689d82 | 18 | README.txt | 3 | light/dark x horizontal/app icon/favicon 64 |
| **Total** | | **98** | | **23** | |

All 98 PNGs have valid PNG signatures. No exact duplicate files (MD5).

## Families

- `logo` (40): Batch 01, ten Titan Zero product wordmarks.
- `app` (40): Batch 02, ten applications (leads, teams, resources, builder, doctor, crm, business_modules, reviews, go, hub).
- `command` (6), `web-agent` (6), `meta-cockpit` (6): Batch 03.

## Variant gaps

None. Every application has both light and dark files for every asset type, so there are no missing pairs.

What is missing is a kind of asset rather than a variant: Batch 02 and Batch 03 have no transparent masters and no SVG. Batch 01 has transparent PNGs but no vectors.

## Problems

1. **Batch 01 dark transparent files (10) are not safe on dark UI.** Every one stores matte RGB 235,239,248 under fully transparent pixels, and 13 to 23 percent of pixels are semi-transparent edge pixels. The light transparent files use a clean black matte. Use the `*_dark_background.png` files, or re-export the dark transparent files.
2. **Batch 01 originals are missing.** The readme says the light transparent files are the exact supplied originals, and `manifest.json` names the originals, but the zip does not contain them. That claim is unverified.
3. **Batch 02 icon crops (20) are not clean symbols.** Each one includes the TITAN ZERO caption along the bottom edge and part of the card.
4. **Batch 02 cards (20) are cropped.** Several show a neighbouring card's edge. The wordmark is clipped at the left edge in crm, business_modules and reviews (both light and dark).
5. **Batch 03 app icons (6) and favicons (6) carry a caption.** Each shows `APP ICON (LIGHT)` or `APP ICON (DARK)` at the top. At 64 px the favicons still show it, so they need re-cropping before use.
6. **Batch 03 horizontal lockups clip text.** META COCKPIT runs off the right edge. WEB AGENT sits very close to it.
7. **Teams and Hub look alike.** Both use a pink or magenta people-cluster motif. They are not identical (pixel difference 15.6, against 39.9 for Teams versus Leads). Check both before mapping.
8. **No vertical-specific art.** None of the three batches includes cleaning, pool, garden, aged-care, pet or safety icons. Every file is a TitanZero product mark, so the subject tags in the manifest are proposed from each product's purpose only.
9. **Raster only.** The readmes say these are raster exports or crops from concept boards, not vector masters. Check small print at website scale before production.

## Readme findings

- **Batch 01:** Four variants per logo. The dark variant recolours the dark-neutral text for legibility. Dark backgrounds are #0F1320; pixel check confirms the corners are (15,19,32). Light backgrounds are white.
- **Batch 02:** Each app has a light and a dark card PNG and an icon crop. The files are crops from a newly generated concept board, not independent high-resolution sources. Icon crops keep the source background and may have extra spacing. There are no SVG or transparent masters. Original suite colours and positions are kept.
- **Batch 03:** Eighteen individual exports from one raster design board: a light and dark horizontal logo, app icon and 64x64 favicon for each app. The dark exports keep the dark board background and the app icons keep their source backgrounds. The readme says to review against originals before production.

## Method

- Each zip was extracted to its own empty folder under `/home/claude/work/icons/titan-zero/`.
- Dimensions and file sizes were read from the PNG headers.
- Each image was opened with the Read tool. Batch 01 light backgrounds (10 files) were not viewed one by one; instead each was pixel-checked against its light transparent file composited on white (mean absolute difference 0.03 to 0.05). Batch 01 dark backgrounds were viewed.
- Alpha and matte checks were run on all 20 Batch 01 transparent files.
- Scripts are in `/home/claude/work/icons/scripts/`.

## Appendix: file sizes

| File | Batch | Bytes | Width x height |
|---|---|---|---|
| academy_dark_background.png | Batch_01 | 481480 | 1448 x 1086 |
| academy_dark_transparent.png | Batch_01 | 590339 | 1448 x 1086 |
| academy_light_background.png | Batch_01 | 410738 | 1448 x 1086 |
| academy_light_transparent.png | Batch_01 | 494381 | 1448 x 1086 |
| archives_dark_background.png | Batch_01 | 361186 | 1448 x 1086 |
| archives_dark_transparent.png | Batch_01 | 453163 | 1448 x 1086 |
| archives_light_background.png | Batch_01 | 345576 | 1448 x 1086 |
| archives_light_transparent.png | Batch_01 | 404645 | 1448 x 1086 |
| connect_dark_background.png | Batch_01 | 405888 | 1448 x 1086 |
| connect_dark_transparent.png | Batch_01 | 517010 | 1448 x 1086 |
| connect_light_background.png | Batch_01 | 396547 | 1448 x 1086 |
| connect_light_transparent.png | Batch_01 | 469770 | 1448 x 1086 |
| front_desk_dark_background.png | Batch_01 | 339593 | 1448 x 1086 |
| front_desk_dark_transparent.png | Batch_01 | 443921 | 1448 x 1086 |
| front_desk_light_background.png | Batch_01 | 339130 | 1448 x 1086 |
| front_desk_light_transparent.png | Batch_01 | 410434 | 1448 x 1086 |
| intelligence_dark_background.png | Batch_01 | 482345 | 1448 x 1086 |
| intelligence_dark_transparent.png | Batch_01 | 574334 | 1448 x 1086 |
| intelligence_light_background.png | Batch_01 | 386239 | 1448 x 1086 |
| intelligence_light_transparent.png | Batch_01 | 456395 | 1448 x 1086 |
| operations_dark_background.png | Batch_01 | 420114 | 1448 x 1086 |
| operations_dark_transparent.png | Batch_01 | 526577 | 1448 x 1086 |
| operations_light_background.png | Batch_01 | 393215 | 1448 x 1086 |
| operations_light_transparent.png | Batch_01 | 461945 | 1448 x 1086 |
| pay_dark_background.png | Batch_01 | 373334 | 1448 x 1086 |
| pay_dark_transparent.png | Batch_01 | 457478 | 1448 x 1086 |
| pay_light_background.png | Batch_01 | 326068 | 1448 x 1086 |
| pay_light_transparent.png | Batch_01 | 383591 | 1448 x 1086 |
| portal_dark_background.png | Batch_01 | 412636 | 1448 x 1086 |
| portal_dark_transparent.png | Batch_01 | 509829 | 1448 x 1086 |
| portal_light_background.png | Batch_01 | 368947 | 1448 x 1086 |
| portal_light_transparent.png | Batch_01 | 436866 | 1448 x 1086 |
| quotes_dark_background.png | Batch_01 | 556442 | 1448 x 1086 |
| quotes_dark_transparent.png | Batch_01 | 659768 | 1448 x 1086 |
| quotes_light_background.png | Batch_01 | 428321 | 1448 x 1086 |
| quotes_light_transparent.png | Batch_01 | 506637 | 1448 x 1086 |
| workspace_dark_background.png | Batch_01 | 326430 | 1448 x 1086 |
| workspace_dark_transparent.png | Batch_01 | 394412 | 1448 x 1086 |
| workspace_light_background.png | Batch_01 | 268013 | 1448 x 1086 |
| workspace_light_transparent.png | Batch_01 | 303683 | 1448 x 1086 |
| builder_dark_card.png | Batch_02 | 64147 | 151 x 446 |
| builder_dark_icon_crop.png | Batch_02 | 29653 | 151 x 204 |
| builder_light_card.png | Batch_02 | 52992 | 151 x 466 |
| builder_light_icon_crop.png | Batch_02 | 26572 | 151 x 220 |
| business_modules_dark_card.png | Batch_02 | 70806 | 151 x 446 |
| business_modules_dark_icon_crop.png | Batch_02 | 32180 | 151 x 204 |
| business_modules_light_card.png | Batch_02 | 58696 | 151 x 466 |
| business_modules_light_icon_crop.png | Batch_02 | 27856 | 151 x 220 |
| crm_dark_card.png | Batch_02 | 62970 | 151 x 446 |
| crm_dark_icon_crop.png | Batch_02 | 27507 | 151 x 204 |
| crm_light_card.png | Batch_02 | 50253 | 151 x 466 |
| crm_light_icon_crop.png | Batch_02 | 23265 | 151 x 220 |
| doctor_dark_card.png | Batch_02 | 68611 | 152 x 446 |
| doctor_dark_icon_crop.png | Batch_02 | 32306 | 152 x 204 |
| doctor_light_card.png | Batch_02 | 55172 | 152 x 466 |
| doctor_light_icon_crop.png | Batch_02 | 27919 | 152 x 220 |
| go_dark_card.png | Batch_02 | 63392 | 151 x 446 |
| go_dark_icon_crop.png | Batch_02 | 31879 | 151 x 204 |
| go_light_card.png | Batch_02 | 48933 | 151 x 466 |
| go_light_icon_crop.png | Batch_02 | 25899 | 151 x 220 |
| hub_dark_card.png | Batch_02 | 65967 | 152 x 446 |
| hub_dark_icon_crop.png | Batch_02 | 33270 | 152 x 204 |
| hub_light_card.png | Batch_02 | 51546 | 152 x 466 |
| hub_light_icon_crop.png | Batch_02 | 26415 | 152 x 220 |
| leads_dark_card.png | Batch_02 | 64515 | 151 x 446 |
| leads_dark_icon_crop.png | Batch_02 | 30125 | 151 x 204 |
| leads_light_card.png | Batch_02 | 52616 | 151 x 466 |
| leads_light_icon_crop.png | Batch_02 | 26181 | 151 x 220 |
| resources_dark_card.png | Batch_02 | 64343 | 151 x 446 |
| resources_dark_icon_crop.png | Batch_02 | 28532 | 151 x 204 |
| resources_light_card.png | Batch_02 | 50382 | 151 x 466 |
| resources_light_icon_crop.png | Batch_02 | 23820 | 151 x 220 |
| reviews_dark_card.png | Batch_02 | 68362 | 151 x 446 |
| reviews_dark_icon_crop.png | Batch_02 | 32201 | 151 x 204 |
| reviews_light_card.png | Batch_02 | 53901 | 151 x 466 |
| reviews_light_icon_crop.png | Batch_02 | 26336 | 151 x 220 |
| teams_dark_card.png | Batch_02 | 68299 | 151 x 446 |
| teams_dark_icon_crop.png | Batch_02 | 32785 | 151 x 204 |
| teams_light_card.png | Batch_02 | 52913 | 151 x 466 |
| teams_light_icon_crop.png | Batch_02 | 26126 | 151 x 220 |
| command_dark_app_icon.png | Batch_03 | 28521 | 143 x 147 |
| command_dark_favicon_64.png | Batch_03 | 7123 | 64 x 64 |
| command_dark_horizontal.png | Batch_03 | 146457 | 582 x 253 |
| command_light_app_icon.png | Batch_03 | 23765 | 139 x 146 |
| command_light_favicon_64.png | Batch_03 | 6349 | 64 x 64 |
| command_light_horizontal.png | Batch_03 | 132615 | 582 x 257 |
| meta_cockpit_dark_app_icon.png | Batch_03 | 27596 | 149 x 147 |
| meta_cockpit_dark_favicon_64.png | Batch_03 | 6744 | 64 x 64 |
| meta_cockpit_dark_horizontal.png | Batch_03 | 145775 | 582 x 253 |
| meta_cockpit_light_app_icon.png | Batch_03 | 22860 | 147 x 147 |
| meta_cockpit_light_favicon_64.png | Batch_03 | 5721 | 64 x 64 |
| meta_cockpit_light_horizontal.png | Batch_03 | 130876 | 582 x 257 |
| web_agent_dark_app_icon.png | Batch_03 | 27359 | 142 x 146 |
| web_agent_dark_favicon_64.png | Batch_03 | 7048 | 64 x 64 |
| web_agent_dark_horizontal.png | Batch_03 | 148403 | 585 x 253 |
| web_agent_light_app_icon.png | Batch_03 | 23514 | 141 x 146 |
| web_agent_light_favicon_64.png | Batch_03 | 6180 | 64 x 64 |
| web_agent_light_horizontal.png | Batch_03 | 137706 | 585 x 257 |
