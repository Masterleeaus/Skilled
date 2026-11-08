#!/usr/bin/env python3
"""Offline, dependency-free audit of Skilled Prisma migration chain.
Does not claim to execute PostgreSQL or validate Prisma's generated client.
"""
from pathlib import Path
import collections, json, re, sys
base=Path(__file__).resolve().parents[1] / 'prisma'
migrations=base/'migrations'
folders=sorted(p for p in migrations.iterdir() if p.is_dir() and (p/'migration.sql').is_file())
problems=[]; warnings=[]; created=set(); names=[]
for folder in folders:
    names.append(folder.name)
    sql=(folder/'migration.sql').read_text()
    for table in re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"([^"]+)"',sql,re.I):
        if table in created: problems.append(f'{folder.name}: duplicate CREATE TABLE {table}')
        created.add(table)
    if not sql.strip(): problems.append(f'{folder.name}: empty SQL')
    if 'DROP TABLE' in sql.upper(): warnings.append(f'{folder.name}: destructive DROP TABLE detected')
# Prisma treats each migration directory as a distinct name; identical timestamps
# are legal but ambiguous to operators and make ordering easy to misread.
by_stamp=collections.defaultdict(list)
for name in names: by_stamp[name.split('_')[0]].append(name)
for stamp, group in by_stamp.items():
    if len(group)>1: warnings.append(f'colliding migration timestamp {stamp}: {", ".join(group)}')
# Every foreign-key target table must exist in this chain or be created by the base migration.
for folder in folders:
    sql=(folder/'migration.sql').read_text()
    for table in re.findall(r'REFERENCES\s+"([^"]+)"',sql,re.I):
        if table not in created: problems.append(f'{folder.name}: FK target {table} not created in migration chain')
result={'migration_count':len(folders),'tables_created':len(created),'errors':problems,'warnings':warnings,'migration_names':names}
print(json.dumps(result,indent=2))
sys.exit(1 if problems else 0)
