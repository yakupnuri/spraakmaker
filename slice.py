
import os
from PIL import Image
img_path = "/Volumes/Current Projects/yazilim/dil öğrenme büyük proje/spraakmaker/public/domain.png"
img = Image.open(img_path)
width, height = img.size
slice_height = height // 12
out_dir = "/Volumes/Current Projects/yazilim/dil öğrenme büyük proje/spraakmaker/public"
for i in range(12):
    box = (0, i * slice_height, width, min((i + 1) * slice_height, height))
    slice_img = img.crop(box)
    slice_img.save(os.path.join(out_dir, f"slice_{i}.png"))
