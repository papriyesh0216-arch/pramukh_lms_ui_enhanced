// ============================================================
// AMS INTERVIEW MANAGEMENT REFINEMENTS
// Scope: AMS -> Interview Scheduling / Interview Management only.
// Consumes Interview Structure + OTR data without modifying those modules.
// ============================================================

(() => {
  const INSTALL_FLAG = '__amsInterviewManagementRefinementsInstalled';
  const STAGE_FLAG = '__amsInterviewStageWorkflowInstalled';
  const INTERVIEW_TYPES = ['Academic', 'Non-Academic', 'Both'];

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

  function addMinutes(time, minutes) {
    const [hours = 0, mins = 0] = normalize(time).split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, mins + Number(minutes || 0));
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function validInterviewType(value) {
    return INTERVIEW_TYPES.includes(normalize(value)) ? normalize(value) : '';
  }

  function deriveInterviewType(item, structures) {
    const direct = validInterviewType(item?.interviewType);
    if (direct) return direct;
    const structure = structures.find(entry => entry.id === item?.structureId);
    const structureType = validInterviewType(structure?.interviewType || structure?.type);
    if (structureType) return structureType;
    const name = normalize(structure?.name).toLowerCase();
    if (name.includes('non-academic') || name.includes('non academic')) return 'Non-Academic';
    if (name.includes('academic')) return 'Academic';
    return 'Both';
  }

  function structureOptionsFor(interviews, course = '', currentId = '') {
    return interviews.structures.filter(structure => {
      if (structure.id === currentId) return true;
      if (!structure.active) return false;
      return !course || !structure.course || structure.course === course;
    });
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

  function ensureStyles() {
    if (document.getElementById('ams-interview-management-refinements-style')) return;
    const style = document.createElement('style');
    style.id = 'ams-interview-management-refinements-style';
    style.textContent = `
      #screen-ams-interviews #ams-interview-root .im-stage-filters .im-filter-search .im-search { position:relative;width:100%;max-width:none;height:34px; }
      #screen-ams-interviews #ams-interview-root .im-stage-filters .im-filter-search .im-search i { position:absolute;z-index:1;top:50%;left:10px;margin:0;color:var(--text-muted);font-size:10px;line-height:1;pointer-events:none;transform:translateY(-50%); }
      #screen-ams-interviews #ams-interview-root .im-stage-filters .im-filter-search .im-search input { box-sizing:border-box;width:100%;min-width:0;height:34px;padding:0 10px 0 32px;border-radius:8px; }
      #ams-interview-modal[aria-hidden="false"] { z-index:2147482000!important; }
      #ams-interview-modal .im-modal-dialog { overflow:visible; }
      #ams-interview-modal .im-modal-body { overflow:auto;overscroll-behavior:contain; }
      #ams-interview-modal .imia-modal-subtitle { margin:-2px 0 18px;color:var(--text-muted);font-size:11px;line-height:1.45; }
      #ams-interview-modal .imia-form { display:grid;gap:18px; }
      #ams-interview-modal .imia-single-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 22px;padding:18px;border:1px solid var(--border);border-radius:12px;background:var(--bg-card); }
      #ams-interview-modal .imia-section { display:grid;gap:13px;padding:0 0 18px;border-bottom:1px solid var(--divider); }
      #ams-interview-modal .imia-section:last-of-type { padding-bottom:0;border-bottom:0; }
      #ams-interview-modal .imia-section-title { display:flex;align-items:center;gap:9px;margin:0;color:var(--primary);font-size:13px;font-weight:800; }
      #ams-interview-modal .imia-section-title i { width:20px;text-align:center; }
      #ams-interview-modal .imia-four-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px; }
      #ams-interview-modal .imia-form label { display:grid;gap:7px;min-width:0; }
      #ams-interview-modal .imia-form label>span { color:var(--text-primary);font-size:10px;font-weight:700; }
      #ams-interview-modal .imia-form label>span b { color:var(--danger); }
      #ams-interview-modal .imia-form input,#ams-interview-modal .imia-form select { box-sizing:border-box;width:100%;min-width:0;min-height:44px;padding:0 12px;border:1px solid var(--border);border-radius:9px;outline:0;background:var(--bg-card);color:var(--text-primary);font-size:10px; }
      #ams-interview-modal .imia-form input:focus,#ams-interview-modal .imia-form select:focus { border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-light); }
      #ams-interview-modal .imia-form-actions { display:flex;justify-content:flex-end;gap:10px;padding-top:2px; }
      #ams-interview-modal .imia-form-actions .btn { min-width:112px; }
      #screen-ams-interviews #ams-interview-root .imia-type-tag { display:inline-flex;align-items:center;min-height:24px;padding:4px 8px;border:1px solid var(--border);border-radius:999px;font-size:8px;font-weight:800;white-space:nowrap; }
      #screen-ams-interviews #ams-interview-root .imia-type-tag.academic { border-color:rgba(37,99,235,.22);background:rgba(37,99,235,.08);color:#1d4ed8; }
      #screen-ams-interviews #ams-interview-root .imia-type-tag.non-academic { border-color:rgba(124,58,237,.22);background:rgba(124,58,237,.08);color:#6d28d9; }
      #screen-ams-interviews #ams-interview-root .imia-type-tag.both { border-color:rgba(8,145,178,.22);background:rgba(8,145,178,.08);color:#0e7490; }
      #screen-ams-interviews #ams-interview-root .im-stage-table.scheduled { min-width:1120px; }
      #screen-ams-interviews #ams-interview-root .imia-scheduled-actions { display:flex;gap:6px;align-items:center;flex-wrap:nowrap;white-space:nowrap; }
      #screen-ams-interviews #ams-interview-root .imia-scheduled-actions .im-stage-action { flex:0 0 auto; }
      @media(max-width:1050px){#ams-interview-modal .imia-four-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
      @media(max-width:680px){#ams-interview-modal .imia-single-grid,#ams-interview-modal .imia-four-grid{grid-template-columns:1fr;}#ams-interview-modal .imia-single-grid{padding:14px;}#ams-interview-modal .imia-form-actions{flex-direction:column-reverse;}#ams-interview-modal .imia-form-actions .btn{width:100%;}}
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (window[INSTALL_FLAG]) return true;
    const interviews = window.AMSInterviews;
    if (!interviews || !window[STAGE_FLAG]) return false;
    window[INSTALL_FLAG] = true;
    ensureStyles();

    const previous = {
      stageColumns: interviews.stageColumns?.bind(interviews),
      renderStageInterviewRow: interviews.renderStageInterviewRow?.bind(interviews),
      renderStageRowActions: interviews.renderStageRowActions?.bind(interviews),
      handleRowAction: interviews.handleRowAction?.bind(interviews),
      handleBulkAction: interviews.handleBulkAction?.bind(interviews)
    };

    interviews.state.filters.gender = interviews.state.filters.gender || 'all';
    interviews.state.filters.satsangi = interviews.state.filters.satsangi || 'all';
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
      const showScheduleFields = ['scheduled','completed','canceled'].includes(currentStage);
      return `<div class="im-filters im-stage-filters">
        <label class="im-filter-search"><span>Search</span><div class="im-search"><i class="fas fa-search"></i><input id="im-search" data-im-filter="search" value="${this.escape(f.search || '')}" placeholder="Search name, OTR ID, course, batch..." /></div></label>
        <label><span>OTR ID</span><input type="text" data-im-filter="otr" value="${this.escape(f.otr || '')}" placeholder="PA260001" /></label>
        ${this.filterSelect('course','Course',this.courses,f.course)}${this.filterSelect('batch','Batch',batches,f.batch || 'all')}${this.filterSelect('learningMode','Learning Mode',learningModes,f.learningMode || 'all')}${this.filterSelect('gender','Gender',genders,f.gender || 'all')}${this.filterSelect('satsangi','Satsangi',['Yes','No'],f.satsangi || 'all')}
        ${showScheduleFields ? `<label><span>From</span><input type="date" data-im-filter="from" value="${f.from || ''}" /></label><label><span>To</span><input type="date" data-im-filter="to" value="${f.to || ''}" /></label>${this.filterSelect('mode','Mode of Interview',interviewModes,f.mode || 'all')}` : ''}
        <button class="im-reset" type="button" data-im-action="reset"><i class="fas fa-rotate-left"></i> Reset</button></div>`;
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
        const searchText = `${item.name || ''} ${otrId} ${item.course || ''} ${item.batch || ''} ${item.email || ''} ${item.phone || ''}`.toLowerCase();
        return (!f.search || searchText.includes(normalize(f.search).toLowerCase())) && (!f.otr || normalize(otrId).toLowerCase().includes(normalize(f.otr).toLowerCase())) && (f.course === 'all' || !f.course || item.course === f.course) && (f.batch === 'all' || !f.batch || item.batch === f.batch) && (f.learningMode === 'all' || !f.learningMode || (item.learningMode || item.mode) === f.learningMode) && (f.gender === 'all' || !f.gender || gender === f.gender) && (f.satsangi === 'all' || !f.satsangi || satsangi === f.satsangi) && (!f.from || date >= f.from) && (!f.to || date <= f.to) && (f.mode === 'all' || !f.mode || item.mode === f.mode);
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

    interviews.stageColumns = function refinedStageColumns() {
      if (this.state.activeKpi === 'scheduled') return [['name','Name'],['otr','OTR ID'],['course','Course'],['batch','Batch'],['learningMode','Learning Mode'],['datetime','Date / Time'],['mode','Mode of Interview'],['interviewType','Interview Type'],['actions','Actions']];
      return previous.stageColumns ? previous.stageColumns() : [];
    };

    interviews.renderStageInterviewRow = function refinedStageInterviewRow(item,columns,index) {
      if (this.state.activeKpi !== 'scheduled') return previous.renderStageInterviewRow ? previous.renderStageInterviewRow(item,columns,index) : '';
      const interviewType = deriveInterviewType(item,this.structures);
      const typeClass = interviewType.toLowerCase().replace(/[^a-z]+/g,'-').replace(/^-|-$/g,'');
      const values = {
        name:`<div class="im-candidate"><span class="im-avatar">${this.initials(item.name)}</span><div><strong>${this.escape(item.name)}</strong><small>${this.escape(item.email || item.phone || '')}</small></div></div>`,
        otr:`<span class="im-otr-value">${this.escape(this.otrIdForInterview(item,index))}</span>`,course:this.escape(item.course || '—'),batch:this.escape(item.batch || '—'),learningMode:this.escape(item.learningMode || item.mode || '—'),
        datetime:item.datetime ? `<strong>${this.formatDate(item.datetime)}</strong><small>${this.formatTime(item.datetime)}</small>` : '—',
        mode:item.mode ? `<span class="im-mode ${normalize(item.mode).toLowerCase() === 'online' ? 'online' : 'person'}"><i class="fas ${normalize(item.mode).toLowerCase() === 'online' ? 'fa-display' : 'fa-building'}"></i>${this.escape(item.mode)}</span>` : '—',
        interviewType:`<span class="imia-type-tag ${typeClass}">${this.escape(interviewType)}</span>`,actions:this.renderStageRowActions(item)
      };
      return `<tr data-im-stage-row="${this.escape(item.id)}"><td><input type="checkbox" data-im-select="${this.escape(item.id)}" ${this.selectedRows.has(item.id) ? 'checked' : ''} /></td>${columns.map(([key]) => `<td>${values[key] ?? '—'}</td>`).join('')}</tr>`;
    };

    interviews.renderStageRowActions = function refinedStageRowActions(item) {
      if (this.stageKeyForInterview(item) === 'scheduled') return `<div class="im-stage-actions imia-scheduled-actions"><button type="button" class="im-stage-action" data-im-row-action="scheduled-edit-placeholder" data-id="${this.escape(item.id)}"><i class="fas fa-pen"></i> Edit</button><button type="button" class="im-stage-action" data-im-row-action="scheduled-start-placeholder" data-id="${this.escape(item.id)}"><i class="fas fa-play"></i> Start Interview</button><button type="button" class="im-stage-action" data-im-row-action="scheduled-result-placeholder" data-id="${this.escape(item.id)}"><i class="fas fa-eye"></i> View Result</button></div>`;
      return previous.renderStageRowActions ? previous.renderStageRowActions(item) : '';
    };

    interviews.openConstructionPopup = function openConstructionPopup() {
      this.openModal('Under Construction',`<div class="im-under-development"><span><i class="fas fa-screwdriver-wrench"></i></span><h3>Under Construction</h3><p>This interview action is not connected yet.</p><button type="button" class="btn btn-primary" data-im-close>Close</button></div>`,'sm');
    };

    interviews.openPendingScheduleForm = function openSinglePendingAssignForm(id) {
      const item = this.interviews.find(row => row.id === id);
      if (!item) return;
      const structures = structureOptionsFor(this,item.course,item.structureId);
      const date = normalize(item.datetime).slice(0,10) || this.dateKey(new Date());
      const start = normalize(item.datetime).slice(11,16) || '';
      const end = normalize(item.endTime) || (start ? addMinutes(start,30) : '');
      this.openModal(`Interview Schedule for ${item.name}`,`<p class="imia-modal-subtitle">Schedule and assign the interview details below.</p><form class="imia-form" id="imia-single-assign-form"><div class="imia-single-grid">
        <label><span>Interview Structure <b>*</b></span><select name="structureId" required><option value="">Select interview structure</option>${structures.map(structure => `<option value="${this.escape(structure.id)}" ${structure.id === item.structureId ? 'selected' : ''}>${this.escape(structure.name)}</option>`).join('')}</select></label>
        <label><span>Interview Date <b>*</b></span><input type="date" name="date" value="${this.escape(date)}" required /></label>
        <label><span>Start Time <b>*</b></span><input type="time" name="startTime" value="${this.escape(start)}" required /></label><label><span>End Time <b>*</b></span><input type="time" name="endTime" value="${this.escape(end)}" required /></label>
        <label><span>Interviewer Name <b>*</b></span><select name="interviewerId" required><option value="">Select interviewer</option>${this.interviewers.map(person => `<option value="${this.escape(person.id)}" ${person.id === item.interviewerId ? 'selected' : ''}>${this.escape(person.name)} · ${this.escape(person.department)}</option>`).join('')}</select></label>
        <label><span>Interview Mode <b>*</b></span><select name="mode" required><option value="">Select interview mode</option>${['Online','In-Person'].map(mode => `<option value="${mode}" ${mode === item.mode ? 'selected' : ''}>${mode}</option>`).join('')}</select></label></div>
        <div class="imia-form-actions"><button type="button" class="btn btn-outline" data-im-close><i class="fas fa-xmark"></i> Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Assign</button></div></form>`,'lg');
      document.getElementById('imia-single-assign-form')?.addEventListener('submit',event => {
        event.preventDefault();if(!event.currentTarget.reportValidity())return;const data=Object.fromEntries(new FormData(event.currentTarget).entries());
        if(data.endTime<=data.startTime){event.currentTarget.elements.endTime.setCustomValidity('End Time must be later than Start Time.');event.currentTarget.elements.endTime.reportValidity();return;}event.currentTarget.elements.endTime.setCustomValidity('');
        item.structureId=data.structureId;item.datetime=`${data.date}T${data.startTime}`;item.endTime=data.endTime;item.interviewerId=data.interviewerId;item.mode=data.mode;item.interviewType=deriveInterviewType(item,this.structures);item.status='Scheduled';
        this.saveInterviews();this.selectedRows.delete(item.id);this.closeModal();this.state.activeKpi='scheduled';this.state.page=1;this.render();
      });
    };

    interviews.openBulkInterviewAssignForm = function openBulkInterviewAssignForm(ids) {
      const selected=ids.map(id=>this.interviews.find(item=>item.id===id)).filter(Boolean);if(!selected.length)return;
      const selectedCourses=unique(selected.map(item=>item.course));const selectedPrograms=programValuesFor(selected);const commonCourse=selectedCourses.length===1?selectedCourses[0]:'';const commonProgram=selectedPrograms.length===1?selectedPrograms[0]:'';const modes=unique(selected.map(item=>item.mode));const commonMode=modes.length===1?normalize(selected[0].mode):'';
      const structures=structureOptionsFor(this,commonCourse,'');const date=normalize(selected[0]?.datetime).slice(0,10)||this.dateKey(new Date());const start=normalize(selected[0]?.datetime).slice(11,16)||'';const end=normalize(selected[0]?.endTime)||(start?addMinutes(start,30):'');const courseOptions=unique([...this.courses,...selectedCourses]);
      this.openModal('Schedule Interview',`<p class="imia-modal-subtitle">Fill in the details below to schedule and assign an interview.</p><form class="imia-form" id="imia-bulk-assign-form">
        <section class="imia-section"><h3 class="imia-section-title"><i class="far fa-clock"></i>1. Interview Timing</h3><div class="imia-four-grid"><label><span>Interview Date <b>*</b></span><input type="date" name="date" value="${this.escape(date)}" required /></label><label><span>Start Time <b>*</b></span><input type="time" name="startTime" value="${this.escape(start)}" required /></label><label><span>End Time <b>*</b></span><input type="time" name="endTime" value="${this.escape(end)}" required /></label><label><span>Interview Structure <b>*</b></span><select name="structureId" required><option value="">Select structure</option>${structures.map(structure=>`<option value="${this.escape(structure.id)}">${this.escape(structure.name)}</option>`).join('')}</select></label></div></section>
        <section class="imia-section"><h3 class="imia-section-title"><i class="fas fa-graduation-cap"></i>2. Academic Details</h3><div class="imia-four-grid"><label><span>Course <b>*</b></span><select name="course" required><option value="">${selectedCourses.length>1?'Select course for selected students':'Select course'}</option>${courseOptions.map(course=>`<option value="${this.escape(course)}" ${course===commonCourse?'selected':''}>${this.escape(course)}</option>`).join('')}</select></label><label><span>Program <b>*</b></span><select name="program" required><option value="">Select program</option>${selectedPrograms.map(program=>`<option value="${this.escape(program)}" ${program===commonProgram?'selected':''}>${this.escape(program)}</option>`).join('')}</select></label><label><span>Interviewer Name <b>*</b></span><select name="interviewerId" required><option value="">Select interviewer</option>${this.interviewers.map(person=>`<option value="${this.escape(person.id)}">${this.escape(person.name)} · ${this.escape(person.department)}</option>`).join('')}</select></label><label><span>Interview Mode</span><select name="mode"><option value="">Select mode</option>${['Online','In-Person'].map(mode=>`<option value="${mode}" ${mode===commonMode?'selected':''}>${mode}</option>`).join('')}</select></label></div></section>
        <section class="imia-section"><h3 class="imia-section-title"><i class="fas fa-mug-hot"></i>3. Break Timing</h3><div class="imia-four-grid"><label><span>Break (From) <b>*</b></span><input type="time" name="breakFrom" required /></label><label><span>Break (To) <b>*</b></span><input type="time" name="breakTo" required /></label><label><span>Interviewing Time (in minutes) <b>*</b></span><input type="number" name="interviewMinutes" min="1" step="1" placeholder="Enter minutes" required /></label><label><span>Interview Type</span><select name="interviewType"><option value="">Select type</option>${INTERVIEW_TYPES.map(type=>`<option value="${type}">${type}</option>`).join('')}</select></label></div></section>
        <div class="imia-form-actions"><button type="button" class="btn btn-outline" data-im-close><i class="fas fa-xmark"></i> Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Assign</button></div></form>`,'xl');
      const form=document.getElementById('imia-bulk-assign-form');
      form?.elements.course?.addEventListener('change',event=>{const structureSelect=form.elements.structureId;const current=structureSelect.value;const options=structureOptionsFor(this,event.target.value,current);structureSelect.innerHTML=`<option value="">Select structure</option>${options.map(structure=>`<option value="${this.escape(structure.id)}" ${structure.id===current?'selected':''}>${this.escape(structure.name)}</option>`).join('')}`;if(current&&!options.some(structure=>structure.id===current))structureSelect.value='';});
      form?.addEventListener('submit',event=>{event.preventDefault();if(!event.currentTarget.reportValidity())return;const data=Object.fromEntries(new FormData(event.currentTarget).entries());if(data.endTime<=data.startTime){event.currentTarget.elements.endTime.setCustomValidity('End Time must be later than Start Time.');event.currentTarget.elements.endTime.reportValidity();return;}event.currentTarget.elements.endTime.setCustomValidity('');if(data.breakTo<=data.breakFrom){event.currentTarget.elements.breakTo.setCustomValidity('Break (To) must be later than Break (From).');event.currentTarget.elements.breakTo.reportValidity();return;}event.currentTarget.elements.breakTo.setCustomValidity('');const structure=this.structures.find(entry=>entry.id===data.structureId);const fallbackType=validInterviewType(data.interviewType)||deriveInterviewType({structureId:data.structureId},this.structures);selected.forEach(item=>{item.course=data.course;item.program=data.program;item.structureId=data.structureId;item.datetime=`${data.date}T${data.startTime}`;item.endTime=data.endTime;item.interviewerId=data.interviewerId;item.mode=data.mode||item.mode||structure?.mode||'In-Person';item.breakFrom=data.breakFrom;item.breakTo=data.breakTo;item.interviewDurationMinutes=Number(data.interviewMinutes);item.interviewType=fallbackType;item.status='Scheduled';});this.saveInterviews();this.selectedRows.clear();this.closeModal();this.state.activeKpi='scheduled';this.state.page=1;this.render();});
    };

    interviews.openStageRescheduleForm = function openRefinedStageRescheduleForm(ids) {
      const list=(Array.isArray(ids)?ids:[ids]).map(id=>this.interviews.find(item=>item.id===id)).filter(Boolean);if(!list.length)return;if(list.length>1)return this.openBulkReschedule(list.map(item=>item.id));
      const item=list[0];const date=normalize(item.datetime).slice(0,10)||this.dateKey(new Date());const time=normalize(item.datetime).slice(11,16)||'10:00';const wasCanceled=this.stageKeyForInterview(item)==='canceled';const structureOptions=structureOptionsFor(this,item.course,item.structureId);
      this.openModal('Reschedule Interview',`<div class="im-reschedule-context"><strong>${this.escape(item.name)}</strong> · ${this.escape(this.otrIdForInterview(item))}</div><form class="im-form" id="im-stage-reschedule-form"><div class="im-form-grid"><label><span>Date <b>*</b></span><input type="date" name="date" value="${date}" required /></label><label><span>Time <b>*</b></span><input type="time" name="time" value="${time}" required /></label><label><span>Interview Structure <b>*</b></span><select name="structureId" required><option value="">Select Interview Structure</option>${structureOptions.map(structure=>`<option value="${structure.id}" ${structure.id===item.structureId?'selected':''}>${this.escape(structure.name)}</option>`).join('')}</select></label><label><span>Interviewer <b>*</b></span><select name="interviewerId" required><option value="">Select Interviewer</option>${this.interviewers.map(person=>`<option value="${person.id}" ${person.id===item.interviewerId?'selected':''}>${this.escape(person.name)} · ${this.escape(person.department)}</option>`).join('')}</select></label><label><span>Mode of Interview <b>*</b></span><select name="mode" required>${['Online','In-Person'].map(mode=>`<option value="${mode}" ${mode===item.mode?'selected':''}>${mode}</option>`).join('')}</select></label></div><div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button type="submit" class="btn btn-primary">Save Reschedule</button></div></form>`,'md');
      document.getElementById('im-stage-reschedule-form')?.addEventListener('submit',event=>{event.preventDefault();if(!event.currentTarget.reportValidity())return;const data=Object.fromEntries(new FormData(event.currentTarget).entries());item.datetime=`${data.date}T${data.time}`;item.structureId=data.structureId;item.interviewerId=data.interviewerId;item.mode=data.mode;item.learningMode=item.learningMode||item.mode;item.status=wasCanceled?'Scheduled':'Rescheduled';delete item.cancellationReason;this.saveInterviews();this.closeModal();this.selectedRows.delete(item.id);this.state.activeKpi='scheduled';this.state.page=1;this.render();});
    };

    interviews.handleRowAction = function refinedInterviewRowAction(action,id) {
      if(action==='assign-stage')return this.openPendingScheduleForm(id);
      if(['scheduled-edit-placeholder','scheduled-start-placeholder','scheduled-result-placeholder'].includes(action))return this.openConstructionPopup();
      return previous.handleRowAction ? previous.handleRowAction(action,id) : undefined;
    };

    interviews.handleBulkAction = function refinedInterviewBulkAction(action) {
      if(this.state.activeKpi==='pending'&&action==='assign'){const ids=[...this.selectedRows].filter(id=>{const item=this.interviews.find(row=>row.id===id);return item&&this.stageKeyForInterview(item)==='pending';});if(!ids.length)return;return this.openBulkInterviewAssignForm(ids);}return previous.handleBulkAction ? previous.handleBulkAction(action) : undefined;
    };

    interviews.resetFilters = function resetRefinedInterviewFilters() {
      Object.assign(this.state.filters,{search:'',otr:'',from:'',to:'',course:'all',batch:'all',learningMode:'all',interviewer:'all',structure:'all',status:'all',mode:'all',gender:'all',satsangi:'all'});delete this.state.filters.examScore;this.state.page=1;this.render();
    };

    interviews.render();
    return true;
  }

  function boot() {
    if (install()) return;
    let attempts = 0;
    const timer = window.setInterval(() => { attempts += 1; if (install() || attempts >= 200) window.clearInterval(timer); }, 25);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
