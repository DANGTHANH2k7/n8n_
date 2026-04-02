
 ---

<!-- Slide 1: Title -->
# isme
## Post-Visit AI Assistant for Patients

**GDGoC Hackathon Vietnam 2026**

Team: **Bang Bang Bang**

---

# Mục Lục

1. **Vấn đề & Mục tiêu**
2. **Giải pháp & Lợi ích**
3. **Kiến trúc hệ thống**
4. **Công nghệ sử dụng**
5. **Pipeline Parse Intake**
6. **Pipeline Q&A**
7. **Pipeline Reminders**
8. **Cơ chế An toàn y tế**
9. **Trường dữ liệu & Schema**
10. **Demo & Kịch bản**
11. **Kế hoạch triển khai**
12. **Kết luận**

---

## Vấn đề Thực Tế

**Sau buổi khám, bệnh nhân thường:**

- Quên lời dặn của bác sĩ
- Uống sai gio/liều lượng thuốc
- Hiểu sai chỉ định điều trị
- Lo lắng nhưng ngại hỏi lại bác sĩ

**Hệ quả:** Giảm tuân thủ điều trị → Ảnh hưởng kết quả điều trị → Nguy hiểm sức khỏe

**Hiện trạng:** Giấy dặn dò dễ thất lạc, chatbot chung chung thiếu bối cảnh bệnh án, hạ tầng phức tạp khó áp dụng cho phòng khám nhỏ.

---

## Mục Tiêu Dự Án

Xây dựng **hệ thống Agentic AI** tự động hóa quy trình hậu khám:

- ✓ Chuan hóa thông tin y tế từ ghi chú bác sĩ
- ✓ Tạo nhắc nhở điều trị dùng cho bệnh nhân
- ✓ Hỗ trợ hỏi đáp dựa trên hồ sơ thực
- ✓ Đảm bảo human-in-the-loop (bác sĩ xác nhận)
- ✓ Triển khai nhanh, chi phí thấp cho phòng khám vừa/nhỏ

---

## Giải Pháp isme

**Quy trình xử lý tự động:**

1. Bác sĩ nhập `raw_note` + `doctor_advice` vào Sheet
2. AI (Gemini) trích xuất → JSON cấu trúc (chẩn đoán, thuốc, hướng dẫn)
3. Lưu vào `Visits`, tạo lich `Reminders`, danh sách `PatientQuestions`
4. Bác sĩ xác nhận & bổ sung thông tin nhạy cảm
5. Q&A webhook trả lời bệnh nhân theo đúng hồ sơ + lời dặn bác sĩ

**Điểm khác biệt:**
- Human-in-the-loop rõ ràng: AI gợi ý, bác sĩ kiểm soát
- Google Sheets làm database (vận hành ngay, dễ audit)
- MVP chi phí gần 0, triển khai trong hackathon

---

## Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│         DOCTOR / STAFF INPUT                             │
│     (Google Sheets - Intake Tab)                         │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
[Every 5 Min] [On Webhook] [Every 6 Hours]
    │              │              │
    ▼              ▼              ▼
┌─────────────┐ ┌─────────┐ ┌──────────────┐
│Parse Intake │ │  Q&A    │ │  Reminders   │
│  Workflow   │ │ Webhook │ │  Scheduler   │
└──────┬──────┘ └────┬────┘ └──────┬───────┘
       │             │             │
       │   Gemini API (LLM)        │
       │             │             │
       ▼             ▼             ▼
┌──────────────────────────────────────────┐
│    Google Sheets - Data Storage          │
│  (Visits, Reminders, QnA, Questions)     │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  PATIENT Q&A / REMINDERS / TRACKING  │
└──────────────────────────────────────┘
```

---

## Stack Công Nghệ

| Thành phần | Công nghệ | Vai trò |
|-----------|-----------|--------|
| **LLM** | Google Gemini API | Trích xuất, phân tích NLP |
| **Orchestration** | n8n | Workflow, cron, webhook |
| **Database** | Google Sheets | Lưu trữ, audit trail |
| **Backend Logic** | n8n Code Node | Business logic |
| **Data Format** | JSON | Cấu trúc hóa dữ liệu |

**Đặc điểm:** Open-source, free tier, triển khai nhanh, dễ bảo trì.

---

## Pipeline 1: Parse Intake (5 phút/lần)

```
Every 5 Min → Read Intake → Filter Pending
                              │
                              ▼
                      Split & Process
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
            Build Gemini Request    (Handle Error)
                    │                    │
                    ▼                    ▼
            Call Gemini API          Update Status
                    │                    │
                    ▼                    ▼
            Normalize Result         Intake → Done
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
    Visit Row  Reminder    Questions
    (Visits)   (Reminders) (Patient Q)
```

**Kết quả:** Từ ghi chú bác sĩ tạo ra 3 dòng dữ liệu cấu trúc (Visits, Reminders, PatientQuestions).

---

## Pipeline 2: Q&A Webhook (Real-time)

```
Patient Question → Webhook /postvisit/qa
                        │
                        ▼
                   Read Visits
                        │
                        ▼
                Find Visit Context
                        │
         ┌──────────────┴──────────────┐
         ▼ (Found)                     ▼ (Not Found)
    Gemini Answer                   Return 404
         │
         ▼
    Format QA Row
         │
         ▼
    Append to QnA
         │
         ▼
    Return Response
```

**Đặc điểm:** Trả lời dựa trên `doctor_advice` + `medications` + `instructions`. Không bịa thông tin mới.

---

## Pipeline 3: Reminders Scheduler (6 giờ/lần)

```
Every 6 Hours → Read Reminders
                      │
                      ▼
              Filter Due Reminders
              (Match current hour)
                      │
         ┌────────────┴────────────┐
         ▼ (Due reminders found)   ▼ (None)
    Dispatch Stub               (Skip)
         │
         ▼
    Append Log
```

**Cron:** `0 */6 * * *` (00:00, 06:00, 12:00, 18:00 UTC+7)

**Tương lai:** Thêm SMS/Zalo/Email.

---

## Cơ Chế An Toàn Y Tế

**Quy tắc Gemini Prompting:**

1. **Chỉ trích xuất:** Không suy diễn gio uong thuoc, lieu dung neu bac si chua chi dinh
2. **Bảo toàn lời dặn:** Giữ nguyên `doctor_advice` → Q&A dùng làm căn cứ
3. **Bảo toàn dữ liệu bác sĩ:** Audit trail trên Sheets → Dễ truy vet
4. **Human review:** Bác sĩ xác nhận trước khi gửi cho bệnh nhân
5. **Red flags:** Nếu phát hiện dấu hiệu nguy hiểm → khuyên liên hệ bác sĩ

**Prompt ngôn ngữ:** Tiếng Việt, nhiệt độ thấp (0.1), JSON có cấu trúc.

---

## Schema Google Sheets (6 Tabs)

| Tab | Trường | Mục đích |
|-----|--------|---------|
| **Intake** | intake_id, raw_note, doctor_advice, parsed_status | Input từ bác sĩ |
| **Visits** | visit_id, diagnosis, medications_json, doctor_advice | Hồ sơ chuẩn hóa |
| **Reminders** | reminder_id, medication_name, time_slot, completed | Lịch nhắc thuốc |
| **QnA** | qa_id, question, answer, created_at | Lich sử hỏi đáp |
| **PatientQuestions** | question_id, patient_question, doctor_answer, status | Câu hỏi chưa trả lời |
| **ReminderLog** | log_id, reminder_id, message, sent_at | Audit log nhắc nhở |

---

## Kịch Bản Demo End-to-End

**Bước 1 - Bác sĩ nhập:** Dòng mới trong `Intake`
```json
{
  "raw_note": "Bệnh nhân 35 tuổi, ho 3 ngày, đau cổ họng, sốt 37.8°C",
  "doctor_advice": "Hạ sốt khi >38.5°C, uống thuốc kháng sinh theo đơn 3 lần/ngày, tái khám 3 ngày",
  "parsed_status": "pending"
}
```

**Bước 2 - Workflow Parse:** Chạy mỗi 5 phút
- Gemini trích xuất → `Visits` (chẩn đoán, thuốc, hướng dẫn)
- Tạo `Reminders` (lịch uống thuốc)
- Tạo `PatientQuestions` (câu hỏi bệnh nhân hay ngại hỏi)

**Bước 3 - Bác sĩ xác nhận:** Điền `doctor_answer` trong `PatientQuestions`

**Bước 4 - Bệnh nhân hỏi:** POST webhook `/postvisit/qa`
```json
{ "visitId": "V...", "question": "Hạ sốt khi bao nhiêu độ?" }
```
→ Trả lời: "Khi nhiệt độ > 38.5°C, hạ sốt bằng cách uống thuốc..."

---

## Kế Hoạch Triển Khai

**Trong Hackathon (MVP):**
- Hoàn thiện schema Sheets + workflows n8n
- Parse → Visits/Reminders/Questions
- Q&A webhook hoạt động end-to-end
- Demo live chuỗi đầy đủ

**Sau Hackathon (v1.0):**
- Thêm kênh SMS/Zalo/Email thực
- Dashboard bệnh nhân (mobile app / web)
- Phân quyền bác sĩ, admin clinic
- Tích hợp HIS/EMR (nếu có)

**Chi phí:** Gần 0 (free tier), LLM cost thấp, mã mở.

---

## Kết Luận

**isme giải quyết khoảng trống "sau buổi khám":**

- **Cho bệnh nhân:** Nhớ dùng → Hiểu dùng → Hỏi dùng
- **Cho bác sĩ:** AI hỗ trợ, bác sĩ kiểm soát
- **Cho phòng khám:** Triển khai nhanh, chi phí tối thiểu

**Agentic AI + Human-in-the-loop = Tin cậy, Bền vững, An toàn**

---

<!-- Slide 12: Contact -->

# Cảm Ơn

**Team Bang Bang Bang**

- Đỗ Khánh Phương | Product + Frontend
- Nguyễn Đăng Thành | AI Workflow (n8n + Gemini)
- Phạm Quang Nhật | Data + Demo + Testing

📧 dthanhh811@gmail.com
📱 0395457894

GDGoC Hackathon Vietnam 2026
