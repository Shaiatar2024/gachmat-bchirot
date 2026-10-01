---
initiative: election-betting-2026
status: active
phase: 4-dev
urgency: high
next-action: "Seed real data (parties/config/bonus questions) into production Firestore — needs a service account key since firebase-admin does not share the firebase CLI login. Then: enable Blaze billing + deploy Cloud Functions so submitBet/computeScores actually work. Then: bonus-questions UI, admin panel, leaderboard page."
blocker: "Cloud Functions (submitBet, computeScores, setUserRole) are not deployed yet — need the Blaze billing plan first. Site is live and auth works, but saving a bet will fail until then."
last-reviewed: 2026-10-01
description: "Code for גחמת בחירות. See the initiative-level workplan for product decisions: ../../00-workplan.md"
---

# Gachmat Bchirot — Dev Workplan

> This file is the contract for the CODE repo specifically (mirrors the
> nfl-betting-pool pattern: the initiative-level workplan owns product/PRD
> decisions, this one owns build state — see its own note on why git can't
> track this file from the workspace side).

## Where I stopped

2026-09-30 — Scaffolded from scratch, reusing nfl-betting-pool's architecture
directly (same Firebase stack, same admin-claim pattern, same "no official
results API, admin enters them by hand" approach):

- Firestore schema: `users`, `config/system`, `parties`, `bonusQuestions`,
  `bets/{uid}` (ONE per user — this is a one-shot bet, not weekly), `results/final`,
  `scores/{uid}`.
- `firestore.rules` — carries forward the `isAdmin()` custom-claim gotcha nfl-pool's
  rules already paid for (`'admin' in request.auth.token` before the equality
  check, or list queries throw for every non-admin user).
- Cloud Functions (v2): `setUserRole` (admin claim), `submitBet` (validates
  sum-to-120 and the 0-or-≥4 threshold rule, since Firestore rules can't sum a
  map cleanly), `computeScores` (Firestore trigger on `results/final`,
  implements "Shai Atar's Law" — see `functions/src/services/scoring.ts`,
  covered by `scoring.test.ts`, 5/5 passing).
- Auth: Google + Phone/SMS OTP via Firebase Auth directly (no Twilio — that's
  only for the separate, still-undecided WhatsApp/SMS *notifications* question).
- `web/`: Vite + React + TS + Tailwind, same token-based color system as
  nfl-pool's "Field Lights" design, values pulled straight from the approved
  prototype (`../../03-design/prototype/gachmat-bchirot.html`). `BettingPage.tsx`
  ports that prototype's seat-allocation interaction (running tally, over-120
  turns the bar red instead of redistributing, save gated on exactly 120) onto
  real Firestore + the `submitBet` callable.
- `functions/scripts/seed.mjs` seeds the default-16 party list (from
  littlepolls.com, as reviewed earlier in this initiative) + bonus questions +
  `config/system` into the emulator.

Explicitly NOT reused from nfl-betting-pool: `react-i18next`/bilingual i18n
(this product is Hebrew-only), the week/season data model (this is one bet, not
a weekly cadence), the ESPN schedule provider.

Not yet built: bonus-questions UI on the betting page (schema exists, no
component yet), admin panel (party/results/bonus-question/config management —
schema and rules support it, no UI), public leaderboard page, the countdown-to-lock
component, the "crowd average" and poll-snapshot context (user-stories 10–11).

## Decisions

| Date | Decision | Source |
|------|----------|--------|
| 2026-09-30 | New repo, public, under github.com/Shaiatar2024 (not a dedicated org like nfl-ghm) | user choice |
| 2026-09-30 | Scaffold immediately and iterate the schema in place, rather than finishing a formal tech-spec first | user choice |

## Deploy log

| Date | What | Result |
|------|------|--------|
| 2026-10-01 | Real Firebase project created by user (`gachmat-bchirot`, Firestore in `me-west1`/Tel Aviv, Google + Phone auth enabled) | done |
| 2026-10-01 | Deployed `firestore.rules` + `firestore.indexes.json` | done |
| 2026-10-01 | Built and deployed `web/` to Firebase Hosting | **live**: https://gachmat-bchirot.web.app |
| 2026-10-01 | Cloud Functions (`submitBet`, `computeScores`, `setUserRole`) | not deployed — needs Blaze billing plan first |
| 2026-10-01 | Seed data (parties/config/bonus questions) into production | not done — needs a service account key (firebase-admin doesn't reuse the `firebase login` session) |
