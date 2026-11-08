#!/usr/bin/env bash
# Previous upstream bootstrap moved to docs/legacy-bootstrap/1-init.original.sh.
# It overwrites package manifests and other existing source files. Never use
# this bootstrap against an existing cumulative Titan Academy codebase.
echo 'STOP: Titan Academy is already built as a cumulative source tree.' >&2
echo 'The original scaffold generator is archived in docs/legacy-bootstrap.' >&2
exit 1
