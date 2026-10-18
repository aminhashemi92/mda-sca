# Northwind supply-chain lab

Static fixture for measuring two scanners:

- **MDA** should find packages that were intentionally infected or sabotaged.
- **SCA** should find vulnerable packages.

Both are expected to compare an SBOM, such as Syft output, with databases such as OSV and the GitHub Advisory Database. Service code calls these packages so a scanner that also looks at usage can see the call site.

**Do not install or run this lab.** Details are in `DO-NOT-INSTALL.txt`.

## What is in it

Seven ecosystems live in one monorepo: JavaScript, Python, Java, Go, Ruby, PHP, and Rust.

The ground truth has 92 unique coordinates:

| Detector | Count | Meaning |
| --- | ---: | --- |
| MDA | 17 | Malicious or sabotaged package |
| SCA | 76 | Vulnerable package |

`rest-client@1.6.13` counts for both, because it carries a backdoor and older CVEs. Another 28 packages are in the SBOM and **must not** be reported: a clean version of the same name, a clean parent whose child is the problem, or a module that belongs to this lab. `peacenotwar@9.1.5` is an inner dependency of `node-ipc@9.2.2`, but it had no OSV id when this lab was built. Finding it is extra credit. Missing it is not a false negative.

## Why it is hard to find

- Infection and vulnerabilities usually sit at depth two or three, past the service's direct dependency. The classic chain is `billing-worker` → `@lab/payments-core` → `event-stream@3.3.6` → `flatmap-stream@0.1.1`.
- A manifest sometimes shows a harmless-looking range while the lockfile pins the bad release: `event-stream` `~3.3.4` resolves to `3.3.6`, and `colors` `~1.4.0` resolves to `1.4.1`.
- The same name has a clean or merely vulnerable release in another service. `ua-parser-js@0.7.29` is malware, `1.0.2` is ReDoS only, and `1.0.37` is clean.
- `ua-parser-js@0.7.29` is hidden behind the npm alias `parser-lib`.
- Some npm malware exists only in the build tool's `devDependencies`: `coa`, `rc`, `crossenv`, and `eslint-scope`.
- Clean `cross-env@7.0.3` sits next to the typosquat `crossenv@1.0.1`. `github.com/boltdb-go/bolt` and `rustdecimal` are the same kind of name lookalike.
- Parents such as `mkdirp@0.5.5` and `yargs@15.4.1` are themselves clean and have a vulnerable child.
- In Python, `ultralytics@8.3.41` arrives only through the internal library `lab-vision` and is absent from `requirements.txt`. `urllib3` and `idna` sit under `requests`, and `Werkzeug` and `Jinja2` sit under `Flask`.
- In Java, Log4j, XStream, SnakeYAML, and Jackson live in the `legacy-bridge` module, and Netty lives in `net-edge`. The `web` module directly depends on Spring 5.3.17.
- Lockfiles are curated. Harmless dependencies that are not part of the test were omitted so every third-party package in the SBOM has a defined expected result: report it, or deliberately leave it out.

Each case, its dependency path, the file and line of use, and the OSV ids are in `ground-truth/expected-findings.json`.

## SBOM

The SBOM was produced with Syft 1.54.1 from these manifests. Nothing was installed:

- `sbom/lab.cdx.json`
- `sbom/lab.spdx.json`

Regenerate it with:

```bash
./scripts/refresh_sbom.sh
```

Syft 1.54 drops npm lockfile entries that set `"dev": true`. That flag is absent from `package-lock.json` for this reason, while the same packages remain `devDependencies` in `package.json`. A scanner that reads only the `dependencies` key will miss them.

## Scoring a scanner report

Submit a report in this shape. `detector` is optional and accepts `mda` or `sca`. A `purl` can be used instead of the ecosystem, name, and version triple.

```json
{
  "findings": [
    {"ecosystem": "npm", "name": "lodash", "version": "4.17.15", "detector": "sca"}
  ]
}
```

```bash
python3 scripts/score_report.py report.json
```

The script prints precision, recall, and F1 separately for MDA and SCA. Reporting a `do_not_flag` package is a false positive. The process exits 1 when anything is missed or falsely reported.

Ecosystem names are `npm`, `pypi`, `maven`, `golang`, `gem`, `composer`, and `cargo`. For Python, case and underscores are folded to the canonical name. For Go, the `v` prefix is part of the version.
