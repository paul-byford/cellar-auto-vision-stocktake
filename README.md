# Cellar — vision stock-take

A vision-based wine stock-take web app. Photograph a shelf; get back a
structured inventory with per-bottle confidence scores. Built as a job-application
artefact for the AI & Automation Lead role at Humble Group.

## Live demo

`https://cellar-auto-vision-stocktake.vercel.app` _(replace with your Vercel URL)_

## The problem

Stock-take in hospitality is the highest-leverage administrative task in the
business: it sets reorder, drives margin, and feeds whatever marketing and
revenue work runs on top of it. It's also the one most operators do badly,
because it's manual, slow, and easy to delegate to whoever is least busy.

Naive prompting — "look at this photo and tell me what's on the shelf" —
fails on this task in two predictable ways. The model hallucinates vintages
it can't actually see, and it confabulates familiar producers when the label
is unclear. Both failures look plausible on the page and only show up at
reorder time, when the numbers don't match the cellar.

This app uses a **two-pass pipeline** that decouples those failure modes.
The first pass detects discrete bottles and returns positions only — no
identification. The second pass takes the full image and the bottle list and
extracts label content, with explicit instructions never to guess vintages
and to lower confidence rather than invent details. Fields the model can't
see come back as `null`, which the UI flags for human review.

**Low confidence is a feature, not a bug.** A senior system is allowed to
say "I don't know" and surface that for review. A junior one fabricates and
moves on. The whole demo is built around that distinction — every row below
70% confidence is tinted, badged, and lifted out into a "needs review"
counter on the summary strip.

## Architecture

```
            ┌─────────────────────────────────────────────────┐
            │                  Browser                        │
            │   /  page.tsx                                   │
            │   • sample shelves + upload zone                │
            │   • status line, results table, summary strip   │
            └────────────────────┬────────────────────────────┘
                                 │  POST /api/analyse
                                 │  (multipart file or JSON imageUrl)
            ┌────────────────────▼────────────────────────────┐
            │       app/api/analyse/route.ts (Node runtime)   │
            │                                                 │
            │   ┌─────────────────────────────────────────┐   │
            │   │ Pass 1 — Detection (Claude Sonnet 4.5)  │   │
            │   │ → { bottles: [{id, bbox}], notes }      │   │
            │   └─────────────────┬───────────────────────┘   │
            │                     ▼                           │
            │   ┌─────────────────────────────────────────┐   │
            │   │ Pass 2 — Identification (single batch)  │   │
            │   │ → { wines: [{producer, vintage, …}] }   │   │
            │   └─────────────────┬───────────────────────┘   │
            │                     ▼                           │
            │   ┌─────────────────────────────────────────┐   │
            │   │ Aggregation + price lookup              │   │
            │   │ group by (producer + wine + vintage)    │   │
            │   └─────────────────┬───────────────────────┘   │
            └─────────────────────┼───────────────────────────┘
                                  ▼
                         AnalysisResult JSON
```

Both passes use `claude-sonnet-4-5`. Sonnet is the right fit here — Opus is
too slow for an interactive demo and Haiku struggles with label legibility
on the harder samples. The two-pass split is the durable architectural
decision, not the model choice.

## What's next

- **Reorder automation.** Once stock-take is reliable, the next click is a
  reorder draft sent to the supplier — bottle counts plus a target par level
  per SKU, with the system flagging low-confidence rows for human approval
  before sending.
- **Marketing content generation.** A weekly cellar snapshot — "this week's
  by-the-glass changes," producer profiles for the bottles that landed —
  generated from the same inventory data.
- **Dashboard layer.** Connect to SevenRooms / MarketMan / Lightspeed so the
  inventory feeds covers and revenue. The vision pass is the missing input
  to a stack the group already owns.

## Run locally

Requirements: Node 20+, an Anthropic API key.

```bash
git clone https://github.com/paul-byford/cellar-auto-vision-stocktake.git
cd cellar-auto-vision-stocktake
npm install
cp .env.example .env.local
# Edit .env.local — set ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

Open `http://localhost:3000`.

To test the pipeline on a single image without the UI:

```bash
npx tsx scripts/test-pipeline.ts ./path/to/shelf.jpg
```

### Replace the placeholder photos before deploying

The repo ships with four clearly-stamped placeholder JPGs. Replace them with
real photographs:

- `public/hero-shelf.jpg` — backdrop for the hero animation
- `public/samples/{easy,medium,hard}.jpg` — three demo shelves of escalating
  difficulty

See `public/samples/README.md` for sourcing notes.

## Honest limitations

A short, partial list of what doesn't work yet — kept short rather than
comprehensive, because honesty about limitations only signals seniority if
it sounds like an engineer wrote it.

- **Niche producers.** The model recognises mainstream brands well; small
  growers, natural-wine importers, and own-label restaurant cuvées are hit
  and miss. Below-70% rows are usually these.
- **Hand-written cellar tags.** Common in older European cellars. The model
  reads them inconsistently; treat as advisory.
- **Very dark cellars.** Below ~30 lux, label legibility collapses. A
  pre-flash from the phone helps more than the prompt does.
- **Unusual bottle shapes.** Bocksbeutel (Franconian), clavelin (Jura), and
  some half-bottles confuse the bottle-count pass. Sizes other than 750ml
  default to 750 in the output unless the model can read the label
  explicitly.
- **No persistence.** This is a demo, not a product — every analyse is
  fresh, no history, no diffs against last week. That's deliberate; see the
  spec for what's explicitly out of scope.

---

Paul Byford — `paul-byford` on GitHub.
