// ============================================================
// DIALER.JS - In-app caller session for LMS leads
// ============================================================

const DialerModule = {
  currentLead: null,
  currentIndex: -1,
  callState: 'ready',
  callSession: null,
  elapsedSeconds: 0,
  timerId: null,
  selectedOutcome: '',
  queue: [],

  init() {
    this.ensureDialer();
  },

  getLeadSource() {
    if (window.LeadsModule?.filteredLeads?.length) return window.LeadsModule.filteredLeads;
    if (window.LeadsModule?.leads?.length) return window.LeadsModule.leads;
    return window.APP_DATA?.LEAD_DATA || [];
  },

  findLead(leadId) {
    const id = Number(leadId);
    return this.getLeadSource().find(lead => Number(lead.id) === id)
      || window.APP_DATA?.LEAD_DATA?.find(lead => Number(lead.id) === id)
      || null;
  },

  normalizePhone(value = '') {
    return String(value).replace(/[^\d+]/g, '');
  },

  getInitials(name = '') {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'NA';
    return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
  },

  ensureDialer() {
    if (document.getElementById('lms-dialer-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'lms-dialer-overlay';
    overlay.className = 'lms-dialer-overlay';
    overlay.innerHTML = `
      <section class="lms-dialer" role="dialog" aria-modal="true" aria-labelledby="dialer-lead-name">
        <div class="dialer-session-bar">
          <span>Calling Session</span>
          <div class="dialer-progress"><span id="dialer-progress-fill"></span></div>
          <strong id="dialer-session-count">1 / 1</strong>
          <button type="button" class="dialer-settings-btn" aria-label="Call provider settings" onclick="DialerModule.showSettings()"><i class="fas fa-gear"></i></button>
          <button type="button" class="dialer-close" aria-label="Close dialer" onclick="DialerModule.close()"><i class="fas fa-times"></i></button>
        </div>

        <div class="dialer-main">
          <div class="dialer-avatar" id="dialer-avatar">NA</div>
          <h2 id="dialer-lead-name">Lead Name</h2>
          <div class="dialer-phone" id="dialer-phone">-</div>
          <div class="dialer-tags">
            <span id="dialer-course">Course</span>
            <span><i class="fas fa-folder"></i> Voicecall Enquiry</span>
          </div>
          <div class="dialer-provider" id="dialer-provider">Provider: Local session</div>

          <button type="button" class="dialer-call-btn" id="dialer-call-btn" onclick="DialerModule.toggleCall()">
            <i class="fas fa-phone"></i>
          </button>
          <div class="dialer-state" id="dialer-state">Tap to call</div>
          <div class="dialer-timer" id="dialer-timer">00:00</div>

          <div class="dialer-panel">
            <div class="dialer-panel-label">Call Outcome</div>
            <div class="dialer-outcomes" id="dialer-outcomes"></div>
            <textarea id="dialer-note" class="dialer-note" placeholder="Quick note (optional)..."></textarea>
            <div class="dialer-footer-actions">
              <button type="button" class="dialer-secondary" onclick="DialerModule.skipLead()"><i class="fas fa-forward"></i> Skip</button>
              <button type="button" class="dialer-primary" onclick="DialerModule.saveAndNext()"><i class="fas fa-check"></i> Save & Next</button>
            </div>
            <button type="button" class="dialer-whatsapp" onclick="DialerModule.sendWhatsApp()"><i class="fab fa-whatsapp"></i> Send WhatsApp Message</button>
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) this.close();
    });
    this.renderOutcomes();
    this.ensureSettingsModal();
  },

  ensureSettingsModal() {
    if (document.getElementById('dialer-settings-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'dialer-settings-modal';
    modal.className = 'dialer-settings-modal';
    modal.innerHTML = `
      <div class="dialer-settings-card">
        <div class="dialer-settings-head">
          <div>
            <div class="dialer-settings-title"><i class="fas fa-phone-volume"></i> Call Provider Setup</div>
            <div class="dialer-settings-subtitle">Connect the LMS dialer to your live calling provider.</div>
          </div>
          <button type="button" class="dialer-settings-close" onclick="DialerModule.hideSettings()"><i class="fas fa-times"></i></button>
        </div>
        <div class="dialer-settings-body">
          <label>
            Provider Name
            <input id="call-provider-name" type="text" placeholder="Twilio, Exotel, Knowlarity, SIP Gateway">
          </label>
          <label>
            Call API Endpoint
            <input id="call-provider-endpoint" type="url" placeholder="https://your-domain.example/api/lms-call">
          </label>
          <label>
            API Token
            <input id="call-provider-token" type="password" placeholder="Bearer token or secure API token">
          </label>
          <label>
            Agent Phone / Extension
            <input id="call-provider-agent" type="text" placeholder="+919999999999 or agent extension">
          </label>
          <div class="dialer-settings-status" id="call-provider-status">No live endpoint configured yet.</div>
        </div>
        <div class="dialer-settings-actions">
          <button type="button" class="dialer-secondary compact" onclick="DialerModule.clearSettings()">Clear</button>
          <button type="button" class="dialer-secondary compact" onclick="DialerModule.testSettings()">Test</button>
          <button type="button" class="dialer-primary compact" onclick="DialerModule.saveSettings()">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target === modal) this.hideSettings();
    });
  },

  renderOutcomes() {
    const outcomes = [
      { key: 'Called', icon: 'fa-phone' },
      { key: 'Interested', icon: 'fa-thumbs-up' },
      { key: 'Not Interested', icon: 'fa-thumbs-down' },
      { key: 'Registered', icon: 'fa-check-circle' },
      { key: 'Callback', icon: 'fa-rotate-right' },
      { key: 'No Answer', icon: 'fa-phone-slash' },
      { key: 'Wrong No.', icon: 'fa-circle-xmark' },
      { key: 'Skip', icon: 'fa-clock' }
    ];
    const container = document.getElementById('dialer-outcomes');
    if (!container) return;
    container.innerHTML = outcomes.map(item => `
      <button type="button" class="dialer-outcome" data-outcome="${item.key}" onclick="DialerModule.selectOutcome('${item.key}')">
        <i class="fas ${item.icon}"></i>
        <span>${item.key}</span>
      </button>
    `).join('');
  },

  open(leadId = null, queueIds = null) {
    this.ensureDialer();
    const source = this.getLeadSource().filter(lead => !lead.archived);
    const lead = leadId ? this.findLead(leadId) : source[0];
    if (!lead) {
      window.LeadsModule?.showToast?.('No lead found for dialing', 'warning');
      return;
    }

    this.queue = Array.isArray(queueIds) && queueIds.length
      ? queueIds.map(id => this.findLead(id)).filter(Boolean)
      : source;
    this.currentIndex = Math.max(0, this.queue.findIndex(item => Number(item.id) === Number(lead.id)));
    if (this.currentIndex === -1) {
      this.queue.unshift(lead);
      this.currentIndex = 0;
    }
    this.loadLead(this.queue[this.currentIndex]);
    document.getElementById('lms-dialer-overlay')?.classList.add('open');
  },

  loadLead(lead) {
    this.stopTimer();
    this.currentLead = lead;
    this.callState = 'ready';
    this.callSession = null;
    this.elapsedSeconds = 0;
    this.selectedOutcome = '';

    document.getElementById('dialer-avatar').textContent = this.getInitials(lead.name);
    document.getElementById('dialer-lead-name').textContent = lead.name;
    document.getElementById('dialer-phone').textContent = this.normalizePhone(lead.phone || lead.whatsapp) || '-';
    document.getElementById('dialer-course').textContent = lead.course || 'Inquiry';
    document.getElementById('dialer-note').value = '';
    document.getElementById('dialer-timer').textContent = '00:00';
    document.getElementById('dialer-state').textContent = 'Tap to call';
    document.getElementById('dialer-provider').textContent = CallBridge.getProviderLabel();
    document.getElementById('dialer-call-btn').classList.remove('calling');
    document.getElementById('dialer-call-btn').classList.remove('connecting');
    document.getElementById('dialer-call-btn').innerHTML = '<i class="fas fa-phone"></i>';
    document.getElementById('dialer-session-count').textContent = `${this.currentIndex + 1} / ${this.queue.length}`;
    const pct = this.queue.length ? ((this.currentIndex + 1) / this.queue.length) * 100 : 100;
    document.getElementById('dialer-progress-fill').style.width = `${pct}%`;
    document.querySelectorAll('.dialer-outcome').forEach(btn => btn.classList.remove('selected'));
  },

  toggleCall() {
    if (!this.currentLead) return;
    if (this.callState === 'calling') {
      this.endCall();
    } else {
      this.startCall();
    }
  },

  async startCall() {
    if (!this.currentLead) return;
    this.callState = 'connecting';
    this.elapsedSeconds = 0;
    const callBtn = document.getElementById('dialer-call-btn');
    callBtn.classList.add('connecting');
    callBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    document.getElementById('dialer-state').textContent = `Connecting ${this.currentLead.name} from LMS`;

    try {
      const session = await CallBridge.startCall(this.currentLead);
      this.callSession = session;
      this.callState = 'calling';
      callBtn.classList.remove('connecting');
      callBtn.classList.add('calling');
      callBtn.innerHTML = '<i class="fas fa-phone-slash"></i>';
      document.getElementById('dialer-state').textContent = session.demo
        ? `Local call session active for ${this.currentLead.name}`
        : `Live call connected through ${session.provider}`;
      this.record('Voice Call Started', `In-app dialer started for ${this.normalizePhone(this.currentLead.phone)}. Session: ${session.sessionId}.`);
      this.timerId = window.setInterval(() => {
        this.elapsedSeconds += 1;
        document.getElementById('dialer-timer').textContent = this.formatDuration(this.elapsedSeconds);
      }, 1000);
    } catch (error) {
      this.callState = 'ready';
      callBtn.classList.remove('connecting');
      callBtn.innerHTML = '<i class="fas fa-phone"></i>';
      document.getElementById('dialer-state').textContent = error.message || 'Unable to start call';
      window.LeadsModule?.showToast?.(error.message || 'Unable to start call', 'danger');
    }
  },

  async endCall() {
    this.stopTimer();
    try {
      await CallBridge.endCall(this.callSession);
    } catch (error) {
      window.LeadsModule?.showToast?.('Call ended locally; provider did not confirm hangup.', 'warning');
    }
    this.callState = 'ended';
    this.callSession = null;
    document.getElementById('dialer-state').textContent = 'Call ended. Select outcome.';
    document.getElementById('dialer-call-btn').classList.remove('calling');
    document.getElementById('dialer-call-btn').classList.remove('connecting');
    document.getElementById('dialer-call-btn').innerHTML = '<i class="fas fa-phone"></i>';
    this.record('Voice Call Ended', `Duration ${this.formatDuration(this.elapsedSeconds)}.`);
  },

  stopTimer() {
    if (this.timerId) window.clearInterval(this.timerId);
    this.timerId = null;
  },

  formatDuration(totalSeconds) {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  },

  selectOutcome(outcome) {
    this.selectedOutcome = outcome;
    document.querySelectorAll('.dialer-outcome').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.outcome === outcome);
    });
  },

  saveAndNext() {
    if (!this.currentLead) return;
    if (this.callState === 'calling') this.endCall();
    const outcome = this.selectedOutcome || 'Called';
    const note = document.getElementById('dialer-note')?.value.trim() || 'No note added.';
    this.applyOutcome(outcome, note);
    this.nextLead();
  },

  skipLead() {
    if (!this.currentLead) return;
    if (this.callState === 'calling') this.endCall();
    this.applyOutcome('Skip', document.getElementById('dialer-note')?.value.trim() || 'Skipped from calling session.');
    this.nextLead();
  },

  applyOutcome(outcome, note) {
    const lead = this.currentLead;
    lead.lastCallOutcome = outcome;
    lead.lastCallNote = note;
    lead.lastCallDuration = this.formatDuration(this.elapsedSeconds);
    lead.followupType = 'Voice Call';
    lead.followupStatus = outcome;

    if (outcome === 'Interested') {
      lead.status = 'interested';
      lead.statusLabel = 'Interested';
      lead.priority = 'high';
    } else if (outcome === 'Not Interested') {
      lead.status = 'lost';
      lead.statusLabel = 'Lost';
    } else if (outcome === 'Registered') {
      lead.status = 'admission_confirmed';
      lead.statusLabel = 'Admission Confirmed';
      lead.stage = 4;
      lead.stageLabel = 'Admission';
    } else if (outcome === 'Callback' || outcome === 'No Answer') {
      lead.status = 'followup';
      lead.statusLabel = 'Follow-up';
    }

    this.record(`Call Outcome: ${outcome}`, `${note} Duration: ${this.formatDuration(this.elapsedSeconds)}.`);
    window.LeadsModule?.syncAppDataLeads?.();
    window.LeadsModule?.applyFilters?.();
    window.LeadsModule?.updateStatusBarCounts?.();
  },

  record(title, desc) {
    if (!this.currentLead) return;
    window.LeadsModule?.recordTimelineAction?.(this.currentLead, title, desc);
  },

  nextLead() {
    if (this.currentIndex + 1 < this.queue.length) {
      this.currentIndex += 1;
      this.loadLead(this.queue[this.currentIndex]);
      window.LeadsModule?.showToast?.('Call saved. Next lead loaded.', 'success');
    } else {
      window.LeadsModule?.showToast?.('Calling session completed.', 'success');
      this.close();
    }
  },

  sendWhatsApp() {
    if (!this.currentLead) return;
    window.LeadsModule?.whatsapp?.(this.currentLead.id);
  },

  showSettings() {
    this.ensureSettingsModal();
    const config = CallBridge.getConfig();
    document.getElementById('call-provider-name').value = config.provider === 'Local Session' ? '' : config.provider;
    document.getElementById('call-provider-endpoint').value = config.endpoint || '';
    document.getElementById('call-provider-token').value = config.token || '';
    document.getElementById('call-provider-agent').value = config.agentNumber || '';
    this.updateSettingsStatus();
    document.getElementById('dialer-settings-modal')?.classList.add('open');
  },

  hideSettings() {
    document.getElementById('dialer-settings-modal')?.classList.remove('open');
  },

  saveSettings() {
    const provider = document.getElementById('call-provider-name')?.value.trim() || 'Live Provider';
    const endpoint = document.getElementById('call-provider-endpoint')?.value.trim() || '';
    const token = document.getElementById('call-provider-token')?.value.trim() || '';
    const agent = document.getElementById('call-provider-agent')?.value.trim() || '';
    if (endpoint && !/^https?:\/\//i.test(endpoint)) {
      this.setSettingsStatus('Endpoint must start with http:// or https://', true);
      return;
    }
    localStorage.setItem('pa-call-provider', provider);
    localStorage.setItem('pa-call-api-endpoint', endpoint);
    localStorage.setItem('pa-call-api-token', token);
    localStorage.setItem('pa-agent-phone', agent);
    document.getElementById('dialer-provider').textContent = CallBridge.getProviderLabel();
    this.updateSettingsStatus();
    window.LeadsModule?.showToast?.('Call provider settings saved', 'success');
  },

  clearSettings() {
    ['pa-call-provider', 'pa-call-api-endpoint', 'pa-call-api-token', 'pa-agent-phone'].forEach(key => localStorage.removeItem(key));
    ['call-provider-name', 'call-provider-endpoint', 'call-provider-token', 'call-provider-agent'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('dialer-provider').textContent = CallBridge.getProviderLabel();
    this.updateSettingsStatus();
    window.LeadsModule?.showToast?.('Call provider settings cleared', 'info');
  },

  async testSettings() {
    this.saveSettings();
    const status = document.getElementById('call-provider-status');
    const config = CallBridge.getConfig();
    if (!config.endpoint) {
      this.setSettingsStatus('Local session mode is active. Add an endpoint for live calling.', true);
      return;
    }
    if (status) status.textContent = 'Testing provider endpoint...';
    try {
      const result = await CallBridge.testConnection();
      this.setSettingsStatus(`Connected to ${result.provider || config.provider}.`, false);
    } catch (error) {
      this.setSettingsStatus(error.message || 'Provider test failed.', true);
    }
  },

  updateSettingsStatus() {
    const config = CallBridge.getConfig();
    this.setSettingsStatus(
      config.endpoint ? `Live calls will be sent through ${config.provider}.` : 'No live endpoint configured. Dialer will stay in local session mode.',
      !config.endpoint
    );
  },

  setSettingsStatus(message, isWarning) {
    const status = document.getElementById('call-provider-status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('warning', !!isWarning);
  },

  close() {
    this.stopTimer();
    if (this.callSession) CallBridge.endCall(this.callSession).catch(() => {});
    document.getElementById('lms-dialer-overlay')?.classList.remove('open');
    this.currentLead = null;
    this.callState = 'ready';
    this.callSession = null;
  }
};

const CallBridge = {
  getConfig() {
    const globalConfig = window.LMS_CALL_CONFIG || {};
    const localEndpoint = localStorage.getItem('pa-call-api-endpoint') || '';
    const localToken = localStorage.getItem('pa-call-api-token') || '';
    return {
      endpoint: globalConfig.endpoint || localEndpoint,
      token: globalConfig.token || localToken,
      agentNumber: globalConfig.agentNumber || localStorage.getItem('pa-agent-phone') || '',
      provider: globalConfig.provider || localStorage.getItem('pa-call-provider') || 'Local Session'
    };
  },

  getProviderLabel() {
    const config = this.getConfig();
    return config.endpoint
      ? `Provider: ${config.provider}`
      : 'Provider: Local session - configure pa-call-api-endpoint for live calling';
  },

  async startCall(lead) {
    const config = this.getConfig();
    const phone = DialerModule.normalizePhone(lead.phone || lead.whatsapp);
    if (!phone) throw new Error('This lead has no callable phone number.');

    if (!config.endpoint) {
      return {
        demo: true,
        provider: 'Local Session',
        sessionId: `local-${Date.now()}`,
        leadId: lead.id,
        phone
      };
    }

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {})
      },
      body: JSON.stringify({
        action: 'start_call',
        leadId: lead.id,
        leadName: lead.name,
        phone,
        agentNumber: config.agentNumber,
        source: 'pramukh-lms'
      })
    });

    if (!response.ok) {
      throw new Error(`Call provider rejected the request (${response.status}).`);
    }

    const payload = await response.json().catch(() => ({}));
    return {
      demo: false,
      provider: payload.provider || config.provider,
      sessionId: payload.sessionId || payload.callSid || `api-${Date.now()}`,
      leadId: lead.id,
      phone
    };
  },

  async endCall(session) {
    if (!session || session.demo) return;
    const config = this.getConfig();
    if (!config.endpoint) return;
    await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {})
      },
      body: JSON.stringify({
        action: 'end_call',
        sessionId: session.sessionId,
        leadId: session.leadId,
        source: 'pramukh-lms'
      })
    });
  },

  async testConnection() {
    const config = this.getConfig();
    if (!config.endpoint) throw new Error('No provider endpoint configured.');
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {})
      },
      body: JSON.stringify({
        action: 'test_connection',
        agentNumber: config.agentNumber,
        source: 'pramukh-lms'
      })
    });
    if (!response.ok) throw new Error(`Provider test failed (${response.status}).`);
    return response.json().catch(() => ({ provider: config.provider }));
  }
};

window.DialerModule = DialerModule;
window.CallBridge = CallBridge;
