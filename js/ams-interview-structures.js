// ============================================================
// AMS INTERVIEW STRUCTURES - Structure cards and connected attributes
// ============================================================

const AMSInterviewStructures = {
  app: null,
  bound: false,
  currentView: 'section',
  currentStructureId: '',
  draggingId: '',
  dragBlocked: false,
  suppressClickUntil: 0,
  modelVersionKey: 'paAMSInterviewStructureModelV2',
  requiredStructureNames: ['Overall Result', 'Non-Academic Evaluation', 'Academic Evaluation', 'Written Test'],

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
    const needsMigration = localStorage.getItem(this.modelVersionKey) !== '2';
    if (needsMigration) {
      this.migrateRequiredStructures();
      localStorage.setItem(this.modelVersionKey, '2');
      this.save();
      return;
    }
    let changed = false;
    this.app.structures = this.app.structures.map((structure, index) => {
      const groups = Array.isArray(structure.groups) ? structure.groups : this.defaultGroups(structure.id, index);
      if (!Array.isArray(structure.groups)) changed = true;
      const messageId = structure.messageId || this.defaultMessageId(structure.message);
      if (!structure.messageId) changed = true;
      return this.withCounts({ ...structure, messageId, groups });
    });
    if (changed) this.save();
  },

  migrateRequiredStructures() {
    const previous = Array.isArray(this.app.structures) ? this.app.structures : [];
    const allGroups = previous.flatMap(structure => Array.isArray(structure.groups) ? structure.groups : this.defaultGroups(structure.id, 0));
    this.app.structures = this.requiredStructureNames.map((name, index) => {
      const source = previous[index] || previous[0] || {};
      const sourceGroup = allGroups.find(group => group.name === name) || this.defaultGroups(`STR-${String(index + 1).padStart(3, '0')}`, index)[index];
      const id = `STR-${String(index + 1).padStart(3, '0')}`;
      const groupId = `${id}-G1`;
      const group = {
        ...sourceGroup,
        id: groupId,
        name,
        sequence: 1,
        attributes: (sourceGroup?.attributes || []).map((attribute, attributeIndex) => ({
          ...attribute,
          id: `${groupId}-A${attributeIndex + 1}`,
          groupId,
          sequence: attributeIndex + 1
        }))
      };
      return this.withCounts({
        ...source,
        id,
        name,
        description: sourceGroup?.description || source.description || '',
        messageId: source.messageId || this.defaultMessageId(source.message),
        course: source.course || this.app.courses[0],
        mode: source.mode || 'In-Person',
        active: source.active !== false,
        groups: [group]
      });
    });
    const validIds = new Set(this.app.structures.map(structure => structure.id));
    this.app.interviews.forEach(interview => {
      if (interview.structureId && !validIds.has(interview.structureId)) interview.structureId = this.app.structures[3].id;
    });
    this.app.saveInterviews();
  },

  defaultMessageId(message = '') {
    if (/sms only/i.test(message)) return 'sms-schedule';
    if (/whatsapp/i.test(message)) return 'whatsapp-reminder';
    return 'email-schedule';
  },

  defaultGroups(structureId, variant = 0) {
    const group = (suffix, name, description, sequence, attributes) => ({
      id: `${structureId}-${suffix}`,
      name,
      description,
      sequence,
      active: true,
      attributes: attributes.map((attribute, index) => ({
        id: `${structureId}-${suffix}-A${index + 1}`,
        groupId: `${structureId}-${suffix}`,
        type: attribute.type || 'Text',
        maxPoints: attribute.maxPoints ?? 0,
        defaultPoints: attribute.defaultPoints ?? 0,
        required: Boolean(attribute.required),
        options: attribute.options || '',
        active: true,
        sequence: index + 1,
        name: attribute.name
      }))
    });
    const academic = [
      ['Reasoning / Logical Skills', 10], ['Subject Knowledge', 10], ['Listening Skills', 10],
      ['Reading Skills', 10], ['Writing Skills', 10], ['General Awareness / Aptitude', 10], ['Academic Calibre', 10]
    ].map(([name, maxPoints]) => ({ name, type: 'Rating', maxPoints, required: true }));
    const groups = [
      group('G1', 'Overall Result', 'Final admission recommendation and programme mapping.', 1, [
        { name: 'Admission Approval', type: 'Select', options: 'Approved,Hold,Rejected', required: true },
        { name: 'Enroll For', type: 'Select', options: 'Current Course,Alternate Course', required: true },
        { name: 'Learning Mode', type: 'Select', options: 'Online,In-Person', required: true }
      ]),
      group('G2', 'Non-Academic Evaluation', 'Personal background, values, communication, and community engagement.', 2, [
        { name: 'Family Background', type: 'Long Text' },
        { name: 'Satsang Background', type: 'Long Text' },
        { name: 'Grade', type: 'Select', options: 'A,B,C,D', required: true }
      ]),
      group('G3', 'Academic Evaluation', 'Academic readiness and subject-level evaluation.', 3, academic),
      group('G4', 'Written Test', 'Written assessment marks and evaluator notes.', 4, [
        { name: 'Paper Marks', type: 'Number', maxPoints: variant % 2 ? 50 : 100, required: true },
        { name: 'Evaluator Remark', type: 'Long Text' }
      ])
    ];
    return groups;
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
        this.app.interviews.filter(item => item.structureId === existing.id).forEach(item => { item.course = existing.course; });
        this.app.saveInterviews();
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
      <div class="ims-management-head"><div><strong>${this.escape(structure.name)}</strong><span>${this.escape(structure.course)} · ${this.escape(structure.mode)} · ${structure.active ? 'Active' : 'Inactive'} · ${mapped} scheduled mappings</span></div><div><button type="button" class="btn btn-outline" data-ims-action="edit-structure" data-structure-id="${structure.id}"><i class="fas fa-pen"></i> Edit</button><button type="button" class="btn btn-primary" data-ims-action="add-group" data-structure-id="${structure.id}"><i class="fas fa-plus"></i> Create Attribute Group</button></div></div>
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
    this.app.confirmAction('Delete attribute?', `Delete “${attribute.name}” from ${group.name}? Connected dummy mappings and the structure count will be updated.`, () => {
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
    const warning = mapped ? ` It is mapped to ${mapped} scheduled interview${mapped === 1 ? '' : 's'}; those schedules will be marked as not mapped.` : ' It has no scheduled interview mappings.';
    this.app.confirmAction('Delete interview structure?', `Delete “${structure.name}”?${warning}`, () => {
      this.app.structures = this.app.structures.filter(item => item.id !== structureId);
      this.app.interviews.forEach(item => { if (item.structureId === structureId) item.structureId = ''; });
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
