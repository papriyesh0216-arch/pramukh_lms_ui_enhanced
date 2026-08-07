// ============================================================
// AMS STUDENT PIPELINE - targeted requirement patch
// Scope: AMS Student Pipeline only.
// ============================================================

(() => {
  const INSTALL_FLAG = '__amsStudentPipelineRequirementsInstalled';
  const VIEW_TOGGLE_ATTR = 'data-amsl-view-toggle';
  const viewState = {
    rowScrollY: 0,
    toolbarPlaceholder: null,
    calendarToolbarHost: null
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function stableNumber(value, minimum, maximum) {
    const text = String(value || 'AMS');
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) - hash) + text.charCodeAt(index);
      hash |= 0;
    }
    const span = Math.max(1, maximum - minimum + 1);
    return minimum + (Math.abs(hash) % span);
  }

  function courseId(row) {
    if (row.courseId) return row.courseId;
    if (row.otrRecord?.courseId) return row.otrRecord.courseId;
    const slug = String(row.course || 'GENERAL')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24);
    return `CRS-${slug || 'GENERAL'}`;
  }

  function enquiryId(row) {
    if (row.enquiryId) return row.enquiryId;
    if (row.sourceLeadNo) return row.sourceLeadNo;
    const suffix = String(row.otrNo || row.key || '0000').replace(/\D/g, '').slice(-4).padStart(4, '0');
    return `ENQ${suffix}`;
  }

  function residency(row) {
    if (row.residency) return row.residency;
    const address = row.otrRecord?.address || {};
    const district = row.district || address.district || '';
    const state = row.state || address.state || '';
    if (district && state) return `${district}, ${state}`;
    return state || district || 'Gujarat';
  }

  function examScore(row) {
    if (row.examScore !== undefined && row.examScore !== null && String(row.examScore).trim()) return row.examScore;
    if (row.examResult !== undefined && row.examResult !== null && String(row.examResult).trim()) return row.examResult;
    const recordScore = row.otrRecord?.exam?.score || row.otrRecord?.governmentExam?.score;
    if (recordScore !== undefined && recordScore !== null && String(recordScore).trim()) return recordScore;
    const reachedExam = ['exam', 'interview', 'fees_pending', 'confirmed', 'closed'].includes(row.stageKey);
    return reachedExam ? `${stableNumber(row.key, 68, 91)}/100` : 'Pending';
  }

  function latestInterview(row) {
    const interviews = window.AMSInterviews?.interviewsForStudent?.(row) || [];
    return interviews[0] || null;
  }

  function interviewOutcome(row) {
    if (row.interviewOutcome) return row.interviewOutcome;
    const interview = latestInterview(row);
    const mapped = interview?.outcome || interview?.result || interview?.decision;
    if (mapped) return mapped;
    if (interview?.status === 'Completed') return 'Completed';
    if (['fees_pending', 'confirmed'].includes(row.stageKey)) return 'Recommended';
    if (row.stageKey === 'closed' && /reject/i.test(String(row.stageStatus || ''))) return 'Not Recommended';
    return 'Pending';
  }

  function finalDecision(row) {
    if (row.finalDecision) return row.finalDecision;
    if (row.stageKey === 'confirmed') return 'Admission Confirmed';
    if (row.stageKey === 'closed') return row.stageStatus || 'Admission Closed';
    return 'Pending';
  }

  function latestUpdate(row) {
    if (row.latestUpdate) return row.latestUpdate;
    const activity = (row.activities || window.AMSAdmissionOps?.store?.activities?.[row.key] || [])[0];
    return activity?.description || activity?.title || `${row.stage || 'Admission'}${row.stageStatus ? ` - ${row.stageStatus}` : ''}`;
  }

  function nextMilestone(row) {
    if (row.nextMilestone) return row.nextMilestone;
    if (row.nextStep) return row.nextStep;
    if (row.purpose) return row.purpose;
    const milestones = {
      otr: 'Complete OTR Form',
      course_selection: 'Confirm Course Selection',
      exam: 'Complete Admission Exam',
      interview: 'Complete Interview',
      fees_pending: 'Complete Fee Payment',
      confirmed: 'Student Onboarding',
      closed: 'Admission Closed'
    };
    return milestones[row.stageKey] || 'Admission Review';
  }

  function otrStarted(row) {
    if (row.otrStartedAt) return formatDateTime(row.otrStartedAt);
    if (row.otrRecord?.createdAt) return formatDateTime(row.otrRecord.createdAt);
    if (row.statusKey && row.statusKey !== 'otr_pending') return formatDateTime(row.admissionDateTime || row.createdAt);
    return 'Not Started';
  }

  function getAmsApp() {
    if (typeof AMSApp !== 'undefined') return AMSApp;
    return window.AMSApp;
  }

  function removeCalendarNavigation() {
    document.querySelectorAll('[data-screen="calendar"]').forEach(item => item.remove());
    document.querySelectorAll('#mobile-bottom-nav button, #mobile-bottom-nav [data-nav-screen]').forEach(item => {
      const text = String(item.textContent || '').trim().toLowerCase();
      const screen = item.dataset?.screen || item.dataset?.navScreen || item.getAttribute('data-screen');
      if (screen === 'calendar' || text === 'calendar') item.remove();
    });
  }

  function ensureCalendarNavigationGuard() {
    removeCalendarNavigation();
    const sidebar = document.getElementById('shared-navigation-sidebar');
    const mobile = document.getElementById('mobile-bottom-nav');
    if (!window.MutationObserver) return;
    const observer = new MutationObserver(removeCalendarNavigation);
    if (sidebar) observer.observe(sidebar, { childList: true, subtree: true });
    if (mobile) observer.observe(mobile, { childList: true, subtree: true });
  }

  function ensureRowActionAlignment() {
    if (document.getElementById('ams-student-pipeline-row-action-alignment')) return;
    const style = document.createElement('style');
    style.id = 'ams-student-pipeline-row-action-alignment';
    style.textContent = `
      @media (min-width: 1241px) {
        #screen-ams-students .amsl-card-header > .amsl-row-actions {
          grid-column: 5 / 7;
          padding-inline: 18px;
          justify-self: stretch;
          justify-content: center;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureFollowupForegroundLayer() {
    if (document.getElementById('ams-student-pipeline-followup-layer')) return;
    const style = document.createElement('style');
    style.id = 'ams-student-pipeline-followup-layer';
    style.textContent = `
      #ams-ops-dialog.custom-modal-overlay {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483000 !important;
        overflow: auto !important;
        isolation: isolate;
        pointer-events: auto !important;
      }

      #ams-ops-dialog.custom-modal-overlay > .custom-modal-card {
        position: relative;
        z-index: 1;
        max-height: calc(100vh - 32px);
      }

      #ams-ops-dialog.custom-modal-overlay .custom-modal-body {
        min-height: 0;
        overflow: auto;
      }
    `;
    document.head.appendChild(style);
  }

  function bindStageStatusFollowupTriggers(ops) {
    const screen = document.getElementById('screen-ams-students');
    if (!screen || screen.dataset.amsStageStatusFollowupBound === 'true') return;
    screen.dataset.amsStageStatusFollowupBound = 'true';

    screen.addEventListener('click', event => {
      const badge = event.target.closest('.amsl-stage-badge, .amsl-status-badge');
      if (!badge || !badge.closest('.amsl-card-header')) return;

      const card = badge.closest('[data-amsl-card]');
      const key = card?.dataset.amslCard;
      if (!key) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      window.AMSStudentList.state.openMenuKey = '';
      ops.showFollowup(key);
    }, true);
  }

  function ensureCalendarToolbarHost() {
    if (viewState.calendarToolbarHost?.isConnected) return viewState.calendarToolbarHost;
    const screen = document.getElementById('screen-calendar');
    const content = screen?.querySelector('.content-area');
    if (!screen || !content) return null;
    const host = document.createElement('div');
    host.className = 'amsl-calendar-toolbar-host';
    host.setAttribute('aria-label', 'Admission List view controls');
    screen.insertBefore(host, content);
    viewState.calendarToolbarHost = host;
    return host;
  }

  function syncViewToggle(button, mode) {
    if (!button) return;
    const calendarMode = mode === 'calendar';
    button.dataset.amslViewToggle = calendarMode ? 'row' : 'calendar';
    button.title = calendarMode ? 'Return to Student Pipeline row view' : 'Open Admission Calendar view';
    button.dataset.tooltip = button.title;
    button.setAttribute('aria-label', button.title);
    button.innerHTML = calendarMode
      ? '<i class="fas fa-list"></i>'
      : '<i class="fas fa-calendar-days"></i>';
  }

  function restoreToolbarToRow(toolbar) {
    const placeholder = viewState.toolbarPlaceholder;
    if (!toolbar || !placeholder?.parentNode) return;
    placeholder.parentNode.insertBefore(toolbar, placeholder.nextSibling);
  }

  function moveToolbarToCalendar(toolbar) {
    const host = ensureCalendarToolbarHost();
    if (!toolbar || !host) return;
    host.appendChild(toolbar);
  }

  function openCalendarView(toolbar, button) {
    viewState.rowScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    syncViewToggle(button, 'calendar');
    moveToolbarToCalendar(toolbar);
    if (window.AMSCalendar?.openExistingCalendar) {
      window.AMSCalendar.openExistingCalendar();
    } else {
      getAmsApp()?.showScreen?.('calendar');
      window.AMSCalendar?.renderCalendar?.();
    }
    requestAnimationFrame(() => {
      moveToolbarToCalendar(toolbar);
      syncViewToggle(button, 'calendar');
    });
  }

  function openRowView(toolbar, button) {
    restoreToolbarToRow(toolbar);
    syncViewToggle(button, 'row');
    if (window.AMSCalendar?.goToInquiryList) {
      window.AMSCalendar.goToInquiryList();
    } else {
      getAmsApp()?.showScreen?.('ams-students');
    }
    requestAnimationFrame(() => {
      restoreToolbarToRow(toolbar);
      syncViewToggle(button, 'row');
      window.scrollTo({ top: viewState.rowScrollY, left: 0, behavior: 'auto' });
    });
  }

  function ensureToolbarViewToggle(list) {
    const toolbar = document.querySelector('#screen-ams-students .amsl-tools-card');
    const quickRow = toolbar?.querySelector('.amsl-quick-row');
    const expandButton = quickRow?.querySelector('[data-amsl-action="expand-all"]');
    if (!toolbar || !quickRow || !expandButton) return;

    // The sliders/filter-toggle control is redundant in this shared Row/Calendar toolbar.
    // Remove only that quick-row button; the main Admission filters control remains intact.
    [...quickRow.querySelectorAll('[data-amsl-action="filter-toggle"]')]
      .find(button => button.querySelector('.fa-sliders'))
      ?.remove();

    if (!viewState.toolbarPlaceholder) {
      viewState.toolbarPlaceholder = document.createComment('AMS Student Pipeline toolbar position');
      toolbar.parentNode?.insertBefore(viewState.toolbarPlaceholder, toolbar);
    }

    let toggle = quickRow.querySelector(`[${VIEW_TOGGLE_ATTR}]`);
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.setAttribute(VIEW_TOGGLE_ATTR, 'calendar');
      expandButton.insertAdjacentElement('afterend', toggle);
      syncViewToggle(toggle, 'row');
    }

    if (toolbar.dataset.amsViewToggleBound !== 'true') {
      toolbar.dataset.amsViewToggleBound = 'true';
      toolbar.addEventListener('click', event => {
        const viewToggle = event.target.closest(`[${VIEW_TOGGLE_ATTR}]`);
        if (viewToggle) {
          event.preventDefault();
          event.stopPropagation();
          if (viewToggle.dataset.amslViewToggle === 'row') openRowView(toolbar, viewToggle);
          else openCalendarView(toolbar, viewToggle);
          return;
        }

        if (toolbar.closest('#screen-calendar')) {
          list.handleClick(event);
        }
      });
      toolbar.addEventListener('input', event => {
        if (toolbar.closest('#screen-calendar')) list.handleFilter(event);
      });
      toolbar.addEventListener('change', event => {
        if (toolbar.closest('#screen-calendar')) list.handleFilter(event);
      });
    }
  }

  function install() {
    if (window[INSTALL_FLAG]) return true;
    if (!window.AMSStudentList || !window.AMSAdmissionOps) return false;
    window[INSTALL_FLAG] = true;

    const list = window.AMSStudentList;
    const ops = window.AMSAdmissionOps;

    // Existing Student Pipeline data enrichment remains scoped to the expanded row.
    const originalNormalizeStudent = list.normalizeStudent.bind(list);
    list.normalizeStudent = function patchedNormalizeStudent(student, index) {
      const row = originalNormalizeStudent(student, index);
      const personal = row.otrRecord?.personal || {};
      return {
        ...row,
        courseId: courseId(row),
        enquiryId: enquiryId(row),
        religion: row.religion || personal.religion || 'Not recorded',
        residency: residency(row),
        registeredOn: row.registeredOn || row.admissionDateTime || row.createdAt || '',
        counsellor: row.counsellor || row.owner || 'Admission Desk'
      };
    };

    // Stage/Status continues to reuse the existing AMS Follow-Up form.
    const originalHandleRowAction = ops.handleRowAction.bind(ops);
    ops.handleRowAction = function patchedHandleRowAction(action, row) {
      if (action === 'stage') {
        window.AMSStudentList.state.openMenuKey = '';
        this.showFollowup(row.key);
        return true;
      }
      return originalHandleRowAction(action, row);
    };

    // Preserve the existing expanded drawer changes from the prior requirement set.
    list.renderExtendedRow = function renderRequiredExtendedRow(row) {
      const empty = '—';
      const details = [
        ['LAST MODIFIED', row.updatedAt || row.admissionDateTime ? this.formatDateTime(row.updatedAt || row.admissionDateTime) : empty],
        ['NEXT MILESTONE', nextMilestone(row)],
        ['REGISTERED ON', row.registeredOn ? formatDateTime(row.registeredOn) : (row.admissionDateTime ? this.formatDateTime(row.admissionDateTime) : empty)],
        ['GENDER', row.gender || 'Not recorded'],
        ['RELIGION', row.religion || row.otrRecord?.personal?.religion || 'Not recorded'],
        ['RESIDENCY', residency(row)],
        ['COUNSELLOR', row.counsellor || row.owner || 'Admission Desk'],
        ['EXAM SCORE', examScore(row)],
        ['INTERVIEW OUTCOME', interviewOutcome(row)],
        ['FINAL DECISION', finalDecision(row)],
        ['LATEST UPDATE', latestUpdate(row)],
        ['OTR FORM STARTED', otrStarted(row)]
      ];

      return `<section class="ams-admission-extended ams-admission-extended--row amsl-inline-drawer">
        <div class="ams-admission-summary">
          <div class="ams-admission-photo-column ams-admission-photo-column--no-avatar">
            <strong>${this.escape(row.course || 'Course not assigned')}</strong>
            <span>${this.escape(row.batch || 'Class not allocated')}</span>
            <span>DOB: ${this.escape(row.dateOfBirth ? this.formatShortDate(row.dateOfBirth) : empty)}</span>
            <span>OTR ID: ${this.escape(row.otrNo || empty)}</span>
            <span>MODE OF LEARNING: ${this.escape(row.mode || empty)}</span>
            <span>COURSE ID: ${this.escape(courseId(row))}</span>
            <span>ENQUIRY ID: ${this.escape(enquiryId(row))}</span>
          </div>
          <div class="ams-admission-info-grid">${details.map(([label, value]) => `<div><span>${this.escape(label)}</span><strong>${this.escape(value || empty)}</strong></div>`).join('')}</div>
        </div>
        <footer class="ams-admission-assignment">
          <span><i class="fas fa-user-circle"></i> Assigned to <strong>${this.escape(row.owner || 'Admission Desk')}</strong>${row.assignedDate ? ` on ${this.escape(this.formatDateTime(row.assignedDate))}` : ''}</span>
          <button type="button" data-amsl-row-action="assign" data-key="${this.escape(row.key)}" aria-label="Edit owner assignment"><i class="fas fa-pen"></i></button>
        </footer>
      </section>`;
    };

    // Keep AMS views that consume stage/status data synchronized after Follow-Up saves.
    window.addEventListener('ams:data-change', () => {
      window.AMSModule?.renderStatusTabs?.();
      window.AMSModule?.renderStudents?.();
      if (window.AMSDashboard?.initialized) window.AMSDashboard.render?.();
      if (document.getElementById('screen-calendar')?.classList.contains('active')) {
        window.AMSCalendar?.renderCalendar?.();
      }
    });

    // Admission Calendar stays implemented but remains absent from sidebar/mobile navigation.
    const app = getAmsApp();
    if (app) {
      const originalSetupSharedNavigation = app.setupSharedNavigation?.bind(app);
      if (originalSetupSharedNavigation) {
        app.setupSharedNavigation = function patchedSetupSharedNavigation() {
          const result = originalSetupSharedNavigation();
          removeCalendarNavigation();
          return result;
        };
      }

      const originalRenderMobileBottomNav = app.renderMobileBottomNav?.bind(app);
      if (originalRenderMobileBottomNav) {
        app.renderMobileBottomNav = function patchedRenderMobileBottomNav() {
          const result = originalRenderMobileBottomNav();
          removeCalendarNavigation();
          return result;
        };
      }
    }

    // Current Student Pipeline interaction requirements.
    ensureToolbarViewToggle(list);
    ensureRowActionAlignment();
    ensureFollowupForegroundLayer();
    bindStageStatusFollowupTriggers(ops);
    ensureCalendarNavigationGuard();

    // Re-render only the Student Pipeline so the existing scoped row/drawer mappings remain current.
    list.populateFilters?.();
    list.render?.();
    return true;
  }

  function boot() {
    if (install()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 100) window.clearInterval(timer);
    }, 25);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();