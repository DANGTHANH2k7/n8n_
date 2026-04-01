# PostVisit AI Hackathon Setup (n8n + Google Sheets)

## 1) Tao Google Sheet tu dong

1. Mo [script.new](https://script.new)
2. Copy toan bo code trong `google/create_postvisit_sheet.gs`
3. Bam Run ham `createPostVisitSheet`
4. Cap quyen Google Script
5. Lay URL sheet moi tao, copy `spreadsheetId` (phan giua `/d/` va `/edit`)

## 2) Import workflows vao n8n

Import 4 file:

- `n8n/postvisit_upload_extract.workflow.json`
- `n8n/postvisit_qa.workflow.json`
- `n8n/postvisit_reminders.workflow.json`
- `n8n/postvisit_parse_intake_from_sheet.workflow.json`

## 3) Cau hinh credentials + env

1. Tao credential Google Sheets OAuth2 trong n8n
2. Mo tung workflow, thay `REPLACE_WITH_YOUR_CREDENTIAL_ID`
3. Them env vars cho n8n:
   - `GEMINI_API_KEY`
   - `GOOGLE_SHEET_ID`

Co the dung mau trong `n8n/.env.example`.

## 4) Test nhanh

### Upload flow

POST webhook `postvisit/upload` voi body trong `n8n/mock_upload_payload.json`

### QA flow

POST webhook `postvisit/qa` voi body trong `n8n/mock_qa_payload.json`

### Reminders flow

Trigger thu cong workflow `PostVisit - Reminders Cron` de tao log vao sheet `ReminderLog`.

### Intake-to-Parse flow (de xuat moi)

Nhap truc tiep ho so bac si vao tab `Intake` voi `parsed_status = pending`.
Nen dien day du 2 cot:

- `raw_note`: ghi chu kham benh
- `doctor_advice`: loi dan truc tiep cua bac si

Workflow `PostVisit - Parse Intake From Sheet` se:

1. Doc Intake moi 5 phut
2. Parse bang Gemini
3. Ghi ket qua vao `Visits` + `Reminders`
4. Cap nhat lai `Intake` thanh `done` hoac `error`
5. Luu them cot `doctor_advice` vao `Visits` de Q&A bam sat loi dan bac si
6. Tao cac cau hoi benh nhan ngai hoi vao tab `PatientQuestions` (doctor_answer de trong de bac si dien)

## 5) Sheet structure

Script se tao 6 tab:

- `Visits`
- `Reminders`
- `QnA`
- `ReminderLog`
- `Intake`
- `PatientQuestions`

Tat ca workflow da map cot theo 6 tab nay.
