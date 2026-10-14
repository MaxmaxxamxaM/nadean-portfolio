"""Shrink uploaded photos so the site stays fast.

Any image in images/ whose long edge is over MAX_EDGE pixels is scaled down to
MAX_EDGE and saved back under the same name, so content/site.json still points
at it. Phone rotation is applied first, and camera data (including GPS
location) is dropped from resized files. Images already within the limit are
left untouched, so running this again never re-compresses anything.
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

MAX_EDGE = 3000
JPEG_QUALITY = 86
ROOT = Path(__file__).resolve().parents[2] / "images"
TYPES = {".jpg", ".jpeg", ".png", ".webp"}


def resize(path: Path) -> bool:
    with Image.open(path) as im:
        if max(im.size) <= MAX_EDGE:
            return False
        fmt = im.format
        before = im.size
        im = ImageOps.exif_transpose(im)
        im.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        icc = im.info.get("icc_profile")
        extra = {"icc_profile": icc} if icc else {}
        if fmt == "JPEG":
            if im.mode not in ("RGB", "L"):
                im = im.convert("RGB")
            im.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True, subsampling="4:2:0", **extra)
        elif fmt == "WEBP":
            im.save(path, "WEBP", quality=JPEG_QUALITY, method=6, **extra)
        else:
            im.save(path, "PNG", optimize=True, **extra)
    print(f"resized {path.relative_to(ROOT.parent)}: {before[0]}x{before[1]} -> {im.size[0]}x{im.size[1]}, {path.stat().st_size / 1e6:.2f} MB")
    return True


def main() -> int:
    changed = 0
    for path in sorted(ROOT.rglob("*")):
        if path.is_file() and path.suffix.lower() in TYPES:
            try:
                changed += resize(path)
            except Exception as err:  # one bad file should not block the rest
                print(f"skipped {path}: {err}", file=sys.stderr)
    print(f"{changed} image(s) resized")
    return 0


if __name__ == "__main__":
    sys.exit(main())
