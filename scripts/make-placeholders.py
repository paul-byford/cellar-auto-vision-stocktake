#!/usr/bin/env python3
"""Generate clearly-labelled placeholder JPGs for the demo. These are designed
to look unmistakably like placeholders so a reviewer doesn't mistake them for
real photos. Replace the produced files with real wine-shelf photographs
before deploying."""

from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public")

PLACEHOLDERS = [
    {"path": "hero-shelf.jpg", "size": (1600, 1200), "label": "HERO PLACEHOLDER", "subtitle": "Replace with a wine-shelf photograph."},
    {"path": "samples/easy.jpg", "size": (1200, 900), "label": "EASY", "subtitle": "Front-facing labels."},
    {"path": "samples/medium.jpg", "size": (1200, 900), "label": "MEDIUM", "subtitle": "Mixed angles."},
    {"path": "samples/hard.jpg", "size": (1200, 900), "label": "HARD", "subtitle": "Cellar lighting."},
]

BONE = (245, 243, 238)
INK = (20, 23, 28)
RULE = (216, 211, 199)
OXBLOOD = (92, 26, 31)
MUTED = (107, 101, 87)


def find_font(weight: str, size: int):
    candidates = [
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans-{weight}.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_bottle(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int):
    body_top = y + int(h * 0.22)
    neck_w = int(w * 0.32)
    neck_left = x + (w - neck_w) // 2
    # Neck
    draw.rectangle([neck_left, y, neck_left + neck_w, body_top], outline=INK, width=2)
    # Body
    draw.rectangle([x, body_top, x + w, y + h], outline=INK, width=2, fill=(230, 226, 218))
    # Label
    label_top = body_top + int(h * 0.32)
    label_bot = body_top + int(h * 0.58)
    draw.rectangle([x + 4, label_top, x + w - 4, label_bot], fill=BONE, outline=RULE)


def make(path, size, label, subtitle):
    img = Image.new("RGB", size, BONE)
    d = ImageDraw.Draw(img)
    w, h = size

    # Hairline frame
    d.rectangle([8, 8, w - 9, h - 9], outline=RULE, width=1)

    # Faint bottle silhouettes to suggest content
    rows = 1
    cols = 7
    bottle_w = int(w * 0.085)
    bottle_h = int(h * 0.55)
    pad_l = int(w * 0.05)
    spacing = (w - pad_l * 2 - bottle_w * cols) / max(1, cols - 1)
    base_y = int(h * 0.22)
    for c in range(cols):
        bx = int(pad_l + c * (bottle_w + spacing))
        draw_bottle(d, bx, base_y, bottle_w, bottle_h)

    # Diagonal "PLACEHOLDER" wash
    for i in range(0, w + h, 80):
        d.line([(i, 0), (i - h, h)], fill=(232, 228, 218), width=1)

    # Big "REPLACE" badge
    badge_h = int(h * 0.18)
    badge_w = int(w * 0.55)
    bx = (w - badge_w) // 2
    by = h - badge_h - int(h * 0.06)
    d.rectangle([bx, by, bx + badge_w, by + badge_h], fill=BONE, outline=OXBLOOD, width=2)

    f_label = find_font("Bold", int(badge_h * 0.42))
    f_meta = find_font("Bold", int(badge_h * 0.16))
    f_sub = find_font("Bold", int(badge_h * 0.18))

    meta_text = "REPLACE WITH REAL PHOTO"
    meta_bbox = d.textbbox((0, 0), meta_text, font=f_meta)
    d.text(
        (bx + (badge_w - (meta_bbox[2] - meta_bbox[0])) // 2, by + int(badge_h * 0.14)),
        meta_text,
        font=f_meta,
        fill=OXBLOOD,
    )

    label_bbox = d.textbbox((0, 0), label, font=f_label)
    d.text(
        (bx + (badge_w - (label_bbox[2] - label_bbox[0])) // 2, by + int(badge_h * 0.36)),
        label,
        font=f_label,
        fill=INK,
    )

    sub_bbox = d.textbbox((0, 0), subtitle, font=f_sub)
    d.text(
        (bx + (badge_w - (sub_bbox[2] - sub_bbox[0])) // 2, by + int(badge_h * 0.78)),
        subtitle,
        font=f_sub,
        fill=MUTED,
    )

    # Top-left tag
    f_tag = find_font("Bold", int(h * 0.022))
    d.text((24, 22), "CELLAR · PLACEHOLDER ASSET", font=f_tag, fill=MUTED)

    out_path = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    img.save(out_path, "JPEG", quality=82)
    print(f"wrote {out_path}")


for p in PLACEHOLDERS:
    make(p["path"], p["size"], p["label"], p["subtitle"])
