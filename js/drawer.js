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
    this.setupResize();
    window.addEventListener('resize', () => this.applyDrawerWidth());
  },

  setupActions() {
    document.getElementById('drawer-add-followup-btn')?.addEventListener('click', () => this.runLeadAction('followup'));
    document.getElementById('drawer-schedule-meeting-btn')?.addEventListener('click', () => this.runLeadAction('counselling'));
    document.getElementById('drawer-more-actions-btn')?.addEventListener('click', () => this.runLeadAction('changeclass'));
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
    const labels = {
      brochure: 'Brochure sent',
      fee: 'Fee structure shared',
      batch: 'Batch details shared',
      admission: 'Convert to Admission',
      counselling: 'Counselling action opened',
      note: 'Note added'
    };
    if (type === 'counselling') return this.runLeadAction('counselling');
    if (type === 'admission') {
      this.currentLead.status = 'admission_process';
      this.currentLead.statusLabel = 'Admission Process';
      this.currentLead.stage = 6;
    }
    LeadsModule.recordTimelineAction(this.currentLead, labels[type] || 'Quick Action', `${labels[type] || 'Quick action'} from drawer.`);
    LeadsModule.applyFilters();
    this.renderDrawer(this.currentLead);
    LeadsModule.showToast(labels[type] || 'Quick action completed', 'success');
  },

  open(id) {
    const lead = this.findLead(id);
    if (!lead) return;
    this.currentLead = lead;
    this.applyDrawerWidth();
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
      <span class="profile-contact-item"><i class="fab fa-whatsapp" style="color:var(--wa)"></i>${this.escapeHtml(lead.whatsapp)}</span>
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

    const stages = [
      'Inquiry Created',
      'Lead Assigned',
      'First Contact',
      'Follow-up',
      'Counselling',
      'Qualified Lead',
      'Admission Process Started',
      'Fee Paid',
      'Student Created'
    ];
    const stageDates = [
      lead.inquiryDate || '',
      lead.assignedDate || '',
      '12 May',
      lead.followupDate || '',
      '14 May',
      '',
      '',
      '',
      ''
    ];
    const iconForStage = ['fa-inbox', 'fa-user-check', 'fa-phone', 'fa-calendar-check', 'fa-comments', 'fa-certificate', 'fa-file-signature', 'fa-receipt', 'fa-graduation-cap'];
    const currentStage = Math.min(Math.max(Number(lead.stage || 0), 0), stages.length - 1);
    document.getElementById('drawer-pipeline').innerHTML = stages.map((s, i) => {
      const isCompleted = i < currentStage;
      const isActive = i === currentStage;
      return `
        ${i > 0 ? `<div class="stage-connector ${i <= currentStage ? 'done' : ''}"></div>` : ''}
        <div class="stage-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
          <div class="stage-circle">
            <i class="fas ${iconForStage[i]}"></i>
          </div>
          <span class="stage-label">${s}</span>
          ${stageDates[i] ? `<span class="stage-date">${stageDates[i]}</span>` : ''}
        </div>
      `;
    }).join('') + `
      <div class="journey-outcome-chips">
        <span class="alt-outcome-chip">Lost Lead</span>
        <span class="alt-outcome-chip">Closed Inquiry</span>
        <span class="alt-outcome-chip">Reopened Inquiry</span>
      </div>
    `;

    const infoRows = [
      { icon: 'fa-user', label: 'Full Name', value: lead.name },
      { icon: 'fa-phone', label: 'Mobile', value: lead.phone },
      { icon: 'fa-envelope', label: 'Email', value: lead.email },
      { icon: 'fa-location-dot', label: 'Pincode', value: lead.pincode || '-' },
      { icon: 'fa-map-marker-alt', label: 'City', value: lead.city },
      { icon: 'fa-book', label: 'Course Interested', value: lead.course },
      { icon: 'fa-laptop', label: 'Preferred Learning Mode', value: lead.mode },
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

    document.getElementById('drawer-followup-details').innerHTML = [
      { label: 'Follow-up Type', value: lead.followupType || 'Call' },
      { label: 'Status', value: `<span class="state-chip">${this.escapeHtml(lead.followupStatus || 'Scheduled')}</span>` },
      { label: 'Outcome', value: `<span class="outcome-chip">${this.escapeHtml(lead.followupOutcome || 'Pending')}</span>` },
      { label: 'Date', value: lead.followupDate || 'Not Set' },
      { label: 'Time', value: lead.followupTime || '-' },
      { label: 'Purpose / Remarks', value: lead.followupPurpose || 'Share details and check interest.' },
      { label: 'Followed By', value: `<div style="display:flex;align-items:center;gap:6px"><div class="owner-mini-avatar">${this.escapeHtml((lead.owner || 'B').charAt(0))}</div>${this.escapeHtml(lead.owner)}</div>` }
    ].map(r => `
      <div class="followup-detail-row">
        <div class="followup-detail-label">${this.escapeHtml(r.label)}</div>
        <div class="followup-detail-value">${r.value}</div>
      </div>
    `).join('');

    const counselling = lead.counselling;
    const counsellingEl = document.getElementById('drawer-counselling-history');
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
      ` : `
        <div class="comm-item">
          <div class="comm-icon tl-meeting"><i class="fas fa-comments"></i></div>
          <div class="comm-body">
            <div class="comm-title">No counselling session recorded</div>
            <div class="comm-desc">Schedule counselling to capture requirement, interest level, parent involvement, and next action.</div>
          </div>
        </div>
      `;
    }

    const notes = communications.filter(item => /note/i.test(item.title || '') || item.type === 'note').slice(0, 3);
    const notesEl = document.getElementById('drawer-internal-notes');
    if (notesEl) {
      notesEl.innerHTML = notes.length ? notes.map(note => `
        <div class="comm-item">
          <div class="comm-icon"><i class="fas fa-sticky-note"></i></div>
          <div class="comm-body">
            <div class="comm-title">${this.escapeHtml(note.title)}</div>
            <div class="comm-desc">${this.escapeHtml(note.desc)}</div>
            <div class="comm-meta"><span>By ${this.escapeHtml(note.by)}</span></div>
          </div>
          <div class="comm-time">${this.escapeHtml(note.time || '')}</div>
        </div>
      `).join('') : `
        <div class="comm-item">
          <div class="comm-icon"><i class="fas fa-sticky-note"></i></div>
          <div class="comm-body">
            <div class="comm-title">No internal notes yet</div>
            <div class="comm-desc">Staff-only notes will appear here for counsellor review.</div>
          </div>
        </div>
      `;
    }

    const priority = lead.priority || 'low';
    document.getElementById('drawer-score-value').textContent = lead.leadScore;
    document.getElementById('drawer-priority-value').textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
    document.getElementById('drawer-lead-age').textContent = lead.leadAge || '0 Days';
    const lastActEl = document.getElementById('drawer-last-activity');
    if (lastActEl) lastActEl.textContent = '15 May 2025\n10:20 AM';
    document.getElementById('drawer-assigned-on').textContent = lead.assignedDate || '-';

    document.getElementById('drawer-score-rows').innerHTML = [
      { label: 'Website Activity', val: 25, max: 25 },
      { label: 'Engagement', val: 20, max: 25 },
      { label: 'Profile Fit', val: 20, max: 25 },
      { label: 'Communication', val: Math.max(0, lead.leadScore - 65), max: 25 }
    ].map(s => `
      <div class="score-detail-row">
        <div class="score-detail-icon"><i class="fas fa-check"></i></div>
        <div class="score-detail-label">${this.escapeHtml(s.label)}</div>
        <div class="score-detail-value">${s.val}/${s.max}</div>
      </div>
    `).join('');
  }
};

window.DrawerModule = DrawerModule;
