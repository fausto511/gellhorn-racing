"""Create deterministic, web-ready GTA manufacturer logo assets.

The source files remain untouched. Outputs use a transparent 256 x 256 canvas,
lossless WebP and concise ASCII filenames. Requires Pillow.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = PROJECT_ROOT / "Visual" / "Logos" / "Car Manufacturers"
OUTPUT_DIR = SOURCE_DIR / "web"
CANVAS_SIZE = 256
CONTENT_SIZE = 216
PREVIEW_PATH = SOURCE_DIR / "web-preview.png"


# Source filename -> (public manufacturer name, URL-safe filename prefix)
LOGOS: dict[str, tuple[str, str]] = {
    "albany.png": ("Albany", "albany"),
    "annis.png": ("Annis", "annis"),
    "benefactor.png": ("Benefactor", "benefactor"),
    "bollokan.png": ("Bollokan", "bollokan"),
    "bravado.png": ("Bravado", "bravado"),
    "Buckingham.webp": ("Buckingham", "buckingham"),
    "burgerfahrzeug.png": ("BF", "bf"),
    "canis (1).png": ("Canis", "canis"),
    "Chariot (1).png": ("Chariot", "chariot"),
    "cheval.webp": ("Cheval", "cheval"),
    "classique.png": ("Classique", "classique"),
    "coil.png": ("Coil", "coil"),
    "declasse.png": ("Declasse", "declasse"),
    "dewbauchee.png": ("Dewbauchee", "dewbauchee"),
    "dinka.png": ("Dinka", "dinka"),
    "Dundreary (1).png": ("Dundreary", "dundreary"),
    "emperor.png": ("Emperor", "emperor"),
    "enus (1).png": ("Enus", "enus"),
    "fathom.png": ("Fathom", "fathom"),
    "Gallivanter_Logo_V.png": ("Gallivanter", "gallivanter"),
    "Grotti-GTAV-Logo.webp": ("Grotti", "grotti"),
    "Imponte-GTAO-Logo.webp": ("Imponte", "imponte"),
    "Invetero.webp": ("Invetero", "invetero"),
    "karin.png": ("Karin", "karin"),
    "lampadati.png": ("Lampadati", "lampadati"),
    "maibatsu.webp": ("Maibatsu", "maibatsu"),
    "obey.png": ("Obey", "obey"),
    "ocelot.png": ("Ocelot", "ocelot"),
    "Overflod.png": ("Överflöd", "overflod"),
    "pegassi.png": ("Pegassi", "pegassi"),
    "penaud.png": ("Penaud", "penaud"),
    "pfister.webp": ("Pfister", "pfister"),
    "Progen-GTAO-Logo.webp": ("Progen", "progen"),
    "schyster.png": ("Schyster", "schyster"),
    "Truffade (1).png": ("Truffade", "truffade"),
    "ubermacht.png": ("Übermacht", "ubermacht"),
    "vapid.webp": ("Vapid", "vapid"),
    "vulcar.webp": ("Vulcar", "vulcar"),
    "vysser.png": ("Vysser", "vysser"),
    "zirconium.png": ("Zirconium", "zirconium"),
}


CURRENT_VEHICLE_LIST = {
    "Albany",
    "Annis",
    "Benefactor",
    "Bravado",
    "Buckingham",
    "Canis",
    "Coil",
    "Declasse",
    "Dinka",
    "Dundreary",
    "Emperor",
    "Enus",
    "Gallivanter",
    "Grotti",
    "Imponte",
    "Invetero",
    "Karin",
    "Lampadati",
    "Maibatsu",
    "Obey",
    "Ocelot",
    "Pegassi",
    "Pfister",
    "Schyster",
    "Truffade",
    "Übermacht",
    "Vapid",
    "Vulcar",
    "Zirconium",
}


def render_logo(source: Path, destination: Path) -> dict[str, object]:
    with Image.open(source) as opened:
        image = opened.convert("RGBA")
        alpha = image.getchannel("A")
        content_bounds = alpha.getbbox()
        if content_bounds is None:
            raise ValueError("image has no visible pixels")

        trimmed = image.crop(content_bounds)
        scale = min(CONTENT_SIZE / trimmed.width, CONTENT_SIZE / trimmed.height)
        output_width = max(1, round(trimmed.width * scale))
        output_height = max(1, round(trimmed.height * scale))
        resized = trimmed.resize(
            (output_width, output_height), Image.Resampling.LANCZOS
        )

        canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
        offset = (
            (CANVAS_SIZE - output_width) // 2,
            (CANVAS_SIZE - output_height) // 2,
        )
        canvas.alpha_composite(resized, offset)

        temporary = destination.with_suffix(".tmp.webp")
        canvas.save(
            temporary,
            format="WEBP",
            lossless=True,
            method=6,
            exact=True,
        )
        os.replace(temporary, destination)

        return {
            "source_width": image.width,
            "source_height": image.height,
            "content_width": output_width,
            "content_height": output_height,
        }


def create_preview(manifest: list[dict[str, object]]) -> None:
    columns = 5
    cell_width = 300
    cell_height = 290
    rows = (len(manifest) + columns - 1) // columns
    preview = Image.new(
        "RGB", (columns * cell_width, rows * cell_height), "#14141A"
    )
    draw = ImageDraw.Draw(preview)
    try:
        font = ImageFont.truetype("arial.ttf", 18)
    except OSError:
        font = ImageFont.load_default()

    for index, entry in enumerate(manifest):
        column = index % columns
        row = index // columns
        left = column * cell_width + 22
        top = row * cell_height + 16
        box_size = 256

        draw.rounded_rectangle(
            (left, top, left + box_size, top + box_size),
            radius=8,
            fill="#242430",
        )
        draw.rectangle(
            (left + box_size // 2, top, left + box_size, top + box_size),
            fill="#FCFAF7",
        )
        with Image.open(OUTPUT_DIR / str(entry["file"])) as logo:
            preview.paste(logo.convert("RGBA"), (left, top), logo.convert("RGBA"))

        draw.text(
            (left, top + box_size + 6),
            str(entry["manufacturer"]),
            fill="#FCFAF7",
            font=font,
        )

    preview.save(PREVIEW_PATH, format="PNG", optimize=True)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    missing_sources = [name for name in LOGOS if not (SOURCE_DIR / name).is_file()]
    if missing_sources:
        raise FileNotFoundError(f"Missing source files: {missing_sources}")

    manifest: list[dict[str, object]] = []
    for source_name, (manufacturer, slug) in sorted(
        LOGOS.items(), key=lambda item: item[1][0].casefold()
    ):
        output_name = f"{slug}-gta-6-logo.webp"
        details = render_logo(SOURCE_DIR / source_name, OUTPUT_DIR / output_name)
        manifest.append(
            {
                "manufacturer": manufacturer,
                "slug": slug,
                "file": output_name,
                "alt": f"{manufacturer} vehicle manufacturer logo in GTA 6",
                "source_file": source_name,
                "in_current_vehicle_list": manufacturer in CURRENT_VEHICLE_LIST,
                **details,
            }
        )

    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    create_preview(manifest)

    unidentified = SOURCE_DIR / "SvdyVpU.png"
    print(f"Created {len(manifest)} logo files in {OUTPUT_DIR}")
    print(f"Manifest: {manifest_path}")
    print(f"Preview: {PREVIEW_PATH}")
    print(
        "Unidentified source excluded: "
        f"{unidentified.name if unidentified.exists() else 'not present'}"
    )


if __name__ == "__main__":
    main()
