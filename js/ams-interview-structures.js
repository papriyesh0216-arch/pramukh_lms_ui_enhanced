// ============================================================
// AMS INTERVIEW STRUCTURES - Structure cards and connected attributes
// Canonical live source for all Interview Management structure mappings.
// ============================================================

const AMSInterviewStructures = {
  app: null,
  bound: false,
  currentView: 'section',
  currentStructureId: '',
  draggingId: '',
  dragBlocked: false,
  suppressClickUntil: 0,
  modelVersionKey: 'paAMSInterviewStructureModelV3',
  archiveStorageKey: 'paAMSInterviewStructureArchive',

  messageConfigurations: [
    {
      id: 'email-schedule',
      name: 'Interview Schedule - Email',
      channel: 'Email',
      status: 'Active',
      subject: 'Your interview has been scheduled',
      body: 'Dear {{student_name}},\n\nYour {{structure_name}} interview for {{course_name}} is scheduled on {{interview_date}} at {{interview_time}}.\n\nRegards,\nPramukh Academy Admission Team',
      placeholders: ['student_name', 'structure_name', 'course_name', 'interview_date', 'interview_time']
    },
    {
      id: 'sms-schedule',
      name: 'Interview Schedule - SMS',
      channel: 'SMS',
      status: 'Active',
      subject: 'Interview scheduled',
      body: 'Hello {{student_name}}, your {{structure_name}} interview is on {{interview_date}} at {{interview_time}}. - Pramukh Academy',
      placeholders: ['student_name', 'structure_name', 'interview_date', 'interview_time']
    },
    {
      id: 'whatsapp-reminder',
      name: 'Interview Reminder - WhatsApp',
      channel: 'WhatsApp',
      status: 'Active',
      subject: 'Interview reminder',
      body: 'Namaste {{student_name}}, this is a reminder for your {{course_name}} interview at {{interview_time}} on {{interview_date}}.',
      placeholders: ['student_name', 'course_name', 'interview_date', 'interview_time']
    },
    {
      id: 'result-update',
      name: 'Interview Result Update',
      channel: 'Email + SMS',
      status: 'Inactive',
      subject: 'Interview result update',
      body: 'Dear {{student_name}}, your interview result for {{course_name}} is now available in the admission portal.',
      placeholders: ['student_name', 'course_name']
    }
  ],

  init(app) {
    this.app = app;
    this.ensureData();
    this.installLiveMapping(app);
    if (this.bound) return;
    this.bound = true;
    document.addEventListener('click', event => this.handleClick(event));
    document.addEventListener('pointerdown', event => {
      this.dragBlocked = Boolean(event.target.closest?.('.ims-card-actions'));
    });
    document.addEventListener('dragstart', event => this.handleDragStart(event));
    document.addEventListener('dragover', event => this.handleDragOver(event));
    document.addEventListener('dragleave', event => this.handleDragLeave(event));
    document.addEventListener('drop', event => this.handleDrop(event));
    document.addEventListener('dragend', () => this.finishDrag());
    document.addEventListener('keydown', event => {
      const card = event.target.matches?.('[data-ims-action="open-structure"]') ? event.target : null;
      if (card && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.openManagement(card.dataset.structureId);
      }
    });
  },

  ensureData() {
    if (!this.app) return;
    let changed = false;
    const structures = Array.isArray(this.app.structures) ? this.app.structures : [];
    this.app.structures = structures
      .filter(structure => structure && structure.id && structure.name)
      .map(structure => {
        const groups = Array.isArray(structure.groups) ? structure.groups : [];
        const messageId = structure.messageId || this.defaultMessageId(structure.message);
        if (!Array.isArray(structure.groups) || !structure.messageId) changed = true;
        return this.withCounts({
          ...structure,
          messageId,
          active: structure.active !== false,
          groups
        });
      });
    if (localStorage.getItem(this.modelVersionKey) !== '3') {
      localStorage.setItem(this.modelVersionKey, '3');
      changed = true;
    }
    if (changed) this.save();
  },

  defaultMessageId(message = '') {
    if (/sms only/i.test(message)) return 'sms-schedule';
    if (/whatsapp/i.test(message)) return 'whatsapp-reminder';
    return 'email-schedule';
  },

  withCounts(structure) {
    const groups = (structure.groups || []).sort((a, b) => a.sequence - b.sequence).map((group, groupIndex) => ({
      ...group,
      sequence: groupIndex + 1,
      attributes: (group.attributes || []).sort((a, b) => a.sequence - b.sequence).map((attribute, attributeIndex) => ({ ...attribute, groupId: group.id, sequence: attributeIndex + 1 }))
    }));
    return { ...structure, groups, rounds: groups.length, attributes: groups.reduce((sum, group) => sum + group.attributes.length, 0) };
  },

  save() {
    this.app.structures = this.app.structures.map(structure => this.withCounts(structure));
    this.app.saveStructures();
  },

  clone(value) {
    if (!value) return value;
    try { return JSON.parse(JSON.stringify(value)); } catch (error) { return value; }
  },

  readArchive() {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.archiveStorageKey) || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  },

  archivedStructure(id) {
    if (!id) return null;
    const archive = this.app?.structureArchive || this.readArchive();
    return archive[id] || null;
  },

  archiveStructure(structure) {
    if (!structure?.id) return;
    const archive = this.readArchive();
    const snapshot = this.clone({ ...structure, archivedAt: new Date().toISOString() });
    archive[structure.id] = snapshot;
    try { localStorage.setItem(this.archiveStorageKey, JSON.stringify(archive)); } catch (error) {}
    if (this.app) this.app.structureArchive = { ...(this.app.structureArchive || {}), [structure.id]: snapshot };
  },

  selectableStructures(course = '', currentId = '') {
    const normalizedCourse = String(course || '').trim();
    return (this.app?.structures || []).filter(structure => {
      if (structure.id === currentId) return true;
      if (structure.active === false) return false;
      return !normalizedCourse || !structure.course || structure.course === normalizedCourse;
    });
  },

  isSelectableStructure(structureId, course = '', currentId = '') {
    const structure = this.app?.structures?.find(item => item.id === structureId);
    if (!structure) return false;
    if (structure.id === currentId) return true;
    if (structure.active === false) return false;
    return !course || !structure.course || structure.course === course;
  },

  evaluationStructureFor(item) {
    if (!item) return null;
    const live = this.app?.structures?.find(structure => structure.id === item.structureId) || null;
    const archived = this.archivedStructure(item.structureId);
    const historical = item.status === 'Completed' || Boolean(item.evaluation && Object.keys(item.evaluation).length);
    const snapshot = historical ? item.evaluationStructureSnapshot : null;
    if (snapshot) {
      return {
        ...this.clone(snapshot),
        name: live?.name || snapshot.name,
        course: live?.course || snapshot.course,
        mode: live?.mode || snapshot.mode,
        active: live ? live.active : snapshot.active
      };
    }
    return live || archived || null;
  },

  installLiveMapping(app) {
    if (!app || app.__amsInterviewStructureLiveMappingInstalled) return;
    app.__amsInterviewStructureLiveMappingInstalled = true;
    app.structureArchive = this.readArchive();

    // Neutralize the legacy fallback list for any subsequent structure initialization.
    app.defaultStructures = () => [];

    app.structureById = id => {
      if (!id) return null;
      return app.structures.find(structure => structure.id === id) || this.archivedStructure(id) || null;
    };

    app.selectableInterviewStructures = (course = '', currentId = '') => this.selectableStructures(course, currentId);
    app.evaluationStructureFor = item => this.evaluationStructureFor(item);

    let snapshotsChanged = false;
    app.interviews.forEach(item => {
      const historical = item.status === 'Completed' || Boolean(item.evaluation && Object.keys(item.evaluation).length);
      if (!historical || item.evaluationStructureSnapshot) return;
      const source = app.structures.find(structure => structure.id === item.structureId) || this.archivedStructure(item.structureId);
      if (!source) return;
      item.evaluationStructureSnapshot = this.clone(source);
      snapshotsChanged = true;
    });
    if (snapshotsChanged) app.saveInterviews();

    const originalSaveEvaluation = app.saveEvaluation?.bind(app);
    if (originalSaveEvaluation) {
      app.saveEvaluation = (id, complete = false) => {
        const item = app.interviews.find(interview => interview.id === id);
        if (item && complete && !item.evaluationStructureSnapshot) {
          const structure = app.structures.find(entry => entry.id === item.structureId) || this.archivedStructure(item.structureId);
          if (structure) item.evaluationStructureSnapshot = this.clone(structure);
        }
        return originalSaveEvaluation(id, complete);
      };
    }

    const originalOpenInterviewDetail = app.openInterviewDetail?.bind(app);
    if (originalOpenInterviewDetail) {
      app.openInterviewDetail = (id, ...args) => {
        const item = app.interviews.find(interview => interview.id === id);
        const evaluationStructure = this.evaluationStructureFor(item);
        if (!item || !evaluationStructure) return originalOpenInterviewDetail(id, ...args);
        const liveResolver = app.structureById;
        app.structureById = queryId => queryId === item.structureId ? evaluationStructure : liveResolver(queryId);
        try { return originalOpenInterviewDetail(id, ...args); }
        finally { app.structureById = liveResolver; }
      };
    }

    app.openStudentOverallReport = row => {
      const interviews = app.interviewsForStudent(row)
        .filter(item => item.status === 'Completed' || Object.keys(item.evaluation || {}).length);
      if (!interviews.length) return;
      const sections = interviews.map(item => {
        const structure = this.evaluationStructureFor(item);
        const interviewer = app.interviewerById(item.interviewerId);
        const attributes = (structure?.groups || []).flatMap(group => group.attributes || []);
        return `<section class="ams-overall-report-section">
          <header><div><i class="far fa-hand-point-right"></i><strong>${app.escape(structure?.name || 'Interview Result')}</strong></div></header>
          <div class="ams-report-meta"><span><i class="fas fa-user"></i><b>Interviewer:</b> ${app.escape(interviewer?.name || 'Not Assigned')}</span><span><i class="fas fa-user"></i><b>Interview Date:</b> ${app.formatDate(item.datetime)}</span></div>
          <dl>${attributes.map(attribute => `<div><dt>${app.escape(attribute.name)}</dt><dd>${app.escape(item.evaluation?.[attribute.id] || '—')}</dd></div>`).join('')}
            <div><dt>Total</dt><dd>${app.escape(item.score || '0')}</dd></div>
            <div class="wide"><dt>Remarks</dt><dd>${app.escape(item.remarks || '—')}</dd></div>
          </dl>
        </section>`;
      }).join('');
      app.openWideModal(`Overall Interview Report · ${row.name}`, `<div class="ams-overall-report">${sections}</div>`);
    };

    app.studentScheduleForm = (row, existing) => {
      const date = existing?.datetime?.slice(0, 10) || app.state.selectedDate || app.dateKey(new Date());
      const startTime = existing?.datetime?.slice(11, 16) || '10:00';
      const endTime = existing?.endTime || '11:00';
      const options = this.selectableStructures(row?.course || existing?.course || '', existing?.structureId || '');
      const currentExists = existing?.structureId && app.structures.some(item => item.id === existing.structureId);
      const historical = existing?.structureId && !currentExists ? app.structureById(existing.structureId) : null;
      return `<section class="ams-student-schedule-panel">
        <header><i class="fas fa-hourglass-half"></i><strong>${existing ? 'Edit Scheduled Interview' : 'Schedule Interview'}</strong></header>
        <form id="ams-student-schedule-form">
          <label><span>Interview Date<b>*</b></span><input type="date" name="date" value="${date}" required></label>
          <label><span>Start Time<b>*</b></span><input type="time" name="startTime" value="${startTime}" required></label>
          <label><span>End Time<b>*</b></span><input type="time" name="endTime" value="${endTime}" required></label>
          <label><span>Interview Structure<b>*</b></span><select name="structureId" required><option value="">${historical ? `${app.escape(historical.name)} was removed — select a current structure` : 'Select'}</option>${options.map(item => `<option value="${app.escape(item.id)}" ${item.id === existing?.structureId ? 'selected' : ''}>${app.escape(item.name)}${item.active === false ? ' (Inactive)' : ''}</option>`).join('')}</select></label>
          <label><span>Interviewer Name<b>*</b></span><select name="interviewerId" required><option value="">Select Interviewer</option>${app.interviewers.map(item => `<option value="${app.escape(item.id)}" ${item.id === existing?.interviewerId ? 'selected' : ''}>${app.escape(item.name)}</option>`).join('')}</select></label>
          <div class="ams-student-schedule-actions"><button type="submit" class="btn btn-primary">Save &amp; Next</button><button type="button" class="btn btn-danger" id="ams-student-schedule-cancel">Cancel</button></div>
        </form>
      </section>`;
    };

    const originalOpenStudentSchedule = app.openStudentSchedule?.bind(app);
    if (originalOpenStudentSchedule) {
      app.openStudentSchedule = (...args) => {
        const result = originalOpenStudentSchedule(...args);
        const row = args[0];
        const editId = args[2] || '';
        const existing = editId ? app.interviews.find(item => item.id === editId) : null;
        const form = document.getElementById('ams-student-schedule-form');
        form?.addEventListener('submit', event => {
          const structureId = String(new FormData(event.currentTarget).get('structureId') || '');
          const valid = this.isSelectableStructure(structureId, row?.course || existing?.course || '', existing?.structureId || '');
          if (valid) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          event.currentTarget.elements.structureId.setCustomValidity('Select an active Interview Structure mapped to this course.');
          event.currentTarget.elements.structureId.reportValidity();
        }, true);
        return result;
      };
    }

    app.openScheduleForm = (id = '', markRescheduled = false, nested = false) => {
      const existing = app.interviews.find(item => item.id === id);
      const candidates = app.uniqueCandidates();
      const defaultCandidate = existing || candidates[0];
      if (!defaultCandidate) return;
      const renderStructureOptions = candidate => {
        const options = this.selectableStructures(candidate?.course || existing?.course || '', existing?.structureId || '');
        const currentExists = existing?.structureId && app.structures.some(item => item.id === existing.structureId);
        const historical = existing?.structureId && !currentExists ? app.structureById(existing.structureId) : null;
        const missing = historical ? `<option value="">${app.escape(historical.name)} was removed — select a current structure</option>` : '<option value="">Select Interview Structure</option>';
        return `${missing}${options.map(item => `<option value="${app.escape(item.id)}" ${item.id === (existing?.structureId || candidate?.structureId) ? 'selected' : ''}>${app.escape(item.name)}</option>`).join('')}`;
      };
      const date = existing?.datetime?.slice(0, 10) || app.state.selectedDate || app.dateKey(new Date());
      const time = existing?.datetime?.slice(11, 16) || '10:00';
      app.openModal(existing ? (markRescheduled ? 'Reschedule Interview' : 'Edit Interview') : 'Schedule Interview', `
        <form class="im-form" id="im-schedule-form">
          <div class="im-form-grid">
            <label><span>Student <b>*</b></span><select name="studentId" required ${existing ? 'disabled' : ''}>${candidates.map(item => `<option value="${app.escape(item.studentId)}" ${(existing?.studentId || defaultCandidate.studentId) === item.studentId ? 'selected' : ''}>${app.escape(item.name)} · ${app.escape(item.course)}</option>`).join('')}</select></label>
            <label><span>Interview Structure <b>*</b></span><select name="structureId" required>${renderStructureOptions(defaultCandidate)}</select></label>
            <label><span>Date <b>*</b></span><input type="date" name="date" value="${date}" required /></label>
            <label><span>Time <b>*</b></span><input type="time" name="time" value="${time}" required /></label>
            <label><span>Interviewer</span><select name="interviewerId"><option value="">Awaiting Assignment</option>${app.interviewers.map(item => `<option value="${app.escape(item.id)}" ${item.id === existing?.interviewerId ? 'selected' : ''}>${app.escape(item.name)} · ${app.escape(item.department)}</option>`).join('')}</select></label>
            <label><span>Interview Mode <b>*</b></span><select name="mode" required>${['Online', 'In-Person'].map(mode => `<option ${mode === (existing?.mode || 'In-Person') ? 'selected' : ''}>${mode}</option>`).join('')}</select></label>
          </div>
          <div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button class="btn btn-primary" type="submit"><i class="fas fa-calendar-check"></i>${existing ? 'Save Changes' : 'Schedule Interview'}</button></div>
        </form>
      `, markRescheduled ? 'md' : 'lg', { nested });
      const scheduleForm = document.getElementById('im-schedule-form');
      scheduleForm?.elements.studentId?.addEventListener('change', event => {
        const candidate = candidates.find(item => item.studentId === event.target.value);
        if (candidate) scheduleForm.elements.structureId.innerHTML = renderStructureOptions(candidate);
      });
      scheduleForm?.addEventListener('submit', event => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const candidate = existing || candidates.find(item => item.studentId === data.studentId);
        const valid = this.isSelectableStructure(data.structureId, candidate?.course || '', existing?.structureId || '');
        if (!valid) {
          event.currentTarget.elements.structureId.setCustomValidity('Select an active Interview Structure mapped to this course.');
          event.currentTarget.elements.structureId.reportValidity();
          return;
        }
        event.currentTarget.elements.structureId.setCustomValidity('');
        if (existing) {
          Object.assign(existing, {
            structureId: data.structureId,
            datetime: `${data.date}T${data.time}`,
            interviewerId: data.interviewerId,
            mode: data.mode,
            status: existing.status === 'Completed' ? 'Completed' : markRescheduled ? 'Rescheduled' : (data.interviewerId ? 'Scheduled' : 'Awaiting Assignment')
          });
        } else {
          const nextNumber = String(Date.now()).slice(-6);
          app.interviews.push({ ...candidate, id: `IV-${nextNumber}`, structureId: data.structureId, datetime: `${data.date}T${data.time}`, interviewerId: data.interviewerId, mode: data.mode, status: data.interviewerId ? 'Scheduled' : 'Awaiting Assignment', score: '', evaluation: {}, remarks: '' });
        }
        app.state.selectedDate = data.date;
        app.state.calendarDate = data.date;
        app.saveInterviews();
        app.render();
        if (nested && existing) {
          app.modalStack = [];
          app.openInterviewDetail(existing.id);
        } else app.closeModal();
      });
    };

    app.openStructureForm = id => this.openStructureForm(id);
    app.handleStructureAction = (action, id) => {
      if (action === 'edit') return this.openStructureForm(id);
      if (action === 'toggle') return this.toggleStructure(id);
      if (action === 'delete') return this.deleteStructure(id);
    };

    window.addEventListener('ams:data-change', event => {
      if (event.detail?.source !== 'structures') return;
      app.structureArchive = this.readArchive();
      if (app.state?.filters?.structure !== 'all' && !app.structures.some(item => item.id === app.state.filters.structure)) {
        app.state.filters.structure = 'all';
      }
    });
  },

  renderSection() {
    const activeCount = this.app.structures.filter(structure => structure.active).length;
    return `<section class="im-card im-structures ims-structure-section ${this.app.state.structuresOpen ? 'open' : ''}">
      <div class="im-structures-head ims-section-head">
        <button type="button" data-ims-action="toggle-section"><i class="fas fa-chevron-${this.app.state.structuresOpen ? 'down' : 'right'}"></i><strong>Interview Structures</strong><span>${activeCount} Active</span></button>
        <div><button class="btn btn-outline btn-sm" type="button" data-ims-action="copy-attribute"><i class="fas fa-copy"></i> Copy Attribute</button><button class="btn btn-outline btn-sm" type="button" data-ims-action="manage-all"><i class="fas fa-gear"></i> Manage Structures</button></div>
      </div>
      ${this.app.state.structuresOpen ? `<div class="im-structure-grid ims-card-grid">${this.app.structures.map((structure, index) => this.cardHtml(structure, index)).join('')}</div>` : ''}
    </section>`;
  },

  cardHtml(structure, index, manager = false) {
    const selected = structure.id === this.currentStructureId;
    return `<article class="im-structure-card ims-structure-card ${structure.active ? '' : 'inactive'} ${selected ? 'selected' : ''}" role="button" tabindex="0" draggable="true" data-ims-action="open-structure" data-structure-id="${structure.id}" aria-pressed="${selected}">
      <span class="im-structure-icon tone-${index % 4}"><i class="fas ${structure.mode === 'Online' ? 'fa-display' : 'fa-people-arrows'}"></i></span>
      <div><strong>${this.escape(structure.name)}</strong><small>${this.escape(structure.course)} · ${structure.rounds} group${structure.rounds === 1 ? '' : 's'} · ${structure.attributes} attributes</small><em>${this.escape(structure.mode)}</em></div>
      <span class="im-active-badge ${structure.active ? 'active' : ''}">${structure.active ? 'Active' : 'Inactive'}</span>
      <div class="im-structure-actions ims-card-actions" draggable="false">
        <button type="button" draggable="false" data-ims-action="edit-structure" data-structure-id="${structure.id}" title="Edit structure"><i class="fas fa-pen"></i></button>
        <button type="button" draggable="false" data-ims-action="toggle-structure" data-structure-id="${structure.id}" title="${structure.active ? 'Deactivate' : 'Activate'} structure"><i class="fas ${structure.active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i></button>
        <button type="button" draggable="false" data-ims-action="delete-structure" data-structure-id="${structure.id}" title="Delete structure"><i class="fas fa-trash"></i></button>
      </div>
      ${manager ? `<span class="ims-open-hint"><i class="fas fa-arrow-right"></i></span>` : ''}
    </article>`;
  },

  handleClick(event) {
    const trigger = event.target.closest?.('[data-ims-action]');
    if (!trigger) return;
    const action = trigger.dataset.imsAction;
    const structureId = trigger.dataset.structureId;
    const groupId = trigger.dataset.groupId;
    const attributeId = trigger.dataset.attributeId;
    if (action === 'toggle-section') {
      this.app.state.structuresOpen = !this.app.state.structuresOpen;
      return this.app.render();
    }
    if (action === 'manage-all') return this.openAllStructures();
    if (action === 'add-structure') return this.openStructureForm();
    if (action === 'copy-attribute') return this.openCopyAttribute();
    if (action === 'open-structure') {
      if (Date.now() < this.suppressClickUntil) return;
      return this.openManagement(structureId);
    }
    if (action === 'edit-structure') return this.openStructureForm(structureId);
    if (action === 'toggle-structure') return this.toggleStructure(structureId);
    if (action === 'delete-structure') return this.deleteStructure(structureId);
    if (action === 'back-selected') return this.openManagement(structureId || this.currentStructureId);
    if (action === 'add-group') return this.openGroupForm(structureId);
    if (action === 'edit-group') return this.openGroupForm(structureId, groupId);
    if (action === 'delete-group') return this.deleteGroup(structureId, groupId);
    if (action === 'add-attribute') return this.openAttributeForm(structureId, groupId);
    if (action === 'edit-attribute' || action === 'attribute-settings') return this.openAttributeForm(structureId, groupId, attributeId, action === 'attribute-settings');
    if (action === 'delete-attribute') return this.deleteAttribute(structureId, groupId, attributeId);
  },

  structure(id) { return this.app.structures.find(structure => structure.id === id); },
  group(structure, id) { return structure?.groups.find(group => group.id === id); },
  attribute(group, id) { return group?.attributes.find(attribute => attribute.id === id); },

  open(title, content, size = 'lg', options = {}) {
    this.app.openModal(title, content, size, options);
  },

  previewHtml(messageId) {
    const template = this.messageConfigurations.find(item => item.id === messageId) || this.messageConfigurations[0];
    return `<section class="ims-message-preview"><header><div><i class="fas fa-envelope-open-text"></i><strong>${this.escape(template.name)}</strong><span>${this.escape(template.channel)}</span></div><b class="${template.status.toLowerCase()}">${template.status}</b></header><div><label>Subject</label><strong>${this.escape(template.subject)}</strong><label>Message Body</label><p>${this.escape(template.body).replace(/\n/g, '<br>')}</p><label>Available Placeholders</label><div class="ims-placeholder-list">${template.placeholders.map(item => `<code>{{${this.escape(item)}}}</code>`).join('')}</div></div></section>`;
  },

  openStructureForm(id = '') {
    const existing = this.structure(id);
    const structure = existing || { name: '', description: '', messageId: this.messageConfigurations[0].id, course: this.app.courses[0], mode: 'In-Person', active: true };
    const nested = document.getElementById('im-modal-title')?.textContent === 'Manage Interview Structures';
    this.currentView = 'form';
    this.open(existing ? 'Edit Interview Structure' : 'Add Interview Structure', `<form class="ims-form" id="ims-structure-form">
      <div class="ims-form-grid">
        <label><span>Structure Name <b>*</b></span><input name="name" value="${this.escape(structure.name)}" placeholder="Enter structure name" required /></label>
        <label><span>Message Configuration <b>*</b></span><select name="messageId" id="ims-message-select" required>${this.messageConfigurations.map(item => `<option value="${item.id}" ${item.id === structure.messageId ? 'selected' : ''}>${this.escape(item.name)}</option>`).join('')}</select></label>
        <label class="span-2"><span>Structure Description</span><textarea name="description" rows="3" placeholder="Describe the interview structure">${this.escape(structure.description)}</textarea></label>
        <label><span>Course Mapping <b>*</b></span><select name="course" required>${this.app.courses.map(course => `<option ${course === structure.course ? 'selected' : ''}>${this.escape(course)}</option>`).join('')}</select></label>
        <label><span>Interview Mode <b>*</b></span><select name="mode" required>${['Online', 'In-Person'].map(mode => `<option ${mode === structure.mode ? 'selected' : ''}>${mode}</option>`).join('')}</select></label>
        <label class="ims-check"><input type="checkbox" name="active" ${structure.active ? 'checked' : ''} /><span>Active structure</span></label>
      </div>
      <div class="ims-preview-wrap"><h3>Message Configuration Preview</h3><div id="ims-message-preview">${this.previewHtml(structure.messageId)}</div></div>
      <div class="ims-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-floppy-disk"></i>${existing ? 'Save Changes' : 'Save & Next'}</button></div>
    </form>`, 'lg', { nested });
    const form = document.getElementById('ims-structure-form');
    form?.elements.messageId?.addEventListener('change', event => {
      document.getElementById('ims-message-preview').innerHTML = this.previewHtml(event.target.value);
    });
    form?.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const template = this.messageConfigurations.find(item => item.id === data.messageId);
      if (existing) {
        Object.assign(existing, { ...data, message: template?.name || '', active: data.active === 'on' });
      } else {
        const newStructure = this.withCounts({ id: `STR-${String(Date.now()).slice(-7)}`, ...data, message: template?.name || '', active: data.active === 'on', groups: [] });
        this.app.structures.push(newStructure);
        id = newStructure.id;
      }
      this.save();
      this.app.render();
      this.openManagement(existing?.id || id);
    });
  },

  openAllStructures() {
    const target = this.structure(this.currentStructureId) || this.app.structures[0];
    if (target) this.openManagement(target.id);
  },

  openManagement(structureId) {
    const structure = this.structure(structureId);
    if (!structure) return;
    this.currentView = 'structure';
    this.currentStructureId = structureId;
    const mapped = this.app.interviews.filter(item => item.structureId === structure.id).length;
    this.open('Manage Interview Structures', `<div class="ims-management">
      <div class="ims-manager-toolbar"><div><strong>${this.app.structures.length} Interview Structures</strong><span>Drag cards to reorder. Select a card to manage only its connected attributes.</span></div><div><button class="btn btn-outline" type="button" data-ims-action="copy-attribute"><i class="fas fa-copy"></i> Copy Attribute</button><button class="btn btn-primary" type="button" data-ims-action="add-structure"><i class="fas fa-plus"></i> Add Interview Structure</button></div></div>
      <div class="ims-manager-card-grid">${this.app.structures.map((item, index) => this.cardHtml(item, index, true)).join('')}</div>
      <div class="ims-management-head"><div><strong>${this.escape(structure.name)}</strong><span>${this.escape(structure.course)} · ${this.escape(structure.mode)} · ${structure.active ? 'Active' : 'Inactive'} · ${mapped} interview mapping${mapped === 1 ? '' : 's'}</span></div><div><button type="button" class="btn btn-outline" data-ims-action="edit-structure" data-structure-id="${structure.id}"><i class="fas fa-pen"></i> Edit</button><button type="button" class="btn btn-primary" data-ims-action="add-group" data-structure-id="${structure.id}"><i class="fas fa-plus"></i> Create Attribute Group</button></div></div>
      <div class="ims-group-stack">${structure.groups.length ? structure.groups.map(group => this.groupHtml(structure, group)).join('') : `<div class="ims-empty"><i class="fas fa-layer-group"></i><strong>No attribute groups yet</strong><span>Create the first group to start defining this interview structure.</span><button type="button" class="btn btn-primary" data-ims-action="add-group" data-structure-id="${structure.id}">Create Attribute Group</button></div>`}</div>
    </div>`, 'xl');
  },

  groupHtml(structure, group) {
    return `<section class="ims-group-card ${group.active ? '' : 'inactive'}"><header><div><span>${group.sequence}</span><strong>${this.escape(group.name)}</strong><em>${group.active ? 'Active' : 'Inactive'}</em></div><div><button type="button" class="add" data-ims-action="add-attribute" data-structure-id="${structure.id}" data-group-id="${group.id}"><i class="fas fa-plus"></i> Add Attribute</button><button type="button" data-ims-action="edit-group" data-structure-id="${structure.id}" data-group-id="${group.id}" title="Edit group"><i class="fas fa-pen"></i></button><button type="button" class="danger" data-ims-action="delete-group" data-structure-id="${structure.id}" data-group-id="${group.id}" title="Delete group"><i class="fas fa-trash"></i></button></div></header><p><i class="fas fa-circle-check"></i>${this.escape(group.description || 'No description provided.')}</p><div class="ims-attribute-table-wrap"><table class="ims-attribute-table"><thead><tr><th>Action</th><th>Attribute Group</th><th>Attribute Name</th><th>Max Points</th><th>Default Points</th></tr></thead><tbody>${group.attributes.length ? group.attributes.map(attribute => this.attributeRow(structure, group, attribute)).join('') : `<tr><td colspan="5" class="ims-table-empty">No attributes in this group.</td></tr>`}</tbody></table></div></section>`;
  },

  attributeRow(structure, group, attribute) {
    return `<tr class="${attribute.active ? '' : 'inactive'}"><td><div class="ims-attribute-actions"><button type="button" data-ims-action="edit-attribute" data-structure-id="${structure.id}" data-group-id="${group.id}" data-attribute-id="${attribute.id}" title="Edit attribute"><i class="fas fa-pen"></i></button><button type="button" class="danger" data-ims-action="delete-attribute" data-structure-id="${structure.id}" data-group-id="${group.id}" data-attribute-id="${attribute.id}" title="Delete attribute"><i class="fas fa-trash"></i></button><button type="button" data-ims-action="attribute-settings" data-structure-id="${structure.id}" data-group-id="${group.id}" data-attribute-id="${attribute.id}" title="Attribute settings"><i class="fas fa-gear"></i></button></div></td><td>${this.escape(group.name)}</td><td><strong>${this.escape(attribute.name)}</strong><small>${this.escape(attribute.type)} · ${attribute.required ? 'Required' : 'Optional'} · ${attribute.active ? 'Active' : 'Inactive'}</small></td><td>${this.points(attribute.maxPoints)}</td><td>${this.points(attribute.defaultPoints)}</td></tr>`;
  },

  openGroupForm(structureId, groupId = '') {
    const structure = this.structure(structureId);
    const existing = this.group(structure, groupId);
    if (!structure) return;
    this.open(existing ? 'Edit Attribute Group' : 'Create Attribute Group', `<form class="ims-form" id="ims-group-form"><div class="ims-form-grid"><label><span>Group Name <b>*</b></span><input name="name" value="${this.escape(existing?.name || '')}" required /></label><label><span>Sequence</span><input type="number" value="${existing?.sequence || structure.groups.length + 1}" disabled /></label><label class="span-2"><span>Description</span><textarea name="description" rows="3">${this.escape(existing?.description || '')}</textarea></label><label class="ims-check"><input type="checkbox" name="active" ${existing?.active !== false ? 'checked' : ''} /><span>Active group</span></label></div><div class="ims-form-actions"><button type="button" class="btn btn-outline" data-ims-action="back-selected" data-structure-id="${structureId}">Cancel</button><button type="submit" class="btn btn-primary">${existing ? 'Save Group' : 'Create Group'}</button></div></form>`);
    document.getElementById('ims-group-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (existing) Object.assign(existing, { name: data.name, description: data.description, active: data.active === 'on' });
      else structure.groups.push({ id: `${structure.id}-G${Date.now()}`, name: data.name, description: data.description, active: data.active === 'on', sequence: structure.groups.length + 1, attributes: [] });
      this.persistAndOpen(structure.id);
    });
  },

  openAttributeForm(structureId, groupId, attributeId = '', settings = false) {
    const structure = this.structure(structureId);
    const sourceGroup = this.group(structure, groupId);
    const existing = this.attribute(sourceGroup, attributeId);
    if (!structure || !sourceGroup) return;
    const attribute = existing || { name: '', type: 'Text', maxPoints: 0, defaultPoints: 0, required: false, options: '', active: true };
    this.open(settings ? 'Attribute Settings' : existing ? 'Edit Attribute' : 'Add Attribute', `<form class="ims-form" id="ims-attribute-form"><div class="ims-form-grid">
      <label><span>Attribute Group <b>*</b></span><select name="groupId" required>${structure.groups.map(group => `<option value="${group.id}" ${group.id === sourceGroup.id ? 'selected' : ''}>${this.escape(group.name)}</option>`).join('')}</select></label>
      <label><span>Attribute Name <b>*</b></span><input name="name" value="${this.escape(attribute.name)}" required /></label>
      <label><span>Attribute Type <b>*</b></span><select name="type" required>${['Text', 'Long Text', 'Number', 'Rating', 'Select', 'Yes / No', 'Date'].map(type => `<option ${type === attribute.type ? 'selected' : ''}>${type}</option>`).join('')}</select></label>
      <label><span>Max Points</span><input type="number" min="0" step="0.01" name="maxPoints" value="${attribute.maxPoints}" /></label>
      <label><span>Default Points</span><input type="number" min="0" step="0.01" name="defaultPoints" value="${attribute.defaultPoints}" /></label>
      <label><span>Options or Data Source</span><input name="options" value="${this.escape(attribute.options)}" placeholder="Comma-separated options where applicable" /></label>
      <label class="ims-check"><input type="checkbox" name="required" ${attribute.required ? 'checked' : ''} /><span>Required attribute</span></label>
      <label class="ims-check"><input type="checkbox" name="active" ${attribute.active ? 'checked' : ''} /><span>Active attribute</span></label>
      </div><div class="ims-form-actions"><button type="button" class="btn btn-outline" data-ims-action="back-selected" data-structure-id="${structureId}">Cancel</button><button type="submit" class="btn btn-primary">${existing ? 'Save Attribute' : 'Add Attribute'}</button></div></form>`);
    document.getElementById('ims-attribute-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const targetGroup = this.group(structure, data.groupId);
      const values = { name: data.name, type: data.type, maxPoints: Number(data.maxPoints || 0), defaultPoints: Number(data.defaultPoints || 0), options: data.options, required: data.required === 'on', active: data.active === 'on', groupId: targetGroup.id };
      if (existing) {
        if (targetGroup.id !== sourceGroup.id) {
          sourceGroup.attributes = sourceGroup.attributes.filter(item => item.id !== existing.id);
          targetGroup.attributes.push({ ...existing, ...values, sequence: targetGroup.attributes.length + 1 });
        } else Object.assign(existing, values);
      } else targetGroup.attributes.push({ id: `${targetGroup.id}-A${Date.now()}`, ...values, sequence: targetGroup.attributes.length + 1 });
      this.persistAndOpen(structure.id);
    });
  },

  deleteAttribute(structureId, groupId, attributeId) {
    const structure = this.structure(structureId);
    const group = this.group(structure, groupId);
    const attribute = this.attribute(group, attributeId);
    if (!attribute) return;
    this.app.confirmAction('Delete attribute?', `Delete “${attribute.name}” from ${group.name}? Connected mappings and the structure count will be updated.`, () => {
      group.attributes = group.attributes.filter(item => item.id !== attributeId);
      this.persistAndOpen(structureId);
    });
  },

  deleteGroup(structureId, groupId) {
    const structure = this.structure(structureId);
    const group = this.group(structure, groupId);
    if (!group) return;
    const warning = group.attributes.length ? ` This will also remove ${group.attributes.length} connected attribute${group.attributes.length === 1 ? '' : 's'}.` : '';
    this.app.confirmAction('Delete attribute group?', `Delete “${group.name}”?${warning}`, () => {
      structure.groups = structure.groups.filter(item => item.id !== groupId);
      this.persistAndOpen(structureId);
    });
  },

  toggleStructure(structureId) {
    const structure = this.structure(structureId);
    if (!structure) return;
    const action = structure.active ? 'Deactivate' : 'Activate';
    this.app.confirmAction(`${action} interview structure?`, `${action} “${structure.name}”? Existing interview and attribute mappings will be preserved.`, () => {
      structure.active = !structure.active;
      this.save();
      this.app.render();
      if (document.getElementById('ams-interview-modal')?.getAttribute('aria-hidden') === 'false') this.openManagement(this.currentStructureId || structureId);
    });
  },

  deleteStructure(structureId) {
    const structure = this.structure(structureId);
    if (!structure) return;
    const mapped = this.app.interviews.filter(item => item.structureId === structureId).length;
    const warning = mapped
      ? ` It is mapped to ${mapped} interview${mapped === 1 ? '' : 's'}; those historical mappings will be preserved but the structure will no longer be selectable.`
      : ' It has no interview mappings.';
    this.app.confirmAction('Delete interview structure?', `Delete “${structure.name}”?${warning}`, () => {
      this.archiveStructure(structure);
      this.app.structures = this.app.structures.filter(item => item.id !== structureId);
      if (this.app.state?.filters?.structure === structureId) this.app.state.filters.structure = 'all';
      this.app.saveInterviews();
      this.save();
      this.app.render();
      const next = this.structure(this.currentStructureId) || this.app.structures[0];
      if (next) this.openManagement(next.id);
      else this.app.closeModal();
    });
  },

  handleDragStart(event) {
    const card = event.target.closest?.('[data-ims-action="open-structure"]');
    if (!card || this.dragBlocked || event.target.closest?.('.ims-card-actions')) {
      event.preventDefault();
      this.dragBlocked = false;
      return;
    }
    this.draggingId = card.dataset.structureId;
    card.classList.add('dragging');
    document.body.classList.add('ims-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', this.draggingId);
  },

  handleDragOver(event) {
    const target = event.target.closest?.('[data-ims-action="open-structure"]');
    if (!target || !this.draggingId || target.dataset.structureId === this.draggingId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.ims-structure-card.drag-over').forEach(card => card.classList.remove('drag-over'));
    target.classList.add('drag-over');
  },

  handleDragLeave(event) {
    const card = event.target.closest?.('.ims-structure-card');
    if (card && !card.contains(event.relatedTarget)) card.classList.remove('drag-over');
  },

  handleDrop(event) {
    const target = event.target.closest?.('[data-ims-action="open-structure"]');
    if (!target || !this.draggingId) return;
    event.preventDefault();
    const selectedId = this.currentStructureId || this.draggingId;
    const changed = this.reorderStructures(this.draggingId, target.dataset.structureId);
    this.suppressClickUntil = Date.now() + 350;
    this.finishDrag();
    if (!changed) return;
    this.save();
    this.app.render();
    if (document.getElementById('ams-interview-modal')?.getAttribute('aria-hidden') === 'false') this.openManagement(selectedId);
  },

  reorderStructures(sourceId, targetId) {
    const sourceIndex = this.app.structures.findIndex(structure => structure.id === sourceId);
    const targetIndex = this.app.structures.findIndex(structure => structure.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false;
    const [moved] = this.app.structures.splice(sourceIndex, 1);
    this.app.structures.splice(targetIndex, 0, moved);
    return true;
  },

  finishDrag() {
    this.draggingId = '';
    this.dragBlocked = false;
    document.body.classList.remove('ims-dragging');
    document.querySelectorAll('.ims-structure-card.dragging, .ims-structure-card.drag-over').forEach(card => card.classList.remove('dragging', 'drag-over'));
  },

  openCopyAttribute() {
    const sourceOptions = this.app.structures.flatMap(structure => structure.groups.flatMap(group => group.attributes.map(attribute => ({ value: `${structure.id}|${group.id}|${attribute.id}`, label: `${structure.name} · ${group.name} · ${attribute.name}` }))));
    const targetOptions = this.app.structures.flatMap(structure => structure.groups.map(group => ({ value: `${structure.id}|${group.id}`, label: `${structure.name} · ${group.name}` })));
    const nested = document.getElementById('im-modal-title')?.textContent === 'Manage Interview Structures';
    if (!sourceOptions.length || !targetOptions.length) return this.open('Copy Attribute', '<div class="ims-empty"><strong>No attributes available to copy</strong><span>Create a group and attribute first.</span><button type="button" class="btn btn-outline" data-im-close>Close</button></div>', 'sm', { nested });
    this.open('Copy Attribute', `<form class="ims-form" id="ims-copy-form"><div class="ims-form-grid"><label class="span-2"><span>Source Attribute <b>*</b></span><select name="source" required>${sourceOptions.map(item => `<option value="${item.value}">${this.escape(item.label)}</option>`).join('')}</select></label><label class="span-2"><span>Target Attribute Group <b>*</b></span><select name="target" required>${targetOptions.map(item => `<option value="${item.value}">${this.escape(item.label)}</option>`).join('')}</select></label></div><div class="ims-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-copy"></i> Copy Attribute</button></div></form>`, 'lg', { nested });
    document.getElementById('ims-copy-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const targetStructureId = this.copyAttribute(data.source, data.target);
      if (targetStructureId) this.persistAndOpen(targetStructureId);
    });
  },

  copyAttribute(sourceValue, targetValue) {
    const [sourceStructureId, sourceGroupId, sourceAttributeId] = sourceValue.split('|');
    const [targetStructureId, targetGroupId] = targetValue.split('|');
    const source = this.attribute(this.group(this.structure(sourceStructureId), sourceGroupId), sourceAttributeId);
    const targetGroup = this.group(this.structure(targetStructureId), targetGroupId);
    if (!source || !targetGroup) return '';
    targetGroup.attributes.push({ ...source, id: `${targetGroup.id}-A${Date.now()}`, groupId: targetGroup.id, name: `${source.name} Copy`, sequence: targetGroup.attributes.length + 1 });
    return targetStructureId;
  },

  persistAndOpen(structureId) {
    this.save();
    this.app.render();
    this.openManagement(structureId);
  },

  points(value) { return Number(value || 0).toFixed(2); },
  escape(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
};

window.AMSInterviewStructures = AMSInterviewStructures;
