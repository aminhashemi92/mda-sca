#!/usr/bin/env python3
"""Score an MDA/SCA report against the lab answer key.

Report format:

{
  "findings": [
    {"ecosystem": "npm", "name": "lodash", "version": "4.17.15", "detector": "sca"}
  ]
}

`detector` may be "mda", "sca", or omitted. An omitted detector counts for every
detector that expects the package. Packages in `do_not_flag` are false positives.
`supplemental` hits are listed apart from the score.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TRUTH = ROOT / "ground-truth" / "expected-findings.json"

ECOSYSTEM_ALIASES = {
    "npm": "npm",
    "javascript": "npm",
    "node": "npm",
    "pypi": "pypi",
    "python": "pypi",
    "pip": "pypi",
    "maven": "maven",
    "java": "maven",
    "golang": "golang",
    "go": "golang",
    "gem": "gem",
    "rubygems": "gem",
    "ruby": "gem",
    "composer": "composer",
    "packagist": "composer",
    "php": "composer",
    "cargo": "cargo",
    "crates.io": "cargo",
    "rust": "cargo",
}


def ecosystem(value: str) -> str:
    key = (value or "").strip().lower()
    if key not in ECOSYSTEM_ALIASES:
        raise SystemExit(f"unknown ecosystem: {value}")
    return ECOSYSTEM_ALIASES[key]


def name_key(eco: str, name: str) -> str:
    text = urllib.parse.unquote(name or "").strip()
    if eco == "pypi":
        return text.lower().replace("_", "-")
    return text


def identity(eco: str, name: str, version: str) -> tuple[str, str, str]:
    return (ecosystem(eco), name_key(eco, name), urllib.parse.unquote(version or ""))


def identity_from_purl(purl: str) -> tuple[str, str, str]:
    body = urllib.parse.unquote(purl)[4:]
    coordinate, _, version = body.partition("@")
    eco, _, name = coordinate.partition("/")
    if eco == "maven" and name.count("/") == 1:
        group, artifact = name.split("/", 1)
        name = f"{group}:{artifact}"
    return identity(eco, name, version)


def row_identity(row: dict) -> tuple[str, str, str]:
    if row.get("purl"):
        return identity_from_purl(row["purl"])
    return identity(row["ecosystem"], row["name"], row["version"])


def index_rows(rows: list[dict]) -> dict[tuple[str, str, str], dict]:
    return {row_identity(row): row for row in rows}


def load_report(path: Path) -> list[dict]:
    document = json.loads(path.read_text())
    if isinstance(document, list):
        return document
    findings = document.get("findings")
    if not isinstance(findings, list):
        raise SystemExit("report must be a list or an object with a findings list")
    return findings


def detector_of(row: dict) -> str | None:
    value = row.get("detector")
    if value in (None, ""):
        return None
    value = str(value).lower()
    if value not in {"mda", "sca"}:
        raise SystemExit(f"detector must be mda or sca, got {value}")
    return value


def metric(tp: int, fp: int, fn: int) -> dict:
    precision = tp / (tp + fp) if tp + fp else 1.0
    recall = tp / (tp + fn) if tp + fn else 1.0
    if precision + recall == 0:
        f1 = 0.0
    else:
        f1 = 2 * precision * recall / (precision + recall)
    return {
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Score a scanner report against the lab ground truth")
    parser.add_argument("report", type=Path)
    parser.add_argument("--truth", type=Path, default=DEFAULT_TRUTH)
    args = parser.parse_args()

    truth = json.loads(args.truth.read_text())
    expected = index_rows(truth["findings"])
    quiet = index_rows(truth["do_not_flag"])
    supplemental = index_rows(truth["supplemental"])

    hits = {"mda": set(), "sca": set()}
    false_positives = []
    supplemental_hits = []
    seen = set()

    for row in load_report(args.report):
        key = row_identity(row)
        if key in seen:
            continue
        seen.add(key)
        channel = detector_of(row)
        if key in expected:
            # Finding the package satisfies every detector that expects it.
            # A mismatched tag is not a false positive.
            for name in expected[key]["detectors"]:
                hits[name].add(key)
        elif key in supplemental:
            supplemental_hits.append(f"{key[0]}:{key[1]}@{key[2]}")
        else:
            reason = quiet[key]["reason"] if key in quiet else "not in the lab answer key"
            false_positives.append(
                {
                    "ecosystem": key[0],
                    "name": key[1],
                    "version": key[2],
                    "detector": channel,
                    "reason": reason,
                }
            )

    missed = {}
    by_detector = {}
    for channel in ("mda", "sca"):
        wanted = {key for key, row in expected.items() if channel in row["detectors"]}
        found = hits[channel] & wanted
        missing = sorted(wanted - found)
        missed[channel] = [
            f"{expected[key]['id']} {expected[key]['purl']}" for key in missing
        ]
        channel_fp = [
            item for item in false_positives
            if item["detector"] in (None, channel)
        ]
        by_detector[channel] = metric(len(found), len(channel_fp), len(missing))

    unique_tp = set().union(*hits.values())
    unique_fn = set()
    for channel in ("mda", "sca"):
        wanted = {key for key, row in expected.items() if channel in row["detectors"]}
        unique_fn |= wanted - hits[channel]
    result = {
        "combined": metric(len(unique_tp), len(false_positives), len(unique_fn)),
        "by_detector": by_detector,
        "false_positives": false_positives,
        "missed": missed,
        "supplemental_hits": supplemental_hits,
    }
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    if false_positives or unique_fn:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
