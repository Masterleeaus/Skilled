#!/usr/bin/env bash
# The original setup ran unpinned pnpm add commands and changed the lockfile.
echo 'STOP: the original installer changes locked dependency versions.' >&2
echo 'Use pnpm install --frozen-lockfile after auditing the repository.' >&2
echo 'Original script preserved at docs/legacy-bootstrap/2-setup.original.sh.' >&2
exit 1
