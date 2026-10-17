# เพิ่มลายใหม่ · Adding patterns

สำหรับนักออกแบบลายของวิสาหกิจชุมชนป่าต้นผึ้ง · For the designer sending patterns
to the Pa Ton Phueng customizer.

---

## ภาษาไทย

### 1. ส่งไฟล์มาแบบไหน

| หัวข้อ | ค่าที่ต้องการ |
| --- | --- |
| ไฟล์ | PNG หรือ JPG (WebP, TIFF ก็ได้) |
| ขนาด | ด้านยาวอย่างน้อย 1600 px — ส่งใหญ่กว่านี้ได้ เช่น 2480×3508 |
| สี | sRGB |
| พื้นหลัง | ทึบ ไม่ต้องโปร่งใส (ยกเว้นลายใบไม้เดี่ยว ๆ ที่ต้องตัดพื้นหลังออก) |
| ชื่อไฟล์ | ชื่อลายเป็นภาษาอังกฤษตัวเล็ก เช่น `lemons.png`, `pastel stripes.png` |

**ชื่อไฟล์สำคัญ** เพราะสคริปต์จะใช้ชื่อไฟล์เป็น id ของลายในระบบ
(`Pastel stripes.png` → `pastel-stripes`) ไม่ต้องใส่วันที่หรือเลขเวอร์ชัน

ไฟล์ต้นฉบับความละเอียดสูง **ไม่ต้องเก็บเข้าโปรเจกต์** เก็บไว้กับนักออกแบบ
ระบบจะใช้ไฟล์ที่ย่อแล้วเท่านั้น

### 2. ลายต่อเนื่อง หรือ ลายวางครั้งเดียว

มีสองแบบ และต้องบอกให้ชัดว่าลายที่ส่งมาเป็นแบบไหน

- **ลายต่อเนื่อง (repeat)** — ลายที่ปูซ้ำไปทั้งผืนผ้า เช่น ลายทาง ลายมะนาว ลายดาว
  ขอบซ้ายต้องต่อกับขอบขวา และขอบบนต้องต่อกับขอบล่างได้พอดี
- **ลายวางครั้งเดียว (placement)** — ภาพเดียวที่เต็มพื้นที่พิมพ์ เช่น ลายหัวใจ ลายวงกลม
  ไม่มีการปูซ้ำ ไม่ต้องสนใจเรื่องขอบ ระบบจะย่อ/ขยายให้เต็มพื้นที่เองและตัดส่วนที่เกินออก

### 3. เช็กลิสต์ลายต่อเนื่อง

- [ ] ขอบซ้าย–ขวา ลายวิ่งต่อกันสนิท
- [ ] ขอบบน–ล่าง ลายวิ่งต่อกันสนิท
- [ ] ไม่มีเส้นขอบ กรอบ หรือแถบสีที่ขอบภาพ (เช่น แถบสีน้ำตาลบนล่างของลายดาว —
      แบบนั้นจะเห็นเป็นเส้นเมื่อปูซ้ำ)
- [ ] ลวดลายกระจายทั่วทั้งภาพ ไม่กองอยู่กลางภาพ

### 4. ขนาดลาย (repeatUnits)

ระบบวัดสินค้าทุกชิ้นด้วย "หน่วย" เดียวกัน ภาพสินค้าทั้งภาพ = 1000 หน่วย

| พื้นที่พิมพ์ | ขนาดโดยประมาณ |
| --- | --- |
| ผ้าคลุมไหล่ (ทั้งผืน) | 660 × 464 หน่วย |
| ผ้าเช็ดหน้า (ทั้งผืน) | 580 × 580 หน่วย |
| แก้ว / กระบอกน้ำ | ~260 × 290 หน่วย |

`repeatUnits` คือ **ความกว้างของลาย 1 รอบ** คิดเป็นหน่วย ส่วนความสูงระบบคำนวณ
ตามสัดส่วนภาพให้เอง

- `500` = ลายใหญ่ ปูได้ประมาณ 1.3 รอบบนผ้าคลุมไหล่ (ค่าที่ลายชุดแรกใช้)
- `250` = ลายเล็กลงครึ่งหนึ่ง ปูได้ประมาณ 2.6 รอบ
- ลายวางครั้งเดียวไม่ต้องใส่ค่านี้

> ค่านี้เปลี่ยนทีหลังได้ **แต่** งานออกแบบที่ลูกค้าบันทึกไว้แล้วจะขนาดเปลี่ยนตามไปด้วย
> จึงควรตัดสินใจตอนเพิ่มลายครั้งแรก

### 5. รันสคริปต์แปลงไฟล์

วางไฟล์ทั้งหมดไว้ในโฟลเดอร์เดียว แล้วรัน

```bash
npm run catalog:import -- "../Design Pattern"
```

สคริปต์จะ

1. ย่อภาพให้ด้านยาว 1600 px แปลงเป็น WebP ขนาดไม่เกิน 600 KB
2. สร้างภาพตัวอย่างเล็ก (240 px) สำหรับหน้าเลือกลาย
3. เขียนไฟล์ลง `public/catalog/patterns/community/`
4. พิมพ์ขนาดไฟล์ และ **คะแนนรอยต่อ** ของแต่ละลาย

```
lemons.png  →  lemons
    2480×3508 2625 KB  →  1131×1600 45 KB at q82, thumb 170×240 2 KB
    seam  left|right 3.9 (grain 0.2)   top|bottom 5.7 (grain 0.2)
    WARNING: the left|right and top|bottom edges do not meet …
```

- ตัวเลขแรก = ขอบสองด้านต่างกันแค่ไหน (0 = ต่อกันสนิท, 100 = ขาวชนดำ)
- `grain` = ความต่างของเส้นข้าง ๆ กันภายในภาพ ใช้เทียบว่าตัวเลขแรกมากผิดปกติไหม
- คำเตือนนี้ **ไม่ใช่ error** ลายวางครั้งเดียวมีคำเตือนได้เป็นปกติ
  แต่ถ้าเป็นลายที่ตั้งใจให้ปูซ้ำ แปลว่าต้อง export ใหม่ให้ขอบต่อกัน

### 6. เพิ่มลายลงแคตตาล็อก

สคริปต์จะพิมพ์ร่าง JSON ให้ เอาไปวางต่อใน `public/catalog/patterns.json` แล้วแก้ชื่อ
กับเครดิต

```json
{
  "id": "lemons",
  "name": { "th": "ลายมะนาว", "en": "Lemons" },
  "kind": "tile",
  "src": "/catalog/patterns/community/lemons.webp",
  "thumbnail": "/catalog/patterns/community/lemons-thumb.webp",
  "recolorable": false,
  "repeatUnits": 500,
  "defaultColors": [],
  "tags": ["community", "fruit"],
  "source": {
    "type": "community",
    "credit": "ชื่อผู้ออกแบบ",
    "license": "Community-owned — terms TBC"
  }
}
```

- ลายวางครั้งเดียว: ตัด `repeatUnits` ออก แล้วใส่ `"fit": "area"` แทน
- `recolorable: false` เสมอสำหรับลายที่เป็นภาพ (สีฝังอยู่ในภาพแล้ว ระบบจึง
  ไม่แสดงตัวเลือกสีจากใบไม้ให้)
- อยากจำกัดว่าลายนี้ใช้กับสินค้าไหนได้บ้าง ใส่
  `"restrictTo": { "lines": ["fabric"] }` หรือ `"restrictTo": { "productIds": ["leaf-plate"] }`
  ถ้าไม่ใส่ = ใช้ได้กับทุกสินค้า

ถ้ากรอกผิด เว็บจะขึ้นข้อความบอกชื่อไฟล์และ id ของรายการที่ผิด เช่น
`patterns.json: 1 problem — item "lemons" repeatUnits: …` แก้ตรงนั้นแล้วรีเฟรช

ดูลายทั้งหมดได้ที่ `npm run dev` แล้วเปิด `/dev/catalog`

---

## English

### 1. What to send

| | |
| --- | --- |
| Format | PNG or JPG (WebP and TIFF also work) |
| Size | long edge at least 1600 px — larger is fine, e.g. 2480×3508 |
| Colour | sRGB |
| Background | opaque; only a single cut-out leaf motif needs transparency |
| File name | the pattern's name in lowercase English: `lemons.png` |

**The file name matters**: it becomes the pattern's id (`Pastel stripes.png` →
`pastel-stripes`). No dates or version numbers.

The full-resolution originals are **not** kept in the repository. They stay
with the designer; the site only ever serves the converted files.

### 2. Repeat or placement

- **Repeat** — a surface pattern tiled across the cloth (stripes, lemons,
  stars). Its left edge has to continue into its right edge, and its top into
  its bottom.
- **Placement** — one picture that fills the print area once (hearts,
  bubbles). No tiling, so the edges do not matter: the site scales it to cover
  the area and trims the overflow.

### 3. Seamless checklist

- [ ] the drawing continues across the left/right join
- [ ] it continues across the top/bottom join
- [ ] no border, frame or band of colour at the edge (the brown bands above and
      below the stars pattern are exactly what shows up as a line)
- [ ] the motifs are spread over the whole sheet, not gathered in the middle

### 4. Repeat size (`repeatUnits`)

Every product is measured in the same units: a whole product mockup is 1000
units across.

| Print area | Roughly |
| --- | --- |
| Cotton shawl (whole cloth) | 660 × 464 units |
| Handkerchief (whole cloth) | 580 × 580 units |
| Mug / tumbler wrap | ~260 × 290 units |

`repeatUnits` is **the width of one repeat** in those units; the height follows
from the file's proportions.

- `500` — a large print, about 1.3 repeats across a shawl. What the first seven
  patterns use.
- `250` — half the size, about 2.6 repeats across.
- A placement pattern has no repeat size.

> It can be changed later, **but** designs people have already saved will
> change size with it, so it is worth deciding when the pattern is added.

### 5. Run the import

Put the files in one folder and run:

```bash
npm run catalog:import -- "../Design Pattern"
```

It resizes each one to a 1600 px long edge, writes a WebP under 600 KB and a
240 px thumbnail into `public/catalog/patterns/community/`, and prints the
sizes and a **seam score**:

```
lemons.png  →  lemons
    2480×3508 2625 KB  →  1131×1600 45 KB at q82, thumb 170×240 2 KB
    seam  left|right 3.9 (grain 0.2)   top|bottom 5.7 (grain 0.2)
    WARNING: the left|right and top|bottom edges do not meet …
```

- the first number is how different the two edges are (0 = they meet exactly,
  100 = black against white)
- `grain` is how different two neighbouring lines inside the picture are — the
  yardstick the first number is read against
- it is **never an error**. A placement pattern is expected to warn; a pattern
  meant to repeat needs a seamless export instead.

### 6. Add it to the catalog

The script prints an entry to paste into `public/catalog/patterns.json`:

```json
{
  "id": "lemons",
  "name": { "th": "ลายมะนาว", "en": "Lemons" },
  "kind": "tile",
  "src": "/catalog/patterns/community/lemons.webp",
  "thumbnail": "/catalog/patterns/community/lemons-thumb.webp",
  "recolorable": false,
  "repeatUnits": 500,
  "defaultColors": [],
  "tags": ["community", "fruit"],
  "source": {
    "type": "community",
    "credit": "Designer's name",
    "license": "Community-owned — terms TBC"
  }
}
```

- placement pattern: drop `repeatUnits` and add `"fit": "area"`
- `recolorable` is always `false` for a photographed pattern — its colours are
  printed into the file, so the leaf-dye picker hides itself for it
- to keep a pattern off some products, add
  `"restrictTo": { "lines": ["fabric"] }` or
  `"restrictTo": { "productIds": ["leaf-plate"] }`. Leave it out and the
  pattern prints on everything.

A mistake in the JSON shows as an error naming the file and the entry, e.g.
`patterns.json: 1 problem — item "lemons" repeatUnits: …`. Fix it and reload.

`npm run dev`, then `/dev/catalog`, shows every entry at once.
