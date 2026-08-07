// ============================================================
// AMS.JS - Admission Management System skeleton rendering
// ============================================================

const AMSModule = {
  activeStatus: 'all',

  init() {
    this.bindFilters();
    this.renderStatusTabs();
    this.renderDashboard();
    this.renderStudents();
  },

  get students() {
    const shortlistedStudents = window.APP_DATA?.AMS_STUDENTS || [];
    const otrStudents = window.AMSOTR?.getStudentRows?.() || [];
    return otrStudents.reduce((rows, otrStudent) => {
      const existingIndex = rows.findIndex(student =>
        (student.otrNo && otrStudent.otrNo && student.otrNo === otrStudent.otrNo) ||
        student.email?.toLowerCase() === otrStudent.email?.toLowerCase() ||
        student.phone === otrStudent.phone
      );
      if (existingIndex < 0) return [...rows, otrStudent];
      const existing = rows[existingIndex];
      rows[existingIndex] = {
        ...existing,
        ...otrStudent,
        otrNo: existing.otrNo || otrStudent.otrNo,
        sourceLeadNo: existing.sourceLeadNo,
        leadStatus: existing.leadStatus,
        course: existing.course,
        batch: existing.batch,
        owner: existing.owner,
        documents: existing.documents === '0/6 verified' ? '1/6 uploaded' : existing.documents
      };
      return rows;
    }, [...shortlistedStudents]);
  },

  renderDashboard() {
    if (window.AMSDashboard?.initialized) return window.AMSDashboard.render();
    this.renderStatusTabs();
    this.renderKPIs();
    this.renderPipeline();
    this.renderOperations();
    this.renderTasks();
    this.renderRisks();
  },

  renderKPIs() {
    const container = document.getElementById('ams-kpi-grid');
    if (!container) return;
    const students = this.students;
    const totalFees = students.reduce((sum, item) => sum + item.total, 0);
    const collectedFees = students.reduce((sum, item) => sum + item.paid, 0);
    const pendingDocs = students.filter(item => !item.documents.startsWith('6/6')).length;
    const pendingFees = students.filter(item => item.paid < item.total).length;
    const kpis = [
      { icon: 'fa-user-check', label: 'Shortlisted Leads', value: students.length, meta: 'Pulled from LMS shortlist' },
      { icon: 'fa-file-signature', label: 'OTR Forms', value: students.filter(item => item.statusKey !== 'otr_pending').length, meta: 'Draft or submitted' },
      { icon: 'fa-folder-open', label: 'Document Pending', value: pendingDocs, meta: 'Verification required' },
      { icon: 'fa-receipt', label: 'Fees Pending', value: pendingFees, meta: 'Payment follow-up' },
      { icon: 'fa-indian-rupee-sign', label: 'Fee Collected', value: this.money(collectedFees), meta: `${this.money(totalFees - collectedFees)} outstanding` },
      { icon: 'fa-user-graduate', label: 'Admission Confirmed', value: students.filter(item => item.statusKey === 'admission_confirmed').length, meta: 'Admission confirmed' }
    ];
    container.innerHTML = kpis.map(kpi => `
      <div class="ams-kpi-card">
        <div class="ams-kpi-icon"><i class="fas ${kpi.icon}"></i></div>
        <div>
          <span>${kpi.label}</span>
          <strong>${kpi.value}</strong>
          <small>${kpi.meta}</small>
        </div>
      </div>
    `).join('');
  },

  renderPipeline() {
    const container = document.getElementById('ams-pipeline-list');
    if (!container) return;
    const students = this.students;
    const pipeline = [...new Map((window.APP_DATA?.AMS_STATUS_FLOW || []).map(status => [status.stageKey, status])).values()]
      .filter(stage => stage.stageKey !== 'closed')
      .map(stage => {
        const count = students.filter(student => (window.APP_DATA?.AMS_STATUS_FLOW || []).find(status => status.key === student.statusKey)?.stageKey === stage.stageKey).length;
        return {
          ...stage,
          label: stage.stage,
          count,
          pct: students.length ? Math.max(8, Math.round((count / students.length) * 100)) : 0
        };
      });
    container.innerHTML = pipeline.map(stage => `
      <div class="ams-pipeline-row">
        <div class="ams-pipeline-icon"><i class="fas ${stage.icon}"></i></div>
        <div class="ams-pipeline-body">
          <div class="ams-pipeline-head">
            <span>${stage.label}</span>
            <strong>${stage.count}</strong>
          </div>
          <div class="ams-progress"><span style="width:${stage.pct}%"></span></div>
        </div>
        <small>${stage.pct}%</small>
      </div>
    `).join('');
  },

  renderStatusTabs() {
    const container = document.getElementById('ams-status-bar');
    if (!container) return;
    const statuses = [...new Map((window.APP_DATA?.AMS_STATUS_FLOW || []).map(status => [status.stageKey, status])).values()];
    const rows = this.students;
    const allCount = rows.length;
    container.innerHTML = `
      <div class="status-tab ${this.activeStatus === 'all' ? 'active' : ''}" data-ams-status="all" onclick="AMSModule.setAdmissionStatus('all')">
        All Shortlisted <span class="status-count">${allCount}</span>
      </div>
      ${statuses.map(status => {
        const count = rows.filter(row => (window.APP_DATA?.AMS_STATUS_FLOW || []).find(item => item.key === row.statusKey)?.stageKey === status.stageKey).length;
        return `
          <div class="status-tab ${this.activeStatus === status.stageKey ? 'active' : ''}" data-ams-status="${status.stageKey}" onclick="AMSModule.setAdmissionStatus('${status.stageKey}')">
            ${status.stage} <span class="status-count">${count}</span>
          </div>
        `;
      }).join('')}
    `;
  },

  setAdmissionStatus(status) {
    this.activeStatus = status;
    const filter = document.getElementById('ams-status-filter');
    if (filter) filter.value = status;
    this.renderStatusTabs();
    this.renderStudents();
  },

  renderOperations() {
    const container = document.getElementById('ams-ops-grid');
    if (!container) return;
    const ops = [
      { icon: 'fa-file-pen', title: 'Admission Form', body: 'Personal, guardian, academic, course, batch, hostel, and transport details.' },
      { icon: 'fa-folder-tree', title: 'Document Center', body: 'Photo, ID, marksheets, certificates, migration, category, and signed declarations.' },
      { icon: 'fa-sack-dollar', title: 'Fees & Receipts', body: 'Token, installments, discounts, scholarship approval, refunds, dues, and receipt print.' },
      { icon: 'fa-comments', title: 'Interview / Counselling', body: 'Interview slots, counsellor remarks, eligibility, parent notes, and admission approval.' },
      { icon: 'fa-users-rectangle', title: 'Course Selection', body: 'Course, batch, classroom, faculty group, timetable, capacity, and waitlist handling.' },
      { icon: 'fa-user-check', title: 'Student Onboarding', body: 'Student ID, LMS login, ID card, welcome kit, orientation, and first-day checklist.' }
    ];
    container.innerHTML = ops.map(item => `
      <div class="ams-op-card">
        <i class="fas ${item.icon}"></i>
        <strong>${item.title}</strong>
        <span>${item.body}</span>
      </div>
    `).join('');
  },

  renderTasks() {
    const container = document.getElementById('ams-task-list');
    if (!container) return;
    const tasks = this.students.slice(0, 4).map(student => ({
      icon: student.statusKey === 'fees_pending' ? 'fa-phone' : student.stageKey === 'interview' ? 'fa-id-card' : 'fa-file-circle-check',
      title: `${student.nextStep} - ${student.name}`,
      meta: `${student.course} - LMS ${student.sourceLeadNo} - due ${student.dueDate}`
    }));
    container.innerHTML = tasks.map(task => `
      <div class="ams-list-row">
        <div class="ams-row-icon"><i class="fas ${task.icon}"></i></div>
        <div>
          <strong>${task.title}</strong>
          <span>${task.meta}</span>
        </div>
      </div>
    `).join('');
  },

  renderRisks() {
    const container = document.getElementById('ams-risk-list');
    if (!container) return;
    const docsPending = this.students.filter(student => !student.documents.startsWith('6/6')).length;
    const feesPending = this.students.filter(student => student.paid < student.total).length;
    const formPending = this.students.filter(student => student.statusKey === 'otr_pending').length;
    const risks = [
      { type: 'danger', label: 'Fees Pending', text: `${feesPending} shortlisted admission(s) need payment follow-up.` },
      { type: 'warning', label: 'Missing Documents', text: `${docsPending} shortlisted lead(s) have incomplete verification.` },
      { type: 'info', label: 'OTR Pending', text: `${formPending} shortlisted lead(s) still need OTR form submission.` },
      { type: 'success', label: 'LMS Connected', text: 'AMS list is generated only from shortlisted LMS leads.' }
    ];
    container.innerHTML = risks.map(risk => `
      <div class="ams-risk-item ${risk.type}">
        <strong>${risk.label}</strong>
        <span>${risk.text}</span>
      </div>
    `).join('');
  },

  bindFilters() {
    ['ams-search-input', 'ams-status-filter', 'ams-course-filter'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.renderStudents());
      document.getElementById(id)?.addEventListener('change', () => {
        if (id === 'ams-status-filter') this.activeStatus = document.getElementById(id).value;
        this.renderStatusTabs();
        this.renderStudents();
      });
    });
  },

  renderStudents() {
    const tbody = document.getElementById('ams-student-table-body');
    if (!tbody) return;
    const query = (document.getElementById('ams-search-input')?.value || '').toLowerCase();
    const status = this.activeStatus || document.getElementById('ams-status-filter')?.value || 'all';
    const course = document.getElementById('ams-course-filter')?.value || 'all';
    const rows = this.students.filter(student => {
      const haystack = `${student.otrNo} ${student.name} ${student.phone} ${student.course} ${student.batch}`.toLowerCase();
      return (!query || haystack.includes(query))
        && (status === 'all' || student.statusKey === status)
        && (course === 'all' || student.course === course);
    });

    tbody.innerHTML = rows.length ? rows.map(student => {
      const feePct = student.total ? Math.round((student.paid / student.total) * 100) : 0;
      const source = student.sourceLeadNo || 'AMS Direct';
      const profileAction = student.otrId
        ? `<button class="otr-view-button" type="button" onclick="AMSOTR.openProfile('${this.escape(student.otrId)}')"><i class="fas fa-eye"></i> 360° Details</button>`
        : '';
      return `
        <tr>
          <td><strong>${this.escape(student.otrNo)}</strong><br><span class="ams-muted">Source: ${this.escape(source)}</span></td>
          <td>
            <div class="ams-student-cell">
              <div class="ams-avatar">${this.initials(student.name)}</div>
              <div><strong>${this.escape(student.name)}</strong><span>${this.escape(student.phone)}</span></div>
            </div>
          </td>
          <td><strong>${this.escape(student.course)}</strong><br><span class="ams-muted">${this.escape(student.batch)}</span></td>
          <td><span class="badge badge-primary">${this.escape(student.status)}</span><br><span class="ams-muted">${this.escape(student.application)}</span></td>
          <td>${this.escape(student.documents)}<br><span class="ams-muted">${this.escape(student.scholarship)}</span></td>
          <td>
            <strong>${this.escape(student.feeStatus)}</strong>
            <div class="ams-table-progress"><span style="width:${feePct}%"></span></div>
            <span class="ams-muted">${this.money(student.paid)} / ${this.money(student.total)}</span>
          </td>
          <td>${this.escape(student.owner)}<br><span class="ams-muted">Lead: ${this.escape(student.leadStatus)}</span></td>
          <td><strong>${this.escape(student.nextStep)}</strong>${profileAction}</td>
        </tr>
      `;
    }).join('') : `
      <tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:28px">No admission records match the current filters.</td></tr>
    `;
  },

  initials(name) {
    return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  },

  escape(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    })[character]);
  },

  money(value) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }
};

window.AMSModule = AMSModule;

// ============================================================
// AMS STUDENT PIPELINE - targeted requirement patch
// Keeps all changes scoped to the AMS Student Pipeline and its
// calendar entry point without altering LMS or Accounts modules.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const list = window.AMSStudentList;
  if (!list || list.__studentPipelineRequirementPatch) return;
  list.__studentPipelineRequirementPatch = true;

  const originalNormalizeStudent = list.normalizeStudent.bind(list);
  list.normalizeStudent = function normalizeStudentForPipeline(student, index) {
    const row = originalNormalizeStudent(student, index);
    const personal = row.otrRecord?.personal || {};
    const address = row.otrRecord?.address || {};
    const stageSequence = ['otr', 'course_selection', 'exam', 'interview', 'fees_pending', 'confirmed', 'closed'];
    const stageIndex = Math.max(0, stageSequence.indexOf(row.stageKey));
    const courseToken = String(row.course || 'GENERAL')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'GENERAL';
    const residence = [address.district || row.district, address.state || row.state].filter(Boolean).join(', ');

    return {
      ...row,
      courseId: student.courseId || student.courseCode || row.otrRecord?.courseId || `CRS-${courseToken}`,
      religion: student.religion || personal.religion || 'Not specified',
      residency: student.residency || personal.residency || residence || 'Gujarat',
      counsellor: student.counsellor || student.owner || row.owner || 'Admission Desk',
      examScore: student.examScore || student.examResult || (stageIndex >= 2 ? '78 / 100' : 'Pending'),
      interviewOutcome: student.interviewOutcome || student.interviewResult || (stageIndex >= 3 ? 'Recommended' : 'Pending'),
      finalDecision: student.finalDecision || student.admissionDecision || (row.stageKey === 'confirmed'
        ? 'Admission Confirmed'
        : row.stageKey === 'closed'
          ? (row.stageStatus || 'Admission Closed')
          : 'Pending'),
      registeredOn: student.registeredOn || row.admissionDateTime || row.otrRecord?.createdAt || student.createdAt || '',
      otrFormStarted: student.otrFormStarted || student.otrStartedAt || row.otrRecord?.createdAt || student.createdAt || ''
    };
  };

  const originalRenderRow = list.renderRow.bind(list);
  list.renderRow = function renderStudentPipelineRow(row, sequence) {
    const html = originalRenderRow(row, sequence);
    const expandMarker = '            <button type="button" data-amsl-row-action="expand"';
    if (!html.includes(expandMarker)) return html;
    const calendarButton = `            <button type="button" data-amsl-row-action="calendar" data-key="${this.escape(row.key)}" data-tooltip="Open Admission Calendar" title="Open Admission Calendar"><i class="fas fa-calendar-days"></i></button>\n`;
    return html.replace(expandMarker, `${calendarButton}${expandMarker}`);
  };

  list.renderExtendedRow = function renderStudentPipelineExpandedDrawer(row) {
    const empty = '\u2014';
    const latestActivity = row.activities?.[0];
    const latestUpdate = latestActivity
      ? [latestActivity.title, latestActivity.description].filter(Boolean).join(' — ')
      : row.latestUpdate || row.remark || row.purpose || 'Admission record created';
    const nextMilestone = row.nextMilestone || row.nextStep || row.purpose || row.stageStatus || row.stage || 'Admission review';
    const details = [
      ['LAST MODIFIED', row.updatedAt || row.admissionDateTime ? this.formatDateTime(row.updatedAt || row.admissionDateTime) : empty],
      ['NEXT MILESTONE', nextMilestone],
      ['REGISTERED ON', row.registeredOn ? this.formatDateTime(row.registeredOn) : empty],
      ['GENDER', row.gender || empty],
      ['RELIGION', row.religion || 'Not specified'],
      ['RESIDENCY', row.residency || empty],
      ['COUNSELLOR', row.counsellor || row.owner || 'Admission Desk'],
      ['EXAM SCORE', row.examScore || 'Pending'],
      ['INTERVIEW OUTCOME', row.interviewOutcome || 'Pending'],
      ['FINAL DECISION', row.finalDecision || 'Pending'],
      ['LATEST UPDATE', latestUpdate],
      ['OTR FORM STARTED', row.otrFormStarted ? this.formatDateTime(row.otrFormStarted) : empty]
    ];

    return `<section class="ams-admission-extended ams-admission-extended--row amsl-inline-drawer">
      <div class="ams-admission-summary">
        <div class="ams-admission-photo-column">
          <strong>${this.escape(row.course || 'Course not assigned')}</strong>
          <span>${this.escape(row.batch || 'Class not allocated')}</span>
          <span>DOB: ${this.escape(row.dateOfBirth ? this.formatShortDate(row.dateOfBirth) : empty)}</span>
          <span>OTR ID: ${this.escape(row.otrNo || empty)}</span>
          <span>COURSE ID: ${this.escape(row.courseId || empty)}</span>
          <span>ENQUIRY ID: ${this.escape(row.enquiryId || empty)}</span>
          <span>MODE OF LEARNING: ${this.escape(row.mode || empty)}</span>
        </div>
        <div class="ams-admission-info-grid">${details.map(([label, value]) => `<div><span>${this.escape(label)}</span><strong>${this.escape(value)}</strong></div>`).join('')}</div>
      </div>
      <footer class="ams-admission-assignment">
        <span><i class="fas fa-user-circle"></i> Assigned to <strong>${this.escape(row.owner || 'Admission Desk')}</strong>${row.assignedDate ? ` on ${this.escape(this.formatDateTime(row.assignedDate))}` : ''}</span>
        <button type="button" data-amsl-row-action="assign" data-key="${this.escape(row.key)}" aria-label="Edit owner assignment"><i class="fas fa-pen"></i></button>
      </footer>
    </section>`;
  };

  const originalHandleRowAction = list.handleRowAction.bind(list);
  list.handleRowAction = function handleStudentPipelineRowAction(action, key) {
    if (action === 'stage') {
      this.state.openMenuKey = '';
      return window.AMSAdmissionOps?.showFollowup?.(key);
    }
    if (action === 'calendar') {
      this.state.openMenuKey = '';
      if (typeof AMSApp !== 'undefined') return AMSApp.showScreen('calendar');
      document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
      document.getElementById('screen-calendar')?.classList.add('active');
      return window.AMSCalendar?.renderCalendar?.();
    }
    return originalHandleRowAction(action, key);
  };

  if (typeof AMSApp !== 'undefined') {
    AMSApp.setupSharedNavigation = function setupStudentPipelineNavigation() {
      window.SharedNavigation?.mount({
        module: 'ams',
        suiteLabel: 'AMS Suite v1.0',
        searchPlaceholder: 'Search AMS menu...',
        ariaLabel: 'AMS navigation',
        activeScreen: this.currentScreen,
        collapseButtonId: 'ams-sidebar-collapse-btn',
        collapseStorageKey: 'pa-ams-sidebar-collapsed',
        supportLabel: 'Admission Desk',
        role: 'ams-admin',
        permissions: {},
        menuItems: [
          { screen: 'ams-dashboard', icon: 'fa-building-columns', label: 'Admission Dashboard' },
          { screen: 'ams-students', icon: 'fa-users-viewfinder', label: 'Student Pipeline' },
          { href: 'otr-form.html', newTab: true, icon: 'fa-arrow-up-right-from-square', label: 'Student OTR Form' },
          { screen: 'ams-interviews', icon: 'fa-calendar-check', label: 'Interview Scheduling' },
          { type: 'title', label: 'Switch System' },
          { href: 'index.html', icon: 'fa-chart-line', label: 'Open LMS System' },
          { href: 'accounts.html', icon: 'fa-coins', label: 'Open Accounts System' }
        ],
        onScreen: screen => this.showScreen(screen),
        onAccountSettings: () => AMSAccountSettings.open()
      });
    };

    AMSApp.renderMobileBottomNav = function renderStudentPipelineMobileBottomNav() {
      const items = [
        { id: 'ams-dashboard', icon: 'fa-building-columns', label: 'Dashboard' },
        { id: 'ams-students', icon: 'fa-users-viewfinder', label: 'Students' },
        { id: 'ams-otr', icon: 'fa-file-circle-plus', label: 'OTR' },
        { id: 'ams-interviews', icon: 'fa-calendar-check', label: 'Interviews' }
      ];
      window.SharedNavigation?.renderBottomNav({
        items,
        activeId: this.currentScreen,
        compact: true,
        onSelect: screen => this.showScreen(screen)
      });
    };
  }
});
