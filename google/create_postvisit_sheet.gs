function createPostVisitSheet() {
  const ss = SpreadsheetApp.create('PostVisitAI_Database');

  const visitsHeaders = [
    'patient_id',
    'visit_date',
    'patient_name',
    'diagnosis',
    'diagnosis_simplified',
    'doctor_advice',
    'medications_json',
    'instructions_json',
    'red_flags_json',
    'follow_up_json',
    'recording_text',
    'created_at'
  ];

  const remindersHeaders = [
    'reminder_id',
    'patient_id',
    'visit_date',
    'patient_name',
    'medication_name',
    'dosage',
    'time_slot',
    'frequency',
    'completed',
    'last_reminder'
  ];

  const qnaHeaders = [
    'qa_id',
    'patient_id',
    'visit_date',
    'patient_name',
    'question',
    'answer',
    'created_at'
  ];

  const logHeaders = [
    'log_id',
    'reminder_id',
    'patient_id',
    'visit_date',
    'patient_name',
    'medication_name',
    'dosage',
    'time_slot',
    'message',
    'sent_at'
  ];

  const patientQuestionsHeaders = [
    'question_id',
    'patient_id',
    'visit_date',
    'patient_name',
    'patient_question',
    'doctor_answer',
    'status',
    'created_at',
    'answered_at'
  ];

  const intakeHeaders = [
    'intake_id',
    'patient_id',
    'patient_name',
    'raw_note',
    'doctor_advice',
    'parsed_status',
    'parsed_at',
    'visit_date',
    'error_message'
  ];

  const first = ss.getSheets()[0];
  first.setName('Visits');
  first.getRange(1, 1, 1, visitsHeaders.length).setValues([visitsHeaders]);

  const reminders = ss.insertSheet('Reminders');
  reminders.getRange(1, 1, 1, remindersHeaders.length).setValues([remindersHeaders]);

  const qna = ss.insertSheet('QnA');
  qna.getRange(1, 1, 1, qnaHeaders.length).setValues([qnaHeaders]);

  const reminderLog = ss.insertSheet('ReminderLog');
  reminderLog.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);

  const intake = ss.insertSheet('Intake');
  intake.getRange(1, 1, 1, intakeHeaders.length).setValues([intakeHeaders]);

  const patientQuestions = ss.insertSheet('PatientQuestions');
  patientQuestions.getRange(1, 1, 1, patientQuestionsHeaders.length).setValues([patientQuestionsHeaders]);

  // Sinh visit_date định dạng DDMMYY cho dữ liệu mẫu
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const visitDateStr = `${dd}${mm}${yy}`;
  const now = d.toISOString();

  // Add demo rows
  first.appendRow([
    'BN001',
    visitDateStr,
    'Nguyen Van A',
    'Tang huyet ap giai doan 2',
    'Huyet ap cao, can uong thuoc dung gio',
    'Uong dung 08:00 va 20:00. Khong bo lieu. Tai kham sau 2 tuan.',
    JSON.stringify([
      { name: 'Metoprolol', dosage: '50mg', frequency: '2 lan/ngay', timing: '08:00 + 20:00', days: 30, purpose: 'Ha huyet ap' }
    ]),
    JSON.stringify([
      { action: 'An it muoi', timing: 'Hang ngay', importance: 'High' },
      { action: 'Di bo 30 phut', timing: '5 ngay/tuan', importance: 'Medium' }
    ]),
    JSON.stringify([
      { symptom: 'Dau dau du doi', action: 'Goi bac si ngay' }
    ]),
    JSON.stringify({ date: '2 tuan', action: 'Tai kham + do huyet ap' }),
    'Bac si chan doan tang huyet ap va ke don Metoprolol 50mg.',
    now
  ]);

  reminders.appendRow([
    `R_BN001_${visitDateStr}_0800`,
    'BN001',
    visitDateStr,
    'Nguyen Van A',
    'Metoprolol',
    '50mg',
    '08:00',
    '2 lan/ngay',
    'FALSE',
    now
  ]);

  intake.appendRow([
    'INTAKE_001',
    'BN001',
    'Nguyen Van A',
    'Bac si chan doan tang huyet ap giai doan 2. Ke don Metoprolol 50mg, uong 2 lan moi ngay luc 08:00 va 20:00 trong 30 ngay. Benh nhan can an it muoi, di bo 30 phut moi ngay. Neu dau dau du doi hoac non, can lien he bac si ngay. Tai kham sau 2 tuan.',
    'Uong Metoprolol 08:00 va 20:00 moi ngay, khong tu y doi gio.',
    'pending',
    '',
    '',
    ''
  ]);

  reminders.appendRow([
    `R_BN001_${visitDateStr}_2000`,
    'BN001',
    visitDateStr,
    'Nguyen Van A',
    'Metoprolol',
    '50mg',
    '20:00',
    '2 lan/ngay',
    'FALSE',
    now
  ]);


  patientQuestions.appendRow([
    `PQ_BN001_${visitDateStr}_01`,
    'BN001',
    visitDateStr,
    'Nguyen Van A',
    'Neu quen 1 lieu Metoprolol thi phai lam sao?',
    '',
    'pending',
    now,
    ''
  ]);

  SpreadsheetApp.flush();

  Logger.log('Created spreadsheet: ' + ss.getUrl());
  return ss.getUrl();
}
