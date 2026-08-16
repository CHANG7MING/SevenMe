from collections import deque
from pathlib import Path
from PIL import Image

source = Path(r"C:\Users\changan\.codex\generated_images\01a0070a-8bbb-7ec1-bf60-aece1566962c\exec-bc3d2186-c186-4575-b5b2-30030a29ee68.png")
target = Path(r"C:\Users\changan\Desktop\Aboutme\SevenMediaStudio-readme-hero\assets\readme\source\hero-subject.png")

image = Image.open(source).convert("RGBA")
width, height = image.size
pixels = image.load()
visited = bytearray(width * height)
queue = deque()

def candidate(x: int, y: int) -> bool:
    r, g, b, _ = pixels[x, y]
    return min(r, g, b) >= 205 and max(r, g, b) - min(r, g, b) <= 10

def add(x: int, y: int) -> None:
    index = y * width + x
    if not visited[index] and candidate(x, y):
        visited[index] = 1
        queue.append((x, y))

for x in range(width):
    add(x, 0)
    add(x, height - 1)
for y in range(height):
    add(0, y)
    add(width - 1, y)

while queue:
    x, y = queue.popleft()
    if x:
        add(x - 1, y)
    if x + 1 < width:
        add(x + 1, y)
    if y:
        add(x, y - 1)
    if y + 1 < height:
        add(x, y + 1)

for y in range(height):
    for x in range(width):
        if visited[y * width + x]:
            r, g, b, _ = pixels[x, y]
            low = min(r, g, b)
            alpha = 0 if low >= 232 else round((232 - low) / 27 * 210)
            pixels[x, y] = (r, g, b, max(0, min(210, alpha)))

target.parent.mkdir(parents=True, exist_ok=True)
image.save(target)
print(f"saved {target} ({width}x{height})")
