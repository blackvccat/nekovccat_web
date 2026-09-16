#!/usr/bin/env python3
"""像素图标工具箱：把 work/icons-svg 里的画稿同步给站点，并在画稿与 PNG 之间转换。

图标不再写在代码里 —— 它们就是 work/icons-svg 下的一个个 .svg 文件（矢量路径或内嵌 PNG
都行，Figma / Illustrator / 画图软件导出后直接丢进去）。这个目录是画稿源，脚本负责分发：

    python scripts/pixel-icons.py sync      # 画稿 → 站点真正会请求的两个位置
    python scripts/pixel-icons.py preview   # 生成 work/icons-preview.html，按真实尺寸看一遍
    python scripts/pixel-icons.py export    # 画稿 → work/icons/*.png（想按像素改时用）
    python scripts/pixel-icons.py build     # PNG → 画稿（把改好的 PNG 变成 24×24 的矢量像素）

sync 的分发规则（重要）：被 work/visitor-apps.json 里的应用当作图标引用的文件是**私有素材**，
只同步到 work/visitor-assets，由后端在登录鉴权后按需发给访客，绝不进前端；其余同步到
frontend/public/icons-svg，由站点公开提供。私有文件若出现在公开目录里会被删掉并报警。
"""
import argparse
import base64
import json
import math
import re
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "work" / "icons-svg"
PUBLIC_DIR = ROOT / "frontend" / "public" / "icons-svg"
VISITOR_ASSETS_DIR = ROOT / "work" / "visitor-assets"
APPS_FILE = ROOT / "work" / "visitor-apps.json"
PNG_DIR = ROOT / "work" / "icons"
PREVIEW = ROOT / "work" / "icons-preview.html"
COMPONENT = ROOT / "frontend" / "src" / "components" / "my-world" / "pixel-icon.tsx"
GRID = 24
# 桌面上真实用到图标的四处理尺寸，preview 会按这些尺寸各画一遍。
REAL_SIZES = ((43, "桌面图标"), (30, "开始菜单"), (21, "任务栏"), (20, "标题栏"))

OPEN_TAG = re.compile(r"<svg\b[^>]*>")
PATH = re.compile(r"<path\s+d=\"(?P<d>[^\"]+)\"\s+fill=\"(?P<fill>#[0-9a-fA-F]{6})\"\s*/>")
IMAGE = re.compile(r"<image\b[^>]*?href=\"data:img/png;base64,(?P<data>[^\"]+)\"[^>]*/?>")
IMAGE_RECT = re.compile(r"<image\b[^>]*?x=\"(?P<x>[\d.]+)\"[^>]*?y=\"(?P<y>[\d.]+)\"[^>]*?width=\"(?P<w>[\d.]+)\"[^>]*?height=\"(?P<h>[\d.]+)\"")
VIEW_BOX = re.compile(r"viewBox=\"([\d.\s-]+)\"")
TOKEN = re.compile(r"([MmLlHhVvZz])|(-?(?:\d+\.?\d*|\.\d+))")
MAP_ENTRY = re.compile(r"([\w'-]+):\s*'([^']+\.svg)'")


def fail(message: str) -> None:
    raise SystemExit(message)


# ---------------------------------------------------------------- 读画稿

class Art:
    """一个图标画稿：要么是矢量路径，要么是一张内嵌的 PNG。"""

    def __init__(self, path: Path):
        self.path = path
        self.name = path.stem
        self.text = path.read_text(encoding="utf-8")
        head = OPEN_TAG.search(self.text)
        if not head:
            fail(f"{path} 里没有找到 <svg> 开头标签。")
        self.head = head.group(0)
        self.body = self.text[head.end():]
        self.paths = [(item.group("d"), item.group("fill").lower()) for item in PATH.finditer(self.body)]
        image = IMAGE.search(self.body)
        self.image = base64.b64decode(image.group("data")) if image else None

    @property
    def kind(self) -> str:
        if self.image:
            return "内嵌 PNG"
        return "矢量路径" if self.paths else "空文件"

    def mark(self, comment: str) -> str:
        """在 <svg> 标签后面插一行注释：用来标明「这是同步出来的副本，别直接改」。"""
        return f"{self.text[:OPEN_TAG.search(self.text).end()]}\n  <!-- {comment} -->{self.text[OPEN_TAG.search(self.text).end():]}"


def read_art(folder: Path = SOURCE_DIR) -> dict[str, Art]:
    if not folder.is_dir():
        fail(f"{folder} 不存在；图标画稿都放在这里。")
    return {path.stem: Art(path) for path in sorted(folder.glob("*.svg"))}


def component_icon_map() -> dict[str, str]:
    """从 pixel-icon.tsx 的映射表读出「组件里的名字 → 文件名」，用来检查有没有漏文件。"""
    if not COMPONENT.exists():
        return {}
    return {name.strip("'"): filename for name, filename in MAP_ENTRY.findall(COMPONENT.read_text(encoding="utf-8"))}


def private_icons() -> dict[str, list[str]]:
    """应用注册表里被当成图标引用的文件 → 用到它的应用 id（这些是私有素材）。"""
    if not APPS_FILE.exists():
        return {}
    try:
        raw = json.loads(APPS_FILE.read_text(encoding="utf-8"))
    except ValueError as error:
        fail(f"{APPS_FILE} 不是合法 JSON：{error}")
    owners: dict[str, list[str]] = {}
    for entry in raw.get("apps", []):
        if isinstance(entry, dict) and isinstance(entry.get("icon"), str):
            owners.setdefault(entry["icon"], []).append(str(entry.get("id")))
    return owners


# ---------------------------------------------------------------- 矢量路径 → 像素

def parse_path(name: str, d: str) -> list[list[tuple[float, float]]]:
    """把直线路径拆成若干闭合多边形；只认识 M/L/H/V/Z 及其相对形式。"""
    tokens = [match.group(1) or float(match.group(2)) for match in TOKEN.finditer(d)]
    polygons: list[list[tuple[float, float]]] = []
    points: list[tuple[float, float]] = []
    x = y = start_x = start_y = 0.0
    command = ""
    index = 0
    while index < len(tokens):
        token = tokens[index]
        if isinstance(token, str):
            command = token
            index += 1
            if command in "Zz":
                if points:
                    polygons.append(points + [(start_x, start_y)])
                    points = []
                x, y = start_x, start_y
            elif command in "Mm":
                if index + 1 >= len(tokens):
                    fail(f"{name}: 路径 {d!r} 的 M 命令缺少坐标。")
                px, py = tokens[index], tokens[index + 1]
                index += 2
                x, y = (x + px, y + py) if command == "m" else (px, py)
                if points:
                    polygons.append(points)
                points = [(x, y)]
                start_x, start_y = x, y
                command = "l" if command == "m" else "L"  # M 后面跟着的坐标对按 lineto 处理
            elif command not in "LlHhVv":
                fail(f"{name}: 暂不支持的路径命令 {command!r}（只处理直线 M/L/H/V/Z）；路径：{d}")
            continue
        if command in "Ll":
            px, py = tokens[index], tokens[index + 1]
            index += 2
            x, y = (x + px, y + py) if command == "l" else (px, py)
        elif command in "Hh":
            px = tokens[index]
            index += 1
            x = x + px if command == "h" else px
        elif command in "Vv":
            py = tokens[index]
            index += 1
            y = y + py if command == "v" else py
        else:
            fail(f"{name}: 路径 {d!r} 缺少可以解释的命令（只处理直线 M/L/H/V/Z）。")
        points.append((x, y))
    if points:
        polygons.append(points)
    return [polygon for polygon in polygons if len(polygon) >= 3]


def rasterize(art: Art, size: int = GRID) -> list[list[tuple[int, int, int, int]]]:
    """按绘制顺序把矢量路径铺到 size×size 的像素格上（不抗锯齿）。"""
    view = VIEW_BOX.search(art.head)
    span = float(view.group(1).split()[2]) if view else GRID
    scale = size / span
    canvas = [[(0, 0, 0, 0)] * size for _ in range(size)]
    for d, fill in art.paths:
        color = tuple(int(fill[position:position + 2], 16) for position in (1, 3, 5))
        for polygon in parse_path(art.name, d):
            for row in range(size):
                scan = (row + 0.5) / scale
                crossings = []
                for position, (x1, y1) in enumerate(polygon):
                    x2, y2 = polygon[(position + 1) % len(polygon)]
                    if y1 == y2 or not min(y1, y2) <= scan < max(y1, y2):
                        continue
                    crossings.append((x1 + (scan - y1) / (y2 - y1) * (x2 - x1), 1 if y2 > y1 else -1))
                crossings.sort()
                winding = 0
                span_start = None
                for xpos, direction in crossings:
                    was = winding
                    winding += direction
                    if was == 0 and winding != 0:
                        span_start = xpos
                    elif was != 0 and winding == 0 and span_start is not None:
                        first = max(0, math.ceil(span_start * scale - 0.5))
                        last = min(size, math.floor(xpos * scale - 0.5) + 1)
                        for column in range(first, last):
                            canvas[row][column] = (*color, 255)
                        span_start = None
    return canvas


# ---------------------------------------------------------------- PNG 读写

def write_png(path: Path, pixels: list[list[tuple[int, int, int, int]]], scale: int = 1) -> None:
    if scale != 1:
        pixels = [[pixel for pixel in row for _ in range(scale)] for row in pixels for _ in range(scale)]
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for pixel in row:
            raw += bytes(pixel)

    def chunk(tag: bytes, payload: bytes) -> bytes:
        return struct.pack(">I", len(payload)) + tag + payload + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF)

    target = b"\x89PNG\r\n\x1a\n"
    target += chunk(b"IHDR", struct.pack(">IIBBBBB", len(pixels[0]), len(pixels), 8, 6, 0, 0, 0))
    target += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    target += chunk(b"IEND", b"")
    path.write_bytes(target)


def read_png(path: Path) -> list[list[tuple[int, int, int, int]]]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        fail(f"{path} 不是 PNG 文件。")
    position = 8
    header = palette = transparency = None
    compressed = bytearray()
    while position < len(data):
        length = struct.unpack(">I", data[position:position + 4])[0]
        tag = data[position + 4:position + 8]
        payload = data[position + 8:position + 8 + length]
        position += 12 + length
        if tag == b"IHDR":
            header = struct.unpack(">IIBBBBB", payload)
        elif tag == b"PLTE":
            palette = [tuple(payload[index:index + 3]) for index in range(0, len(payload), 3)]
        elif tag == b"tRNS":
            transparency = payload
        elif tag == b"IDAT":
            compressed += payload
        elif tag == b"IEND":
            break
    if header is None:
        fail(f"{path} 缺少 IHDR。")
    width, height, depth, color_type, _, _, interlace = header
    if interlace:
        fail(f"{path} 是隔行扫描 PNG，请另存为非隔行版本。")
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}.get(color_type)
    if channels is None:
        fail(f"{path} 的 PNG 颜色类型 {color_type} 暂不支持。")
    if depth == 16:
        fail(f"{path} 是 16 位色深，请另存为 8 位。")
    if depth not in (1, 2, 4, 8):
        fail(f"{path} 的位深 {depth} 暂不支持。")
    if color_type in (2, 4, 6) and depth != 8:
        fail(f"{path} 的颜色类型 {color_type} 只支持 8 位色深。")
    if color_type == 3 and not palette:
        fail(f"{path} 是索引色但缺少 PLTE。")

    stride = (width * channels * depth + 7) // 8
    step = max(1, channels * depth // 8)
    raw = zlib.decompress(bytes(compressed))
    rows = []
    previous = bytearray(stride)
    for row in range(height):
        start = row * (stride + 1)
        filter_type = raw[start]
        line = bytearray(raw[start + 1:start + 1 + stride])
        for index in range(stride):
            left = line[index - step] if index >= step else 0
            up = previous[index]
            upleft = previous[index - step] if index >= step else 0
            if filter_type == 1:
                line[index] = (line[index] + left) & 0xFF
            elif filter_type == 2:
                line[index] = (line[index] + up) & 0xFF
            elif filter_type == 3:
                line[index] = (line[index] + (left + up) // 2) & 0xFF
            elif filter_type == 4:
                base = left + up - upleft
                distances = (abs(base - left), abs(base - up), abs(base - upleft))
                predictor = (left, up, upleft)[distances.index(min(distances))]
                line[index] = (line[index] + predictor) & 0xFF
            elif filter_type != 0:
                fail(f"{path} 使用了未知的行过滤器 {filter_type}。")
        rows.append(bytes(line))
        previous = line

    pixels = []
    for line in rows:
        if depth == 8:
            values = list(line)
        else:
            per_byte = 8 // depth
            values = [(byte >> (8 - depth * (shift + 1))) & ((1 << depth) - 1)
                      for byte in line for shift in range(per_byte)]
        row_pixels = []
        for column in range(width):
            block = values[column * channels:(column + 1) * channels]
            if color_type == 6:
                row_pixels.append(tuple(block))
            elif color_type == 2:
                row_pixels.append((*block, 255))
            elif color_type == 4:
                row_pixels.append((block[0], block[0], block[0], block[1]))
            elif color_type == 0:
                factor = 255 // ((1 << depth) - 1)
                value = block[0] * factor if depth != 8 else block[0]
                row_pixels.append((value, value, value, 255))
            else:
                alpha = 255 if transparency is None else (transparency[block[0]] if block[0] < len(transparency) else 255)
                row_pixels.append((*palette[block[0]], alpha))
        pixels.append(row_pixels)
    return pixels


def fit_grid(pixels: list[list[tuple[int, int, int, int]]], label: str) -> list[list[tuple[int, int, int, int]]]:
    """把一张（可能带留白的）图缩到 24×24 格子：裁到图形边界、按比例居中放进方格。"""
    height, width = len(pixels), len(pixels[0])
    columns = [column for column in range(width)
               if any(pixels[row][column][3] > 8 for row in range(height))]
    rows = [row for row in range(height)
            if any(pixels[row][column][3] > 8 for column in range(width))]
    if not columns or not rows:
        fail(f"{label} 全是透明像素，没有可生成的内容。")
    left, right = columns[0], columns[-1]
    top, bottom = rows[0], rows[-1]
    art_width = right - left + 1
    art_height = bottom - top + 1
    span = max(art_width, art_height)
    offset_x = (GRID - art_width * GRID // span) // 2
    offset_y = (GRID - art_height * GRID // span) // 2
    grid = [[(0, 0, 0, 0)] * GRID for _ in range(GRID)]
    for row in range(GRID):
        source_y = top + min(art_height - 1, row * art_height // span) if row * art_height // span < art_height else None
        if source_y is None:
            continue
        for column in range(GRID):
            scaled = column * art_width // span
            if scaled >= art_width:
                continue
            grid[offset_y + row][offset_x + column] = pixels[source_y][left + scaled]
    return grid


def average_to_grid(pixels: list[list[tuple[int, int, int, int]]], label: str) -> list[list[tuple[int, int, int, int]]]:
    """不是整数倍放大的图：先按面积取平均，再归到图里最常见的几种颜色，得到像素画。"""
    height, width = len(pixels), len(pixels[0])
    columns = [column for column in range(width) if any(pixels[row][column][3] > 8 for row in range(height))]
    rows = [row for row in range(height) if any(pixels[row][column][3] > 8 for column in range(width))]
    if not columns or not rows:
        fail(f"{label} 全是透明像素，没有可生成的内容。")
    left, right, top, bottom = columns[0], columns[-1], rows[0], rows[-1]
    art_width, art_height = right - left + 1, bottom - top + 1
    span = max(art_width, art_height)
    palette: dict[tuple[int, int, int], int] = {}
    for row in range(top, bottom + 1):
        for column in range(left, right + 1):
            pixel = pixels[row][column]
            if pixel[3] > 200:
                palette[(pixel[0], pixel[1], pixel[2])] = palette.get((pixel[0], pixel[1], pixel[2]), 0) + 1
    if not palette:
        fail(f"{label} 没有足够的不透明像素。")
    # 只保留出现最多的 16 种颜色：抗锯齿的过渡色会被吸到邻近的实色上。
    common = [color for color, _ in sorted(palette.items(), key=lambda item: -item[1])[:16]]
    grid = [[(0, 0, 0, 0)] * GRID for _ in range(GRID)]
    scale_x, scale_y = art_width / span, art_height / span
    offset_x = (GRID - round(GRID * scale_x)) // 2
    offset_y = (GRID - round(GRID * scale_y)) // 2
    for row in range(GRID):
        for column in range(GRID):
            start_x = left + int(column * art_width / span)
            end_x = left + max(int((column + 1) * art_width / span), int(column * art_width / span) + 1)
            start_y = top + int(row * art_height / span)
            end_y = top + max(int((row + 1) * art_height / span), int(row * art_height / span) + 1)
            total = [0, 0, 0]
            weight = 0
            for y in range(start_y, min(end_y, height)):
                for x in range(start_x, min(end_x, width)):
                    pixel = pixels[y][x]
                    if pixel[3] < 128:
                        continue
                    total = [total[channel] + pixel[channel] for channel in range(3)]
                    weight += 1
            covered = (end_x - start_x) * (end_y - start_y)
            if weight * 2 < covered:  # 多数透明 → 这一格留空
                continue
            average = tuple(value // weight for value in total)
            nearest = min(common, key=lambda color: sum((average[channel] - color[channel]) ** 2 for channel in range(3)))
            grid[offset_y + row][offset_x + column] = (*nearest, 255)
    return grid


def load_grid(path: Path) -> list[list[tuple[int, int, int, int]]]:
    pixels = read_png(path)
    height, width = len(pixels), len(pixels[0])
    if width == height and width % GRID == 0:
        factor = width // GRID
        if factor == 1:
            return pixels
        grid = [[pixels[row * factor][column * factor] for column in range(GRID)] for row in range(GRID)]
        mixed = sum(1 for row in range(GRID) for column in range(GRID)
                    if len({pixels[row * factor + oy][column * factor + ox]
                            for oy in range(factor) for ox in range(factor)}) > 1)
        if mixed:
            print(f"  提示：{path.name} 有 {mixed} 个格子不是纯色（可能用了抗锯齿笔刷），按格子左上角取值。")
        return grid
    print(f"  提示：{path.name} 是 {width}×{height}，不是 {GRID} 的整数倍；按面积取平均并归色成像素画。")
    return average_to_grid(pixels, path.name)


# ---------------------------------------------------------------- 像素 → 矢量

def color_rectangles(mask: list[list[bool]]) -> list[tuple[int, int, int, int]]:
    """同色像素块合并成矩形，让生成的路径短一些。"""
    rectangles: list[tuple[int, int, int, int]] = []
    open_rows: dict[tuple[int, int], list[int]] = {}
    for row in range(GRID):
        spans = []
        start = None
        for column in range(GRID + 1):
            inside = column < GRID and mask[row][column]
            if inside and start is None:
                start = column
            elif not inside and start is not None:
                spans.append((start, column))
                start = None
        current = set(spans)
        for span in list(open_rows):
            if span not in current:
                first, last = open_rows.pop(span)
                rectangles.append((span[0], first, span[1] - span[0], last - first))
        for span in current:
            if span in open_rows:
                open_rows[span][1] = row + 1
            else:
                open_rows[span] = [row, row + 1]
    for span, (first, last) in open_rows.items():
        rectangles.append((span[0], first, span[1] - span[0], last - first))
    rectangles.sort(key=lambda rectangle: (rectangle[1], rectangle[0]))
    return rectangles


def grid_to_paths(grid: list[list[tuple[int, int, int, int]]], label: str) -> list[tuple[str, str]]:
    masks: dict[tuple[int, int, int], list[list[bool]]] = {}
    partial = 0
    for row in range(GRID):
        for column in range(GRID):
            red, green, blue, alpha = grid[row][column]
            if alpha < 128:
                if alpha:
                    partial += 1
                continue
            mask = masks.setdefault((red, green, blue), [[False] * GRID for _ in range(GRID)])
            mask[row][column] = True
    if partial:
        print(f"  提示：{label} 有 {partial} 个半透明像素，按不透明处理了。")
    if not masks:
        fail(f"{label} 全是透明像素，没有可生成的路径。")
    ordered = sorted(masks.items(), key=lambda item: min(
        (row, column) for row in range(GRID) for column in range(GRID) if item[1][row][column]))
    paths = []
    for (red, green, blue), mask in ordered:
        rectangles = color_rectangles(mask)
        if not rectangles:
            continue
        commands = "".join(f"M{x} {y}h{width}v{height}H{x}z" for x, y, width, height in rectangles)
        paths.append((commands, f"#{red:02x}{green:02x}{blue:02x}"))
    return paths


def vector_document(paths: list[tuple[str, str]], comment: str) -> str:
    body = "\n".join(f'  <path d="{d}" fill="{fill}" />' for d, fill in paths)
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" '
            'fill="none" shape-rendering="crispEdges">\n'
            f"  <!-- {comment} -->\n{body}\n</svg>\n")


# ---------------------------------------------------------------- 子命令

def cmd_sync(args: argparse.Namespace) -> int:
    art = read_art()
    private = private_icons()
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    VISITOR_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    published = []
    synced = set()
    for name, drawing in art.items():
        filename = drawing.path.name
        synced.add(filename)
        if filename in private:
            owners = "、".join(id for id in private[filename] if id)
            target = VISITOR_ASSETS_DIR / filename
            target.write_text(drawing.mark(
                f"由 scripts/pixel-icons.py sync 从 work/icons-svg/{filename} 同步；"
                f"这是访客应用的私有图标（{owners}），只在登录后由后端发给访客"), encoding="utf-8")
            print(f"{filename:18} → work/visitor-assets（私有，应用：{owners}）")
            leaked = PUBLIC_DIR / filename
            if leaked.exists():
                leaked.unlink()
                print(f"{'':18}   已从 frontend/public/icons-svg 删掉同名文件：私有素材不进前端")
        else:
            target = PUBLIC_DIR / filename
            target.write_text(drawing.mark(
                f"由 scripts/pixel-icons.py sync 从 work/icons-svg/{filename} 同步生成；"
                f"要改请改那份画稿再重跑 sync"), encoding="utf-8")
            print(f"{filename:18} → frontend/public/icons-svg（公开）")
            published.append(filename)
    for folder in (PUBLIC_DIR, VISITOR_ASSETS_DIR):
        for path in sorted(folder.glob("*.svg")):
            if path.name not in synced:
                path.unlink()
                print(f"{path.name:18}    已从 {folder.relative_to(ROOT)} 删除（画稿里已经没有它了）")
    needed = component_icon_map()
    known = set(needed.values())
    missing = [filename for filename in needed.values() if Path(filename).stem not in art]
    for filename in missing:
        print(f"注意：pixel-icon.tsx 要用 {filename}，但 work/icons-svg 里没有这个文件（桌面上会显示裂图）")
    unreferenced = sorted(drawing.path.name for drawing in art.values()
                          if drawing.path.name not in known and drawing.path.name not in private)
    print(f"\n公开 {len(published)} 个，私有 {len(set(synced) & set(private))} 个；"
          f"公开目录 {PUBLIC_DIR.relative_to(ROOT)}，私有目录 {VISITOR_ASSETS_DIR.relative_to(ROOT)}")
    if unreferenced:
        print(f"暂时没有人引用的画稿（已同步，先放着）：{'、'.join(unreferenced)}")
    return 0


def cmd_preview(args: argparse.Namespace) -> int:
    art = read_art()
    private = private_icons()
    cards = []
    for name, drawing in art.items():
        sizes = "".join(f'<figure><span class="icon" style="width:{size}px;height:{size}px">{drawing.text}</span>'
                        f"<figcaption>{size}px · {label}</figcaption></figure>" for size, label in REAL_SIZES)
        badge = f'<span class="badge">{drawing.kind}</span>'
        if drawing.path.name in private:
            badge += '<span class="badge private">私有，登录后才发</span>'
        elif drawing.path.name not in component_icon_map().values():
            badge += '<span class="badge unused">暂无引用</span>'
        cards.append(f'<article><h2>{name}{badge}</h2>'
                     f'<div class="row"><figure><span class="icon" style="width:192px;height:192px">{drawing.text}</span>'
                     f"<figcaption>{drawing.path.name}</figcaption></figure></div>"
                     f'<div class="row sizes">{sizes}</div></article>')
    out = PREVIEW if not args.out else Path(args.out).resolve()
    out.write_text(f"""<!doctype html>
<meta charset="utf-8">
<title>图标预览 · work/icons-svg</title>
<style>
  body {{ margin: 0; padding: 22px; background: #b8bbae; color: #34423b;
    font: 13px/1.5 Consolas, "PingFang SC", "Microsoft YaHei", monospace; }}
  h1 {{ font-size: 17px; }} h2 {{ display: flex; align-items: center; gap: 8px; font-size: 12px; margin: 0 0 8px; }}
  p.note {{ background: #e9eddd; border-left: 2px solid #94a181; padding: 9px 11px; }}
  .grid {{ display: flex; flex-wrap: wrap; gap: 14px; }}
  article {{ background: #e5e1cf; border: 1px solid #6d7668; padding: 11px 12px; box-shadow: 3px 3px 0 #7d857780; }}
  .row {{ display: flex; align-items: flex-end; gap: 14px; }}
  .row.sizes {{ margin-top: 9px; }}
  figure {{ margin: 0; text-align: center; }}
  figcaption {{ margin-top: 5px; font-size: 9px; color: #69735f; }}
  .icon {{ display: block; background-image:
    linear-gradient(45deg, #cfd3c4 25%, transparent 25%), linear-gradient(-45deg, #cfd3c4 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #cfd3c4 75%), linear-gradient(-45deg, transparent 75%, #cfd3c4 75%);
    background-size: 8px 8px; background-position: 0 0, 0 4px, 4px -4px, -4px 0; }}
  .icon svg {{ display: block; width: 100%; height: 100%; }}
  .badge {{ font-size: 8px; font-weight: 400; padding: 2px 5px; border: 1px solid #9aa48c; background: #eef0e0; color: #6f7d61; }}
  .badge.private {{ color: #8b4c3b; border-color: #c8a795; background: #f4e4d9; }}
  .badge.unused {{ color: #7a6a4a; border-color: #c9bd96; background: #f2ecd8; }}
</style>
<h1>图标预览 · work/icons-svg</h1>
<p class="note">画稿就是 work/icons-svg 里的 SVG 文件，这个页面只用来对照，改完画稿重跑 preview 即可。<br>
「私有」的画稿不会进前端，只在访客登录后由后端按授权发给访客。放大镜看细节时可以放大浏览器缩放。</p>
<div class="grid">{''.join(cards)}</div>
""", encoding="utf-8")
    print(f"已生成 {out.relative_to(ROOT)}（用浏览器打开即可）")
    return 0


def cmd_export(args: argparse.Namespace) -> int:
    art = read_art()
    target = Path(args.dir).resolve() if args.dir else PNG_DIR
    target.mkdir(parents=True, exist_ok=True)
    written = 0
    for name, drawing in art.items():
        png = target / f"{name}.png"
        if png.exists() and not args.force:
            print(f"跳过 {png.name}（已存在；要按画稿重画加 --force）")
            continue
        if drawing.image:
            png.write_bytes(drawing.image)
            print(f"{png.name:18} ← {drawing.path.name} 里内嵌的那张 PNG（原尺寸，改完用 build 变回矢量像素）")
        else:
            grid = rasterize(drawing)
            write_png(png, grid)
            if args.scale > 1:
                write_png(target / f"{name}@{args.scale}x.png", grid, args.scale)
            print(f"{png.name:18} ← {drawing.path.name} 的矢量路径（{GRID}×{GRID}）")
        written += 1
    print(f"\n已导出 {written} 个到 {target.relative_to(ROOT)}；改完运行 build 写回画稿")
    return 0


def cmd_build(args: argparse.Namespace) -> int:
    source = Path(args.dir).resolve() if args.dir else PNG_DIR
    if not source.is_dir():
        fail(f"{source} 不存在，先运行 export。")
    art = read_art()
    written = 0
    for png in sorted(source.glob("*.png")):
        if "@" in png.stem:
            continue
        name = png.stem
        drawing = art.get(name)
        if drawing is None:
            print(f"跳过 {png.name}：work/icons-svg 里没有 {name}.svg")
            continue
        if drawing.image is not None and png.read_bytes() == drawing.image:
            print(f"跳过 {name}：PNG 还是画稿里内嵌的那张，没改过")
            continue
        grid = load_grid(png)
        if not drawing.image and grid == rasterize(drawing):
            print(f"跳过 {name}：PNG 和画稿一致")
            continue
        converted = "（画稿里的内嵌 PNG 会被换成 24×24 的矢量像素）" if drawing.image else ""
        paths = grid_to_paths(grid, png.name)
        document = vector_document(paths, f"{drawing.path.name}：由 scripts/pixel-icons.py build 从 {png.name} 生成；"
                                          f"24×24 像素网格，图形已裁到边界并居中")
        if args.dry_run:
            print(f"{name}: 会写入 {len(paths)} 条路径（来自 {png.name}）{converted}")
            continue
        drawing.path.write_text(document, encoding="utf-8")
        print(f"写入 {drawing.path.name}（来自 {png.name}，{len(paths)} 条路径）{converted}")
        written += 1
    if args.dry_run:
        print("--dry-run：没有改动文件。")
    elif written:
        print("\n画稿已更新；重跑 sync 才会同步到站点。")
    else:
        print("没有需要写入的内容。")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="像素图标：画稿同步与 PNG 往返工具")
    parser.add_argument("--dir", help=f"PNG 目录（默认 {PNG_DIR.relative_to(ROOT)}）")
    commands = parser.add_subparsers(dest="command", required=True)
    sync = commands.add_parser("sync", help="画稿 → 站点（公开目录 + 访客私有素材）")
    sync.set_defaults(handler=cmd_sync)
    preview = commands.add_parser("preview", help="生成尺寸对照页")
    preview.add_argument("--out", help=f"输出文件（默认 {PREVIEW.relative_to(ROOT)}）")
    preview.set_defaults(handler=cmd_preview)
    export = commands.add_parser("export", help="画稿 → PNG")
    export.add_argument("--force", action="store_true", help="覆盖已存在的 PNG")
    export.add_argument("--scale", type=int, default=8, help="矢量图标另存几倍放大图（默认 8，0 表示不存）")
    export.set_defaults(handler=cmd_export)
    build = commands.add_parser("build", help="PNG → 画稿")
    build.add_argument("--dry-run", action="store_true", help="只显示会改哪些画稿，不写文件")
    build.set_defaults(handler=cmd_build)
    args = parser.parse_args()
    return args.handler(args)


if __name__ == "__main__":
    raise SystemExit(main())
