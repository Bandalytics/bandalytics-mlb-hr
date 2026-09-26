# Legacy closing-line baseline — 2015–2019

Research-only sanity baseline from the public jackschooley/cfb-betting cleaned odds files. Source cleaner.py confirms `spread` is normalized as the away-team spread; the adapter flips sign to home spread.

This lane contains closing-line snapshots only. It cannot test open-to-close movement, RLM, resistance, steam, cross-book confirmation, or historical public ticket percentages.

## Raw aggregate counts

| Season | Games | Home ATS W-L-P | Home ATS % excl push | Over W-L-P | Over % excl push |
|---|---:|---:|---:|---:|---:|
| 2015 | 747 | 346-382-19 | 47.53% | 352-382-13 | 47.96% |
| 2016 | 724 | 348-351-25 | 49.79% | 341-360-23 | 48.64% |
| 2017 | 722 | 338-364-20 | 48.15% | 331-373-18 | 47.02% |
| 2018 | 776 | 369-392-15 | 48.49% | 370-393-13 | 48.49% |
| 2019 | 714 | 346-353-15 | 49.50% | 345-358-11 | 49.08% |
| **Total** | **3,683** | **1,747-1,842-94** | **48.68%** | **1,739-1,866-78** | **48.24%** |

Home-side ATS by closing role: favorite 1,066-1,101-53 (49.19% excl pushes); dog 667-721-41 (48.05%); pick'em 14-20-0 (41.18%, n=34).

Closing spread near key numbers (absolute line within 0.5), reporting the home side only:
- 3: 232-247-26 (48.43%)
- 6: 136-157-2 (46.42%)
- 7: 193-232-14 (45.41%)
- 10: 111-132-8 (45.68%)
- 14: 96-116-6 (45.28%)

## Interpretation

This is a control, not a betting strategy. The broad closing-line home/over baselines sit below 50% in this archive, and the key-number splits are descriptive only because no selection rule was applied. They must not be promoted into production rules.

The useful result is methodological: the adapter orientation is now independently verified against the source cleaner, and a 3,683-game raw-count control exists. The next justified step remains a source with both opening and recorded final provider lines so movement direction/magnitude and provider agreement can be tested. Public-ticket hypotheses remain quarantined until verified ticket data exists.
