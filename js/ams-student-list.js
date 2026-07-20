// ============================================================
// AMS ADMISSION STUDENT LIST - AMS-only presentation and actions
// ============================================================

const AMSStudentList = {
  initialized: false,
  selected: new Set(),
  expanded: new Set(),
  state: {
    stage: 'otr',
    stageStatus: 'Pending',
    selectionMode: false,
    filters: { search: '', status: 'all', course: 'all', batch: 'all', owner: 'all', date: '' }
  },

  stages: [
    { key: 'all', label: 'All' },
    { key: 'otr', label: 'OTR Form' },
    { key: 'interview', label: 'Interview' },
    { key: 'confirmed', label: 'Admission Confirmed' },
    { key: 'rejected', label: 'Admission Reject' }
  ],

  stageStatuses: {
    all: [],
    otr: ['Pending', 'Completed', 'Draft'],
    interview: ['Pending', 'Scheduled', 'Completed'],
    confirmed: ['Confirmed'],
    rejected: ['Rejected']
  },

  init() {
    if (this.initialized || !document.getElementById('amsl-table-body')) return;
    this.initialized = true;
    this.bindEvents();
    this.populateFilters();
    this.render();
  },

  get rows() {
    return (window.AMSModule?.students || []).map((student, index) => this.normalizeStudent(student, index));
  },

  normalizeStudent(student, index) {
    const statusKey = student.statusKey || 'form_pending';
    let stageKey = 'otr';
    let stage = 'OTR Form';
    let stageStatus = 'Pending';
    if (['document_verification', 'fee_pending', 'batch_allocation'].includes(statusKey)) {
      stageKey = 'interview';
      stage = 'Interview';
      stageStatus = statusKey === 'document_verification' ? 'Pending' : statusKey === 'fee_pending' ? 'Scheduled' : 'Completed';
    } else if (statusKey === 'form_submitted') {
      stageStatus = 'Completed';
    } else if (statusKey === 'draft') {
      stageStatus = 'Draft';
    } else if (statusKey === 'onboarded') {
      stageKey = 'confirmed';
      stage = 'Admission Confirmed';
      stageStatus = 'Confirmed';
    } else if (statusKey === 'rejected') {
      stageKey = 'rejected';
      stage = 'Admission Reject';
      stageStatus = 'Rejected';
    }
    const documentMatch = String(student.documents || '').match(/(\d+)\s*\/\s*(\d+)/);
    const verifiedDocuments = documentMatch ? Number(documentMatch[1]) : 0;
    const totalDocuments = documentMatch ? Number(documentMatch[2]) : 6;
    const admissionNo = String(student.otrNo || `AMS-OTR-2026-${148 + index}`).replace(/^AMS-OTR-/i, 'ADM-');
    const day = String(10 + (index % 18)).padStart(2, '0');
    return {
      ...student,
      key: student.otrId || admissionNo,
      admissionNo,
      stageKey,
      stage,
      stageStatus,
      verifiedDocuments,
      totalDocuments,
      hasDocuments: Boolean(student.otrId || verifiedDocuments > 0),
      admissionDate: student.createdAt?.slice(0, 10) || `2026-07-${day}`,
      source: student.sourceLeadNo || 'AMS Direct',
      documentNote: student.scholarship || 'Not Applied'
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
      this.state.filters.status = 'all';
      this.populateStatusFilter();
      this.render();
      return;
    }
    const tool = event.target.closest('[data-amsl-action]')?.dataset.amslAction;
    if (tool) return this.handleTool(tool);
    const preview = event.target.closest('[data-amsl-preview]')?.dataset.amslPreview;
    if (preview) return this.openDocuments(preview);
    const rowAction = event.target.closest('[data-amsl-row-action]');
    if (rowAction) return this.handleRowAction(rowAction.dataset.amslRowAction, rowAction.dataset.key);
  },

  handleFilter(event) {
    const map = {
      'amsl-search': 'search',
      'amsl-status-filter': 'status',
      'amsl-course-filter': 'course',
      'amsl-batch-filter': 'batch',
      'amsl-owner-filter': 'owner',
      'amsl-date-filter': 'date'
    };
    const key = map[event.target.id];
    if (!key) return;
    this.state.filters[key] = event.target.value;
    this.renderTable();
    this.renderSelectionBar();
  },

  setStage(stage) {
    this.state.stage = stage;
    this.state.stageStatus = this.stageStatuses[stage][0] || 'all';
    this.state.filters.status = 'all';
    this.selected.clear();
    this.populateStatusFilter();
    this.render();
  },

  render() {
    this.renderStageNav();
    this.renderStatusNav();
    this.renderTable();
    this.renderSelectionBar();
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
    container.innerHTML = statuses.map(status => `<button type="button" class="${this.state.stageStatus === status ? 'active' : ''}" data-amsl-stage-status="${status}"><span>${status}</span><b>${stageRows.filter(row => row.stageStatus === status).length}</b></button>`).join('');
  },

  filteredRows() {
    const f = this.state.filters;
    return this.rows.filter(row => {
      const stageMatch = this.state.stage === 'all' || row.stageKey === this.state.stage;
      const stageStatusMatch = this.state.stageStatus === 'all' || this.state.stage === 'all' || row.stageStatus === this.state.stageStatus;
      const haystack = `${row.name} ${row.admissionNo} ${row.source} ${row.course} ${row.phone}`.toLowerCase();
      return stageMatch && stageStatusMatch
        && (!f.search || haystack.includes(f.search.toLowerCase()))
        && (f.status === 'all' || row.status === f.status)
        && (f.course === 'all' || row.course === f.course)
        && (f.batch === 'all' || row.batch === f.batch)
        && (f.owner === 'all' || row.owner === f.owner)
        && (!f.date || row.admissionDate === f.date);
    });
  },

  renderTable() {
    const tbody = document.getElementById('amsl-table-body');
    if (!tbody) return;
    const rows = this.filteredRows();
    tbody.innerHTML = rows.length ? rows.map(row => this.renderRow(row)).join('') : `<tr><td colspan="6" class="amsl-empty"><i class="fas fa-user-graduate"></i><strong>No admission records found</strong><span>Change the stage, status, or admission filters.</span></td></tr>`;
  },

  renderRow(row) {
    const selected = this.selected.has(row.key);
    const expanded = this.expanded.has(row.key);
    return `
      <tr class="${selected ? 'selected' : ''}">
        <td><div class="amsl-admission-cell">${this.state.selectionMode ? `<input type="checkbox" data-amsl-select="${this.escape(row.key)}" ${selected ? 'checked' : ''} aria-label="Select ${this.escape(row.name)}" />` : ''}<div><strong>${this.escape(row.admissionNo)}</strong><span>Source: ${this.escape(row.source)}</span></div></div></td>
        <td><div class="amsl-student-cell"><span class="amsl-avatar">${this.initials(row.name)}</span><div><strong>${this.escape(row.name)}</strong><span>${this.escape(row.phone)}</span></div></div></td>
        <td><div class="amsl-stage-cell"><span class="amsl-stage-badge ${row.stageKey}">${this.escape(row.stage)}</span><span class="amsl-status-badge ${this.slug(row.stageStatus)}">${this.escape(row.stageStatus)}</span></div></td>
        <td><div class="amsl-doc-cell"><div><strong>${this.escape(row.documents || `${row.verifiedDocuments}/${row.totalDocuments} verified`)}</strong><span>${this.escape(row.documentNote)}</span></div><button type="button" data-amsl-preview="${this.escape(row.key)}" ${row.hasDocuments ? '' : 'disabled'}><i class="fas fa-file-arrow-down"></i> Preview</button></div></td>
        <td><div class="amsl-owner-cell"><strong>${this.escape(row.owner)}</strong><span>Lead: ${this.escape(row.leadStatus || 'AMS Admission')}</span></div></td>
        <td><div class="amsl-row-actions">
          <button type="button" data-amsl-row-action="view" data-key="${this.escape(row.key)}" data-tooltip="View student" title="View student"><i class="fas fa-eye"></i></button>
          <button type="button" data-amsl-row-action="call" data-key="${this.escape(row.key)}" data-tooltip="Call student" title="Call student"><i class="fas fa-phone"></i></button>
          <button type="button" data-amsl-row-action="whatsapp" data-key="${this.escape(row.key)}" data-tooltip="WhatsApp student" title="WhatsApp student"><i class="fab fa-whatsapp"></i></button>
          <button type="button" data-amsl-row-action="email" data-key="${this.escape(row.key)}" data-tooltip="Email student" title="Email student"><i class="fas fa-envelope"></i></button>
          <button type="button" data-amsl-row-action="more" data-key="${this.escape(row.key)}" data-tooltip="More admission actions" title="More admission actions"><i class="fas fa-ellipsis-vertical"></i></button>
          <button type="button" data-amsl-row-action="expand" data-key="${this.escape(row.key)}" data-tooltip="${expanded ? 'Collapse' : 'Expand'} admission row" title="${expanded ? 'Collapse' : 'Expand'} admission row"><i class="fas fa-chevron-${expanded ? 'up' : 'down'}"></i></button>
        </div></td>
      </tr>
      ${expanded ? `<tr class="amsl-expanded-row"><td colspan="6"><div><span><b>Course</b>${this.escape(row.course)}</span><span><b>Batch</b>${this.escape(row.batch)}</span><span><b>Email</b>${this.escape(row.email || 'Not available')}</span><span><b>Admission Date</b>${this.formatDate(row.admissionDate)}</span></div></td></tr>` : ''}
    `;
  },

  handleRowAction(action, key) {
    const row = this.rows.find(item => item.key === key);
    if (!row) return;
    if (action === 'view') {
      this.closeModal();
      if (row.otrId && window.AMSOTR?.openProfile) return window.AMSOTR.openProfile(row.otrId);
      return this.openStudent(row);
    }
    if (action === 'call') return window.location.href = `tel:${this.phone(row.phone)}`;
    if (action === 'whatsapp') return window.open(`https://wa.me/91${this.phone(row.phone)}`, '_blank', 'noopener');
    if (action === 'email') return window.location.href = `mailto:${row.email || ''}?subject=${encodeURIComponent(`Admission ${row.admissionNo}`)}`;
    if (action === 'more') return this.openMoreActions(row);
    if (action === 'documents') return this.openDocuments(key);
    if (action === 'copy') {
      navigator.clipboard?.writeText(row.admissionNo);
      this.closeModal();
      return;
    }
    if (action === 'expand') {
      this.expanded.has(key) ? this.expanded.delete(key) : this.expanded.add(key);
      this.renderTable();
    }
  },

  handleTool(action) {
    if (action === 'selection') {
      this.state.selectionMode = !this.state.selectionMode;
      if (!this.state.selectionMode) this.selected.clear();
      this.renderTable();
      this.renderSelectionBar();
      return;
    }
    if (action === 'focus-filters') return document.getElementById('amsl-search')?.focus();
    if (action === 'refresh') {
      this.populateFilters();
      return this.render();
    }
    if (action === 'new' && typeof AMSApp !== 'undefined') return AMSApp.showScreen('ams-otr');
    if (action === 'export') return this.exportRows();
    if (action === 'email-selected') return this.emailSelected();
    if (action === 'clear') return this.clearFilters();
    if (action === 'filter-summary') return this.openFilterSummary();
    if (action === 'select-visible') {
      this.filteredRows().forEach(row => this.selected.add(row.key));
      this.renderTable();
      return this.renderSelectionBar();
    }
    if (action === 'clear-selection') {
      this.selected.clear();
      this.renderTable();
      return this.renderSelectionBar();
    }
  },

  renderSelectionBar() {
    const bar = document.getElementById('amsl-selection-bar');
    if (!bar) return;
    bar.hidden = !this.state.selectionMode;
    if (bar.hidden) return;
    bar.innerHTML = `<span><b>${this.selected.size}</b> admission record${this.selected.size === 1 ? '' : 's'} selected</span><div><button type="button" data-amsl-action="select-visible">Select visible</button><button type="button" data-amsl-action="email-selected" ${this.selected.size ? '' : 'disabled'}>Email selected</button><button type="button" data-amsl-action="clear-selection" ${this.selected.size ? '' : 'disabled'}>Clear</button></div>`;
    document.querySelectorAll('[data-amsl-select]').forEach(input => {
      input.addEventListener('change', event => {
        event.target.checked ? this.selected.add(event.target.dataset.amslSelect) : this.selected.delete(event.target.dataset.amslSelect);
        this.renderSelectionBar();
      });
    });
  },

  populateFilters() {
    this.populateSelect('amsl-course-filter', 'Course', this.rows.map(row => row.course));
    this.populateSelect('amsl-batch-filter', 'Batch', this.rows.map(row => row.batch));
    this.populateSelect('amsl-owner-filter', 'Owner', this.rows.map(row => row.owner));
    this.populateStatusFilter();
  },

  populateStatusFilter() {
    const statuses = this.rows
      .filter(row => (this.state.stage === 'all' || row.stageKey === this.state.stage)
        && (this.state.stageStatus === 'all' || row.stageStatus === this.state.stageStatus))
      .map(row => row.status);
    this.populateSelect('amsl-status-filter', 'Status', statuses, 'status');
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
    Object.assign(this.state.filters, { search: '', status: 'all', course: 'all', batch: 'all', owner: 'all', date: '' });
    ['amsl-search', 'amsl-date-filter'].forEach(id => { const input = document.getElementById(id); if (input) input.value = ''; });
    this.populateFilters();
    this.renderTable();
    this.renderSelectionBar();
  },

  openStudent(row) {
    this.openModal(row.name, `<div class="amsl-profile-banner"><span>${this.initials(row.name)}</span><div><strong>${this.escape(row.admissionNo)}</strong><small>${this.escape(row.stage)} · ${this.escape(row.stageStatus)}</small></div></div><div class="amsl-detail-grid">${this.detail('Mobile', row.phone)}${this.detail('Email', row.email || 'Not available')}${this.detail('Course', row.course)}${this.detail('Batch', row.batch)}${this.detail('Owner', row.owner)}${this.detail('Source', row.source)}</div>`);
  },

  openDocuments(key) {
    const row = this.rows.find(item => item.key === key);
    if (!row || !row.hasDocuments) return;
    const record = row.otrId ? window.AMSOTR?.getRecords?.().find(item => item.id === row.otrId) : null;
    const actualDocuments = Object.entries(record?.documents || {}).filter(([, file]) => file?.name);
    const genericNames = ['Identity Proof', 'SSC Marksheet', 'HSC Marksheet', 'Graduation Certificate', 'Category Certificate', 'Passport Photo'];
    const documents = actualDocuments.length
      ? actualDocuments.map(([type, file]) => ({ name: file.name, type: this.titleCase(type), dataUrl: file.dataUrl }))
      : genericNames.slice(0, row.verifiedDocuments).map(name => ({ name, type: 'Verified document', dataUrl: '' }));
    this.openModal('Document Preview', `<div class="amsl-document-summary"><strong>${this.escape(row.name)}</strong><span>${this.escape(row.documents)}</span></div><div class="amsl-document-list">${documents.map(document => `<article><i class="fas fa-file-lines"></i><div><strong>${this.escape(document.name)}</strong><span>${this.escape(document.type)}</span></div>${document.dataUrl ? `<a href="${document.dataUrl}" target="_blank" rel="noopener" title="Open document"><i class="fas fa-arrow-up-right-from-square"></i></a>` : `<span class="amsl-verified"><i class="fas fa-circle-check"></i> Verified</span>`}</article>`).join('')}</div>`);
  },

  openMoreActions(row) {
    this.openModal('Admission Actions', `<div class="amsl-more-actions"><button type="button" data-amsl-modal-action="view" data-key="${this.escape(row.key)}"><i class="fas fa-user"></i><span><strong>View admission record</strong><small>Open the AMS student details.</small></span></button><button type="button" data-amsl-modal-action="documents" data-key="${this.escape(row.key)}" ${row.hasDocuments ? '' : 'disabled'}><i class="fas fa-folder-open"></i><span><strong>Preview documents</strong><small>Review available admission documents.</small></span></button><button type="button" data-amsl-modal-action="copy" data-key="${this.escape(row.key)}"><i class="fas fa-copy"></i><span><strong>Copy admission number</strong><small>${this.escape(row.admissionNo)}</small></span></button></div>`);
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
    const headers = ['Admission', 'Source', 'Student', 'Mobile', 'Stage', 'Status', 'Documents', 'Owner'];
    const data = this.filteredRows().map(row => [row.admissionNo, row.source, row.name, row.phone, row.stage, row.stageStatus, row.documents, row.owner]);
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
  initials(name = '') { return name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase(); },
  phone(value = '') { return String(value).replace(/\D/g, '').slice(-10); },
  slug(value = '') { return value.toLowerCase().replace(/\s+/g, '-'); },
  titleCase(value = '') { return value.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase()).trim(); },
  formatDate(value) { return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); },
  escape(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
};

window.AMSStudentList = AMSStudentList;
