# Decisions

date | step | decision | why
---|---|---|---
2026-11-14 | B0 | D1 public repo, no raw data | user choice
2026-11-14 | B0 | D2 top-10 pool is active and IPL-eligible, retained players included | user choice
2026-11-14 | B0 | D3 Unstop upload is one PDF, report in front, research behind | user choice
2026-11-14 | B0 | D4 solo entry, Harsh Kawatra under Team IdeaForge | user choice
2026-11-14 | B0 | D5 deck is 1 cover, 4 core, 1 appendix, 1 thank-you | user brief
2026-11-14 | B0 | D6 pink and blue palette from the brief PDF | user brief
2026-11-14 | B0 | D7 cover mind map with brand image placeholders | user brief
2026-11-14 | B0 | D8 everything built inside rr-player-ml | planner assumption, user approved by executing the plan
2026-11-15 | B0 | Commits carry no Co-Authored-By trailer | plan Global Constraints, user's standing rule from the case-study workspace
2026-11-15 | W1 | npm rejects a leading underscore, so the scaffold folder is rrweb instead of _web; TanStack Table pinned to v8 (npm resolved v9); Next 16.4.6 starter flags cacheComponents and partialPrefetching removed for static export | tooling fix
2026-11-15 | W2 | chart marks use series blue #3553E0 (validator passes); brand blue #1226AA stays for text and structure | dataviz validator: #1226AA is below the lightness band
2026-11-15 | R1 | FLAG for the user: lane C1 reports Andre Russell (batting rank 6) retired from the IPL as a player on 30 Nov 2025; lists left unchanged because outside facts never move a ranking (plan global constraints); report to the user in the final message so they can decide before entering Unstop dropdowns | eligibility rule in the plan only excludes Pakistan from the data
