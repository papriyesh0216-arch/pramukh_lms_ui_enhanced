// ============================================================
// LMS INQUIRY LIST - Runtime integration
// Runs after the existing LMS modules are initialized.
// ============================================================

(() => {
  const leads = typeof LeadsModule !== 'undefined' ? LeadsModule : window.LeadsModule;
  if (!leads?.__lmsInquiryStageStatusInstalled) return;

  // The legacy Inquiry initializer previously overwrote the base dummy rows
  // with AMS stage keys before this isolated workflow patch loaded. Restore
  // the LMS-owned dummy mapping before the canonical migration runs.
  const BASE_LMS_STAGE_SEEDS = {
    1: ['counselling', 'conducted'],
    2: ['pending', ''],
    3: ['pending', ''],
    4: ['voicecall', 'called'],
    5: ['hotlead', ''],
    6: ['coldlead', ''],
    7: ['voicecall', 'scheduled']
  };

  const drawer = typeof DrawerModule !== 'undefined' ? DrawerModule : window.DrawerModule;
  if (drawer && !drawer.__lmsInquiryStageStatusPatched) {
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

  const calendar = typeof CalendarModule !== 'undefined' ? CalendarModule : window.CalendarModule;
  if (calendar && !calendar.__lmsInquiryStageStatusPatched) {
    calendar.__lmsInquiryStageStatusPatched = true;
    calendar.isPendingLead = function isLmsPendingLead(lead) {
      return leads.getLeadStatusKey(lead) === 'pending' && !lead.followupDate;
    };
    calendar.isFollowupLead = function isLmsFollowupLead(lead) {
      const stageKey = leads.getLeadStatusKey(lead);
      return Boolean(lead.followupDate) || ['voicecall', 'counselling'].includes(stageKey);
    };
  }

  const dialer = typeof DialerModule !== 'undefined' ? DialerModule : window.DialerModule;
  if (dialer && !dialer.__lmsInquiryStageStatusPatched) {
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

  // Re-normalize data that may have been initialized before this scoped patch loaded.
  if (Array.isArray(leads.leads) && leads.leads.length) {
    leads.leads.forEach(lead => {
      const seed = BASE_LMS_STAGE_SEEDS[lead.id];
      if (!seed) return;
      lead.stageKey = seed[0];
      lead.stageStatus = seed[1];
    });
    leads.normalizeInquiryLeadData();
    leads.activeStatus = 'all';
    leads.activeSubStatus = 'all';
    leads.renderStatusBar();
    leads.applyFilters();
    leads.updateStatusBarCounts();
    calendar?.renderCalendar?.();
  }
})();
