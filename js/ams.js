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
    return window.APP_DATA?.AMS_STUDENTS || [];
  },

  renderDashboard() {
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
      { icon: 'fa-file-signature', label: 'Admission Forms', value: students.filter(item => item.statusKey !== 'form_pending').length, meta: 'Started or submitted' },
      { icon: 'fa-folder-open', label: 'Document Pending', value: pendingDocs, meta: 'Verification required' },
      { icon: 'fa-receipt', label: 'Fee Pending', value: pendingFees, meta: 'Payment follow-up' },
      { icon: 'fa-indian-rupee-sign', label: 'Fee Collected', value: this.money(collectedFees), meta: `${this.money(totalFees - collectedFees)} outstanding` },
      { icon: 'fa-user-graduate', label: 'Onboarded', value: students.filter(item => item.statusKey === 'onboarded').length, meta: 'Student profile created' }
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
    const pipeline = window.APP_DATA?.AMS_PIPELINE || [];
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
    const statuses = window.APP_DATA?.AMS_STATUS_FLOW || [];
    const rows = this.students;
    const allCount = rows.length;
    container.innerHTML = `
      <div class="status-tab ${this.activeStatus === 'all' ? 'active' : ''}" data-ams-status="all" onclick="AMSModule.setAdmissionStatus('all')">
        All Shortlisted <span class="status-count">${allCount}</span>
      </div>
      ${statuses.map(status => {
        const count = rows.filter(row => row.statusKey === status.key).length;
        return `
          <div class="status-tab ${this.activeStatus === status.key ? 'active' : ''}" data-ams-status="${status.key}" onclick="AMSModule.setAdmissionStatus('${status.key}')">
            ${status.label} <span class="status-count">${count}</span>
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
      { icon: 'fa-users-rectangle', title: 'Batch Allocation', body: 'Course batch, classroom, faculty group, timetable, capacity, and waitlist handling.' },
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
      icon: student.statusKey === 'fee_pending' ? 'fa-phone' : student.statusKey === 'document_verification' ? 'fa-id-card' : 'fa-file-circle-check',
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
    const formPending = this.students.filter(student => student.statusKey === 'form_pending').length;
    const risks = [
      { type: 'danger', label: 'Fee Pending', text: `${feesPending} shortlisted admission(s) need payment follow-up.` },
      { type: 'warning', label: 'Missing Documents', text: `${docsPending} shortlisted lead(s) have incomplete verification.` },
      { type: 'info', label: 'Form Pending', text: `${formPending} shortlisted lead(s) still need admission form submission.` },
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
      const haystack = `${student.admissionNo} ${student.name} ${student.phone} ${student.course} ${student.batch}`.toLowerCase();
      return (!query || haystack.includes(query))
        && (status === 'all' || student.statusKey === status)
        && (course === 'all' || student.course === course);
    });

    tbody.innerHTML = rows.length ? rows.map(student => {
      const feePct = Math.round((student.paid / student.total) * 100);
      return `
        <tr>
          <td><strong>${student.admissionNo}</strong><br><span class="ams-muted">LMS: ${student.sourceLeadNo}</span></td>
          <td>
            <div class="ams-student-cell">
              <div class="ams-avatar">${this.initials(student.name)}</div>
              <div><strong>${student.name}</strong><span>${student.phone}</span></div>
            </div>
          </td>
          <td><strong>${student.course}</strong><br><span class="ams-muted">${student.batch}</span></td>
          <td><span class="badge badge-primary">${student.status}</span><br><span class="ams-muted">${student.application}</span></td>
          <td>${student.documents}<br><span class="ams-muted">${student.scholarship}</span></td>
          <td>
            <strong>${student.feeStatus}</strong>
            <div class="ams-table-progress"><span style="width:${feePct}%"></span></div>
            <span class="ams-muted">${this.money(student.paid)} / ${this.money(student.total)}</span>
          </td>
          <td>${student.owner}<br><span class="ams-muted">Lead: ${student.leadStatus}</span></td>
          <td><strong>${student.nextStep}</strong></td>
        </tr>
      `;
    }).join('') : `
      <tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:28px">No admission records match the current filters.</td></tr>
    `;
  },

  initials(name) {
    return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
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
