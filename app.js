// =============================================
// 2026運動会 スケジュール管理アプリ - Main Application
// =============================================

// --- Initial Data (from Excel) ---
const INITIAL_DATA = {
    project: {
        title: '2026運動会　スケジュール',
        organization: '長田須磨地区',
        startDate: '2026-03-11'
    },
    phases: [
        {
            id: 'phase-1',
            name: 'フェーズ 1 本番3週間前',
            collapsed: false,
            tasks: [
                { id: 't1', name: '横断幕　印刷', assignee: '西村', progress: 0, start: '2026-03-12', end: '2026-03-13', memo: '' },
                { id: 't2', name: '応援　振り付け', assignee: '南園、難波', progress: 0.8, start: '2026-03-11', end: '2026-03-13', memo: '' },
                { id: 't3', name: '応援　かけ声', assignee: '南園、難波', progress: 0.5, start: '2026-03-11', end: '2026-03-13', memo: '' },
                { id: 't4', name: 'ヘキサゴン　メンバー決め', assignee: '児山、笛木、南園', progress: 0.3, start: '2026-03-11', end: '2026-03-13', memo: '' }
            ]
        },
        {
            id: 'phase-2',
            name: 'フェーズ 2 本番2週間前',
            collapsed: false,
            tasks: [
                { id: 't5', name: '応援パフォーマンス練習', assignee: '全員', progress: 0.5, start: '2026-03-14', end: '2026-03-21', memo: '' },
                { id: 't6', name: 'ヘキサゴン　走る練習', assignee: 'ヘキサゴンメンバー', progress: 0.5, start: '2026-03-14', end: '2026-03-21', memo: '' },
                { id: 't7', name: '衣装　男子甲冑（赤）', assignee: '長田布教所', progress: 0.1, start: '2026-03-14', end: '2026-03-21', memo: '' },
                { id: 't8', name: '衣装　女子甲冑（白）', assignee: '長田布教所', progress: 0.1, start: '2026-03-14', end: '2026-03-21', memo: '' },
                { id: 't9', name: '小道具　リストポンポン？', assignee: '長田布教所', progress: 0, start: '2026-03-14', end: '2026-03-21', memo: '' }
            ]
        },
        {
            id: 'phase-3',
            name: 'フェーズ 3 本番1週間前',
            collapsed: false,
            tasks: [
                { id: 't10', name: '衣装　メインキャスト', assignee: '長田布教所', progress: 0, start: '2026-03-23', end: '2026-03-27', memo: '' },
                { id: 't11', name: '横断幕　貼り付け+完成', assignee: '長田布教所', progress: 0, start: '2026-03-14', end: '2026-03-27', memo: '' }
            ]
        }
    ]
};

// --- App State ---
let appData = null;
let currentView = 'list';
let editingTask = null;
let editingPhase = null;
let currentTheme = 'light';

// Filter State
let searchQuery = '';
let filterStatus = 'all';
let filterAssignee = 'all';

// Calendar State
let currentCalendarDate = new Date();

// Drag state
let dragSource = null; // { phaseIdx, taskIdx }

// =============================================
// Utility Functions
// =============================================
function generateId() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

function daysBetween(start, end) {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
}

function getDayOfWeek(dateStr) {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr).getDay()];
}

function isWeekend(dateStr) {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
}

function isToday(dateStr) {
    const today = new Date();
    const d = new Date(dateStr);
    return today.getFullYear() === d.getFullYear() &&
        today.getMonth() === d.getMonth() &&
        today.getDate() === d.getDate();
}

function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getTaskStatus(task) {
    const today = new Date().toISOString().split('T')[0];
    if ((task.progress || 0) >= 1) return 'completed';
    if (task.end && task.end < today && (task.progress || 0) < 1) return 'overdue';
    if ((task.progress || 0) > 0) return 'in-progress';
    return 'not-started';
}

function getStatusLabel(status) {
    const labels = {
        'not-started': '未着手',
        'in-progress': '進行中',
        'completed': '完了',
        'overdue': '遅延'
    };
    return labels[status] || '';
}

function getStatusIcon(status) {
    const icons = {
        'not-started': '🔘',
        'in-progress': '🔵',
        'completed': '✅',
        'overdue': '🔴'
    };
    return icons[status] || '';
}

// =============================================
// Custom Confirm Dialog
// =============================================
function showConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('confirm-overlay');
        const msgEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');

        msgEl.textContent = message;
        overlay.classList.add('active');

        function cleanup() {
            overlay.classList.remove('active');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onOverlay);
        }
        function onOk() { cleanup(); resolve(true); }
        function onCancel() { cleanup(); resolve(false); }
        function onOverlay(e) { if (e.target === overlay) { cleanup(); resolve(false); } }

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        overlay.addEventListener('click', onOverlay);
    });
}

// =============================================
// Theme Management
// =============================================
const THEMES = ['dark', 'light', 'midnight', 'sakura', 'ocean', 'forest', 'nature', 'city'];

function setTheme(themeName) {
    if (!THEMES.includes(themeName)) themeName = 'light';
    currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('undoukai-theme', themeName);
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-theme') === themeName);
    });
}

function loadTheme() {
    const saved = localStorage.getItem('undoukai-theme');
    setTheme(saved || 'light');
}

function toggleThemePicker() {
    document.getElementById('theme-picker').classList.toggle('active');
}

function closeThemePicker() {
    document.getElementById('theme-picker').classList.remove('active');
}

// =============================================
// Data Layer
// =============================================
function loadData() {
    if (useFirebase && db) {
        db.ref('schedule').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                appData = data;
                if (appData.phases) {
                    appData.phases = Object.values(appData.phases).map(phase => {
                        if (phase.tasks && !Array.isArray(phase.tasks)) {
                            phase.tasks = Object.values(phase.tasks);
                        }
                        if (!phase.tasks) phase.tasks = [];
                        return phase;
                    });
                }
            } else {
                appData = JSON.parse(JSON.stringify(INITIAL_DATA));
                saveData();
            }
            render();
            updateConnectionStatus('online');
        }, (error) => {
            console.error('Firebase read error:', error);
            updateConnectionStatus('offline');
            loadFromLocal();
            render();
        });

        db.ref('.info/connected').on('value', (snap) => {
            updateConnectionStatus(snap.val() ? 'online' : 'offline');
        });
    } else {
        loadFromLocal();
        updateConnectionStatus('local');
        render();
    }
}

function loadFromLocal() {
    try {
        const saved = localStorage.getItem('undoukai-schedule');
        if (saved) {
            appData = JSON.parse(saved);
            if (appData.phases) {
                appData.phases.forEach(phase => {
                    if (!phase.tasks) phase.tasks = [];
                    if (!Array.isArray(phase.tasks)) phase.tasks = Object.values(phase.tasks);
                });
            }
        } else {
            appData = JSON.parse(JSON.stringify(INITIAL_DATA));
        }
    } catch (e) {
        appData = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
}

function saveData() {
    if (useFirebase && db) {
        db.ref('schedule').set(appData).catch(err => {
            console.error('Firebase write error:', err);
            showToast('保存に失敗しました', 'error');
        });
    }
    localStorage.setItem('undoukai-schedule', JSON.stringify(appData));
}

function updateConnectionStatus(status) {
    const dot = document.querySelector('.status-dot');
    const text = document.querySelector('.status-text');
    dot.className = 'status-dot';
    if (status === 'online') {
        dot.classList.add('online');
        text.textContent = 'リアルタイム同期中';
    } else if (status === 'offline') {
        dot.classList.add('offline');
        text.textContent = 'オフライン';
    } else {
        text.textContent = 'ローカルモード';
    }
}

// =============================================
// Backup and Restore
// =============================================
function exportData() {
    if (!appData) return;
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    // YYYYMMDD_HHMM format for filename
    const now = new Date();
    const dateStr = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + "_" +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0');
        
    a.download = `schedule_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('バックアップを保存しました', 'success');
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const confirmRestore = await showConfirm('選択したバックアップデータで現在の状態を上書きします。よろしいですか？');
        if (!confirmRestore) {
            event.target.value = ''; // Reset input
            return;
        }

        const text = await file.text();
        const importedData = JSON.parse(text);

        // Basic validation
        if (!importedData || !importedData.project || !Array.isArray(importedData.phases)) {
            throw new Error("無効なデータ形式です。");
        }

        appData = importedData;
        saveData(); // Saves to Firebase & LocalStorage
        render();
        showToast('データを復元しました', 'success');
    } catch (e) {
        console.error('Import error:', e);
        showToast('データの読み込みに失敗しました', 'error');
    } finally {
        event.target.value = ''; // Reset input
    }
}

// =============================================
// Filtering & Search
// =============================================
function matchesFilter(task) {
    // Search query
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (task.name || '').toLowerCase().includes(q);
        const assigneeMatch = (task.assignee || '').toLowerCase().includes(q);
        const memoMatch = (task.memo || '').toLowerCase().includes(q);
        if (!nameMatch && !assigneeMatch && !memoMatch) return false;
    }

    // Status filter
    if (filterStatus !== 'all') {
        const status = getTaskStatus(task);
        if (status !== filterStatus) return false;
    }

    // Assignee filter
    if (filterAssignee !== 'all') {
        if ((task.assignee || '') !== filterAssignee) return false;
    }

    return true;
}

function updateAssigneeFilter() {
    const select = document.getElementById('filter-assignee');
    const current = select.value;
    const assignees = new Set();

    appData.phases.forEach(phase => {
        (phase.tasks || []).forEach(task => {
            if (task.assignee) assignees.add(task.assignee);
        });
    });

    select.innerHTML = '<option value="all">すべての担当者</option>';
    [...assignees].sort().forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        select.appendChild(opt);
    });

    select.value = current;
}

function updateStats() {
    const allTasks = appData.phases.flatMap(p => p.tasks || []);
    const counts = { 'not-started': 0, 'in-progress': 0, 'completed': 0, 'overdue': 0 };

    allTasks.forEach(t => {
        const s = getTaskStatus(t);
        counts[s]++;
    });

    const bar = document.getElementById('stats-bar');
    bar.innerHTML = `
        <div class="stat-item">📋 <span class="stat-count">${allTasks.length}</span> 全タスク</div>
        <div class="stat-item">✅ <span class="stat-count">${counts.completed}</span> 完了</div>
        <div class="stat-item">🔵 <span class="stat-count">${counts['in-progress']}</span> 進行中</div>
        ${counts.overdue > 0 ? `<div class="stat-item">🔴 <span class="stat-count">${counts.overdue}</span> 遅延</div>` : ''}
    `;
}

// =============================================
// Rendering
// =============================================
function render() {
    renderHeader();
    renderPhases();
    updateAssigneeFilter(); // Keep these two calls as they are general UI updates
    updateStats();

    // Render other views if they are active
    if (currentView === 'gantt') renderGantt();
    if (currentView === 'calendar') renderCalendar();
    if (currentView === 'kanban') renderKanban();
}

function renderHeader() {
    if (!appData) return;
    document.getElementById('project-title').textContent = appData.project.title;
    document.getElementById('project-org').textContent = appData.project.organization;

    const now = new Date();
    document.getElementById('header-date').textContent =
        `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${getDayOfWeek(now.toISOString())}）`;

    const allTasks = appData.phases.flatMap(p => p.tasks || []);
    if (allTasks.length > 0) {
        const avg = allTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / allTasks.length;
        const pct = Math.round(avg * 100);
        document.getElementById('overall-progress-fill').style.width = pct + '%';
        document.getElementById('overall-progress-text').textContent = `全体進捗: ${pct}%`;
    } else {
        document.getElementById('overall-progress-fill').style.width = '0%';
        document.getElementById('overall-progress-text').textContent = `全体進捗: 0%`;
    }
}

function renderPhases() {
    const container = document.getElementById('phases-container');
    if (!container || !appData) return;
    container.innerHTML = '';

    appData.phases.forEach((phase, phaseIdx) => {
        const card = document.createElement('div');
        card.className = 'phase-card' + (phase.collapsed ? ' collapsed' : '');
        card.setAttribute('data-color', phaseIdx % 5);

        const tasks = phase.tasks || [];
        const visibleTasks = tasks.filter(matchesFilter);
        const phaseProgress = tasks.length > 0
            ? Math.round(tasks.reduce((s, t) => s + (t.progress || 0), 0) / tasks.length * 100)
            : 0;

        card.innerHTML = `
      <div class="phase-header" data-phase="${phaseIdx}">
        <div class="phase-header-left">
          <span class="phase-collapse-icon">▼</span>
          <span class="phase-name">${escapeHtml(phase.name)}</span>
        </div>
        <div class="phase-header-right">
          <span class="phase-task-count">${visibleTasks.length}/${tasks.length} タスク</span>
          <div class="phase-progress-mini">
            <div class="phase-progress-mini-fill" style="width: ${phaseProgress}%"></div>
          </div>
          <button class="phase-edit-btn" data-phase-edit="${phaseIdx}" title="フェーズを編集">✏️</button>
        </div>
      </div>
      <div class="phase-body">
        <div class="task-list-header">
          <span></span>
          <span>タスク名</span>
          <span>担当者</span>
          <span>進捗</span>
          <span>開始</span>
          <span>終了</span>
          <span>日数</span>
        </div>
        <div class="task-list" data-phase-tasks="${phaseIdx}"></div>
        <button class="btn btn-add-task" data-add-task="${phaseIdx}">＋ タスクを追加</button>
      </div>
    `;

        container.appendChild(card);

        // Render tasks
        const taskList = card.querySelector(`[data-phase-tasks="${phaseIdx}"]`);
        tasks.forEach((task, taskIdx) => {
            const visible = matchesFilter(task);
            const pct = Math.round((task.progress || 0) * 100);
            const days = daysBetween(task.start, task.end);
            const status = getTaskStatus(task);

            const taskEl = document.createElement('div');
            taskEl.className = 'task-item' + (visible ? '' : ' hidden');
            taskEl.setAttribute('data-task', `${phaseIdx}-${taskIdx}`);
            taskEl.setAttribute('draggable', 'true');

            const memoIcon = task.memo ? '<span class="task-memo-icon" title="メモあり">📝</span>' : '';
            const statusBadge = `<span class="task-status-badge badge-${status}">${getStatusIcon(status)} ${getStatusLabel(status)}</span>`;

            taskEl.innerHTML = `
        <div class="task-drag-handle" title="ドラッグで並べ替え"></div>
        <span class="task-name">${escapeHtml(task.name)}${memoIcon}${statusBadge}</span>
        <span class="task-assignee">${escapeHtml(task.assignee || '')}</span>
        <div class="task-progress-cell">
          <div class="task-progress-bar">
            <div class="task-progress-fill ${pct >= 100 ? 'complete' : ''}" style="width: ${pct}%"></div>
          </div>
          <span class="task-progress-text">${pct}%</span>
        </div>
        <span class="task-date">${formatDate(task.start)}</span>
        <span class="task-date">${formatDate(task.end)}</span>
        <span class="task-days">${days}日</span>
      `;

            // Click to edit (but not on drag handle)
            taskEl.addEventListener('click', (e) => {
                if (e.target.closest('.task-drag-handle')) return;
                openTaskModal(phaseIdx, taskIdx);
            });

            // --- Drag & Drop ---
            taskEl.addEventListener('dragstart', (e) => {
                dragSource = { phaseIdx, taskIdx };
                taskEl.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', `${phaseIdx}-${taskIdx}`);
            });

            taskEl.addEventListener('dragend', () => {
                taskEl.classList.remove('dragging');
                dragSource = null;
                document.querySelectorAll('.drag-over, .drag-over-below').forEach(el => {
                    el.classList.remove('drag-over', 'drag-over-below');
                });
            });

            taskEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                // Determine position
                document.querySelectorAll('.drag-over, .drag-over-below').forEach(el => {
                    el.classList.remove('drag-over', 'drag-over-below');
                });

                const rect = taskEl.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (e.clientY < mid) {
                    taskEl.classList.add('drag-over');
                } else {
                    taskEl.classList.add('drag-over-below');
                }
            });

            taskEl.addEventListener('dragleave', () => {
                taskEl.classList.remove('drag-over', 'drag-over-below');
            });

            taskEl.addEventListener('drop', (e) => {
                e.preventDefault();
                taskEl.classList.remove('drag-over', 'drag-over-below');

                if (!dragSource) return;

                const srcPhase = dragSource.phaseIdx;
                const srcIdx = dragSource.taskIdx;
                const dstPhase = phaseIdx;
                let dstIdx = taskIdx;

                // Drop below
                const rect = taskEl.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (e.clientY >= mid) dstIdx++;

                // Same position - no change
                if (srcPhase === dstPhase && (srcIdx === dstIdx || srcIdx + 1 === dstIdx)) {
                    dragSource = null;
                    return;
                }

                // Move the task
                const [movedTask] = appData.phases[srcPhase].tasks.splice(srcIdx, 1);

                // Adjust target index if same phase
                if (srcPhase === dstPhase && srcIdx < dstIdx) dstIdx--;

                appData.phases[dstPhase].tasks.splice(dstIdx, 0, movedTask);

                dragSource = null;
                saveData();
                render();
                showToast('タスクの順番を変更しました', 'success');
            });

            taskList.appendChild(taskEl);
        });

        // Also allow dropping on the task list itself (for empty lists)
        taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!dragSource) return;

            // Only handle if dropped on the list itself, not a task
            if (e.target !== taskList) return;

            const srcPhase = dragSource.phaseIdx;
            const srcIdx = dragSource.taskIdx;
            const [movedTask] = appData.phases[srcPhase].tasks.splice(srcIdx, 1);
            appData.phases[phaseIdx].tasks.push(movedTask);

            dragSource = null;
            saveData();
            render();
            showToast('タスクを移動しました', 'success');
        });

        // Event: toggle collapse
        const header = card.querySelector('.phase-header');
        header.addEventListener('click', (e) => {
            if (e.target.closest('.phase-edit-btn')) return;
            card.classList.toggle('collapsed');
            appData.phases[phaseIdx].collapsed = card.classList.contains('collapsed');
            saveData();
        });

        // Event: edit phase
        const editBtn = card.querySelector(`[data-phase-edit="${phaseIdx}"]`);
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openPhaseModal(phaseIdx);
        });

        // Event: add task
        const addBtn = card.querySelector(`[data-add-task="${phaseIdx}"]`);
        addBtn.addEventListener('click', () => addNewTask(phaseIdx));
    });
}

// =============================================
// Gantt Chart
// =============================================
function renderGantt() {
    const container = document.getElementById('gantt-container');
    if (!container || !appData) return;
    container.innerHTML = '';

    let minDate = null, maxDate = null;
    appData.phases.forEach(phase => {
        (phase.tasks || []).forEach(task => {
            if (task.start) {
                const s = new Date(task.start);
                if (!minDate || s < minDate) minDate = s;
            }
            if (task.end) {
                const e = new Date(task.end);
                if (!maxDate || e > maxDate) maxDate = e;
            }
        });
    });

    if (!minDate || !maxDate) {
        container.innerHTML = '<p style="color:var(--text-muted);padding:40px;text-align:center;">タスクがありません</p>';
        return;
    }

    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 3);
    const totalDays = Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

    const dates = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(minDate);
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const header = document.createElement('div');
    header.className = 'gantt-header';
    header.innerHTML = `
    <div class="gantt-label-col">タスク</div>
    <div class="gantt-timeline">
      ${dates.map(d => {
        const cls = ['gantt-day-col', isToday(d) ? 'today' : '', isWeekend(d) ? 'weekend' : ''].filter(Boolean).join(' ');
        return `<div class="${cls}"><span class="day-name">${getDayOfWeek(d)}</span><span class="day-num">${new Date(d).getDate()}</span></div>`;
    }).join('')}
    </div>`;
    container.appendChild(header);

    appData.phases.forEach((phase, phaseIdx) => {
        const phaseRow = document.createElement('div');
        phaseRow.className = 'gantt-row phase-row';
        phaseRow.innerHTML = `
      <div class="gantt-row-label"><span class="phase-name">${escapeHtml(phase.name)}</span></div>
      <div class="gantt-row-timeline">
        ${dates.map(d => {
            const cls = ['gantt-cell', isToday(d) ? 'today' : '', isWeekend(d) ? 'weekend' : ''].filter(Boolean).join(' ');
            return `<div class="${cls}"></div>`;
        }).join('')}
      </div>`;
        container.appendChild(phaseRow);

        (phase.tasks || []).forEach((task, taskIdx) => {
            if (!matchesFilter(task)) return;

            const row = document.createElement('div');
            row.className = 'gantt-row';
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => openTaskModal(phaseIdx, taskIdx));

            const status = getTaskStatus(task);
            const statusIcon = getStatusIcon(status);

            row.innerHTML = `
        <div class="gantt-row-label">
          <span class="task-name">${statusIcon} ${escapeHtml(task.name)}</span>
          <span class="task-assignee">${escapeHtml(task.assignee || '')}</span>
        </div>
        <div class="gantt-row-timeline">
          ${dates.map(d => {
                const cls = ['gantt-cell', isToday(d) ? 'today' : '', isWeekend(d) ? 'weekend' : ''].filter(Boolean).join(' ');
                return `<div class="${cls}"></div>`;
            }).join('')}
        </div>`;
            container.appendChild(row);

            if (task.start && task.end) {
                const timeline = row.querySelector('.gantt-row-timeline');
                const startIdx = dates.indexOf(task.start);
                const endIdx = dates.indexOf(task.end);
                if (startIdx >= 0 && endIdx >= 0) {
                    const bar = document.createElement('div');
                    bar.className = 'gantt-bar';
                    bar.setAttribute('data-color', phaseIdx % 5);
                    const cellWidth = 100 / totalDays;
                    bar.style.left = (startIdx * cellWidth) + '%';
                    bar.style.width = ((endIdx - startIdx + 1) * cellWidth) + '%';
                    const pct = Math.round((task.progress || 0) * 100);
                    bar.innerHTML = `<div class="gantt-bar-fill" style="width: ${pct}%"></div>`;
                    timeline.appendChild(bar);
                }
            }
        });
    });

    // Today line
    const todayStr = new Date().toISOString().split('T')[0];
    const todayIdx = dates.indexOf(todayStr);
    if (todayIdx >= 0) {
        container.querySelectorAll('.gantt-row-timeline').forEach(timeline => {
            const line = document.createElement('div');
            line.className = 'gantt-today-line';
            line.style.left = ((todayIdx + 0.5) / totalDays * 100) + '%';
            timeline.appendChild(line);
        });
    }
}

// =============================================
// Task Modal
// =============================================
function openTaskModal(phaseIdx, taskIdx) {
    if (!appData || !appData.phases[phaseIdx] || !appData.phases[phaseIdx].tasks[taskIdx]) {
        showToast('タスクが見つかりません', 'error');
        return;
    }

    editingTask = { phaseIdx, taskIdx };
    const task = appData.phases[phaseIdx].tasks[taskIdx];

    document.getElementById('modal-title').textContent = 'タスクを編集';
    document.getElementById('edit-task-name').value = task.name || '';
    document.getElementById('edit-task-assignee').value = task.assignee || '';
    document.getElementById('edit-task-start').value = task.start || '';
    document.getElementById('edit-task-end').value = task.end || '';
    document.getElementById('edit-task-memo').value = task.memo || '';

    const progressPct = Math.round((task.progress || 0) * 100);
    document.getElementById('edit-task-progress').value = progressPct;
    document.getElementById('progress-display').textContent = progressPct + '%';
    document.getElementById('progress-preview-bar').style.width = progressPct + '%';

    // Populate phase selector
    const phaseSelect = document.getElementById('edit-task-phase');
    phaseSelect.innerHTML = '';
    appData.phases.forEach((p, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = p.name;
        if (i === phaseIdx) opt.selected = true;
        phaseSelect.appendChild(opt);
    });

    document.getElementById('modal-overlay').classList.add('active');
    setTimeout(() => document.getElementById('edit-task-name').focus(), 100);
}

function closeTaskModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    editingTask = null;
}

function saveTask() {
    if (!editingTask) return;

    const { phaseIdx, taskIdx } = editingTask;
    if (!appData.phases[phaseIdx] || !appData.phases[phaseIdx].tasks[taskIdx]) {
        showToast('エラー: タスクが見つかりません', 'error');
        closeTaskModal();
        return;
    }

    const task = appData.phases[phaseIdx].tasks[taskIdx];
    task.name = document.getElementById('edit-task-name').value.trim() || 'タスク';
    task.assignee = document.getElementById('edit-task-assignee').value.trim();
    task.start = document.getElementById('edit-task-start').value;
    task.end = document.getElementById('edit-task-end').value;
    task.progress = parseInt(document.getElementById('edit-task-progress').value) / 100;
    task.memo = document.getElementById('edit-task-memo').value.trim();

    // Validate dates
    if (task.start && task.end && task.start > task.end) {
        showToast('開始日は終了日より前にしてください', 'error');
        return;
    }

    // Check if phase changed
    const newPhaseIdx = parseInt(document.getElementById('edit-task-phase').value);
    if (newPhaseIdx !== phaseIdx && appData.phases[newPhaseIdx]) {
        // Move task to new phase
        appData.phases[phaseIdx].tasks.splice(taskIdx, 1);
        appData.phases[newPhaseIdx].tasks.push(task);
        showToast(`「${task.name}」を「${appData.phases[newPhaseIdx].name}」に移動しました`, 'success');
    } else {
        showToast('タスクを保存しました', 'success');
    }

    saveData();
    closeTaskModal();
    render();
}

async function deleteTask() {
    if (!editingTask) return;
    const { phaseIdx, taskIdx } = editingTask;
    if (!appData.phases[phaseIdx] || !appData.phases[phaseIdx].tasks[taskIdx]) {
        showToast('エラー: タスクが見つかりません', 'error');
        closeTaskModal();
        return;
    }

    const taskName = appData.phases[phaseIdx].tasks[taskIdx].name || 'タスク';
    closeTaskModal();
    await new Promise(r => setTimeout(r, 200));

    const confirmed = await showConfirm(`「${taskName}」を削除しますか？`);
    if (!confirmed) return;

    if (!appData.phases[phaseIdx] || !appData.phases[phaseIdx].tasks[taskIdx]) {
        showToast('エラー: タスクが既に削除されています', 'error');
        render();
        return;
    }

    appData.phases[phaseIdx].tasks.splice(taskIdx, 1);
    saveData();
    render();
    showToast(`「${taskName}」を削除しました`, 'info');
}

function duplicateTask() {
    if (!editingTask) return;
    const { phaseIdx, taskIdx } = editingTask;
    if (!appData.phases[phaseIdx] || !appData.phases[phaseIdx].tasks[taskIdx]) {
        showToast('エラー: タスクが見つかりません', 'error');
        closeTaskModal();
        return;
    }

    const original = appData.phases[phaseIdx].tasks[taskIdx];
    const copy = {
        ...JSON.parse(JSON.stringify(original)),
        id: generateId(),
        name: original.name + '（コピー）',
        progress: 0
    };

    appData.phases[phaseIdx].tasks.splice(taskIdx + 1, 0, copy);
    saveData();
    closeTaskModal();
    render();
    showToast(`「${original.name}」を複製しました`, 'success');

    // Open the copy for editing
    setTimeout(() => openTaskModal(phaseIdx, taskIdx + 1), 300);
}

function addNewTask(phaseIdx) {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = addDays(today, 7);

    const newTask = {
        id: generateId(),
        name: '新しいタスク',
        assignee: '',
        progress: 0,
        start: today,
        end: nextWeek,
        memo: ''
    };

    if (!appData.phases[phaseIdx].tasks) appData.phases[phaseIdx].tasks = [];
    appData.phases[phaseIdx].tasks.push(newTask);
    saveData();
    render();

    const taskIdx = appData.phases[phaseIdx].tasks.length - 1;
    openTaskModal(phaseIdx, taskIdx);
}

// =============================================
// Phase Modal
// =============================================
function openPhaseModal(phaseIdx) {
    if (!appData || !appData.phases[phaseIdx]) {
        showToast('フェーズが見つかりません', 'error');
        return;
    }
    editingPhase = phaseIdx;
    const phase = appData.phases[phaseIdx];
    document.getElementById('phase-modal-title').textContent = 'フェーズを編集';
    document.getElementById('edit-phase-name').value = phase.name || '';
    document.getElementById('phase-modal-overlay').classList.add('active');
    setTimeout(() => document.getElementById('edit-phase-name').focus(), 100);
}

function closePhaseModal() {
    document.getElementById('phase-modal-overlay').classList.remove('active');
    editingPhase = null;
}

function savePhase() {
    if (editingPhase === null) return;
    if (!appData.phases[editingPhase]) {
        showToast('エラー: フェーズが見つかりません', 'error');
        closePhaseModal();
        return;
    }
    appData.phases[editingPhase].name = document.getElementById('edit-phase-name').value.trim() || 'フェーズ';
    saveData();
    closePhaseModal();
    render();
    showToast('フェーズを保存しました', 'success');
}

async function deletePhase() {
    if (editingPhase === null) return;
    if (!appData.phases[editingPhase]) {
        showToast('エラー: フェーズが見つかりません', 'error');
        closePhaseModal();
        return;
    }

    const phase = appData.phases[editingPhase];
    const phaseName = phase.name || 'フェーズ';
    const taskCount = (phase.tasks || []).length;
    const idxToDelete = editingPhase;

    closePhaseModal();
    await new Promise(r => setTimeout(r, 200));

    const confirmed = await showConfirm(`「${phaseName}」を削除しますか？\n（${taskCount}件のタスクも削除されます）`);
    if (!confirmed) return;

    if (!appData.phases[idxToDelete]) {
        showToast('エラー: フェーズが既に削除されています', 'error');
        render();
        return;
    }

    appData.phases.splice(idxToDelete, 1);
    saveData();
    render();
    showToast(`「${phaseName}」を削除しました`, 'info');
}

function addNewPhase() {
    const newPhase = { id: generateId(), name: '新しいフェーズ', collapsed: false, tasks: [] };
    appData.phases.push(newPhase);
    saveData();
    render();
    openPhaseModal(appData.phases.length - 1);
}

// =============================================
// View Toggle
// =============================================
function switchView(viewId) {
    currentView = viewId;
    
    // Update tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-view') === viewId);
    });

    // Update view containers
    document.getElementById('view-list').classList.toggle('active', viewId === 'list');
    document.getElementById('view-calendar').classList.toggle('active', viewId === 'calendar');
    document.getElementById('view-kanban').classList.toggle('active', viewId === 'kanban');
    document.getElementById('view-gantt').classList.toggle('active', viewId === 'gantt');

    // Render specific view if needed
    if (viewId === 'gantt') renderGantt();
    if (viewId === 'calendar') renderCalendar();
    if (viewId === 'kanban') renderKanban();
}

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday
    
    const endDate = new Date(lastDay);
    if (endDate.getDay() !== 6) {
        endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay())); // End on Saturday
    }

    // Collect all flat tasks
    const allTasks = [];
    if (appData && appData.phases) {
        appData.phases.forEach(p => {
            (p.tasks || []).forEach(t => {
                if (matchesFilter(t)) allTasks.push({ ...t, phaseId: p.id });
            });
        });
    }

    let html = `
        <div class="calendar-header">
            <button class="calendar-nav-btn" onclick="changeCalendarMonth(-1)">◀ 前月</button>
            <h2>${year}年 ${month + 1}月</h2>
            <button class="calendar-nav-btn" onclick="changeCalendarMonth(1)">翌月 ▶</button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-header">日</div>
            <div class="calendar-day-header">月</div>
            <div class="calendar-day-header">火</div>
            <div class="calendar-day-header">水</div>
            <div class="calendar-day-header">木</div>
            <div class="calendar-day-header">金</div>
            <div class="calendar-day-header">土</div>
    `;

    let currentDate = new Date(startDate);
    const todayIso = new Date().toISOString().split('T')[0];

    while (currentDate <= endDate) {
        // Adjust for local timezone to get correct ISO date string
        const localDate = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000));
        const dateIso = localDate.toISOString().split('T')[0];
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = dateIso === todayIso;
        
        // Find tasks active on this day
        const dayTasks = allTasks.filter(t => {
            if (!t.start || !t.end) return false;
            return dateIso >= t.start && dateIso <= t.end;
        });

        html += `
            <div class="calendar-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}">
                <div class="calendar-date">${currentDate.getDate()}</div>
                ${dayTasks.map(t => {
                    const status = getTaskStatus(t);
                    return `<div class="calendar-task ${status}" onclick="editTaskFromView('${t.id}', '${t.phaseId}')" title="${escapeHtml(t.name)}">
                        ${escapeHtml(t.name)}
                    </div>`;
                }).join('')}
            </div>
        `;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

// Global function for calendar navigation
window.changeCalendarMonth = function(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
};

window.editTaskFromView = function(taskId, phaseId) {
    // Avoid opening modal if we just dragged
    if (window.isDraggingKanban) return;
    
    // Find numeric indices that saveTask() expects
    let foundPhaseIdx = -1;
    let foundTaskIdx = -1;
    
    for (let pi = 0; pi < appData.phases.length; pi++) {
        if (appData.phases[pi].id === phaseId) {
            const tasks = appData.phases[pi].tasks || [];
            for (let ti = 0; ti < tasks.length; ti++) {
                if (tasks[ti].id === taskId) {
                    foundPhaseIdx = pi;
                    foundTaskIdx = ti;
                    break;
                }
            }
            if (foundTaskIdx >= 0) break;
        }
    }
    
    if (foundPhaseIdx < 0 || foundTaskIdx < 0) {
        showToast('タスクが見つかりません', 'error');
        return;
    }
    
    // Delegate to openTaskModal which sets editingTask = { phaseIdx, taskIdx }
    // This ensures saveTask() can correctly find and update the task
    openTaskModal(foundPhaseIdx, foundTaskIdx);
};

function renderKanban() {
    const container = document.getElementById('kanban-container');
    if (!container) return;

    // Initialize columns
    const columns = {
        'not-started': { label: '🔘 未着手', tasks: [] },
        'in-progress': { label: '🔵 進行中', tasks: [] },
        'completed':   { label: '✅ 完了', tasks: [] },
        'overdue':     { label: '🔴 遅延', tasks: [] }
    };

    if (appData && appData.phases) {
        appData.phases.forEach(p => {
            (p.tasks || []).forEach(t => {
                if (matchesFilter(t)) {
                    const status = getTaskStatus(t);
                    if (columns[status]) columns[status].tasks.push({ ...t, phaseId: p.id, phaseName: p.name });
                }
            });
        });
    }

    let html = '';
    for (const [status, col] of Object.entries(columns)) {
        html += `
            <div class="kanban-col" data-status="${status}" ondragover="handleKanbanDragOver(event)" ondragleave="handleKanbanDragLeave(event)" ondrop="handleKanbanDrop(event, '${status}')">
                <div class="kanban-col-header">
                    <span>${col.label}</span>
                    <span class="kanban-count">${col.tasks.length}</span>
                </div>
                <div class="kanban-cards">
                    ${col.tasks.map(t => `
                        <div class="kanban-card" draggable="true" ondragstart="handleKanbanDragStart(event, '${t.id}', '${t.phaseId}')" ondragend="handleKanbanDragEnd(event)" onclick="editTaskFromView('${t.id}', '${t.phaseId}')">
                            <div class="kanban-card-title">${escapeHtml(t.name)}</div>
                            <div class="kanban-card-meta">
                                <span class="kanban-card-assignee">${escapeHtml(t.assignee || '未定')}</span>
                                ${t.start && t.end ? `<span class="kanban-card-date">${formatDate(t.start)} - ${formatDate(t.end)}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Kanban Drag and Drop Handlers
window.isDraggingKanban = false;

window.handleKanbanDragStart = function(e, taskId, phaseId) {
    window.isDraggingKanban = true;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, phaseId }));
    e.dataTransfer.effectAllowed = 'move';
};

window.handleKanbanDragEnd = function(e) {
    e.currentTarget.classList.remove('dragging');
    setTimeout(() => { window.isDraggingKanban = false; }, 100);
    document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
};

window.handleKanbanDragOver = function(e) {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
    const col = e.currentTarget;
    if (!col.classList.contains('drag-over')) {
        col.classList.add('drag-over');
    }
};

window.handleKanbanDragLeave = function(e) {
    e.currentTarget.classList.remove('drag-over');
};

window.handleKanbanDrop = function(e, newStatus) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const phase = appData.phases.find(p => p.id === data.phaseId);
        if (!phase) return;
        const task = phase.tasks.find(t => t.id === data.taskId);
        if (!task) return;

        // Determine new progress based on dropped column
        let newProgress = task.progress;
        if (newStatus === 'not-started') {
            newProgress = 0;
        } else if (newStatus === 'in-progress') {
            // Only update to 50% if it wasn't already actively in progress (e.g. 0% or 100%)
            if ((task.progress || 0) <= 0 || (task.progress || 0) >= 1) {
                newProgress = 0.5;
            }
        } else if (newStatus === 'completed') {
            newProgress = 1;
        }

        // If 'overdue', we don't automatically change progress, we let it stay as is.
        // It's mostly a display status based on dates.
        
        task.progress = newProgress;
        saveData();
        render();
        showToast(`タスクの状況を更新しました`, 'success');

    } catch (err) {
        console.error('Drop error:', err);
    }
}

// =============================================
// Toast Notifications
// =============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${escapeHtml(message)}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// =============================================
// Event Listeners
// =============================================
function initEventListeners() {
    // Top right header buttons
    document.getElementById('btn-theme-toggle').addEventListener('click', toggleThemePicker);
    
    // View tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchView(e.currentTarget.getAttribute('data-view'));
        });
    });
    
    // Backup & Restore
    document.getElementById('btn-export-data').addEventListener('click', exportData);
    const importInput = document.getElementById('import-file-input');
    document.getElementById('btn-import-data').addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', importData);

    // Click outside theme picker to close
    document.addEventListener('click', (e) => {
        const picker = document.getElementById('theme-picker');
        const btn = document.getElementById('btn-theme-toggle');
        if (picker.classList.contains('active') && !picker.contains(e.target) && !btn.contains(e.target)) {
            closeThemePicker();
        }
    });

    // Theme options
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setTheme(e.currentTarget.getAttribute('data-theme'));
            closeThemePicker();
        });
    });

    // Add phase
    document.getElementById('btn-add-phase').addEventListener('click', addNewPhase);

    // Task modal
    document.getElementById('modal-close').addEventListener('click', closeTaskModal);
    document.getElementById('btn-cancel-edit').addEventListener('click', closeTaskModal);
    document.getElementById('btn-save-task').addEventListener('click', saveTask);
    document.getElementById('btn-delete-task').addEventListener('click', deleteTask);
    document.getElementById('btn-duplicate-task').addEventListener('click', duplicateTask);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeTaskModal();
    });

    // Phase modal
    document.getElementById('phase-modal-close').addEventListener('click', closePhaseModal);
    document.getElementById('btn-cancel-phase').addEventListener('click', closePhaseModal);
    document.getElementById('btn-save-phase').addEventListener('click', savePhase);
    document.getElementById('btn-delete-phase').addEventListener('click', deletePhase);
    document.getElementById('phase-modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closePhaseModal();
    });

    // Progress slider
    const progressSlider = document.getElementById('edit-task-progress');
    progressSlider.addEventListener('input', () => {
        const val = progressSlider.value;
        document.getElementById('progress-display').textContent = val + '%';
        document.getElementById('progress-preview-bar').style.width = val + '%';
    });

    // Search
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');

    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim();
        searchClear.classList.toggle('visible', searchQuery.length > 0);
        render();
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.classList.remove('visible');
        render();
    });

    // Filters
    document.getElementById('filter-status').addEventListener('change', (e) => {
        filterStatus = e.target.value;
        render();
    });

    document.getElementById('filter-assignee').addEventListener('change', (e) => {
        filterAssignee = e.target.value;
        render();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal();
            closePhaseModal();
            closeThemePicker();
        }
        if (e.key === 'Enter' && e.ctrlKey) {
            if (editingTask) saveTask();
            if (editingPhase !== null) savePhase();
        }
        // Ctrl+F to focus search
        if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// =============================================
// Initialize
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    initEventListeners();
    loadData();
});
