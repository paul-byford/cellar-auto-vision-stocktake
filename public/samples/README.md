# Sample shelf photos

These four JPGs are **placeholders**, not real photographs:

- `../hero-shelf.jpg` — backdrop for the hero animation
- `easy.jpg` — front-facing labels, even lighting
- `medium.jpg` — mixed angles, partial occlusion
- `hard.jpg` — cellar lighting, partial labels, glare

**Replace them before deploying.** The placeholders are visibly stamped so a
reviewer doesn't mistake them for real photos.

## Sourcing photos

Suggestions, in order of best to worst:

1. **Photograph your own collection.** A phone snap of any shelf with 6–12
   bottles will work. Aim for 1600px on the long edge.
2. **Photograph a local wine shop.** Ask the manager first — most are happy
   to oblige if you explain you're testing a stocktake tool.
3. **Stock photography.** Avoid — the labels are usually too low-resolution
   or stylised for the model to read.

## What "easy / medium / hard" means

Pick three photos that genuinely span the difficulty spectrum, so the demo
demonstrates the system's confidence calibration honestly:

- **Easy** — bottles facing the camera, labels fully legible, 6–12 bottles.
- **Medium** — bottles at varying angles, some labels rotated 30–60° away,
  one or two partially occluded.
- **Hard** — dim lighting, glare on at least two bottles, at least one
  unfamiliar producer the model is unlikely to recognise.

The "hard" shelf is the most important. It's where the system gets to say
"I don't know" honestly — which is the point of the demo.

## Sizing

Aim for ≤ 2 MB each. The pipeline uses base64 image data, so file size
directly affects request size and latency.
