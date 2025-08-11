# Thai Gold Cache (GitHub Pages + Actions)

โครงการนี้จะดึงราคาทองคำจากหน้า `https://xn--42cah7d0cxcvbbb9x.com/`
(ทองรูปพรรณ ลำดับที่ 9 → **ราคาขายออก**) แล้วบันทึกลงไฟล์ `goldprice.json`
ที่ root ของ repo เพื่อให้ใช้งานผ่าน GitHub Pages ได้

## สิ่งที่ได้
- `goldprice.json`:
```json
{
  "ok": true,
  "ts": "2025-01-01T00:00:00.000Z",
  "source": "xn--42cah7d0cxcvbbb9x.com",
  "jewelry_sell_n9": "52,750.00"
}
```
- `status.json`: ไฟล์สถานะรอบล่าสุด (สำเร็จ/ล้มเหลว ข้อความ และเวลา)

## วิธีใช้งาน
1. สร้าง repo ใหม่ใน GitHub แล้วอัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้
2. เปิด GitHub Pages
   - ไปที่ **Settings → Pages**
   - เลือก **Build and deployment:** *Deploy from a branch*
   - เลือก **Branch:** `main` (หรือ default branch ของคุณ) และโฟลเดอร์ `/root`
   - กด **Save**
3. เปิด GitHub Actions (ถ้าปิดอยู่ให้เปิด) และตรวจว่า workflow ทำงานได้
4. รอให้ workflow รัน (หรือกด **Run workflow** ด้วยตนเอง)
5. เมื่อเสร็จแล้ว คุณจะเข้าถึงไฟล์ได้ที่:
   - `https://<username>.github.io/<repo>/goldprice.json`
   - `https://<username>.github.io/<repo>/status.json`

> หมายเหตุ: Workflow ตั้งให้ **อัปเดตทุก 5 นาที** และจะ *ไม่ทับไฟล์ goldprice.json*
ถ้าดึงข้อมูล upstream ไม่สำเร็จ (เพื่อคงค่าล่าสุดให้ใช้งานได้เสมอ)

## ปรับแต่ง
- เปลี่ยนตัวเลข **N = 9** (ลำดับทองรูปพรรณ) ได้ใน `scripts/scrape.js`
- เปลี่ยน cron ได้ที่ `.github/workflows/update.yml`

## License
MIT
