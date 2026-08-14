// ============================================================
// AMS INTERVIEW MANAGEMENT REFINEMENT BOOTSTRAP
// Preserves the existing refinement core and layers Scheduled / Completed actions.
// Scope: AMS -> Interview Management only.
// ============================================================

(() => {
  const ACTION_FLAG = '__amsInterviewActionRefinementsInstalled';
  const CORE_SELECTOR = 'script[data-ams-interview-management-core]';

  function ensureActionStyles() {
    if (document.getElementById('ams-interview-action-refinements-style')) return;
    const style = document.createElement('style');
    style.id = 'ams-interview-action-refinements-style';
    style.textContent = `
      #screen-ams-interviews #ams-interview-root .imia-stage-actions { display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
      #ams-interview-modal .imia-result-summary { display:grid;gap:12px; }
      #ams-interview-modal .imia-result-summary-head { display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--bg-subtle); }
      #ams-interview-modal .imia-result-summary-head strong { color:var(--text-primary);font-size:11px; }
      #ams-interview-modal .imia-result-summary-head span { color:var(--text-muted);font-size:9px; }
      #ams-interview-modal .imia-result-table { min-width:760px; }
      #ams-interview-modal .imia-result-table td { vertical-align:middle; }
      #ams-interview-modal .imia-result-score { font-weight:800;color:var(--primary);white-space:nowrap; }
      #ams-interview-modal .imia-result-remarks { max-width:240px;white-space:normal;line-height:1.4; }
      @media(max-width:720px){#ams-interview-modal .imia-result-summary-head{align-items:flex-start;flex-direction:column;}}
    `;
    document.head.appendChild(style);
  }

  function currentStageIds(interviews) {
    return [...interviews.selectedRows].filter(id => {
      const item = interviews.interviews.find(row => row.id === id);
      return item && interviews.stageKeyForInterview(item) === interviews.state.activeKpi;
    });
  }

  function modalIsOpen() {
    return document.getElementById('ams-interview-modal')?.getAttribute('aria-hidden') === 'false';
  }

  function installActions() {
    if (window[ACTION_FLAG]) return true;
    const interviews = window.AMSInterviews;
    if (!interviews || !window.__amsInterviewManagementRefinementsInstalled) return false;
    window[ACTION_FLAG] = true;
    ensureActionStyles();

    const previous = {
      renderBulkBar: interviews.renderBulkBar?.bind(interviews),
      renderStageRowActions: interviews.renderStageRowActions?.bind(interviews),
      handleRowAction: interviews.handleRowAction?.bind(interviews),
      handleBulkAction: interviews.handleBulkAction?.bind(interviews)
    };

    interviews.renderStageRowActions = function renderSynchronizedStageActions(item) {
      const stage = this.stageKeyForInterview(item);
      if (stage === 'scheduled') {
        return `<div class="im-stage-actions imia-stage-actions"><button type="button" class="im-stage-action" data-im-row-action="scheduled-edit" data-id="${this.escape(item.id)}"><i class="fas fa-pen"></i> Edit</button><button type="button" class="im-stage-action" data-im-row-action="scheduled-start" data-id="${this.escape(item.id)}"><i class="fas fa-play"></i> Start Interview</button><button type="button" class="im-stage-action" data-im-row-action="view-result-stage" data-id="${this.escape(item.id)}"><i class="fas fa-eye"></i> View Result</button></div>`;
      }
      if (stage === 'completed') {
        return `<div class="im-stage-actions imia-stage-actions"><button type="button" class="im-stage-action" data-im-row-action="view-result-stage" data-id="${this.escape(item.id)}"><i class="fas fa-eye"></i> View Result</button><button type="button" class="im-stage-action" data-im-row-action="completed-reschedule" data-id="${this.escape(item.id)}"><i class="fas fa-calendar-plus"></i> Reschedule</button></div>`;
      }
      return previous.renderStageRowActions ? previous.renderStageRowActions(item) : '';
    };

    interviews.renderBulkBar = function renderSynchronizedBulkBar(pageRows) {
      const stage = this.state.activeKpi;
      if (!['scheduled', 'completed'].includes(stage)) {
        return previous.renderBulkBar ? previous.renderBulkBar(pageRows) : '';
      }
      const allChecked = pageRows.length && pageRows.every(item => this.selectedRows.has(item.id));
      const ids = currentStageIds(this);
      const count = ids.length;
      const disabled = count ? '' : 'disabled';
      const actions = stage === 'scheduled'
        ? `<button type="button" data-im-bulk="edit" ${disabled}><i class="fas fa-pen"></i> Edit</button><button type="button" data-im-bulk="start" ${disabled}><i class="fas fa-play"></i> Start Interview</button><button type="button" data-im-bulk="view-result" ${disabled}><i class="fas fa-eye"></i> View Result</button>`
        : `<button type="button" data-im-bulk="view-result" ${disabled}><i class="fas fa-eye"></i> View Result</button><button type="button" data-im-bulk="reschedule" ${disabled}><i class="fas fa-calendar-plus"></i> Reschedule</button>`;
      return `<div class="im-bulk-bar"><label class="im-check-label"><input type="checkbox" data-im-select-all ${allChecked ? 'checked' : ''} /><span>${count} selected</span></label>${actions}</div>`;
    };

    interviews.openScheduledEditForm = function openScheduledEditForm(id) {
      const item = this.interviews.find(row => row.id === id);
      if (!item) return;
      this.openPendingScheduleForm(id);
      const title = document.getElementById('im-modal-title');
      if (title) title.textContent = 'Edit Interview';
      const subtitle = document.querySelector('#ams-interview-modal .imia-modal-subtitle');
      if (subtitle) subtitle.textContent = `Update the scheduled interview details for ${item.name}.`;
      const form = document.getElementById('imia-single-assign-form');
      if (!form) return;
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.innerHTML = '<i class="fas fa-floppy-disk"></i> Save Changes';
    };

    interviews.openBulkScheduledEditForm = function openBulkScheduledEditForm(ids) {
      if (!ids.length) return;
      if (ids.length === 1) return this.openScheduledEditForm(ids[0]);
      this.openBulkInterviewAssignForm(ids);
      const title = document.getElementById('im-modal-title');
      if (title) title.textContent = 'Edit Selected Interviews';
      const subtitle = document.querySelector('#ams-interview-modal .imia-modal-subtitle');
      if (subtitle) subtitle.textContent = `Update scheduling details for ${ids.length} selected interviews.`;
      const submit = document.querySelector('#imia-bulk-assign-form button[type="submit"]');
      if (submit) submit.innerHTML = '<i class="fas fa-floppy-disk"></i> Save Changes';
    };

    interviews.openInterviewResultView = function openInterviewResultView(id, nested = false) {
      return this.openInterviewDetail(id, false, nested ? { nested: true } : {});
    };

    interviews.openBulkInterviewResults = function openBulkInterviewResults(ids) {
      const rows = ids.map(id => this.interviews.find(item => item.id === id)).filter(Boolean);
      if (!rows.length) return;
      if (rows.length === 1) return this.openInterviewResultView(rows[0].id);
      this.openModal('Interview Results', `<div class="imia-result-summary"><div class="imia-result-summary-head"><div><strong>${rows.length} selected interview results</strong><span>Open any result for complete student, course, structure, evaluation, score and remarks details.</span></div></div><div class="im-table-wrap"><table class="im-table imia-result-table"><thead><tr><th>Student</th><th>Course</th><th>Interview Structure</th><th>Status</th><th>Score / Outcome</th><th>Remarks</th><th>Action</th></tr></thead><tbody>${rows.map(item => { const structure = this.structureById(item.structureId); return `<tr><td><strong>${this.escape(item.name || '—')}</strong><small>${this.escape(this.otrIdForInterview(item) || item.studentId || '—')}</small></td><td>${this.escape(item.course || '—')}</td><td>${this.escape(structure?.name || 'Not mapped')}</td><td><span class="im-status ${this.statusClass(item.status)}">${this.escape(item.status || '—')}</span></td><td class="imia-result-score">${item.score ? `${this.escape(item.score)}/100` : '—'}</td><td class="imia-result-remarks">${this.escape(item.remarks || 'No remarks recorded')}</td><td><button type="button" class="im-stage-action" data-im-row-action="view-result-stage" data-id="${this.escape(item.id)}"><i class="fas fa-eye"></i> View Result</button></td></tr>`; }).join('')}</tbody></table></div></div>`, 'lg');
    };

    interviews.startSelectedInterviews = function startSelectedInterviews(ids) {
      const rows = ids.map(id => this.interviews.find(item => item.id === id)).filter(Boolean);
      if (!rows.length) return;
      rows.forEach(item => { item.status = 'In Progress'; item.score = ''; });
      this.selectedRows.clear();
      this.saveInterviews();
      this.state.activeKpi = 'scheduled';
      this.state.page = 1;
      this.render();
      this.openInterviewDetail(rows[0].id);
    };

    interviews.handleRowAction = function handleRefinedInterviewRowAction(action, id) {
      if (action === 'scheduled-edit') return this.openScheduledEditForm(id);
      if (action === 'scheduled-start') return this.setInterviewStatus(id, 'In Progress', true);
      if (action === 'view-result-stage') return this.openInterviewResultView(id, modalIsOpen());
      if (action === 'completed-reschedule') return this.openStageRescheduleForm(id);
      return previous.handleRowAction ? previous.handleRowAction(action, id) : undefined;
    };

    interviews.handleBulkAction = function handleRefinedInterviewBulkAction(action) {
      const stage = this.state.activeKpi;
      const ids = currentStageIds(this);
      if (stage === 'scheduled' && action === 'edit') return this.openBulkScheduledEditForm(ids);
      if (stage === 'scheduled' && action === 'start') return this.startSelectedInterviews(ids);
      if (stage === 'scheduled' && action === 'view-result') return this.openBulkInterviewResults(ids);
      if (stage === 'completed' && action === 'view-result') return this.openBulkInterviewResults(ids);
      if (stage === 'completed' && action === 'reschedule') return ids.length === 1 ? this.openStageRescheduleForm(ids[0]) : this.openBulkReschedule(ids);
      return previous.handleBulkAction ? previous.handleBulkAction(action) : undefined;
    };

    this?.noop;
    interviews.render();
    return true;
  }

  function waitForCore() {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (installActions() || attempts >= 240) window.clearInterval(timer);
    }, 25);
  }

  function loadCore() {
    const existing = document.querySelector(CORE_SELECTOR);
    if (existing) return waitForCore();
    const script = document.createElement('script');
    script.src = 'js/ams-interview-management-refinements-core.js';
    script.dataset.amsInterviewManagementCore = 'true';
    script.addEventListener('load', waitForCore, { once: true });
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadCore, { once: true });
  else loadCore();
})();
