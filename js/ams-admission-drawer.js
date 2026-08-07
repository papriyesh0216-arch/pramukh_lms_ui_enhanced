// ============================================================
// AMS ADMISSION 360° DETAILS
// Controller for the reused LMS drawer component structure/CSS.
// ============================================================

const AMSAdmissionDrawer = {
  currentKey: '',
  storageKey: 'pa-ams-admission-drawer-width',
  resizeState: null,

  init() {
    const drawer = document.getElementById('ams-admission-drawer');
    if (!drawer || drawer.dataset.bound) return;
    drawer.dataset.bound = 'true';
    document.getElementById('ams-drawer-close')?.addEventListener('click', () => this.close());
    document.getElementById('ams-admission-drawer-overlay')?.addEventListener('click', () => this.close());
    document.getElementById('ams-drawer-add-followup')?.addEventListener('click', () => this.followup());
    document.getElementById('ams-drawer-edit')?.addEventListener('click', () => this.showEdit());
    document.getElementById('ams-drawer-close-admission')?.addEventListener('click', () => this.closeAdmission());
    drawer.querySelectorAll('[data-ams-drawer-activity]').forEach(button =>
      button.addEventListener('click', () => this.addActivity(button.dataset.amsDrawerActivity))
    );
    drawer.querySelectorAll('[data-ams-drawer-quick]').forEach(button =>
      button.addEventListener('click', () => this.quickAction(button.dataset.amsDrawerQuick))
    );
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.currentKey && !document.getElementById('ams-ops-dialog')) this.close();
    });
    window.addEventListener('ams:data-change', () => {
      if (this.currentKey) this.render(this.row());
    });
    this.setupResize();
  },

  row() {
    return window.AMSAdmissionOps?.row?.(this.currentKey) || null;
  },

  open(key, focusSection = '') {
    const row = window.AMSAdmissionOps?.row?.(key);
    if (!row) return;
    this.currentKey = key;
    this.render(row);
    this.applyWidth();
    document.getElementById('ams-admission-drawer-overlay')?.classList.add('open');
    const drawer = document.getElementById('ams-admission-drawer');
    drawer?.classList.add('open');
    drawer?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ams-admission-drawer-open');
    if (focusSection) {
      requestAnimationFrame(() => document.getElementById(focusSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  },

  close() {
    document.getElementById('ams-admission-drawer-overlay')?.classList.remove('open');
    const drawer = document.getElementById('ams-admission-drawer');
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ams-admission-drawer-open');
    this.currentKey = '';
  },

  render(row) {
    if (!row) return;
    this.text('ams-drawer-reference', row.otrNo || row.admissionNo);
    this.text('ams-drawer-reference-secondary', row.otrNo || row.admissionNo);
    this.text('ams-drawer-avatar', row.name?.charAt(0).toUpperCase() || 'A');
    this.text('ams-drawer-name', row.name);
    const status = document.getElementById('ams-drawer-status');
    if (status) {
      status.textContent = row.stageStatus;
      status.className = `drawer-status-pill badge status-${this.slug(row.stageKey)}`;
    }
    this.html('ams-drawer-tags', `<span class="badge badge-success">${this.escape(row.stage)}</span><span class="badge badge-primary">${this.escape(row.stageStatus)}</span>`);
    this.html('ams-drawer-contacts', `
      ${row.phone ? `<span class="profile-contact-item"><i class="fas fa-phone"></i>${this.escape(row.phone)}</span>` : ''}
      ${row.email ? `<span class="profile-contact-item"><i class="fas fa-envelope" style="color:var(--primary)"></i>${this.escape(row.email)}</span>` : ''}
    `);
    const meta = [
      ['Selected Course', row.course],
      ['Admission Source', row.source],
      ['Campaign', row.campaign],
      ['Admission Date', window.AMSStudentList.formatDateTime(row.admissionDateTime || row.admissionDate)],
      ['Current Owner', row.owner]
    ];
    this.html('ams-drawer-meta', meta.map(([label, value], index) => `
      <div class="profile-meta-item">
        <div class="profile-meta-label">${this.escape(label)}</div>
        <div class="profile-meta-value ${index === 4 ? 'profile-meta-owner' : ''}">
          ${index === 4 ? `<span class="owner-mini-avatar">${this.escape((value || 'A').charAt(0))}</span>` : ''}
          ${this.escape(value || '—')}
        </div>
      </div>
    `).join(''));

    const infoRows = [
      ['fa-route', 'Admission Stage', row.stage],
      ['fa-circle-check', 'Stage Status', row.stageStatus],
      ['fa-phone', 'Phone', row.phone],
      ['fa-envelope', 'Email', row.email],
      ['fa-book', 'Selected Course', row.course],
      ['fa-layer-group', 'Batch Selection', row.batch],
      ['fa-laptop', 'Mode Of Learning', row.mode],
      ['fa-graduation-cap', 'Academic Status', row.academicStatus],
      ['fa-calendar-check', 'Follow-up Date', row.followupDate ? window.AMSStudentList.formatShortDate(row.followupDate) : '—'],
      ['fa-clipboard-list', 'Follow-up Purpose', row.followupPurpose || '—'],
      ['fa-map', 'State', row.state],
      ['fa-map-marker-alt', 'District', row.district],
      ['fa-question-circle', 'Relevant Query / Remark', row.query]
    ];
    this.html('ams-drawer-info-list', infoRows.map(([icon, label, value]) => `
      <div class="info-row">
        <div class="info-icon"><i class="fas ${icon}"></i></div>
        <div class="info-label">${this.escape(label)}</div>
        <div class="info-value">${this.escape(value || '—')}</div>
      </div>
    `).join(''));
    this.renderCompleteRecord(row);
    this.renderOrigin(row);
    this.renderCommunications(row);
  },

  renderCompleteRecord(row) {
    const record = row.otrRecord || (row.otrId
      ? window.AMSOTR?.getRecords?.().find(item => item.id === row.otrId)
      : null);
    const empty = '—';
    const section = (title, icon, fields, options = {}) => {
      const rows = (fields || []).filter(([, value]) => options.keepEmpty || this.hasValue(value));
      return `
        <section class="ams-360-section${options.className ? ` ${options.className}` : ''}"${options.id ? ` id="${options.id}"` : ''}>
          <header><h3><i class="fas ${icon}"></i>${this.escape(title)}</h3>${options.meta ? `<span>${this.escape(options.meta)}</span>` : ''}</header>
          ${rows.length
            ? `<div class="ams-360-field-grid">${rows.map(([label, value]) => `<div><span>${this.escape(label)}</span><strong>${this.escape(this.displayValue(value))}</strong></div>`).join('')}</div>`
            : '<div class="ams-360-empty">No connected data available.</div>'}
        </section>
      `;
    };

    const workflowFields = [
      ['OTR ID', row.otrNo || row.admissionNo],
      ['OTR Reference', record?.otrNo],
      ['Last Modified', window.AMSStudentList?.formatDateTime?.(row.updatedAt || record?.updatedAt || row.admissionDateTime)],
      ['Admission Date', window.AMSStudentList?.formatDateTime?.(row.admissionDateTime || row.admissionDate)],
      ['Next Action Date', row.nextActionDate],
      ['Admission Stage', row.stage],
      ['Stage Status', row.stageStatus],
      ['Submission Status', row.submissionStatus],
      ['Purpose', row.purpose],
      ['Remark', row.remark || row.query],
      ['Owner', row.owner],
      ['Assigned Date', window.AMSStudentList?.formatDateTime?.(row.assignedDate)]
    ];
    const allocationFields = [
      ['Selected Course', row.course],
      ['Batch', row.batch],
      ['Mode of Learning', row.mode],
      ['Academic Status', row.academicStatus],
      ['Fee Status', row.feeStatus],
      ['Total Fee', this.money(row.total)],
      ['Paid Amount', this.money(row.paid)],
      ['Scholarship', row.scholarship || row.documentNote]
    ];
    const personalFields = record
      ? Object.entries(record.personal || {}).map(([key, value]) => [this.titleCase(key), value])
      : [
          ['Full Name', row.name], ['Mobile', row.phone], ['Email', row.email],
          ['Date of Birth', row.dateOfBirth], ['Gender', row.gender]
        ];
    const addressFields = record
      ? Object.entries(record.address || {}).map(([key, value]) => [this.titleCase(key), value])
      : [['State', row.state], ['District', row.district]];
    const educationFields = Object.entries(record?.education || {}).flatMap(([level, fields]) =>
      Object.entries(fields || {})
        .filter(([, value]) => this.hasValue(value))
        .map(([key, value]) => [`${this.titleCase(level)} · ${this.titleCase(key)}`, value])
    );
    const achievementFields = (record?.achievements || []).flatMap((achievement, index) => [
      [`Achievement ${index + 1} · Title`, achievement.title],
      [`Achievement ${index + 1} · Year`, achievement.year],
      [`Achievement ${index + 1} · Details`, achievement.details]
    ]);
    const satsangFields = Object.entries(record?.satsang || {}).map(([key, value]) => [this.titleCase(key), value]);
    const exams = Array.isArray(record?.governmentExam)
      ? record.governmentExam
      : (record?.governmentExam ? [record.governmentExam] : []);
    const examFields = exams.flatMap((exam, index) => Object.entries(exam || {})
      .map(([key, value]) => [`Exam ${index + 1} · ${this.titleCase(key)}`, value]));
    const documents = Object.entries(record?.documents || {}).filter(([, file]) => file?.name);
    const interviewRows = window.AMSInterviews?.interviewsForStudent?.(row) || [];
    const classHistory = window.AMSAdmissionOps?.store?.classHistory?.[row.key] || [];
    const classHistoryFields = classHistory.flatMap((item, index) => [
      [`Class Change ${index + 1} · From`, item.from],
      [`Class Change ${index + 1} · To`, item.to],
      [`Class Change ${index + 1} · Changed On`, window.AMSStudentList?.formatDateTime?.(item.at)],
      [`Class Change ${index + 1} · Changed By`, item.by]
    ]);
    const interviewFields = interviewRows.flatMap((interview, index) => {
      const structure = window.AMSInterviews?.structureById?.(interview.structureId);
      const interviewer = window.AMSInterviews?.interviewerById?.(interview.interviewerId);
      const evaluationFields = (structure?.groups || []).flatMap(group => (group.attributes || [])
        .filter(attribute => this.hasValue(interview.evaluation?.[attribute.id]))
        .map(attribute => [`Interview ${index + 1} · ${attribute.name}`, interview.evaluation[attribute.id]]));
      return [
        [`Interview ${index + 1} · Reference`, interview.interviewNumber || interview.id],
        [`Interview ${index + 1} · Structure`, structure?.name || interview.structure || interview.structureName],
        [`Interview ${index + 1} · Date and Time`, window.AMSStudentList?.formatDateTime?.(interview.datetime)],
        [`Interview ${index + 1} · Interviewer`, interviewer?.name || interview.interviewer || 'Awaiting Assignment'],
        [`Interview ${index + 1} · Mode`, interview.mode],
        [`Interview ${index + 1} · Status`, interview.status],
        [`Interview ${index + 1} · Score`, interview.score],
        ...evaluationFields,
        [`Interview ${index + 1} · Remarks`, interview.remarks]
      ];
    });
    const documentMarkup = `
      <section class="ams-360-section" id="ams-360-documents">
        <header><h3><i class="fas fa-file-arrow-up"></i>Documents</h3><span>${this.escape(row.documents || `${row.verifiedDocuments || 0}/${row.totalDocuments || 0} verified`)}</span></header>
        ${documents.length
          ? `<div class="ams-360-document-list">${documents.map(([key, file]) => `
              <article>
                <i class="fas fa-file-lines"></i>
                <div><strong>${this.escape(file.name)}</strong><span>${this.escape(this.titleCase(key))} · ${this.escape(file.type || 'File')} · ${this.escape(this.formatBytes(file.size))}</span></div>
                ${file.dataUrl ? `<a href="${file.dataUrl}" target="_blank" rel="noopener" aria-label="Open ${this.escape(file.name)}"><i class="fas fa-arrow-up-right-from-square"></i></a>` : ''}
              </article>`).join('')}</div>`
          : `<div class="ams-360-empty">${this.escape(row.documents || empty)}</div>`}
      </section>
    `;

    this.html('ams-drawer-complete-record', [
      section('Admission Process', 'fa-diagram-project', workflowFields, { keepEmpty: true }),
      section('Course, Batch and Fees', 'fa-graduation-cap', allocationFields, { id: 'ams-360-course' }),
      section('Personal Details', 'fa-user', personalFields, { keepEmpty: true }),
      section('Correspondence Address', 'fa-location-dot', addressFields),
      section('Education', 'fa-school', educationFields),
      section('Achievements', 'fa-trophy', achievementFields),
      section('Satsang', 'fa-hands-praying', satsangFields),
      section('Government Exam', 'fa-landmark', examFields),
      section('Class Change History', 'fa-people-arrows', classHistoryFields, { meta: `${classHistory.length} change${classHistory.length === 1 ? '' : 's'}` }),
      section('Interview History', 'fa-user-tie', interviewFields, { meta: `${interviewRows.length} interview${interviewRows.length === 1 ? '' : 's'}` }),
      documentMarkup
    ].join(''));
  },

  renderExtended(row) {
    if (!row) return;
    this.text('ams-drawer-extended-name', row.name);
    this.html('ams-drawer-extended-contacts', [
      row.phone ? `<span><i class="fas fa-phone"></i>${this.escape(row.phone)}</span>` : '',
      row.email ? `<span><i class="fas fa-envelope"></i>${this.escape(row.email)}</span>` : ''
    ].join(''));
    this.text('ams-drawer-extended-stage', row.stage);
    this.text('ams-drawer-extended-stage-status', row.stageStatus);
    const select = document.getElementById('ams-drawer-select');
    const isSelected = window.AMSStudentList?.selected?.has(row.key);
    if (select) {
      select.classList.toggle('selected', Boolean(isSelected));
      select.innerHTML = isSelected ? '<i class="fas fa-check"></i>' : this.escape(String(window.AMSStudentList?.rows?.findIndex(item => item.key === row.key) + 1 || 1));
    }
    this.html('ams-drawer-communication-actions', `
      <button type="button" data-ams-extended-contact="assign" title="Assign owner"><i class="fas fa-users"></i></button>
      <button type="button" data-ams-extended-contact="whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>
      <button type="button" data-ams-extended-contact="email" title="Email"><i class="fas fa-envelope"></i></button>
      <button type="button" data-ams-extended-contact="documents" title="Documents" ${row.hasDocuments ? '' : 'disabled'}><i class="fas fa-file-pdf"></i></button>
      <button type="button" data-ams-extended-contact="journey" title="Admission journey"><i class="fas fa-list"></i></button>
    `);
    document.getElementById('ams-drawer-communication-actions')?.querySelectorAll('[data-ams-extended-contact]').forEach(button =>
      button.addEventListener('click', () => {
        const action = button.dataset.amsExtendedContact;
        if (action === 'assign') return window.AMSAdmissionOps?.showAssignment?.([row.key]);
        if (action === 'documents') return row.hasDocuments && this.open(row.key, 'ams-360-documents');
        if (action === 'journey') return window.AMSAdmissionOps?.showJourney?.(row.key);
        this.addActivity(action);
      })
    );
    const followup = document.getElementById('ams-drawer-followup-time');
    if (followup) {
      followup.hidden = !row.followupDate;
      followup.innerHTML = row.followupDate ? `<i class="fas fa-calendar-days"></i>${this.escape(this.relativeTime(row.followupDate))}` : '';
    }
    const photo = document.getElementById('ams-drawer-photo');
    if (photo) photo.innerHTML = row.photo
      ? `<img src="${this.escape(row.photo)}" alt="${this.escape(row.name)}">`
      : `<span>${this.escape(this.initials(row.name))}</span>`;
    this.text('ams-drawer-summary-course', row.course || 'Course not assigned');
    this.text('ams-drawer-summary-batch', row.batch || 'Class not allocated');
    this.text('ams-drawer-summary-dob', row.dateOfBirth ? `DOB: ${this.formatDate(row.dateOfBirth)}` : 'DOB: —');
    this.text('ams-drawer-summary-reference', `OTR ID: ${row.otrNo || row.admissionNo || '—'}`);
    this.text('ams-drawer-summary-mode', `MODE OF LEARNING: ${row.mode || '—'}`);
    const extended = [
      ['Last Modified', window.AMSStudentList.formatDateTime(row.updatedAt || row.admissionDateTime)],
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
    this.html('ams-drawer-extended-info', extended.map(([label, value], index) => `
      <div class="${index >= 9 ? 'wide' : ''}"><span>${this.escape(label)}</span><strong>${this.escape(value)}</strong></div>
    `).join(''));
    this.html('ams-drawer-assignment', `<i class="fas fa-user-circle"></i> Assigned to <strong>${this.escape(row.owner || 'Admission Desk')}</strong>${row.assignedDate ? ` on ${this.escape(window.AMSStudentList.formatDateTime(row.assignedDate))}` : ''}`);
    this.renderActionMenu(row);
  },

  renderActionMenu(row) {
    const eligibleForInterview = !['confirmed', 'closed'].includes(row.stageKey)
      && !['otr_pending', 'otr_draft'].includes(row.statusKey);
    const canChangeClass = Boolean(row.course) && !['confirmed', 'closed'].includes(row.stageKey);
    const hasAdmissionForm = Boolean(row.otrId || !['otr_pending', 'otr_draft'].includes(row.statusKey));
    const actions = [
      ['followup', 'fa-bars-staggered', 'Manage Follow-Up', true],
      ['edit', 'fa-pen-to-square', 'Edit Admission Record', true],
      ['print-inquiry', 'fa-print', 'Print Inquiry Form', Boolean(row.source)],
      ['print-admission', 'fa-print', 'Print Admission Form', hasAdmissionForm],
      ['accounts', 'fa-receipt', 'Open Fees & Receipts', true],
      ['copy', 'fa-copy', 'Copy Admission Record', true],
      ['schedule-interview', 'fa-hourglass-half', 'Schedule Interview', eligibleForInterview],
      ['change-class', 'fa-link', 'Change Class', canChangeClass],
      ['duplicate', 'fa-rocket', 'Duplicate Scan / Archive', true],
      ['separator', '', '', true],
      ['delete', 'fa-trash', 'Delete Admission Record', true]
    ];
    this.html('ams-drawer-actions-menu', actions.filter(([, , , visible]) => visible).map(([action, icon, label]) =>
      action === 'separator'
        ? '<span class="ams-admission-action-separator"></span>'
        : `<button type="button" class="${action === 'delete' ? 'danger' : ''}" data-ams-admission-action="${action}"><i class="fas ${icon}"></i><span>${label}</span></button>`
    ).join(''));
  },

  toggleActionMenu() {
    const menu = document.getElementById('ams-drawer-actions-menu');
    const trigger = document.getElementById('ams-drawer-actions-trigger');
    if (!menu || !trigger) return;
    menu.hidden = !menu.hidden;
    trigger.setAttribute('aria-expanded', String(!menu.hidden));
  },

  closeActionMenu() {
    const menu = document.getElementById('ams-drawer-actions-menu');
    const trigger = document.getElementById('ams-drawer-actions-trigger');
    if (menu) menu.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
  },

  toggleSummary() {
    const summary = document.getElementById('ams-drawer-summary');
    const button = document.getElementById('ams-drawer-summary-toggle');
    if (!summary || !button) return;
    const collapsed = !summary.hidden;
    summary.hidden = collapsed;
    button.setAttribute('aria-expanded', String(!collapsed));
    button.title = collapsed ? 'Expand admission summary' : 'Collapse admission summary';
    button.innerHTML = `<i class="fas fa-chevron-${collapsed ? 'down' : 'up'}"></i>`;
  },

  handleAdmissionAction(action) {
    const row = this.row();
    if (!row) return;
    this.closeActionMenu();
    if (action === 'followup') return this.followup();
    if (action === 'edit') return this.showEdit();
    if (action === 'print-inquiry') {
      return window.AMSAdmissionOps?.printAdmission?.(row.key);
    }
    if (action === 'print-admission') return window.AMSAdmissionOps?.printAdmission?.(row.key);
    if (action === 'accounts') return this.openAccounts(row);
    if (action === 'copy') {
      const value = [row.otrNo || row.admissionNo, row.name, row.phone, row.email, row.course, row.batch].filter(Boolean).join(' | ');
      navigator.clipboard?.writeText(value);
      return window.AMSAdmissionOps?.toast?.('Admission record copied', 'success');
    }
    if (action === 'schedule-interview') return window.AMSInterviews?.openStudentSchedule?.(row);
    if (action === 'change-class') return window.AMSAdmissionOps?.showChangeClass?.(row.key);
    if (action === 'duplicate') return window.AMSAdmissionOps?.showDuplicateScan?.(row.key);
    if (action === 'delete') return window.AMSAdmissionOps?.showArchiveConfirm?.([row.key], 'deleted');
  },

  initials(name) {
    return String(name || 'A').split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  },

  formatDate(value) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  relativeTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const hours = Math.round((date.getTime() - Date.now()) / 3600000);
    return hours > 0 ? `${hours} hr` : 'Due';
  },

  renderOrigin(row) {
    const fields = [
      ['Source', row.source],
      ['Medium', row.medium],
      ['Campaign', row.campaign],
      ['Content', row.content],
      ['Term', row.term],
      ['Landing', row.landingPage],
      ['Referrer', row.referrer]
    ];
    this.html('ams-drawer-origin', `
      <div class="drawer-origin-head">
        <div><div class="drawer-card-title"><i class="fas fa-route"></i> Admission Origin</div><div class="drawer-origin-subtitle">Tracking trail captured with the admission record.</div></div>
        <span class="drawer-origin-badge">UTM</span>
      </div>
      <div class="origin-path">
        ${fields.map(([label, value], index) => `
          <div class="origin-step ${index === 0 && value ? 'origin-step--accent' : ''}">
            <span class="origin-step-label">${this.escape(label)}</span>
            <strong class="origin-step-value">${this.escape(value || '—')}</strong>
          </div>
        `).join('')}
      </div>
    `);
  },

  renderCommunications(row) {
    const stored = window.AMSAdmissionOps?.store?.activities?.[row.key] || [];
    const created = row.admissionDateTime || row.admissionDate;
    const phone = window.AMSStudentList.phone(row.phone);
    const interviews = (window.AMSInterviews?.interviews || [])
      .filter(item =>
        (row.email && item.email && item.email.toLowerCase() === row.email.toLowerCase())
        || (phone && window.AMSStudentList.phone(item.phone) === phone)
        || (row.name && item.name && item.name.toLowerCase() === row.name.toLowerCase())
      )
      .map(item => ({
        type: 'interview',
        title: item.status === 'Completed' ? 'Interview Completed' : 'Interview Scheduled',
        description: [item.course, item.mode, item.status].filter(Boolean).join(' · '),
        by: window.AMSInterviews?.interviewerById?.(item.interviewerId)?.name || row.owner,
        at: item.datetime
      }));
    const systemActivities = [
      ...(row.hasDocuments ? [{
        type: 'document',
        title: 'Admission Documents Updated',
        description: row.documents || `${row.verifiedDocuments}/${row.totalDocuments} verified`,
        by: row.owner,
        at: row.updatedAt || created
      }] : []),
      ...interviews,
      ...(['confirmed', 'closed'].includes(row.stageKey) ? [{
        type: 'note',
        title: row.stageKey === 'confirmed' ? 'Admission Confirmed' : 'Admission Closed',
        description: `${row.stage} · ${row.stageStatus}`,
        by: row.owner,
        at: row.updatedAt || created
      }] : [])
    ];
    const activities = [
      ...stored,
      ...systemActivities,
      ...(created ? [{
        type: row.otrId ? 'otr' : 'note',
        title: row.otrId ? 'OTR Form Submitted' : 'Admission Record Created',
        description: row.otrId ? 'The student submitted the AMS OTR form.' : `Admission record received from ${row.source || 'AMS'}.`,
        by: row.owner || 'Admission Desk',
        at: created
      }] : [])
    ];
    this.html('ams-drawer-communications', activities.length ? activities.map(activity => {
      const date = new Date(activity.at);
      const valid = !Number.isNaN(date.getTime());
      const style = this.activityStyle(activity.type);
      return `
        <div class="comm-item">
          <div class="comm-date-badge"><span class="comm-day">${valid ? String(date.getDate()).padStart(2, '0') : '—'}</span><span class="comm-month">${valid ? date.toLocaleString('en-IN', { month: 'short' }).toUpperCase() : ''}</span></div>
          <div class="comm-icon ${style.className}" style="background:${style.background}"><i class="${style.prefix} ${style.icon}" style="color:${style.color}"></i></div>
          <div class="comm-body">
            <div class="comm-title">${this.escape(activity.title || 'Admission Activity')}</div>
            <div class="comm-desc">${this.escape(activity.description || '')}</div>
            ${activity.payload?.message ? `<div class="comm-desc">${this.escape(activity.payload.message)}</div>` : ''}
            <div class="comm-meta"><span>By ${this.escape(activity.by || 'Admission Desk')}</span></div>
          </div>
          <div class="comm-time">${valid ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
        </div>
      `;
    }).join('') : '<div class="ams-drawer-empty"><i class="fas fa-inbox"></i><span>No admission activity yet</span></div>');
  },

  activityStyle(type) {
    const map = {
      call: ['fas', 'fa-phone', 'tl-call', 'var(--info-light)', 'var(--info-strong)'],
      whatsapp: ['fab', 'fa-whatsapp', 'tl-whatsapp', 'var(--wa-light)', 'var(--wa)'],
      email: ['fas', 'fa-envelope', 'tl-email', 'var(--primary-light)', 'var(--primary)'],
      sms: ['fas', 'fa-comment', 'tl-email', 'var(--primary-light)', 'var(--primary)'],
      followup: ['fas', 'fa-calendar-check', 'tl-meeting', 'var(--warning-light)', 'var(--warning)'],
      interview: ['fas', 'fa-user-tie', 'tl-meeting', 'var(--warning-light)', 'var(--warning)'],
      document: ['fas', 'fa-file-circle-check', 'tl-email', 'var(--success-light)', 'var(--success)'],
      otr: ['fas', 'fa-file-signature', 'tl-email', 'var(--success-light)', 'var(--success)']
    };
    const value = map[type] || ['fas', 'fa-clipboard-list', 'tl-call', 'var(--neutral-light)', 'var(--text-secondary)'];
    return { prefix: value[0], icon: value[1], className: value[2], background: value[3], color: value[4] };
  },

  followup() {
    if (this.currentKey) window.AMSAdmissionOps?.showFollowup?.(this.currentKey);
  },

  addActivity(type) {
    const row = this.row();
    if (!row) return;
    if (type === 'followup') return this.followup();
    const labels = { call: 'Call Initiated', whatsapp: 'WhatsApp Opened', email: 'Email Opened' };
    window.AMSAdmissionOps.recordActivity(row.key, {
      type,
      title: labels[type],
      description: `${labels[type]} from Admission Details.`,
      by: row.owner
    });
    if (type === 'call') window.location.href = `tel:${window.AMSStudentList.phone(row.phone)}`;
    if (type === 'whatsapp') window.open(`https://wa.me/91${window.AMSStudentList.phone(row.phone)}`, '_blank', 'noopener');
    if (type === 'email') window.location.href = `mailto:${row.email || ''}?subject=${encodeURIComponent(`OTR ${row.otrNo || row.admissionNo}`)}`;
  },

  quickAction(type) {
    const row = this.row();
    if (!row) return;
    if (type === 'accounts') return this.openAccounts(row);
    if (type === 'course') {
      return document.getElementById('ams-360-course')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (type === 'edit-buttons') return this.showQuickButtonForm();
    window.AMSAdmissionOps.recordActivity(row.key, {
      type: 'email',
      title: 'Brochure Sent',
      description: `Course brochure shared for ${row.course || 'the selected programme'}.`,
      by: row.owner
    });
    window.AMSAdmissionOps.toast('Brochure activity recorded', 'success');
  },

  openAccounts(row) {
    if (!row?.key) return;
    localStorage.setItem('paAccountsSelectedStudent', row.key);
    window.location.href = `accounts.html?student=${encodeURIComponent(row.key)}`;
  },

  showQuickButtonForm() {
    const row = this.row();
    if (!row) return;
    window.AMSAdmissionOps.modal('Create Quick Action Button', `
      <form id="ams-quick-button-form" class="amsl-form-grid">
        <label><span>Button Name *</span><input name="name" required placeholder="Example: Share fee plan"></label>
        <label><span>Action Type *</span><select name="action"><option>Message</option><option>Open Link</option><option>Call</option><option>Email</option></select></label>
        <label class="full"><span>Message / Link</span><textarea name="payload" rows="4"></textarea></label>
      </form>`,
      '<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Cancel</button><button type="submit" form="ams-quick-button-form" class="amsl-btn primary">Save Button</button>'
    );
    document.getElementById('ams-quick-button-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      window.AMSAdmissionOps.recordActivity(row.key, {
        title: 'Quick Action Button Created',
        description: `${data.get('name')} (${data.get('action')})${data.get('payload') ? `: ${data.get('payload')}` : ''}`,
        by: row.owner
      });
      window.AMSAdmissionOps.closeDialog();
      window.AMSAdmissionOps.toast('Quick action button saved', 'success');
    });
  },

  showEdit() {
    const row = this.row();
    if (!row) return;
    window.AMSAdmissionOps.modal('Edit Admission Details', `
      <form id="ams-drawer-edit-form" class="amsl-form-grid">
        <label><span>Selected Course</span><input name="course" value="${this.escape(row.course || '')}"></label>
        <label><span>Batch Selection</span><input name="batch" value="${this.escape(row.batch || '')}"></label>
        <label><span>Mode Of Learning</span><select name="mode"><option value="">Not specified</option><option ${row.mode === 'Online' ? 'selected' : ''}>Online</option><option ${row.mode === 'Offline' ? 'selected' : ''}>Offline</option></select></label>
        <label><span>Academic Status</span><input name="academicStatus" value="${this.escape(row.academicStatus || '')}"></label>
        <label class="full"><span>Relevant Query / Remark</span><textarea name="query" rows="3">${this.escape(row.query || '')}</textarea></label>
      </form>`,
      '<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Cancel</button><button type="submit" form="ams-drawer-edit-form" class="amsl-btn primary">Save Changes</button>'
    );
    document.getElementById('ams-drawer-edit-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      window.AMSAdmissionOps.update(row.key, data, {
        title: 'Admission Details Updated',
        description: 'Course, batch, learning mode, academic status, or admission remark updated.',
        by: row.owner
      });
      window.AMSAdmissionOps.closeDialog();
      window.AMSAdmissionOps.toast('Admission details updated', 'success');
    });
  },

  closeAdmission() {
    const row = this.row();
    if (!row) return;
    window.AMSAdmissionOps.confirmDialog(
      'Close Admission Process',
      `Close the admission process for ${row.name}? The record will move to Admission Closed and remain in the AMS history.`,
      'Close Admission',
      () => {
        window.AMSAdmissionOps.update(row.key, { statusKey: 'application_rejected' }, {
          title: 'Admission Process Closed',
          description: 'Admission moved to Admission Closed from the 360° details view.',
          by: row.owner
        });
        window.AMSAdmissionOps.closeDialog();
        window.AMSAdmissionOps.toast('Admission process closed', 'warning');
      },
      true
    );
  },

  setupResize() {
    const handle = document.getElementById('ams-drawer-resize-handle');
    if (!handle) return;
    const stop = () => {
      if (!this.resizeState) return;
      localStorage.setItem(this.storageKey, String(this.width()));
      this.resizeState = null;
      document.body.classList.remove('drawer-resizing');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    const move = event => {
      if (!this.resizeState) return;
      this.setWidth(this.resizeState.width + this.resizeState.x - event.clientX);
    };
    handle.addEventListener('pointerdown', event => {
      event.preventDefault();
      this.resizeState = { x: event.clientX, width: this.width() };
      document.body.classList.add('drawer-resizing');
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', stop);
    });
  },

  width() {
    const drawer = document.getElementById('ams-admission-drawer');
    const value = Number.parseFloat(drawer?.style.width || localStorage.getItem(this.storageKey) || '1120');
    return Number.isFinite(value) ? value : 1120;
  },

  setWidth(value) {
    const drawer = document.getElementById('ams-admission-drawer');
    if (!drawer) return;
    const width = Math.max(Math.min(1360, window.innerWidth - 24), 420);
    const minimum = Math.min(760, width);
    drawer.style.width = `${Math.max(minimum, Math.min(width, value))}px`;
  },

  applyWidth() {
    this.setWidth(this.width());
  },

  hasValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
  },

  displayValue(value) {
    return this.hasValue(value) ? value : '—';
  },

  money(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return '';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  },

  formatBytes(value) {
    const size = Number(value);
    if (!Number.isFinite(size) || size <= 0) return 'Size unavailable';
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1048576).toFixed(1)} MB`;
  },

  titleCase(value) {
    return String(value || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, character => character.toUpperCase());
  },

  text(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value || '—';
  },

  html(id, value) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = value;
  },

  slug(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  },

  escape(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }
};

window.AMSAdmissionDrawer = AMSAdmissionDrawer;
AMSAdmissionDrawer.init();
