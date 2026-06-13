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

## Feature layer added

- `buildTeamMapProfile()`
- `buildMapFeatureSnapshots()`
- `MapPoolEntry`
- `TeamMapProfile`
- `MapFeatureSnapshot`

The feature layer now answers the core v12 questions for each team:

- which maps the team plays most often;
- which maps are strongest by winrate and sample size;
- which maps are weakest by winrate and sample size;
- how many maps were played per map;
- recent results per map from the Liquipedia snapshot;
- source, freshness, sample size and data quality per map.

## Team coverage check

| Team | Map history | Map pool | Winrate | Maps found | Total sample | Strongest maps | Weakest maps | Avg quality |
| --- | --- | --- | --- | ---: | ---: | --- | --- | ---: |
| NAVI | Yes | Yes | Yes | 5 | 52 | Mirage 67%, Inferno 60%, Ancient 58% | Anubis 43%, Nuke 45%, Ancient 58% | 65 |
| Team Spirit | Yes | Yes | Yes | 5 | 50 | Ancient 75%, Mirage 64%, Anubis 57% | Nuke 55%, Dust2 56%, Anubis 57% | 65 |
| Vitality | Yes | Yes | Yes | 5 | 53 | Inferno 77%, Mirage 73%, Anubis 67% | Dust2 56%, Nuke 64%, Anubis 67% | 67 |
| MOUZ | Yes | Yes | Yes | 5 | 53 | Nuke 67%, Ancient 64%, Mirage 50% | Vertigo 44%, Inferno 45%, Mirage 50% | 66 |
| FaZe Clan | Yes | Yes | Yes | 5 | 54 | Inferno 58%, Dust2 56%, Mirage 50% | Nuke 42%, Ancient 44%, Mirage 50% | 68 |
| G2 | Yes | Yes | Yes | 5 | 55 | Mirage 67%, Inferno 58%, Ancient 55% | Nuke 40%, Anubis 50%, Ancient 55% | 67 |
| Team Falcons | Yes | Yes | Yes | 5 | 54 | Nuke 67%, Ancient 58%, Mirage 55% | Dust2 44%, Inferno 50%, Mirage 55% | 67 |
| TYLOO | Yes | Yes | Yes | 5 | 50 | Dust2 64%, Inferno 55%, Ancient 50% | Nuke 38%, Mirage 40%, Ancient 50% | 65 |
| 9z | Yes | Yes | Yes | 5 | 49 | Dust2 60%, Mirage 50%, Ancient 45% | Nuke 38%, Inferno 40%, Ancient 45% | 65 |

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
- recent map form;
- per-map data quality score;
- source URL/provenance;
- map pool;
- veto probability;
- H2H map history.

Per-map quality currently uses:

- source/provider URL;
- sample size;
- snapshot freshness;
- basic completeness;
- a penalty for missing veto.

Example:

| Map | Winrate | Matches | Source | Quality |
| --- | ---: | ---: | --- | ---: |
| Team Spirit Ancient | 75% | 12 | Liquipedia snapshot | 68 |
| Vitality Inferno | 77% | 13 | Liquipedia snapshot | 70 |
| G2 Mirage | 67% | 12 | Liquipedia snapshot | 68 |

## Conclusion

Liquipedia + HLTV Snapshot can support a first honest `Partial/Snapshot Map Edge`, but cannot yet support a full production-grade Real Map Edge.

Critical next data:

- real veto;
- complete map pool;
- complete H2H map archive;
- fresh recent matches;
- player stats for Player Edge.
