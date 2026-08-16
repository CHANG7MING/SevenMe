from collections import deque
from pathlib import Path
import sys

from PIL import Image


def is_background(pixel: tuple[int, int, int]) -> bool:
    red, green, blue = pixel
    return min(red, green, blue) >= 235 and max(red, green, blue) - min(red, green, blue) <= 10


source = Path(sys.argv[1])
destination = Path(sys.argv[2])
image = Image.open(source).convert("RGBA")
width, height = image.size
pixels = image.load()
visited = bytearray(width * height)
queue: deque[tuple[int, int]] = deque()


def enqueue(x: int, y: int) -> None:
    index = y * width + x
    if visited[index] or not is_background(pixels[x, y][:3]):
        return
    visited[index] = 1
    queue.append((x, y))


for x in range(width):
    enqueue(x, 0)
    enqueue(x, height - 1)
for y in range(height):
    enqueue(0, y)
    enqueue(width - 1, y)

while queue:
    x, y = queue.popleft()
    if x:
        enqueue(x - 1, y)
    if x + 1 < width:
        enqueue(x + 1, y)
    if y:
        enqueue(x, y - 1)
    if y + 1 < height:
        enqueue(x, y + 1)

transparent = 0
for y in range(height):
    for x in range(width):
        if visited[y * width + x]:
            red, green, blue, _ = pixels[x, y]
            pixels[x, y] = (red, green, blue, 0)
            transparent += 1

# Recover antialiased edge alpha from the nearest removed checker pixel.
# This removes the light fringe on dark backgrounds without keying any hue.
edge_updates: list[tuple[int, int, tuple[int, int, int, int]]] = []
for y in range(1, height - 1):
    for x in range(1, width - 1):
        red, green, blue, alpha = pixels[x, y]
        if alpha == 0:
            continue
        background = None
        for ny in range(y - 1, y + 2):
            for nx in range(x - 1, x + 2):
                neighbor = pixels[nx, ny]
                if neighbor[3] == 0:
                    background = neighbor[:3]
                    break
            if background:
                break
        if not background:
            continue
        estimates = []
        for value, backdrop in zip((red, green, blue), background):
            if value < backdrop and backdrop:
                estimates.append((backdrop - value) / backdrop)
            elif value > backdrop and backdrop < 255:
                estimates.append((value - backdrop) / (255 - backdrop))
        recovered = max(estimates, default=1.0)
        if recovered >= 0.96:
            continue
        recovered = max(0.08, recovered)
        recovered_alpha = round(recovered * 255)
        channels = []
        for value, backdrop in zip((red, green, blue), background):
            foreground = round((value - (1 - recovered) * backdrop) / recovered)
            channels.append(max(0, min(255, foreground)))
        edge_updates.append((x, y, (*channels, recovered_alpha)))

for x, y, value in edge_updates:
    pixels[x, y] = value

destination.parent.mkdir(parents=True, exist_ok=True)
image.save(destination, optimize=True)
print({"width": width, "height": height, "transparent": transparent, "antialiased_edges": len(edge_updates)})
