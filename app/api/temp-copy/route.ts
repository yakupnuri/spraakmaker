import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const src = "/Users/abdulhamit/.gemini/antigravity-ide/brain/46396629-14c6-4f08-8fb7-3dcb904e7ec7/media__1780506993118.png";
    const dest = "/Volumes/Current Projects/yazilim/dil öğrenme büyük proje/spraakmaker/public/domain.png";
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      
      const { execSync } = require("child_process");
      const pythonScript = `
import os
from PIL import Image
img_path = "${dest}"
img = Image.open(img_path)
width, height = img.size
slice_height = height // 12
out_dir = "/Volumes/Current Projects/yazilim/dil öğrenme büyük proje/spraakmaker/public"
for i in range(12):
    box = (0, i * slice_height, width, min((i + 1) * slice_height, height))
    slice_img = img.crop(box)
    slice_img.save(os.path.join(out_dir, f"slice_{i}.png"))
`;
      fs.writeFileSync("/Volumes/Current Projects/yazilim/dil öğrenme büyük proje/spraakmaker/slice.py", pythonScript);
      execSync('/opt/homebrew/bin/python3 "/Volumes/Current Projects/yazilim/dil öğrenme büyük proje/spraakmaker/slice.py"');
      
      return NextResponse.json({ success: true, message: "Copied and sliced successfully" });
    } else {
      return NextResponse.json({ success: false, error: "Source file not found" });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
