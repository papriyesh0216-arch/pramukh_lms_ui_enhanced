// ============================================================
// LMS INQUIRY LIST - Stage / Status Workflow
// Scope: Lead Management System -> Inquiry List only.
// AMS owns its own workflow and is intentionally not referenced here.
// ============================================================

(() => {
  const LMS_STAGE_DEFINITIONS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'voicecall', label: 'Voice Call' },
    { key: 'hotlead', label: 'Hot Lead' },
    { key: 'coldlead', label: 'Cold Lead' },
    { key: 'counselling', label: 'Counselling' },
    { key: 'otr', label: 'OTR Form' },
    { key: 'closed', label: 'Closed' }
  ];

  const LMS_STAGE_STATUSES = {
    voicecall: [
      { key: 'all', label: 'All' },
      { key: 'called', label: 'Called' },
      { key: 'not_connected', label: 'Not Connected' },
      { key: 'switched_off', label: 'Switched OFF' },
      { key: 'scheduled', label: 'Scheduled' }
    ],
    counselling: [
      { key: 'all', label: 'All' },
      { key: 'reschedules', label: 'Reschedules' },
      { key: 'conducted', label: 'Conducted' },
      { key: 'scheduled', label: 'Scheduled' }
    ],
    otr: [
      { key: 'all', label: 'All' },
      { key: 'form_submitted', label: 'Form Submitted' },
      { key: 'form_submission', label: 'Form Submission' }
    ]
  };

  const STAGE_KEYS = new Set(LMS_STAGE_DEFINITIONS.filter(stage => stage.key !== 'all').map(stage => stage.key));
  const LEGACY_AMS_STAGE_KEYS = new Set(['course_selection', 'exam', 'interview', 'fees_pending', 'confirmed']);

  const compact = value => String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '');

  function statusDefinitions(stageKey) {
    return (LMS_STAGE_STATUSES[stageKey] || []).map(item => ({ ...item }));
  }

  function nonAllStatuses(stageKey) {
    return statusDefinitions(stageKey).filter(item => item.key !== 'all');
  }

  function inferStage(lead) {
    const existing = String(lead?.stageKey || '').trim();
    if (STAGE_KEYS.has(existing)) return existing;

    const rawStatus = compact(lead?.status);
    const rawStatusLabel = compact(lead?.statusLabel);
    const rawStageLabel = compact(lead?.stageLabel);
    const combined = `${rawStatus} ${rawStatusLabel} ${rawStageLabel}`;

    if (
      ['closed', 'lost', 'notinterested', 'admissionrejected', 'applicationrejected', 'declinedbystudent'].includes(rawStatus)
      || ['closed', 'admissionclosed'].includes(rawStageLabel)
      || /applicationrejected|declinedbystudent|admissionclosed/.test(combined)
    ) return 'closed';

    if (/counselling|counseling/.test(combined)) return 'counselling';
    if (lead?.isHot || rawStatus === 'interested' || rawStatusLabel === 'interested') return 'hotlead';

    if (['contacted', 'called', 'connected'].includes(rawStatus) || /voicecall|contacted|called/.test(combined)) {
      return String(lead?.priority || '').toLowerCase() === 'low' ? 'coldlead' : 'voicecall';
    }

    if (['followup', 'callback', 'noanswer'].includes(rawStatus)) return 'voicecall';

    if (
      LEGACY_AMS_STAGE_KEYS.has(existing)
      || ['admissionconfirmed', 'converted', 'feespending', 'feepending', 'courseselection', 'batchallocation'].includes(rawStatus)
      || /courseselection|interviewstage|feespending|admissionconfirmed/.test(combined)
      || rawStatus.includes('exam')
      || rawStageLabel === 'exam'
      || rawStageLabel === 'formsent'
      || existing === 'otr'
    ) return 'otr';

    if (['new', 'pending'].includes(rawStatus) || ['new', 'pending'].includes(rawStageLabel)) return 'pending';
    return 'pending';
  }

  function inferStatus(lead, stageKey) {
    const existing = String(lead?.stageStatus || '').trim();
    if (nonAllStatuses(stageKey).some(item => item.key === existing)) return existing;

    const raw = [
      lead?.stageStatus,
      lead?.status,
      lead?.statusLabel,
      lead?.stageLabel,
      lead?.followupStatus,
      lead?.lastCallOutcome
    ].map(compact).filter(Boolean).join(' ');

    if (stageKey === 'voicecall') {
      if (/switchedoff|switchoff/.test(raw)) return 'switched_off';
      if (/notconnected|noanswer|wrongno|wrongnumber/.test(raw)) return 'not_connected';
      if (/scheduled|callback|followup/.test(raw)) return 'scheduled';
      if (/called|contacted|connected/.test(raw)) return 'called';
      return '';
    }

    if (stageKey === 'counselling') {
      if (/resched/.test(raw)) return 'reschedules';
      if (/conducted|completed|done/.test(raw)) return 'conducted';
      if (/scheduled/.test(raw) || lead?.followupDate) return 'scheduled';
      const hasCompletedCounselling = (lead?.communications || []).some(item => /counselling.*(completed|done|conducted)/i.test(`${item?.title || ''} ${item?.desc || ''}`));
      return hasCompletedCounselling ? 'conducted' : '';
    }

    if (stageKey === 'otr') {
      const oldStage = compact(lead?.stageKey);
      if (
        ['submitted', 'formsubmitted'].some(value => raw.includes(value))
        || ['courseselection', 'exam', 'interview', 'feespending', 'confirmed'].includes(oldStage)
        || /admissionconfirmed|exam|interviewstage|fees?pending|courseselection/.test(raw)
      ) return 'form_submitted';
      return 'form_submission';
    }

    return '';
  }

  function stageIndex(stageKey) {
    return Math.max(0, LMS_STAGE_DEFINITIONS.findIndex(stage => stage.key === stageKey) - 1);
  }

  function installScopedStyles() {
    if (document.getElementById('lms-inquiry-stage-status-style')) return;
    const style = document.createElement('style');
    style.id = 'lms-inquiry-stage-status-style';
    style.textContent = `
      #screen-leads .status-counselling,
      #lead-drawer .status-counselling {
        background: var(--purple-light) !important;
        color: var(--purple) !important;
      }
      #screen-leads .status-otr,
      #lead-drawer .status-otr {
        background: var(--success-light) !important;
        color: var(--success) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function installLeadWorkflow() {
    const leads = typeof LeadsModule !== 'undefined' ? LeadsModule : window.LeadsModule;
    if (!leads || leads.__lmsInquiryStageStatusInstalled) return Boolean(leads);
    leads.__lmsInquiryStageStatusInstalled = true;

    const originalShowManageFollowup = leads.showManageFollowup.bind(leads);
    const originalSaveCounselling = leads.saveCounselling.bind(leads);

    leads.getStageDefinitions = function getLmsInquiryStages() {
      return LMS_STAGE_DEFINITIONS.map(stage => ({ ...stage }));
    };

    leads.getStageStatusDefinitions = function getLmsInquiryStageStatuses(stageKey) {
      return statusDefinitions(stageKey);
    };

    leads.getFollowupStageStatusDefinitions = function getLmsFollowupStatuses(stageKey) {
      return nonAllStatuses(stageKey);
    };

    leads.formatStageLabel = function formatLmsStageLabel(stageKey) {
      return LMS_STAGE_DEFINITIONS.find(stage => stage.key === stageKey)?.label || 'Pending';
    };

    leads.formatStageStatusLabel = function formatLmsStageStatusLabel(stageKey, stageStatusKey) {
      return statusDefinitions(stageKey).find(item => item.key === stageStatusKey)?.label || '';
    };

    leads.getLeadStatusKey = function getLmsLeadStageKey(lead) {
      if (lead?.archived) return null;
      return inferStage(lead);
    };

    leads.getLeadSubStatusKey = function getLmsLeadStageStatusKey(lead) {
      const stageKey = this.getLeadStatusKey(lead);
      return stageKey ? inferStatus(lead, stageKey) : '';
    };

    leads.normalizeLeadStageData = function normalizeLmsLeadStageData(lead) {
      if (!lead) return;
      const wasShortlisted = Boolean(lead.shortlistedForAdmission);
      const stageKey = this.getLeadStatusKey(lead) || 'pending';
      const stageStatus = this.getLeadSubStatusKey({ ...lead, stageKey });
      lead.stageKey = stageKey;
      lead.stageStatus = stageStatus;
      lead.stageLabel = this.formatStageLabel(stageKey);
      lead.stageStatusLabel = this.formatStageStatusLabel(stageKey, stageStatus);
      lead.stage = stageIndex(stageKey);
      // Admission intake is a data handoff, never an AMS workflow state.
      lead.shortlistedForAdmission = stageKey === 'otr' || (stageKey === 'closed' && wasShortlisted);
    };

    leads.migrateLmsFollowupWorkflowData = function migrateLmsFollowupWorkflowData(lead) {
      const migratePayload = payload => {
        if (!payload || typeof payload !== 'object' || !payload.stageKey) return payload;
        const pseudo = {
          ...lead,
          stageKey: payload.stageKey,
          stageStatus: payload.stageStatus || '',
          status: payload.stageKey,
          statusLabel: payload.stageStatus || '',
          stageLabel: payload.stageKey
        };
        const nextStage = inferStage(pseudo);
        const nextStatus = inferStatus(pseudo, nextStage);
        return { ...payload, stageKey: nextStage, stageStatus: nextStatus };
      };

      if (lead.followupManagement) lead.followupManagement = migratePayload(lead.followupManagement);
      (lead.communications || []).forEach(item => {
        const key = item.followupData ? 'followupData' : (item.payload?.stageKey ? 'payload' : '');
        if (!key) return;
        item[key] = migratePayload(item[key]);
        const data = item[key];
        if (item.type === 'followup' && data?.stageKey) {
          const statusText = data.stageStatus ? ` - ${this.formatStageStatusLabel(data.stageKey, data.stageStatus)}` : '';
          const mentorText = data.stageKey === 'counselling' && data.assignedMentor ? `. Mentor: ${data.assignedMentor}` : '';
          item.desc = `${this.formatStageLabel(data.stageKey)}${statusText}${mentorText}. Purpose: ${data.purpose || '-'}${data.refNo ? `. Ref No: ${data.refNo}` : ''}`;
        }
      });
    };

    leads.normalizeInquiryLeadData = function normalizeLmsInquiryLeadData() {
      this.leads.forEach((lead, index) => {
        lead.state = this.getLeadState(lead);
        lead.district = this.getLeadDistrict(lead);
        lead.academicStatus = this.normalizeAcademicStatus(lead.academicStatus);
        lead.course = this.normalizeInquiryCourse(lead.course);
        lead.mode = this.normalizeLearningMode(lead.learningMode || lead.mode, lead.course);
        lead.learningMode = lead.mode;
        if (!lead.batch) lead.batch = '';
        lead.gender = lead.gender || (index % 2 ? 'Female' : 'Male');
        lead.hostelStatus = lead.hostelStatus || (lead.mode === 'Online' ? 'Not Applicable' : (index % 2 ? 'Without Hostel' : 'With Hostel'));
        lead.enquiryId = lead.enquiryId || lead.enqNo;
        lead.otrNo = /^PA\d{6}$/i.test(String(lead.otrNo || '')) ? String(lead.otrNo).toUpperCase() : `PA26${String(index + 1).padStart(4, '0')}`;

        const stageKey = inferStage(lead);
        const stageStatus = inferStatus(lead, stageKey);
        lead.stageKey = stageKey;
        lead.stageStatus = stageStatus;
        this.normalizeLeadStageData(lead);
        this.migrateLmsFollowupWorkflowData(lead);
        lead.createdAt = lead.createdAt || lead.inquiryDate;
        lead.modifiedAt = lead.modifiedAt || lead.assignedDate || lead.inquiryDate;
      });
      this.syncAppDataLeads();
    };

    leads.syncAdmissionShortlist = function syncLmsAdmissionDataHandoff() {
      const shortlist = this.leads
        .filter(lead => !lead.archived && lead.shortlistedForAdmission)
        .map(lead => {
          const snapshot = {
            ...lead,
            lmsStageKey: lead.stageKey,
            lmsStageStatus: lead.stageStatus,
            lmsStageLabel: this.formatStageLabel(lead.stageKey),
            lmsStageStatusLabel: this.formatStageStatusLabel(lead.stageKey, lead.stageStatus),
            shortlistedForAdmission: true
          };
          // AMS must construct its own workflow from the intake record.
          delete snapshot.stageKey;
          delete snapshot.stageStatus;
          delete snapshot.stageLabel;
          delete snapshot.stageStatusLabel;
          delete snapshot.stage;
          delete snapshot.status;
          delete snapshot.statusLabel;
          return snapshot;
        });
      try {
        localStorage.setItem('paAdmissionShortlist', JSON.stringify(shortlist));
      } catch (error) {
        // localStorage can be unavailable in restricted browser contexts.
      }
    };

    leads.getBulkStageModalOptions = function getLmsBulkStageOptions() {
      return this.getStageDefinitions()
        .filter(stage => stage.key !== 'all')
        .map(stage => ({ ...stage, statuses: nonAllStatuses(stage.key) }));
    };

    leads.renderBulkStageStatusOptions = function renderLmsBulkStageStatusOptions(stageKey) {
      const select = document.getElementById('bulk-stage-status');
      if (!select) return;
      const statuses = nonAllStatuses(stageKey);
      select.innerHTML = '<option value="">Select Stage Status</option>' + statuses
        .map(status => `<option value="${status.key}">${status.label}</option>`)
        .join('');
    };

    leads.syncBulkStageVisibility = function syncLmsBulkStageVisibility() {
      const stageKey = document.getElementById('bulk-stage')?.value || '';
      const statusWrap = document.getElementById('bulk-stage-status-wrap');
      const statusSelect = document.getElementById('bulk-stage-status');
      const dateWrap = document.getElementById('bulk-stage-date-wrap');
      const timeWrap = document.getElementById('bulk-stage-time-wrap');
      const dateInput = document.getElementById('bulk-stage-date');
      const timeInput = document.getElementById('bulk-stage-time');
      const statuses = nonAllStatuses(stageKey);
      const shouldHideSchedule = ['otr', 'closed'].includes(stageKey);

      this.renderBulkStageStatusOptions(stageKey);
      if (statusWrap) statusWrap.hidden = statuses.length === 0;
      if (statusSelect) {
        statusSelect.disabled = statuses.length === 0;
        if (!statuses.length) statusSelect.value = '';
      }
      if (dateWrap) dateWrap.hidden = shouldHideSchedule;
      if (timeWrap) timeWrap.hidden = shouldHideSchedule;
      if (dateInput) dateInput.required = !shouldHideSchedule;
      if (timeInput) timeInput.required = false;
      if (shouldHideSchedule) {
        if (dateInput) dateInput.value = '';
        if (timeInput) timeInput.value = '';
      }
    };

    leads.syncFollowupStageVisibility = function syncLmsFollowupStageVisibility() {
      const stageKey = document.getElementById('f-stage')?.value || '';
      const statusWrap = document.getElementById('f-stage-status-wrap');
      const statusSelect = document.getElementById('f-stage-status');
      const mentorWrap = document.getElementById('f-mentor-wrap');
      const mentorInput = document.getElementById('f-mentor');
      const dateWrap = document.getElementById('f-date-wrap');
      const timeWrap = document.getElementById('f-time-wrap');
      const dateInput = document.getElementById('f-date');
      const timeInput = document.getElementById('f-time');
      const statuses = nonAllStatuses(stageKey);
      const shouldHideSchedule = ['otr', 'closed'].includes(stageKey);

      if (statusSelect) {
        statusSelect.innerHTML = '<option value="">Select Stage Status</option>' + statuses
          .map(status => `<option value="${status.key}">${status.label}</option>`)
          .join('');
        statusSelect.disabled = statuses.length === 0;
        if (!statuses.length) statusSelect.value = '';
      }
      if (statusWrap) statusWrap.hidden = statuses.length === 0;
      if (mentorWrap) mentorWrap.hidden = true;
      if (mentorInput) {
        mentorInput.required = false;
        mentorInput.value = '';
      }
      if (dateWrap) dateWrap.hidden = shouldHideSchedule;
      if (timeWrap) timeWrap.hidden = shouldHideSchedule;
      if (dateInput) dateInput.required = !shouldHideSchedule;
      if (timeInput) timeInput.required = false;
      if (shouldHideSchedule) {
        if (dateInput) dateInput.value = '';
        if (timeInput) timeInput.value = '';
      }
    };

    leads.showManageFollowup = function showLmsManageFollowup(id, initialStageKey = '') {
      const lead = this.leads.find(item => item.id === id);
      if (!lead) return;
      const stageKey = initialStageKey || this.getLeadStatusKey(lead) || 'pending';
      originalShowManageFollowup(id, stageKey);
      const statusSelect = document.getElementById('f-stage-status');
      const currentStatus = this.getLeadSubStatusKey(lead);
      if (statusSelect && currentStatus && [...statusSelect.options].some(option => option.value === currentStatus)) {
        statusSelect.value = currentStatus;
      }
    };

    leads.saveFollowup = function saveLmsFollowup(leadId) {
      const lead = this.leads.find(item => item.id === leadId);
      if (!lead) return;

      const stageKey = document.getElementById('f-stage')?.value || '';
      const stageStatus = document.getElementById('f-stage-status')?.value || '';
      const refNo = document.getElementById('f-ref')?.value.trim() || '';
      const followupDate = document.getElementById('f-date')?.value || '';
      const followupTime = document.getElementById('f-time')?.value || '';
      const purpose = document.getElementById('f-purpose')?.value.trim() || '';
      const followedBy = document.getElementById('f-followed-by')?.textContent || lead.assignedTo || lead.owner || 'Unassigned';
      const needsSchedule = !['otr', 'closed'].includes(stageKey);
      const validStatuses = nonAllStatuses(stageKey).map(status => status.key);

      if (!STAGE_KEYS.has(stageKey) || !purpose || (needsSchedule && !followupDate)) return;
      if (stageStatus && !validStatuses.includes(stageStatus)) return;

      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const now = new Date();
      const newComm = {
        type: 'followup',
        day: String(now.getDate()),
        month: months[now.getMonth()],
        title: 'Follow-up Management',
        desc: `${this.formatStageLabel(stageKey)}${stageStatus ? ` - ${this.formatStageStatusLabel(stageKey, stageStatus)}` : ''}. Purpose: ${purpose}${refNo ? `. Ref No: ${refNo}` : ''}`,
        time: followupTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        by: followedBy,
        followupData: {
          stageKey,
          stageStatus,
          refNo,
          followupDate: needsSchedule ? followupDate : '',
          followupTime: needsSchedule ? followupTime : '',
          purpose,
          followedBy,
          assignedMentor: ''
        }
      };

      if (!Array.isArray(lead.communications)) lead.communications = [];
      lead.communications.unshift(newComm);
      lead.stageKey = stageKey;
      lead.stageStatus = stageStatus;
      lead.followupRefNo = refNo;
      lead.followupDate = needsSchedule ? followupDate : '';
      lead.followupTime = needsSchedule ? followupTime : '';
      lead.followupPurpose = purpose;
      lead.followupManagement = newComm.followupData;
      this.normalizeLeadStageData(lead);
      this.stampLeadModified(lead);

      if (stageKey === 'counselling') {
        this.recordEmailNotification(
          lead,
          'Counselling scheduled - Pramukh Academy',
          `Dear ${lead.name}, your counselling follow-up is scheduled on ${lead.followupDate || '-'}${lead.followupTime ? ` at ${lead.followupTime}` : ''}. Purpose: ${purpose}.`,
          'Automatic counselling follow-up email.'
        );
      }
      if (stageKey === 'otr') {
        this.recordEmailNotification(
          lead,
          'OTR form link - Pramukh Academy',
          `Dear ${lead.name}, your inquiry has moved to OTR Form. Please complete the OTR form: ams.html`,
          'Automatic OTR Form follow-up email.'
        );
      }

      this.syncAppDataLeads();
      this.showToast('Follow-up activity recorded successfully!', 'success');
      document.getElementById('manage-followup-overlay')?.remove();
      this.applyFilters();
      this.updateStatusBarCounts();
    };

    leads.saveBulkStages = function saveLmsBulkStages() {
      const form = document.getElementById('bulk-stage-form');
      if (!form) return;
      const ids = (form.dataset.ids || '').split(',').map(Number).filter(Boolean);
      const stageKey = document.getElementById('bulk-stage')?.value || '';
      const stageStatus = document.getElementById('bulk-stage-status')?.value || '';
      const refNo = document.getElementById('bulk-stage-ref')?.value.trim() || '';
      const followupDate = document.getElementById('bulk-stage-date')?.value || '';
      const followupTime = document.getElementById('bulk-stage-time')?.value || '';
      const purpose = document.getElementById('bulk-stage-purpose')?.value.trim() || '';
      const followedBy = document.querySelector('#bulk-stage-form .readonly-field')?.textContent || '';
      const needsSchedule = !['otr', 'closed'].includes(stageKey);
      const validStatuses = nonAllStatuses(stageKey).map(status => status.key);

      if (!STAGE_KEYS.has(stageKey) || !purpose || (needsSchedule && !followupDate)) return;
      if (stageStatus && !validStatuses.includes(stageStatus)) return;

      ids.forEach(id => {
        const lead = this.leads.find(item => item.id === id);
        if (!lead) return;
        lead.stageKey = stageKey;
        lead.stageStatus = stageStatus;
        lead.followupRefNo = refNo;
        lead.followupDate = needsSchedule ? followupDate : '';
        lead.followupTime = needsSchedule ? followupTime : '';
        lead.followupPurpose = purpose;
        lead.followupManagement = {
          stageKey,
          stageStatus,
          refNo,
          followupDate: lead.followupDate,
          followupTime: lead.followupTime,
          purpose,
          followedBy
        };
        this.normalizeLeadStageData(lead);
        this.stampLeadModified(lead);

        if (stageKey === 'counselling') {
          this.recordEmailNotification(
            lead,
            'Counselling scheduled - Pramukh Academy',
            `Dear ${lead.name}, your counselling follow-up is scheduled on ${lead.followupDate || '-'}${lead.followupTime ? ` at ${lead.followupTime}` : ''}. Purpose: ${purpose}.`,
            'Automatic counselling stage email.'
          );
        }
        if (stageKey === 'otr') {
          this.recordEmailNotification(
            lead,
            'OTR form link - Pramukh Academy',
            `Dear ${lead.name}, your inquiry has moved to OTR Form. Please complete the OTR form: ams.html`,
            'Automatic OTR Form stage email.'
          );
        }
        this.recordTimelineAction(
          lead,
          'Bulk Stage Updated',
          `${this.formatStageLabel(stageKey)}${lead.stageStatusLabel ? ` - ${lead.stageStatusLabel}` : ''}. Purpose: ${purpose}${refNo ? `. Ref No: ${refNo}` : ''}`
        );
      });

      document.querySelector('#bulk-stage-form')?.closest('.custom-modal-overlay')?.remove();
      this.applyFilters();
      this.updateStatusBarCounts();
      this.syncAppDataLeads();
      this.showToast(`${ids.length} lead(s) updated`, 'success');
    };

    leads.saveChangeClass = function saveLmsStageChange(leadId) {
      const lead = this.leads.find(item => item.id === leadId);
      if (!lead) return;
      const nextStage = document.getElementById('c-status')?.value || '';
      if (!STAGE_KEYS.has(nextStage)) return;

      lead.stageKey = nextStage;
      lead.stageStatus = nextStage === 'otr' ? 'form_submission' : '';
      this.normalizeLeadStageData(lead);
      this.stampLeadModified(lead);
      this.syncAppDataLeads();

      this.showToast(`Stage updated to ${this.formatStageLabel(nextStage)} successfully!`, 'success');
      document.querySelector('#c-status')?.closest('.custom-modal-overlay')?.remove();
      this.applyFilters();
      this.updateStatusBarCounts();
    };

    leads.submitLead = function submitLmsLeadToOtr(id) {
      const lead = this.leads.find(item => item.id === id);
      if (!lead) return;
      if (!confirm(`Are you sure you want to move the inquiry "${lead.name}" to OTR Form?`)) return;

      lead.stageKey = 'otr';
      lead.stageStatus = 'form_submission';
      this.normalizeLeadStageData(lead);
      this.stampLeadModified(lead);
      this.recordEmailNotification(
        lead,
        'OTR form link - Pramukh Academy',
        `Dear ${lead.name}, your inquiry has moved to OTR Form. Please complete the OTR form: ams.html`,
        'Automatic OTR Form link email.'
      );
      this.recordTimelineAction(lead, 'Shortlisted for Admission', 'OTR Form workflow started.');
      this.syncAppDataLeads();
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast(`Inquiry ${lead.name} moved to OTR Form.`, 'success');
    };

    leads.saveCounselling = function saveLmsCounselling(id) {
      const lead = this.leads.find(item => item.id === id);
      if (!lead) return;
      const previousStatus = lead.status;
      const previousStatusLabel = lead.statusLabel;
      originalSaveCounselling(id);
      lead.status = previousStatus;
      lead.statusLabel = previousStatusLabel;
      lead.stageKey = 'counselling';
      lead.stageStatus = 'conducted';
      this.normalizeLeadStageData(lead);
      this.stampLeadModified(lead);
      this.syncAppDataLeads();
      this.applyFilters();
      this.updateStatusBarCounts();
    };

    installScopedStyles();
    return true;
  }

  function patchDrawer() {
    const drawer = typeof DrawerModule !== 'undefined' ? DrawerModule : window.DrawerModule;
    const leads = typeof LeadsModule !== 'undefined' ? LeadsModule : window.LeadsModule;
    if (!drawer || !leads || drawer.__lmsInquiryStageStatusPatched) return;
    drawer.__lmsInquiryStageStatusPatched = true;

    const originalRenderDrawer = drawer.renderDrawer.bind(drawer);
    drawer.renderDrawer = function renderLmsInquiryDrawer(lead) {
      const stageKey = leads.getLeadStatusKey(lead) || 'pending';
      const viewLead = {
        ...lead,
        status: stageKey,
        statusLabel: leads.formatStageLabel(stageKey),
        stageLabel: leads.formatStageLabel(stageKey),
        stageStatusLabel: leads.formatStageStatusLabel(stageKey, leads.getLeadSubStatusKey(lead))
      };
      return originalRenderDrawer(viewLead);
    };

    drawer.buildJourneyHtml = function buildLmsInquiryJourney(lead) {
      const stages = leads.getStageDefinitions().filter(stage => stage.key !== 'all');
      const currentKey = leads.getLeadStatusKey(lead) || 'pending';
      const currentIndex = Math.max(0, stages.findIndex(stage => stage.key === currentKey));
      const icons = {
        pending: 'fa-inbox',
        voicecall: 'fa-phone',
        hotlead: 'fa-fire',
        coldlead: 'fa-snowflake',
        counselling: 'fa-comments',
        otr: 'fa-file-signature',
        closed: 'fa-circle-xmark'
      };
      return `
        <div class="stage-pipeline-card inquiry-journey-card">
          <div class="drawer-card-header">
            <div class="drawer-card-title"><i class="fas fa-route"></i> Lead Journey</div>
          </div>
          <div style="padding: 12px 20px">
            <div class="stage-pipeline">
              ${stages.map((stage, index) => {
                const isCompleted = index < currentIndex;
                const isActive = index === currentIndex;
                return `
                  ${index > 0 ? `<div class="stage-connector ${index <= currentIndex ? 'done' : ''}"></div>` : ''}
                  <div class="stage-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                    <div class="stage-circle"><i class="fas ${icons[stage.key] || 'fa-circle'}"></i></div>
                    <span class="stage-label">${drawer.escapeHtml(stage.label)}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    };
  }

  function patchCalendar() {
    const calendar = typeof CalendarModule !== 'undefined' ? CalendarModule : window.CalendarModule;
    const leads = typeof LeadsModule !== 'undefined' ? LeadsModule : window.LeadsModule;
    if (!calendar || !leads || calendar.__lmsInquiryStageStatusPatched) return;
    calendar.__lmsInquiryStageStatusPatched = true;

    calendar.isPendingLead = function isLmsPendingLead(lead) {
      return leads.getLeadStatusKey(lead) === 'pending' && !lead.followupDate;
    };

    calendar.isFollowupLead = function isLmsFollowupLead(lead) {
      const stageKey = leads.getLeadStatusKey(lead);
      return Boolean(lead.followupDate) || ['voicecall', 'counselling'].includes(stageKey);
    };
  }

  function patchDialer() {
    const dialer = typeof DialerModule !== 'undefined' ? DialerModule : window.DialerModule;
    const leads = typeof LeadsModule !== 'undefined' ? LeadsModule : window.LeadsModule;
    if (!dialer || !leads || dialer.__lmsInquiryStageStatusPatched) return;
    dialer.__lmsInquiryStageStatusPatched = true;

    dialer.applyOutcome = function applyLmsCallOutcome(outcome, note) {
      const lead = this.currentLead;
      if (!lead) return;

      lead.lastCallOutcome = outcome;
      lead.lastCallNote = note;
      lead.lastCallDuration = this.formatDuration(this.elapsedSeconds);
      lead.followupType = 'Voice Call';
      lead.followupStatus = outcome;

      if (outcome === 'Called') {
        lead.stageKey = 'voicecall';
        lead.stageStatus = 'called';
      } else if (outcome === 'Interested') {
        lead.stageKey = 'hotlead';
        lead.stageStatus = '';
      } else if (outcome === 'Not Interested') {
        lead.stageKey = 'coldlead';
        lead.stageStatus = '';
      } else if (outcome === 'Registered') {
        lead.stageKey = 'otr';
        lead.stageStatus = 'form_submission';
      } else if (outcome === 'Callback') {
        lead.stageKey = 'voicecall';
        lead.stageStatus = 'scheduled';
      } else if (outcome === 'No Answer' || outcome === 'Wrong No.') {
        lead.stageKey = 'voicecall';
        lead.stageStatus = 'not_connected';
      }

      leads.normalizeLeadStageData(lead);
      this.record(`Call Outcome: ${outcome}`, `${note} Duration: ${this.formatDuration(this.elapsedSeconds)}.`);
      leads.syncAppDataLeads();
      leads.applyFilters();
      leads.updateStatusBarCounts();
    };
  }

  installLeadWorkflow();

  document.addEventListener('DOMContentLoaded', () => {
    patchDrawer();
    patchCalendar();
    patchDialer();
  }, { once: true });
})();
