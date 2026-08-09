// ============================================================
// AMS INTERVIEW STAGE WORKFLOW
// Scope: AMS -> Interview Scheduling only.
// Interview Structures are intentionally not modified here.
// ============================================================

(() => {
  const INSTALL_FLAG = '__amsInterviewStageWorkflowInstalled';
  const STAGES = {
    pending: {
      label: 'Pending Interview',
      tone: 'blue',
      icon: 'fa-hourglass-half',
      meta: 'Needs scheduling'
    },
    scheduled: {
      label: 'Scheduled Interview',
      tone: 'orange',
      icon: 'fa-calendar-check',
      meta: 'Waiting for interview'
    },
    completed: {
      label: 'Completed Interview',
      tone: 'green',
      icon: 'fa-circle-check',
      meta: 'Interview conducted'
    },
    canceled: {
      label: 'Canceled Interview',
      tone: 'red',
      icon: 'fa-ban',
      meta: 'Interview canceled'
    }
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

  function stageKey(item) {
    const status = String(item?.status || '').trim().toLowerCase();
    if (status === 'completed') return 'completed';
    if (status === 'cancelled' || status === 'canceled') return 'canceled';
    if (status === 'awaiting assignment' || status === 'pending') return 'pending';
    return 'scheduled';
  }

  function mappedOtrId(item, index = 0) {
    const direct = item?.otr?.otrNo || item?.otrNo || item?.admissionId;
    if (direct) return String(direct).toUpperCase();

    const records = window.AMSOTR?.getRecords?.() || [];
    const matched = records.find(record => {
      const email = String(record?.personal?.email || '').trim().toLowerCase();
      const phone = String(record?.personal?.phone || '').replace(/\D/g, '');
      return (email && email === String(item?.email || '').trim().toLowerCase())
        || (phone && phone === String(item?.phone || '').replace(/\D/g, ''));
    });
    if (matched?.otrNo) return String(matched.otrNo).toUpperCase();

    const source = String(item?.studentId || item?.id || index + 1).replace(/\D/g, '');
    const suffix = source.slice(-4).padStart(4, '0');
    return `PA26${suffix}`;
  }

  function uniqueValues(items, getter) {
    return [...new Set(items.map(getter).filter(value => value !== undefined && value !== null && String(value).trim()))]
      .map(String)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  function ensureStyles() {
    if (document.getElementById('ams-interview-stage-workflow-style')) return;
    const style = document.createElement('style');
    style.id = 'ams-interview-stage-workflow-style';
    style.textContent = `
      #screen-ams-interviews #ams-interview-root .im-layout.im-stage-layout {
        display: block;
      }

      #screen-ams-interviews #ams-interview-root .im-stage-layout > .im-main-column {
        width: 100%;
      }

      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-blue .im-kpi-icon {
        border-color: rgba(37, 99, 235, .22);
        background: rgba(37, 99, 235, .09);
        color: #2563eb;
      }
      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-blue .im-kpi-copy strong { color: #2563eb; }
      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-blue.active { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37, 99, 235, .10), var(--shadow-card); }

      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-orange .im-kpi-icon {
        border-color: rgba(234, 88, 12, .22);
        background: rgba(234, 88, 12, .09);
        color: #ea580c;
      }
      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-orange .im-kpi-copy strong { color: #ea580c; }
      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-orange.active { border-color: #ea580c; box-shadow: 0 0 0 2px rgba(234, 88, 12, .10), var(--shadow-card); }

      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-green .im-kpi-icon {
        border-color: rgba(22, 163, 74, .22);
        background: rgba(22, 163, 74, .09);
        color: #16a34a;
      }
      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-green .im-kpi-copy strong { color: #16a34a; }
      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-green.active { border-color: #16a34a; box-shadow: 0 0 0 2px rgba(22, 163, 74, .10), var(--shadow-card); }

      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-red .im-kpi-icon {
        border-color: rgba(220, 38, 38, .22);
        background: rgba(220, 38, 38, .08);
        color: #dc2626;
      }
      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-red .im-kpi-copy strong { color: #dc2626; }
      #screen-ams-interviews #ams-interview-root .im-kpi-card.stage-red.active { border-color: #dc2626; box-shadow: 0 0 0 2px rgba(220, 38, 38, .09), var(--shadow-card); }

      #screen-ams-interviews #ams-interview-root .im-stage-filters {
        grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
        align-items: end;
      }

      #screen-ams-interviews #ams-interview-root .im-stage-filters .im-reset {
        min-width: 72px;
      }

      #screen-ams-interviews #ams-interview-root .im-stage-table {
        min-width: 960px;
      }

      #screen-ams-interviews #ams-interview-root .im-stage-table.pending {
        min-width: 780px;
      }

      #screen-ams-interviews #ams-interview-root .im-stage-actions {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 6px;
        min-width: 92px;
      }

      #screen-ams-interviews #ams-interview-root .im-stage-action {
        min-height: 28px;
        padding: 5px 9px;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: var(--bg-card);
        color: var(--text-secondary);
        font-size: 8px;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        transition: var(--transition);
      }

      #screen-ams-interviews #ams-interview-root .im-stage-action:hover {
        border-color: var(--primary);
        background: var(--primary-light);
        color: var(--primary);
      }

      #screen-ams-interviews #ams-interview-root .im-stage-action.danger {
        border-color: color-mix(in srgb, var(--danger) 30%, var(--border));
        color: var(--danger);
      }

      #screen-ams-interviews #ams-interview-root .im-stage-action.danger:hover {
        border-color: var(--danger);
        background: color-mix(in srgb, var(--danger) 7%, #fff);
        color: var(--danger);
      }

      #screen-ams-interviews #ams-interview-root .im-stage-action.follow-up-static {
        cursor: default;
      }

      #screen-ams-interviews #ams-interview-root .im-stage-action.follow-up-static:hover {
        border-color: var(--border);
        background: var(--bg-card);
        color: var(--text-secondary);
      }

      #screen-ams-interviews #ams-interview-root .im-otr-value {
        display: inline-flex;
        padding: 3px 7px;
        border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--border));
        border-radius: 999px;
        background: var(--primary-light);
        color: var(--primary);
        font-size: 8px;
        font-weight: 800;
        white-space: nowrap;
      }

      #screen-ams-interviews #ams-interview-root .im-cancel-form-note,
      #screen-ams-interviews #ams-interview-root .im-reschedule-context {
        margin-bottom: 12px;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--bg-subtle);
        color: var(--text-secondary);
        font-size: 9px;
      }

      #screen-ams-interviews #ams-interview-root .im-stage-bulk-empty {
        color: var(--text-muted);
        font-size: 9px;
      }

      /* Calendar UI is intentionally disabled for this Interview Scheduling workflow.
         The original renderCalendar(), renderMonthCalendar() and renderScheduleOverview()
         implementations remain untouched in js/ams-interviews.js for later restoration. */
      #screen-ams-interviews #ams-interview-root .im-overview,
      #screen-ams-interviews #ams-interview-root .im-calendar-toolbar,
      #screen-ams-interviews #ams-interview-root .im-calendar-grid,
      #screen-ams-interviews #ams-interview-root .im-calendar-week,
      #screen-ams-interviews #ams-interview-root .im-calendar-day {
        display: none !important;
      }

      @media (max-width: 900px) {
        #screen-ams-interviews #ams-interview-root .im-stage-filters {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 620px) {
        #screen-ams-interviews #ams-interview-root .im-stage-filters {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (window[INSTALL_FLAG]) return true;
    const interviews = window.AMSInterviews;
    if (!interviews) return false;
    window[INSTALL_FLAG] = true;

    ensureStyles();

    const original = {
      render: interviews.render.bind(interviews),
      renderWorkspace: interviews.renderWorkspace.bind(interviews),
      handleClick: interviews.handleClick.bind(interviews),
      handleInput: interviews.handleInput.bind(interviews),
      handleRowAction: interviews.handleRowAction.bind(interviews),
      handleBulkAction: interviews.handleBulkAction.bind(interviews),
      resetFilters: interviews.resetFilters.bind(interviews),
      openScheduleForm: interviews.openScheduleForm.bind(interviews)
    };

    interviews.state.activeKpi = STAGES[interviews.state.activeKpi] ? interviews.state.activeKpi : 'pending';
    interviews.state.view = 'list';
    Object.assign(interviews.state.filters, {
      otr: interviews.state.filters.otr || '',
      batch: interviews.state.filters.batch || 'all',
      learningMode: interviews.state.filters.learningMode || 'all',
      examScore: interviews.state.filters.examScore || ''
    });

    interviews.stageKeyForInterview = stageKey;
    interviews.otrIdForInterview = mappedOtrId;

    interviews.render = function renderStageInterviewWorkflow() {
      const root = document.getElementById('ams-interview-root');
      if (!root) return;
      this.state.view = 'list';
      root.innerHTML = `
        ${this.renderHeader()}
        <div class="im-layout im-stage-layout">
          <div class="im-main-column">
            ${this.renderKpis()}
            ${this.renderWorkspace()}
            ${this.renderStructures()}
          </div>
          <!-- Calendar / Schedule Overview intentionally disabled.
               Original calendar implementation remains in js/ams-interviews.js. -->
        </div>
      `;
    };

    interviews.renderKpis = function renderStageKpis() {
      const counts = Object.keys(STAGES).reduce((map, key) => {
        map[key] = this.interviews.filter(item => stageKey(item) === key).length;
        return map;
      }, {});

      return `<section class="im-kpi-grid">${Object.entries(STAGES).map(([key, stage]) => `
        <button class="im-kpi-card stage-${stage.tone} ${this.state.activeKpi === key ? 'active' : ''}" type="button" data-im-kpi="${key}" aria-pressed="${this.state.activeKpi === key ? 'true' : 'false'}">
          <span class="im-kpi-icon"><i class="fas ${stage.icon}"></i></span>
          <span class="im-kpi-copy"><small>${stage.label}</small><strong>${counts[key]}</strong><em>${stage.meta}</em></span>
        </button>
      `).join('')}</section>`;
    };

    interviews.renderWorkspace = function renderStageWorkspace() {
      const visible = this.filteredInterviews();
      const stage = STAGES[this.state.activeKpi] || STAGES.pending;
      return `
        <section class="im-card im-workspace">
          <div class="im-workspace-head">
            <div><h2>${stage.label}</h2><span>${visible.length} interview record${visible.length === 1 ? '' : 's'}</span></div>
            <div class="im-workspace-head-actions">
              <label class="im-search"><i class="fas fa-search"></i><input id="im-search" data-im-filter="search" value="${this.escape(this.state.filters.search)}" placeholder="Search name, OTR ID, course, batch..." /></label>
              <!-- Calendar toggle intentionally disabled. -->
            </div>
          </div>
          ${this.renderFilters()}
          ${this.renderList(visible)}
        </section>
      `;
    };

    interviews.renderFilters = function renderStageFilters() {
      const f = this.state.filters;
      const currentStage = this.state.activeKpi;
      const stageRows = this.interviews.filter(item => stageKey(item) === currentStage);
      const batches = uniqueValues(stageRows, item => item.batch);
      const learningModes = uniqueValues(stageRows, item => item.learningMode || item.mode);
      const interviewModes = uniqueValues(stageRows, item => item.mode);
      const scores = uniqueValues(stageRows, item => item.score);
      const showScheduleFields = ['scheduled', 'completed', 'canceled'].includes(currentStage);
      const showExamScore = ['scheduled', 'completed'].includes(currentStage);

      return `
        <div class="im-filters im-stage-filters">
          <label><span>OTR ID</span><input type="text" data-im-filter="otr" value="${this.escape(f.otr || '')}" placeholder="PA260001" /></label>
          ${this.filterSelect('course', 'Course', this.courses, f.course)}
          ${this.filterSelect('batch', 'Batch', batches, f.batch || 'all')}
          ${this.filterSelect('learningMode', 'Learning Mode', learningModes, f.learningMode || 'all')}
          ${showScheduleFields ? `<label><span>From</span><input type="date" data-im-filter="from" value="${f.from || ''}" /></label><label><span>To</span><input type="date" data-im-filter="to" value="${f.to || ''}" /></label>${this.filterSelect('mode', 'Mode of Interview', interviewModes, f.mode || 'all')}` : ''}
          ${showExamScore ? this.filterSelect('examScore', 'Exam Score', scores, f.examScore || 'all') : ''}
          <button class="im-reset" type="button" data-im-action="reset"><i class="fas fa-rotate-left"></i> Reset</button>
        </div>
      `;
    };

    interviews.filteredInterviews = function filteredStageInterviews() {
      const f = this.state.filters;
      const activeStage = STAGES[this.state.activeKpi] ? this.state.activeKpi : 'pending';
      let rows = this.interviews.filter((item, index) => {
        if (stageKey(item) !== activeStage) return false;
        const otrId = mappedOtrId(item, index);
        const date = String(item.datetime || '').slice(0, 10);
        const searchText = `${item.name || ''} ${otrId} ${item.course || ''} ${item.batch || ''} ${item.email || ''} ${item.phone || ''}`.toLowerCase();
        return (!f.search || searchText.includes(String(f.search).toLowerCase()))
          && (!f.otr || otrId.toLowerCase().includes(String(f.otr).toLowerCase()))
          && (f.course === 'all' || !f.course || item.course === f.course)
          && (f.batch === 'all' || !f.batch || item.batch === f.batch)
          && (f.learningMode === 'all' || !f.learningMode || (item.learningMode || item.mode) === f.learningMode)
          && (!f.from || date >= f.from)
          && (!f.to || date <= f.to)
          && (f.mode === 'all' || !f.mode || item.mode === f.mode)
          && (f.examScore === 'all' || !f.examScore || String(item.score || '') === String(f.examScore));
      });

      const direction = this.state.sortDirection === 'desc' ? -1 : 1;
      const key = this.state.sortKey || 'datetime';
      rows = rows.slice().sort((a, b) => {
        const aValue = key === 'otr' ? mappedOtrId(a) : key === 'learningMode' ? (a.learningMode || a.mode || '') : (a[key] || '');
        const bValue = key === 'otr' ? mappedOtrId(b) : key === 'learningMode' ? (b.learningMode || b.mode || '') : (b[key] || '');
        return String(aValue).localeCompare(String(bValue), undefined, { numeric: true }) * direction;
      });
      return rows;
    };

    interviews.stageColumns = function stageColumns() {
      const stage = this.state.activeKpi;
      const master = [
        ['name', 'Name'],
        ['otr', 'OTR ID'],
        ['course', 'Course'],
        ['batch', 'Batch'],
        ['learningMode', 'Learning Mode'],
        ['datetime', 'Date / Time'],
        ['mode', 'Mode of Interview'],
        ['score', 'Exam Score'],
        ['actions', 'Actions']
      ];
      if (stage === 'pending') return master.filter(([key]) => !['datetime', 'mode', 'score'].includes(key));
      if (stage === 'canceled') return master.filter(([key]) => key !== 'score');
      return master;
    };

    interviews.renderBulkBar = function renderStageBulkBar(pageRows) {
      const stage = this.state.activeKpi;
      const allChecked = pageRows.length && pageRows.every(item => this.selectedRows.has(item.id));
      const count = this.selectedRows.size;
      const disabled = count ? '' : 'disabled';
      let actions = '';
      if (stage === 'pending') actions = `<button type="button" data-im-bulk="assign" ${disabled}>Assign</button>`;
      if (stage === 'scheduled') actions = `<button type="button" data-im-bulk="reschedule" ${disabled}>Reschedule</button><button type="button" data-im-bulk="cancel" ${disabled}>Cancel</button>`;
      if (stage === 'canceled') actions = `<button type="button" data-im-bulk="reschedule" ${disabled}>Reschedule</button><button type="button" data-im-bulk="delete" ${disabled}>Delete</button>`;
      if (stage === 'completed') actions = `<span class="im-stage-bulk-empty">No bulk action required for completed interviews.</span>`;
      return `<div class="im-bulk-bar"><label class="im-check-label"><input type="checkbox" data-im-select-all ${allChecked ? 'checked' : ''} /><span>${count} selected</span></label>${actions}</div>`;
    };

    interviews.renderList = function renderStageList(rows) {
      const columns = this.stageColumns();
      const totalPages = Math.max(1, Math.ceil(rows.length / this.state.pageSize));
      this.state.page = Math.min(this.state.page, totalPages);
      const start = (this.state.page - 1) * this.state.pageSize;
      const pageRows = rows.slice(start, start + this.state.pageSize);
      const stage = this.state.activeKpi;
      const sortable = new Set(['name', 'otr', 'course', 'batch', 'learningMode', 'datetime', 'mode', 'score']);
      const header = columns.map(([key, label]) => sortable.has(key) ? this.sortHeader(key, label) : `<th>${label}</th>`).join('');
      const colspan = columns.length + 1;
      return `
        ${this.renderBulkBar(pageRows)}
        <div class="im-table-wrap">
          <table class="im-table im-stage-table ${stage}">
            <thead><tr><th aria-label="Selection"></th>${header}</tr></thead>
            <tbody>${pageRows.length ? pageRows.map((item, index) => this.renderStageInterviewRow(item, columns, start + index)).join('') : `<tr><td colspan="${colspan}" class="im-empty">No ${escapeHtml((STAGES[stage]?.label || 'interview').toLowerCase())} records match the current filters.</td></tr>`}</tbody>
          </table>
        </div>
        <div class="im-pagination">
          <span>Showing ${rows.length ? start + 1 : 0} to ${Math.min(start + this.state.pageSize, rows.length)} of ${rows.length}</span>
          <label>Rows per page <select data-im-page-size><option ${this.state.pageSize === 8 ? 'selected' : ''}>8</option><option ${this.state.pageSize === 12 ? 'selected' : ''}>12</option><option ${this.state.pageSize === 20 ? 'selected' : ''}>20</option></select></label>
          <div>
            <button type="button" data-im-page="prev" ${this.state.page === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
            ${Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map(page => `<button type="button" data-im-page="${page}" class="${page === this.state.page ? 'active' : ''}">${page}</button>`).join('')}
            <button type="button" data-im-page="next" ${this.state.page === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
          </div>
        </div>
      `;
    };

    interviews.renderStageInterviewRow = function renderStageInterviewRow(item, columns, index) {
      const values = {
        name: `<div class="im-candidate"><span class="im-avatar">${this.initials(item.name)}</span><div><strong>${this.escape(item.name)}</strong><small>${this.escape(item.email || item.phone || '')}</small></div></div>`,
        otr: `<span class="im-otr-value">${this.escape(mappedOtrId(item, index))}</span>`,
        course: this.escape(item.course || '—'),
        batch: this.escape(item.batch || '—'),
        learningMode: this.escape(item.learningMode || item.mode || '—'),
        datetime: item.datetime ? `<strong>${this.formatDate(item.datetime)}</strong><small>${this.formatTime(item.datetime)}</small>` : '—',
        mode: item.mode ? `<span class="im-mode ${String(item.mode).toLowerCase() === 'online' ? 'online' : 'person'}"><i class="fas ${String(item.mode).toLowerCase() === 'online' ? 'fa-display' : 'fa-building'}"></i>${this.escape(item.mode)}</span>` : '—',
        score: item.score ? `${this.escape(item.score)}/100` : '—',
        actions: this.renderStageRowActions(item)
      };
      return `<tr data-im-stage-row="${item.id}"><td><input type="checkbox" data-im-select="${item.id}" ${this.selectedRows.has(item.id) ? 'checked' : ''} /></td>${columns.map(([key]) => `<td>${values[key] ?? '—'}</td>`).join('')}</tr>`;
    };

    interviews.renderStageRowActions = function renderStageRowActions(item) {
      const stage = stageKey(item);
      if (stage === 'pending') return `<div class="im-stage-actions"><button type="button" class="im-stage-action" data-im-row-action="assign-stage" data-id="${item.id}"><i class="fas fa-user-plus"></i> Assign</button></div>`;
      if (stage === 'scheduled') return `<div class="im-stage-actions"><button type="button" class="im-stage-action" data-im-row-action="reschedule-stage" data-id="${item.id}">Reschedule</button><button type="button" class="im-stage-action danger" data-im-row-action="cancel-stage" data-id="${item.id}">Cancel</button></div>`;
      if (stage === 'completed') return `<div class="im-stage-actions"><button type="button" class="im-stage-action follow-up-static">Follow Up</button></div>`;
      return `<div class="im-stage-actions"><button type="button" class="im-stage-action" data-im-row-action="reschedule-stage" data-id="${item.id}">Reschedule</button><button type="button" class="im-stage-action danger" data-im-row-action="delete-stage" data-id="${item.id}">Delete</button></div>`;
    };

    interviews.openPendingScheduleForm = function openPendingScheduleForm(id) {
      original.openScheduleForm(id, false);
      const form = document.getElementById('im-schedule-form');
      if (!form) return;
      const interviewer = form.elements.interviewerId;
      if (interviewer) {
        interviewer.required = true;
        const label = interviewer.closest('label')?.querySelector('span');
        if (label && !label.querySelector('b')) label.insertAdjacentHTML('beforeend', ' <b>*</b>');
      }
    };

    interviews.openStageRescheduleForm = function openStageRescheduleForm(ids) {
      const list = (Array.isArray(ids) ? ids : [ids]).map(id => this.interviews.find(item => item.id === id)).filter(Boolean);
      if (!list.length) return;
      if (list.length > 1) return this.openBulkReschedule(list.map(item => item.id));

      const item = list[0];
      const date = String(item.datetime || '').slice(0, 10) || this.dateKey(new Date());
      const time = String(item.datetime || '').slice(11, 16) || '10:00';
      const wasCanceled = stageKey(item) === 'canceled';
      this.openModal('Reschedule Interview', `
        <div class="im-reschedule-context"><strong>${this.escape(item.name)}</strong> · ${this.escape(mappedOtrId(item))}</div>
        <form class="im-form" id="im-stage-reschedule-form">
          <div class="im-form-grid">
            <label><span>Date <b>*</b></span><input type="date" name="date" value="${date}" required /></label>
            <label><span>Time <b>*</b></span><input type="time" name="time" value="${time}" required /></label>
            <label><span>Interviewer <b>*</b></span><select name="interviewerId" required><option value="">Select Interviewer</option>${this.interviewers.map(person => `<option value="${person.id}" ${person.id === item.interviewerId ? 'selected' : ''}>${this.escape(person.name)} · ${this.escape(person.department)}</option>`).join('')}</select></label>
            <label><span>Mode of Interview <b>*</b></span><select name="mode" required>${['Online', 'In-Person'].map(mode => `<option value="${mode}" ${mode === item.mode ? 'selected' : ''}>${mode}</option>`).join('')}</select></label>
          </div>
          <div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button type="submit" class="btn btn-primary">Save Reschedule</button></div>
        </form>
      `, 'md');
      document.getElementById('im-stage-reschedule-form')?.addEventListener('submit', event => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        item.datetime = `${data.date}T${data.time}`;
        item.interviewerId = data.interviewerId;
        item.mode = data.mode;
        item.learningMode = item.learningMode || item.mode;
        item.status = wasCanceled ? 'Scheduled' : 'Rescheduled';
        delete item.cancellationReason;
        this.saveInterviews();
        this.closeModal();
        this.selectedRows.delete(item.id);
        this.state.activeKpi = 'scheduled';
        this.state.page = 1;
        this.render();
      });
    };

    interviews.openStageCancelForm = function openStageCancelForm(ids) {
      const list = (Array.isArray(ids) ? ids : [ids]).map(id => this.interviews.find(item => item.id === id)).filter(Boolean);
      if (!list.length) return;
      const label = list.length === 1 ? `${list[0].name} · ${mappedOtrId(list[0])}` : `${list.length} selected interviews`;
      this.openModal('Cancel Interview', `
        <div class="im-cancel-form-note">${this.escape(label)}</div>
        <form class="im-form" id="im-stage-cancel-form">
          <label><span>Cancellation Reason <b>*</b></span><textarea name="reason" rows="4" required placeholder="Enter cancellation reason"></textarea></label>
          <div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Back</button><button type="submit" class="btn btn-danger">Confirm Cancel</button></div>
        </form>
      `, 'md');
      document.getElementById('im-stage-cancel-form')?.addEventListener('submit', event => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const reason = String(new FormData(event.currentTarget).get('reason') || '').trim();
        list.forEach(item => {
          item.status = 'Cancelled';
          item.cancellationReason = reason;
        });
        this.saveInterviews();
        this.closeModal();
        list.forEach(item => this.selectedRows.delete(item.id));
        this.state.activeKpi = 'canceled';
        this.state.page = 1;
        this.render();
      });
    };

    interviews.deleteStageInterviews = function deleteStageInterviews(ids) {
      const list = Array.isArray(ids) ? ids : [ids];
      if (!list.length) return;
      return this.confirmAction(
        list.length === 1 ? 'Delete interview?' : 'Delete selected interviews?',
        `${list.length} interview record${list.length === 1 ? '' : 's'} will be permanently removed. Student records will not be deleted.`,
        () => {
          this.interviews = this.interviews.filter(item => !list.includes(item.id));
          list.forEach(id => this.selectedRows.delete(id));
          this.saveInterviews();
          this.render();
        }
      );
    };

    interviews.handleRowAction = function handleStageRowAction(action, id) {
      if (action === 'assign-stage') return this.openPendingScheduleForm(id);
      if (action === 'reschedule-stage') return this.openStageRescheduleForm(id);
      if (action === 'cancel-stage') return this.openStageCancelForm(id);
      if (action === 'delete-stage') return this.deleteStageInterviews(id);
      return original.handleRowAction(action, id);
    };

    interviews.handleBulkAction = function handleStageBulkAction(action) {
      const ids = [...this.selectedRows].filter(id => {
        const item = this.interviews.find(row => row.id === id);
        return item && stageKey(item) === this.state.activeKpi;
      });
      if (!ids.length) return;
      if (this.state.activeKpi === 'pending' && action === 'assign') return this.openAssignmentForm(ids);
      if (this.state.activeKpi === 'scheduled' && action === 'reschedule') return this.openBulkReschedule(ids);
      if (this.state.activeKpi === 'scheduled' && action === 'cancel') return this.openStageCancelForm(ids);
      if (this.state.activeKpi === 'canceled' && action === 'reschedule') return this.openBulkReschedule(ids);
      if (this.state.activeKpi === 'canceled' && action === 'delete') return this.deleteStageInterviews(ids);
    };

    interviews.handleClick = function handleStageClick(event) {
      const kpi = event.target.closest('[data-im-kpi]')?.dataset.imKpi;
      if (kpi && STAGES[kpi]) {
        event.preventDefault();
        this.state.activeKpi = kpi;
        this.state.view = 'list';
        this.state.page = 1;
        this.selectedRows.clear();
        return this.render();
      }

      const action = event.target.closest('[data-im-action]')?.dataset.imAction;
      if (action === 'toggle-view') {
        event.preventDefault();
        this.state.view = 'list';
        return this.render();
      }

      return original.handleClick(event);
    };

    interviews.handleInput = function handleStageInput(event) {
      const filter = event.target.dataset.imFilter;
      if (filter === 'search' || filter === 'otr') {
        this.state.filters[filter] = event.target.value;
        this.state.page = 1;
        const cursor = event.target.selectionStart;
        this.render();
        requestAnimationFrame(() => {
          const input = document.querySelector(`[data-im-filter="${filter}"]`);
          input?.focus({ preventScroll: true });
          if (typeof cursor === 'number') input?.setSelectionRange(cursor, cursor);
        });
        return;
      }
      return original.handleInput(event);
    };

    interviews.resetFilters = function resetStageFilters() {
      Object.assign(this.state.filters, {
        search: '', otr: '', from: '', to: '', course: 'all', batch: 'all', learningMode: 'all',
        interviewer: 'all', structure: 'all', status: 'all', mode: 'all', examScore: 'all'
      });
      this.state.page = 1;
      this.render();
    };

    // Calendar UI is intentionally disabled instead of deleted.
    // The following existing implementation points remain available in AMSInterviews:
    // interviews.renderCalendar(...)
    // interviews.renderMonthCalendar(...)
    // interviews.renderScheduleOverview(...)
    // interviews.state.calendarView / calendarDate / selectedDate

    interviews.render();
    return true;
  }

  function boot() {
    if (install()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 160) window.clearInterval(timer);
    }, 25);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
