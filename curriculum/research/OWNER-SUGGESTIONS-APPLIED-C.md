# Owner suggestions applied (C), 2026-11-03

Owner decisions 15 and 16 in curriculum/research/OWNER-DECISIONS.md. Task 1: high-risk DRAFT lessons set to READY. Task 2: copies re-synced from current sources. Nothing committed.

## Counts

- Task 1: lesson files changed DRAFT to READY: 84 (courses/high-risk). reviewStatus unchanged (NOT REVIEWED). Other high-risk files already READY: 7 module files (HR01 to HR07), not changed.
- Task 1 by topic: biohazard-trauma-cleaning 12, crime-scene-cleaning 12, drug-contamination-remediation 12, fire-smoke-restoration 12, flood-water-restoration 12, hoarding-squalor 12, mould-remediation 12.
- Task 2: copies rewritten by rebuild script: 727 (511 converted, 216 ready). Copies whose bytes changed: 90 (75 converted, 15 ready).
- Task 2: sources read: 1016 (was 932 at the last rebuild; 84 high-risk lessons and other recent files added since). Sources without a converted copy: 505 (not created). Sources without a ready copy: 800 (not created).
- Task 2 copies with out-of-step fields before the rebuild: converted 75, ready 15.
- Task 2 F06-L04: changed in both copy folders.

## Verification

- Changed files parsed as JSON: 84 of 84 source files, 90 of 90 copy files.
- verify-lesson-copies.py: 511 converted and 216 ready copies checked, 0 problems. Source set sha256 9cde26ad3890ed2db00794792b6ab5b8ed8fd4280a7938f93e95ad997a230f3c.
- check.py: 1016 lessons scanned, 0 failing lessons, problemCount 0.

## Decisions made

1. Scope of task 1: applied READY to all 84 DRAFT lessons in courses/high-risk (12 for each of the seven topics, including the 36 from part 1), because the owner asked for every DRAFT lesson in that folder.
2. No copy changes for task 1: none of the 84 lessons has a converted or ready copy, so the status change needed no copy edit.
3. Task 2 rewrote every existing copy from its source, not only the stale ones. 637 of the 727 came out byte-identical; the other 90 changed.
4. Copy files were backed up before the rebuild to /home/claude/work/copies-backup-C-20261103/ (converted, ready, copy-diff.txt, status-changed-files.txt).

## Changed source files (task 1, status only)

- courses/high-risk/biohazard-trauma-cleaning-L01.json
- courses/high-risk/biohazard-trauma-cleaning-L02.json
- courses/high-risk/biohazard-trauma-cleaning-L03.json
- courses/high-risk/biohazard-trauma-cleaning-L04.json
- courses/high-risk/biohazard-trauma-cleaning-L05.json
- courses/high-risk/biohazard-trauma-cleaning-L06.json
- courses/high-risk/biohazard-trauma-cleaning-L07.json
- courses/high-risk/biohazard-trauma-cleaning-L08.json
- courses/high-risk/biohazard-trauma-cleaning-L09.json
- courses/high-risk/biohazard-trauma-cleaning-L10.json
- courses/high-risk/biohazard-trauma-cleaning-L11.json
- courses/high-risk/biohazard-trauma-cleaning-L12.json
- courses/high-risk/crime-scene-cleaning-L01.json
- courses/high-risk/crime-scene-cleaning-L02.json
- courses/high-risk/crime-scene-cleaning-L03.json
- courses/high-risk/crime-scene-cleaning-L04.json
- courses/high-risk/crime-scene-cleaning-L05.json
- courses/high-risk/crime-scene-cleaning-L06.json
- courses/high-risk/crime-scene-cleaning-L07.json
- courses/high-risk/crime-scene-cleaning-L08.json
- courses/high-risk/crime-scene-cleaning-L09.json
- courses/high-risk/crime-scene-cleaning-L10.json
- courses/high-risk/crime-scene-cleaning-L11.json
- courses/high-risk/crime-scene-cleaning-L12.json
- courses/high-risk/drug-contamination-remediation-L01.json
- courses/high-risk/drug-contamination-remediation-L02.json
- courses/high-risk/drug-contamination-remediation-L03.json
- courses/high-risk/drug-contamination-remediation-L04.json
- courses/high-risk/drug-contamination-remediation-L05.json
- courses/high-risk/drug-contamination-remediation-L06.json
- courses/high-risk/drug-contamination-remediation-L07.json
- courses/high-risk/drug-contamination-remediation-L08.json
- courses/high-risk/drug-contamination-remediation-L09.json
- courses/high-risk/drug-contamination-remediation-L10.json
- courses/high-risk/drug-contamination-remediation-L11.json
- courses/high-risk/drug-contamination-remediation-L12.json
- courses/high-risk/fire-smoke-restoration-L01.json
- courses/high-risk/fire-smoke-restoration-L02.json
- courses/high-risk/fire-smoke-restoration-L03.json
- courses/high-risk/fire-smoke-restoration-L04.json
- courses/high-risk/fire-smoke-restoration-L05.json
- courses/high-risk/fire-smoke-restoration-L06.json
- courses/high-risk/fire-smoke-restoration-L07.json
- courses/high-risk/fire-smoke-restoration-L08.json
- courses/high-risk/fire-smoke-restoration-L09.json
- courses/high-risk/fire-smoke-restoration-L10.json
- courses/high-risk/fire-smoke-restoration-L11.json
- courses/high-risk/fire-smoke-restoration-L12.json
- courses/high-risk/flood-water-restoration-L01.json
- courses/high-risk/flood-water-restoration-L02.json
- courses/high-risk/flood-water-restoration-L03.json
- courses/high-risk/flood-water-restoration-L04.json
- courses/high-risk/flood-water-restoration-L05.json
- courses/high-risk/flood-water-restoration-L06.json
- courses/high-risk/flood-water-restoration-L07.json
- courses/high-risk/flood-water-restoration-L08.json
- courses/high-risk/flood-water-restoration-L09.json
- courses/high-risk/flood-water-restoration-L10.json
- courses/high-risk/flood-water-restoration-L11.json
- courses/high-risk/flood-water-restoration-L12.json
- courses/high-risk/hoarding-squalor-L01.json
- courses/high-risk/hoarding-squalor-L02.json
- courses/high-risk/hoarding-squalor-L03.json
- courses/high-risk/hoarding-squalor-L04.json
- courses/high-risk/hoarding-squalor-L05.json
- courses/high-risk/hoarding-squalor-L06.json
- courses/high-risk/hoarding-squalor-L07.json
- courses/high-risk/hoarding-squalor-L08.json
- courses/high-risk/hoarding-squalor-L09.json
- courses/high-risk/hoarding-squalor-L10.json
- courses/high-risk/hoarding-squalor-L11.json
- courses/high-risk/hoarding-squalor-L12.json
- courses/high-risk/mould-remediation-L01.json
- courses/high-risk/mould-remediation-L02.json
- courses/high-risk/mould-remediation-L03.json
- courses/high-risk/mould-remediation-L04.json
- courses/high-risk/mould-remediation-L05.json
- courses/high-risk/mould-remediation-L06.json
- courses/high-risk/mould-remediation-L07.json
- courses/high-risk/mould-remediation-L08.json
- courses/high-risk/mould-remediation-L09.json
- courses/high-risk/mould-remediation-L10.json
- courses/high-risk/mould-remediation-L11.json
- courses/high-risk/mould-remediation-L12.json

## Changed copy files (task 2)

### lessons/converted

- lessons/converted/C05-L02.json
- lessons/converted/C05-L03.json
- lessons/converted/C07-L03.json
- lessons/converted/F06-L04.json
- lessons/converted/HR07-hoarding-squalor.json
- lessons/converted/NEW-IRR-01.json
- lessons/converted/NEW-IRR-02.json
- lessons/converted/NEW-IRR-03.json
- lessons/converted/NEW-IRR-04.json
- lessons/converted/NEW-LAW-01.json
- lessons/converted/NEW-LAW-02.json
- lessons/converted/NEW-LAW-03.json
- lessons/converted/NEW-LAW-04.json
- lessons/converted/NEW-LCK-01.json
- lessons/converted/NEW-LCK-02.json
- lessons/converted/NEW-LCK-03.json
- lessons/converted/NEW-LCK-04.json
- lessons/converted/NEW-LSC-01.json
- lessons/converted/NEW-LSC-02.json
- lessons/converted/NEW-LSC-03.json
- lessons/converted/NEW-LSC-04.json
- lessons/converted/NEW-MAS-01.json
- lessons/converted/NEW-MAS-02.json
- lessons/converted/NEW-MAS-03.json
- lessons/converted/NEW-MAS-05.json
- lessons/converted/NEW-PCC-01.json
- lessons/converted/NEW-PCC-02.json
- lessons/converted/NEW-PLS-01.json
- lessons/converted/NEW-PLS-02.json
- lessons/converted/NEW-PLS-03.json
- lessons/converted/NEW-PLS-04.json
- lessons/converted/NEW-PNT-01.json
- lessons/converted/NEW-PNT-02.json
- lessons/converted/NEW-PNT-03.json
- lessons/converted/NEW-PNT-04.json
- lessons/converted/NEW-PNT-05.json
- lessons/converted/NEW-POND-01.json
- lessons/converted/NEW-POND-02.json
- lessons/converted/NEW-POND-03.json
- lessons/converted/NEW-SIT-01.json
- lessons/converted/NEW-SIT-02.json
- lessons/converted/NEW-SIT-03.json
- lessons/converted/NEW-SIT-04.json
- lessons/converted/NEW-SIT-05.json
- lessons/converted/S12-L08.json
- lessons/converted/aquarium-cleaning-L07.json
- lessons/converted/aquarium-cleaning-L11.json
- lessons/converted/handyman-work-L01.json
- lessons/converted/medical-equipment-cleaning-L01.json
- lessons/converted/medical-equipment-cleaning-L02.json
- lessons/converted/medical-equipment-cleaning-L03.json
- lessons/converted/medical-equipment-cleaning-L04.json
- lessons/converted/medical-equipment-cleaning-L06.json
- lessons/converted/medical-equipment-cleaning-L07.json
- lessons/converted/medical-equipment-cleaning-L08.json
- lessons/converted/medical-equipment-cleaning-L09.json
- lessons/converted/medical-equipment-cleaning-L10.json
- lessons/converted/medical-equipment-cleaning-L11.json
- lessons/converted/medical-equipment-cleaning-L12.json
- lessons/converted/pond-cleaning-L03.json
- lessons/converted/pond-cleaning-L04.json
- lessons/converted/pond-cleaning-L07.json
- lessons/converted/pond-cleaning-L10.json
- lessons/converted/pond-cleaning-L11.json
- lessons/converted/pool-cleaning-L01.json
- lessons/converted/pool-cleaning-L02.json
- lessons/converted/pool-cleaning-L03.json
- lessons/converted/pool-cleaning-L04.json
- lessons/converted/pool-cleaning-L06.json
- lessons/converted/pool-cleaning-L07.json
- lessons/converted/pool-cleaning-L08.json
- lessons/converted/pool-cleaning-L09.json
- lessons/converted/pool-cleaning-L10.json
- lessons/converted/pool-cleaning-L11.json
- lessons/converted/pool-cleaning-L12.json

### lessons/ready

- lessons/ready/C05-L02.json
- lessons/ready/C05-L03.json
- lessons/ready/C07-L03.json
- lessons/ready/F06-L04.json
- lessons/ready/S12-L08.json
- lessons/ready/medical-equipment-cleaning-L02.json
- lessons/ready/medical-equipment-cleaning-L03.json
- lessons/ready/medical-equipment-cleaning-L06.json
- lessons/ready/medical-equipment-cleaning-L09.json
- lessons/ready/medical-equipment-cleaning-L11.json
- lessons/ready/medical-equipment-cleaning-L12.json
- lessons/ready/pool-cleaning-L01.json
- lessons/ready/pool-cleaning-L08.json
- lessons/ready/pool-cleaning-L09.json
- lessons/ready/pool-cleaning-L12.json
