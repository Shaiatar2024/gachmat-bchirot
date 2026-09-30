# גחמת בחירות (Gachmat Bchirot)

A public, one-shot mandate-prediction game for Israel's Oct 27, 2026 Knesset
election: players allocate all 120 seats across parties, plus a few bonus
questions, in a single bet editable until election day. No money — bragging
rights only. Sibling project to [nfl-betting-pool](https://github.com/nfl-ghm/nfl-betting-pool),
whose architecture this reuses directly.

## Stack

Firebase (Firestore, Cloud Functions v2, Hosting, Auth) + React/Vite/Tailwind.

## Getting started

```bash
npm run install:all
cp web/.env.example web/.env.local   # fill in a real Firebase web config
npm run emulators           # in one terminal
npm run emulators:seed      # in another — seeds parties/bonus questions/config
npm run dev                 # in a third — http://localhost:5173
```

There is no live Firebase project yet — see [00-workplan.md](00-workplan.md)
for what's left before this runs against real data.

## Scoring: "Shai Atar's Law"

Implemented in [`functions/src/services/scoring.ts`](functions/src/services/scoring.ts):

- Exact match on a party → points = that party's actual seat count.
- Off by exactly one seat → half of that, rounded up.
- Off by two or more → zero.
- If fewer than an admin-configured % of players also got a party exactly
  right, that party's score doubles for whoever did.
- Matching every party exactly adds a flat perfect bonus.

## What's carried over from nfl-betting-pool, and what isn't

See "Where I stopped" in [00-workplan.md](00-workplan.md) for the specific
reuse mapping (Firestore schema shape, the `isAdmin()` custom-claim rules
gotcha, the "no official results API — admin enters them by hand" pattern,
the Cloud Functions v2 setup) and what was deliberately left out (i18n — this
product is Hebrew-only; the weekly/season data model — this is one bet, not a
recurring cadence).
