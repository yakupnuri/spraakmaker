from PIL import Image

def process_mascot():
    # Orijinal resmi aç
    img = Image.open("public/ai-mascot-raw.png").convert("RGBA")
    width, height = img.size
    print(f"Orijinal boyut: {width}x{height}")
    
    # Arka plan rengini sol üst pikselden al
    bg_color = img.getpixel((0, 0))
    print(f"Sol üst piksel arka plan rengi: {bg_color}")
    
    # Arka plan rengine yakın olan pikselleri transparan yap
    data = img.getdata()
    new_data = []
    
    # Tolerans eşiği (renk benzerliği toleransı)
    tolerance = 25
    
    for item in data:
        r, g, b, a = item
        # bg_color ile olan mutlak fark
        diff_r = abs(r - bg_color[0])
        diff_g = abs(g - bg_color[1])
        diff_b = abs(b - bg_color[2])
        
        # Arka plan rengine yakınsa veya beyaza aşırı yakınsa transparan yap
        is_bg = diff_r < tolerance and diff_g < tolerance and diff_b < tolerance
        is_white = r > 248 and g > 248 and b > 248
        
        if is_bg or is_white:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Karakterin etrafındaki boş (transparan) pikselleri atarak tam sınırları bul
    bbox = img.getbbox()
    if bbox:
        final_img = img.crop(bbox)
        print(f"Otomatik kırpma sınırları: {bbox}")
    else:
        final_img = img
        print("Sınırlar bulunamadı.")
        
    final_img.save("public/ai-mascot.png", "PNG")
    print(f"Yeni maskot başarıyla kaydedildi: public/ai-mascot.png ({final_img.size[0]}x{final_img.size[1]})")

if __name__ == "__main__":
    process_mascot()
