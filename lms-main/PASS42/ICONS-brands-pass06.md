# PASS42 - Brand icon inventory and Pass 06 master archive

Scope: inventory only. Nothing under `apps/`, the schema or the curriculum lesson files was touched. No images were copied into the repo. Nothing was committed to git.

Manifest: `curriculum/icons/BRAND-ICON-MANIFEST.csv` (585 rows: 33 brand images and 552 Pass 06 master files).

Extracted working copies (outside the repo):
- `/home/claude/work/icons/brands/<zip-name>/`
- `/home/claude/work/icons/pass06/Titan_Zero_Master_23_Apps_Pass_06/vector_masters/`

## 1. Counts per source

| Source | Files | Breakdown | Notes |
|---|---|---|---|
| 04168878-CleanSm_art_Individual_Logos.zip | 10 PNG | 5 designs x light/dark | Clean Smart brand |
| 51a0018a-Titan_Architect_Branding_Individual_Logos.zip | 10 PNG + README.txt | 9 logo/icon images + 1 brand board | Titan Architect brand |
| 65a24fac-WorkforceZ_one_Individual_Logos.zip | 11 PNG + 2 ICO | 11 PNG, 2 ICO (dark, light favicon) | WorkforceZone brand |
| Titan_Zero_23_App_MASTER_Pass_06.zip | 552 vector masters + README + manifest | 414 PNG, 92 SVG, 46 ICO | 23 Titan Zero apps |

Brand image total: 33. Manifest rows: 585.

Brand image kinds: 2 app-icon (CleanSmart), 2 app-icon (WorkforceZone), 3 app-icon (Titan Architect), 4 favicon (WorkforceZone, 2 PNG + 2 ICO), 2 favicon (CleanSmart), 6 logo (Titan Architect), 6 logo (CleanSmart), 7 logo (WorkforceZone), 1 other (Titan Architect brand board). Plus 2 `both` variants, which are transparent and work on either background.

## 2. Brands found

1. **CleanSmart (CleanSm.art)** - cleaning. Water-drop flame glyph with a sparkle. Ten opaque RGB files with the navy (dark) or white (light) background baked in.
2. **Titan Architect** - business and trades. Red, charcoal and grey "A" symbol. Ten raster PNG files, transparent except the app icons' tiles. The brand board lists the palette: Titan Red #E71929, Charcoal #0F1115, Graphite #1F242B, Slate #6B7280, Light #F8FAFC, Titan Blue #0EA5E9. The board says it is "Part of the Titan Zero ecosystem."
3. **WorkforceZone (WorkforceZ.one)** - AI workforce. Three-figure W mark in blue, purple and orange. Eleven PNG and two multi-size ICO files.

## 3. What Pass 06 contains

Pass 06 is almost entirely the current `vector_masters` set: 23 Titan Zero app folders, each with light and dark themes and 12 files (PNG at 16, 32, 48, 64, 180, 192, 256 and 512 px; a 1300x300 horizontal PNG; a multi-size ICO; and icon and horizontal SVG masters). The other content is five nested historical ZIPs under `original_logo_batches/`, plus README.txt and manifest_pass6.csv.

Nested archives were not extracted (the brief limited extraction to icon, image, readme and manifest files). Three of them (Batch 01, 02 and 03) match the standalone uploads in size; I did not hash them. The other two are `Titan_Zero_Pass_05_13_Vector_Logo_Masters.zip` (314 files, 13 apps) and `Titan_Zero_23_App_Consolidated_Icons_Light_Dark_v1.zip` (508 entries, 23 apps). They hold the Pass 05 reconstructions and an older consolidated library. Extract them only if the course mapping needs them.

## 4. Problems

### Brand sets
- **Name mismatch:** `titan_architect_logo_mark.png` is a full lockup with white "Titan" text and a tagline, not a mark. The white text vanishes on a white background.
- **Opaque backgrounds baked in:** all CleanSmart PNGs and all WorkforceZone PNGs are RGB with the navy or white background fixed. They cannot be recoloured or placed on a different background. Only the WorkforceZ ICO files and the `*_original_icon_transparent` file are transparent.
- **CleanSmart favicons and app icons are not square and small:** favicons are 236x211 and 232x212; app icons are 241x217 and 232x221. These need a square canvas before .ico conversion and are too small for app-icon use.
- **CleanSmart lockups are small:** horizontal (364 or 391 px wide), short (333 or 355 px) and 121 px high.
- **Near-duplicate CleanSmart lockups:** horizontal and short lockups look almost the same at this size. Confirm which is canonical.
- **Titan Architect app icon edges:** `titan_architect_a_app_icon.png` shows rough edges and light specks outside the tile when viewed on a dark background. Check at full size.
- **Titan Architect misnamed app icon:** `glossy_charcoal_a_mountain_app_icon.png` is an A symbol, not a mountain.
- **Titan Architect provenance:** its README says the PNGs were "generated in this conversation," and they are raster, not editable vector. The README asks for legibility and transparency checks before deployment.
- **Missing favicons:** Titan Architect has no separate favicon files; they appear only as previews on the brand board.

### Pass 06
- **Duplicate glyphs:** `hub` and `teams` are the same icon. Pixel comparison at 128 px gave zero difference, and the SVG geometry matches once colours are removed. Both appear in light and dark.
- **Shared accent colours:** `workspace` and `intelligence` both use #E71929. That is the same red as the Titan Architect brand (Titan Red). `academy` and `quotes` both use #E6A23C (per the manifest).
- **Reads as a prohibition sign:** the Workspace glyph is a circle with a diagonal slash, which reads as "not allowed."
- **Manifest coverage:** `manifest_pass6.csv` covers only 10 of the 23 apps (the Pass 6 reinterpretations). The other 13 apps (Builder, Business Modules, Command, CRM, Doctor, Go, Hub, Leads, Meta Cockpit, Resources, Reviews, Teams, Web Agent) appear only in the Pass 05 nested archive and in the Pass 06 folders, not in the manifest.
- **Not approved art:** the README and manifest say these are new simplified interpretations, "NOT a literal tracing of approved 3D artwork." Do not present them as approved brand assets.
- **Live text in wordmarks:** all 46 horizontal SVG masters contain live `<text>` (two elements each). They rely on DejaVu Sans or Arial fallback. Convert to outlines before production.
- **Doctor naming:** the "Doctor" app is a generic plus-in-a-box glyph. If the course mapping is health-related, confirm the mapping first.

## 5. What Pass 06 means for the LMS

- Each Pass 06 app has a clear single-glyph identity at 512 px, which suits course cards and category badges. Tag mappings in the manifest are based on the product's function, not the course catalogue.
- The 10 manifest-covered apps are the reinterpretations; the 13 Pass 5 apps are reconstructions. Keep the two groups distinct in any course-to-icon mapping.
- Pass 06 has no course-specific icons. Only Academy (training) and Resources (training) are candidates for LMS-facing mapping. Everything else maps to business, field-service or ai-workforce tags.
- Brand sets (CleanSmart cleaning, WorkforceZone ai-workforce, Titan Architect business/trades) are the only sources for course-specific brand artwork.

## 6. Checks not done

- Favicon sizes 16, 32 and 48 px and the .ico files were not inspected individually. The contact sheets used 512 px icons and 1300x300 horizontal wordmarks.
- SVG masters were checked by header and text search, not rendered one by one.
- Pass 06 descriptions were written per app from the contact sheets. The per-size PNG files inherit the app description.
- The five nested historical ZIPs were not extracted.

## 7. Decisions made (for review)

1. Included all 552 Pass 06 master files in the manifest, not only the 10 manifest-covered apps, so the catalogue is complete.
2. Used the extraction paths under `/home/claude/work/icons/` as `file_path_candidate`. Repo target paths were not chosen, because copying into the repo is out of scope for this pass.
3. Classed the Titan Architect `logo_mark` file as `dark` (its white text fits a dark background), and flagged the name mismatch rather than renaming it.
4. Classed `*_original_icon_transparent` and the `both` board as `both` variants.
5. Put bytes and extra notes in the `notes` column, not in extra columns, to keep the requested column set exact.
6. Tagged Titan Zero apps by product function. Mappings for Doctor, Hub/Teams and Workspace are flagged for review.
