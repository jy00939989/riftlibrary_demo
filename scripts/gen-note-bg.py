# 生成访客纪念「便签墙」底图（2026-10-23 图南：便签用图片底）
# 三张 480x480 纸感底图：便利贴黄 / 象牙横线纸 / 牛皮纸
# 用法：python scripts/gen-note-bg.py   （输出到 visual/notes/）
import os
import random
from PIL import Image, ImageDraw, ImageFilter

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'visual', 'notes')
SIZE = 480
random.seed(20261023)


def paper_noise(img, strength=6):
    """叠加细腻纸面颗粒：高斯噪点 + 轻微高斯模糊，避免脏点感"""
    noise = Image.effect_noise((SIZE, SIZE), 28).convert('L')
    noise = noise.point(lambda p: 128 + (p - 128) * strength / 16)
    return Image.blend(img, Image.merge('RGB', (noise, noise, noise)), 0.06)


def v_gradient(top, bottom):
    base = Image.new('RGB', (1, SIZE))
    for y in range(SIZE):
        t = y / (SIZE - 1)
        base.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return base.resize((SIZE, SIZE))


def rounded_vignette(img, strength=26):
    """四角极轻压暗，模拟纸张厚度（CSS 圆角裁切后更像便签）"""
    mask = Image.new('L', (SIZE, SIZE), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((-SIZE * 0.35, -SIZE * 0.35, SIZE * 1.35, SIZE * 1.35), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(60))
    black = Image.new('RGB', (SIZE, SIZE), (0, 0, 0))
    return Image.composite(img, Image.blend(black, img, 1 - strength / 255), mask)


def save(img, name):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, name)
    img.save(path, optimize=True)
    print(name, os.path.getsize(path), 'bytes')


# 1. 便利贴黄：温暖渐变 + 底部略深（贴纸厚度感）
sticky = v_gradient((255, 248, 184), (250, 236, 150))
sticky = paper_noise(sticky, 7)
sticky = rounded_vignette(sticky, 20)
save(sticky, 'note_sticky.png')

# 2. 象牙横线纸：淡横格（呼应沈明远稿纸/江有树笔记本的家常纸感）
paper = v_gradient((253, 250, 240), (246, 240, 222))
paper = paper_noise(paper, 5)
# 横线必须用 RGBA overlay 低透明度合成——直接 RGB 画线是实色，会跟正文抢视觉
lines = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
ld = ImageDraw.Draw(lines)
for y in range(44, SIZE, 36):
    ld.line((0, y, SIZE, y), fill=(139, 120, 80, 30), width=1)
paper = Image.alpha_composite(paper.convert('RGBA'), lines).convert('RGB')
paper = rounded_vignette(paper, 18)
save(paper, 'note_paper.png')

# 3. 牛皮纸：纤维感更强的暖棕（裴舟收据/王小磊纸板一脉）
kraft = v_gradient((232, 213, 181), (219, 197, 160))
kraft = paper_noise(kraft, 10)
kraft = kraft.filter(ImageFilter.GaussianBlur(0.4))
kraft = rounded_vignette(kraft, 24)
save(kraft, 'note_kraft.png')
