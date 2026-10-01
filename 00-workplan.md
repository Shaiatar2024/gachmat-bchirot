---
initiative: election-betting-2026
status: active
phase: 4-dev
urgency: high
next-action: "Re-seed production Firestore with corrected bonus-question data (needs a fresh service account key — the last one was used once and deleted on purpose). Then: enable Blaze billing + deploy Cloud Functions so submitBet/computeScores actually work. Then: port the remaining prototype pages (home, leaderboard, FAQ, pulse, admin)."
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

## 2026-10-01 — Design rebuild

User correctly flagged that the live app didn't match the approved prototype
(it was a Tailwind-based reinterpretation, not a port). Rebuilt to match:

- `index.css` now the prototype's actual CSS verbatim, not Tailwind utilities
  (Tailwind removed from the project entirely — it was never the real design
  tool here)
- Auth flow (`auth/AuthFlow.tsx`) now matches the prototype exactly: entry →
  phone OTP (6 boxes) → nickname step, Google button too. Dropped the
  prototype's demo-only email/password tab (out of PRD scope)
- `BettingPage.tsx` rebuilt with the real stepper+slider party controls,
  search/reset toolbar, and bonus questions wired to live Firestore data
- Fixed `seed.mjs`: "largest party" bonus question is now single-choice from
  the real party list (was wrongly free-text); "winning bloc" options match
  the prototype's wording — **production Firestore still has the OLD wrong
  bonus-question data until re-seeded** (needs a fresh service account key,
  see next-action)
- Added a minimal header (brand + sign-out only — no nav to home/leaderboard/
  pulse/FAQ, those pages don't exist yet)

**Still not built** (prototype has these, live app doesn't): home page (hero,
feature grid, how-it-works), leaderboard page (regular + live variants), FAQ
page, poll "pulse" page, admin panel. All exist as full markup in the
prototype — same porting approach as above applies when we get to them.

## 2026-10-01 — Home page, leaderboard, and a real SMS bug fixed

Re-seeded production with the corrected bonus-question data (fresh key, used
once, deleted immediately after — same pattern as before).

**Found and fixed the real phone sign-in bug** (not a code bug — a project
config bug): the Firebase project's SMS region policy was "allow listed
countries only" with an EMPTY allowlist, silently blocking SMS to every
country including Israel. Fixed via the Identity Platform admin API —
allowlisted `IL`. Separately hardened `AuthFlow.tsx` to surface the real
Firebase error code on failure instead of a generic swallowed message, so the
next failure (quota, bad number, anything) is diagnosable from the screen
instead of a dead end.

Added, ported from the prototype:
- Home page (`pages/HomePage.tsx`) — hero with ballot-box SVG art,
  feature-strip, how-it-works. Bet-lock countdown reads `config/system`.
- Leaderboard (`pages/LeaderboardPage.tsx`) — real `scores` data, honest
  empty state (not the prototype's fake demo names). "Live" election-night
  tab is UI-only for now — reads the same collection as the regular tab,
  since a real provisional-results flow doesn't exist yet.
- Real routing (`react-router-dom`, already installed, finally used): `/`,
  `/predict`, `/leaderboard`. Header has working nav links now.
- `computeScores` denormalizes nickname onto each score doc so the
  leaderboard never needs a client-side join.

**Still not built**: mobile bottom nav bar (prototype has one for <650px,
not added yet — desktop nav just disappears below that width right now with
nothing replacing it), results entry, bonus-answer entry, party-list
management (all explicitly deferred in the admin page too).

## 2026-10-01 — Phone sign-in still blocked: billing is required, not optional

Correction to earlier notes: billing (Blaze) isn't just needed for Cloud
Functions — Google requires it before sending ANY real phone-auth SMS at
all (confirmed via the exact error `auth/billing-not-enabled` when a real
user tried a real number). The SMS region-policy fix from earlier was real
and necessary but not sufficient on its own. Google Sign-In is unaffected.
**Blocker until user enables Blaze billing in the Firebase console.**

Added, while waiting on that:
- Admin page (`pages/AdminPage.tsx`, route `/admin`, gated on
  `profile.role === 'admin'`) — bonus-question add/delete, scoring-config
  editing, and a manual lock override (`config/system.locked`, checked by
  `submitBet` alongside the scheduled `betLockAt`). Nobody has the admin
  role yet — that needs `setUserRole`, which needs Cloud Functions deployed,
  which needs the same Blaze upgrade.

## 2026-10-01 — FAQ and Pulse pages

Added `pages/FaqPage.tsx` (native `<details>` accordion, content ported
verbatim from the prototype) and `pages/PulsePage.tsx` (two cards, both
honestly empty — same as the prototype's own unwired state). Full nav is now
in the header: home / my bet / leaderboard / pulse / FAQ, plus admin for
admins.

At this point every page from the approved prototype exists in the live app
except the mobile bottom nav bar. Remaining real work is backend-dependent:
Blaze billing (blocks phone sign-in AND bet-saving/scoring), then results
entry + bonus-answer entry + party-list management in the admin page, then
the crowd-average Cloud Function for the Pulse page.
