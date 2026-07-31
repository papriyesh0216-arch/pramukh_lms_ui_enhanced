// ============================================================
// AMS ADMISSION STUDENT OPERATIONS
// LMS-equivalent interactions backed exclusively by AMS records.
// ============================================================

const AMSAdmissionOps = {
  storageKey: 'paAMSAdmissionOperations',
  archiveFilter: 'all',
  store: {
    overrides: {},
    activities: {},
    archive: {},
    records: [],
    savedFilters: [],
    classHistory: {}
  },

  stageDefinitions: [
    {
      key: 'otr', label: 'OTR Form',
      statuses: [
        { key: 'form_pending', label: 'Pending' },
        { key: 'form_submitted', label: 'Completed' },
        { key: 'draft', label: 'Draft' }
      ]
    },
    {
      key: 'interview', label: 'Interview',
      statuses: [
        { key: 'document_verification', label: 'Pending' },
        { key: 'fee_pending', label: 'Scheduled' },
        { key: 'batch_allocation', label: 'Completed' }
      ]
    },
    {
      key: 'confirmed', label: 'Admission Confirmed',
      statuses: [{ key: 'onboarded', label: 'Confirmed' }]
    },
    {
      key: 'rejected', label: 'Admission Reject',
      statuses: [{ key: 'rejected', label: 'Rejected' }]
    }
  ],

  init() {
    this.load();
    const screen = document.getElementById('screen-ams-students');
    if (!screen || screen.dataset.amsOpsBound) return;
    screen.dataset.amsOpsBound = 'true';
    screen.addEventListener('click', event => {
      const archiveFilter = event.target.closest('[data-amsl-archive-filter]')?.dataset.amslArchiveFilter;
      if (archiveFilter) this.setArchiveFilter(archiveFilter);
      const archiveAction = event.target.closest('[data-amsl-archive-action]');
      if (archiveAction) this.handleArchiveAction(archiveAction.dataset.amslArchiveAction, archiveAction.dataset.key);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.getElementById('ams-ops-dialog')) this.closeDialog();
    });
    window.addEventListener('ams:data-change', () => {
      window.AMSStudentList?.populateFilters?.();
      window.AMSStudentList?.render?.();
      this.renderArchive();
    });
  },

  load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      this.store = {
        overrides: parsed.overrides || {},
        activities: parsed.activities || {},
        archive: parsed.archive || {},
        records: Array.isArray(parsed.records) ? parsed.records : [],
        savedFilters: Array.isArray(parsed.savedFilters) ? parsed.savedFilters : [],
        classHistory: parsed.classHistory || {}
      };
    } catch (error) {
      this.store = { overrides: {}, activities: {}, archive: {}, records: [], savedFilters: [], classHistory: {} };
    }
  },

  persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.store));
    window.dispatchEvent(new CustomEvent('ams:data-change', { detail: { source: 'admission-student-list' } }));
  },

  decorateRows(baseRows) {
    const extraRows = this.store.records.map((record, index) =>
      window.AMSStudentList.normalizeStudent(record, baseRows.length + index)
    );
    return [...baseRows, ...extraRows]
      .map(row => {
        const override = this.store.overrides[row.key] || {};
        const stage = this.getStageByStatus(override.statusKey || row.statusKey);
        const activities = this.store.activities[row.key] || [];
        const latestFollowup = activities.find(item => item.type === 'followup');
        return {
          ...row,
          ...override,
          stageKey: stage?.key || override.stageKey || row.stageKey,
          stage: stage?.label || override.stage || row.stage,
          stageStatus: stage?.statusLabel || override.stageStatus || row.stageStatus,
          status: stage?.statusText || override.status || row.status,
          followupDate: latestFollowup?.payload?.followupDate || override.followupDate || '',
          followupPurpose: latestFollowup?.payload?.purpose || override.followupPurpose || '',
          activities
        };
      })
      .filter(row => !this.store.archive[row.key]);
  },

  getStage(key) {
    return this.stageDefinitions.find(stage => stage.key === key);
  },

  getStageByStatus(statusKey) {
    for (const stage of this.stageDefinitions) {
      const status = stage.statuses.find(item => item.key === statusKey);
      if (status) {
        const statusText = (window.APP_DATA?.AMS_STATUS_FLOW || []).find(item => item.key === statusKey)?.label || status.label;
        return { key: stage.key, label: stage.label, statusLabel: status.label, statusText };
      }
    }
    return null;
  },

  row(key, includeArchived = false) {
    const active = window.AMSStudentList?.rows?.find(item => item.key === key);
    if (active) return active;
    if (!includeArchived) return null;
    const archived = this.store.archive[key];
    return archived?.snapshot ? { ...archived.snapshot, ...(this.store.overrides[key] || {}) } : null;
  },

  selectedRows() {
    return window.AMSStudentList.rows.filter(row => window.AMSStudentList.selected.has(row.key));
  },

  update(key, patch, activity) {
    this.store.overrides[key] = { ...(this.store.overrides[key] || {}), ...patch, updatedAt: new Date().toISOString() };
    if (activity) this.recordActivity(key, activity, false);
    this.persist();
  },

  showChangeClass(key) {
    const row = this.row(key);
    if (!row) return;
    const options = [...new Set([
      ...window.AMSStudentList.rows.map(item => item.batch).filter(Boolean),
      ...(window.AMSInterviews?.courses || []).map(course => `${course} 2026 Batch`)
    ])].filter(item => item !== row.batch);
    this.modal('Change Class', `
      <form id="ams-change-class-form" class="ams-class-change-form">
        <label><span>Current Class</span><input value="${this.escape(row.batch || 'Not allocated')}" readonly></label>
        <label><span>Change Class <b>*</b></span><select name="batch" required><option value="">Select</option>${options.map(item => `<option value="${this.escape(item)}">${this.escape(item)}</option>`).join('')}</select></label>
      </form>
      <div class="ams-class-history">
        <h3>Class Change History</h3>
        ${(this.store.classHistory[key] || []).length ? this.store.classHistory[key].map(item => `<article><strong>${this.escape(item.from || 'Not allocated')} &rarr; ${this.escape(item.to)}</strong><small>${this.formatDateTime(item.at)} &middot; ${this.escape(item.by)}</small></article>`).join('') : '<div class="amsl-modal-empty">No previous class changes.</div>'}
      </div>`,
      '<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Cancel</button><button type="submit" form="ams-change-class-form" class="amsl-btn primary">Save</button>',
      'wide'
    );
    document.getElementById('ams-change-class-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const batch = String(new FormData(event.currentTarget).get('batch') || '');
      if (!batch) return this.toast('Select the new class', 'warning');
      const history = {
        from: row.batch || '',
        to: batch,
        by: row.owner || 'Admission Desk',
        at: new Date().toISOString()
      };
      this.store.classHistory[key] = [history, ...(this.store.classHistory[key] || [])];
      this.store.overrides[key] = { ...(this.store.overrides[key] || {}), batch, updatedAt: history.at };
      window.AMSInterviews?.syncStudentClass?.(row, batch);
      this.recordActivity(key, {
        title: 'Admission Class Changed',
        description: `${history.from || 'Not allocated'} changed to ${batch}.`,
        by: history.by,
        at: history.at
      }, false);
      this.persist();
      this.closeDialog();
      this.toast('Class mapping updated', 'success');
    });
  },

  showEditAdmission(key) {
    const row = this.row(key);
    if (!row) return;
    this.modal('Edit Admission Record', `
      <form id="ams-row-edit-form" class="amsl-form-grid">
        <label><span>Selected Course</span><input name="course" value="${this.escape(row.course || '')}"></label>
        <label><span>Batch / Class</span><input name="batch" value="${this.escape(row.batch || '')}"></label>
        <label><span>Mode Of Learning</span><select name="mode"><option value="">Not specified</option><option ${row.mode === 'Online' ? 'selected' : ''}>Online</option><option ${row.mode === 'Offline' ? 'selected' : ''}>Offline</option></select></label>
        <label><span>Academic Status</span><input name="academicStatus" value="${this.escape(row.academicStatus || '')}"></label>
        <label class="full"><span>Remark</span><textarea name="query" rows="3">${this.escape(row.query || row.remark || '')}</textarea></label>
      </form>`,
      '<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Cancel</button><button type="submit" form="ams-row-edit-form" class="amsl-btn primary">Save Changes</button>'
    );
    document.getElementById('ams-row-edit-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      this.update(key, { ...data, remark: data.query }, {
        title: 'Admission Record Updated',
        description: 'Admission course, class, learning mode, academic status, or remark updated.',
        by: row.owner
      });
      this.closeDialog();
      this.toast('Admission record updated', 'success');
    });
  },

  recordActivity(key, activity, shouldPersist = true) {
    const now = new Date();
    const entry = {
      id: `AMSACT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: activity.type || 'note',
      title: activity.title || 'Admission Activity',
      description: activity.description || '',
      by: activity.by || this.row(key, true)?.owner || 'Admission Desk',
      at: activity.at || now.toISOString(),
      payload: activity.payload || null
    };
    this.store.activities[key] = [entry, ...(this.store.activities[key] || [])];
    if (shouldPersist) this.persist();
    return entry;
  },

  handleRowAction(action, row) {
    const routes = {
      view: () => window.AMSAdmissionDrawer?.open?.(row.key),
      view360: () => window.AMSAdmissionDrawer?.open?.(row.key),
      profile: () => window.AMSAdmissionDrawer?.open?.(row.key),
      followup: () => this.showFollowup(row.key),
      assign: () => this.showAssignment([row.key]),
      stage: () => this.showStageUpdate([row.key]),
      funnel: () => this.showJourney(row.key),
      duplicate: () => this.showDuplicateScan(row.key),
      archive: () => this.showArchiveConfirm([row.key], 'archived'),
      delete: () => this.showArchiveConfirm([row.key], 'deleted'),
      print: () => this.printAdmission(row.key)
    };
    if (!routes[action]) return false;
    window.AMSStudentList.state.openMenuKey = '';
    routes[action]();
    return true;
  },

  handleTool(action) {
    const routes = {
      'view-active': () => this.switchView('active'),
      'view-archive': () => this.switchView('archive'),
      import: () => this.showImport(),
      sort: () => this.showSort(),
      'filter-summary': () => this.showSavedFilters(),
      'bulk-followup': () => this.showBulkFollowup(),
      'bulk-stage': () => this.showStageUpdate(this.selectedRows().map(row => row.key)),
      'bulk-assign': () => this.showAssignment(this.selectedRows().map(row => row.key)),
      'bulk-communication': () => this.showCommunication(this.selectedRows().map(row => row.key)),
      'bulk-export': () => this.exportSelected(),
      'bulk-archive': () => this.showArchiveConfirm(this.selectedRows().map(row => row.key), 'archived'),
      'bulk-delete': () => this.showArchiveConfirm(this.selectedRows().map(row => row.key), 'deleted')
    };
    if (!routes[action]) return false;
    routes[action]();
    return true;
  },

  switchView(view) {
    const archive = view === 'archive';
    document.getElementById('amsl-active-view').hidden = archive;
    document.getElementById('amsl-archive-view').hidden = !archive;
    document.querySelectorAll('.amsl-view-switch button').forEach((button, index) => {
      const active = archive ? index === 1 : index === 0;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    if (archive) this.renderArchive();
  },

  setArchiveFilter(filter) {
    this.archiveFilter = filter;
    document.querySelectorAll('[data-amsl-archive-filter]').forEach(button =>
      button.classList.toggle('active', button.dataset.amslArchiveFilter === filter)
    );
    this.renderArchive();
  },

  renderArchive() {
    const container = document.getElementById('amsl-archive-list');
    if (!container) return;
    const rows = Object.entries(this.store.archive)
      .map(([key, value]) => ({ key, ...value }))
      .filter(row => !row.permanent);
    ['all', 'duplicate', 'archived', 'deleted'].forEach(type => {
      const count = type === 'all' ? rows.length : rows.filter(row => row.reason === type).length;
      const element = document.getElementById(`amsl-archive-count-${type}`);
      if (element) element.textContent = count;
    });
    const visible = rows.filter(row => this.archiveFilter === 'all' || row.reason === this.archiveFilter);
    container.innerHTML = visible.length ? visible.map(item => {
      const row = item.snapshot || {};
      return `<article class="amsl-archive-row">
        <span class="amsl-archive-icon"><i class="fas fa-box-archive"></i></span>
        <div><strong>${this.escape(row.name || 'Admission Student')}</strong><small>${this.escape(row.admissionNo || item.key)}</small></div>
        <div><span>Reason</span><strong>${this.title(item.reason)}</strong></div>
        <div><span>Archived on</span><strong>${this.formatDateTime(item.archivedAt)}</strong></div>
        <div><span>Archived by</span><strong>${this.escape(item.by || 'Admission Desk')}</strong></div>
        <div class="amsl-archive-actions">
          <button type="button" data-amsl-archive-action="restore" data-key="${this.escape(item.key)}"><i class="fas fa-rotate-left"></i> Restore</button>
          <button type="button" class="danger" data-amsl-archive-action="delete" data-key="${this.escape(item.key)}"><i class="fas fa-trash"></i> Delete permanently</button>
        </div>
      </article>`;
    }).join('') : `<div class="amsl-empty"><i class="fas fa-box-open"></i><strong>No archived admission records</strong><span>Archived and duplicate admission records appear here.</span></div>`;
  },

  handleArchiveAction(action, key) {
    if (!this.store.archive[key]) return;
    if (action === 'restore') {
      const name = this.store.archive[key].snapshot?.name || 'Admission student';
      delete this.store.archive[key];
      this.recordActivity(key, { title: 'Admission Restored', description: `${name} restored to the active admission list.` }, false);
      this.persist();
      this.renderArchive();
      this.toast(`${name} restored`, 'success');
      return;
    }
    if (action === 'delete') {
      this.confirmDialog(
        'Delete Admission Permanently',
        'This removes the archived AMS admission record and its operational history. This action cannot be undone.',
        'Delete Permanently',
        () => {
          const isImported = this.store.records.some(record => (record.otrId || record.key || record.otrNo) === key);
          this.store.records = this.store.records.filter(record => (record.otrId || record.key || record.otrNo) !== key);
          if (isImported) {
            delete this.store.archive[key];
          } else {
            this.store.archive[key] = { ...this.store.archive[key], permanent: true, snapshot: null };
          }
          delete this.store.overrides[key];
          delete this.store.activities[key];
          this.persist();
          this.renderArchive();
          this.toast('Archived admission record deleted permanently', 'warning');
        },
        true
      );
    }
  },

  showFollowup(key, bulkKeys = null) {
    const keys = bulkKeys?.length ? bulkKeys : [key];
    const row = this.row(keys[0]);
    if (!row) return;
    const history = (this.store.activities[row.key] || []).filter(item => item.type === 'followup');
    const historyHtml = history.length ? history.map(item => `
      <article class="amsl-history-item">
        <i class="fas fa-calendar-check"></i>
        <div><strong>${this.escape(item.title)}</strong><span>${this.escape(item.description)}</span><small>${this.formatDateTime(item.at)} · ${this.escape(item.by)}</small></div>
      </article>`).join('') : '<div class="amsl-modal-empty">No follow-ups recorded yet.</div>';
    const stages = this.stageDefinitions.map(stage => `<option value="${stage.key}">${stage.label}</option>`).join('');
    this.sharedModal(`Manage Follow-up — ${row.name}`, `
      <div class="ams-followup-shared-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-height:70vh">
        <section><h3>Follow-up History</h3><div class="amsl-history-list">${historyHtml}</div></section>
        <section><h3>${keys.length > 1 ? `Add Follow-up to ${keys.length} Students` : 'Add Follow-up Action'}</h3>
          <form id="ams-followup-form">
            <div class="modal-grid-2 compact-grid">
              <div class="form-field"><label>Admission Stage *</label><select name="stage" required><option value="">Select Admission Stage</option>${stages}</select></div>
              <div class="form-field"><label>Stage Status *</label><select name="status" required><option value="">Select Stage Status</option></select></div>
              <div class="form-field"><label>Reference No.</label><input name="reference" placeholder="Optional reference number"></div>
              <div class="form-field"><label>Follow-up Date *</label><input name="date" type="date" required></div>
              <div class="form-field"><label>Follow-up Time</label><input name="time" type="time"></div>
              <div class="form-field"><label>Followed By</label><div class="readonly-field">${this.escape(row.owner || 'Admission Desk')}</div></div>
              <div class="form-field full"><label>Purpose *</label><textarea name="purpose" rows="3" required placeholder="Enter purpose"></textarea></div>
            </div>
          </form>
        </section>
      </div>`,
      `<button type="button" class="btn btn-outline btn-sm" data-ams-dialog-close>Close</button><button type="submit" form="ams-followup-form" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Add Action</button>`
    );
    const form = document.getElementById('ams-followup-form');
    const stageSelect = form.elements.stage;
    const statusSelect = form.elements.status;
    const syncStatuses = () => {
      const stage = this.getStage(stageSelect.value);
      statusSelect.innerHTML = `<option value="">Select Stage Status</option>${(stage?.statuses || []).map(status => `<option value="${status.key}">${status.label}</option>`).join('')}`;
    };
    stageSelect.addEventListener('change', syncStatuses);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const statusKey = data.get('status');
      const stage = this.getStageByStatus(statusKey);
      if (!stage || !data.get('date') || !String(data.get('purpose')).trim()) return this.toast('Complete all required follow-up fields', 'warning');
      keys.forEach(targetKey => {
        const target = this.row(targetKey);
        if (!target) return;
        this.store.overrides[targetKey] = {
          ...(this.store.overrides[targetKey] || {}),
          statusKey,
          followupDate: data.get('date'),
          followupPurpose: String(data.get('purpose')).trim(),
          updatedAt: new Date().toISOString()
        };
        this.recordActivity(targetKey, {
          type: 'followup',
          title: 'Follow-up Management',
          description: `${stage.label} - ${stage.statusLabel}. Purpose: ${String(data.get('purpose')).trim()}${data.get('reference') ? `. Ref No: ${data.get('reference')}` : ''}`,
          by: target.owner,
          payload: {
            stageKey: stage.key,
            statusKey,
            followupDate: data.get('date'),
            followupTime: data.get('time'),
            reference: data.get('reference'),
            purpose: String(data.get('purpose')).trim()
          }
        }, false);
      });
      this.persist();
      this.closeDialog();
      window.AMSStudentList.selected.clear();
      window.AMSStudentList.render();
      this.toast(`Follow-up recorded for ${keys.length} admission record${keys.length === 1 ? '' : 's'}`, 'success');
    });
  },

  showBulkFollowup() {
    const keys = this.selectedRows().map(row => row.key);
    if (!keys.length) return this.toast('Select admission records first', 'warning');
    this.showFollowup(keys[0], keys);
  },

  showAssignment(keys) {
    if (!keys?.length) return this.toast('Select admission records first', 'warning');
    const owners = [...new Set([
      ...window.AMSStudentList.rows.map(row => row.owner),
      'Admission Desk', 'Bharat Sir', 'Vivek Sir', 'Pooja Shah', 'Hary Sir'
    ].filter(Boolean))].sort();
    this.modal(keys.length > 1 ? `Assign ${keys.length} Admission Records` : 'Assign Admission Owner', `
      <form id="ams-assignment-form" class="amsl-form-grid single">
        <label><span>Admission Owner *</span><select name="owner" required><option value="">Select owner</option>${owners.map(owner => `<option>${this.escape(owner)}</option>`).join('')}</select></label>
        <label class="full"><span>Assignment Note</span><textarea name="note" rows="3" placeholder="Optional assignment note"></textarea></label>
      </form>`,
      `<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Cancel</button><button type="submit" form="ams-assignment-form" class="amsl-btn primary">Assign</button>`
    );
    document.getElementById('ams-assignment-form').addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const owner = String(data.get('owner') || '');
      if (!owner) return;
      keys.forEach(key => {
        this.store.overrides[key] = { ...(this.store.overrides[key] || {}), owner, updatedAt: new Date().toISOString() };
        this.recordActivity(key, {
          title: 'Admission Reassigned',
          description: `Assigned to ${owner}.${data.get('note') ? ` ${data.get('note')}` : ''}`,
          by: owner
        }, false);
      });
      this.persist();
      this.closeDialog();
      window.AMSStudentList.selected.clear();
      window.AMSStudentList.populateFilters();
      window.AMSStudentList.render();
      this.toast(`${keys.length} admission record${keys.length === 1 ? '' : 's'} assigned`, 'success');
    });
  },

  showStageUpdate(keys) {
    if (!keys?.length) return this.toast('Select admission records first', 'warning');
    this.modal(keys.length > 1 ? `Update Stage for ${keys.length} Students` : 'Update Admission Stage', `
      <form id="ams-stage-form" class="amsl-form-grid single">
        <label><span>Admission Stage *</span><select name="stage" required><option value="">Select stage</option>${this.stageDefinitions.map(stage => `<option value="${stage.key}">${stage.label}</option>`).join('')}</select></label>
        <label><span>Stage Status *</span><select name="status" required><option value="">Select status</option></select></label>
        <label class="full"><span>Remarks</span><textarea name="remarks" rows="3" placeholder="Reason or transition note"></textarea></label>
      </form>`,
      `<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Cancel</button><button type="submit" form="ams-stage-form" class="amsl-btn primary">Update Stage</button>`
    );
    const form = document.getElementById('ams-stage-form');
    form.elements.stage.addEventListener('change', () => {
      const stage = this.getStage(form.elements.stage.value);
      form.elements.status.innerHTML = `<option value="">Select status</option>${(stage?.statuses || []).map(status => `<option value="${status.key}">${status.label}</option>`).join('')}`;
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const statusKey = String(data.get('status') || '');
      const stage = this.getStageByStatus(statusKey);
      if (!stage) return;
      keys.forEach(key => {
        this.store.overrides[key] = { ...(this.store.overrides[key] || {}), statusKey, updatedAt: new Date().toISOString() };
        this.recordActivity(key, {
          title: 'Admission Stage Updated',
          description: `Moved to ${stage.label} - ${stage.statusLabel}.${data.get('remarks') ? ` ${data.get('remarks')}` : ''}`
        }, false);
      });
      this.persist();
      this.closeDialog();
      window.AMSStudentList.selected.clear();
      window.AMSStudentList.state.stage = stage.key;
      window.AMSStudentList.state.stageStatus = stage.statusLabel;
      window.AMSStudentList.render();
      this.toast('Admission stage updated', 'success');
    });
  },

  showCommunication(keys) {
    if (!keys?.length) return this.toast('Select admission records first', 'warning');
    this.modal(`Communicate with ${keys.length} Student${keys.length === 1 ? '' : 's'}`, `
      <form id="ams-communication-form" class="amsl-form-grid single">
        <label><span>Channel *</span><select name="channel" required><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="call">Call Note</option></select></label>
        <label class="full"><span>Subject</span><input name="subject" placeholder="Admission update"></label>
        <label class="full"><span>Message / Remarks *</span><textarea name="message" rows="5" required placeholder="Enter admission communication"></textarea></label>
      </form>`,
      `<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Cancel</button><button type="submit" form="ams-communication-form" class="amsl-btn primary">Record &amp; Continue</button>`
    );
    document.getElementById('ams-communication-form').addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const channel = String(data.get('channel'));
      const message = String(data.get('message') || '').trim();
      if (!message) return;
      keys.forEach(key => this.recordActivity(key, {
        type: channel,
        title: `${this.title(channel)} Communication`,
        description: `${data.get('subject') ? `${data.get('subject')}: ` : ''}${message}`,
        payload: { channel, subject: data.get('subject'), message }
      }, false));
      this.persist();
      this.closeDialog();
      const rows = keys.map(key => this.row(key)).filter(Boolean);
      if (channel === 'email') {
        const emails = rows.map(row => row.email).filter(Boolean);
        if (emails.length) window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(','))}&subject=${encodeURIComponent(String(data.get('subject') || 'Admission update'))}&body=${encodeURIComponent(message)}`;
      } else if (channel === 'whatsapp' && rows.length === 1) {
        window.open(`https://wa.me/91${window.AMSStudentList.phone(rows[0].phone)}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
      }
      this.toast('Communication activity recorded', 'success');
    });
  },

  showSort() {
    const list = window.AMSStudentList;
    const options = [
      ['admissionDate', 'Admission Date'],
      ['name', 'Student Name'],
      ['admissionNo', 'Admission Number'],
      ['stage', 'Admission Stage'],
      ['course', 'Course'],
      ['owner', 'Owner']
    ];
    this.modal('Sort Admission Students', `
      <form id="ams-sort-form" class="amsl-form-grid single">
        <label><span>Sort By</span><select name="field">${options.map(([key, label]) => `<option value="${key}" ${list.state.sortField === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
        <label><span>Direction</span><select name="direction"><option value="asc" ${list.state.sortDirection === 'asc' ? 'selected' : ''}>Ascending</option><option value="desc" ${list.state.sortDirection === 'desc' ? 'selected' : ''}>Descending</option></select></label>
      </form>`,
      `<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Cancel</button><button type="submit" form="ams-sort-form" class="amsl-btn primary">Apply Sort</button>`
    );
    document.getElementById('ams-sort-form').addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      list.state.sortField = String(data.get('field'));
      list.state.sortDirection = String(data.get('direction'));
      list.state.page = 1;
      this.closeDialog();
      list.render();
      this.toast('Admission sorting updated', 'success');
    });
  },

  showSavedFilters() {
    const saved = this.store.savedFilters || [];
    this.modal('Saved Admission Filters', `
      <form id="ams-save-filter-form" class="amsl-form-grid single">
        <label><span>View Name</span><input name="name" required placeholder="Example: Pending document verification"></label>
      </form>
      <div class="amsl-saved-filter-list">
        ${saved.length ? saved.map(item => `<article><div><strong>${this.escape(item.name)}</strong><small>${this.escape(Object.entries(item.filters).filter(([, value]) => value && value !== 'all').map(([key, value]) => `${this.title(key)}: ${value}`).join(' · ') || 'No additional filters')}</small></div><button type="button" data-ams-saved-apply="${this.escape(item.id)}">Apply</button><button type="button" class="danger" data-ams-saved-delete="${this.escape(item.id)}"><i class="fas fa-trash"></i></button></article>`).join('') : '<div class="amsl-modal-empty">No saved admission filter views.</div>'}
      </div>`,
      `<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Close</button><button type="submit" form="ams-save-filter-form" class="amsl-btn primary"><i class="fas fa-bookmark"></i> Save Current View</button>`
    );
    document.getElementById('ams-save-filter-form').addEventListener('submit', event => {
      event.preventDefault();
      const name = String(new FormData(event.currentTarget).get('name') || '').trim();
      if (!name) return;
      this.store.savedFilters.push({
        id: `AMSFILTER-${Date.now()}`,
        name,
        filters: { ...window.AMSStudentList.state.filters },
        stage: window.AMSStudentList.state.stage,
        stageStatus: window.AMSStudentList.state.stageStatus
      });
      this.persist();
      this.closeDialog();
      this.toast('Admission filter view saved', 'success');
    });
    document.querySelectorAll('[data-ams-saved-apply]').forEach(button => button.addEventListener('click', () => {
      const item = this.store.savedFilters.find(view => view.id === button.dataset.amsSavedApply);
      if (!item) return;
      Object.assign(window.AMSStudentList.state.filters, item.filters);
      window.AMSStudentList.state.stage = item.stage;
      window.AMSStudentList.state.stageStatus = item.stageStatus;
      window.AMSStudentList.state.page = 1;
      this.closeDialog();
      this.syncFilterControls();
      window.AMSStudentList.render();
      this.toast(`Applied ${item.name}`, 'success');
    }));
    document.querySelectorAll('[data-ams-saved-delete]').forEach(button => button.addEventListener('click', () => {
      this.store.savedFilters = this.store.savedFilters.filter(view => view.id !== button.dataset.amsSavedDelete);
      this.persist();
      this.showSavedFilters();
    }));
  },

  syncFilterControls() {
    const list = window.AMSStudentList;
    const ids = {
      'amsl-search': 'search',
      'amsl-status-filter': 'status',
      'amsl-course-filter': 'course',
      'amsl-batch-filter': 'batch',
      'amsl-owner-filter': 'owner',
      'amsl-document-filter': 'document',
      'amsl-source-filter': 'source',
      'amsl-date-filter': 'date',
      'amsl-followup-filter': 'followup'
    };
    list.populateFilters();
    Object.entries(ids).forEach(([id, key]) => {
      const control = document.getElementById(id);
      if (control) control.value = list.state.filters[key] || (control.tagName === 'SELECT' ? 'all' : '');
    });
  },

  exportSelected() {
    const rows = this.selectedRows();
    if (!rows.length) return this.toast('Select admission records first', 'warning');
    const headers = ['Admission', 'Source', 'Student', 'Mobile', 'Email', 'Stage', 'Status', 'Course', 'Batch', 'Documents', 'Owner'];
    const values = rows.map(row => [row.admissionNo, row.source, row.name, row.phone, row.email, row.stage, row.stageStatus, row.course, row.batch, row.documents, row.owner]);
    const csv = [headers, ...values].map(items => items.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ams-selected-admissions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.toast(`${rows.length} selected admission record${rows.length === 1 ? '' : 's'} exported`, 'success');
  },

  showJourney(key) {
    const row = this.row(key);
    if (!row) return;
    document.getElementById('ams-admission-journey')?.remove();
    const activeIndex = Math.max(0, this.stageDefinitions.findIndex(stage => stage.key === row.stageKey));
    const overlay = document.createElement('aside');
    overlay.id = 'ams-admission-journey';
    overlay.className = 'amsl-journey-overlay';
    overlay.innerHTML = `<div class="amsl-journey-drawer">
      <header><div><span>Admission Journey</span><h2>${this.escape(row.name)}</h2><small>${this.escape(row.admissionNo)} · ${this.escape(row.owner)}</small></div><button type="button" data-ams-journey-close><i class="fas fa-times"></i></button></header>
      <div class="amsl-journey-body">
        <div class="amsl-funnel">${this.stageDefinitions.map((stage, index) => `<div class="${index < activeIndex ? 'complete' : index === activeIndex ? 'active' : ''}"><i class="fas ${index < activeIndex ? 'fa-check' : 'fa-circle'}"></i><span><strong>${stage.label}</strong><small>${index === activeIndex ? row.stageStatus : index < activeIndex ? 'Completed' : 'Upcoming'}</small></span></div>`).join('')}</div>
        ${this.timelineHtml(row)}
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('[data-ams-journey-close]')) overlay.remove();
    });
  },

  timelineHtml(row) {
    const entries = [
      {
        type: 'created',
        title: 'Admission Record Created',
        description: `${row.course || 'Admission'} record received from ${row.source || 'AMS Direct'}.`,
        by: row.owner || 'Admission Desk',
        at: row.admissionDate
      },
      ...(this.store.activities[row.key] || [])
    ];
    const icons = { created: 'fa-flag', followup: 'fa-calendar-check', email: 'fa-envelope', whatsapp: 'fa-message', sms: 'fa-comment', call: 'fa-phone', note: 'fa-clipboard-list' };
    return `<div class="amsl-timeline">${entries.map(entry => `<article><span><i class="fas ${icons[entry.type] || 'fa-clipboard-list'}"></i></span><div><small>${this.formatDateTime(entry.at)}</small><strong>${this.escape(entry.title)}</strong><p>${this.escape(entry.description)}</p><em>Handled by ${this.escape(entry.by || 'Admission Desk')}</em></div></article>`).join('')}</div>`;
  },

  showDuplicateScan(key) {
    const row = this.row(key);
    if (!row) return;
    const normalizedPhone = window.AMSStudentList.phone(row.phone);
    const normalizedEmail = String(row.email || '').trim().toLowerCase();
    const matches = window.AMSStudentList.rows.filter(candidate => {
      if (candidate.key === key) return false;
      const phone = window.AMSStudentList.phone(candidate.phone);
      const email = String(candidate.email || '').trim().toLowerCase();
      return (normalizedPhone && phone === normalizedPhone)
        || (normalizedEmail && email === normalizedEmail)
        || (candidate.name.toLowerCase() === row.name.toLowerCase() && candidate.course === row.course);
    });
    this.modal('Duplicate Scan', `
      <div class="amsl-duplicate-source"><span>Selected admission</span><strong>${this.escape(row.name)} · ${this.escape(row.admissionNo)}</strong><small>${this.escape(row.phone)} · ${this.escape(row.email || 'No email')} · ${this.escape(row.course)}</small></div>
      ${matches.length ? `<form id="ams-duplicate-form" data-source="${this.escape(key)}"><div class="amsl-duplicate-list">${matches.map(match => `<label><input type="checkbox" name="duplicate" value="${this.escape(match.key)}"><span><strong>${this.escape(match.name)} · ${this.escape(match.admissionNo)}</strong><small>${this.escape(match.phone)} · ${this.escape(match.email || 'No email')}</small><em>Matched admission identity or programme data</em></span></label>`).join('')}</div></form>` : '<div class="amsl-modal-empty">No matching duplicate admission records found.</div>'}`,
      `<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Close</button>${matches.length ? '<button type="button" class="amsl-btn secondary" id="ams-duplicate-merge">Merge Selected</button><button type="button" class="amsl-btn primary" id="ams-duplicate-archive">Archive Selected</button>' : ''}`,
      'wide'
    );
    if (!matches.length) return;
    document.getElementById('ams-duplicate-archive').addEventListener('click', () => this.completeDuplicate(key, false));
    document.getElementById('ams-duplicate-merge').addEventListener('click', () => this.completeDuplicate(key, true));
  },

  completeDuplicate(sourceKey, merge) {
    const ids = [...document.querySelectorAll('#ams-duplicate-form input[name="duplicate"]:checked')].map(input => input.value);
    if (!ids.length) return this.toast('Select duplicate admission records', 'warning');
    const source = this.row(sourceKey);
    ids.forEach(key => {
      const duplicate = this.row(key);
      if (!duplicate) return;
      if (merge) {
        const patch = this.store.overrides[sourceKey] || {};
        ['email', 'phone', 'city', 'course', 'batch', 'owner'].forEach(field => {
          if (!source[field] && duplicate[field]) patch[field] = duplicate[field];
        });
        this.store.overrides[sourceKey] = patch;
        this.store.activities[sourceKey] = [...(this.store.activities[sourceKey] || []), ...(this.store.activities[key] || [])];
      }
      this.store.archive[key] = {
        reason: 'duplicate',
        archivedAt: new Date().toISOString(),
        by: source.owner || 'Admission Desk',
        snapshot: duplicate,
        mergedInto: merge ? sourceKey : ''
      };
    });
    this.recordActivity(sourceKey, {
      title: merge ? 'Duplicate Records Merged' : 'Duplicate Records Archived',
      description: `${ids.length} duplicate admission record${ids.length === 1 ? '' : 's'} ${merge ? 'merged' : 'archived'}.`
    }, false);
    this.persist();
    this.closeDialog();
    window.AMSStudentList.render();
    this.toast(`${ids.length} duplicate record${ids.length === 1 ? '' : 's'} processed`, 'success');
  },

  showArchiveConfirm(keys, reason) {
    if (!keys?.length) return this.toast('Select admission records first', 'warning');
    const verb = reason === 'deleted' ? 'delete' : 'archive';
    this.confirmDialog(
      `${this.title(verb)} Admission Record${keys.length === 1 ? '' : 's'}`,
      `${keys.length} admission record${keys.length === 1 ? '' : 's'} will move to the AMS archive and can be restored later.`,
      this.title(verb),
      () => {
        keys.forEach(key => {
          const row = this.row(key);
          if (!row) return;
          this.store.archive[key] = {
            reason,
            archivedAt: new Date().toISOString(),
            by: row.owner || 'Admission Desk',
            snapshot: row
          };
        });
        this.persist();
        this.closeDialog();
        window.AMSStudentList.selected.clear();
        window.AMSStudentList.render();
        this.toast(`${keys.length} admission record${keys.length === 1 ? '' : 's'} moved to archive`, 'warning');
      },
      reason === 'deleted'
    );
  },

  showImport() {
    this.modal('Import Admission Students', `
      <form id="ams-import-form" class="amsl-form-grid single">
        <div class="amsl-import-guide"><strong>CSV columns</strong><span>name, phone, email, course, batch, owner, statusKey</span></div>
        <label class="full"><span>CSV File</span><input type="file" name="file" accept=".csv,text/csv"></label>
        <label class="full"><span>Or paste CSV data *</span><textarea name="csv" rows="8" placeholder="name,phone,email,course,batch,owner,statusKey&#10;Student Name,9876543210,student@example.com,UPSC Foundation,July Morning,Admission Desk,form_pending"></textarea></label>
      </form>`,
      `<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Cancel</button><button type="submit" form="ams-import-form" class="amsl-btn primary"><i class="fas fa-file-import"></i> Import</button>`
    );
    const form = document.getElementById('ams-import-form');
    form.elements.file.addEventListener('change', async () => {
      const file = form.elements.file.files[0];
      if (file) form.elements.csv.value = await file.text();
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const rows = this.parseCsv(form.elements.csv.value);
      if (!rows.length) return this.toast('Provide at least one valid admission row', 'warning');
      const now = new Date();
      rows.forEach((data, index) => {
        const id = `AMS-IMPORT-${Date.now()}-${index + 1}`;
        this.store.records.push({
          key: id,
          otrId: id,
          otrNo: `AMS-OTR-${now.getFullYear()}-${String(9000 + this.store.records.length + index + 1)}`,
          name: data.name || `Imported Student ${index + 1}`,
          phone: data.phone || '',
          email: data.email || '',
          course: data.course || 'Admission Programme',
          batch: data.batch || 'Pending Allocation',
          owner: data.owner || 'Admission Desk',
          statusKey: this.getStageByStatus(data.statusKey)?.statusText ? data.statusKey : 'form_pending',
          documents: '0/6 verified',
          sourceLeadNo: 'CSV Import',
          createdAt: now.toISOString(),
          total: 0,
          paid: 0
        });
      });
      this.persist();
      this.closeDialog();
      window.AMSStudentList.populateFilters();
      window.AMSStudentList.render();
      this.toast(`${rows.length} admission record${rows.length === 1 ? '' : 's'} imported`, 'success');
    });
  },

  parseCsv(text) {
    const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const split = line => {
      const values = [];
      let value = '';
      let quoted = false;
      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (char === '"' && line[index + 1] === '"') { value += '"'; index += 1; }
        else if (char === '"') quoted = !quoted;
        else if (char === ',' && !quoted) { values.push(value.trim()); value = ''; }
        else value += char;
      }
      values.push(value.trim());
      return values;
    };
    const headers = split(lines.shift()).map(header => header.toLowerCase().replace(/\s+/g, ''));
    return lines.map(line => {
      const values = split(line);
      return headers.reduce((record, header, index) => ({ ...record, [header]: values[index] || '' }), {});
    }).filter(record => record.name || record.phone || record.email);
  },

  printAdmission(key) {
    const row = this.row(key);
    if (!row) return;
    window.AMSAdmissionDrawer?.open?.(key);
    document.body.classList.add('amsl-printing');
    window.setTimeout(() => {
      window.print();
      document.body.classList.remove('amsl-printing');
    }, 100);
  },

  confirmDialog(title, message, confirmLabel, onConfirm, danger = false) {
    this.modal(title, `<div class="amsl-confirm"><i class="fas ${danger ? 'fa-triangle-exclamation' : 'fa-box-archive'}"></i><strong>${this.escape(title)}</strong><p>${this.escape(message)}</p></div>`,
      `<button type="button" class="amsl-btn secondary" data-ams-dialog-close>Cancel</button><button type="button" class="amsl-btn ${danger ? 'danger' : 'primary'}" id="ams-dialog-confirm">${this.escape(confirmLabel)}</button>`
    );
    document.getElementById('ams-dialog-confirm').addEventListener('click', onConfirm);
  },

  modal(title, body, footer = '', size = '') {
    this.closeDialog();
    const overlay = document.createElement('div');
    overlay.id = 'ams-ops-dialog';
    overlay.className = 'amsl-ops-overlay';
    overlay.innerHTML = `<div class="amsl-ops-dialog ${size}">
      <header><div><span>Admission Management System</span><h2>${this.escape(title)}</h2></div><button type="button" data-ams-dialog-close aria-label="Close"><i class="fas fa-times"></i></button></header>
      <div class="amsl-ops-body">${body}</div>
      ${footer ? `<footer>${footer}</footer>` : ''}
    </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('amsl-modal-open');
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('[data-ams-dialog-close]')) this.closeDialog();
    });
    overlay.querySelector('input:not([readonly]), select, textarea')?.focus();
  },

  sharedModal(title, body, footer = '') {
    this.closeDialog();
    const overlay = document.createElement('div');
    overlay.id = 'ams-ops-dialog';
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `<div class="custom-modal-card wide">
      <div class="custom-modal-header">
        <span class="custom-modal-title"><i class="fas fa-redo" style="color:var(--primary)"></i>${this.escape(title)}</span>
        <button type="button" class="custom-modal-close" data-ams-dialog-close aria-label="Close"><i class="fas fa-times"></i></button>
      </div>
      <div class="custom-modal-body">${body}</div>
      <div class="custom-modal-footer">${footer}</div>
    </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('amsl-modal-open');
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('[data-ams-dialog-close]')) this.closeDialog();
    });
    overlay.querySelector('input:not([readonly]), select, textarea')?.focus();
  },

  closeDialog() {
    document.getElementById('ams-ops-dialog')?.remove();
    document.body.classList.remove('amsl-modal-open');
  },

  toast(message, type = 'info') {
    let stack = document.getElementById('ams-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'ams-toast-stack';
      stack.className = 'amsl-toast-stack';
      document.body.appendChild(stack);
    }
    const toast = document.createElement('div');
    toast.className = `amsl-toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-circle-check' : type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i><span>${this.escape(message)}</span>`;
    stack.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3200);
  },

  detail(label, value) {
    return `<div><span>${this.escape(label)}</span><strong>${this.escape(value || '—')}</strong></div>`;
  },

  escape(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  },

  title(value) {
    return String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  },

  formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || 'Date unavailable';
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
};

window.AMSAdmissionOps = AMSAdmissionOps;

if (window.AMSStudentList) {
  const initStudentList = window.AMSStudentList.init.bind(window.AMSStudentList);
  window.AMSStudentList.init = function initWithAdmissionOperations() {
    AMSAdmissionOps.load();
    initStudentList();
    AMSAdmissionOps.init();
  };
}
