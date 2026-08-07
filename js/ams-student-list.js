// ============================================================
// AMS ADMISSION STUDENT LIST - AMS-only presentation and actions
// ============================================================

const AMSStudentList = {
  initialized: false,
  selected: new Set(),
  expanded: new Set(),
  state: {
    stage: 'otr',
    stageStatus: 'all',
    selectionMode: false,
    filtersVisible: true,
    allExpanded: false,
    sortField: 'admissionDate',
    sortDirection: 'desc',
    page: 1,
    pageSize: 10,
    openMenuKey: '',
    filters: {
      search: '', course: 'all', mode: 'all', gender: 'all', enquiry: '',
      otr: '', owner: 'all', dateFrom: '', dateTo: ''
    }
  },

  stages: [
    { key: 'all', label: 'All' },
    { key: 'otr', label: 'OTR Form' },
    { key: 'course_selection', label: 'Course Selection' },
    { key: 'exam', label: 'Exam' },
    { key: 'interview', label: 'Interview Stage' },
    { key: 'fees_pending', label: 'Fees Pending' },
    { key: 'confirmed', label: 'Admission Confirmed' },
    { key: 'closed', label: 'Admission Closed' }
  ],

  stageStatuses: {
    all: [],
    otr: [
      { key: 'all', label: 'All' },
      { key: 'Pending', label: 'Pending' },
      { key: 'Draft', label: 'Draft' },
      { key: 'Submitted', label: 'Submitted' }
    ],
    course_selection: [],
    exam: [
      { key: 'all', label: 'All' },
      { key: 'MCQ Stage', label: 'MCQ Stage' },
      { key: 'Descriptive Stage', label: 'Descriptive Stage' },
      { key: 'Submitted', label: 'Submitted' }
    ],
    interview: [
      { key: 'all', label: 'All' },
      { key: 'Academic', label: 'Academic' },
      { key: 'Personality', label: 'Personality' },
      { key: 'Overall', label: 'Overall' }
    ],
    fees_pending: [],
    confirmed: [],
    closed: [
      { key: 'all', label: 'All' },
      { key: 'Application Rejected', label: 'Application Rejected' },
      { key: 'Declined by Student', label: 'Declined by Student' }
    ]
  },

  init() {
    if (this.initialized || !document.getElementById('amsl-list')) return;
    this.initialized = true;
    this.bindEvents();
    this.populateFilters();
    this.render();
  },

  get rows() {
    const rows = (window.AMSModule?.students || []).map((student, index) => this.normalizeStudent(student, index));
    return window.AMSAdmissionOps?.decorateRows ? window.AMSAdmissionOps.decorateRows(rows) : rows;
  },

  normalizeStudent(student, index) {
    const otrRecord = student.otrId
      ? window.AMSOTR?.getRecords?.().find(record => record.id === student.otrId)
      : null;
    const address = otrRecord?.address || {};
    const education = otrRecord?.education || {};
    const highestEducation = [
      ['Master’s Degree', education.master],
      ['Bachelor’s Degree', education.bachelor],
      ['Diploma', education.diploma],
      ['12th (HSC)', education.hsc],
      ['10th (SSC)', education.ssc]
    ].find(([, fields]) => fields && Object.values(fields).some(Boolean))?.[0] || student.academicStatus || '';
    const cityParts = String(student.city || '').split(',').map(value => value.trim()).filter(Boolean);
    const legacyStatusMap = {
      form_pending: 'otr_pending', draft: 'otr_draft', form_submitted: 'otr_submitted',
      batch_allocation: 'course_selection', document_verification: 'interview_academic',
      fee_pending: 'fees_pending', onboarded: 'admission_confirmed', rejected: 'application_rejected'
    };
    const statusKey = legacyStatusMap[student.statusKey] || student.statusKey || 'otr_pending';
    let stageKey = 'otr';
    let stage = 'OTR Form';
    let stageStatus = 'Pending';
    if (statusKey === 'otr_submitted') {
      stageStatus = 'Submitted';
    } else if (statusKey === 'otr_draft') {
      stageStatus = 'Draft';
    } else if (statusKey === 'course_selection') {
      stageKey = 'course_selection'; stage = 'Course Selection'; stageStatus = '';
    } else if (['exam_mcq', 'exam_descriptive', 'exam_submitted'].includes(statusKey)) {
      stageKey = 'exam'; stage = 'Exam';
      stageStatus = statusKey === 'exam_mcq' ? 'MCQ Stage' : statusKey === 'exam_descriptive' ? 'Descriptive Stage' : 'Submitted';
    } else if (['interview_academic', 'interview_personality', 'interview_overall'].includes(statusKey)) {
      stageKey = 'interview'; stage = 'Interview Stage';
      stageStatus = statusKey === 'interview_academic' ? 'Academic' : statusKey === 'interview_personality' ? 'Personality' : 'Overall';
    } else if (statusKey === 'fees_pending') {
      stageKey = 'fees_pending'; stage = 'Fees Pending'; stageStatus = '';
    } else if (statusKey === 'admission_confirmed') {
      stageKey = 'confirmed';
      stage = 'Admission Confirmed';
      stageStatus = '';
    } else if (['application_rejected', 'declined_by_student'].includes(statusKey)) {
      stageKey = 'closed'; stage = 'Admission Closed';
      stageStatus = statusKey === 'application_rejected' ? 'Application Rejected' : 'Declined by Student';
    }
    const documentMatch = String(student.documents || '').match(/(\d+)\s*\/\s*(\d+)/);
    const verifiedDocuments = documentMatch ? Number(documentMatch[1]) : 0;
    const totalDocuments = documentMatch ? Number(documentMatch[2]) : 6;
    const otrNo = this.normalizeOtrId(student.otrNo || student.admissionNo, student.createdAt, index + 1);
    const internalKey = student.otrId || student.key || otrNo || `AMS-STUDENT-${index}`;
    const course = /^course not assigned$/i.test(String(student.course || '').trim()) ? '' : (student.course || '');
    const batch = /^pending allocation$/i.test(String(student.batch || '').trim()) ? '' : (student.batch || '');
    const personal = otrRecord?.personal || {};
    const photo = otrRecord?.documents?.passportPhoto;
    return {
      ...student,
      key: internalKey,
      otrNo,
      admissionNo: otrNo,
      course,
      batch,
      stageKey,
      stage,
      stageStatus,
      verifiedDocuments,
      totalDocuments,
      hasDocuments: Boolean(student.otrId || verifiedDocuments > 0),
      admissionDate: student.createdAt?.slice(0, 10) || '',
      enquiryId: student.enquiryId || student.sourceLeadNo || student.enqNo || '',
      source: student.source || student.sourceLeadNo || '',
      documentNote: student.scholarship || '',
      state: student.state || address.state || (cityParts.length > 1 ? cityParts[1] : ''),
      district: student.district || address.district || (cityParts.length === 1 ? cityParts[0] : cityParts[0] || ''),
      hostelStatus: student.hostelStatus || '',
      mode: student.learningMode || student.mode || '',
      academicStatus: highestEducation,
      query: student.query || student.remark || '',
      campaign: student.campaign || '',
      medium: student.medium || '',
      content: student.content || '',
      term: student.term || '',
      landingPage: student.landingPage || '',
      referrer: student.referrer || '',
      assignedDate: student.assignedDate || student.createdAt || '',
      admissionDateTime: student.createdAt || otrRecord?.createdAt || '',
      updatedAt: student.updatedAt || otrRecord?.updatedAt || student.createdAt || '',
      dateOfBirth: student.dateOfBirth || personal.dateOfBirth || '',
      gender: student.gender || personal.gender || '',
      photo: student.photo || (photo?.type?.startsWith('image/') ? photo.dataUrl : ''),
      channel: student.channel || student.mode || student.learningMode || '',
      subStatus: student.subStatus || '',
      statusKey,
      submissionStatus: student.submissionStatus || (statusKey === 'otr_pending' ? 'Not Submitted' : statusKey === 'otr_draft' ? 'Draft' : 'Submitted'),
      purpose: student.purpose || student.nextStep || '',
      nextActionDate: student.nextActionDate || student.dueDate || '',
      remark: student.remark || student.query || '',
      otrRecord
    };
  },

  bindEvents() {
    const screen = document.getElementById('screen-ams-students');
    const modal = document.getElementById('amsl-modal');
    screen.addEventListener('click', event => this.handleClick(event));
    screen.addEventListener('input', event => this.handleFilter(event));
    screen.addEventListener('change', event => this.handleFilter(event));
    modal?.addEventListener('click', event => {
      if (event.target === modal || event.target.closest('[data-amsl-close]')) return this.closeModal();
      const action = event.target.closest('[data-amsl-modal-action]');
      if (action) this.handleRowAction(action.dataset.amslModalAction, action.dataset.key);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.closeModal();
    });
  },

  handleClick(event) {
    const stage = event.target.closest('[data-amsl-stage]')?.dataset.amslStage;
    if (stage) return this.setStage(stage);
    const status = event.target.closest('[data-amsl-stage-status]')?.dataset.amslStageStatus;
    if (status) {
      this.state.stageStatus = status;
      this.render();
      return;
    }
    const tool = event.target.closest('[data-amsl-action]')?.dataset.amslAction;
    if (tool) return this.handleTool(tool);
    const selection = event.target.closest('[data-amsl-select-card]')?.dataset.amslSelectCard;
    if (selection) return this.toggleSelection(selection);
    const preview = event.target.closest('[data-amsl-preview]')?.dataset.amslPreview;
    if (preview) return window.AMSAdmissionDrawer?.open?.(preview, 'ams-360-documents');
    const rowAction = event.target.closest('[data-amsl-row-action]');
    if (rowAction) return this.handleRowAction(rowAction.dataset.amslRowAction, rowAction.dataset.key);
    const page = event.target.closest('[data-amsl-page]')?.dataset.amslPage;
    if (page) return this.setPage(Number(page));
    if (event.target.closest('.lead-expanded-body')) return;
    const card = event.target.closest('[data-amsl-card]')?.dataset.amslCard;
    if (card) return window.AMSAdmissionDrawer?.open?.(card);
  },

  handleFilter(event) {
    const map = {
      'amsl-search': 'search',
      'amsl-course-filter': 'course',
      'amsl-mode-filter': 'mode',
      'amsl-gender-filter': 'gender',
      'amsl-enquiry-filter': 'enquiry',
      'amsl-otr-filter': 'otr',
      'amsl-owner-filter': 'owner',
      'amsl-date-from-filter': 'dateFrom',
      'amsl-date-to-filter': 'dateTo'
    };
    const key = map[event.target.id];
    if (key) {
      this.state.filters[key] = event.target.value;
      this.state.page = 1;
    } else if (event.target.id === 'amsl-page-size') {
      this.state.pageSize = Number(event.target.value) || 10;
      this.state.page = 1;
    } else return;
    this.renderTable();
    this.renderSelectionBar();
  },

  setStage(stage) {
    this.state.stage = stage;
    this.state.stageStatus = this.stageStatuses[stage]?.[0]?.key || 'all';
    this.selected.clear();
    this.state.page = 1;
    this.render();
  },

  render() {
    this.renderStageNav();
    this.renderStatusNav();
    this.renderTable();
    this.renderSelectionBar();
    this.syncControls();
  },

  renderStageNav() {
    const container = document.getElementById('amsl-stage-nav');
    if (!container) return;
    const rows = this.rows;
    container.innerHTML = this.stages.map(stage => {
      const count = stage.key === 'all' ? rows.length : rows.filter(row => row.stageKey === stage.key).length;
      return `<button type="button" class="${this.state.stage === stage.key ? 'active' : ''}" data-amsl-stage="${stage.key}"><span>${stage.label}</span><b>${count}</b></button>`;
    }).join('');
  },

  renderStatusNav() {
    const container = document.getElementById('amsl-status-nav');
    if (!container) return;
    const statuses = this.stageStatuses[this.state.stage] || [];
    container.hidden = !statuses.length;
    if (!statuses.length) {
      container.innerHTML = '';
      return;
    }
    const stageRows = this.rows.filter(row => row.stageKey === this.state.stage);
    container.innerHTML = statuses.map(status => {
      const count = status.key === 'all' ? stageRows.length : stageRows.filter(row => row.stageStatus === status.key).length;
      return `<button type="button" class="${this.state.stageStatus === status.key ? 'active' : ''}" data-amsl-stage-status="${status.key}"><span>${status.label}</span><b>${count}</b></button>`;
    }).join('');
  },

  filteredRows() {
    const f = this.state.filters;
    return this.rows.filter(row => {
      const stageMatch = this.state.stage === 'all' || row.stageKey === this.state.stage;
      const stageStatusMatch = this.state.stageStatus === 'all' || this.state.stage === 'all' || row.stageStatus === this.state.stageStatus;
      const haystack = `${row.name} ${row.phone} ${row.otrNo} ${row.enquiryId}`.toLowerCase();
      return stageMatch && stageStatusMatch
        && (!f.search || haystack.includes(f.search.toLowerCase()))
        && (f.course === 'all' || row.course === f.course)
        && (f.mode === 'all' || row.mode === f.mode)
        && (f.gender === 'all' || row.gender === f.gender)
        && (!f.enquiry || row.enquiryId.toLowerCase().includes(f.enquiry.toLowerCase()))
        && (!f.otr || row.otrNo.toLowerCase().includes(f.otr.toLowerCase()))
        && (f.owner === 'all' || row.owner === f.owner)
        && (!f.dateFrom || row.admissionDate >= f.dateFrom)
        && (!f.dateTo || row.admissionDate <= f.dateTo);
    }).sort((left, right) => {
      const field = this.state.sortField || 'admissionDate';
      const leftValue = String(left[field] || '').toLowerCase();
      const rightValue = String(right[field] || '').toLowerCase();
      return leftValue.localeCompare(rightValue, undefined, { numeric: true }) * (this.state.sortDirection === 'asc' ? 1 : -1);
    });
  },

  renderTable() {
    const container = document.getElementById('amsl-list');
    if (!container) return;
    const rows = this.filteredRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / this.state.pageSize));
    this.state.page = Math.min(this.state.page, totalPages);
    const start = (this.state.page - 1) * this.state.pageSize;
    const visible = rows.slice(start, start + this.state.pageSize);
    container.innerHTML = visible.length
      ? visible.map((row, index) => this.renderRow(row, start + index + 1)).join('')
      : `<div class="amsl-empty"><i class="fas fa-user-graduate"></i><strong>No admission records found</strong><span>Change the stage, status, or admission filters.</span></div>`;
    this.renderPagination(rows.length, start, visible.length, totalPages);
  },

  renderRow(row, sequence) {
    const selected = this.selected.has(row.key);
    const expanded = this.state.allExpanded || this.expanded.has(row.key);
    return `
      <article class="amsl-card ${expanded ? 'is-expanded' : ''} ${selected ? 'is-selected' : ''}" data-amsl-card="${this.escape(row.key)}">
        <div class="amsl-card-header">
          <button type="button" class="amsl-card-number ${selected ? 'is-selected' : ''}" data-amsl-select-card="${this.escape(row.key)}" aria-label="${selected ? 'Deselect' : 'Select'} ${this.escape(row.name)}">
            ${selected ? '<i class="fas fa-check"></i>' : sequence}
          </button>

          <div class="amsl-card-student">
            <span class="amsl-card-avatar">${row.photo ? `<img src="${this.escape(row.photo)}" alt="">` : this.escape(this.initials(row.name))}</span>
            <div><button type="button" class="amsl-card-name" data-amsl-row-action="view" data-key="${this.escape(row.key)}">${this.escape(row.name)}</button>
            <span><i class="fas fa-phone"></i>${this.escape(row.phone)}<button type="button" class="amsl-inline-email" data-amsl-row-action="email" data-key="${this.escape(row.key)}" title="Email ${this.escape(row.name)}"><i class="fas fa-envelope"></i></button></span></div>
          </div>

          <div class="amsl-card-stage">
            <span class="amsl-stage-badge ${row.stageKey}">${this.escape(row.stage)}</span>
            <span class="amsl-status-badge ${this.slug(row.stageStatus)}">${this.escape(row.stageStatus)}</span>
          </div>

          <div class="amsl-card-meta">
            <span><i class="fas fa-id-card"></i>${this.escape(row.otrNo)}</span>
            <button type="button" data-amsl-preview="${this.escape(row.key)}" ${row.hasDocuments ? '' : 'disabled'}><i class="fas fa-folder-open"></i>${this.escape(row.documents || `${row.verifiedDocuments}/${row.totalDocuments} verified`)}</button>
          </div>

          <div class="amsl-card-owner">
            <span>${this.timeAgo(row.admissionDate)}</span>
            <small>${this.escape(row.owner)}</small>
          </div>

          <div class="amsl-row-actions">
            <button type="button" data-amsl-row-action="view" data-key="${this.escape(row.key)}" data-tooltip="Open 360° details" title="Open 360° details"><i class="fas fa-eye"></i></button>
            <button type="button" data-amsl-row-action="funnel" data-key="${this.escape(row.key)}" data-tooltip="Admission journey" title="Admission journey"><i class="fas fa-route"></i></button>
            <button type="button" class="call" data-amsl-row-action="call" data-key="${this.escape(row.key)}" data-tooltip="Call student" title="Call student"><i class="fas fa-phone"></i></button>
            <button type="button" class="whatsapp" data-amsl-row-action="whatsapp" data-key="${this.escape(row.key)}" data-tooltip="WhatsApp student" title="WhatsApp student"><i class="fab fa-whatsapp"></i></button>
            <button type="button" class="email" data-amsl-row-action="email" data-key="${this.escape(row.key)}" data-tooltip="Email student" title="Email student"><i class="fas fa-envelope"></i></button>
            <div class="amsl-more-wrap">
              <button type="button" data-amsl-row-action="more" data-key="${this.escape(row.key)}" data-tooltip="More admission actions" title="More admission actions" aria-expanded="${this.state.openMenuKey === row.key ? 'true' : 'false'}"><i class="fas fa-ellipsis-vertical"></i></button>
              ${this.state.openMenuKey === row.key ? `<div class="amsl-more-menu">
                <button type="button" data-amsl-row-action="view360" data-key="${this.escape(row.key)}"><i class="fas fa-arrows-to-eye"></i><span>360° admission details</span></button>
                <button type="button" data-amsl-row-action="followup" data-key="${this.escape(row.key)}"><i class="fas fa-redo"></i><span>Manage follow-up</span></button>
                <button type="button" data-amsl-row-action="assign" data-key="${this.escape(row.key)}"><i class="fas fa-user-check"></i><span>Assign owner</span></button>
                <button type="button" data-amsl-row-action="stage" data-key="${this.escape(row.key)}"><i class="fas fa-tags"></i><span>Update stage</span></button>
                <button type="button" data-amsl-row-action="documents" data-key="${this.escape(row.key)}" ${row.hasDocuments ? '' : 'disabled'}><i class="fas fa-folder-open"></i><span>View documents in 360° details</span></button>
                <button type="button" data-amsl-row-action="duplicate" data-key="${this.escape(row.key)}"><i class="fas fa-clone"></i><span>Duplicate scan</span></button>
                <button type="button" data-amsl-row-action="print" data-key="${this.escape(row.key)}"><i class="fas fa-print"></i><span>Print admission</span></button>
                <button type="button" data-amsl-row-action="copy" data-key="${this.escape(row.key)}"><i class="fas fa-copy"></i><span>Copy OTR ID</span></button>
                <span class="amsl-menu-divider"></span>
                <button type="button" class="danger" data-amsl-row-action="archive" data-key="${this.escape(row.key)}"><i class="fas fa-box-archive"></i><span>Archive</span></button>
                <button type="button" class="danger" data-amsl-row-action="delete" data-key="${this.escape(row.key)}"><i class="fas fa-trash"></i><span>Delete</span></button>
              </div>` : ''}
            </div>
            <button type="button" data-amsl-row-action="expand" data-key="${this.escape(row.key)}" data-tooltip="${expanded ? 'Collapse' : 'Expand'} quick-access drawer" title="${expanded ? 'Collapse' : 'Expand'} quick-access drawer"><i class="fas fa-chevron-${expanded ? 'up' : 'down'}"></i></button>
          </div>
        </div>

        <div class="lead-expanded-body amsl-reused-expanded amsl-inline-drawer-shell ${expanded ? 'is-open' : ''}" id="amsl-lead-body-${this.escape(row.key)}" style="display:${expanded ? 'block' : 'none'}" aria-hidden="${!expanded}">
          ${this.renderExtendedRow(row)}
        </div>
      </article>
    `;
  },

  renderExtendedRow(row) {
    const empty = '\u2014';
    const photo = row.photo
      ? `<img src="${this.escape(row.photo)}" alt="${this.escape(row.name)}">`
      : `<span>${this.escape(this.initials(row.name))}</span>`;
    const details = [
      ['Last Modified Date', row.updatedAt || row.admissionDateTime ? this.formatDateTime(row.updatedAt || row.admissionDateTime) : empty],
      ['Next Action Date', row.nextActionDate || empty],
      ['Gender', row.gender || empty],
      ['Channel', row.channel || empty],
      ['Source', row.source || empty],
      ['Campaign', row.campaign || empty],
      ['Submission Status', row.submissionStatus || empty],
      ['Purpose', row.purpose || empty],
      ['Remark', row.remark || row.query || empty]
    ];
    return `<section class="ams-admission-extended ams-admission-extended--row amsl-inline-drawer">
      <div class="ams-admission-summary">
        <div class="ams-admission-photo-column">
          <div class="ams-admission-photo">${photo}</div>
          <strong>${this.escape(row.course || 'Course not assigned')}</strong>
          <span>${this.escape(row.batch || 'Class not allocated')}</span>
          <span>DOB: ${this.escape(row.dateOfBirth ? this.formatShortDate(row.dateOfBirth) : empty)}</span>
          <span>OTR ID: ${this.escape(row.otrNo || empty)}</span>
          <span>MODE OF LEARNING: ${this.escape(row.mode || empty)}</span>
        </div>
        <div class="ams-admission-info-grid">${details.map(([label, value], index) => `<div class="${index >= 7 ? 'wide' : ''}"><span>${this.escape(label)}</span><strong>${this.escape(value)}</strong></div>`).join('')}</div>
      </div>
      <footer class="ams-admission-assignment">
        <span><i class="fas fa-user-circle"></i> Assigned to <strong>${this.escape(row.owner || 'Admission Desk')}</strong>${row.assignedDate ? ` on ${this.escape(this.formatDateTime(row.assignedDate))}` : ''}</span>
        <button type="button" data-amsl-row-action="assign" data-key="${this.escape(row.key)}" aria-label="Edit owner assignment"><i class="fas fa-pen"></i></button>
      </footer>
    </section>`;
  },

  renderExtendedRowLegacy(row, sequence, selected) {
    const menuOpen = this.state.extendedMenuKey === row.key;
    const photo = row.photo
      ? `<img src="${this.escape(row.photo)}" alt="${this.escape(row.name)}">`
      : `<span>${this.escape(this.initials(row.name))}</span>`;
    const details = [
      ['Last Modified', this.formatDateTime(row.updatedAt || row.admissionDateTime)],
      ['Next Action Date', row.nextActionDate || '—'],
      ['Gender', row.gender || '—'],
      ['Channel', row.channel || '—'],
      ['Source', row.source || '—'],
      ['Campaign', row.campaign || '—'],
      ['Status', row.status || row.stageStatus || '—'],
      ['Sub-status', row.subStatus || '—'],
      ['Submission Status', row.submissionStatus || '—'],
      ['Purpose', row.purpose || '—'],
      ['Remark', row.remark || row.query || '—']
    ];
    return `<section class="ams-admission-extended ams-admission-extended--row">
      <header class="ams-admission-extended-head">
        <button type="button" class="ams-admission-select ${selected ? 'selected' : ''}" data-amsl-select-card="${this.escape(row.key)}" aria-label="${selected ? 'Deselect' : 'Select'} ${this.escape(row.name)}">${selected ? '<i class="fas fa-check"></i>' : sequence}</button>
        <div class="ams-admission-identity">
          <strong>${this.escape(row.name)}</strong>
          <span>${row.phone ? `<span><i class="fas fa-phone"></i>${this.escape(row.phone)}</span>` : ''}${row.email ? `<span><i class="fas fa-envelope"></i>${this.escape(row.email)}</span>` : ''}</span>
        </div>
        <div class="ams-admission-stage"><strong>${this.escape(row.stage)}</strong><span>${this.escape(row.stageStatus)}</span></div>
        <div class="ams-admission-extended-controls">
          <div class="ams-admission-communication">
            <button type="button" data-amsl-row-action="assign" data-key="${this.escape(row.key)}" title="Assign owner"><i class="fas fa-users"></i></button>
            <button type="button" data-amsl-row-action="whatsapp" data-key="${this.escape(row.key)}" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>
            <button type="button" data-amsl-row-action="email" data-key="${this.escape(row.key)}" title="Email"><i class="fas fa-envelope"></i></button>
            <button type="button" data-amsl-row-action="documents" data-key="${this.escape(row.key)}" title="Documents" ${row.hasDocuments ? '' : 'disabled'}><i class="fas fa-file-pdf"></i></button>
            <button type="button" data-amsl-row-action="funnel" data-key="${this.escape(row.key)}" title="Admission journey"><i class="fas fa-list"></i></button>
          </div>
          <div class="ams-admission-actions-wrap">
            <button type="button" class="ams-admission-actions-trigger" data-amsl-extended-action="menu" data-key="${this.escape(row.key)}" aria-expanded="${menuOpen}"><i class="fas fa-bolt"></i> Actions <i class="fas fa-chevron-down"></i></button>
            ${menuOpen ? `<div class="ams-admission-actions-menu">${this.renderExtendedActionMenu(row)}</div>` : ''}
          </div>
          ${row.followupDate ? `<span class="ams-admission-followup-time"><i class="fas fa-calendar-days"></i>${this.escape(this.relativeTime(row.followupDate))}</span>` : ''}
          <button type="button" class="ams-admission-summary-toggle" data-amsl-row-action="expand" data-key="${this.escape(row.key)}" title="Collapse admission summary"><i class="fas fa-chevron-up"></i></button>
        </div>
      </header>
      <div class="ams-admission-summary">
        <div class="ams-admission-photo-column">
          <div class="ams-admission-photo">${photo}</div>
          <strong>${this.escape(row.course || 'Course not assigned')}</strong>
          <span>${this.escape(row.batch || 'Class not allocated')}</span>
          <span>DOB: ${this.escape(row.dateOfBirth ? this.formatShortDate(row.dateOfBirth) : '—')}</span>
          <span>OTR ID: ${this.escape(row.otrNo || '—')}</span>
          <span>MODE OF LEARNING: ${this.escape(row.mode || '—')}</span>
        </div>
        <div class="ams-admission-info-grid">${details.map(([label, value], index) => `<div class="${index >= 9 ? 'wide' : ''}"><span>${this.escape(label)}</span><strong>${this.escape(value)}</strong></div>`).join('')}</div>
      </div>
      <footer class="ams-admission-assignment">
        <span><i class="fas fa-user-circle"></i> Assigned to <strong>${this.escape(row.owner || 'Admission Desk')}</strong>${row.assignedDate ? ` on ${this.escape(this.formatDateTime(row.assignedDate))}` : ''}</span>
        <button type="button" data-amsl-row-action="assign" data-key="${this.escape(row.key)}" aria-label="Edit owner assignment"><i class="fas fa-pen"></i></button>
      </footer>
    </section>`;
  },

  renderExtendedActionMenu(row) {
    const eligible = !['confirmed', 'closed'].includes(row.stageKey)
      && !['otr_pending', 'otr_draft'].includes(row.statusKey);
    const canChangeClass = Boolean(row.course) && !['confirmed', 'closed'].includes(row.stageKey);
    const hasAdmissionForm = Boolean(row.otrId || !['otr_pending', 'otr_draft'].includes(row.statusKey));
    const action = (key, icon, label, enabled = true, note = '') => `<button type="button" ${enabled ? `data-amsl-extended-action="${key}"` : 'disabled'} data-key="${this.escape(row.key)}" title="${this.escape(note)}"><i class="fas ${icon}"></i><span>${this.escape(label)}</span></button>`;
    return [
      action('followup', 'fa-bars-staggered', 'Manage Follow-Up'),
      action('edit', 'fa-pen-to-square', 'Edit Admission Record'),
      action('print-inquiry', 'fa-print', 'Print Inquiry Form', Boolean(row.source)),
      action('print-admission', 'fa-print', 'Print Admission Form', hasAdmissionForm),
      action('copy', 'fa-copy', 'Copy Admission Record'),
      action('schedule-interview', 'fa-hourglass-half', eligible ? 'Schedule Interview' : 'Schedule Interview — Complete OTR first', eligible, eligible ? '' : 'Interview scheduling becomes available after the OTR is completed.'),
      action('change-class', 'fa-link', 'Change Class', canChangeClass),
      action('duplicate', 'fa-rocket', 'Duplicate Scan / Archive'),
      '<span class="ams-admission-action-separator"></span>',
      action('delete', 'fa-trash', 'Delete Admission Record')
    ].join('');
  },

  handleExtendedAction(action, key) {
    const row = this.rows.find(item => item.key === key);
    if (!row) return;
    if (action === 'menu') {
      this.state.extendedMenuKey = this.state.extendedMenuKey === key ? '' : key;
      return this.renderTable();
    }
    this.state.extendedMenuKey = '';
    this.renderTable();
    if (action === 'followup') return window.AMSAdmissionOps?.showFollowup?.(key);
    if (action === 'edit') return window.AMSAdmissionOps?.showEditAdmission?.(key);
    if (action === 'print-inquiry') {
      return window.AMSAdmissionOps?.printAdmission?.(key);
    }
    if (action === 'print-admission') return window.AMSAdmissionOps?.printAdmission?.(key);
    if (action === 'copy') {
      navigator.clipboard?.writeText([row.otrNo, row.name, row.phone, row.email, row.course, row.batch].filter(Boolean).join(' | '));
      return window.AMSAdmissionOps?.toast?.('Admission record copied', 'success');
    }
    if (action === 'schedule-interview') return window.AMSInterviews?.openStudentSchedule?.(row);
    if (action === 'change-class') return window.AMSAdmissionOps?.showChangeClass?.(key);
    if (action === 'duplicate') return window.AMSAdmissionOps?.showDuplicateScan?.(key);
    if (action === 'delete') return window.AMSAdmissionOps?.showArchiveConfirm?.([key], 'deleted');
  },

  relativeTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const hours = Math.round((date.getTime() - Date.now()) / 3600000);
    return hours > 0 ? `${hours} hr` : 'Due';
  },

  formatShortDate(value) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  handleRowAction(action, key) {
    const row = this.rows.find(item => item.key === key);
    if (!row) return;
    if (action !== 'more' && this.state.openMenuKey) {
      this.state.openMenuKey = '';
      this.renderTable();
    }
    if (window.AMSAdmissionOps?.handleRowAction?.(action, row)) return;
    if (action === 'view') {
      this.closeModal();
      return window.AMSAdmissionDrawer?.open?.(row.key);
    }
    if (action === 'call') return window.location.href = `tel:${this.phone(row.phone)}`;
    if (action === 'whatsapp') return window.open(`https://wa.me/91${this.phone(row.phone)}`, '_blank', 'noopener');
    if (action === 'email') return window.location.href = `mailto:${row.email || ''}?subject=${encodeURIComponent(`OTR ${row.otrNo}`)}`;
    if (action === 'more') {
      this.state.openMenuKey = this.state.openMenuKey === key ? '' : key;
      return this.renderTable();
    }
    if (action === 'documents') return window.AMSAdmissionDrawer?.open?.(key, 'ams-360-documents');
    if (action === 'copy') {
      navigator.clipboard?.writeText(row.otrNo);
      this.state.openMenuKey = '';
      this.renderTable();
      this.closeModal();
      return;
    }
    if (action === 'expand') return this.toggleExpanded(key);
  },

  handleTool(action) {
    if (window.AMSAdmissionOps?.handleTool?.(action)) return;
    if (action === 'selection') {
      const pageRows = this.visibleRows();
      const allSelected = pageRows.length && pageRows.every(row => this.selected.has(row.key));
      pageRows.forEach(row => allSelected ? this.selected.delete(row.key) : this.selected.add(row.key));
      this.state.selectionMode = this.selected.size > 0;
      this.renderTable();
      this.renderSelectionBar();
      return;
    }
    if (action === 'filter-toggle') {
      this.state.filtersVisible = !this.state.filtersVisible;
      return this.syncControls();
    }
    if (action === 'focus-filters') return document.getElementById('amsl-search')?.focus();
    if (action === 'refresh') {
      const list = document.getElementById('amsl-list');
      if (list) list.innerHTML = '<div class="amsl-loading"><i class="fas fa-circle-notch fa-spin"></i><span>Refreshing admission records...</span></div>';
      this.populateFilters();
      return window.setTimeout(() => this.render(), 180);
    }
    if (action === 'new' && typeof AMSApp !== 'undefined') return AMSApp.showScreen('ams-otr');
    if (action === 'export') return this.exportRows();
    if (action === 'email-selected') return this.emailSelected();
    if (action === 'sort') {
      this.state.sortDirection = this.state.sortDirection === 'desc' ? 'asc' : 'desc';
      return this.render();
    }
    if (action === 'expand-all') {
      this.state.allExpanded = !this.state.allExpanded;
      this.expanded.clear();
      return this.render();
    }
    if (action === 'clear-search') {
      this.state.filters.search = '';
      this.state.page = 1;
      const search = document.getElementById('amsl-search');
      if (search) search.value = '';
      return this.render();
    }
    if (action === 'clear') return this.clearFilters();
    if (action === 'filter-summary') return this.openFilterSummary();
    if (action === 'select-visible') {
      this.visibleRows().forEach(row => this.selected.add(row.key));
      this.state.selectionMode = this.selected.size > 0;
      this.renderTable();
      this.renderSelectionBar();
      return this.syncControls();
    }
    if (action === 'clear-selection') {
      this.selected.clear();
      this.state.selectionMode = false;
      this.renderTable();
      this.renderSelectionBar();
      return this.syncControls();
    }
  },

  renderSelectionBar() {
    const bar = document.getElementById('amsl-selection-bar');
    if (!bar) return;
    bar.hidden = !this.selected.size;
    if (bar.hidden) return;
    bar.innerHTML = `<span><b>${this.selected.size}</b> admission record${this.selected.size === 1 ? '' : 's'} selected</span><div><button type="button" data-amsl-action="select-visible">Select visible</button><button type="button" data-amsl-action="bulk-followup">Follow-up</button><button type="button" data-amsl-action="bulk-stage">Stage</button><button type="button" data-amsl-action="bulk-assign">Assign</button><button type="button" data-amsl-action="bulk-communication">Communicate</button><button type="button" data-amsl-action="bulk-export">Export</button><button type="button" class="danger" data-amsl-action="bulk-archive">Archive</button><button type="button" class="danger" data-amsl-action="bulk-delete">Delete</button><button type="button" data-amsl-action="clear-selection">Clear</button></div>`;
  },

  populateFilters() {
    this.populateSelect('amsl-course-filter', 'Course', this.rows.map(row => row.course));
    this.populateSelect('amsl-owner-filter', 'Assigned To', this.rows.map(row => row.owner), 'owner');
  },

  populateSelect(id, label, values, filterKey) {
    const select = document.getElementById(id);
    if (!select) return;
    const unique = [...new Set(values.filter(Boolean))].sort();
    const key = filterKey || id.replace('amsl-', '').replace('-filter', '');
    select.innerHTML = `<option value="all">${label}</option>${unique.map(value => `<option value="${this.escape(value)}">${this.escape(value)}</option>`).join('')}`;
    select.value = this.state.filters[key] || 'all';
  },

  clearFilters() {
    Object.assign(this.state.filters, {
      search: '', course: 'all', mode: 'all', gender: 'all', enquiry: '',
      otr: '', owner: 'all', dateFrom: '', dateTo: ''
    });
    this.state.page = 1;
    ['amsl-search', 'amsl-enquiry-filter', 'amsl-otr-filter', 'amsl-date-from-filter', 'amsl-date-to-filter'].forEach(id => { const input = document.getElementById(id); if (input) input.value = ''; });
    ['amsl-course-filter', 'amsl-mode-filter', 'amsl-gender-filter', 'amsl-owner-filter'].forEach(id => { const input = document.getElementById(id); if (input) input.value = 'all'; });
    this.populateFilters();
    this.render();
  },

  visibleRows() {
    const rows = this.filteredRows();
    const start = (this.state.page - 1) * this.state.pageSize;
    return rows.slice(start, start + this.state.pageSize);
  },

  toggleSelection(key) {
    this.selected.has(key) ? this.selected.delete(key) : this.selected.add(key);
    this.state.selectionMode = this.selected.size > 0;
    this.renderTable();
    this.renderSelectionBar();
    this.syncControls();
  },

  toggleExpanded(key) {
    if (this.state.allExpanded) {
      this.expanded.clear();
      this.visibleRows().forEach(row => {
        if (row.key !== key) this.expanded.add(row.key);
      });
      this.state.allExpanded = false;
      this.renderTable();
      return this.syncControls();
    }
    this.state.allExpanded = false;
    const wasExpanded = this.expanded.has(key);
    const previouslyExpanded = [...this.expanded];
    this.expanded.clear();
    previouslyExpanded.forEach(previousKey => this.setRowExpanded(previousKey, false));
    if (!wasExpanded) {
      this.expanded.add(key);
      this.setRowExpanded(key, true);
    }
    this.syncControls();
  },

  setRowExpanded(key, open) {
    const card = [...document.querySelectorAll('[data-amsl-card]')]
      .find(element => element.dataset.amslCard === key);
    if (!card) return;
    const drawer = card.querySelector('.amsl-inline-drawer-shell');
    const toggle = card.querySelector('[data-amsl-row-action="expand"]');
    const icon = toggle?.querySelector('i');
    card.classList.toggle('is-expanded', open);
    if (toggle) {
      toggle.title = `${open ? 'Collapse' : 'Expand'} quick-access drawer`;
      toggle.dataset.tooltip = `${open ? 'Collapse' : 'Expand'} quick-access drawer`;
    }
    if (icon) icon.className = `fas fa-chevron-${open ? 'up' : 'down'}`;
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', String(!open));
    if (open) {
      drawer.style.display = 'block';
      drawer.getBoundingClientRect();
      requestAnimationFrame(() => drawer.classList.add('is-open'));
      return;
    }
    drawer.classList.remove('is-open');
    window.setTimeout(() => {
      if (!this.expanded.has(key) && !this.state.allExpanded) drawer.style.display = 'none';
    }, 270);
  },

  setPage(page) {
    const totalPages = Math.max(1, Math.ceil(this.filteredRows().length / this.state.pageSize));
    this.state.page = Math.max(1, Math.min(page, totalPages));
    this.renderTable();
    document.getElementById('amsl-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  renderPagination(total, start, visibleCount, totalPages) {
    const info = document.getElementById('amsl-pagination-info');
    const buttons = document.getElementById('amsl-pagination-buttons');
    if (info) info.textContent = total ? `Showing ${start + 1} to ${start + visibleCount} of ${total} admissions` : 'Showing 0 admissions';
    if (!buttons) return;
    const page = this.state.page;
    const pages = [];
    for (let value = 1; value <= totalPages; value += 1) {
      if (value === 1 || value === totalPages || Math.abs(value - page) <= 1) pages.push(value);
    }
    let previous = 0;
    const pageButtons = pages.map(value => {
      const gap = previous && value - previous > 1 ? '<span>...</span>' : '';
      previous = value;
      return `${gap}<button type="button" class="${value === page ? 'active' : ''}" data-amsl-page="${value}" ${value === page ? 'aria-current="page"' : ''}>${value}</button>`;
    }).join('');
    buttons.innerHTML = `<button type="button" data-amsl-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous page"><i class="fas fa-chevron-left"></i></button>${pageButtons}<button type="button" data-amsl-page="${page + 1}" ${page === totalPages ? 'disabled' : ''} aria-label="Next page"><i class="fas fa-chevron-right"></i></button>`;
  },

  syncControls() {
    const panel = document.getElementById('amsl-filter-panel');
    if (panel) panel.hidden = !this.state.filtersVisible;
    const pageSize = document.getElementById('amsl-page-size');
    if (pageSize) pageSize.value = String(this.state.pageSize);
    const selection = document.querySelector('[data-amsl-action="selection"]');
    if (selection) selection.classList.toggle('active', this.selected.size > 0);
    const filterButtons = document.querySelectorAll('[data-amsl-action="filter-toggle"]');
    filterButtons.forEach(button => button.classList.toggle('active', this.state.filtersVisible));
    const sortButton = document.querySelector('[data-amsl-action="sort"]');
    if (sortButton) sortButton.title = `Sort by ${this.titleCase(this.state.sortField)} (${this.state.sortDirection === 'desc' ? 'descending' : 'ascending'})`;
    const sort = sortButton?.querySelector('i');
    if (sort) sort.className = `fas fa-sort-amount-${this.state.sortDirection === 'desc' ? 'down' : 'up'}`;
    const expand = document.querySelector('[data-amsl-action="expand-all"] i');
    if (expand) expand.className = `fas fa-${this.state.allExpanded ? 'compress-alt' : 'expand-alt'}`;
  },

  openStudent(row) {
    window.AMSAdmissionDrawer?.open?.(row.key);
  },

  openDocuments(key) {
    const row = this.rows.find(item => item.key === key);
    if (!row || !row.hasDocuments) return;
    window.AMSAdmissionDrawer?.open?.(key, 'ams-360-documents');
  },

  openMoreActions(row) {
    window.AMSAdmissionDrawer?.open?.(row.key);
  },

  openFilterSummary() {
    const active = Object.entries(this.state.filters).filter(([, value]) => value && value !== 'all');
    this.openModal('Active Admission Filters', active.length ? `<div class="amsl-filter-summary">${active.map(([key, value]) => `<span><b>${this.titleCase(key)}</b>${this.escape(value)}</span>`).join('')}</div>` : '<div class="amsl-modal-empty">No additional admission filters are active.</div>');
  },

  openModal(title, content) {
    document.getElementById('amsl-modal-title').textContent = title;
    document.getElementById('amsl-modal-body').innerHTML = content;
    document.getElementById('amsl-modal')?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('amsl-modal-open');
  },

  closeModal() {
    document.getElementById('amsl-modal')?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('amsl-modal-open');
  },

  exportRows() {
    const headers = ['OTR ID', 'Enquiry ID', 'Student', 'Mobile', 'Course', 'Learning Mode', 'Hostel Status', 'Gender', 'Stage', 'Status', 'Owner', 'Date'];
    const data = this.filteredRows().map(row => [row.otrNo, row.enquiryId, row.name, row.phone, row.course, row.mode, row.hostelStatus, row.gender, row.stage, row.stageStatus, row.owner, row.admissionDate]);
    const csv = [headers, ...data].map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ams-admission-students-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },

  emailSelected() {
    const rows = this.rows.filter(row => this.selected.has(row.key) && row.email);
    if (!rows.length) return this.openModal('Email Students', '<div class="amsl-modal-empty">Select at least one admission record with an email address.</div>');
    window.location.href = `mailto:?bcc=${encodeURIComponent(rows.map(row => row.email).join(','))}&subject=${encodeURIComponent('Admission update from Pramukh Academy')}`;
  },

  detail(label, value) { return `<div><span>${label}</span><strong>${this.escape(value || '—')}</strong></div>`; },
  expandedDetail(label, value, link = false) {
    return `<div class="detail-row"><span class="detail-label">${this.escape(label)}</span><span class="detail-value ${link ? 'detail-link' : ''}">${this.escape(value || '—')}</span></div>`;
  },
  initials(name = '') { return name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase(); },
  phone(value = '') { return String(value).replace(/\D/g, '').slice(-10); },
  normalizeOtrId(value, dateValue, fallbackSequence = 1) {
    const raw = String(value || '').trim().toUpperCase();
    if (/^PA\d{6}$/.test(raw)) return raw;
    const parts = raw.match(/(?:AMS-OTR-|ADM-|OTR-)?(20\d{2})-(\d{1,4})$/);
    const year = parts?.[1] || String(dateValue || '').match(/20\d{2}/)?.[0] || String(new Date().getFullYear());
    const sequence = Number(parts?.[2] || fallbackSequence) || fallbackSequence;
    return `PA${year.slice(-2)}${String(sequence).padStart(4, '0')}`;
  },
  slug(value = '') { return value.toLowerCase().replace(/\s+/g, '-'); },
  titleCase(value = '') { return value.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase()).trim(); },
  formatDate(value) { return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); },
  formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '—';
    return date.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  timeAgo(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';
    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    return this.formatDate(value);
  },
  escape(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
};

window.AMSStudentList = AMSStudentList;
