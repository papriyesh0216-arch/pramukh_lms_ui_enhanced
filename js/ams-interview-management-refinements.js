// ============================================================
// AMS INTERVIEW MANAGEMENT REFINEMENTS
// Scope: AMS -> Interview Scheduling / Interview Management only.
// Consumes Interview Structure + OTR data without modifying those modules.
// ============================================================

(() => {
  const INSTALL_FLAG = '__amsInterviewManagementRefinementsInstalled';
  const STAGE_FLAG = '__amsInterviewStageWorkflowInstalled';

  function normalize(value) {
    return String(value ?? '').trim();
  }

  function digits(value) {
    return normalize(value).replace(/\D/g, '');
  }

  function mappedOtrRecord(item) {
    const embedded = item?.otr && typeof item.otr === 'object' ? item.otr : null;
    const records = window.AMSOTR?.getRecords?.() || [];
    if (!records.length) return embedded;

    const itemOtr = normalize(embedded?.otrNo || item?.otrNo || item?.admissionId).toLowerCase();
    const itemEmail = normalize(item?.email || embedded?.personal?.email).toLowerCase();
    const itemPhone = digits(item?.phone || embedded?.personal?.phone);

    const matched = records.find(record => {
      const recordOtr = normalize(record?.otrNo || record?.id).toLowerCase();
      const recordEmail = normalize(record?.personal?.email).toLowerCase();
      const recordPhone = digits(record?.personal?.phone);
      return (itemOtr && recordOtr && itemOtr === recordOtr)
        || (itemEmail && recordEmail && itemEmail === recordEmail)
        || (itemPhone && recordPhone && itemPhone === recordPhone);
    });

    return matched || embedded;
  }

  function genderFor(item) {
    return normalize(mappedOtrRecord(item)?.personal?.gender || item?.gender || item?.otr?.personal?.gender);
  }

  function satsangiFor(item) {
    const value = normalize(mappedOtrRecord(item)?.satsang?.bapsConnected || item?.otr?.satsang?.bapsConnected).toLowerCase();
    if (value === 'yes') return 'Yes';
    if (value === 'no') return 'No';
    return '';
  }

  function unique(values) {
    return [...new Set(values.map(normalize).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  function ensureStyles() {
    if (document.getElementById('ams-interview-management-refinements-style')) return;
    const style = document.createElement('style');
    style.id = 'ams-interview-management-refinements-style';
    style.textContent = `
      #screen-ams-interviews #ams-interview-root .im-stage-filters .im-filter-search .im-search {
        position: relative;
        width: 100%;
        max-width: none;
        height: 34px;
      }

      #screen-ams-interviews #ams-interview-root .im-stage-filters .im-filter-search .im-search i {
        position: absolute;
        z-index: 1;
        top: 50%;
        left: 10px;
        margin: 0;
        color: var(--text-muted);
        font-size: 10px;
        line-height: 1;
        pointer-events: none;
        transform: translateY(-50%);
      }

      #screen-ams-interviews #ams-interview-root .im-stage-filters .im-filter-search .im-search input {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        height: 34px;
        padding: 0 10px 0 32px;
        border-radius: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (window[INSTALL_FLAG]) return true;
    const interviews = window.AMSInterviews;
    if (!interviews || !window[STAGE_FLAG]) return false;
    window[INSTALL_FLAG] = true;

    ensureStyles();

    interviews.state.filters.gender = interviews.state.filters.gender || 'all';
    interviews.state.filters.satsangi = interviews.state.filters.satsangi || 'all';
    delete interviews.state.filters.examScore;

    interviews.renderHeader = function renderInterviewHeaderWithoutGlobalSchedule() {
      return `
        <header class="im-page-header">
          <h1>Interview Management</h1>
          <div class="im-page-actions">
            <button class="btn btn-outline" type="button" data-im-action="create-structure"><i class="fas fa-plus"></i> Add Interview Structure</button>
            <button class="btn btn-outline" type="button" data-im-action="export"><i class="fas fa-arrow-up-from-bracket"></i> Export</button>
          </div>
        </header>
      `;
    };

    interviews.renderWorkspace = function renderRefinedInterviewWorkspace() {
      const visible = this.filteredInterviews();
      const stageLabels = {
        pending: 'Pending Interview',
        scheduled: 'Scheduled Interview',
        completed: 'Completed Interview',
        canceled: 'Canceled Interview'
      };
      const title = stageLabels[this.state.activeKpi] || 'Pending Interview';
      return `
        <section class="im-card im-workspace">
          <div class="im-workspace-head">
            <div><h2>${title}</h2><span>${visible.length} interview record${visible.length === 1 ? '' : 's'}</span></div>
          </div>
          ${this.renderFilters()}
          ${this.renderList(visible)}
        </section>
      `;
    };

    interviews.renderFilters = function renderRefinedInterviewFilters() {
      const f = this.state.filters;
      const currentStage = this.state.activeKpi;
      const stageRows = this.interviews.filter(item => this.stageKeyForInterview(item) === currentStage);
      const batches = unique(stageRows.map(item => item.batch));
      const learningModes = unique(stageRows.map(item => item.learningMode || item.mode));
      const interviewModes = unique(stageRows.map(item => item.mode));
      const genders = unique(this.interviews.map(item => genderFor(item)));
      const showScheduleFields = ['scheduled', 'completed', 'canceled'].includes(currentStage);

      return `
        <div class="im-filters im-stage-filters">
          <label class="im-filter-search"><span>Search</span><div class="im-search"><i class="fas fa-search"></i><input id="im-search" data-im-filter="search" value="${this.escape(f.search || '')}" placeholder="Search name, OTR ID, course, batch..." /></div></label>
          <label><span>OTR ID</span><input type="text" data-im-filter="otr" value="${this.escape(f.otr || '')}" placeholder="PA260001" /></label>
          ${this.filterSelect('course', 'Course', this.courses, f.course)}
          ${this.filterSelect('batch', 'Batch', batches, f.batch || 'all')}
          ${this.filterSelect('learningMode', 'Learning Mode', learningModes, f.learningMode || 'all')}
          ${this.filterSelect('gender', 'Gender', genders, f.gender || 'all')}
          ${this.filterSelect('satsangi', 'Satsangi', ['Yes', 'No'], f.satsangi || 'all')}
          ${showScheduleFields ? `<label><span>From</span><input type="date" data-im-filter="from" value="${f.from || ''}" /></label><label><span>To</span><input type="date" data-im-filter="to" value="${f.to || ''}" /></label>${this.filterSelect('mode', 'Mode of Interview', interviewModes, f.mode || 'all')}` : ''}
          <button class="im-reset" type="button" data-im-action="reset"><i class="fas fa-rotate-left"></i> Reset</button>
        </div>
      `;
    };

    interviews.filteredInterviews = function filteredRefinedStageInterviews() {
      const f = this.state.filters;
      const activeStage = ['pending', 'scheduled', 'completed', 'canceled'].includes(this.state.activeKpi)
        ? this.state.activeKpi
        : 'pending';

      let rows = this.interviews.filter((item, index) => {
        if (this.stageKeyForInterview(item) !== activeStage) return false;
        const otrId = this.otrIdForInterview(item, index);
        const date = normalize(item.datetime).slice(0, 10);
        const gender = genderFor(item);
        const satsangi = satsangiFor(item);
        const searchText = `${item.name || ''} ${otrId} ${item.course || ''} ${item.batch || ''} ${item.email || ''} ${item.phone || ''}`.toLowerCase();

        return (!f.search || searchText.includes(normalize(f.search).toLowerCase()))
          && (!f.otr || normalize(otrId).toLowerCase().includes(normalize(f.otr).toLowerCase()))
          && (f.course === 'all' || !f.course || item.course === f.course)
          && (f.batch === 'all' || !f.batch || item.batch === f.batch)
          && (f.learningMode === 'all' || !f.learningMode || (item.learningMode || item.mode) === f.learningMode)
          && (f.gender === 'all' || !f.gender || gender === f.gender)
          && (f.satsangi === 'all' || !f.satsangi || satsangi === f.satsangi)
          && (!f.from || date >= f.from)
          && (!f.to || date <= f.to)
          && (f.mode === 'all' || !f.mode || item.mode === f.mode);
      });

      const direction = this.state.sortDirection === 'desc' ? -1 : 1;
      const key = this.state.sortKey || 'datetime';
      rows = rows.slice().sort((a, b) => {
        const aValue = key === 'otr' ? this.otrIdForInterview(a) : key === 'learningMode' ? (a.learningMode || a.mode || '') : (a[key] || '');
        const bValue = key === 'otr' ? this.otrIdForInterview(b) : key === 'learningMode' ? (b.learningMode || b.mode || '') : (b[key] || '');
        return String(aValue).localeCompare(String(bValue), undefined, { numeric: true }) * direction;
      });
      return rows;
    };

    interviews.openStageRescheduleForm = function openRefinedStageRescheduleForm(ids) {
      const list = (Array.isArray(ids) ? ids : [ids])
        .map(id => this.interviews.find(item => item.id === id))
        .filter(Boolean);
      if (!list.length) return;
      if (list.length > 1) return this.openBulkReschedule(list.map(item => item.id));

      const item = list[0];
      const date = normalize(item.datetime).slice(0, 10) || this.dateKey(new Date());
      const time = normalize(item.datetime).slice(11, 16) || '10:00';
      const wasCanceled = this.stageKeyForInterview(item) === 'canceled';
      const structureOptions = this.structures.filter(structure =>
        (structure.active && (!structure.course || structure.course === item.course))
        || structure.id === item.structureId
      );

      this.openModal('Reschedule Interview', `
        <div class="im-reschedule-context"><strong>${this.escape(item.name)}</strong> · ${this.escape(this.otrIdForInterview(item))}</div>
        <form class="im-form" id="im-stage-reschedule-form">
          <div class="im-form-grid">
            <label><span>Date <b>*</b></span><input type="date" name="date" value="${date}" required /></label>
            <label><span>Time <b>*</b></span><input type="time" name="time" value="${time}" required /></label>
            <label><span>Interview Structure <b>*</b></span><select name="structureId" required><option value="">Select Interview Structure</option>${structureOptions.map(structure => `<option value="${structure.id}" ${structure.id === item.structureId ? 'selected' : ''}>${this.escape(structure.name)}</option>`).join('')}</select></label>
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
        item.structureId = data.structureId;
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

    interviews.resetFilters = function resetRefinedInterviewFilters() {
      Object.assign(this.state.filters, {
        search: '',
        otr: '',
        from: '',
        to: '',
        course: 'all',
        batch: 'all',
        learningMode: 'all',
        interviewer: 'all',
        structure: 'all',
        status: 'all',
        mode: 'all',
        gender: 'all',
        satsangi: 'all'
      });
      delete this.state.filters.examScore;
      this.state.page = 1;
      this.render();
    };

    interviews.render();
    return true;
  }

  function boot() {
    if (install()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 200) window.clearInterval(timer);
    }, 25);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
