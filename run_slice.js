const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Let's use python3 to slice the image now that it is inside the workspace
const pythonScript = `
import os
from PIL import Image
img_path = "/Volumes/Current Projects/yazilim/dil öğrenme büyük proje/spraakmaker/public/domain.png"
img = Image.open(img_path)
width, height = img.size
print(f"Image dimensions: {width}x{height}")
slice_height = height // 12
out_dir = "/Volumes/Current Projects/yazilim/dil öğrenme büyük proje/spraakmaker/public"
for i in range(12):
    box = (0, i * slice_height, width, min((i + 1) * slice_height, height))
    slice_img = img.crop(box)
    slice_img.save(os.path.join(out_dir, f"slice_{i}.png"))
print("12 slices saved successfully.")
`;

fs.writeFileSync('/Volumes/Current Projects/yazilim/dil öğrenme büyük proje/spraakmaker/slice.py', pythonScript);
try {
  const out = execSync('python3 "/Volumes/Current Projects/yazilim/dil öğrenme büyük proje/spraakmaker/slice.py"');
  console.log(out.toString());
} catch (e) {
  console.error(e.toString());
}
