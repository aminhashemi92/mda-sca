#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p sbom
syft "dir:." \
  --source-name northwind-supply-chain-lab \
  --source-version 1.0.0 \
  --select-catalogers "-file" \
  --exclude './sbom/**' \
  --exclude './.git/**' \
  -o cyclonedx-json=sbom/lab.cdx.json \
  -o spdx-json=sbom/lab.spdx.json
echo "wrote sbom/lab.cdx.json and sbom/lab.spdx.json"
