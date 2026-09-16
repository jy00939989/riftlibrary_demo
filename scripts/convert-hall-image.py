# 展览厅 hall_lvN 底图转换：图南丢进 visual/ 的 PNG → visual/exhibition/hall_lvN.jpg
# 用法: python scripts/convert-hall-image.py visual/展览厅lv3.png 3
# 输出: visual/exhibition/hall_lv3.jpg（质量 85，长边超 2731 则等比压到 2731——与 hall_lv5 参考图同宽）
import sys
from pathlib import Path

from PIL import Image

MAX_EDGE = 2731
QUALITY = 85


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("用法: python scripts/convert-hall-image.py <输入PNG路径> <档位1-5>")
    src = Path(sys.argv[1])
    lv = sys.argv[2]
    if not src.exists():
        sys.exit(f"找不到输入文件: {src}")

    dst = src.parent.parent / "visual" / "exhibition" / f"hall_lv{lv}.jpg"
    dst.parent.mkdir(parents=True, exist_ok=True)

    img = Image.open(src).convert("RGB")
    w, h = img.size
    if max(w, h) > MAX_EDGE:
        scale = MAX_EDGE / max(w, h)
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

    img.save(dst, "JPEG", quality=QUALITY, optimize=True)
    before = src.stat().st_size / 1024
    after = dst.stat().st_size / 1024
    # GBK 控制台打不出 emoji/箭头，输出保持 ASCII
    print(f"[ok] {dst}  {img.size[0]}x{img.size[1]}  {before:.0f}KB -> {after:.0f}KB")


if __name__ == "__main__":
    main()
