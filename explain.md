# PostVisit AI - Explain (User-friendly + Technical)

## 1) One-line pitch

PostVisit AI giup benh nhan **khong quen loi dan sau buoi kham**: bac si nhap ho so vao Google Sheet, AI trich xuat dung y chi, tao nhac nho, va tong hop cac cau hoi benh nhan ngai hoi de bac si tra loi.

---

## 2) Van de goc va giai phap

### Van de

- Benh nhan roi phong kham trong tinh trang boi roi.
- Nhieu nguoi quen phan lon loi dan dieu tri.
- Ngon ngu y khoa kho hieu khi ve nha.

### Giai phap

- Bac si/nhan vien nhap du lieu truc tiep vao tab `Intake`.
- n8n goi Gemini de trich xuat thong tin co cau truc.
- Luu vao cac tab chuc nang (`Visits`, `Reminders`, `PatientQuestions`).
- Benh nhan hoi dap qua Q&A, AI bam sat ho so + loi dan bac si.

---

## 3) Nguyen tac an toan y te (quan trong cho Ban Giam Khao)

- AI duoc rang buoc: **chi trich xuat** thong tin bac si da ghi.
- Khong tu suy dien gio uong thuoc, lieu dung, chan doan moi.
- Neu thieu thong tin: de trong hoac ghi `chua duoc chi dinh`.
- Co cot `doctor_advice` de giu nguyen loi dan bac si.
- Cac cau hoi nhay cam/benh nhan ngai hoi duoc dua vao `PatientQuestions`, bac si tra loi thu cong o cot ben canh.

---

## 4) Kien truc he thong

```text
Doctor/Staff -> Google Sheet (Intake)
             -> n8n Parse Workflow (every 5 minutes)
             -> Gemini API
             -> Google Sheet tabs:
                - Visits
                - Reminders
                - PatientQuestions

Patient App/Web -> n8n Q&A Webhook -> Gemini (context from Visits + doctor_advice)

n8n Scheduler -> Reminders Workflow -> ReminderLog
```

---

## 5) Google Sheet schema (database no-code)

Script `google/create_postvisit_sheet.gs` tao 6 tab:

1. `Intake`
   - Dau vao tu bac si: `raw_note`, `doctor_advice`, `parsed_status`.
2. `Visits`
   - Ho so da parse: diagnosis, medications_json, follow_up_json, `doctor_advice`.
3. `Reminders`
   - Khung gio thuoc duoc trich xuat (khong tu dong gan 08:00 neu thieu).
4. `QnA`
   - Lich su hoi dap benh nhan.
5. `PatientQuestions`
   - Cac cau hoi benh nhan ngai hoi + o `doctor_answer` de bac si dien.
6. `ReminderLog`
   - Nhat ky nhac nho.

---

## 6) Cac workflow n8n va muc tieu

### A. `postvisit_parse_intake_from_sheet.workflow.json`

Muc tieu: Tu dong xu ly du lieu bac si vua nhap.

Node flow chinh:

- `Every 5 Minutes`: kich hoat dinh ky.
- `Read Intake Rows`: doc tab `Intake`.
- `Filter Pending Intake`: lay dong `parsed_status = pending`.
- `Build Gemini Request`: tao prompt rang buoc an toan y te.
- `Gemini Parse Intake`: goi Gemini API.
- `Normalize Parsed Result`: chuan hoa JSON parse.
- `Append Structured Visit`: ghi vao `Visits`.
- `Build Reminder Items` + `Append Reminders`: tao lich nhac thuoc (chi khi co timing that su).
- `Build Patient Questions Rows` + `Append Patient Questions`: tao cau hoi benh nhan ngai hoi, de trong cot tra loi cho bac si.
- `Update Intake Status`: danh dau `done` hoac `error`.

### B. `postvisit_qa.workflow.json`

Muc tieu: Tra loi cau hoi benh nhan theo dung context benh an.

Node flow chinh:

- `Webhook QA`: nhan cau hoi.
- `Read Visits` + `Find Visit Context`: tim ho so benh nhan.
- `Gemini Answer`: tra loi de hieu, uu tien `doctor_advice`, khong chan doan moi.
- `Append QA Row`: luu lich su vao `QnA`.

### C. `postvisit_reminders.workflow.json`

Muc tieu: Quet lich nhac nho va ghi log.

- Trigger cron 6 gio/lan.
- Doc `Reminders`, loc reminder den gio.
- Ghi vao `ReminderLog`.

### D. `postvisit_upload_extract.workflow.json` (optional)

Muc tieu: Demo mode upload qua webhook (neu khong dung Intake).

---

## 7) Luong nghiep vu de demo live

1. Bac si dien 1 dong moi trong `Intake`:
   - `raw_note`
   - `doctor_advice`
   - `parsed_status = pending`
2. Chay workflow parse (doi 5 phut hoac run manual).
3. Kiem tra:
   - `Visits` co du lieu tong hop
   - `Reminders` co lich thuoc (neu bac si co ghi gio)
   - `PatientQuestions` co cau hoi benh nhan ngai hoi
4. Bac si tra loi truc tiep trong cot `doctor_answer` o `PatientQuestions`.
5. Benh nhan hoi them qua Q&A webhook -> nhan tra loi theo context.

---

## 8) Tai sao giai phap nay hop chu de "Agentic AI"

- Goal-driven: giam boi roi sau kham, tang tuan thu dieu tri.
- Planning: he thong tach thong tin, tao reminder, tao danh sach cau hoi can giai dap.
- Autonomy: cron + parse tu dong, cap nhat trang thai intake.
- Feedback loop: Q&A + PatientQuestions giup bac si bo sung huong dan thieu.

---

## 9) Danh sach file can trinh bay cho BGK

- `README_SETUP.md`: huong dan setup nhanh.
- `google/create_postvisit_sheet.gs`: tao database Google Sheet 1 click.
- `n8n/postvisit_parse_intake_from_sheet.workflow.json`: workflow trung tam.
- `n8n/postvisit_qa.workflow.json`: hoi dap benh nhan.
- `n8n/postvisit_reminders.workflow.json`: reminder scheduler.
- `n8n/postvisit_upload_extract.workflow.json`: luong upload thay the.

---

## 10) Ghi chu implementation

- Nho thay `REPLACE_WITH_YOUR_CREDENTIAL_ID` bang credential that trong n8n.
- Set env vars:
  - `GEMINI_API_KEY`
  - `GOOGLE_SHEET_ID`
- Workflow mac dinh de `active = false`, can bat `Active` truoc khi demo.
