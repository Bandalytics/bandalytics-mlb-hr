# CFB frozen V1 validation checkpoint — 2026-09-30

Status: RESEARCH ONLY. Production remains disabled. Frozen V1 definitions are unchanged.

## Exact-rule season stability

The corrected audit uses the preregistered key-group semantics: CROSS6 requires 6 to be the only registered key crossed among 3, 6, 7, 10, and 14.

| Season | CROSS6 | Rate | BOOKS3PLUS_CROSS6 | Rate | Evidence class |
|---|---:|---:|---:|---:|---|
| 2021 | 26-24 | 52.0% | 26-24 | 52.0% | discovery/descriptive |
| 2022 | 24-19 | 55.8% | 23-17 | 57.5% | discovery/descriptive |
| 2023 | 28-17 | 62.2% | 26-15 | 63.4% | discovery/descriptive |
| 2024 | 29-17 | 63.0% | 28-17 | 62.2% | discovery/descriptive |
| 2025 | 29-16 | 64.4% | 27-15 | 64.3% | untouched holdout/confirmatory |

2025 Wilson 95% intervals:
- CROSS6: 49.84%–76.78% (n=45)
- BOOKS3PLUS_CROSS6: 49.17%–77.01% (n=42)

The intervals remain wide and include 50%; this is encouraging but not enough for a production claim.

## Anti-leakage interpretation

- 2021–2024 participated in rule discovery, so their stability is descriptive only.
- 2025 remains the untouched historical holdout and the confirmatory historical check.
- 2026 public-source outcomes are not used to retune, select, or loosen V1. The append-only prospective ledger remains the decisive forward lane.
- 2015–2019 closing-only data cannot test exact CROSS6 because compatible opening spread fields are absent; no opening lines are imputed.
- ROI remains forbidden without verified frozen decision prices.
- BOOKS3PLUS_CROSS6 is nested with CROSS6. Its similar historical rate is not grounds for post-hoc screen selection.

## Confidence read

The useful signal is cross-season directional persistence from 2022 through the untouched 2025 holdout, but sample sizes are still modest. The 2021 season was near chance. This argues for continued prospective collection rather than promotion or stake escalation.

## Next research lanes

1. Search only genuinely independent older sources with both opening and recorded spread fields; reject incompatible eras rather than reconstructing them.
2. Keep V2 adjacent-key and market-structure experiments explicitly separate from frozen V1.
3. Continue confidence-interval/chance-baseline reporting without treating discovery p-values as confirmatory.
4. Preserve chronology, provider provenance, and append-only prospective decisions.
