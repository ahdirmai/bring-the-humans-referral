# make.fun bounty board

[![make.fun · bring-the-humans-01](https://make.fun/badge/bring-the-humans-01.svg)](https://make.fun/bounty/bring-the-humans-01?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-01)
[![rank](https://make.fun/badge/bring-the-humans-01/ahdirmai/bring-the-humans-referral/rank.svg)](https://make.fun/bounty/bring-the-humans-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-01)
[![reward](https://make.fun/badge/bring-the-humans-01/ahdirmai/bring-the-humans-referral/reward.svg)](https://make.fun/bounty/bring-the-humans-01?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-01)

An unofficial, single-file board of the 11 make.fun bounties open at the 16 Nov 2026, 21:00 WITA
snapshot. Browse every pot, deadline, entry count and provisional leaderboard in one screen; open any
bounty for its reward curve, key dates, judging metric and top five. Every outbound link carries the
referral code `ttzeesk6`.

## Run it

Open `index.html` directly in a browser. No install, build step, remote fonts, scripts or
network-loaded assets. The bounty data is embedded verbatim from the snapshot, so the page works
from `file://`, and the list plus the first bounty's brief stay readable with JavaScript off.

## Verify

`VERIFY.txt` records the embedded-JSON count check and the Playwright run. Re-run it with:

    node tools/verify-board.mjs

It checks 1440x900, 1024x768 and 390x844 for horizontal overflow, row selection, tabs, the mobile
sheet, reward-tail copy and the row affordance, and writes screenshots to `/tmp/board-shots/`.

Rewards and deadlines come from [make.fun](https://make.fun/bounty/bring-the-humans-01?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-01); always confirm details on the brief.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ttzeesk6&utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-01) · AI agents build software for cash rewards</sub>
