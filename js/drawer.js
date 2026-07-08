// ============================================================
// DRAWER.JS - Lead Detail Drawer Module
// ============================================================

const DrawerModule = {
  currentLead: null,
  storageKey: 'pa-drawer-width',
  defaultWidth: 1120,
  minWidth: 760,
  maxWidth: 1360,
  resizeState: null,

  init() {
    document.getElementById('drawer-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('drawer-overlay')?.addEventListener('click', () => this.close());
    this.setupActions();
  },

  setupActions() {
    document.getElementById('drawer-add-followup-btn')?.addEventListener('click', () => this.runLeadAction('followup'));
    document.getElementById('drawer-schedule-meeting-btn')?.addEventListener('click', () => this.runLeadAction('counselling'));
    document.getElementById('drawer-edit-lead-btn')?.addEventListener('click', () => this.runLeadAction('edit'));
    document.getElementById('drawer-view-more-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentLead) DrawerModule.open(this.currentLead.id);
    });
    document.getElementById('drawer-view-history-btn')?.addEventListener('click', () => this.runLeadAction('history'));
    document.querySelectorAll('[data-drawer-activity]').forEach(btn => {
      btn.addEventListener('click', () => this.addActivity(btn.dataset.drawerActivity));
    });
    document.querySelectorAll('[data-drawer-quick]').forEach(btn => {
      btn.addEventListener('click', () => this.quickAction(btn.dataset.drawerQuick));
    });
    document.getElementById('drawer-mark-lost-btn')?.addEventListener('click', () => this.runLeadAction('lost'));
  },

  runLeadAction(action) {
    if (!this.currentLead) return;
    const permissionByAction = {
      edit: 'edit',
      followup: 'followup',
      counselling: 'followup',
      changeclass: 'status',
      lost: 'markLost',
      history: 'view'
    };
    const required = permissionByAction[action];
    if (required && !AuthModule.can('inquiryDetails', required)) {
      LeadsModule.showToast('This action is not available for the current role.', 'warning');
      return;
    }
    if (action === 'history') {
      LeadsModule.showFollowupHistory(this.currentLead.id);
      return;
    }
    LeadsModule.action(action, this.currentLead.id);
    if (['edit', 'followup', 'counselling', 'changeclass'].includes(action)) return;
    const refreshed = this.findLead(this.currentLead.id);
    if (refreshed) this.renderDrawer(refreshed);
  },

  addActivity(type) {
    if (!this.currentLead) return;
    if (type === 'call') {
      DialerModule.open(this.currentLead.id);
      return;
    } else if (type === 'whatsapp') {
      LeadsModule.whatsapp(this.currentLead.id);
    } else if (type === 'email') {
      LeadsModule.email(this.currentLead.id);
    } else if (type === 'meeting') {
      LeadsModule.showCounsellingModal(this.currentLead.id);
      return;
    } else {
      LeadsModule.showManageFollowup(this.currentLead.id);
      return;
    }
    LeadsModule.applyFilters();
    this.renderDrawer(this.currentLead);
  },

  quickAction(type) {
    if (!this.currentLead) return;
    const permissionByType = {};
    const required = permissionByType[type];
    if (required && !AuthModule.can('inquiryDetails', required)) {
      LeadsModule.showToast('This action is not available for the current role.', 'warning');
      return;
    }
    const labels = {
      brochure: 'Brochure sent',
      course: 'Course details shared',
      'edit-buttons': 'Quick action button editor opened'
    };
    if (type === 'edit-buttons') {
      this.showQuickActionButtonForm();
      return;
    }
    LeadsModule.recordTimelineAction(this.currentLead, labels[type] || 'Quick Action', `${labels[type] || 'Quick action'} from drawer.`);
    LeadsModule.applyFilters();
    this.renderDrawer(this.currentLead);
    LeadsModule.showToast(labels[type] || 'Quick action completed', 'success');
  },

  open(id) {
    const lead = this.findLead(id);
    if (!lead) return;
    if (!AuthModule.isInScope(lead)) {
      LeadsModule.showToast('This inquiry is outside the current role scope.', 'warning');
      return;
    }
    this.currentLead = lead;
    this.renderDrawer(lead);
    document.getElementById('drawer-overlay')?.classList.add('open');
    document.getElementById('lead-drawer')?.classList.add('open');
  },

  close() {
    document.getElementById('drawer-overlay')?.classList.remove('open');
    document.getElementById('lead-drawer')?.classList.remove('open');
    this.currentLead = null;
  },

  findLead(id) {
    const numericId = Number(id);
    const liveLeadsModule = typeof LeadsModule !== 'undefined' ? LeadsModule : window.LeadsModule;
    const leadSources = [
      liveLeadsModule?.leads,
      liveLeadsModule?.filteredLeads,
      window.APP_DATA?.LEAD_DATA
    ];
    for (const source of leadSources) {
      if (!Array.isArray(source)) continue;
      const lead = source.find(item => Number(item.id) === numericId);
      if (lead) return lead;
    }
    return null;
  },

  escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[ch]);
  },

  getTrackingData(lead) {
    const clean = (value, fallback) => (value && value !== '-' ? value : fallback);
    const isInquiry = lead.source === 'Inquiry Form' || lead.source === 'Public Inquiry Form';
    const fallback = {
      source: clean(lead.source, isInquiry ? 'Inquiry Form' : 'CRM'),
      medium: clean(lead.medium, isInquiry ? 'inquiry_form' : 'crm'),
      campaign: clean(lead.campaign, lead.course || 'direct_inquiry'),
      content: clean(lead.content, 'lead_capture'),
      term: clean(lead.term, lead.pincode || '-'),
      landingPage: clean(lead.landingPage, isInquiry ? 'inquiry-form.html' : 'lead-details'),
      referrer: clean(lead.referrer, 'Pramukh Academy CRM')
    };
    return { ...fallback, ...(lead.utm || {}) };
  },

  getLeadSegmentName(lead) {
    const segment = window.APP_DATA?.SEGMENT_DATA?.find(item => item.leadIds?.includes(lead.id) && !item.archived);
    return segment?.name || '';
  },

  renderOriginCard(lead) {
    const utm = this.getTrackingData(lead);
    const steps = [
      { label: 'Source', value: utm.source },
      { label: 'Medium', value: utm.medium },
      { label: 'Campaign', value: utm.campaign },
      { label: 'Content', value: utm.content },
      { label: 'Term', value: utm.term },
      { label: 'Landing', value: utm.landingPage },
      { label: 'Referrer', value: utm.referrer }
    ];

    return `
      <div class="drawer-origin-head">
        <div>
          <div class="drawer-card-title"><i class="fas fa-route"></i> Inquiry Origin</div>
          <div class="drawer-origin-subtitle">Tracking trail captured with the lead.</div>
        </div>
        <span class="drawer-origin-badge">UTM</span>
      </div>
      <div class="origin-path">
        ${steps.map((step, index) => `
          <div class="origin-step ${index === 0 ? 'origin-step--accent' : ''}">
            <span class="origin-step-label">${this.escapeHtml(step.label)}</span>
            <strong class="origin-step-value">${this.escapeHtml(step.value)}</strong>
          </div>
        `).join('')}
      </div>
    `;
  },

  buildJourneyHtml(lead) {
    const stages = [
      'Inquiry Created',
      'Lead Assigned',
      'First Contact',
      'Follow-up',
      'Counselling',
      'Qualified Lead',
      'Admission Form Started',
      'Fee Paid',
      'Student Created'
    ];
    const stageDates = [
      lead.inquiryDate || '',
      lead.assignedDate || '',
      '12 May',
      lead.followupDate || '',
      lead.counselling?.date || '',
      '',
      '',
      '',
      ''
    ];
    const iconForStage = ['fa-inbox', 'fa-user-check', 'fa-phone', 'fa-calendar-check', 'fa-comments', 'fa-certificate', 'fa-file-signature', 'fa-receipt', 'fa-graduation-cap'];
    const currentStage = Math.min(Math.max(Number(lead.stage || 0), 0), stages.length - 1);
    return `
      <div class="stage-pipeline-card inquiry-journey-card">
        <div class="drawer-card-header">
          <div class="drawer-card-title"><i class="fas fa-route"></i> Lead Journey</div>
        </div>
        <div style="padding: 12px 20px">
          <div class="stage-pipeline">
            ${stages.map((stage, index) => {
              const isCompleted = index < currentStage;
              const isActive = index === currentStage;
              return `
                ${index > 0 ? `<div class="stage-connector ${index <= currentStage ? 'done' : ''}"></div>` : ''}
                <div class="stage-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                  <div class="stage-circle"><i class="fas ${iconForStage[index]}"></i></div>
                  <span class="stage-label">${this.escapeHtml(stage)}</span>
                  ${stageDates[index] ? `<span class="stage-date">${this.escapeHtml(stageDates[index])}</span>` : ''}
                </div>
              `;
            }).join('')}
            <div class="journey-outcome-chips">
              <span class="alt-outcome-chip">Lost Lead</span>
              <span class="alt-outcome-chip">Closed Inquiry</span>
              <span class="alt-outcome-chip">Reopened Inquiry</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  showQuickActionButtonForm() {
    if (!this.currentLead) return;
    document.getElementById('quick-action-button-overlay')?.remove();
    const leadId = this.currentLead.id;
    const overlay = document.createElement('div');
    overlay.id = 'quick-action-button-overlay';
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card wide quick-button-modal">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas fa-sliders-h" style="color:var(--primary)"></i> Create Quick Action Button</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <form id="quick-button-form" onsubmit="event.preventDefault(); DrawerModule.saveQuickActionButton(${leadId})">
          <div class="custom-modal-body quick-button-form-body">
            <div class="form-grid cols-2">
              <div class="form-field">
                <label>Button Name</label>
                <input id="quick-button-name" type="text" placeholder="eg, Share demo class" required>
              </div>
              <div class="form-field">
                <label>Action Type</label>
                <select id="quick-button-action" required>
                  <option value="message">Message</option>
                  <option value="link">Open Link</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div class="form-field">
                <label>Icon</label>
                <select id="quick-button-icon">
                  <option value="fa-paper-plane">Paper Plane</option>
                  <option value="fa-book-open">Course</option>
                  <option value="fa-calendar-check">Calendar</option>
                  <option value="fa-link">Link</option>
                </select>
              </div>
              <div class="form-field">
                <label>Button Color</label>
                <select id="quick-button-color">
                  <option value="primary">Primary</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <div class="form-field span-2">
                <label>Message / Link</label>
                <textarea id="quick-button-payload" rows="4" placeholder="Enter button message, URL, or action notes"></textarea>
              </div>
            </div>
          </div>
          <div class="custom-modal-footer">
            <button class="btn btn-outline btn-sm" type="button" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
            <button class="btn btn-primary btn-sm" type="submit"><i class="fas fa-save"></i> Save Button</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveQuickActionButton(id) {
    const lead = this.findLead(id);
    if (!lead) return;
    const name = document.getElementById('quick-button-name')?.value?.trim();
    if (!name) {
      LeadsModule.showToast('Enter a button name.', 'warning');
      return;
    }
    const action = document.getElementById('quick-button-action')?.value || 'message';
    const icon = document.getElementById('quick-button-icon')?.value || 'fa-paper-plane';
    const color = document.getElementById('quick-button-color')?.value || 'primary';
    const payload = document.getElementById('quick-button-payload')?.value?.trim() || '';
    lead.quickActionDrafts = [
      ...(Array.isArray(lead.quickActionDrafts) ? lead.quickActionDrafts : []),
      { name, action, icon, color, payload, createdAt: new Date().toISOString() }
    ];
    LeadsModule.recordTimelineAction(lead, 'Quick Action Button Created', `${name} quick action button created.`);
    LeadsModule.applyFilters();
    document.getElementById('quick-action-button-overlay')?.remove();
    this.renderDrawer(lead);
    LeadsModule.showToast('Quick action button saved.', 'success');
  },

  setupResize() {
    const handle = document.getElementById('drawer-resize-handle');
    const drawer = document.getElementById('lead-drawer');
    if (!handle || !drawer) return;

    const stopDrag = () => {
      if (!this.resizeState) return;
      document.body.classList.remove('drawer-resizing');
      this.resizeState = null;
      this.saveDrawerWidth(this.getDrawerWidth());
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };

    const moveHandler = (event) => {
      if (!this.resizeState) return;
      const delta = this.resizeState.startX - event.clientX;
      const nextWidth = this.clampWidth(this.resizeState.startWidth + delta);
      this.setDrawerWidth(nextWidth);
    };

    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      this.resizeState = {
        startX: event.clientX,
        startWidth: this.getDrawerWidth()
      };
      document.body.classList.add('drawer-resizing');
      window.addEventListener('pointermove', moveHandler);
      window.addEventListener('pointerup', stopDrag);
      window.addEventListener('pointercancel', stopDrag);
    });
  },

  getDrawerWidth() {
    const drawer = document.getElementById('lead-drawer');
    const parsed = Number.parseFloat(drawer?.style.width || '');
    if (Number.isFinite(parsed)) return parsed;
    const saved = Number.parseFloat(localStorage.getItem(this.storageKey) || '');
    if (Number.isFinite(saved)) return saved;
    return this.defaultWidth;
  },

  clampWidth(width) {
    const viewportMax = Math.max(420, window.innerWidth - 24);
    const maxWidth = Math.min(this.maxWidth, viewportMax);
    const minWidth = Math.min(this.minWidth, maxWidth);
    return Math.max(minWidth, Math.min(maxWidth, width));
  },

  setDrawerWidth(width) {
    const drawer = document.getElementById('lead-drawer');
    if (!drawer) return;
    drawer.style.width = `${this.clampWidth(width)}px`;
  },

  saveDrawerWidth(width) {
    try {
      localStorage.setItem(this.storageKey, String(this.clampWidth(width)));
    } catch (e) {
      // ignore storage failures
    }
  },

  applyDrawerWidth() {
    const drawer = document.getElementById('lead-drawer');
    if (!drawer) return;
    const width = this.getDrawerWidth();
    this.setDrawerWidth(width);
  },

  renderDrawer(lead) {
    document.getElementById('drawer-enq-id').textContent = lead.enqNo;
    const statusPill = document.getElementById('drawer-status-pill');
    statusPill.textContent = lead.statusLabel;
    statusPill.className = `drawer-status-pill badge status-${lead.status}`;

    document.getElementById('drawer-avatar-letter').textContent = lead.name.charAt(0);
    document.getElementById('drawer-lead-name').textContent = lead.name;
    document.getElementById('drawer-enq-id-2').textContent = lead.enqNo;

    document.getElementById('drawer-profile-tags').innerHTML = `
      <span class="badge badge-success">${this.escapeHtml(lead.statusLabel)}</span>
      ${lead.isHot ? '<span class="badge badge-danger">Hot Lead</span>' : ''}
    `;

    document.getElementById('drawer-contacts').innerHTML = `
      <span class="profile-contact-item"><i class="fas fa-phone"></i>${this.escapeHtml(lead.phone)}</span>
      <span class="profile-contact-item"><i class="fas fa-envelope" style="color:var(--primary)"></i>${this.escapeHtml(lead.email)}</span>
    `;

    document.getElementById('drawer-profile-meta').innerHTML = `
      <div class="profile-meta-item"><div class="profile-meta-label">Course</div><div class="profile-meta-value">${this.escapeHtml(lead.course)}</div></div>
      <div class="profile-meta-item"><div class="profile-meta-label">Inquiry Source</div><div class="profile-meta-value">${this.escapeHtml(lead.source)}</div></div>
      <div class="profile-meta-item"><div class="profile-meta-label">Campaign</div><div class="profile-meta-value">${this.escapeHtml(lead.campaign || '-')}</div></div>
      <div class="profile-meta-item"><div class="profile-meta-label">Inquiry Date</div><div class="profile-meta-value">${this.escapeHtml(lead.inquiryDate)}</div></div>
      <div class="profile-meta-item">
        <div class="profile-meta-label">Current Owner</div>
        <div class="profile-meta-value profile-meta-owner">
          <div class="owner-mini-avatar">${this.escapeHtml((lead.owner || 'B').charAt(0))}</div>${this.escapeHtml(lead.owner)}
        </div>
      </div>
    `;

    const infoRows = [
      { icon: 'fa-user', label: 'Full Name', value: lead.name },
      { icon: 'fa-phone', label: 'Mobile', value: lead.phone },
      { icon: 'fa-envelope', label: 'Email', value: lead.email },
      { icon: 'fa-map', label: 'State', value: lead.state || (lead.city || '').split(',')[1]?.trim() || 'Gujarat' },
      { icon: 'fa-map-marker-alt', label: 'District', value: lead.district || (lead.city || '').split(',')[0]?.trim() || '-' },
      { icon: 'fa-book', label: 'Inquiry For', value: lead.course },
      { icon: 'fa-layer-group', label: 'Batch Selection', value: lead.batch || '-' },
      { icon: 'fa-laptop', label: 'Mode Of Learning', value: lead.mode || '-' },
      { icon: 'fa-graduation-cap', label: 'Academic Status', value: lead.academicStatus },
      { icon: 'fa-layer-group', label: 'Lead Segment', value: lead.segment || this.getLeadSegmentName?.(lead) || '-' },
      { icon: 'fa-user-check', label: 'Current Owner', value: lead.owner || lead.assignedTo || '-' },
      { icon: 'fa-question-circle', label: 'Specific Query', value: lead.query || '-' }
    ];

    document.getElementById('drawer-info-list').innerHTML = infoRows.map(r => `
      <div class="info-row">
        <div class="info-icon"><i class="fas ${r.icon}"></i></div>
        <div class="info-label">${this.escapeHtml(r.label)}</div>
        <div class="info-value">${this.escapeHtml(r.value)}</div>
      </div>
    `).join('');

    const originCard = document.getElementById('drawer-origin-card');
    if (originCard) originCard.innerHTML = this.renderOriginCard(lead);

    const commBg = { call: 'var(--info-light)', whatsapp: 'var(--wa-light)', email: 'var(--primary-light)', meeting: 'var(--warning-light)' };
    const commTypes = {
      call: { icon: 'fa-phone', cls: 'tl-call', prefix: 'fas', col: 'var(--info-strong)' },
      whatsapp: { icon: 'fa-whatsapp', cls: 'tl-whatsapp', prefix: 'fab', col: 'var(--wa)' },
      email: { icon: 'fa-envelope', cls: 'tl-email', prefix: 'fas', col: 'var(--primary)' },
      meeting: { icon: 'fa-handshake', cls: 'tl-meeting', prefix: 'fas', col: 'var(--warning)' }
    };

    const communications = Array.isArray(lead.communications) ? lead.communications : [];
    document.getElementById('drawer-comm-list').innerHTML = communications.length > 0
      ? communications.map(c => {
          const ct = commTypes[c.type] || commTypes.call;
          const bg = commBg[c.type] || 'var(--neutral-light)';
          return `
            <div class="comm-item">
              <div class="comm-date-badge">
                <span class="comm-day">${this.escapeHtml(c.day)}</span>
                <span class="comm-month">${this.escapeHtml(c.month)}</span>
              </div>
              <div class="comm-icon ${ct.cls}" style="background:${bg}">
                <i class="${ct.prefix} ${ct.icon}" style="color:${ct.col}"></i>
              </div>
              <div class="comm-body">
                <div class="comm-title">${this.escapeHtml(c.title)}</div>
                <div class="comm-desc">${this.escapeHtml(c.desc)}</div>
                <div class="comm-meta"><span>By ${this.escapeHtml(c.by)}</span></div>
              </div>
              <div class="comm-time">${this.escapeHtml(c.time)}</div>
            </div>
          `;
        }).join('')
      : '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:12px"><i class="fas fa-inbox" style="font-size:24px;opacity:0.3;display:block;margin-bottom:8px"></i>No activity yet</div>';

    const counselling = lead.counselling;
    const counsellingCard = document.getElementById('drawer-counselling-card');
    const counsellingEl = document.getElementById('drawer-counselling-history');
    if (counsellingCard) counsellingCard.style.display = counselling ? '' : 'none';
    if (counsellingEl) {
      counsellingEl.innerHTML = counselling ? `
        <div class="comm-item">
          <div class="comm-icon tl-meeting"><i class="fas fa-comments"></i></div>
          <div class="comm-body">
            <div class="comm-title">Counselling Session - ${this.escapeHtml(counselling.interest)}</div>
            <div class="comm-desc">${this.escapeHtml(counselling.summary || counselling.requirement || 'Discussion summary recorded.')}</div>
            <div class="comm-meta"><span>${this.escapeHtml(counselling.mode)}</span><span>Parent: ${this.escapeHtml(counselling.parentInvolvement || 'Not Required')}</span></div>
          </div>
          <div class="comm-time">${this.escapeHtml(counselling.time || '')}</div>
        </div>
      ` : '';
    }
    this.applyPermissionState(lead);
  },

  applyPermissionState(lead) {
    const setVisible = (id, visible) => {
      const el = document.getElementById(id);
      if (el) el.style.display = visible ? '' : 'none';
    };
    setVisible('drawer-add-followup-btn', AuthModule.can('inquiryDetails', 'followup'));
    setVisible('drawer-schedule-meeting-btn', Boolean(lead.counselling) && AuthModule.can('inquiryDetails', 'followup'));
    setVisible('drawer-edit-lead-btn', AuthModule.can('inquiryDetails', 'edit'));
    setVisible('drawer-mark-lost-btn', AuthModule.can('inquiryDetails', 'markLost'));
    document.querySelectorAll('[data-drawer-quick]').forEach(btn => {
      btn.classList.remove('is-disabled');
      btn.title = '';
    });
  }
};

window.DrawerModule = DrawerModule;
