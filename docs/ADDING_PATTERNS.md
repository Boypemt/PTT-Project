# เพิ่มลายใหม่ · Adding patterns

สำหรับนักออกแบบลายของวิสาหกิจชุมชนป่าต้นผึ้ง · For the designer sending patterns
to the Pa Ton Phueng customizer.

> **สามขั้นตอน · Three steps**
>
> 1. วางไฟล์ไว้ในโฟลเดอร์ลาย · put the file in the artwork folder
> 2. เพิ่ม/แก้รายการใน `patterns.manifest.json` · add or edit its manifest entry
> 3. `npm run catalog:import -- "../Design Pattern"` แล้วเปิด PR · run it, open a PR

---

## ภาษาไทย

### โฟลเดอร์ลายหน้าตาเป็นแบบนี้

```
Design Pattern/
  patterns.manifest.json     ← รายการลายทั้งหมด (แก้ไฟล์นี้)
  Untitled_Artwork 2.png     ← ไฟล์ต้นฉบับ ชื่ออะไรก็ได้
  Untitled_Artwork 6.png
  …
```

โฟลเดอร์นี้ **ไม่ได้อยู่ในโปรเจกต์** ไฟล์ต้นฉบับความละเอียดสูงเก็บไว้กับนักออกแบบ
เว็บจะใช้เฉพาะไฟล์ที่ย่อแล้วเท่านั้น

ยังไม่มี `patterns.manifest.json` ให้คัดลอก
[`docs/patterns.manifest.example.json`](patterns.manifest.example.json) ไปวางไว้แล้วเปลี่ยนชื่อ

### 1. วางไฟล์

| หัวข้อ | ค่าที่ต้องการ |
| --- | --- |
| ไฟล์ | PNG หรือ JPG (WebP, TIFF ก็ได้) |
| ขนาด | ด้านยาวอย่างน้อย 1600 px — ส่งใหญ่กว่านี้ได้ เช่น 2480×3508 |
| สี | sRGB |
| พื้นหลัง | ทึบ ไม่ต้องโปร่งใส (ยกเว้นลายใบไม้เดี่ยว ๆ ที่ต้องตัดพื้นหลังออก) |
| ชื่อไฟล์ | ตั้งชื่ออะไรก็ได้ — ชื่อไฟล์ไม่มีผลกับระบบแล้ว |

### 2. แก้ manifest

หนึ่งลาย = หนึ่งรายการ

```json
{
  "file": "Untitled_Artwork 2.png",
  "id": "lemons",
  "name": { "th": "ลายมะนาว", "en": "Lemons" },
  "repeatUnits": 500,
  "tags": ["fruit"],
  "credit": "ชื่อผู้ออกแบบ"
}
```

| คีย์ | ความหมาย |
| --- | --- |
| `file` | ชื่อไฟล์ในโฟลเดอร์นี้ |
| `id` | **ชื่อเฉพาะของลาย** ตัวเล็ก-ขีดกลาง เช่น `pastel-stripes` |
| `name` | ชื่อที่แสดงบนเว็บ ไทย + อังกฤษ |
| `fit` | ใส่ `"area"` ถ้าเป็นลายวางครั้งเดียว ไม่ใส่ = ลายต่อเนื่อง |
| `repeatUnits` | ขนาดลาย 1 รอบ (ดูข้อ 4) ลายวางครั้งเดียวไม่ต้องใส่ |
| `recolor` | ใส่ `"mask"` ถ้าเป็นลายเส้นบนพื้นขาว (ดูข้อ 6) |
| `defaultColors` | สีเริ่มต้นของลายเส้น ใส่ได้สีเดียว (ใช้คู่กับ `recolor`) |
| `restrictTo` | จำกัดสินค้าที่ใช้ลายนี้ได้ ไม่ใส่ = ใช้ได้ทุกชิ้น |
| `tags` | คำค้น ระบบเติม `community` ให้เอง |
| `credit` | ชื่อผู้ออกแบบที่จะใช้เครดิต |

**`id` คือชื่อตัวจริงของลาย** ถ้าส่งไฟล์เดิมที่แก้แล้วมาใหม่ ให้ใช้ `id` เดิม — งานออกแบบ
ที่ลูกค้าบันทึกไว้จะยังเป็นลายเดิม เปลี่ยน `id` หรือ **ลบรายการออก = ลบลายนั้นทิ้ง**
และงานออกแบบที่เคยใช้ลายนั้นจะเสียเลเยอร์ไป (สคริปต์จะเตือนตอนรัน)

ไฟล์ JSON เขียนคอมเมนต์ไม่ได้ แต่คีย์ที่ขึ้นต้นด้วย `_` ระบบจะข้ามให้ เช่น `"_note": "…"`

### 3. รันคำสั่งเดียว

```bash
npm run catalog:import -- "../Design Pattern"
```

สคริปต์จะย่อภาพ → แปลงเป็น WebP (ไม่เกิน 600 KB) → สร้างภาพตัวอย่าง 240 px →
อัปเดต `public/catalog/patterns.json` ให้เอง แล้วสรุปว่าอะไรเปลี่ยนบ้าง

```
  + lemons  added
  ~ stars  updated (image)
  = marble-swirl  unchanged
  - old-pattern  removed
```

เสร็จแล้ว `git add -A`, commit, เปิด PR ตามปกติ

- รันซ้ำโดยไม่เปลี่ยนอะไร = ไม่มีอะไรเปลี่ยน ปลอดภัยเสมอ
- ชื่อไฟล์ที่เว็บใช้จะมีรหัสของภาพต่อท้าย (`lemons.a271f856.webp`) แก้ภาพแล้วรหัสเปลี่ยน
  เบราว์เซอร์จึงไม่เอาภาพเก่าใน cache มาแสดง
- ลายที่เป็นภาพถ่าย/ภาพวาดสี จะ **เลือกสีจากใบไม้ไม่ได้** (สีฝังอยู่ในภาพแล้ว)
  เว็บจะซ่อนตัวเลือกสีให้เอง — ลายเส้นบนพื้นขาวเลือกสีได้ ดูข้อ 6

### 4. ขนาดลาย (repeatUnits)

ระบบวัดสินค้าทุกชิ้นด้วย "หน่วย" เดียวกัน ภาพสินค้าทั้งภาพ = 1000 หน่วย

| พื้นที่พิมพ์ | ขนาดโดยประมาณ |
| --- | --- |
| ผ้าคลุมไหล่ (ทั้งผืน) | 660 × 464 หน่วย |
| ผ้าเช็ดหน้า (ทั้งผืน) | 580 × 580 หน่วย |
| แก้ว / กระบอกน้ำ | ~260 × 290 หน่วย |

`repeatUnits` คือ **ความกว้างของลาย 1 รอบ** ส่วนความสูงระบบคำนวณตามสัดส่วนภาพให้เอง

- `500` = ลายใหญ่ ปูได้ประมาณ 1.3 รอบบนผ้าคลุมไหล่ (ค่าที่ลายชุดแรกใช้)
- `250` = ลายเล็กลงครึ่งหนึ่ง ปูได้ประมาณ 2.6 รอบ

> ค่านี้เปลี่ยนทีหลังได้ **แต่** งานออกแบบที่ลูกค้าบันทึกไว้แล้วจะขนาดเปลี่ยนตามไปด้วย

### 5. ลายต่อเนื่อง vs ลายวางครั้งเดียว

- **ลายต่อเนื่อง** — ปูซ้ำทั้งผืน เช่น ลายทาง ลายมะนาว ขอบซ้ายต้องต่อกับขอบขวา
  และขอบบนต้องต่อกับขอบล่าง
- **ลายวางครั้งเดียว** (`"fit": "area"`) — ภาพเดียวเต็มพื้นที่พิมพ์ เช่น ลายหัวใจ ลายวงกลม
  ไม่ต้องสนใจเรื่องขอบ ระบบจะขยายให้เต็มพื้นที่และตัดส่วนเกินออก

> ลายวางครั้งเดียวมีภาพเทียบ (visual test) ของตัวเองใน `e2e/visual.spec.ts`
> ตอนนี้ในแคตตาล็อกไม่มีลายแบบนี้แล้ว ภาพเทียบจึงถูกถอดออก — **ลาย `fit: "area"`
> ลายถัดไปที่เพิ่มเข้ามา ต้องเพิ่มภาพเทียบนั้นกลับไปด้วย**

**เช็กลิสต์ลายต่อเนื่อง**

- [ ] ขอบซ้าย–ขวา ลายวิ่งต่อกันสนิท
- [ ] ขอบบน–ล่าง ลายวิ่งต่อกันสนิท
- [ ] ไม่มีเส้นขอบ กรอบ หรือแถบสีที่ขอบภาพ (เช่น แถบสีน้ำตาลบนล่างของลายดาว)
- [ ] ลวดลายกระจายทั่วทั้งภาพ ไม่กองอยู่กลางภาพ

สคริปต์จะให้ **คะแนนรอยต่อ** ของทุกลาย

```
    seam  left|right 3.9 (grain 0.2)   top|bottom 5.7 (grain 0.2)
    WARNING: the left|right and top|bottom edges do not meet …
```

- ตัวเลขแรก = ขอบสองด้านต่างกันแค่ไหน (0 = ต่อกันสนิท, 100 = ขาวชนดำ)
- `grain` = ความต่างของเส้นข้าง ๆ กันภายในภาพ ใช้เทียบว่าตัวเลขแรกมากผิดปกติไหม
- คำเตือนนี้ **ไม่ใช่ error** ลายวางครั้งเดียวมีคำเตือนได้เป็นปกติ
  แต่ถ้าเป็นลายที่ตั้งใจให้ปูซ้ำ แปลว่าต้อง export ใหม่ให้ขอบต่อกัน
- คะแนนจะขึ้นเฉพาะลายที่เพิ่งเพิ่มหรือเพิ่งแก้ภาพ (ลายเดิมไม่ต้องแปลงใหม่)

### 6. ลายเส้นที่เปลี่ยนสีได้ (`recolor: "mask"`)

ลายที่วาดเป็น **เส้นสีเข้มบนพื้นขาว** ใส่ `"recolor": "mask"` ได้ ระบบจะอ่าน
"ความเข้ม" ของภาพเป็นความทึบ — เส้น = ทึบ พื้นขาว = ใส — แล้วทิ้งพื้นไป

ผลคือลูกค้าเลือกสีจากใบไม้มาลงบนลายนี้ได้ และ **สีผ้าจะโผล่ขึ้นมาระหว่างเส้น**
เหมือนพิมพ์ลงบนผ้าจริง ไม่ใช่แปะกระดาษขาวทับผ้า

```json
{
  "file": "ดารานิรมิต.JPG",
  "id": "celestial-star",
  "name": { "th": "ดารานิรมิต", "en": "Celestial Star" },
  "recolor": "mask",
  "defaultColors": ["#4B2A4F"],
  "repeatUnits": 300,
  "credit": "Designer TBC"
}
```

- `defaultColors` = สีเริ่มต้นที่ลายนี้จะแสดงในคลังลาย **ใส่ได้สีเดียว**
  (ลายเส้นมีหมึกสีเดียว) เลือกจากค่าสีใน `public/catalog/leaf-dyes.json`
- เส้นสีอะไรก็ได้ ไม่จำเป็นต้องดำ — สคริปต์อ่านจากภาพแต่ละภาพเอง
  (ลายสุขเส้นสานเส้นสีน้ำตาลอ่อน ก็ออกมาทึบเต็มเหมือนกัน)
- สคริปต์จะบอกค่าที่อ่านได้ทุกครั้ง

```
    ink mask  levels 159–228 (read from the drawing), painted in #9C7A3C
```

- ถ้าผลออกมาไม่ถูก (เส้นหาย หรือพื้นไม่ใส) ใส่ `"maskLevels"` กำกับเองได้
  `black` = ค่าความสว่างที่ถือว่าเป็นเส้น `white` = ค่าที่ถือว่าเป็นพื้น (0–255)
- ภาพสี/ภาพถ่าย **ไม่ต้องใส่** `recolor` — สีอยู่ในภาพแล้ว และเลือกสีใบไม้ไม่ได้

### ถ้าสคริปต์ฟ้อง

ข้อความจะบอกว่าผิดที่รายการไหน

```
patterns.manifest.json: 1 problem
  - entry "lemons" (index 2) repeatUnits: Too small: expected number to be >0
```

แก้ในไฟล์ manifest แล้วรันใหม่ · ดูลายทั้งหมดได้ที่ `npm run dev` แล้วเปิด `/dev/catalog`

---

## English

### What the artwork folder looks like

```
Design Pattern/
  patterns.manifest.json     ← the list of patterns (this is what you edit)
  Untitled_Artwork 2.png     ← the originals; any file name will do
  Untitled_Artwork 6.png
  …
```

The folder is **not** in the repository: the full-resolution originals stay
with the designer, and the site only ever serves the converted files. Starting
from scratch? Copy
[`docs/patterns.manifest.example.json`](patterns.manifest.example.json) into
the folder and rename it.

### 1. Put the file in the folder

| | |
| --- | --- |
| Format | PNG or JPG (WebP and TIFF also work) |
| Size | long edge at least 1600 px — larger is fine, e.g. 2480×3508 |
| Colour | sRGB |
| Background | opaque; only a single cut-out leaf motif needs transparency |
| File name | anything — the name no longer decides anything |

### 2. Edit the manifest

One pattern, one entry:

```json
{
  "file": "Untitled_Artwork 2.png",
  "id": "lemons",
  "name": { "th": "ลายมะนาว", "en": "Lemons" },
  "repeatUnits": 500,
  "tags": ["fruit"],
  "credit": "Designer's name"
}
```

| Key | Meaning |
| --- | --- |
| `file` | the file in this folder |
| `id` | **the pattern's identity**, lowercase kebab-case, e.g. `pastel-stripes` |
| `name` | what the site shows, Thai and English |
| `fit` | `"area"` for a pattern placed once; leave it out for a repeating tile |
| `repeatUnits` | the size of one repeat (step 4); omit for a placement pattern |
| `recolor` | `"mask"` for line art on a white page (step 6) |
| `defaultColors` | the dye it is listed in — one colour, with `recolor` |
| `restrictTo` | keeps it off products it was not drawn for; omit for all of them |
| `tags` | search words; `community` is added for you |
| `credit` | who to credit |

**The id is the identity.** Re-export a revised drawing and keep its id: the
designs people have already made keep their pattern. Change the id — or
**remove the entry — and the pattern is deleted**, and a saved design that used
it loses that layer. The script warns when that happens.

JSON has no comments, so any key starting with `_` is ignored: `"_note": "…"`.

### 3. Run one command

```bash
npm run catalog:import -- "../Design Pattern"
```

It resizes, converts to WebP under 600 KB, writes a 240 px thumbnail, updates
`public/catalog/patterns.json` and says what changed:

```
  + lemons  added
  ~ stars  updated (image)
  = marble-swirl  unchanged
  - old-pattern  removed
```

Then `git add -A`, commit and open a PR as usual.

- Running it again with nothing changed changes nothing. It is always safe.
- The served file names carry a hash of the artwork
  (`lemons.a271f856.webp`), so a revision can never be served from a browser's
  cache.
- A photographed or colour-painted pattern **cannot be recoloured** — its
  colours are in the file — so the site hides the leaf-dye picker for it. Line
  art on a white page can: see step 6.

### 4. Repeat size (`repeatUnits`)

Every product is measured in the same units: a whole product mockup is 1000
units across.

| Print area | Roughly |
| --- | --- |
| Cotton shawl (whole cloth) | 660 × 464 units |
| Handkerchief (whole cloth) | 580 × 580 units |
| Mug / tumbler wrap | ~260 × 290 units |

`repeatUnits` is **the width of one repeat**; the height follows from the
file's proportions.

- `500` — a large print, about 1.3 repeats across a shawl. What the first seven
  patterns use.
- `250` — half the size, about 2.6 repeats across.

> It can be changed later, **but** designs people have already saved will
> change size with it.

### 5. Repeat or placement

- **Repeat** — a surface pattern tiled across the cloth (stripes, lemons). Its
  left edge has to continue into its right edge, and its top into its bottom.
- **Placement** (`"fit": "area"`) — one picture filling the print area once
  (hearts, bubbles). The edges do not matter: the site scales it to cover the
  area and trims the overflow.

> A placement pattern had a screenshot test of its own in `e2e/visual.spec.ts`.
> The catalog holds none today, so that test was removed with the pattern it
> photographed — **the next `fit: "area"` pattern added has to put it back**.

**Seamless checklist**

- [ ] the drawing continues across the left/right join
- [ ] it continues across the top/bottom join
- [ ] no border, frame or band of colour at the edge (the brown bands above and
      below the stars pattern are exactly what shows up as a line)
- [ ] the motifs are spread over the whole sheet, not gathered in the middle

The script scores every tile's seams:

```
    seam  left|right 3.9 (grain 0.2)   top|bottom 5.7 (grain 0.2)
    WARNING: the left|right and top|bottom edges do not meet …
```

- the first number is how different the two edges are (0 = they meet exactly,
  100 = black against white)
- `grain` is how different two neighbouring lines inside the picture are — the
  yardstick the first number is read against
- it is **never an error**. A placement pattern is expected to warn; a pattern
  meant to repeat needs a seamless export instead.
- scores are printed for patterns that are new or whose picture changed;
  an unchanged pattern is not converted again.

### 6. Line art the dyes can colour (`recolor: "mask"`)

A pattern drawn as **dark lines on a white page** can say `"recolor": "mask"`.
The import reads the drawing's own darkness as opacity — line opaque, page
transparent — and throws the page away.

What that buys: a visitor can print it in any of the community's leaf dyes,
and **the cloth's colour shows between the lines**, the way a print on cloth
actually looks, rather than a white sheet laid over it.

```json
{
  "file": "ดารานิรมิต.JPG",
  "id": "celestial-star",
  "name": { "th": "ดารานิรมิต", "en": "Celestial Star" },
  "recolor": "mask",
  "defaultColors": ["#4B2A4F"],
  "repeatUnits": 300,
  "credit": "Designer TBC"
}
```

- `defaultColors` is the dye the library lists it in: **exactly one**, because
  a mask has one ink. Take the value from `public/catalog/leaf-dyes.json`.
- The lines do not have to be black. The levels are read from each drawing on
  its own, so สุขเส้นสาน's pale taupe comes out as solid as the rest.
- The import says what it read, every time:

```
    ink mask  levels 159–228 (read from the drawing), painted in #9C7A3C
```

- If it reads one wrong — lines missing, or a grey wash where the cloth should
  show — set `"maskLevels"`: `black` is the luminance the ink ends at, `white`
  the one the paper begins at, both 0–255.
- A photograph or a colour drawing leaves `recolor` out. Its colours are in the
  file, and the leaf-dye picker stays hidden for it.

### When the script complains

It names the entry:

```
patterns.manifest.json: 1 problem
  - entry "lemons" (index 2) repeatUnits: Too small: expected number to be >0
```

Fix the manifest and run it again. `npm run dev`, then `/dev/catalog`, shows
every entry at once.
