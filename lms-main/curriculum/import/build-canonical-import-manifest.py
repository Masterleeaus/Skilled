#!/usr/bin/env python3
"""Build the re-runnable import manifest for the normalised Academy lessons (ACA-009).

Run:  python3 -I curriculum/import/build-canonical-import-manifest.py
Output: curriculum/import/canonical-import-manifest.json

The manifest is deterministic: no timestamps, entries sorted by sourceId, so a second run
produces a byte-identical file. Each sourceId appears once. An importer that consumes this
manifest must UPSERT on sourceId and must not overwrite rows whose contentStatus is no longer
BRIEF (the rule documented in TITAN-ACADEMY-CURRICULUM-IMPORT.md). This script does not touch
the database.
"""
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CUR = os.path.dirname(HERE)
INDEX = os.path.join(CUR, 'lesson-normalization-index.json')
OUT = os.path.join(HERE, 'canonical-import-manifest.json')


def sha256_file(path):
    with open(path, 'rb') as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def locate(filename):
    """Return the canonical lesson file (shared/ or courses/) for a source file name, sorted walk."""
    hits = []
    for root in ('shared', 'courses'):
        base = os.path.join(CUR, root)
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames.sort()
            if filename in sorted(filenames):
                hits.append(os.path.join(dirpath, filename))
    if len(hits) != 1:
        raise SystemExit('expected one canonical file for %s, found %d' % (filename, len(hits)))
    return hits[0]


def main():
    with open(INDEX, encoding='utf-8') as fh:
        lessons = json.load(fh)['lessons']

    entries = []
    for rec in lessons:
        canon = locate(rec['sourceFile'])
        with open(canon, encoding='utf-8') as fh:
            doc = json.load(fh)
        ready = os.path.join(CUR, 'lessons', 'ready', rec['sourceFile'])
        entries.append({
            'sourceId': doc['id'],
            'title': doc['title'],
            'layer': doc.get('layer'),
            'lessonType': doc.get('lessonType'),
            'courseSlugs': doc.get('courseSlugs', []),
            'moduleTitle': doc.get('moduleTitle'),
            'status': doc.get('status'),
            'reviewStatus': doc.get('reviewStatus'),
            'importAction': 'UPSERT',
            'conflictKey': 'sourceId',
            'contentStatusOnInsert': 'BRIEF',
            'canonicalFile': os.path.relpath(canon, CUR),
            'canonicalSha256': sha256_file(canon),
            'readySourceFile': os.path.relpath(ready, CUR),
            'readySourceSha256': sha256_file(ready),
        })

    entries.sort(key=lambda e: e['sourceId'])
    ids = [e['sourceId'] for e in entries]
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        raise SystemExit('duplicate sourceId values: %s' % dupes)

    manifest = {
        'manifestVersion': 'pass42-1',
        'scope': 'normalised lesson drafts listed in curriculum/lesson-normalization-index.json',
        'targetTable': 'academy_content_lessons',
        'upsertRule': 'UPSERT on sourceId; never overwrite a row whose contentStatus is not BRIEF; keep prior revision',
        'lessonCount': len(entries),
        'uniqueSourceIds': len(set(ids)),
        'duplicateSourceIds': 0,
        'databaseWritten': False,
        'entries': entries,
    }
    text = json.dumps(manifest, indent=2, ensure_ascii=False) + '\n'
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write(text)
    print(json.dumps({'lessonCount': len(entries), 'uniqueSourceIds': len(set(ids)),
                      'manifest': os.path.relpath(OUT, CUR), 'sha256': hashlib.sha256(text.encode('utf-8')).hexdigest()}))


if __name__ == '__main__':
    sys.exit(main())
