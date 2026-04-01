# HỒ SƠ DỰ ÁN  
## GDGoC HACKATHON VIETNAM 2026

## Tên đội
**Bang Bang Bang**

## Thành viên

| STT | Họ và tên | Vai trò |
|---|---|---|
| 1 | Đỗ Khánh Phương | Product + Frontend |
| 2 | Nguyễn Đăng Thành | AI Workflow (n8n + Gemini) |
| 3 | Phạm Quang Nhật | Data + Demo + Testing |

## 1. Tổng quan dự án

### 1.1 Tên dự án
**isme - Trợ lý hậu khám cho bệnh nhân**

### 1.2 Mô tả ngắn gọn
Sau buổi khám, nhiều bệnh nhân rời phòng khám trong trạng thái bối rối và quên phần lớn lời dặn của bác sĩ. Dự án **isme** giải quyết vấn đề này bằng cách:

- Cho bác sĩ/nhân viên nhập hồ sơ vào Google Sheets.
- AI tự động trích xuất thông tin y tế theo cấu trúc chuẩn.
- Tạo nhắc nhở điều trị và hỗ trợ hỏi đáp sau khám.

Hệ thống đặc biệt bổ sung tính năng hỏi đáp giúp bệnh nhân giải đáp thắc mắc sau khi rời khỏi phòng khám (dựa trên ý kiến của bác sĩ).

Giải pháp hướng đến trải nghiệm dễ dùng, chi phí thấp, triển khai nhanh trong điều kiện hackathon. Đối tượng hưởng lợi gồm bệnh nhân, bác sĩ phòng khám và đội ngũ chăm sóc sau khám.

### 1.3 Dự án sử dụng Agentic AI như thế nào?
- **Tự lập kế hoạch xử lý:** đọc dữ liệu Intake từ bác sĩ -> phân tích ý chính -> ghi vào ô dữ liệu ứng với ID bệnh nhân -> sinh Reminders -> thu thập PatientQuestions -> cập nhật trạng thái xử lý.
- **Sử dụng công cụ ngoài:** Gemini API (suy luận ngôn ngữ), Google Sheets (database), n8n (orchestration + scheduler + webhook).
- **Ra quyết định theo ngữ cảnh:** chỉ xử lý dòng `parsed_status = pending`, lọc nhắc nhở đến giờ, rẽ nhánh lỗi/không lỗi.
- **Ghi nhớ bối cảnh bệnh nhân:** Q&A dùng dữ liệu lịch sử từ các hàng với ID bệnh nhân + ô `doctor_advice` để trả lời có căn cứ.
- **Có vòng phản hồi:** câu hỏi chưa được giải đáp được đẩy sang `PatientQuestions`, bác sĩ điền câu trả lời, tạo kênh cập nhật liên tục giữa AI và chuyên môn con người.

## 2. Vấn đề và giải pháp

### 2.1 Đặt vấn đề
- Bệnh nhân sau khám dễ quên giờ thuốc, hiểu sai chỉ định, lo lắng nhưng ngại hỏi lại.
- Ảnh hưởng trực tiếp đến tuân thủ điều trị, kết quả điều trị và an toàn người bệnh.
- Các giải pháp hiện tại còn rời rạc: giấy dặn dò dễ thất lạc, chatbot thiếu bối cảnh bệnh án hoặc hạ tầng phức tạp khó áp dụng cho phòng khám vừa và nhỏ.

### 2.2 Câu hỏi đặt ra
- Làm sao tự động hóa quy trình hậu khám theo nhiều bước nhưng vẫn đơn giản để triển khai?
- Làm sao để AI dùng nhiều công cụ (LLM + database + scheduler) trong một luồng thống nhất?
- Làm sao giữ độ tin cậy y tế, không bịa thông tin và bác sĩ vẫn là người xác thực cuối?

### 2.3 Giải pháp đề xuất
Nhóm đề xuất hệ thống Agentic AI dựa trên **n8n + Gemini + Google Sheets**:

- Bác sĩ nhập `raw_note` và `doctor_advice` vào tab **Intake**.
- Workflow parse chạy định kỳ, gọi Gemini trích xuất JSON có cấu trúc (chẩn đoán, thuốc, hướng dẫn, red flags, follow-up).
- Dữ liệu chuẩn lưu vào tab **Visits**; lịch thuốc đẩy vào **Reminders** (không tự gán giờ nếu bác sĩ chưa chỉ định).
- Hệ thống tạo **PatientQuestions** cho các điều bệnh nhân hay ngại hỏi nhưng chưa có trong lời dặn, để bác sĩ trả lời ở cột `doctor_answer`.
- Q&A webhook trả lời theo đúng hồ sơ và lời dặn bác sĩ, tránh tư vấn chung chung.

**Điểm khác biệt:**
- Human-in-the-loop rõ ràng: AI gợi ý, bác sĩ xác nhận nội dung nhạy cảm.
- Dùng Google Sheets làm database có thể vận hành ngay cho phòng khám nhỏ.
- Triển khai nhanh, chi phí gần như bằng 0 cho bản MVP hackathon.

## 3. Công nghệ dự kiến sử dụng

### 3.1 Công nghệ AI
- Google Gemini (LLM) qua API.
- Prompting có ràng buộc an toàn: chỉ trích xuất đúng dữ liệu bác sĩ nhập, hạn chế suy diễn.

### 3.2 Hạ tầng
- n8n (workflow orchestration, webhook, scheduler).
- Google Sheets (data store + human review layer).
- Có thể deploy demo qua n8n cloud/self-host tùy điều kiện.

### 3.3 Công nghệ phát triển
- Workflow: JSON import vào n8n.
- Backend logic: n8n Code Node + HTTP Request Node.
- Data: Google Sheets tabs (`Intake`, `Visits`, `Reminders`, `QnA`, `PatientQuestions`, `ReminderLog`).
- Frontend demo (nếu triển khai): web đơn giản gọi webhook Q&A.

### 3.4 Điểm mạnh cạnh tranh
- Dễ triển khai thực tế: không yêu cầu đội ngũ IT lớn.
- Luồng dữ liệu minh bạch, dễ audit vì mọi trạng thái nằm trên sheet.
- Cân bằng AI và chuyên môn bác sĩ: AI hỗ trợ, bác sĩ kiểm soát.
- Khả năng mở rộng tốt: có thể thêm SMS/Zalo/Email nhắc thuốc sau hackathon.

## 4. Đối tượng sử dụng
- Bệnh nhân ngoại trú cần theo dõi sau khám.
- Bác sĩ/điều dưỡng tại phòng khám tư nhân hoặc khoa khám bệnh.
- Cơ sở y tế quy mô nhỏ cần số hóa quy trình hậu khám với ngân sách thấp.

## 5. Tính khả thi

### 5.1 Kế hoạch phát triển
**Trong hackathon:**
- Hoàn thiện schema Google Sheets.
- Import workflow n8n, parse intake, ghi visits/reminders.
- Hoàn thiện Q&A theo hồ sơ, tab PatientQuestions cho bác sĩ trả lời, kịch bản demo live end-to-end.

**Sau hackathon:**
- Bổ sung kênh nhắc nhở thực (Zalo/Email/SMS).
- Bổ sung dashboard bệnh nhân và phân quyền bác sĩ.
- Tích hợp với hệ thống HIS/EMR nếu có.

### 5.2 Ngân sách dự kiến
- Hạ tầng cloud: tận dụng free tier (n8n, Google Sheets).
- Mô hình AI: Gemini API mức dùng thấp cho demo.
- Công cụ phát triển: mã nguồn mở / free.
- Tổng chi phí dự kiến: rất thấp, gần như miễn phí.

## 6. Tài liệu tham khảo
- Google Gemini API Documentation.
- n8n Documentation (Webhook, Schedule, Google Sheets, Code Node).
- Google Sheets API / Google Apps Script Documentation.
- Tài liệu chủ đề GDGoC Hackathon 2026: Agentic AI.

## 7. Thông tin liên hệ
- Email: `dthanhh811@gmail.com`
- Số điện thoại: `0395457894`
