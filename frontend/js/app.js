// ===== Config Management =====
const CONFIG_KEY = 'isme_config';

function getDefaultConfig() {
    return {
        webhookUrl: 'http://localhost:5678/webhook/postvisit/qa',
        sheetId: ''
    };
}

function loadConfig() {
    try {
        const saved = localStorage.getItem(CONFIG_KEY);
        if (saved) {
            return { ...getDefaultConfig(), ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load config:', e);
    }
    return getDefaultConfig();
}

function saveConfig(config) {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        return true;
    } catch (e) {
        console.error('Failed to save config:', e);
        return false;
    }
}

// ===== Toast Notification =====
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

// ===== Status Box =====
function showStatus(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.className = `status-box ${type}`;
    el.textContent = message;
    el.classList.remove('hidden');
}

function hideStatus(elementId) {
    const el = document.getElementById(elementId);
    el.classList.add('hidden');
}

// ===== Tab Navigation =====
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-tab`) {
                    content.classList.add('active');
                }
            });

            if (targetTab === 'dashboard') {
                loadDashboardData();
            }
        });
    });
}

// ===== Config Modal =====
function initConfigModal() {
    const configBtn = document.getElementById('configBtn');
    const configModal = document.getElementById('configModal');
    const closeConfig = document.getElementById('closeConfig');
    const cancelConfig = document.getElementById('cancelConfig');
    const saveConfigBtn = document.getElementById('saveConfig');

    configBtn.addEventListener('click', () => {
        const config = loadConfig();
        document.getElementById('configWebhookUrl').value = config.webhookUrl;
        document.getElementById('configSheetId').value = config.sheetId;
        configModal.classList.remove('hidden');
    });

    const closeModal = () => configModal.classList.add('hidden');
    closeConfig.addEventListener('click', closeModal);
    cancelConfig.addEventListener('click', closeModal);

    configModal.addEventListener('click', (e) => {
        if (e.target === configModal) closeModal();
    });

    saveConfigBtn.addEventListener('click', () => {
        const config = {
            webhookUrl: document.getElementById('configWebhookUrl').value.trim(),
            sheetId: document.getElementById('configSheetId').value.trim()
        };

        if (!config.webhookUrl) {
            showToast('Vui lòng nhập Webhook URL');
            return;
        }

        if (saveConfig(config)) {
            showToast('Đã lưu cấu hình!');
            closeModal();
        } else {
            showToast('Lỗi khi lưu cấu hình');
        }
    });
}

// ===== Patient Lookup =====
let currentPatientData = null;

function initPatientLookup() {
    const lookupBtn = document.getElementById('lookupPatient');
    const patientIdInput = document.getElementById('patientId');

    lookupBtn.addEventListener('click', lookupPatient);

    patientIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            lookupPatient();
        }
    });
}

async function lookupPatient() {
    const patientId = document.getElementById('patientId').value.trim();

    if (!patientId) {
        showToast('Vui lòng nhập mã bệnh nhân');
        return;
    }

    const config = loadConfig();
    if (!config.sheetId) {
        showStatus('qaStatus', 'Vui lòng cấu hình Google Sheet ID trước (ấn nút ⚙️)', 'error');
        return;
    }

    setLoading(document.getElementById('lookupPatient'), true);
    hideStatus('qaStatus');

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json`;

    try {
        const response = await fetch(`${sheetUrl}&sheet=Visits`);
        const text = await response.text();
        const jsonStr = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);

        if (!jsonStr || !jsonStr[1]) {
            showStatus('qaStatus', 'Không đọc được dữ liệu từ Google Sheets', 'error');
            return;
        }

        const data = JSON.parse(jsonStr[1]);
        const visits = parseSheetData(data);

        const patientVisits = visits.filter(v => {
            const id = (v.patient_id || v.ma_benh_nhan || '').toString().trim();
            return id === patientId;
        });

        if (patientVisits.length === 0) {
            showStatus('qaStatus', `Không tìm thấy bệnh nhân với mã "${patientId}"`, 'error');
            hidePatientInfo();
            document.getElementById('askQuestion').disabled = true;
            currentPatientData = null;
            return;
        }

        currentPatientData = { patientId, visits: patientVisits };
        renderPatientInfo(patientVisits);
        document.getElementById('askQuestion').disabled = false;
        hideStatus('qaStatus');

    } catch (error) {
        showStatus('qaStatus', `Lỗi kết nối: ${error.message}`, 'error');
    } finally {
        setLoading(document.getElementById('lookupPatient'), false);
    }
}

function renderPatientInfo(visits) {
    const patientInfo = document.getElementById('patientInfo');
    const patientNameEl = document.getElementById('patientInfoName');
    const patientVisitsEl = document.getElementById('patientVisits');

    const patientName = visits[0].patient_name || visits[0].ten_benh_nhan || 'Không rõ tên';
    patientNameEl.textContent = patientName;

    patientVisitsEl.innerHTML = visits.map(v => {
        const diagnosis = v.diagnosis || v.chan_doan || 'Chưa có chẩn đoán';
        // Parse original DDMMYY format for display or just use it directly
        const visitDate = v.visit_date || v.ngay_kham || '...';
        let displayDate = visitDate;
        if (visitDate.length === 6) {
           displayDate = `${visitDate.substring(0,2)}/${visitDate.substring(2,4)}/20${visitDate.substring(4,6)}`;
        }
        
        const doctorAdvice = v.doctor_advice || v.loi_dan || '';

        return `
            <div class="visit-item">
                <div class="visit-item-header">
                    <span>Khám ngày ${displayDate} (Mã: ${visitDate})</span>
                </div>
                <div class="visit-item-detail">Chẩn đoán: ${truncate(diagnosis, 80)}</div>
                ${doctorAdvice ? `<div class="visit-item-detail">Lời dặn: ${truncate(doctorAdvice, 80)}</div>` : ''}
            </div>
        `;
    }).join('');

    patientInfo.classList.remove('hidden');
}

function hidePatientInfo() {
    document.getElementById('patientInfo').classList.add('hidden');
}

// ===== Q&A Chat =====
function initQAChat() {
    const askBtn = document.getElementById('askQuestion');
    const chatContainer = document.getElementById('qaChat');

    askBtn.addEventListener('click', async () => {
        const question = document.getElementById('qaQuestion').value.trim();

        if (!question) {
            showStatus('qaStatus', 'Vui lòng nhập câu hỏi', 'error');
            return;
        }

        if (!currentPatientData) {
            showStatus('qaStatus', 'Vui lòng tra cứu mã bệnh nhân trước', 'error');
            return;
        }

        const config = loadConfig();
        if (!config.webhookUrl) {
            showStatus('qaStatus', 'Vui lòng cấu hình Webhook URL trước (ấn nút ⚙️ góc phải)', 'error');
            return;
        }

        setLoading(askBtn, true);
        hideStatus('qaStatus');

        addChatMessage('user', question);

        const visitIds = currentPatientData.visits.map(v => v.visit_date).filter(Boolean);
        const latestVisit = currentPatientData.visits[currentPatientData.visits.length - 1];

        const payload = {
            patientId: currentPatientData.patientId,
            patientName: latestVisit.patient_name || latestVisit.ten_benh_nhan || '',
            visitDates: visitIds,
            latestVisitDate: visitIds[visitIds.length - 1] || '',
            question: question
        };

        try {
            const response = await fetch(config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*'
                },
                body: JSON.stringify(payload)
            });

            const rawText = await response.text();
            const data = tryParseJson(rawText);

            if (response.ok) {
                const answer = getAnswerFromWebhookPayload(data, rawText);
                addChatMessage('ai', answer);
                document.getElementById('qaQuestion').value = '';
            } else {
                const errorMsg = getErrorMessageFromWebhook(response, data, rawText);
                addChatMessage('ai', `Xin lỗi, có lỗi xảy ra: ${errorMsg}. Vui lòng thử lại.`);
            }
        } catch (error) {
            addChatMessage('ai', `Không thể kết nối tới hệ thống. Kiểm tra lại URL webhook. Chi tiết: ${error.message}`);
        } finally {
            setLoading(askBtn, false);
        }
    });

    document.getElementById('qaQuestion').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            askBtn.click();
        }
    });
}

function addChatMessage(type, text) {
    const chatContainer = document.getElementById('qaChat');
    const welcome = chatContainer.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = type === 'user' ? 'BN' : 'AI';

    const bubbleContainer = document.createElement('div');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'chat-time';
    time.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    bubbleContainer.appendChild(bubble);
    bubbleContainer.appendChild(time);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubbleContainer);

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ===== Dashboard =====
function initDashboard() {
    document.getElementById('refreshDashboard').addEventListener('click', loadDashboardData);
}

async function loadDashboardData() {
    const config = loadConfig();
    if (!config.sheetId) {
        showToast('Vui lòng cấu hình Google Sheet ID trước');
        return;
    }

    const refreshBtn = document.getElementById('refreshDashboard');
    setLoading(refreshBtn, true);

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json`;

    const tabs = ['Visits', 'Reminders', 'PatientQuestions', 'QnA'];
    const results = {};

    for (const tab of tabs) {
        try {
            const response = await fetch(`${sheetUrl}&sheet=${tab}`);
            const text = await response.text();
            const jsonStr = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
            if (jsonStr && jsonStr[1]) {
                const data = JSON.parse(jsonStr[1]);
                results[tab] = parseSheetData(data);
            } else {
                results[tab] = [];
            }
        } catch (e) {
            console.error(`Error loading ${tab}:`, e);
            results[tab] = [];
        }
    }

    renderVisits(results.Visits || []);
    renderReminders(results.Reminders || []);
    renderPatientQuestions(results.PatientQuestions || []);
    renderQnAHistory(results.QnA || []);

    setLoading(refreshBtn, false);
    showToast('Đã cập nhật dữ liệu từ Google Sheets');
}

function parseSheetData(data) {
    if (!data.table || !data.table.cols || !data.table.rows) return [];

    const cols = data.table.cols.map(col => col.label || col.id);
    const rows = data.table.rows.map(row => {
        const obj = {};
        row.c.forEach((cell, i) => {
            obj[cols[i]] = cell ? (cell.v !== null && cell.v !== undefined ? cell.v : '') : '';
        });
        return obj;
    });

    return rows;
}

function renderVisits(visits) {
    const container = document.getElementById('visitsList');
    const countEl = document.getElementById('visitsCount');
    countEl.textContent = visits.length;

    if (visits.length === 0) {
        container.innerHTML = '<p class="empty-state">Chưa có hồ sơ nào</p>';
        return;
    }

    container.innerHTML = visits.slice(-10).reverse().map(v => {
        const diagnosis = v.diagnosis || v.chan_doan || 'Chưa có chẩn đoán';
        const patientName = v.patient_name || v.ten_benh_nhan || 'Unknown';
        const patientId = v.patient_id || v.ma_benh_nhan || '';
        const visitDate = v.visit_date || v.ngay_kham || '';
        let displayDate = visitDate;
        if (visitDate.length === 6) {
           displayDate = `${visitDate.substring(0,2)}/${visitDate.substring(2,4)}/20${visitDate.substring(4,6)}`;
        }

        return `
            <div class="data-item">
                <div class="data-item-header">
                    <span class="data-item-title">${patientName} ${patientId ? `(${patientId})` : ''}</span>
                    <span class="data-item-meta">Ngày khám: ${displayDate}</span>
                </div>
                <div class="data-item-detail">${truncate(diagnosis, 80)}</div>
            </div>
        `;
    }).join('');
}

function renderReminders(reminders) {
    const container = document.getElementById('remindersList');
    const countEl = document.getElementById('remindersCount');
    countEl.textContent = reminders.length;

    if (reminders.length === 0) {
        container.innerHTML = '<p class="empty-state">Chưa có lịch nhắc</p>';
        return;
    }

    container.innerHTML = reminders.slice(-10).reverse().map(r => {
        const medName = r.medication_name || r.ten_thuoc || 'Thuốc';
        const dosage = r.dosage || r.lieu_luong || '';
        const timeSlot = r.time_slot || r.gio || '';
        const completed = (r.completed || '').toUpperCase() === 'TRUE';

        return `
            <div class="data-item">
                <div class="data-item-header">
                    <span class="data-item-title">${medName} ${dosage}</span>
                    <span class="data-item-meta">${completed ? '✅ Đã xong' : '⏰ ' + timeSlot}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderPatientQuestions(questions) {
    const container = document.getElementById('questionsList');
    const countEl = document.getElementById('questionsCount');
    const pendingCount = questions.filter(q => {
        const status = (q.status || '').toLowerCase();
        const answered = q.doctor_answer && q.doctor_answer.trim() !== '';
        return status === 'pending' || !answered;
    }).length;
    countEl.textContent = pendingCount;

    if (questions.length === 0) {
        container.innerHTML = '<p class="empty-state">Không có câu hỏi nào</p>';
        return;
    }

    container.innerHTML = questions.slice(-10).reverse().map(q => {
        const question = q.patient_question || q.cau_hoi || '';
        const answer = q.doctor_answer || q.bac_si_tra_loi || '';
        const patientName = q.patient_name || q.ten_benh_nhan || '';
        const status = answer ? '✅ Đã trả lời' : '⏳ Chờ trả lời';

        return `
            <div class="data-item">
                <div class="data-item-header">
                    <span class="data-item-title">${patientName}</span>
                    <span class="data-item-meta">${status}</span>
                </div>
                <div class="data-item-detail">Hỏi: ${truncate(question, 60)}</div>
                ${answer ? `<div class="data-item-detail">Trả lời: ${truncate(answer, 60)}</div>` : ''}
            </div>
        `;
    }).join('');
}

function renderQnAHistory(qnaList) {
    const container = document.getElementById('qnaList');
    const countEl = document.getElementById('qnaCount');
    countEl.textContent = qnaList.length;

    if (qnaList.length === 0) {
        container.innerHTML = '<p class="empty-state">Chưa có cuộc hội thoại nào</p>';
        return;
    }

    container.innerHTML = qnaList.slice(-10).reverse().map(q => {
        const question = q.question || q.cau_hoi || '';
        const answer = q.answer || q.cau_tra_loi || '';
        const patientName = q.patient_name || q.ten_benh_nhan || '';
        const visitDate = q.visit_date || q.ngay_kham || '';
        let displayDate = visitDate;
        if (visitDate.length === 6) {
           displayDate = `${visitDate.substring(0,2)}/${visitDate.substring(2,4)}/20${visitDate.substring(4,6)}`;
        }

        return `
            <div class="data-item">
                <div class="data-item-header">
                    <span class="data-item-title">${patientName}</span>
                    <span class="data-item-meta">Lần khám gần nhất: ${displayDate}</span>
                </div>
                <div class="data-item-detail">Hỏi: ${truncate(question, 50)}</div>
                <div class="data-item-detail">Đáp: ${truncate(answer, 50)}</div>
            </div>
        `;
    }).join('');
}

// ===== Utility Functions =====
function setLoading(btn, isLoading) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span>';
        btn.classList.add('loading');
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || btn.textContent;
        btn.classList.remove('loading');
    }
}

function truncate(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function tryParseJson(text) {
    if (!text || !text.trim()) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

function getAnswerFromWebhookPayload(data, rawText) {
    if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        const nested = first && first.json ? first.json : first;
        const answerFromArray = nested && (nested.answer || nested.message || nested.output || nested.text || nested.response);
        if (answerFromArray) return String(answerFromArray);
    }

    if (data && typeof data === 'object') {
        const direct = data.answer || data.message || data.output || data.text || data.response;
        if (direct) return String(direct);
    }

    if (rawText && rawText.trim()) return rawText.trim();
    return 'Đã gửi câu hỏi thành công nhưng hệ thống chưa trả nội dung. Kiểm tra node trả response trong n8n.';
}

function getErrorMessageFromWebhook(response, data, rawText) {
    if (data && typeof data === 'object') {
        const msg = data.error || data.message || data.detail;
        if (msg) return String(msg);
    }

    if (rawText && rawText.trim()) {
        return `Lỗi ${response.status}: ${rawText.trim()}`;
    }

    return `Lỗi ${response.status}: ${response.statusText}`;
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initConfigModal();
    initPatientLookup();
    initQAChat();
    initDashboard();

    const config = loadConfig();
    if (config.webhookUrl === 'http://localhost:5678/webhook/postvisit/qa') {
        setTimeout(() => {
            showToast('Nhấn nút ⚙️ để cấu hình URL webhook n8n của bạn', 5000);
        }, 1000);
    }
});
