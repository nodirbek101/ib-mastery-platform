# IB Mastery — Interactive Investment Banking Models

An interactive platform for learning the core valuation & transaction models from
**Rosenbaum & Pearl, _Investment Banking_**, built around the ValueCo case.

## How to open
Just double-click **`index.html`** (the home page) or **`dcf.html`** (the DCF module).
It runs entirely in your browser — no install, no internet required (an internet
connection only improves the fonts on first load).

## What's here
- **`index.html`** — landing hub with all six models (DCF live; the other five are
  the next builds).
- **`dcf.html`** — the flagship **Discounted Cash Flow** module:
  - **Theory** — Rosenbaum's five-step method with interactive widgets
    (drag WACC → watch enterprise value move; see the present value of each cash flow).
  - **Practice Lab** — a real interactive spreadsheet of ValueCo's DCF:
    - **Guided mode** — the tutor points to each blue input cell and tells you
      exactly what to type and *why*; answers are checked live.
    - **Free build** — fill it in yourself and hit *Check my answers*.
  - **Built-in tutor** — context-aware coaching + a Q&A box (no API key, no cost).

## Verified
The calculation engine reproduces the official Rosenbaum "Completed" workbook
**to the cent**: Enterprise Value **$6,008.7m**, Implied Equity **$4,758.7m**,
fully-diluted shares **80.05m**, implied share price **$59.45**, terminal value
**68.8%** of EV, implied perpetuity growth **2.61%**.

## File map
```
index.html          home / model hub
dcf.html            DCF module (theory + lab + tutor)
css/app.css         design system
css/dcf.css         module + spreadsheet styles
js/engine.js        DCF calculation engine (validated)
js/model.js         input-cell catalogue, answers, per-cell hints
js/grid.js          interactive spreadsheet, modes, scoring, coaching
js/tutor.js         built-in tutor knowledge base + chat
js/theory.js        theory-tab interactions & widgets
js/site.js          landing-page interactions
```

The original Rosenbaum PDF and the six Excel models remain untouched in the
parent `finance/` folder — this platform was built alongside them, drawing on
the DCF model and Chapter 3.
