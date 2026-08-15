// ============================================================
// AMS INTERVIEW MANAGEMENT REFINEMENTS
// Scope: AMS -> Interview Scheduling / Interview Management only.
// Interview Structure is the sole interview classification source.
// ============================================================

(() => {
  const INSTALL_FLAG = '__amsInterviewManagementStructureSingleSourceInstalled';
  const STAGE_FLAG = '__amsInterviewStageWorkflowInstalled';

  function normalize(value) {
    return String(value ?? '').trim();
  }

  function digits(value) {
    return normalize(value).replace(/\D/g, '');
  }

  function unique(values) {
    return [...new Set(values.map(normalize).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  function addMinutes(time, minutes) {
    const [hours = 0, mins = 0] = normalize(time).split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, mins + Number(minutes || 0));
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

  function structureRecord(interviews, recordOrId) {
    if (recordOrId && typeof recordOrId === 'object') {
      return interviews.structureForInterview?.(recordOrId)
        || interviews.structures.find(structure => structure.id === recordOrId.structureId)
        || recordOrId.structureSnapshot
        || recordOrId.evaluationStructureSnapshot
        || null;
    }
    return interviews.structureById?.(recordOrId) || interviews.structures.find(structure => structure.id === recordOrId) || null;
  }

  function structureOptionsFor(interviews, course = '', currentId = '') {
    return interviews.structures.filter(structure => {
      if (structure.id === currentId) return true;
      if (structure.active === false) return false;
      return !course || !structure.course || structure.course === course;
    });
  }

  function structureFilterOptions(interviews, stageRows) {
    const assigned = new Set(stageRows.map(item => item.structureId).filter(Boolean));
    return interviews.structures.filter(structure => structure.active !== false || assigned.has(structure.id));
  }

  function structureChip(interviews, item) {
    const structure = structureRecord(interviews, item);
    if (!structure) return '—';
    return `<span class="imia-structure-chip"><i class="fas fa-layer-group"></i>${interviews.escape(structure.name)}</span>`;
  }

  function programValuesFor(items) {
    const values = [];
    const studentRows = Array.isArray(window.AMSStudentList?.rows) ? window.AMSStudentList.rows : [];
    items.forEach(item => {
      values.push(item.program, item.programme, item.programName);
      const otr = normalize(item?.otr?.otrNo || item?.otrNo);
      const match = studentRows.find(row =>
        (otr && normalize(row?.otrNo) === otr)
        || (item?.studentId && row?.studentId === item.studentId)
        || (item?.email && normalize(row?.email).toLowerCase() === normalize(item.email).toLowerCase())
      );
      values.push(match?.program, match?.programme, match?.programName);
    });
    const mapped = unique(values);
    return mapped.length ? mapped : unique(items.map(item => item.course));
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

  function currentStageIds(interviews) {
    return [...interviews.selectedRows].filter(id => {
      const item = interviews.interviews.find(row => row.id === id);
      return item && interviews.stageKeyForInterview(item) === interviews.state.activeKpi;
    });
  }

  function modalIsOpen() {
    return document.getElementById('ams-interview-modal')?.getAttribute('aria-hidden') === 'false';
  }

  function ensureStyles() {
    if (document.getElementById('ams-interview-management-structure-source-style')) return;
    const style = document.createElement('style');
    style.id = 'ams-interview-management-structure-source-style';
    style.textContent = `
      #screen-ams-interviews #ams-interview-root .im-stage-filters .im-filter-search .im-search { position:relative;width:100%;max-width:none;height:34px; }
      #screen-ams-interviews #ams-interview-root .im-stage-filters .im-filter-search .im-search i { position:absolute;z-index:1;top:50%;left:10px;margin:0;color:var(--text-muted);font-size:10px;line-height:1;pointer-events:none;transform:translateY(-50%); }
      #screen-ams-interviews #ams-interview-root .im-stage-filters .im-filter-search .im-search input { box-sizing:border-box;width:100%;min-width:0;height:34px;padding:0 10px 0 32px;border-radius:8px; }
      #ams-interview-modal[aria-hidden="false"] { z-index:2147482000!important; }
      #ams-interview-modal .im-modal-dialog { overflow:visible; }
      #ams-interview-modal .im-modal-body { overflow:auto;overscroll-behavior:contain; }
      #ams-interview-modal:has(#imia-single-assign-form) .im-modal-dialog { width:min(820px,calc(100vw - 32px));max-height:calc(100dvh - 32px); }
      #ams-interview-modal:has(#imia-bulk-assign-form) .im-modal-dialog { width:min(1280px,calc(100vw - 32px));max-height:calc(100dvh - 32px); }
      #ams-interview-modal:has(#imia-single-assign-form) .im-modal-head,
      #ams-interview-modal:has(#imia-bulk-assign-form) .im-modal-head { min-height:66px;padding:12px 18px; }
      #ams-interview-modal:has(#imia-single-assign-form) .im-modal-body,
      #ams-interview-modal:has(#imia-bulk-assign-form) .im-modal-body { padding:16px 18px 18px; }
      #ams-interview-modal .imia-modal-subtitle { margin:0 0 14px;color:var(--text-muted);font-size:10px;line-height:1.45; }
      #ams-interview-modal .imia-form { display:grid;gap:14px; }
      #ams-interview-modal .imia-single-grid { display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px 16px;padding:16px;border:1px solid var(--border);border-radius:12px;background:var(--bg-subtle); }
      #ams-interview-modal .imia-single-grid .imia-span-3 { grid-column:span 3; }
      #ams-interview-modal .imia-section { display:grid;gap:12px;padding:14px 16px;border:1px solid var(--border);border-radius:12px;background:var(--bg-subtle); }
      #ams-interview-modal .imia-section-title { display:flex;align-items:center;gap:9px;margin:0;padding-bottom:10px;border-bottom:1px solid var(--divider);color:var(--primary);font-size:12px;font-weight:800; }
      #ams-interview-modal .imia-section-title i { width:18px;text-align:center; }
      #ams-interview-modal .imia-four-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 14px; }
      #ams-interview-modal .imia-three-grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 14px; }
      #ams-interview-modal .imia-form label { display:grid;align-content:start;gap:6px;min-width:0; }
      #ams-interview-modal .imia-form label>span { color:var(--text-primary);font-size:9px;font-weight:750;line-height:1.35; }
      #ams-interview-modal .imia-form label>span b { color:var(--danger); }
      #ams-interview-modal .imia-form input,#ams-interview-modal .imia-form select { box-sizing:border-box;width:100%;min-width:0;min-height:42px;padding:0 11px;border:1px solid var(--border);border-radius:9px;outline:0;background:var(--bg-card);color:var(--text-primary);font-size:10px;transition:border-color 140ms ease,box-shadow 140ms ease,background 140ms ease; }
      #ams-interview-modal .imia-form input:hover,#ams-interview-modal .imia-form select:hover { border-color:color-mix(in srgb,var(--primary) 38%,var(--border)); }
      #ams-interview-modal .imia-form input:focus,#ams-interview-modal .imia-form select:focus { border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-light); }
      #ams-interview-modal .imia-form-actions { position:sticky;bottom:-18px;z-index:4;display:flex;justify-content:flex-end;gap:9px;margin:0 -18px -18px;padding:12px 18px 18px;border-top:1px solid var(--border);background:linear-gradient(180deg,rgba(255,255,255,.94),var(--bg-card) 35%); }
      #ams-interview-modal .imia-form-actions .btn { min-width:108px;min-height:40px; }
      body.dark #ams-interview-modal .imia-form-actions { background:linear-gradient(180deg,rgba(15,23,42,.94),var(--bg-card) 35%); }
      #screen-ams-interviews #ams-interview-root .imia-structure-chip { display:inline-flex;align-items:center;gap:5px;min-height:24px;padding:4px 8px;border:1px solid color-mix(in srgb,var(--primary) 24%,var(--border));border-radius:999px;background:var(--primary-light);color:var(--primary);font-size:8px;font-weight:800;white-space:nowrap; }
      #screen-ams-interviews #ams-interview-root .imia-stage-actions { display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
      #screen-ams-interviews #ams-interview-root .imia-stage-actions .imia-new-interview { border-color:color-mix(in srgb,var(--primary) 32%,var(--border));color:var(--primary); }
      #screen-ams-interviews #ams-interview-root .imia-stage-actions .imia-new-interview:hover { border-color:var(--primary);background:var(--primary-light); }
      #screen-ams-interviews #ams-interview-root .im-stage-table.scheduled,
      #screen-ams-interviews #ams-interview-root .im-stage-table.completed,
      #screen-ams-interviews #ams-interview-root .im-stage-table.canceled { min-width:1180px; }
      #screen-ams-interviews #ams-interview-root .imia-scheduled-actions { display:flex;gap:6px;align-items:center;flex-wrap:nowrap;white-space:nowrap; }
      #ams-interview-modal .imia-result-summary { display:grid;gap:12px; }
      #ams-interview-modal .imia-result-summary-head { display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--bg-subtle); }
      #ams-interview-modal .imia-result-summary-head strong { color:var(--text-primary);font-size:11px; }
      #ams-interview-modal .imia-result-summary-head span { color:var(--text-muted);font-size:9px; }
      #ams-interview-modal .imia-result-table { min-width:760px; }
      #ams-interview-modal .imia-result-table td { vertical-align:middle; }
      #ams-interview-modal .imia-result-score { font-weight:800;color:var(--primary);white-space:nowrap; }
      #ams-interview-modal .imia-result-remarks { max-width:240px;white-space:normal;line-height:1.4; }
      @media(max-width:1050px){
        #ams-interview-modal .imia-four-grid,#ams-interview-modal .imia-three-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
        #ams-interview-modal:has(#imia-bulk-assign-form) .im-modal-dialog{width:min(920px,calc(100vw - 24px));}
      }
      @media(max-width:860px){
        #ams-interview-modal .imia-single-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
        #ams-interview-modal .imia-single-grid .imia-span-3{grid-column:auto;}
      }
      @media(max-width:680px){
        #ams-interview-modal:has(#imia-single-assign-form) .im-modal-dialog,#ams-interview-modal:has(#imia-bulk-assign-form) .im-modal-dialog{width:calc(100vw - 16px);max-height:calc(100dvh - 16px);}
        #ams-interview-modal:has(#imia-single-assign-form) .im-modal-head,#ams-interview-modal:has(#imia-bulk-assign-form) .im-modal-head{padding:10px 12px;}
        #ams-interview-modal:has(#imia-single-assign-form) .im-modal-body,#ams-interview-modal:has(#imia-bulk-assign-form) .im-modal-body{padding:14px;}
        #ams-interview-modal .imia-single-grid,#ams-interview-modal .imia-four-grid,#ams-interview-modal .imia-three-grid{grid-template-columns:1fr;}
        #ams-interview-modal .imia-single-grid{padding:13px;}
        #ams-interview-modal .imia-section{padding:13px;}
        #ams-interview-modal .imia-form-actions{bottom:-14px;margin:0 -14px -14px;padding:10px 14px 14px;}
      }
      @media(max-width:520px){
        #ams-interview-modal .imia-form-actions{flex-direction:column-reverse;}
        #ams-interview-modal .imia-form-actions .btn{width:100%;}
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (window[INSTALL_FLAG]) return true;
    const interviews = window.AMSInterviews;
    if (!interviews || !window[STAGE_FLAG]) return false;

    window[INSTALL_FLAG] = true;
    window.__amsInterviewManagementRefinementsInstalled = true;
    window.__amsInterviewActionRefinementsInstalled = true;
    ensureStyles();

    const previous = {
      renderHeader: interviews.renderHeader?.bind(interviews),
      renderWorkspace: interviews.renderWorkspace?.bind(interviews),
      renderFilters: interviews.renderFilters?.bind(interviews),
      filteredInterviews: interviews.filteredInterviews?.bind(interviews),
      stageColumns: interviews.stageColumns?.bind(interviews),
      renderStageInterviewRow: interviews.renderStageInterviewRow?.bind(interviews),
      renderBulkBar: interviews.renderBulkBar?.bind(interviews),
      renderStageRowActions: interviews.renderStageRowActions?.bind(interviews),
      handleRowAction: interviews.handleRowAction?.bind(interviews),
      handleBulkAction: interviews.handleBulkAction?.bind(interviews),
      resetFilters: interviews.resetFilters?.bind(interviews),
      openBulkReschedule: interviews.openBulkReschedule?.bind(interviews)
    };

    interviews.state.filters.gender = interviews.state.filters.gender || 'all';
    interviews.state.filters.satsangi = interviews.state.filters.satsangi || 'all';
    interviews.state.filters.structure = interviews.state.filters.structure || 'all';
    delete interviews.state.filters.examScore;

    interviews.renderHeader = function renderInterviewHeaderWithoutGlobalSchedule() {
      return `<header class="im-page-header"><h1>Interview Management</h1><div class="im-page-actions"><button class="btn btn-outline" type="button" data-im-action="create-structure"><i class="fas fa-plus"></i> Add Interview Structure</button><button class="btn btn-outline" type="button" data-im-action="export"><i class="fas fa-arrow-up-from-bracket"></i> Export</button></div></header>`;
    };

    interviews.renderWorkspace = function renderRefinedInterviewWorkspace() {
      const visible = this.filteredInterviews();
      const stageLabels = { pending:'Pending Interview',scheduled:'Scheduled Interview',completed:'Completed Interview',canceled:'Canceled Interview' };
      const title = stageLabels[this.state.activeKpi] || 'Pending Interview';
      return `<section class="im-card im-workspace"><div class="im-workspace-head"><div><h2>${title}</h2><span>${visible.length} interview record${visible.length === 1 ? '' : 's'}</span></div></div>${this.renderFilters()}${this.renderList(visible)}</section>`;
    };

    interviews.renderFilters = function renderRefinedInterviewFilters() {
      const f = this.state.filters;
      const currentStage = this.state.activeKpi;
      const stageRows = this.interviews.filter(item => this.stageKeyForInterview(item) === currentStage);
      const batches = unique(stageRows.map(item => item.batch));
      const learningModes = unique(stageRows.map(item => item.learningMode || item.mode));
      const interviewModes = unique(stageRows.map(item => item.mode));
      const genders = unique(this.interviews.map(item => genderFor(item)));
      const structures = structureFilterOptions(this, stageRows);
      const showScheduleFields = ['scheduled','completed','canceled'].includes(currentStage);
      return `<div class="im-filters im-stage-filters">
        <label class="im-filter-search"><span>Search</span><div class="im-search"><i class="fas fa-search"></i><input id="im-search" data-im-filter="search" value="${this.escape(f.search || '')}" placeholder="Search name, OTR ID, course, batch, structure..." /></div></label>
        <label><span>OTR ID</span><input type="text" data-im-filter="otr" value="${this.escape(f.otr || '')}" placeholder="PA260001" /></label>
        ${this.filterSelect('course','Course',this.courses,f.course)}
        ${this.filterSelect('batch','Batch',batches,f.batch || 'all')}
        ${this.filterSelect('learningMode','Learning Mode',learningModes,f.learningMode || 'all')}
        <label><span>Interview Structure</span><select data-im-filter="structure"><option value="all">All Structures</option>${structures.map(structure => `<option value="${this.escape(structure.id)}" ${structure.id === f.structure ? 'selected' : ''}>${this.escape(structure.name)}${structure.active === false ? ' (Inactive)' : ''}</option>`).join('')}</select></label>
        ${this.filterSelect('gender','Gender',genders,f.gender || 'all')}
        ${this.filterSelect('satsangi','Satsangi',['Yes','No'],f.satsangi || 'all')}
        ${showScheduleFields ? `<label><span>From</span><input type="date" data-im-filter="from" value="${f.from || ''}" /></label><label><span>To</span><input type="date" data-im-filter="to" value="${f.to || ''}" /></label>${this.filterSelect('mode','Mode of Interview',interviewModes,f.mode || 'all')}` : ''}
        <button class="im-reset" type="button" data-im-action="reset"><i class="fas fa-rotate-left"></i> Reset</button>
      </div>`;
    };

    interviews.filteredInterviews = function filteredRefinedStageInterviews() {
      const f = this.state.filters;
      const activeStage = ['pending','scheduled','completed','canceled'].includes(this.state.activeKpi) ? this.state.activeKpi : 'pending';
      let rows = this.interviews.filter((item,index) => {
        if (this.stageKeyForInterview(item) !== activeStage) return false;
        const otrId = this.otrIdForInterview(item,index);
        const date = normalize(item.datetime).slice(0,10);
        const gender = genderFor(item);
        const satsangi = satsangiFor(item);
        const structure = structureRecord(this, item);
        const searchText = `${item.name || ''} ${otrId} ${item.course || ''} ${item.batch || ''} ${item.email || ''} ${item.phone || ''} ${structure?.name || ''}`.toLowerCase();
        return (!f.search || searchText.includes(normalize(f.search).toLowerCase()))
          && (!f.otr || normalize(otrId).toLowerCase().includes(normalize(f.otr).toLowerCase()))
          && (f.course === 'all' || !f.course || item.course === f.course)
          && (f.batch === 'all' || !f.batch || item.batch === f.batch)
          && (f.learningMode === 'all' || !f.learningMode || (item.learningMode || item.mode) === f.learningMode)
          && (f.structure === 'all' || !f.structure || item.structureId === f.structure)
          && (f.gender === 'all' || !f.gender || gender === f.gender)
          && (f.satsangi === 'all' || !f.satsangi || satsangi === f.satsangi)
          && (!f.from || date >= f.from)
          && (!f.to || date <= f.to)
          && (f.mode === 'all' || !f.mode || item.mode === f.mode);
      });
      const direction = this.state.sortDirection === 'desc' ? -1 : 1;
      const key = this.state.sortKey || 'datetime';
      rows = rows.slice().sort((a,b) => {
        const aValue = key === 'otr' ? this.otrIdForInterview(a) : key === 'learningMode' ? (a.learningMode || a.mode || '') : (a[key] || '');
        const bValue = key === 'otr' ? this.otrIdForInterview(b) : key === 'learningMode' ? (b.learningMode || b.mode || '') : (b[key] || '');
        return String(aValue).localeCompare(String(bValue),undefined,{numeric:true}) * direction;
      });
      return rows;
    };

    interviews.stageColumns = function structureBasedStageColumns() {
      const stage = this.state.activeKpi;
      if (stage === 'scheduled') return [['name','Name'],['otr','OTR ID'],['course','Course'],['batch','Batch'],['learningMode','Learning Mode'],['datetime','Date / Time'],['mode','Mode of Interview'],['structure','Interview Structure'],['actions','Actions']];
      if (stage === 'completed') return [['name','Name'],['otr','OTR ID'],['course','Course'],['batch','Batch'],['learningMode','Learning Mode'],['datetime','Date / Time'],['mode','Mode of Interview'],['structure','Interview Structure'],['score','Exam Score'],['actions','Actions']];
      if (stage === 'canceled') return [['name','Name'],['otr','OTR ID'],['course','Course'],['batch','Batch'],['learningMode','Learning Mode'],['datetime','Date / Time'],['mode','Mode of Interview'],['structure','Interview Structure'],['actions','Actions']];
      return previous.stageColumns ? previous.stageColumns() : [];
    };

    interviews.renderStageInterviewRow = function structureBasedStageInterviewRow(item, columns, index) {
      if (this.state.activeKpi === 'pending') {
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
        structure: structureChip(this, item),
        score: item.score ? `${this.escape(item.score)}/100` : '—',
        actions: this.renderStageRowActions(item)
      };
      return `<tr data-im-stage-row="${this.escape(item.id)}"><td><input type="checkbox" data-im-select="${this.escape(item.id)}" ${this.selectedRows.has(item.id) ? 'checked' : ''} /></td>${columns.map(([key]) => `<td>${values[key] ?? '—'}</td>`).join('')}</tr>`;
    };

    interviews.interviewHistoryFor = function interviewHistoryFor(item) {
      const course = normalize(item?.course).toLowerCase();
      return this.interviews.filter(candidate => sameStudent(item, candidate)
        && (!course || !normalize(candidate.course) || normalize(candidate.course).toLowerCase() === course));
    };

    interviews.requiredStructuresFor = function requiredStructuresFor(item) {
      const course = normalize(item?.course);
      return this.structures.filter(structure => structure.active !== false
        && (!course || !structure.course || structure.course === course));
    };

    interviews.nextRequiredStructureFor = function nextRequiredStructureFor(item) {
      if (!item || this.stageKeyForInterview(item) !== 'completed') return null;
      const history = this.interviewHistoryFor(item);
      const completed = history
        .filter(candidate => this.stageKeyForInterview(candidate) === 'completed')
        .slice()
        .sort((a, b) => normalize(a.datetime || a.createdAt).localeCompare(normalize(b.datetime || b.createdAt)));
      if (!completed.length || completed[completed.length - 1].id !== item.id) return null;
      const covered = new Set(history
        .filter(candidate => !isCanceled(candidate) && structureRecord(this, candidate.structureId))
        .map(candidate => candidate.structureId));
      return this.requiredStructuresFor(item).find(structure => !covered.has(structure.id)) || null;
    };

    interviews.renderStageRowActions = function renderSynchronizedStageActions(item) {
      const stage = this.stageKeyForInterview(item);
      if (stage === 'scheduled') {
        return `<div class="im-stage-actions imia-stage-actions imia-scheduled-actions"><button type="button" class="im-stage-action" data-im-row-action="scheduled-edit" data-id="${this.escape(item.id)}"><i class="fas fa-pen"></i> Edit</button><button type="button" class="im-stage-action" data-im-row-action="scheduled-start" data-id="${this.escape(item.id)}"><i class="fas fa-play"></i> Start Interview</button></div>`;
      }
      if (stage === 'completed') {
        const nextStructure = this.nextRequiredStructureFor(item);
        return `<div class="im-stage-actions imia-stage-actions"><button type="button" class="im-stage-action" data-im-row-action="view-result-stage" data-id="${this.escape(item.id)}"><i class="fas fa-eye"></i> View Result</button><button type="button" class="im-stage-action" data-im-row-action="completed-reschedule" data-id="${this.escape(item.id)}"><i class="fas fa-calendar-plus"></i> Reschedule</button>${nextStructure ? `<button type="button" class="im-stage-action imia-new-interview" data-im-row-action="completed-new-interview" data-id="${this.escape(item.id)}" title="Schedule ${this.escape(nextStructure.name)}"><i class="fas fa-plus"></i> New Interview</button>` : ''}</div>`;
      }
      return previous.renderStageRowActions ? previous.renderStageRowActions(item) : '';
    };

    interviews.renderBulkBar = function renderSynchronizedBulkBar(pageRows) {
      const stage = this.state.activeKpi;
      if (!['scheduled','completed'].includes(stage)) {
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
        const allEligible = selectedItems.length > 0 && selectedItems.every(item => Boolean(this.nextRequiredStructureFor(item)));
        actions = `<button type="button" data-im-bulk="view-result" ${disabled}><i class="fas fa-eye"></i> View Result</button><button type="button" data-im-bulk="reschedule" ${disabled}><i class="fas fa-calendar-plus"></i> Reschedule</button>${allEligible ? `<button type="button" data-im-bulk="new-interview"><i class="fas fa-plus"></i> New Interview</button>` : ''}`;
      }
      return `<div class="im-bulk-bar"><label class="im-check-label"><input type="checkbox" data-im-select-all ${allChecked ? 'checked' : ''} /><span>${count} selected</span></label>${actions}</div>`;
    };

    interviews.openPendingScheduleForm = function openSinglePendingAssignForm(id) {
      const item = this.interviews.find(row => row.id === id);
      if (!item) return;
      const structures = structureOptionsFor(this,item.course,item.structureId);
      const assignedStructure = structureRecord(this, item);
      const assignedWasRemoved = Boolean(item.structureId && !this.structures.some(structure => structure.id === item.structureId));
      const structurePlaceholder = assignedWasRemoved && assignedStructure
        ? `${assignedStructure.name} was removed — select a current structure`
        : 'Select interview structure';
      const date = normalize(item.datetime).slice(0,10) || this.dateKey(new Date());
      const start = normalize(item.datetime).slice(11,16) || '';
      const end = normalize(item.endTime) || (start ? addMinutes(start,30) : '');
      this.openModal(`Interview Schedule for ${item.name}`,`<p class="imia-modal-subtitle">Schedule and assign the interview details below.</p><form class="imia-form imia-single-form" id="imia-single-assign-form"><div class="imia-single-grid">
        <label class="imia-span-3"><span>Interview Structure <b>*</b></span><select name="structureId" required><option value="">${this.escape(structurePlaceholder)}</option>${structures.map(structure => `<option value="${this.escape(structure.id)}" ${structure.id === item.structureId ? 'selected' : ''}>${this.escape(structure.name)}${structure.active === false ? ' (Inactive)' : ''}</option>`).join('')}</select></label>
        <label class="imia-span-3"><span>Interview Date <b>*</b></span><input type="date" name="date" value="${this.escape(date)}" required /></label>
        <label class="imia-span-3"><span>Start Time <b>*</b></span><input type="time" name="startTime" value="${this.escape(start)}" required /></label>
        <label class="imia-span-3"><span>End Time <b>*</b></span><input type="time" name="endTime" value="${this.escape(end)}" required /></label>
        <label class="imia-span-3"><span>Interviewer Name <b>*</b></span><select name="interviewerId" required><option value="">Select interviewer</option>${this.interviewers.map(person => `<option value="${this.escape(person.id)}" ${person.id === item.interviewerId ? 'selected' : ''}>${this.escape(person.name)} · ${this.escape(person.department)}</option>`).join('')}</select></label>
        <label class="imia-span-3"><span>Interview Mode <b>*</b></span><select name="mode" required><option value="">Select interview mode</option>${['Online','In-Person'].map(mode => `<option value="${mode}" ${mode === item.mode ? 'selected' : ''}>${mode}</option>`).join('')}</select></label>
      </div><div class="imia-form-actions"><button type="button" class="btn btn-outline" data-im-close><i class="fas fa-xmark"></i> Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Assign</button></div></form>`,'lg');
      document.getElementById('imia-single-assign-form')?.addEventListener('submit',event => {
        event.preventDefault();
        if(!event.currentTarget.reportValidity())return;
        const data=Object.fromEntries(new FormData(event.currentTarget).entries());
        if(!structureOptionsFor(this,item.course,item.structureId).some(structure=>structure.id===data.structureId)){
          event.currentTarget.elements.structureId.setCustomValidity('Select an active Interview Structure mapped to this course.');
          event.currentTarget.elements.structureId.reportValidity();
          return;
        }
        event.currentTarget.elements.structureId.setCustomValidity('');
        if(data.endTime<=data.startTime){event.currentTarget.elements.endTime.setCustomValidity('End Time must be later than Start Time.');event.currentTarget.elements.endTime.reportValidity();return;}
        event.currentTarget.elements.endTime.setCustomValidity('');
        item.structureId=data.structureId;
        item.datetime=`${data.date}T${data.startTime}`;
        item.endTime=data.endTime;
        item.interviewerId=data.interviewerId;
        item.mode=data.mode;
        item.status='Scheduled';
        this.saveInterviews();
        this.selectedRows.delete(item.id);
        this.closeModal();
        this.state.activeKpi='scheduled';
        this.state.page=1;
        this.render();
      });
    };

    interviews.openBulkInterviewAssignForm = function openBulkInterviewAssignForm(ids) {
      const selected=ids.map(id=>this.interviews.find(item=>item.id===id)).filter(Boolean);
      if(!selected.length)return;
      const selectedCourses=unique(selected.map(item=>item.course));
      const selectedPrograms=programValuesFor(selected);
      const commonCourse=selectedCourses.length===1?selectedCourses[0]:'';
      const commonProgram=selectedPrograms.length===1?selectedPrograms[0]:'';
      const modes=unique(selected.map(item=>item.mode));
      const commonMode=modes.length===1?normalize(selected[0].mode):'';
      const structures=structureOptionsFor(this,commonCourse,'');
      const date=normalize(selected[0]?.datetime).slice(0,10)||this.dateKey(new Date());
      const start=normalize(selected[0]?.datetime).slice(11,16)||'';
      const end=normalize(selected[0]?.endTime)||(start?addMinutes(start,30):'');
      const courseOptions=unique([...this.courses,...selectedCourses]);
      this.openModal('Schedule Interview',`<p class="imia-modal-subtitle">Fill in the details below to schedule and assign an interview.</p><form class="imia-form imia-bulk-form" id="imia-bulk-assign-form">
        <section class="imia-section"><h3 class="imia-section-title"><i class="far fa-clock"></i>1. Interview Timing</h3><div class="imia-four-grid"><label><span>Interview Date <b>*</b></span><input type="date" name="date" value="${this.escape(date)}" required /></label><label><span>Start Time <b>*</b></span><input type="time" name="startTime" value="${this.escape(start)}" required /></label><label><span>End Time <b>*</b></span><input type="time" name="endTime" value="${this.escape(end)}" required /></label><label><span>Interview Structure <b>*</b></span><select name="structureId" required><option value="">Select structure</option>${structures.map(structure=>`<option value="${this.escape(structure.id)}">${this.escape(structure.name)}</option>`).join('')}</select></label></div></section>
        <section class="imia-section"><h3 class="imia-section-title"><i class="fas fa-graduation-cap"></i>2. Academic Details</h3><div class="imia-four-grid"><label><span>Course <b>*</b></span><select name="course" required><option value="">${selectedCourses.length>1?'Select course for selected students':'Select course'}</option>${courseOptions.map(course=>`<option value="${this.escape(course)}" ${course===commonCourse?'selected':''}>${this.escape(course)}</option>`).join('')}</select></label><label><span>Program <b>*</b></span><select name="program" required><option value="">Select program</option>${selectedPrograms.map(program=>`<option value="${this.escape(program)}" ${program===commonProgram?'selected':''}>${this.escape(program)}</option>`).join('')}</select></label><label><span>Interviewer Name <b>*</b></span><select name="interviewerId" required><option value="">Select interviewer</option>${this.interviewers.map(person=>`<option value="${this.escape(person.id)}">${this.escape(person.name)} · ${this.escape(person.department)}</option>`).join('')}</select></label><label><span>Interview Mode</span><select name="mode"><option value="">Select mode</option>${['Online','In-Person'].map(mode=>`<option value="${mode}" ${mode===commonMode?'selected':''}>${mode}</option>`).join('')}</select></label></div></section>
        <section class="imia-section"><h3 class="imia-section-title"><i class="fas fa-mug-hot"></i>3. Break Timing</h3><div class="imia-three-grid"><label><span>Break (From) <b>*</b></span><input type="time" name="breakFrom" required /></label><label><span>Break (To) <b>*</b></span><input type="time" name="breakTo" required /></label><label><span>Interviewing Time (in minutes) <b>*</b></span><input type="number" name="interviewMinutes" min="1" step="1" placeholder="Enter minutes" required /></label></div></section>
        <div class="imia-form-actions"><button type="button" class="btn btn-outline" data-im-close><i class="fas fa-xmark"></i> Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Assign</button></div></form>`,'xl');
      const form=document.getElementById('imia-bulk-assign-form');
      form?.elements.course?.addEventListener('change',event=>{
        const structureSelect=form.elements.structureId;
        const current=structureSelect.value;
        const options=structureOptionsFor(this,event.target.value,current);
        structureSelect.innerHTML=`<option value="">Select structure</option>${options.map(structure=>`<option value="${this.escape(structure.id)}" ${structure.id===current?'selected':''}>${this.escape(structure.name)}</option>`).join('')}`;
        if(current&&!options.some(structure=>structure.id===current))structureSelect.value='';
      });
      form?.addEventListener('submit',event=>{
        event.preventDefault();
        if(!event.currentTarget.reportValidity())return;
        const data=Object.fromEntries(new FormData(event.currentTarget).entries());
        if(data.endTime<=data.startTime){event.currentTarget.elements.endTime.setCustomValidity('End Time must be later than Start Time.');event.currentTarget.elements.endTime.reportValidity();return;}
        event.currentTarget.elements.endTime.setCustomValidity('');
        if(data.breakTo<=data.breakFrom){event.currentTarget.elements.breakTo.setCustomValidity('Break (To) must be later than Break (From).');event.currentTarget.elements.breakTo.reportValidity();return;}
        event.currentTarget.elements.breakTo.setCustomValidity('');
        const structure=structureRecord(this,data.structureId);
        if(!structure||structure.active===false||Boolean(data.course&&structure.course&&structure.course!==data.course)){
          event.currentTarget.elements.structureId.setCustomValidity('Select an active Interview Structure mapped to this course.');
          event.currentTarget.elements.structureId.reportValidity();
          return;
        }
        event.currentTarget.elements.structureId.setCustomValidity('');
        selected.forEach(item=>{
          item.course=data.course;
          item.program=data.program;
          item.structureId=data.structureId;
          item.datetime=`${data.date}T${data.startTime}`;
          item.endTime=data.endTime;
          item.interviewerId=data.interviewerId;
          item.mode=data.mode||item.mode||structure?.mode||'In-Person';
          item.breakFrom=data.breakFrom;
          item.breakTo=data.breakTo;
          item.interviewDurationMinutes=Number(data.interviewMinutes);
          item.status='Scheduled';
        });
        this.saveInterviews();
        this.selectedRows.clear();
        this.closeModal();
        this.state.activeKpi='scheduled';
        this.state.page=1;
        this.render();
      });
    };

    interviews.openStageRescheduleForm = function openStructureRescheduleForm(ids) {
      const list=(Array.isArray(ids)?ids:[ids]).map(id=>this.interviews.find(item=>item.id===id)).filter(Boolean);
      if(!list.length)return;
      if(list.length>1)return this.openBulkReschedule(list.map(item=>item.id));
      const item=list[0];
      const date=normalize(item.datetime).slice(0,10)||this.dateKey(new Date());
      const time=normalize(item.datetime).slice(11,16)||'10:00';
      const wasCanceled=this.stageKeyForInterview(item)==='canceled';
      const options=structureOptionsFor(this,item.course,item.structureId);
      const assignedStructure=structureRecord(this,item);
      const assignedWasRemoved=Boolean(item.structureId&&!this.structures.some(structure=>structure.id===item.structureId));
      const structurePlaceholder=assignedWasRemoved&&assignedStructure?`${assignedStructure.name} was removed — select a current structure`:'Select Interview Structure';
      this.openModal('Reschedule Interview',`<div class="im-reschedule-context"><strong>${this.escape(item.name)}</strong> · ${this.escape(this.otrIdForInterview(item))}</div><form class="im-form" id="im-stage-reschedule-form"><div class="im-form-grid"><label><span>Date <b>*</b></span><input type="date" name="date" value="${date}" required /></label><label><span>Time <b>*</b></span><input type="time" name="time" value="${time}" required /></label><label><span>Interview Structure <b>*</b></span><select name="structureId" required><option value="">${this.escape(structurePlaceholder)}</option>${options.map(structure=>`<option value="${this.escape(structure.id)}" ${structure.id===item.structureId?'selected':''}>${this.escape(structure.name)}${structure.active===false?' (Inactive)':''}</option>`).join('')}</select></label><label><span>Interviewer <b>*</b></span><select name="interviewerId" required><option value="">Select Interviewer</option>${this.interviewers.map(person=>`<option value="${this.escape(person.id)}" ${person.id===item.interviewerId?'selected':''}>${this.escape(person.name)} · ${this.escape(person.department)}</option>`).join('')}</select></label><label><span>Mode of Interview <b>*</b></span><select name="mode" required>${['Online','In-Person'].map(mode=>`<option value="${mode}" ${mode===item.mode?'selected':''}>${mode}</option>`).join('')}</select></label></div><div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button type="submit" class="btn btn-primary">Save Reschedule</button></div></form>`,'md');
      document.getElementById('im-stage-reschedule-form')?.addEventListener('submit',event=>{
        event.preventDefault();
        if(!event.currentTarget.reportValidity())return;
        const data=Object.fromEntries(new FormData(event.currentTarget).entries());
        if(!structureOptionsFor(this,item.course,item.structureId).some(structure=>structure.id===data.structureId)){
          event.currentTarget.elements.structureId.setCustomValidity('Select an active Interview Structure mapped to this course.');
          event.currentTarget.elements.structureId.reportValidity();
          return;
        }
        event.currentTarget.elements.structureId.setCustomValidity('');
        item.datetime=`${data.date}T${data.time}`;
        item.structureId=data.structureId;
        item.interviewerId=data.interviewerId;
        item.mode=data.mode;
        item.learningMode=item.learningMode||item.mode;
        item.status=wasCanceled?'Scheduled':'Rescheduled';
        delete item.cancellationReason;
        this.saveInterviews();
        this.closeModal();
        this.selectedRows.delete(item.id);
        this.state.activeKpi='scheduled';
        this.state.page=1;
        this.render();
      });
    };

    interviews.openBulkReschedule = function openBulkStructureReschedule(ids) {
      const list=ids.map(id=>this.interviews.find(item=>item.id===id)).filter(Boolean);
      if(!list.length)return;
      const courses=unique(list.map(item=>item.course));
      const options=this.structures.filter(structure=>structure.active!==false && courses.every(course=>!structure.course||!course||structure.course===course));
      if(!options.length){
        this.openModal('Reschedule Selected Interviews',`<div class="im-under-development"><span><i class="fas fa-layer-group"></i></span><h3>No common Interview Structure</h3><p>The selected interviews do not share an active structure mapping. Reschedule them separately so each record keeps a valid structure.</p><button type="button" class="btn btn-primary" data-im-close>Close</button></div>`,'sm');
        return;
      }
      const currentIds=unique(list.map(item=>item.structureId));
      const currentId=currentIds.length===1&&options.some(structure=>structure.id===currentIds[0])?currentIds[0]:'';
      const date=normalize(list[0].datetime).slice(0,10)||this.dateKey(new Date());
      const time=normalize(list[0].datetime).slice(11,16)||'10:00';
      this.openModal('Reschedule Selected Interviews',`<form class="im-form" id="im-reschedule-form"><div class="im-form-grid"><label><span>New Date <b>*</b></span><input type="date" name="date" value="${date}" required /></label><label><span>Starting Time <b>*</b></span><input type="time" name="time" value="${time}" required /></label><label><span>Interview Structure <b>*</b></span><select name="structureId" required><option value="">Select Interview Structure</option>${options.map(structure=>`<option value="${this.escape(structure.id)}" ${structure.id===currentId?'selected':''}>${this.escape(structure.name)}</option>`).join('')}</select></label></div><div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button type="submit" class="btn btn-primary">Reschedule ${list.length}</button></div></form>`,'md');
      document.getElementById('im-reschedule-form')?.addEventListener('submit',event=>{
        event.preventDefault();
        if(!event.currentTarget.reportValidity())return;
        const data=Object.fromEntries(new FormData(event.currentTarget).entries());
        list.forEach((item,index)=>{
          item.datetime=`${data.date}T${addMinutes(data.time,index*60)}`;
          item.structureId=data.structureId;
          item.status=isCanceled(item)?'Scheduled':'Rescheduled';
          delete item.cancellationReason;
        });
        this.selectedRows.clear();
        this.saveInterviews();
        this.closeModal();
        this.state.activeKpi='scheduled';
        this.state.page=1;
        this.render();
      });
    };

    interviews.openScheduledEditForm = function openScheduledEditForm(id) {
      const item=this.interviews.find(row=>row.id===id);
      if(!item)return;
      this.openPendingScheduleForm(id);
      const title=document.getElementById('im-modal-title');
      if(title)title.textContent='Edit Interview';
      const subtitle=document.querySelector('#ams-interview-modal .imia-modal-subtitle');
      if(subtitle)subtitle.textContent=`Update the scheduled interview details for ${item.name}.`;
      const submit=document.querySelector('#imia-single-assign-form button[type="submit"]');
      if(submit)submit.innerHTML='<i class="fas fa-floppy-disk"></i> Save Changes';
    };

    interviews.openBulkScheduledEditForm = function openBulkScheduledEditForm(ids) {
      if(!ids.length)return;
      if(ids.length===1)return this.openScheduledEditForm(ids[0]);
      this.openBulkInterviewAssignForm(ids);
      const title=document.getElementById('im-modal-title');
      if(title)title.textContent='Edit Selected Interviews';
      const subtitle=document.querySelector('#ams-interview-modal .imia-modal-subtitle');
      if(subtitle)subtitle.textContent=`Update scheduling details for ${ids.length} selected interviews.`;
      const submit=document.querySelector('#imia-bulk-assign-form button[type="submit"]');
      if(submit)submit.innerHTML='<i class="fas fa-floppy-disk"></i> Save Changes';
    };

    interviews.openInterviewResultView = function openInterviewResultView(id, nested=false) {
      if(!this.interviews.some(row=>row.id===id))return;
      this.openInterviewDetail(id,false,nested?{nested:true}:{});
    };

    interviews.openBulkInterviewResults = function openBulkInterviewResults(ids) {
      const rows=ids.map(id=>this.interviews.find(item=>item.id===id)).filter(Boolean);
      if(!rows.length)return;
      if(rows.length===1)return this.openInterviewResultView(rows[0].id);
      this.openModal('Interview Results',`<div class="imia-result-summary"><div class="imia-result-summary-head"><div><strong>${rows.length} selected interview results</strong><span>Open any result for complete student, course, structure, evaluation, score and remarks details.</span></div></div><div class="im-table-wrap"><table class="im-table imia-result-table"><thead><tr><th>Student</th><th>Course</th><th>Interview Structure</th><th>Status</th><th>Score / Outcome</th><th>Remarks</th><th>Action</th></tr></thead><tbody>${rows.map(item=>{const structure=structureRecord(this,item);return `<tr><td><strong>${this.escape(item.name||'—')}</strong><small>${this.escape(this.otrIdForInterview(item)||item.studentId||'—')}</small></td><td>${this.escape(item.course||'—')}</td><td>${this.escape(structure?.name||'Not mapped')}</td><td><span class="im-status ${this.statusClass(item.status)}">${this.escape(item.status||'—')}</span></td><td class="imia-result-score">${item.score?`${this.escape(item.score)}/100`:'—'}</td><td class="imia-result-remarks">${this.escape(item.remarks||'No remarks recorded')}</td><td><button type="button" class="im-stage-action" data-im-row-action="view-result-stage" data-id="${this.escape(item.id)}"><i class="fas fa-eye"></i> View Result</button></td></tr>`;}).join('')}</tbody></table></div></div>`,'lg');
    };

    interviews.startSelectedInterviews = function startSelectedInterviews(ids) {
      const rows=ids.map(id=>this.interviews.find(item=>item.id===id)).filter(Boolean);
      if(!rows.length)return;
      rows.forEach(item=>{item.status='In Progress';item.score='';});
      this.selectedRows.clear();
      this.saveInterviews();
      this.state.activeKpi='scheduled';
      this.state.page=1;
      this.render();
      this.openInterviewDetail(rows[0].id);
    };

    interviews.nextInterviewRecordId = function nextInterviewRecordId() {
      const max=this.interviews.reduce((largest,item)=>{
        const match=normalize(item.id||item.interviewNumber).match(/(\d+)/g);
        const value=match?.length?Number(match.join('')):0;
        return Number.isFinite(value)?Math.max(largest,value):largest;
      },0);
      return `IV-${String(max+1).padStart(8,'0')}`;
    };

    interviews.openNextStructureInterviewForm = function openNextStructureInterviewForm(sourceId,options={}) {
      const source=this.interviews.find(item=>item.id===sourceId);
      const nextStructure=source?this.nextRequiredStructureFor(source):null;
      if(!source||!nextStructure)return;
      this.openPendingScheduleForm(sourceId);
      const title=document.getElementById('im-modal-title');
      if(title)title.textContent=`Interview Schedule for ${source.name}`;
      const subtitle=document.querySelector('#ams-interview-modal .imia-modal-subtitle');
      if(subtitle)subtitle.textContent=`Schedule the next required interview structure: ${nextStructure.name}.`;
      const form=document.getElementById('imia-single-assign-form');
      if(!form)return;
      const defaults={structureId:nextStructure.id,date:this.dateKey(new Date()),startTime:'',endTime:'',interviewerId:'',mode:nextStructure.mode||source.mode||''};
      Object.entries(defaults).forEach(([name,value])=>{if(form.elements[name])form.elements[name].value=value;});
      const submitButton=form.querySelector('button[type="submit"]');
      if(submitButton)submitButton.innerHTML='<i class="fas fa-plus"></i> Schedule New Interview';
      form.addEventListener('submit',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        if(!event.currentTarget.reportValidity())return;
        const data=Object.fromEntries(new FormData(event.currentTarget).entries());
        if(data.endTime<=data.startTime){event.currentTarget.elements.endTime.setCustomValidity('End Time must be later than Start Time.');event.currentTarget.elements.endTime.reportValidity();return;}
        event.currentTarget.elements.endTime.setCustomValidity('');
        const selectedStructure=structureRecord(this,data.structureId);
        const validForCourse=selectedStructure&&selectedStructure.active!==false&&(!selectedStructure.course||!source.course||selectedStructure.course===source.course);
        if(!validForCourse){
          event.currentTarget.elements.structureId.setCustomValidity('Select an active Interview Structure mapped to this course.');
          event.currentTarget.elements.structureId.reportValidity();
          return;
        }
        const duplicate=this.interviewHistoryFor(source).some(candidate=>!isCanceled(candidate)&&candidate.structureId===data.structureId);
        if(duplicate){
          event.currentTarget.elements.structureId.setCustomValidity('This Interview Structure is already represented in the student interview history.');
          event.currentTarget.elements.structureId.reportValidity();
          return;
        }
        event.currentTarget.elements.structureId.setCustomValidity('');
        const newId=this.nextInterviewRecordId();
        const newInterview={
          id:newId,
          interviewNumber:newId,
          parentInterviewId:source.id,
          admissionKey:source.admissionKey,
          admissionNo:source.admissionNo,
          studentId:source.studentId,
          inquiryId:source.inquiryId,
          otrNo:source.otrNo,
          otr:source.otr,
          name:source.name,
          email:source.email,
          phone:source.phone,
          course:source.course,
          batch:source.batch,
          learningMode:source.learningMode,
          program:source.program,
          programme:source.programme,
          programName:source.programName,
          applicationDate:source.applicationDate,
          submittedDate:source.submittedDate,
          structureId:data.structureId,
          datetime:`${data.date}T${data.startTime}`,
          endTime:data.endTime,
          interviewerId:data.interviewerId,
          mode:data.mode,
          status:'Scheduled',
          score:'',
          evaluation:{},
          remarks:'',
          createdAt:new Date().toISOString()
        };
        this.interviews.push(newInterview);
        this.selectedRows.delete(source.id);
        this.saveInterviews();
        this.closeModal();
        this.render();
        if(typeof options.onSaved==='function')options.onSaved(newInterview);
        else{this.state.activeKpi='scheduled';this.state.page=1;this.render();}
      },true);
    };

    interviews.openNextStructureQueue = function openNextStructureQueue(ids) {
      const queue=ids.filter(id=>{const item=this.interviews.find(row=>row.id===id);return item&&this.nextRequiredStructureFor(item);});
      if(!queue.length||queue.length!==ids.length)return;
      const next=()=>{
        const id=queue.shift();
        if(!id){this.selectedRows.clear();this.state.activeKpi='scheduled';this.state.page=1;this.render();return;}
        this.openNextStructureInterviewForm(id,{onSaved:()=>window.setTimeout(next,0)});
      };
      next();
    };

    interviews.handleRowAction = function handleRefinedInterviewRowAction(action,id) {
      if(action==='assign-stage')return this.openPendingScheduleForm(id);
      if(action==='scheduled-edit')return this.openScheduledEditForm(id);
      if(action==='scheduled-start')return this.setInterviewStatus(id,'In Progress',true);
      if(action==='view-result-stage')return this.openInterviewResultView(id,modalIsOpen());
      if(action==='completed-reschedule')return this.openStageRescheduleForm(id);
      if(action==='completed-new-interview')return this.openNextStructureInterviewForm(id);
      return previous.handleRowAction?previous.handleRowAction(action,id):undefined;
    };

    interviews.handleBulkAction = function handleRefinedInterviewBulkAction(action) {
      const stage=this.state.activeKpi;
      const ids=currentStageIds(this);
      if(stage==='pending'&&action==='assign')return ids.length?this.openBulkInterviewAssignForm(ids):undefined;
      if(stage==='scheduled'&&action==='edit')return this.openBulkScheduledEditForm(ids);
      if(stage==='scheduled'&&action==='start')return this.startSelectedInterviews(ids);
      if(stage==='completed'&&action==='view-result')return this.openBulkInterviewResults(ids);
      if(stage==='completed'&&action==='reschedule')return ids.length===1?this.openStageRescheduleForm(ids[0]):this.openBulkReschedule(ids);
      if(stage==='completed'&&action==='new-interview')return this.openNextStructureQueue(ids);
      return previous.handleBulkAction?previous.handleBulkAction(action):undefined;
    };

    interviews.resetFilters = function resetRefinedInterviewFilters() {
      Object.assign(this.state.filters,{search:'',otr:'',from:'',to:'',course:'all',batch:'all',learningMode:'all',interviewer:'all',structure:'all',status:'all',mode:'all',gender:'all',satsangi:'all'});
      delete this.state.filters.examScore;
      this.state.page=1;
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
      if (install() || attempts >= 240) window.clearInterval(timer);
    }, 25);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
