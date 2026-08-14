// ============================================================
// AMS INTERVIEW MANAGEMENT REFINEMENT BOOTSTRAP
// Preserves the existing refinement core and layers Scheduled / Completed actions.
// Scope: AMS -> Interview Management only.
// ============================================================

(() => {
  const ACTION_FLAG = '__amsInterviewActionRefinementsInstalled';
  const CORE_SELECTOR = 'script[data-ams-interview-management-core]';
  const INTERVIEW_TYPES = ['Academic', 'Non-Academic', 'Both'];

  function normalize(value) {
    return String(value ?? '').trim();
  }

  function digits(value) {
    return normalize(value).replace(/\D/g, '');
  }

  function normalizeInterviewType(value) {
    const source = value && typeof value === 'object'
      ? (value.value ?? value.label ?? value.name ?? '')
      : value;
    const compact = normalize(source)
      .toLowerCase()
      .replace(/[–—_]/g, '-')
      .replace(/\s*-\s*/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    if (!compact) return '';
    if (compact === 'academic' || compact === 'academic interview') return 'Academic';
    if (['non-academic', 'nonacademic', 'non academic', 'non-academic interview', 'nonacademic interview', 'non academic interview'].includes(compact)) return 'Non-Academic';
    if (['both', 'academic/non-academic', 'academic/non academic', 'academic & non-academic', 'academic & non academic', 'academic and non-academic', 'academic and non academic', 'academic + non-academic', 'academic + non academic'].includes(compact)) return 'Both';
    return '';
  }

  function storedInterviewType(item) {
    if (!item) return '';
    const candidates = [
      item.interviewType,
      item.interview_type,
      item.interviewTypeValue,
      item.typeOfInterview,
      item.type_of_interview,
      item.interviewCategory,
      item.interview_category,
      item.schedule?.interviewType,
      item.schedule?.interview_type,
      item.scheduling?.interviewType,
      item.scheduling?.interview_type,
      item.assignment?.interviewType,
      item.assignment?.interview_type,
      item.assignmentDetails?.interviewType,
      item.metadata?.interviewType,
      item.details?.interviewType
    ];
    for (const candidate of candidates) {
      const type = normalizeInterviewType(candidate);
      if (type) return type;
    }
    return '';
  }

  function canonicalizePersistedInterviewTypes(interviews) {
    let changed = false;
    interviews.interviews.forEach(item => {
      const type = storedInterviewType(item);
      if (type && item.interviewType !== type) {
        item.interviewType = type;
        changed = true;
      }
    });
    if (changed) interviews.saveInterviews();
    return changed;
  }

  function sameStudent(left, right) {
    if (!left || !right) return false;
    const a = {
      admissionKey: normalize(left.admissionKey),
      admissionNo: normalize(left.admissionNo),
      studentId: normalize(left.studentId),
      inquiryId: normalize(left.inquiryId),
      otr: normalize(left.otr?.otrNo || left.otrNo).toLowerCase(),
      email: normalize(left.email || left.otr?.personal?.email).toLowerCase(),
      phone: digits(left.phone || left.otr?.personal?.phone)
    };
    const b = {
      admissionKey: normalize(right.admissionKey),
      admissionNo: normalize(right.admissionNo),
      studentId: normalize(right.studentId),
      inquiryId: normalize(right.inquiryId),
      otr: normalize(right.otr?.otrNo || right.otrNo).toLowerCase(),
      email: normalize(right.email || right.otr?.personal?.email).toLowerCase(),
      phone: digits(right.phone || right.otr?.personal?.phone)
    };
    return Boolean(
      (a.otr && b.otr && a.otr === b.otr)
      || (a.admissionKey && b.admissionKey && a.admissionKey === b.admissionKey)
      || (a.admissionNo && b.admissionNo && a.admissionNo === b.admissionNo)
      || (a.studentId && b.studentId && a.studentId === b.studentId)
      || (a.inquiryId && b.inquiryId && a.inquiryId === b.inquiryId)
      || (a.email && b.email && a.email === b.email)
      || (a.phone && b.phone && a.phone === b.phone)
    );
  }

  function isCanceled(item) {
    return ['cancelled', 'canceled'].includes(normalize(item?.status).toLowerCase());
  }

  function ensureActionStyles() {
    if (document.getElementById('ams-interview-action-refinements-style')) return;
    const style = document.createElement('style');
    style.id = 'ams-interview-action-refinements-style';
    style.textContent = `
      #screen-ams-interviews #ams-interview-root .imia-stage-actions { display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
      #screen-ams-interviews #ams-interview-root .imia-stage-actions .imia-new-interview { border-color:color-mix(in srgb,var(--primary) 32%,var(--border));color:var(--primary); }
      #screen-ams-interviews #ams-interview-root .imia-stage-actions .imia-new-interview:hover { border-color:var(--primary);background:var(--primary-light); }
      #ams-interview-modal .imia-result-summary { display:grid;gap:12px; }
      #ams-interview-modal .imia-result-summary-head { display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--bg-subtle); }
      #ams-interview-modal .imia-result-summary-head strong { color:var(--text-primary);font-size:11px; }
      #ams-interview-modal .imia-result-summary-head span { color:var(--text-muted);font-size:9px; }
      #ams-interview-modal .imia-result-table { min-width:860px; }
      #ams-interview-modal .imia-result-table td { vertical-align:middle; }
      #ams-interview-modal .imia-result-score { font-weight:800;color:var(--primary);white-space:nowrap; }
      #ams-interview-modal .imia-result-remarks { max-width:240px;white-space:normal;line-height:1.4; }
      #screen-ams-interviews #ams-interview-root .im-stage-table.completed { min-width:1180px; }
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

  function injectInterviewTypeIntoDetail(interviews, item) {
    const modal = document.getElementById('ams-interview-modal');
    if (!modal || !item) return;
    const section = [...modal.querySelectorAll('.im-detail-section')].find(node =>
      normalize(node.querySelector('header strong')?.textContent) === 'Interview Information'
    );
    const list = section?.querySelector('dl');
    if (!list || list.querySelector('[data-imia-interview-type-detail]')) return;
    const row = document.createElement('div');
    row.dataset.imiaInterviewTypeDetail = 'true';
    const type = storedInterviewType(item) || 'Not recorded';
    row.innerHTML = `<dt>Interview Type</dt><dd>${interviews.escape(type)}</dd>`;
    const statusRow = [...list.children].find(child => normalize(child.querySelector('dt')?.textContent) === 'Current Status');
    if (statusRow) list.insertBefore(row, statusRow);
    else list.appendChild(row);
  }

  function installActions() {
    if (window[ACTION_FLAG]) return true;
    const interviews = window.AMSInterviews;
    if (!interviews || !window.__amsInterviewManagementRefinementsInstalled) return false;
    window[ACTION_FLAG] = true;
    ensureActionStyles();

    const previous = {
      stageColumns: interviews.stageColumns?.bind(interviews),
      renderStageInterviewRow: interviews.renderStageInterviewRow?.bind(interviews),
      renderBulkBar: interviews.renderBulkBar?.bind(interviews),
      renderStageRowActions: interviews.renderStageRowActions?.bind(interviews),
      handleRowAction: interviews.handleRowAction?.bind(interviews),
      handleBulkAction: interviews.handleBulkAction?.bind(interviews)
    };

    canonicalizePersistedInterviewTypes(interviews);

    interviews.interviewHistoryFor = function interviewHistoryFor(item) {
      return this.interviews.filter(candidate => sameStudent(item, candidate));
    };

    interviews.remainingInterviewTypeFor = function remainingInterviewTypeFor(item) {
      const history = this.interviewHistoryFor(item);
      const completed = history.filter(candidate => normalize(candidate.status).toLowerCase() === 'completed');
      if (completed.length !== 1) return '';
      const completedType = storedInterviewType(completed[0]);
      if (!['Academic', 'Non-Academic'].includes(completedType)) return '';
      const remaining = completedType === 'Academic' ? 'Non-Academic' : 'Academic';
      const alreadyCovered = history.some(candidate => {
        if (candidate === completed[0] || isCanceled(candidate)) return false;
        const type = storedInterviewType(candidate);
        return type === 'Both' || type === remaining;
      });
      return alreadyCovered ? '' : remaining;
    };

    interviews.nextInterviewRecordId = function nextInterviewRecordId() {
      const max = this.interviews.reduce((largest, item) => {
        const match = normalize(item.id || item.interviewNumber).match(/(\d+)/g);
        const value = match?.length ? Number(match.join('')) : 0;
        return Number.isFinite(value) ? Math.max(largest, value) : largest;
      }, 0);
      return `IV-${String(max + 1).padStart(8, '0')}`;
    };

    interviews.renderStoredInterviewTypeTag = function renderStoredInterviewTypeTag(item) {
      const type = storedInterviewType(item);
      if (!type) return '—';
      const typeClass = type.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
      return `<span class="imia-type-tag ${typeClass}">${this.escape(type)}</span>`;
    };

    interviews.stageColumns = function lifecycleStageColumns() {
      const columns = previous.stageColumns ? previous.stageColumns() : [];
      if (this.state.activeKpi !== 'completed' || columns.some(([key]) => key === 'interviewType')) return columns;
      const next = columns.map(column => [...column]);
      const modeIndex = next.findIndex(([key]) => key === 'mode');
      const insertAt = modeIndex >= 0 ? modeIndex + 1 : Math.max(0, next.length - 1);
      next.splice(insertAt, 0, ['interviewType', 'Interview Type']);
      return next;
    };

    interviews.renderStageInterviewRow = function lifecycleStageInterviewRow(item, columns, index) {
      if (this.state.activeKpi !== 'completed') {
        return previous.renderStageInterviewRow ? previous.renderStageInterviewRow(item, columns, index) : '';
      }
      const values = {
        name: `<div class="im-candidate"><span class="im-avatar">${this.initials(item.name)}</span><div><strong>${this.escape(item.name)}</strong><small>${this.escape(item.email || item.phone || '')}</small></div></div>`,
        otr: `<span class="im-otr-value">${this.escape(this.otrIdForInterview(item, index))}</span>`,
        course: this.escape(item.course || '—'),
        batch: this.escape(item.batch || '—'),
        learningMode: this.escape(item.learningMode || item.mode || '—'),
        datetime: item.datetime ? `<strong>${this.formatDate(item.datetime)}</strong><small>${this.formatTime(item.datetime)}</small>` : '—',
        mode: item.mode ? `<span class="im-mode ${normalize(item.mode).toLowerCase() === 'online' ? 'online' : 'person'}"><i class="fas ${normalize(item.mode).toLowerCase() === 'online' ? 'fa-display' : 'fa-building'}"></i>${this.escape(item.mode)}</span>` : '—',
        interviewType: this.renderStoredInterviewTypeTag(item),
        score: item.score ? `${this.escape(item.score)}/100` : '—',
        actions: this.renderStageRowActions(item)
      };
      return `<tr data-im-stage-row="${this.escape(item.id)}"><td><input type="checkbox" data-im-select="${this.escape(item.id)}" ${this.selectedRows.has(item.id) ? 'checked' : ''} /></td>${columns.map(([key]) => `<td>${values[key] ?? '—'}</td>`).join('')}</tr>`;
    };

    interviews.renderStageRowActions = function renderSynchronizedStageActions(item) {
      const stage = this.stageKeyForInterview(item);
      if (stage === 'scheduled') {
        return `<div class="im-stage-actions imia-stage-actions"><button type="button" class="im-stage-action" data-im-row-action="scheduled-edit" data-id="${this.escape(item.id)}"><i class="fas fa-pen"></i> Edit</button><button type="button" class="im-stage-action" data-im-row-action="scheduled-start" data-id="${this.escape(item.id)}"><i class="fas fa-play"></i> Start Interview</button></div>`;
      }
      if (stage === 'completed') {
        const remainingType = this.remainingInterviewTypeFor(item);
        return `<div class="im-stage-actions imia-stage-actions"><button type="button" class="im-stage-action" data-im-row-action="view-result-stage" data-id="${this.escape(item.id)}"><i class="fas fa-eye"></i> View Result</button><button type="button" class="im-stage-action" data-im-row-action="completed-reschedule" data-id="${this.escape(item.id)}"><i class="fas fa-calendar-plus"></i> Reschedule</button>${remainingType ? `<button type="button" class="im-stage-action imia-new-interview" data-im-row-action="completed-new-interview" data-id="${this.escape(item.id)}" title="Schedule ${this.escape(remainingType)} interview"><i class="fas fa-plus"></i> New Interview</button>` : ''}</div>`;
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
      let actions = '';
      if (stage === 'scheduled') {
        actions = `<button type="button" data-im-bulk="edit" ${disabled}><i class="fas fa-pen"></i> Edit</button><button type="button" data-im-bulk="start" ${disabled}><i class="fas fa-play"></i> Start Interview</button>`;
      } else {
        const selectedItems = ids.map(id => this.interviews.find(item => item.id === id)).filter(Boolean);
        const allEligible = selectedItems.length > 0 && selectedItems.every(item => Boolean(this.remainingInterviewTypeFor(item)));
        actions = `<button type="button" data-im-bulk="view-result" ${disabled}><i class="fas fa-eye"></i> View Result</button><button type="button" data-im-bulk="reschedule" ${disabled}><i class="fas fa-calendar-plus"></i> Reschedule</button>${allEligible ? `<button type="button" data-im-bulk="new-interview"><i class="fas fa-plus"></i> New Interview</button>` : ''}`;
      }
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
      const item = this.interviews.find(row => row.id === id);
      if (!item) return;
      this.openInterviewDetail(id, false, nested ? { nested: true } : {});
      injectInterviewTypeIntoDetail(this, item);
    };

    interviews.openBulkInterviewResults = function openBulkInterviewResults(ids) {
      const rows = ids.map(id => this.interviews.find(item => item.id === id)).filter(Boolean);
      if (!rows.length) return;
      if (rows.length === 1) return this.openInterviewResultView(rows[0].id);
      this.openModal('Interview Results', `<div class="imia-result-summary"><div class="imia-result-summary-head"><div><strong>${rows.length} selected interview results</strong><span>Open any result for complete student, course, interview type, structure, evaluation, score and remarks details.</span></div></div><div class="im-table-wrap"><table class="im-table imia-result-table"><thead><tr><th>Student</th><th>Course</th><th>Interview Type</th><th>Interview Structure</th><th>Status</th><th>Score / Outcome</th><th>Remarks</th><th>Action</th></tr></thead><tbody>${rows.map(item => { const structure = this.structureById(item.structureId); return `<tr><td><strong>${this.escape(item.name || '—')}</strong><small>${this.escape(this.otrIdForInterview(item) || item.studentId || '—')}</small></td><td>${this.escape(item.course || '—')}</td><td>${this.renderStoredInterviewTypeTag(item)}</td><td>${this.escape(structure?.name || 'Not mapped')}</td><td><span class="im-status ${this.statusClass(item.status)}">${this.escape(item.status || '—')}</span></td><td class="imia-result-score">${item.score ? `${this.escape(item.score)}/100` : '—'}</td><td class="imia-result-remarks">${this.escape(item.remarks || 'No remarks recorded')}</td><td><button type="button" class="im-stage-action" data-im-row-action="view-result-stage" data-id="${this.escape(item.id)}"><i class="fas fa-eye"></i> View Result</button></td></tr>`; }).join('')}</tbody></table></div></div>`, 'lg');
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
      injectInterviewTypeIntoDetail(this, rows[0]);
    };

    interviews.openRemainingInterviewForm = function openRemainingInterviewForm(sourceId, options = {}) {
      const source = this.interviews.find(item => item.id === sourceId);
      const remainingType = source ? this.remainingInterviewTypeFor(source) : '';
      if (!source || !remainingType) return;

      this.openPendingScheduleForm(sourceId);
      const title = document.getElementById('im-modal-title');
      if (title) title.textContent = `Interview Schedule for ${source.name}`;
      const subtitle = document.querySelector('#ams-interview-modal .imia-modal-subtitle');
      if (subtitle) subtitle.textContent = `Schedule the remaining ${remainingType} interview without changing the completed interview.`;
      const form = document.getElementById('imia-single-assign-form');
      if (!form) return;

      const defaults = {
        structureId: '',
        date: this.dateKey(new Date()),
        startTime: '',
        endTime: '',
        interviewerId: '',
        mode: source.mode || '',
        interviewType: remainingType
      };
      Object.entries(defaults).forEach(([name, value]) => {
        if (form.elements[name]) form.elements[name].value = value;
      });
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.innerHTML = '<i class="fas fa-plus"></i> Schedule New Interview';

      form.addEventListener('submit', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.currentTarget.reportValidity()) return;
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        if (data.endTime <= data.startTime) {
          event.currentTarget.elements.endTime.setCustomValidity('End Time must be later than Start Time.');
          event.currentTarget.elements.endTime.reportValidity();
          return;
        }
        event.currentTarget.elements.endTime.setCustomValidity('');
        const newId = this.nextInterviewRecordId();
        const newInterview = {
          ...source,
          id: newId,
          interviewNumber: newId,
          parentInterviewId: source.id,
          structureId: data.structureId,
          datetime: `${data.date}T${data.startTime}`,
          endTime: data.endTime,
          interviewerId: data.interviewerId,
          mode: data.mode,
          interviewType: storedInterviewType({ interviewType: data.interviewType }) || remainingType,
          status: 'Scheduled',
          score: '',
          evaluation: {},
          remarks: '',
          createdAt: new Date().toISOString()
        };
        delete newInterview.cancellationReason;
        this.interviews.push(newInterview);
        this.selectedRows.delete(source.id);
        this.saveInterviews();
        this.closeModal();
        this.render();
        if (typeof options.onSaved === 'function') options.onSaved(newInterview);
        else {
          this.state.activeKpi = 'scheduled';
          this.state.page = 1;
          this.render();
        }
      }, true);
    };

    interviews.openRemainingInterviewQueue = function openRemainingInterviewQueue(ids) {
      const queue = ids.filter(id => {
        const item = this.interviews.find(row => row.id === id);
        return item && this.remainingInterviewTypeFor(item);
      });
      if (!queue.length || queue.length !== ids.length) return;
      const next = () => {
        const id = queue.shift();
        if (!id) {
          this.selectedRows.clear();
          this.state.activeKpi = 'scheduled';
          this.state.page = 1;
          this.render();
          return;
        }
        this.openRemainingInterviewForm(id, { onSaved: () => window.setTimeout(next, 0) });
      };
      next();
    };

    interviews.handleRowAction = function handleRefinedInterviewRowAction(action, id) {
      if (action === 'scheduled-edit') return this.openScheduledEditForm(id);
      if (action === 'scheduled-start') {
        const item = this.interviews.find(row => row.id === id);
        this.setInterviewStatus(id, 'In Progress', true);
        if (item) injectInterviewTypeIntoDetail(this, item);
        return;
      }
      if (action === 'view-result-stage') return this.openInterviewResultView(id, modalIsOpen());
      if (action === 'completed-reschedule') return this.openStageRescheduleForm(id);
      if (action === 'completed-new-interview') return this.openRemainingInterviewForm(id);
      return previous.handleRowAction ? previous.handleRowAction(action, id) : undefined;
    };

    interviews.handleBulkAction = function handleRefinedInterviewBulkAction(action) {
      const stage = this.state.activeKpi;
      const ids = currentStageIds(this);
      if (stage === 'scheduled' && action === 'edit') return this.openBulkScheduledEditForm(ids);
      if (stage === 'scheduled' && action === 'start') return this.startSelectedInterviews(ids);
      if (stage === 'completed' && action === 'view-result') return this.openBulkInterviewResults(ids);
      if (stage === 'completed' && action === 'reschedule') return ids.length === 1 ? this.openStageRescheduleForm(ids[0]) : this.openBulkReschedule(ids);
      if (stage === 'completed' && action === 'new-interview') return this.openRemainingInterviewQueue(ids);
      return previous.handleBulkAction ? previous.handleBulkAction(action) : undefined;
    };

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
