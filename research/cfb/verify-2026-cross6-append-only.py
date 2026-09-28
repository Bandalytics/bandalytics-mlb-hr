#!/usr/bin/env python3
import json, sys

if len(sys.argv) != 3:
    raise SystemExit("usage: verify-2026-cross6-append-only.py PREVIOUS CURRENT")

previous=json.load(open(sys.argv[1]))
current=json.load(open(sys.argv[2]))

for doc,label in ((previous,"previous"),(current,"current")):
    if doc.get("protocol") != "CFB_2026_CROSS6_PROSPECTIVE_V1":
        raise SystemExit(f"{label}: unexpected protocol")
    if doc.get("research_only") is not True or doc.get("production_enabled") is not False:
        raise SystemExit(f"{label}: unsafe state")

old={r["game_id"]:r for r in previous.get("qualifying_events",[])}
new={r["game_id"]:r for r in current.get("qualifying_events",[])}

missing=sorted(set(old)-set(new))
if missing:
    raise SystemExit(f"previously frozen events disappeared: {missing}")

# Once a game has entered the frozen post-kickoff ledger, every decision-time
# field is immutable. The only permitted mutation is result: null -> W/L/P.
decision_fields=(
    "home_team","away_team","kickoff_utc","signal_snapshot_utc",
    "open_home_spread","snapshot_home_spread","spread_move","book_count",
    "key_group","signal_side","books3plus",
)
for game_id,old_row in old.items():
    new_row=new[game_id]
    for field in decision_fields:
        if old_row.get(field) != new_row.get(field):
            raise SystemExit(
                f"frozen event {game_id} changed {field}: "
                f"{old_row.get(field)!r} -> {new_row.get(field)!r}"
            )
    old_result=old_row.get("result")
    new_result=new_row.get("result")
    if old_result in ("W","L","P") and new_result != old_result:
        raise SystemExit(
            f"settled result changed for {game_id}: {old_result!r} -> {new_result!r}"
        )
    if old_result is None and new_result not in (None,"W","L","P"):
        raise SystemExit(f"invalid settlement transition for {game_id}: {new_result!r}")

print(json.dumps({
    "append_only_integrity":"PASS",
    "previous_frozen_events":len(old),
    "current_frozen_events":len(new),
    "new_frozen_events":len(set(new)-set(old)),
},sort_keys=True))
