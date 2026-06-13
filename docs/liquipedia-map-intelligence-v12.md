# Real Map Intelligence v12

## Research table

| Data Point | Available | Source | Quality | Missing |
| --- | --- | --- | --- | --- |
| Последние карты команды | Partially | Liquipedia/HLTV manual snapshot in provider | Snapshot | Live sync, complete recent match history |
| Результаты по картам | Partially | Curated map result snapshot | Snapshot | Full official result feed |
| История карт команды | Partially | `getTeamMapStats()` snapshot rows | Snapshot | Long-term history and date-by-date audit |
| Map pool | Partially | `getNormalizedMapPool()` from snapshot stats | Snapshot/Partial | Veto frequency, opponent-adjusted map pool |
| Частота появления карты | Limited | Sample size from map stats | Snapshot | Real veto/pick/ban sequence |
| Winrate по карте | Partially | Snapshot wins/losses per team-map | Snapshot/Partial | Full rolling 3-month/6-month splits |
| История карт между командами | Limited | `getHeadToHeadMaps()` snapshot rows | Snapshot | Complete H2H map archive |
| BO1 / BO3 / BO5 контекст | Yes | Existing match format from seed/provider | Real/Snapshot | None for format itself |

## Provider methods added

- `listRecentMapsByTeam()`
- `getTeamMapStats()`
- `getHeadToHeadMaps()`
- `getTournamentMatchMaps()`
- `getNormalizedMapPool()`

These methods are provider-ready but currently use a curated local snapshot. They do not call external APIs and must not be treated as fully real live data.

## Normalized entities added

- `NormalizedMapResult`
- `NormalizedTeamMapStats`
- `NormalizedMapPool`

Each stores source/provenance, `sourceUrl`, quality and sample size through the shared provider metadata.

## Map Edge status

The first Map Edge is now allowed to become `Partial` or `Snapshot` when the provider returns map stats.

It is not allowed to become high-confidence fully real because:

- veto is missing;
- CT/T is missing;
- player stats are missing;
- data is a manual snapshot, not live API output;
- sample size is limited.

## Data quality rule

When veto is missing, Map Edge quality is capped at `80`.

Small sample sizes and missing H2H lower quality through the feature snapshot:

- map winrate diff;
- sample size;
- source URL/provenance;
- map pool;
- veto probability;
- H2H map history.

## Conclusion

Liquipedia + HLTV Snapshot can support a first honest `Partial/Snapshot Map Edge`, but cannot yet support a full production-grade Real Map Edge.

Critical next data:

- real veto;
- complete map pool;
- complete H2H map archive;
- fresh recent matches;
- player stats for Player Edge.
