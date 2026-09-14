"""Generate the Phase 0 app icon set.

Tauri's Windows build needs `icons/icon.ico` to emit a resource file. Rather
than commit a binary blob of unknown provenance, the icon is generated here so
it is reproducible and reviewable. It is a plain comma glyph on a dark rounded
square — deliberately generic, no product branding.
"""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
SIZES = [16, 24, 32, 48, 64, 128, 256]
BG = (23, 29, 36, 255)
FG = (110, 168, 254, 255)


def draw_icon(size: int) -> Image.Image:
    # Render at 4x then downscale for clean edges.
    scale = 4
    canvas = size * scale
    image = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    radius = int(canvas * 0.22)
    draw.rounded_rectangle([0, 0, canvas - 1, canvas - 1], radius=radius, fill=BG)

    # A comma: a filled circle with a tail sweeping down-left.
    blob_r = int(canvas * 0.20)
    cx, cy = int(canvas * 0.54), int(canvas * 0.40)
    draw.ellipse([cx - blob_r, cy - blob_r, cx + blob_r, cy + blob_r], fill=FG)

    tail_w = int(canvas * 0.15)
    draw.line(
        [
            (cx, cy + int(blob_r * 0.55)),
            (cx - int(canvas * 0.10), cy + int(canvas * 0.32)),
        ],
        fill=FG,
        width=tail_w,
        joint="curve",
    )
    # Round off the tail tip.
    tip_x, tip_y = cx - int(canvas * 0.10), cy + int(canvas * 0.32)
    draw.ellipse(
        [tip_x - tail_w // 2, tip_y - tail_w // 2, tip_x + tail_w // 2, tip_y + tail_w // 2],
        fill=FG,
    )

    return image.resize((size, size), Image.LANCZOS)


def main() -> None:
    icons = {size: draw_icon(size) for size in SIZES}

    ico_sizes = [s for s in SIZES if s <= 256]
    icons[256].save(OUT / "icon.ico", format="ICO", sizes=[(s, s) for s in ico_sizes])
    icons[128].save(OUT / "128x128.png")
    icons[32].save(OUT / "32x32.png")
    icons[256].save(OUT / "icon.png")
    icons[256].save(OUT / "128x128@2x.png")

    for name in sorted(p.name for p in OUT.glob("*") if p.is_file()):
        print(f"generated {name} ({(OUT / name).stat().st_size} bytes)")


if __name__ == "__main__":
    main()
