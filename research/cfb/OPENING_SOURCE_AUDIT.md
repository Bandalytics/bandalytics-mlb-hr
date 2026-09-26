# Opening-line source audit — 2026-09-26

Research-only source review. No production rule changes.

## Newly identified independent opener archive

The public `koltbern15/Sports-Betting` project documents an opening-lines table assembled from two independent historical sources:

- SBR: 3,476 rows across 2007–2021.
- AUS (aussportsbetting): 5,144 rows across 2006–2024.
- 2,183 overlapping games in 2013–2021: 61% of spread openers agree within 0.5 points and 75% within 1.0; totals agree 66% within 0.5 and 82% within 1.0.
- The project's audit reports mean open→close spread movement +0.12 points with 1.72-point standard deviation; total movement standard deviation ~1.8 after removing one documented corrupt SBR total.
- AUS is treated there as canonical for 2013+ and includes opening moneylines.

This is useful as a **source-validation lead**, not yet BANDALYTICS evidence. The repo does not commit the historical opening-line database, so its published counts cannot be replayed directly from GitHub.

## Consequence for our discovery design

The next data acquisition target should be **AUS 2021–2024 openers joined to an independently recorded final/closing line and game result**. This is preferable to treating CFBD `spreadOpen` as unquestioned ground truth because the independent-source overlap demonstrates that an "opener" is source/timestamp dependent by roughly 0.5–1.5 points in a material fraction of games.

Therefore:
1. Preserve provider/source identity on every opener.
2. Never collapse disagreeing openers before measuring source disagreement.
3. Add an opener-agreement sensitivity split (<=0.5, <=1.0, >1.0 points) when two sources exist.
4. Key-number crossing must be calculated per source first, then consensus separately.
5. 2025 remains holdout and 2026 prospective.
6. Historical public ticket percentages remain NULL.

No ROI is computed without verified frozen price/juice.

## Current blocker status

There is **no rule/permission blocker**. There is a data-availability constraint: the independent archive's underlying CFB opener rows are not committed publicly. Continue seeking a reproducible public export or credentialed CFBD/AUS ingestion rather than scraping or inferring rows.
