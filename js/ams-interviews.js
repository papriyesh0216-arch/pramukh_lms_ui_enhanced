// ============================================================
// AMS INTERVIEWS - Single-page Interview Scheduling & Management
// ============================================================

const AMSInterviews = {
  interviewStorageKey: 'paAMSInterviews',
  structureStorageKey: 'paAMSInterviewStructures',
  interviews: [],
  structures: [],
  selectedRows: new Set(),
  modalStack: [],
  modalTrigger: null,
  state: {
    view: 'list',
    calendarView: 'month',
    activeKpi: 'all',
    selectedDate: '',
    calendarDate: '',
    sortKey: 'datetime',
    sortDirection: 'asc',
    page: 1,
    pageSize: 8,
    structuresOpen: true,
    filters: {
      search: '',
      from: '',
      to: '',
      course: 'all',
      interviewer: 'all',
      structure: 'all',
      status: 'all',
      mode: 'all'
    }
  },

  courses: ['UPSC', 'GPSC Class 1-2', 'GPSC Class 3', 'Sankalp', 'Sampurn'],
  interviewers: [
    { id: 'INT-01', name: 'Dr. Neha Joshi', department: 'Academic Panel', availability: 'Mon, Wed, Fri' },
    { id: 'INT-02', name: 'Prof. Amit Verma', department: 'Technical Panel', availability: 'Tue, Thu, Sat' },
    { id: 'INT-03', name: 'Ms. Pooja Sharma', department: 'Admissions', availability: 'Weekdays' },
    { id: 'INT-04', name: 'Dr. Rahul Desai', department: 'Personal Interview Panel', availability: 'Mon-Sat' },
    { id: 'INT-05', name: 'Mr. Kunal Shah', department: 'Final Selection Panel', availability: 'Wed-Sun' }
  ],

  init() {
    const root = document.getElementById('ams-interview-root');
    if (!root) return;
    this.state.selectedDate = this.dateKey(new Date());
    this.state.calendarDate = this.state.selectedDate;
    this.loadData();
    window.AMSInterviewStructures?.init?.(this);
    this.bindEvents();
    this.render();
  },

  defaultStructures() {
    return [
      { id: 'STR-001', name: 'Standard Interview', description: 'General eligibility, motivation, communication, and programme fit.', message: 'Email + SMS', course: 'UPSC', mode: 'In-Person', rounds: 3, attributes: 5, active: true },
      { id: 'STR-002', name: 'Academic Interview', description: 'Academic readiness and subject-foundation assessment.', message: 'Email Only', course: 'GPSC Class 1-2', mode: 'Online', rounds: 2, attributes: 6, active: true },
      { id: 'STR-003', name: 'Technical Interview', description: 'Analytical skills, aptitude, and role-based technical discussion.', message: 'WhatsApp + Email', course: 'GPSC Class 3', mode: 'Online', rounds: 4, attributes: 6, active: true },
      { id: 'STR-004', name: 'Personal Interview', description: 'Personal background, goals, values, and programme commitment.', message: 'Email + SMS', course: 'Sankalp', mode: 'In-Person', rounds: 3, attributes: 5, active: true },
      { id: 'STR-005', name: 'Final Interview', description: 'Final admission panel review and selection recommendation.', message: 'SMS Only', course: 'Sampurn', mode: 'In-Person', rounds: 2, attributes: 4, active: true }
    ];
  },

  defaultInterviews() {
    const rows = [
      ['IV-001', 'STU-260123', 'INQ-2600123', 'Aarohi Shah', 'aarohi.shah@example.com', '9876500101', 'UPSC', 'STR-001', 0, '10:00', 'INT-01', 'In-Person', 'Scheduled', ''],
      ['IV-002', 'STU-260124', 'INQ-2600124', 'Rohan Mehta', 'rohan.mehta@example.com', '9876500102', 'GPSC Class 3', 'STR-003', 0, '11:00', '', 'Online', 'Awaiting Assignment', ''],
      ['IV-003', 'STU-260125', 'INQ-2600125', 'Krisha Patel', 'krisha.patel@example.com', '9876500103', 'Sankalp', 'STR-004', 0, '12:00', 'INT-03', 'In-Person', 'Scheduled', ''],
      ['IV-004', 'STU-260126', 'INQ-2600126', 'Devansh Singh', 'devansh.singh@example.com', '9876500104', 'Sampurn', 'STR-005', 0, '13:00', 'INT-04', 'Online', 'Rescheduled', ''],
      ['IV-005', 'STU-260127', 'INQ-2600127', 'Diya Raval', 'diya.raval@example.com', '9876500105', 'UPSC', 'STR-001', 0, '14:00', 'INT-05', 'In-Person', 'Completed', '82'],
      ['IV-006', 'STU-260128', 'INQ-2600128', 'Harsh Vyas', 'harsh.vyas@example.com', '9876500106', 'GPSC Class 1-2', 'STR-002', 1, '09:30', 'INT-02', 'Online', 'Scheduled', ''],
      ['IV-007', 'STU-260129', 'INQ-2600129', 'Ishita Joshi', 'ishita.joshi@example.com', '9876500107', 'UPSC', 'STR-001', 1, '11:30', 'INT-01', 'In-Person', 'Cancelled', ''],
      ['IV-008', 'STU-260130', 'INQ-2600130', 'Jay Patel', 'jay.patel@example.com', '9876500108', 'GPSC Class 3', 'STR-003', 2, '10:00', 'INT-02', 'Online', 'Awaiting Assignment', ''],
      ['IV-009', 'STU-260131', 'INQ-2600131', 'Mahi Desai', 'mahi.desai@example.com', '9876500109', 'Sankalp', 'STR-004', 3, '15:00', 'INT-03', 'In-Person', 'Scheduled', ''],
      ['IV-010', 'STU-260132', 'INQ-2600132', 'Nirav Shah', 'nirav.shah@example.com', '9876500110', 'Sampurn', 'STR-005', 4, '12:30', 'INT-04', 'Online', 'Scheduled', ''],
      ['IV-011', 'STU-260133', 'INQ-2600133', 'Priya Trivedi', 'priya.trivedi@example.com', '9876500111', 'UPSC', 'STR-001', 6, '16:00', '', 'In-Person', 'Awaiting Assignment', ''],
      ['IV-012', 'STU-260134', 'INQ-2600134', 'Rahul Parmar', 'rahul.parmar@example.com', '9876500112', 'GPSC Class 1-2', 'STR-002', 8, '10:30', 'INT-01', 'Online', 'Scheduled', ''],
      ['IV-013', 'STU-260135', 'INQ-2600135', 'Sneha Dave', 'sneha.dave@example.com', '9876500113', 'GPSC Class 3', 'STR-003', -2, '14:30', 'INT-02', 'Online', 'Completed', '88'],
      ['IV-014', 'STU-260136', 'INQ-2600136', 'Tirth Bhatt', 'tirth.bhatt@example.com', '9876500114', 'Sankalp', 'STR-004', -5, '11:00', 'INT-05', 'In-Person', 'Completed', '76'],
      ['IV-015', 'STU-260137', 'INQ-2600137', 'Urvi Mehta', 'urvi.mehta@example.com', '9876500115', 'Sampurn', 'STR-005', 12, '13:30', 'INT-04', 'In-Person', 'Rescheduled', ''],
      ['IV-016', 'STU-260138', 'INQ-2600138', 'Yash Soni', 'yash.soni@example.com', '9876500116', 'UPSC', 'STR-001', 16, '09:00', 'INT-03', 'Online', 'Scheduled', '']
    ];
    return rows.map(row => ({
      id: row[0], studentId: row[1], inquiryId: row[2], name: row[3], email: row[4], phone: row[5],
      course: row[6], structureId: row[7], datetime: this.offsetDateTime(row[8], row[9]),
      interviewerId: row[10], mode: row[11], status: row[12], score: row[13]
    }));
  },

  loadData() {
    this.structures = this.readStorage(this.structureStorageKey, this.defaultStructures());
    this.interviews = this.readStorage(this.interviewStorageKey, this.defaultInterviews()).map((item, index) => this.enrichInterview(item, index));
    this.saveStructures();
    this.saveInterviews();
  },

  enrichInterview(item, index) {
    const date = item.datetime?.slice(0, 10) || this.dateKey(new Date());
    const mappedOtr = item.otr || {
      otrNo: item.otrNo || `AMS-OTR-2026-${String(index + 101).padStart(4, '0')}`,
      updatedAt: item.submittedDate || `${date}T08:30:00`,
      personal: {
        fullName: item.name,
        dateOfBirth: item.dateOfBirth || `${1999 + (index % 5)}-${String((index % 9) + 1).padStart(2, '0')}-${String((index % 18) + 10).padStart(2, '0')}`,
        gender: item.gender || (index % 2 ? 'Male' : 'Female'),
        phone: item.phone,
        email: item.email
      },
      documents: item.photo ? { passportPhoto: { dataUrl: item.photo, type: 'image/jpeg' } } : {}
    };
    return {
      ...item,
      interviewNumber: item.interviewNumber || item.id,
      applicationDate: item.applicationDate || this.dateKey(this.addDays(this.parseDateKey(date), -Math.max(2, (index % 8) + 2))),
      submittedDate: item.submittedDate || mappedOtr.updatedAt,
      batch: item.batch || `${item.course} 2026 Batch`,
      learningMode: item.learningMode || item.mode,
      evaluation: item.evaluation || {},
      otr: mappedOtr
    };
  },

  readStorage(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  },

  saveInterviews() {
    try { localStorage.setItem(this.interviewStorageKey, JSON.stringify(this.interviews)); } catch (error) {}
    window.dispatchEvent(new CustomEvent('ams:data-change', { detail: { source: 'interviews' } }));
  },

  saveStructures() {
    try { localStorage.setItem(this.structureStorageKey, JSON.stringify(this.structures)); } catch (error) {}
    window.dispatchEvent(new CustomEvent('ams:data-change', { detail: { source: 'structures' } }));
  },

  render() {
    const root = document.getElementById('ams-interview-root');
    if (!root) return;
    root.innerHTML = `
      ${this.renderHeader()}
      <div class="im-layout">
        <div class="im-main-column">
          ${this.renderKpis()}
          ${this.renderWorkspace()}
          ${this.renderStructures()}
        </div>
        ${this.renderScheduleOverview()}
      </div>
    `;
  },

  renderHeader() {
    return `
      <header class="im-page-header">
        <h1>Interview Management</h1>
        <div class="im-page-actions">
          <button class="btn btn-primary" type="button" data-im-action="schedule"><i class="fas fa-plus"></i> Schedule Interview</button>
          <button class="btn btn-outline" type="button" data-im-action="create-structure"><i class="fas fa-plus"></i> Add Interview Structure</button>
          <button class="btn btn-outline" type="button" data-im-action="export"><i class="fas fa-arrow-up-from-bracket"></i> Export</button>
        </div>
      </header>
    `;
  },

  renderKpis() {
    const today = this.dateKey(new Date());
    const end = this.dateKey(this.addDays(new Date(), 7));
    const month = today.slice(0, 7);
    const cards = [
      { key: 'today', label: "Today's Interviews", icon: 'fa-calendar-day', tone: 'blue', value: this.interviews.filter(item => item.datetime.slice(0, 10) === today).length, meta: 'Scheduled for today' },
      { key: 'upcoming', label: 'Upcoming Interviews', icon: 'fa-clock', tone: 'amber', value: this.interviews.filter(item => item.datetime.slice(0, 10) > today && item.datetime.slice(0, 10) <= end && !['Completed', 'Cancelled'].includes(item.status)).length, meta: 'Next 7 days' },
      { key: 'awaiting', label: 'Awaiting Assignment', icon: 'fa-user-clock', tone: 'purple', value: this.interviews.filter(item => item.status === 'Awaiting Assignment').length, meta: 'Need interviewer' },
      { key: 'completed', label: 'Completed This Month', icon: 'fa-circle-check', tone: 'green', value: this.interviews.filter(item => item.status === 'Completed' && item.datetime.startsWith(month)).length, meta: 'Interview outcomes' }
    ];
    return `<section class="im-kpi-grid">${cards.map(card => `
      <button class="im-kpi-card ${card.tone} ${this.state.activeKpi === card.key ? 'active' : ''}" type="button" data-im-kpi="${card.key}">
        <span class="im-kpi-icon"><i class="fas ${card.icon}"></i></span>
        <span class="im-kpi-copy"><small>${card.label}</small><strong>${card.value}</strong><em>${card.meta}</em></span>
      </button>
    `).join('')}</section>`;
  },

  renderWorkspace() {
    const visible = this.filteredInterviews();
    return `
      <section class="im-card im-workspace">
        <div class="im-workspace-head">
          <div><h2>All Interviews</h2><span>${visible.length} mapped interview${visible.length === 1 ? '' : 's'}</span></div>
          <div class="im-workspace-head-actions">
            <label class="im-search"><i class="fas fa-search"></i><input id="im-search" data-im-filter="search" value="${this.escape(this.state.filters.search)}" placeholder="Search candidate, ID, course, interviewer..." /></label>
            <button class="im-icon-toggle" type="button" data-im-action="toggle-view" title="${this.state.view === 'list' ? 'Open calendar view' : 'Open list view'}" aria-label="${this.state.view === 'list' ? 'Open calendar view' : 'Open list view'}"><i class="fas ${this.state.view === 'list' ? 'fa-calendar-days' : 'fa-list'}"></i></button>
          </div>
        </div>
        ${this.renderFilters()}
        ${this.state.view === 'list' ? this.renderList(visible) : this.renderCalendar(visible)}
      </section>
    `;
  },

  renderFilters() {
    const f = this.state.filters;
    return `
      <div class="im-filters">
        <label><span>From</span><input type="date" data-im-filter="from" value="${f.from}" /></label>
        <label><span>To</span><input type="date" data-im-filter="to" value="${f.to}" /></label>
        ${this.filterSelect('course', 'Course', this.courses, f.course)}
        ${this.filterSelect('interviewer', 'Interviewer', this.interviewers.map(item => ({ value: item.id, label: item.name })), f.interviewer)}
        ${this.filterSelect('structure', 'Structure', this.structures.map(item => ({ value: item.id, label: item.name })), f.structure)}
        ${this.filterSelect('status', 'Status', ['Scheduled', 'Awaiting Assignment', 'In Progress', 'Completed', 'Rescheduled', 'Cancelled'], f.status)}
        <details class="im-more-filters">
          <summary><i class="fas fa-filter"></i><span>More Filters</span></summary>
          <div>${this.filterSelect('mode', 'Interview Mode', ['Online', 'In-Person'], f.mode)}</div>
        </details>
        <button class="im-reset" type="button" data-im-action="reset"><i class="fas fa-rotate-left"></i> Reset</button>
      </div>
    `;
  },

  filterSelect(key, label, options, value) {
    return `<label><span>${label}</span><select data-im-filter="${key}"><option value="all">All</option>${options.map(option => {
      const item = typeof option === 'string' ? { value: option, label: option } : option;
      return `<option value="${this.escape(item.value)}" ${value === item.value ? 'selected' : ''}>${this.escape(item.label)}</option>`;
    }).join('')}</select></label>`;
  },

  renderList(rows) {
    const totalPages = Math.max(1, Math.ceil(rows.length / this.state.pageSize));
    this.state.page = Math.min(this.state.page, totalPages);
    const start = (this.state.page - 1) * this.state.pageSize;
    const pageRows = rows.slice(start, start + this.state.pageSize);
    const allChecked = pageRows.length && pageRows.every(item => this.selectedRows.has(item.id));
    return `
      <div class="im-bulk-bar">
        <label class="im-check-label"><input type="checkbox" data-im-select-all ${allChecked ? 'checked' : ''} /><span>${this.selectedRows.size} selected</span></label>
        <button type="button" data-im-bulk="assign" ${this.selectedRows.size ? '' : 'disabled'}>Assign Interviewer</button>
        <button type="button" data-im-bulk="reschedule" ${this.selectedRows.size ? '' : 'disabled'}>Reschedule</button>
        <button type="button" data-im-bulk="complete" ${this.selectedRows.size ? '' : 'disabled'}>Mark Completed</button>
        <button type="button" data-im-bulk="cancel" ${this.selectedRows.size ? '' : 'disabled'}>Cancel</button>
        <button type="button" data-im-bulk="more" ${this.selectedRows.size ? '' : 'disabled'}>More Actions <i class="fas fa-chevron-down"></i></button>
      </div>
      <div class="im-table-wrap">
        <table class="im-table">
          <thead><tr>
            <th aria-label="Selection"></th>
            ${this.sortHeader('name', 'Student Details')}
            <th>Inquiry / Student ID</th>
            ${this.sortHeader('course', 'Course')}
            <th>Interview Structure</th>
            ${this.sortHeader('datetime', 'Date & Time')}
            <th>Interviewer</th><th>Mode</th>
            ${this.sortHeader('status', 'Status')}
            <th>Score</th><th>Actions</th>
          </tr></thead>
          <tbody>${pageRows.length ? pageRows.map(item => this.renderInterviewRow(item)).join('') : `<tr><td colspan="11" class="im-empty">No interviews match the current filters.</td></tr>`}</tbody>
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
  },

  sortHeader(key, label) {
    const icon = this.state.sortKey === key ? (this.state.sortDirection === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down') : 'fa-sort';
    return `<th><button type="button" data-im-sort="${key}">${label}<i class="fas ${icon}"></i></button></th>`;
  },

  renderInterviewRow(item) {
    const structure = this.structureById(item.structureId);
    const interviewer = this.interviewerById(item.interviewerId);
    return `<tr>
      <td><input type="checkbox" data-im-select="${item.id}" ${this.selectedRows.has(item.id) ? 'checked' : ''} /></td>
      <td><div class="im-candidate"><span class="im-avatar">${this.initials(item.name)}</span><div><strong>${this.escape(item.name)}</strong><small>${this.escape(item.email)}</small></div></div></td>
      <td><strong>${this.escape(item.inquiryId)}</strong><small>${this.escape(item.studentId)}</small></td>
      <td>${this.escape(item.course)}</td>
      <td><strong>${this.escape(structure?.name || 'Not mapped')}</strong><small>${structure ? `${structure.rounds} rounds · ${structure.attributes} attributes` : 'Assign structure'}</small></td>
      <td><strong>${this.formatDate(item.datetime)}</strong><small>${this.formatTime(item.datetime)}</small></td>
      <td>${this.escape(interviewer?.name || 'Not Assigned')}<small>${this.escape(interviewer?.department || 'Awaiting assignment')}</small></td>
      <td><span class="im-mode ${item.mode === 'Online' ? 'online' : 'person'}"><i class="fas ${item.mode === 'Online' ? 'fa-display' : 'fa-building'}"></i>${this.escape(item.mode)}</span></td>
      <td><span class="im-status ${this.statusClass(item.status)}">${this.escape(item.status)}</span></td>
      <td>${item.score ? `${this.escape(item.score)}/100` : '—'}</td>
      <td>${this.renderRowMenu(item)}</td>
    </tr>`;
  },

  renderRowMenu(item) {
    const id = item.id;
    return `<details class="im-row-menu"><summary aria-label="Interview actions"><i class="fas fa-ellipsis-vertical"></i></summary><div>
      <button type="button" data-im-row-action="view" data-id="${id}"><i class="fas fa-eye"></i>View</button>
      <button type="button" data-im-row-action="edit" data-id="${id}"><i class="fas fa-pen"></i>Edit</button>
      ${item.status !== 'Completed' ? `<button type="button" data-im-row-action="assign" data-id="${id}"><i class="fas fa-user-plus"></i>Assign Interviewer</button>` : ''}
      ${!['Completed', 'Cancelled'].includes(item.status) ? `<button type="button" data-im-row-action="reschedule" data-id="${id}"><i class="fas fa-calendar-plus"></i>Reschedule</button>` : ''}
      ${['Scheduled', 'Rescheduled', 'Awaiting Assignment'].includes(item.status) ? `<button type="button" data-im-row-action="start" data-id="${id}"><i class="fas fa-play"></i>Start Interview</button>` : ''}
      ${!['Completed', 'Cancelled'].includes(item.status) ? `<button type="button" data-im-row-action="complete" data-id="${id}"><i class="fas fa-circle-check"></i>Mark Completed</button>` : ''}
      ${!['Completed', 'Cancelled'].includes(item.status) ? `<button type="button" data-im-row-action="cancel" data-id="${id}"><i class="fas fa-ban"></i>Cancel</button>` : ''}
      ${!['Completed', 'In Progress'].includes(item.status) ? `<button type="button" class="danger" data-im-row-action="delete" data-id="${id}"><i class="fas fa-trash"></i>Delete</button>` : ''}
    </div></details>`;
  },

  renderCalendar(rows) {
    return `
      <div class="im-calendar-toolbar">
        <div><button type="button" data-im-calendar-nav="prev"><i class="fas fa-chevron-left"></i></button><button type="button" data-im-calendar-nav="today">Today</button><button type="button" data-im-calendar-nav="next"><i class="fas fa-chevron-right"></i></button></div>
        <strong>${this.calendarTitle()}</strong>
        <div>${['month', 'week', 'day'].map(view => `<button type="button" class="${this.state.calendarView === view ? 'active' : ''}" data-im-calendar-view="${view}" title="${this.titleCase(view)} view"><i class="fas ${view === 'month' ? 'fa-calendar-days' : view === 'week' ? 'fa-calendar-week' : 'fa-list'}"></i></button>`).join('')}</div>
      </div>
      <div class="im-calendar-stage">${this.state.calendarView === 'month' ? this.renderMonthCalendar(rows, false) : this.state.calendarView === 'week' ? this.renderWeekCalendar(rows) : this.renderDayCalendar(rows)}</div>
    `;
  },

  renderMonthCalendar(rows, compact = false) {
    const base = this.parseDateKey(this.state.calendarDate);
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const cells = Array.from({ length: 42 }, (_, index) => this.addDays(start, index));
    return `<div class="${compact ? 'im-mini-calendar' : 'im-month-calendar'}">
      <div class="im-weekdays">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<span>${compact ? day[0] : day}</span>`).join('')}</div>
      <div class="im-month-grid">${cells.map(date => {
        const key = this.dateKey(date);
        const events = rows.filter(item => item.datetime.slice(0, 10) === key);
        const interviewerGroups = this.groupMonthInterviews(events, key);
        const outside = date.getMonth() !== base.getMonth();
        return `<button type="button" class="im-calendar-day ${outside ? 'outside' : ''} ${key === this.state.selectedDate ? 'selected' : ''} ${key === this.dateKey(new Date()) ? 'today' : ''}" data-im-date="${key}"><b>${date.getDate()}</b>${compact ? `<span class="im-date-dots">${events.slice(0, 4).map(item => `<i class="${this.statusClass(item.status)}"></i>`).join('')}</span>` : `<span class="im-day-events">${interviewerGroups.slice(0, 3).map(group => `<em class="${this.statusClass(group.status)}" data-im-assigned-group="${this.escape(group.key)}"><strong>${this.escape(group.interviewerName)}</strong><small>${this.escape(group.numberLabel)}</small></em>`).join('')}${interviewerGroups.length > 3 ? `<small>+${interviewerGroups.length - 3} more</small>` : ''}</span>`}</button>`;
      }).join('')}</div>
    </div>`;
  },

  groupMonthInterviews(events, date) {
    const groups = new Map();
    events.forEach(item => {
      const interviewerId = item.interviewerId || 'unassigned';
      const key = `${date}|${interviewerId}`;
      if (!groups.has(key)) groups.set(key, { key, date, interviewerId, interviewerName: this.interviewerById(item.interviewerId)?.name || 'Not Assigned', items: [] });
      groups.get(key).items.push(item);
    });
    return [...groups.values()].map(group => {
      group.items.sort((a, b) => a.datetime.localeCompare(b.datetime));
      group.status = group.items[0].status;
      group.numberLabel = group.items.length === 1 ? group.items[0].interviewNumber : `${group.items[0].interviewNumber} +${group.items.length - 1}`;
      return group;
    });
  },

  renderWeekCalendar(rows) {
    const selected = this.parseDateKey(this.state.selectedDate);
    const start = this.startOfWeek(selected);
    const days = Array.from({ length: 7 }, (_, index) => this.addDays(start, index));
    return `<div class="im-week-calendar">${days.map(day => {
      const key = this.dateKey(day);
      const events = rows.filter(item => item.datetime.slice(0, 10) === key).sort((a, b) => a.datetime.localeCompare(b.datetime));
      return `<section class="${key === this.state.selectedDate ? 'selected' : ''}"><header><span>${day.toLocaleDateString('en-IN', { weekday: 'short' })}</span><strong>${day.getDate()}</strong></header><div>${events.length ? events.map(item => this.renderCalendarEvent(item)).join('') : '<small class="im-no-events">No interviews</small>'}</div></section>`;
    }).join('')}</div>`;
  },

  renderDayCalendar(rows) {
    const events = rows.filter(item => item.datetime.slice(0, 10) === this.state.selectedDate).sort((a, b) => a.datetime.localeCompare(b.datetime));
    return `<div class="im-day-calendar"><div class="im-day-date"><span>${this.parseDateKey(this.state.selectedDate).toLocaleDateString('en-IN', { weekday: 'long' })}</span><strong>${this.formatDate(`${this.state.selectedDate}T00:00`)}</strong></div><div class="im-day-timeline">${events.length ? events.map(item => this.renderCalendarEvent(item, true)).join('') : '<div class="im-empty">No interviews scheduled for this date.</div>'}</div></div>`;
  },

  renderCalendarEvent(item, detailed = false) {
    const structure = this.structureById(item.structureId);
    return `<button type="button" class="im-calendar-event ${this.statusClass(item.status)}" data-im-event="${item.id}"><time>${this.formatTime(item.datetime)}</time><strong>${this.escape(item.name)}</strong><span>${this.escape(structure?.name || item.course)}</span>${detailed ? `<small>${this.escape(item.mode)} · ${this.escape(this.interviewerById(item.interviewerId)?.name || 'Not Assigned')}</small>` : ''}</button>`;
  },

  renderScheduleOverview() {
    const rows = this.filteredInterviews();
    const selectedRows = rows.filter(item => item.datetime.slice(0, 10) === this.state.selectedDate).sort((a, b) => a.datetime.localeCompare(b.datetime));
    const counts = ['Scheduled', 'Awaiting Assignment', 'In Progress', 'Completed', 'Rescheduled', 'Cancelled'].map(status => ({ status, count: rows.filter(item => item.status === status).length }));
    return `<aside class="im-card im-overview">
      <div class="im-overview-head"><div><h2>Schedule Overview</h2><span>${this.parseDateKey(this.state.calendarDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span></div><div><button type="button" data-im-month-nav="prev"><i class="fas fa-chevron-left"></i></button><button type="button" data-im-month-nav="next"><i class="fas fa-chevron-right"></i></button></div></div>
      ${this.renderMonthCalendar(rows, true)}
      <div class="im-status-legend">${counts.map(item => `<span><i class="${this.statusClass(item.status)}"></i>${item.status.replace(' Assignment', '')} <b>${item.count}</b></span>`).join('')}</div>
      <div class="im-selected-day"><div class="im-selected-day-head"><strong>${this.formatDate(`${this.state.selectedDate}T00:00`)}</strong><span>${selectedRows.length} interview${selectedRows.length === 1 ? '' : 's'}</span></div><div class="im-overview-timeline">${selectedRows.length ? selectedRows.map(item => {
        const structure = this.structureById(item.structureId);
        return `<button type="button" data-im-event="${item.id}"><time>${this.formatTime(item.datetime)}</time><i class="${this.statusClass(item.status)}"></i><span><strong>${this.escape(item.name)}</strong><small>${this.escape(item.course)} · ${this.escape(structure?.name || 'Not mapped')}</small></span><em>${this.escape(this.interviewerById(item.interviewerId)?.name || 'Not Assigned')}</em></button>`;
      }).join('') : '<div class="im-empty">No interviews on this date.</div>'}</div></div>
    </aside>`;
  },

  renderStructures() {
    if (window.AMSInterviewStructures?.renderSection) return window.AMSInterviewStructures.renderSection();
    return `<section class="im-card im-structures ${this.state.structuresOpen ? 'open' : ''}">
      <div class="im-structures-head"><button type="button" data-im-action="toggle-structures"><i class="fas fa-chevron-${this.state.structuresOpen ? 'down' : 'right'}"></i><strong>Interview Structures</strong><span>${this.structures.filter(item => item.active).length} Active</span></button><button class="btn btn-outline btn-sm" type="button" data-im-action="create-structure"><i class="fas fa-gear"></i> Manage Structures</button></div>
      ${this.state.structuresOpen ? `<div class="im-structure-grid">${this.structures.map((item, index) => `<article class="im-structure-card"><span class="im-structure-icon tone-${index % 4}"><i class="fas ${item.mode === 'Online' ? 'fa-display' : 'fa-people-arrows'}"></i></span><div><strong>${this.escape(item.name)}</strong><small>${this.escape(item.course)} · ${item.rounds} rounds · ${item.attributes} attributes</small><em>${this.escape(item.mode)}</em></div><span class="im-active-badge ${item.active ? 'active' : ''}">${item.active ? 'Active' : 'Inactive'}</span><div class="im-structure-actions"><button type="button" data-im-structure-action="edit" data-id="${item.id}" title="Edit"><i class="fas fa-pen"></i></button><button type="button" data-im-structure-action="toggle" data-id="${item.id}" title="${item.active ? 'Deactivate' : 'Activate'}"><i class="fas ${item.active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i></button><button type="button" data-im-structure-action="delete" data-id="${item.id}" title="Delete"><i class="fas fa-trash"></i></button></div></article>`).join('')}</div>` : ''}
    </section>`;
  },

  filteredInterviews() {
    const f = this.state.filters;
    const today = this.dateKey(new Date());
    const upcomingEnd = this.dateKey(this.addDays(new Date(), 7));
    const month = today.slice(0, 7);
    let rows = this.interviews.filter(item => {
      const interviewer = this.interviewerById(item.interviewerId);
      const structure = this.structureById(item.structureId);
      const haystack = `${item.name} ${item.inquiryId} ${item.studentId} ${item.course} ${interviewer?.name || ''} ${structure?.name || ''}`.toLowerCase();
      const date = item.datetime.slice(0, 10);
      const kpiMatch = this.state.activeKpi === 'all'
        || (this.state.activeKpi === 'today' && date === today)
        || (this.state.activeKpi === 'upcoming' && date > today && date <= upcomingEnd && !['Completed', 'Cancelled'].includes(item.status))
        || (this.state.activeKpi === 'overdue' && new Date(item.datetime) < new Date() && ['Scheduled', 'Awaiting Assignment', 'In Progress', 'Rescheduled'].includes(item.status))
        || (this.state.activeKpi === 'evaluation' && ['In Progress', 'Completed'].includes(item.status) && !item.score && !(item.evaluation && Object.keys(item.evaluation).length))
        || (this.state.activeKpi === 'awaiting' && item.status === 'Awaiting Assignment')
        || (this.state.activeKpi === 'completed' && item.status === 'Completed' && date.startsWith(month));
      return kpiMatch
        && (!f.search || haystack.includes(f.search.toLowerCase()))
        && (!f.from || date >= f.from)
        && (!f.to || date <= f.to)
        && (f.course === 'all' || item.course === f.course)
        && (f.interviewer === 'all' || item.interviewerId === f.interviewer)
        && (f.structure === 'all' || item.structureId === f.structure)
        && (f.status === 'all' || item.status === f.status)
        && (f.mode === 'all' || item.mode === f.mode);
    });
    rows.sort((a, b) => {
      const aValue = a[this.state.sortKey] || '';
      const bValue = b[this.state.sortKey] || '';
      return String(aValue).localeCompare(String(bValue)) * (this.state.sortDirection === 'asc' ? 1 : -1);
    });
    return rows;
  },

  bindEvents() {
    const root = document.getElementById('ams-interview-root');
    const modal = document.getElementById('ams-interview-modal');
    root.addEventListener('click', event => this.handleClick(event));
    root.addEventListener('change', event => this.handleChange(event));
    root.addEventListener('input', event => this.handleInput(event));
    modal?.addEventListener('click', event => {
      if (event.target === modal || event.target.closest('[data-im-close]')) return this.closeModal();
      const assignedAction = event.target.closest('[data-im-assigned-action]');
      if (assignedAction) return this.handleAssignedAction(assignedAction.dataset.imAssignedAction, assignedAction.dataset.id, assignedAction.dataset.groupKey);
      const detailAction = event.target.closest('[data-im-detail-action]');
      if (detailAction) return this.handleDetailAction(detailAction.dataset.imDetailAction, detailAction.dataset.id);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.getElementById('ams-interview-modal')?.getAttribute('aria-hidden') === 'false') {
        event.preventDefault();
        this.closeModal();
      }
      if (event.key === 'Tab') this.trapModalFocus(event);
    });
  },

  handleClick(event) {
    const action = event.target.closest('[data-im-action]')?.dataset.imAction;
    if (action === 'schedule') return this.openScheduleForm();
    if (action === 'create-structure') {
      if (window.AMSInterviewStructures?.openStructureForm) return window.AMSInterviewStructures.openStructureForm();
      return this.openStructureForm();
    }
    if (action === 'export') return this.exportCsv();
    if (action === 'toggle-view') { this.state.view = this.state.view === 'list' ? 'calendar' : 'list'; return this.render(); }
    if (action === 'reset') return this.resetFilters();
    if (action === 'toggle-structures') { this.state.structuresOpen = !this.state.structuresOpen; return this.render(); }

    const kpi = event.target.closest('[data-im-kpi]')?.dataset.imKpi;
    if (kpi) {
      this.state.activeKpi = this.state.activeKpi === kpi ? 'all' : kpi;
      const first = this.filteredInterviews()[0];
      if (first) this.state.selectedDate = first.datetime.slice(0, 10);
      this.state.page = 1;
      return this.render();
    }
    const sort = event.target.closest('[data-im-sort]')?.dataset.imSort;
    if (sort) {
      if (this.state.sortKey === sort) this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
      else { this.state.sortKey = sort; this.state.sortDirection = 'asc'; }
      return this.render();
    }
    const page = event.target.closest('[data-im-page]')?.dataset.imPage;
    if (page) {
      const total = Math.max(1, Math.ceil(this.filteredInterviews().length / this.state.pageSize));
      this.state.page = page === 'prev' ? Math.max(1, this.state.page - 1) : page === 'next' ? Math.min(total, this.state.page + 1) : Number(page);
      return this.render();
    }
    const view = event.target.closest('[data-im-calendar-view]')?.dataset.imCalendarView;
    if (view) { this.state.calendarView = view; return this.render(); }
    const calendarNav = event.target.closest('[data-im-calendar-nav]')?.dataset.imCalendarNav;
    if (calendarNav) return this.navigateCalendar(calendarNav);
    const monthNav = event.target.closest('[data-im-month-nav]')?.dataset.imMonthNav;
    if (monthNav) return this.navigateMonth(monthNav);
    const assignedGroup = event.target.closest('[data-im-assigned-group]')?.dataset.imAssignedGroup;
    if (assignedGroup) return this.openAssignedInterviewList(assignedGroup);
    const interviewEvent = event.target.closest('[data-im-event]')?.dataset.imEvent;
    if (interviewEvent) return this.openInterviewDetail(interviewEvent);
    const date = event.target.closest('[data-im-date]')?.dataset.imDate;
    if (date) { this.state.selectedDate = date; this.state.calendarDate = date; return this.render(); }
    const rowAction = event.target.closest('[data-im-row-action]');
    if (rowAction) return this.handleRowAction(rowAction.dataset.imRowAction, rowAction.dataset.id);
    const bulk = event.target.closest('[data-im-bulk]')?.dataset.imBulk;
    if (bulk) return this.handleBulkAction(bulk);
    const structureAction = event.target.closest('[data-im-structure-action]');
    if (structureAction) return this.handleStructureAction(structureAction.dataset.imStructureAction, structureAction.dataset.id);
  },

  handleChange(event) {
    const filter = event.target.dataset.imFilter;
    if (filter) {
      this.state.filters[filter] = event.target.value;
      this.state.page = 1;
      return this.render();
    }
    if (event.target.matches('[data-im-select]')) {
      event.target.checked ? this.selectedRows.add(event.target.dataset.imSelect) : this.selectedRows.delete(event.target.dataset.imSelect);
      return this.render();
    }
    if (event.target.matches('[data-im-select-all]')) {
      const start = (this.state.page - 1) * this.state.pageSize;
      this.filteredInterviews().slice(start, start + this.state.pageSize).forEach(item => event.target.checked ? this.selectedRows.add(item.id) : this.selectedRows.delete(item.id));
      return this.render();
    }
    if (event.target.matches('[data-im-page-size]')) {
      this.state.pageSize = Number(event.target.value);
      this.state.page = 1;
      return this.render();
    }
  },

  handleInput(event) {
    const filter = event.target.dataset.imFilter;
    if (filter !== 'search') return;
    const value = event.target.value;
    this.state.filters.search = value;
    this.state.page = 1;
    this.render();
    requestAnimationFrame(() => {
      const input = document.getElementById('im-search');
      input?.focus({ preventScroll: true });
      input?.setSelectionRange(value.length, value.length);
    });
  },

  resetFilters() {
    Object.assign(this.state.filters, { search: '', from: '', to: '', course: 'all', interviewer: 'all', structure: 'all', status: 'all', mode: 'all' });
    this.state.activeKpi = 'all';
    this.state.page = 1;
    this.render();
  },

  handleRowAction(action, id) {
    if (action === 'view' || action === 'edit') return this.openInterviewDetail(id, false, { nested: true });
    if (action === 'reschedule') return this.openScheduleForm(id, true);
    if (action === 'start') return this.setInterviewStatus(id, 'In Progress', true);
    if (action === 'assign') return this.openAssignmentForm([id]);
    if (action === 'complete') return this.openCompleteForm([id]);
    if (action === 'cancel') return this.confirmAction('Cancel interview?', 'The interview will remain in the schedule with Cancelled status.', () => this.updateStatus([id], 'Cancelled'));
    if (action === 'delete') return this.confirmAction('Delete interview?', 'This interview will be permanently removed from the AMS schedule.', () => {
      this.interviews = this.interviews.filter(item => item.id !== id);
      this.selectedRows.delete(id);
      this.saveInterviews();
      this.render();
    });
  },

  handleBulkAction(action) {
    const ids = [...this.selectedRows];
    if (!ids.length) return;
    if (action === 'assign') return this.openAssignmentForm(ids);
    if (action === 'reschedule') return this.openBulkReschedule(ids);
    if (action === 'complete') return this.openCompleteForm(ids);
    if (action === 'cancel') return this.confirmAction('Cancel selected interviews?', `${ids.length} selected interview${ids.length === 1 ? '' : 's'} will be marked as Cancelled.`, () => this.updateStatus(ids, 'Cancelled'));
    return this.openUnderDevelopment();
  },

  openAssignedInterviewList(groupKey) {
    const [date, interviewerKey] = String(groupKey).split('|');
    const interviewerId = interviewerKey === 'unassigned' ? '' : interviewerKey;
    const rows = this.filteredInterviews()
      .filter(item => item.datetime.slice(0, 10) === date && (item.interviewerId || '') === interviewerId)
      .sort((a, b) => a.datetime.localeCompare(b.datetime));
    const interviewerName = this.interviewerById(interviewerId)?.name || 'Not Assigned';
    this.currentAssignedGroupKey = groupKey;
    this.openWideModal(`Assigned Interviews · ${interviewerName}`, `<div class="im-assigned-list">
      <div class="im-assigned-summary"><div><strong>${this.escape(interviewerName)}</strong><span>${this.formatDate(`${date}T00:00`)} · ${rows.length} assigned student interview${rows.length === 1 ? '' : 's'}</span></div></div>
      <div class="im-table-wrap"><table class="im-table im-assigned-table"><thead><tr><th>#</th><th>Interviewer</th><th>Slot Time</th><th>Interview Structure</th><th>Student Name</th><th>Inquiry / Admission Ref.</th><th>Interview Date</th><th>Application Date</th><th>Course / Class</th><th>Gender</th><th>Submitted On</th><th>Points / Status</th><th>Actions</th></tr></thead><tbody>
        ${rows.length ? rows.map((item, index) => this.renderAssignedInterviewRow(item, index, groupKey)).join('') : '<tr><td colspan="13" class="im-empty">No mapped student interviews found for this interviewer and date.</td></tr>'}
      </tbody></table></div>
    </div>`);
  },

  renderAssignedInterviewRow(item, index, groupKey) {
    const structure = this.structureById(item.structureId);
    const profile = this.studentProfile(item);
    const canDelete = !['Completed', 'In Progress'].includes(item.status);
    return `<tr><td>${index + 1}</td><td>${this.escape(this.interviewerById(item.interviewerId)?.name || 'Not Assigned')}</td><td>${this.formatTime(item.datetime)}</td><td>${this.escape(structure?.name || 'Not mapped')}</td><td><strong>${this.escape(profile.name)}</strong><small>${this.escape(item.studentId)}</small></td><td><strong>${this.escape(item.inquiryId)}</strong><small>${this.escape(profile.otrNo)}</small></td><td>${this.formatDate(item.datetime)}</td><td>${this.formatDate(`${item.applicationDate}T00:00`)}</td><td>${this.escape(item.course)}</td><td>${this.escape(profile.gender || 'Not provided')}</td><td>${this.formatDate(item.submittedDate)}</td><td>${item.score ? `${this.escape(item.score)}/100` : this.escape(item.status)}</td><td><div class="im-assigned-actions"><button type="button" data-im-assigned-action="view" data-id="${item.id}" title="View"><i class="fas fa-eye"></i></button><button type="button" data-im-assigned-action="edit" data-id="${item.id}" title="Edit"><i class="fas fa-pen"></i></button>${!['Completed', 'In Progress'].includes(item.status) ? `<button type="button" data-im-assigned-action="start" data-id="${item.id}" title="Start Interview"><i class="fas fa-play"></i></button>` : ''}${item.status !== 'Completed' ? `<button type="button" data-im-assigned-action="complete" data-id="${item.id}" title="Mark Interview Completed"><i class="fas fa-circle-check"></i></button>` : ''}${canDelete ? `<button type="button" class="danger" data-im-assigned-action="delete" data-id="${item.id}" data-group-key="${this.escape(groupKey)}" title="Delete"><i class="fas fa-trash"></i></button>` : ''}</div></td></tr>`;
  },

  handleAssignedAction(action, id, groupKey = '') {
    if (action === 'view' || action === 'edit') return this.openInterviewDetail(id, false, { nested: true });
    if (action === 'start') {
      const item = this.interviews.find(interview => interview.id === id);
      if (!item) return;
      item.status = 'In Progress';
      item.score = '';
      this.saveInterviews();
      this.render();
      this.openAssignedInterviewList(this.currentAssignedGroupKey || groupKey);
      return this.openInterviewDetail(id, false, { nested: true });
    }
    if (action === 'complete') return this.openInterviewDetail(id, true, { nested: true });
    if (action === 'delete') return this.confirmAction('Delete interview?', 'This mapped student interview will be permanently removed.', () => {
      this.interviews = this.interviews.filter(item => item.id !== id);
      this.saveInterviews();
      this.render();
      if (groupKey) this.openAssignedInterviewList(groupKey);
    });
  },

  handleStructureAction(action, id) {
    const structure = this.structureById(id);
    if (!structure) return;
    if (action === 'edit') return this.openStructureForm(id);
    if (action === 'toggle') {
      const next = structure.active ? 'deactivate' : 'activate';
      return this.confirmAction(`${this.titleCase(next)} structure?`, `${this.titleCase(next)} “${structure.name}”? Existing interview mappings will be preserved.`, () => {
        structure.active = !structure.active;
        this.saveStructures();
        this.render();
      });
    }
    if (action === 'delete') return this.confirmAction('Delete interview structure?', 'Mapped interviews will be marked as not mapped.', () => {
      this.structures = this.structures.filter(item => item.id !== id);
      this.interviews.forEach(item => { if (item.structureId === id) item.structureId = ''; });
      this.saveStructures();
      this.saveInterviews();
      this.render();
    });
  },

  openScheduleForm(id = '', markRescheduled = false, nested = false) {
    const existing = this.interviews.find(item => item.id === id);
    const candidates = this.uniqueCandidates();
    const defaultCandidate = existing || candidates[0];
    const structureOptions = candidate => this.structures.filter(item => (item.active && item.course === candidate.course) || item.id === existing?.structureId);
    const renderStructureOptions = candidate => structureOptions(candidate).map(item => `<option value="${item.id}" ${item.id === (existing?.structureId || candidate.structureId) ? 'selected' : ''}>${this.escape(item.name)} - ${this.escape(item.course)}</option>`).join('');
    const date = existing?.datetime.slice(0, 10) || this.state.selectedDate;
    const time = existing?.datetime.slice(11, 16) || '10:00';
    this.openModal(existing ? (markRescheduled ? 'Reschedule Interview' : 'Edit Interview') : 'Schedule Interview', `
      <form class="im-form" id="im-schedule-form">
        <div class="im-form-grid">
          <label><span>Student <b>*</b></span><select name="studentId" required ${existing ? 'disabled' : ''}>${candidates.map(item => `<option value="${item.studentId}" ${(existing?.studentId || defaultCandidate.studentId) === item.studentId ? 'selected' : ''}>${this.escape(item.name)} · ${this.escape(item.course)}</option>`).join('')}</select></label>
          <label><span>Interview Structure <b>*</b></span><select name="structureId" required>${renderStructureOptions(defaultCandidate)}</select></label>
          <label><span>Date <b>*</b></span><input type="date" name="date" value="${date}" required /></label>
          <label><span>Time <b>*</b></span><input type="time" name="time" value="${time}" required /></label>
          <label><span>Interviewer</span><select name="interviewerId"><option value="">Awaiting Assignment</option>${this.interviewers.map(item => `<option value="${item.id}" ${item.id === existing?.interviewerId ? 'selected' : ''}>${this.escape(item.name)} · ${this.escape(item.department)}</option>`).join('')}</select></label>
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
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (existing) {
        Object.assign(existing, {
          structureId: data.structureId,
          datetime: `${data.date}T${data.time}`,
          interviewerId: data.interviewerId,
          mode: data.mode,
          status: existing.status === 'Completed' ? 'Completed' : markRescheduled ? 'Rescheduled' : (data.interviewerId ? 'Scheduled' : 'Awaiting Assignment')
        });
      } else {
        const candidate = candidates.find(item => item.studentId === data.studentId);
        const nextNumber = String(Date.now()).slice(-6);
        this.interviews.push({ ...candidate, id: `IV-${nextNumber}`, structureId: data.structureId, datetime: `${data.date}T${data.time}`, interviewerId: data.interviewerId, mode: data.mode, status: data.interviewerId ? 'Scheduled' : 'Awaiting Assignment', score: '' });
      }
      this.state.selectedDate = data.date;
      this.state.calendarDate = data.date;
      this.saveInterviews();
      this.render();
      if (nested && existing) {
        this.modalStack = [];
        this.openInterviewDetail(existing.id);
      } else this.closeModal();
    });
  },

  openStructureForm(id = '') {
    const existing = this.structureById(id);
    this.openModal(existing ? 'Edit Interview Structure' : 'Create Interview Structure', `
      <form class="im-form" id="im-structure-form">
        <div class="im-form-grid">
          <label><span>Structure Name <b>*</b></span><input name="name" value="${this.escape(existing?.name || '')}" placeholder="Structure Name" required /></label>
          <label><span>Message Configuration <b>*</b></span><select name="message" required>${['Email + SMS', 'Email Only', 'SMS Only', 'WhatsApp + Email'].map(item => `<option ${item === existing?.message ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
          <label class="span-2"><span>Structure Description</span><textarea name="description" rows="3" placeholder="Describe the interview structure">${this.escape(existing?.description || '')}</textarea></label>
          <label><span>Course Mapping <b>*</b></span><select name="course" required>${this.courses.map(item => `<option ${item === existing?.course ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
          <label><span>Interview Mode <b>*</b></span><select name="mode" required>${['Online', 'In-Person'].map(item => `<option ${item === existing?.mode ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
        </div>
        <div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button class="btn btn-primary" type="submit"><i class="fas fa-floppy-disk"></i>${existing ? 'Save Structure' : 'Create Structure'}</button></div>
      </form>
    `, 'lg');
    document.getElementById('im-structure-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (existing) {
        Object.assign(existing, data);
        this.interviews.filter(item => item.structureId === existing.id).forEach(item => { item.course = existing.course; });
        this.saveInterviews();
      }
      else this.structures.push({ id: `STR-${String(Date.now()).slice(-6)}`, ...data, rounds: 1, attributes: 4, active: true });
      this.saveStructures();
      this.closeModal();
      this.render();
    });
  },

  openAssignmentForm(ids) {
    this.openModal('Assign Interviewer', `<form class="im-form" id="im-assign-form"><label><span>Interviewer <b>*</b></span><select name="interviewerId" required>${this.interviewers.map(item => `<option value="${item.id}">${this.escape(item.name)} · ${this.escape(item.department)} · ${this.escape(item.availability)}</option>`).join('')}</select></label><div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button type="submit" class="btn btn-primary">Assign to ${ids.length} Interview${ids.length === 1 ? '' : 's'}</button></div></form>`, 'md');
    document.getElementById('im-assign-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const interviewerId = new FormData(event.currentTarget).get('interviewerId');
      this.interviews.filter(item => ids.includes(item.id)).forEach(item => { item.interviewerId = interviewerId; if (item.status === 'Awaiting Assignment') item.status = 'Scheduled'; });
      this.finishBulkUpdate();
    });
  },

  openCompleteForm(ids) {
    this.openModal('Mark Interview Completed', `<form class="im-form" id="im-complete-form"><label><span>Interview Score <b>*</b></span><input type="number" name="score" min="0" max="100" value="80" required /></label><div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button type="submit" class="btn btn-primary">Mark ${ids.length} Completed</button></div></form>`, 'md');
    document.getElementById('im-complete-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const score = new FormData(event.currentTarget).get('score');
      this.interviews.filter(item => ids.includes(item.id)).forEach(item => { item.status = 'Completed'; item.score = score; });
      this.finishBulkUpdate();
    });
  },

  openBulkReschedule(ids) {
    this.openModal('Reschedule Selected Interviews', `<form class="im-form" id="im-reschedule-form"><div class="im-form-grid"><label><span>New Date <b>*</b></span><input type="date" name="date" value="${this.state.selectedDate}" required /></label><label><span>Starting Time <b>*</b></span><input type="time" name="time" value="10:00" required /></label></div><div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button type="submit" class="btn btn-primary">Reschedule ${ids.length}</button></div></form>`, 'md');
    document.getElementById('im-reschedule-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      this.interviews.filter(item => ids.includes(item.id)).forEach((item, index) => {
        const [hour, minute] = data.time.split(':').map(Number);
        const time = `${String(hour + index).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        item.datetime = `${data.date}T${time}`;
        item.status = 'Rescheduled';
      });
      this.state.selectedDate = data.date;
      this.finishBulkUpdate();
    });
  },

  updateStatus(ids, status) {
    this.interviews.filter(item => ids.includes(item.id)).forEach(item => { item.status = status; if (status !== 'Completed') item.score = ''; });
    this.finishBulkUpdate();
  },

  finishBulkUpdate() {
    this.selectedRows.clear();
    this.saveInterviews();
    this.closeModal();
    this.render();
  },

  confirmAction(title, text, callback) {
    const normalizedTitle = String(title).toLowerCase();
    const actionLabel = normalizedTitle.startsWith('delete') ? 'Delete'
      : normalizedTitle.startsWith('cancel') ? 'Cancel Interview'
        : normalizedTitle.startsWith('deactivate') ? 'Deactivate'
          : normalizedTitle.startsWith('activate') ? 'Activate'
            : 'Confirm';
    this.openModal(title, `<div class="im-confirm" role="alertdialog" aria-describedby="im-confirm-message"><span><i class="fas fa-triangle-exclamation"></i></span><p id="im-confirm-message">${this.escape(text)}</p><div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Go Back</button><button type="button" class="btn btn-danger" id="im-confirm-action">${actionLabel}</button></div></div>`, 'sm', { nested: true, kind: 'confirmation' });
    document.getElementById('im-confirm-action')?.addEventListener('click', () => { this.closeModal(); callback(); });
  },

  studentProfile(item) {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('paAMSOTRRecords') || '[]'); } catch (error) {}
    const records = [...stored, ...(window.APP_DATA?.AMS_OTR_SAMPLE_RECORDS || [])];
    const normalize = value => String(value || '').trim().toLowerCase();
    const matched = records.find(record => {
      const personal = record.personal || {};
      return (personal.email && normalize(personal.email) === normalize(item.email))
        || (personal.phone && normalize(personal.phone) === normalize(item.phone))
        || (personal.fullName && normalize(personal.fullName) === normalize(item.name))
        || normalize(record.otrNo) === normalize(item.otr?.otrNo);
    }) || item.otr || {};
    const personal = matched.personal || {};
    const photo = matched.documents?.passportPhoto;
    return {
      name: personal.fullName || item.name,
      studentId: item.studentId,
      admissionId: item.inquiryId,
      otrNo: matched.otrNo || item.otr?.otrNo || 'Not mapped',
      dateOfBirth: personal.dateOfBirth || '',
      gender: personal.gender || '',
      phone: personal.phone || item.phone,
      email: personal.email || item.email,
      submittedDate: matched.updatedAt || item.submittedDate,
      photo: photo?.type?.startsWith('image/') ? photo.dataUrl : ''
    };
  },

  openInterviewDetail(id, completeRequested = false, options = {}) {
    const item = this.interviews.find(interview => interview.id === id);
    if (!item) return;
    const structure = this.structureById(item.structureId);
    const interviewer = this.interviewerById(item.interviewerId);
    const profile = this.studentProfile(item);
    const attributes = (structure?.groups || []).flatMap(group => (group.attributes || []).map(attribute => ({ ...attribute, groupName: group.name })));
    const statusActions = this.detailActions(item);
    this.openWideModal(`Student Interview · ${item.interviewNumber}`, `<form class="im-interview-detail" id="im-interview-detail-form" data-id="${item.id}">
      <div class="im-detail-hero"><div class="im-detail-person">${profile.photo ? `<img src="${this.escape(profile.photo)}" alt="${this.escape(profile.name)}" />` : `<span>${this.initials(profile.name)}</span>`}<div><strong>${this.escape(profile.name)}</strong><small>${this.escape(profile.studentId)} · ${this.escape(profile.otrNo)}</small><em class="im-status ${this.statusClass(item.status)}">${this.escape(item.status)}</em></div></div><div class="im-detail-number"><span>Interview Number</span><strong>${this.escape(item.interviewNumber)}</strong></div></div>
      <div class="im-detail-grid">
        ${this.detailSection('Student Information', 'fa-user', [
          ['Student / Admission ID', `${profile.studentId} / ${profile.admissionId}`], ['Date of Birth', profile.dateOfBirth ? this.formatDate(`${profile.dateOfBirth}T00:00`) : 'Not provided'],
          ['Gender', profile.gender || 'Not provided'], ['Phone Number', profile.phone || 'Not provided'], ['Email Address', profile.email || 'Not provided']
        ])}
        ${this.detailSection('Course Information', 'fa-graduation-cap', [['Selected Course', item.course], ['Batch', item.batch || 'Not allocated'], ['Mode of Learning', item.learningMode || item.mode]])}
        ${this.detailSection('Interview Information', 'fa-calendar-check', [['Interview Number', item.interviewNumber], ['Interview Date', this.formatDate(item.datetime)], ['Interview Time', this.formatTime(item.datetime)], ['Assigned Interviewer', interviewer?.name || 'Not Assigned'], ['Interview Mode', item.mode], ['Interview Structure', structure?.name || 'Not mapped'], ['Current Status', item.status]])}
      </div>
      <section class="im-evaluation"><header><div><i class="fas fa-clipboard-check"></i><div><strong>Interview Evaluation</strong><span>${structure ? `${this.escape(structure.name)} attributes only` : 'No interview structure is mapped'}</span></div></div><b>${attributes.length} field${attributes.length === 1 ? '' : 's'}</b></header>
        <div class="im-evaluation-fields">${attributes.length ? attributes.map(attribute => this.evaluationField(attribute, item.evaluation?.[attribute.id])).join('') : '<div class="im-empty">No evaluation attributes are assigned to this interview structure.</div>'}</div>
      </section>
      <div class="im-detail-actions"><div><button type="button" class="btn btn-outline" data-im-close>Close</button>${statusActions}</div><button type="submit" class="btn btn-primary"><i class="fas fa-floppy-disk"></i>${Object.keys(item.evaluation || {}).length ? 'Update Evaluation' : 'Save Evaluation'}</button></div>
    </form>`, options);
    this.bindDetailForm();
    if (completeRequested) document.querySelector('[data-im-detail-action="complete"]')?.focus({ preventScroll: true });
  },

  detailSection(title, icon, fields) {
    return `<section class="im-detail-section"><header><i class="fas ${icon}"></i><strong>${title}</strong></header><dl>${fields.map(([label, value]) => `<div><dt>${this.escape(label)}</dt><dd>${this.escape(value)}</dd></div>`).join('')}</dl></section>`;
  },

  evaluationField(attribute, value = '') {
    const name = `evaluation-${attribute.id}`;
    const label = `<span>${this.escape(attribute.name)}${attribute.required ? ' <b>*</b>' : ''}<small>${this.escape(attribute.groupName)}</small></span>`;
    const common = `name="${this.escape(name)}" ${attribute.required ? 'required' : ''}`;
    if (attribute.type === 'Long Text') return `<label class="span-2">${label}<textarea ${common} rows="3">${this.escape(value)}</textarea></label>`;
    if (attribute.type === 'Select' || attribute.type === 'Yes / No') {
      const options = attribute.type === 'Yes / No' ? ['Yes', 'No'] : String(attribute.options || '').split(',').map(option => option.trim()).filter(Boolean);
      return `<label>${label}<select ${common}><option value="">Select</option>${options.map(option => `<option ${String(value) === option ? 'selected' : ''}>${this.escape(option)}</option>`).join('')}</select></label>`;
    }
    const type = attribute.type === 'Date' ? 'date' : ['Number', 'Rating'].includes(attribute.type) ? 'number' : 'text';
    const limits = type === 'number' ? `min="0" ${attribute.maxPoints ? `max="${Number(attribute.maxPoints)}"` : ''} step="0.01"` : '';
    return `<label>${label}<input type="${type}" ${common} ${limits} value="${this.escape(value)}" /></label>`;
  },

  detailActions(item) {
    const buttons = [];
    if (['Scheduled', 'Rescheduled', 'Awaiting Assignment'].includes(item.status)) buttons.push(`<button type="button" class="btn btn-primary" data-im-detail-action="start" data-id="${item.id}"><i class="fas fa-play"></i> Start Interview</button>`);
    if (item.status !== 'Completed' && item.status !== 'Cancelled') buttons.push(`<button type="button" class="btn btn-success" data-im-detail-action="complete" data-id="${item.id}"><i class="fas fa-circle-check"></i> Complete Interview</button>`);
    if (!['Completed', 'Cancelled'].includes(item.status)) buttons.push(`<button type="button" class="btn btn-outline" data-im-detail-action="reschedule" data-id="${item.id}"><i class="fas fa-calendar-plus"></i> Reschedule</button><button type="button" class="btn btn-danger" data-im-detail-action="cancel" data-id="${item.id}"><i class="fas fa-ban"></i> Cancel</button>`);
    return buttons.join('');
  },

  handleDetailAction(action, id) {
    if (action === 'start') return this.setInterviewStatus(id, 'In Progress', true);
    if (action === 'complete') return this.saveEvaluation(id, true);
    if (action === 'cancel') return this.confirmAction('Cancel interview?', `Cancel ${this.interviews.find(item => item.id === id)?.interviewNumber || 'this interview'}? The evaluation data will be preserved.`, () => this.setInterviewStatus(id, 'Cancelled'));
    if (action === 'reschedule') return this.openScheduleForm(id, true, true);
  },

  saveEvaluation(id, complete = false) {
    const item = this.interviews.find(interview => interview.id === id);
    const form = document.getElementById('im-interview-detail-form');
    if (!item || !form || !form.reportValidity()) return;
    const data = new FormData(form);
    const structure = this.structureById(item.structureId);
    const attributes = (structure?.groups || []).flatMap(group => group.attributes || []);
    item.evaluation = Object.fromEntries(attributes.map(attribute => [attribute.id, data.get(`evaluation-${attribute.id}`) || '']));
    if (complete) {
      item.status = 'Completed';
      const scored = attributes.filter(attribute => Number(attribute.maxPoints) > 0);
      const total = scored.reduce((sum, attribute) => sum + Number(attribute.maxPoints), 0);
      const earned = scored.reduce((sum, attribute) => sum + Number(item.evaluation[attribute.id] || 0), 0);
      if (total) item.score = String(Math.round((earned / total) * 100));
    }
    this.saveInterviews();
    this.render();
    if (this.modalStack.length && this.currentAssignedGroupKey) {
      this.modalStack = [];
      this.openAssignedInterviewList(this.currentAssignedGroupKey);
      this.openInterviewDetail(id, false, { nested: true });
    } else this.openInterviewDetail(id);
  },

  setInterviewStatus(id, status, reopen = false) {
    const item = this.interviews.find(interview => interview.id === id);
    if (!item) return;
    item.status = status;
    if (status !== 'Completed') item.score = '';
    this.saveInterviews();
    this.render();
    if (reopen) this.openInterviewDetail(id, false, { preserveStack: this.modalStack.length > 0 });
    else if (this.modalStack.length && this.currentAssignedGroupKey) {
      this.modalStack = [];
      this.openAssignedInterviewList(this.currentAssignedGroupKey);
    } else this.closeModal();
  },

  openUnderDevelopment() {
    this.openModal('Interview Details', `<div class="im-under-development"><span><i class="fas fa-screwdriver-wrench"></i></span><h3>Under Development</h3><p>This detailed workflow will be available in a future phase.</p><button type="button" class="btn btn-primary" data-im-close>Close</button></div>`, 'sm');
  },

  openModal(title, content, size = 'md', options = {}) {
    const modal = document.getElementById('ams-interview-modal');
    const titleNode = document.getElementById('im-modal-title');
    const bodyNode = document.getElementById('im-modal-body');
    if (!modal || !titleNode || !bodyNode) return;
    if (options.nested && modal.getAttribute('aria-hidden') === 'false') {
      this.modalStack.push({ title: titleNode.textContent, content: bodyNode.innerHTML, size: this.modalSize(modal), kind: modal.dataset.modalKind || 'form', scrollTop: bodyNode.scrollTop, focus: document.activeElement });
    } else if (!options.preserveStack) this.modalStack = [];
    if (modal.getAttribute('aria-hidden') === 'true') this.modalTrigger = document.activeElement;
    this.applyModalSize(size);
    modal.dataset.modalKind = options.kind || 'form';
    modal.setAttribute('aria-busy', 'false');
    titleNode.textContent = title;
    bodyNode.innerHTML = content;
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('ams-interview-root')?.setAttribute('inert', '');
    document.body.classList.add('im-modal-open');
    bodyNode.scrollTop = 0;
    this.bindModalValidation(bodyNode);
    this.bindDetailForm();
    requestAnimationFrame(() => {
      const target = bodyNode.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])') || modal.querySelector('[data-im-close]');
      target?.focus({ preventScroll: true });
    });
  },

  openWideModal(title, content, options = {}) {
    this.openModal(title, content, 'xl', options);
  },

  closeModal() {
    const modal = document.getElementById('ams-interview-modal');
    const previous = this.modalStack.pop();
    if (previous) {
      this.openModal(previous.title, previous.content, previous.size, { preserveStack: true, kind: previous.kind });
      requestAnimationFrame(() => {
        const bodyNode = document.getElementById('im-modal-body');
        if (bodyNode) bodyNode.scrollTop = previous.scrollTop || 0;
        previous.focus?.focus?.({ preventScroll: true });
      });
      return;
    }
    modal?.setAttribute('aria-hidden', 'true');
    modal?.classList.remove('ims-wide', 'im-modal--sm', 'im-modal--md', 'im-modal--lg', 'im-modal--xl');
    modal?.removeAttribute('data-modal-kind');
    document.getElementById('ams-interview-root')?.removeAttribute('inert');
    document.body.classList.remove('im-modal-open');
    this.modalTrigger?.focus?.({ preventScroll: true });
    this.modalTrigger = null;
  },

  modalSize(modal) {
    return ['sm', 'md', 'lg', 'xl'].find(size => modal.classList.contains(`im-modal--${size}`)) || (modal.classList.contains('ims-wide') ? 'xl' : 'md');
  },

  applyModalSize(size = 'md') {
    const modal = document.getElementById('ams-interview-modal');
    if (!modal) return;
    const normalized = ['sm', 'md', 'lg', 'xl'].includes(size) ? size : 'md';
    modal.classList.remove('ims-wide', 'im-modal--sm', 'im-modal--md', 'im-modal--lg', 'im-modal--xl');
    modal.classList.add(`im-modal--${normalized}`);
  },

  bindModalValidation(container) {
    container.querySelectorAll('form').forEach(form => {
      form.addEventListener('invalid', event => {
        const field = event.target;
        field.classList.add('im-invalid');
        field.setAttribute('aria-invalid', 'true');
        let message = field.parentElement?.querySelector(':scope > .im-field-error');
        if (!message && field.parentElement) {
          message = document.createElement('small');
          message.className = 'im-field-error';
          field.insertAdjacentElement('afterend', message);
        }
        if (message) message.textContent = field.validationMessage || 'Please complete this required field.';
      }, true);
      form.addEventListener('input', event => {
        const field = event.target;
        if (!field.matches('input, select, textarea') || !field.validity?.valid) return;
        field.classList.remove('im-invalid');
        field.removeAttribute('aria-invalid');
        field.parentElement?.querySelector(':scope > .im-field-error')?.remove();
      });
    });
  },

  bindDetailForm() {
    const form = document.getElementById('im-interview-detail-form');
    if (!form || form.dataset.submitBound === 'true') return;
    form.dataset.submitBound = 'true';
    form.addEventListener('submit', event => {
      event.preventDefault();
      this.saveEvaluation(form.dataset.id, false);
    });
  },

  trapModalFocus(event) {
    const modal = document.getElementById('ams-interview-modal');
    if (!modal || modal.getAttribute('aria-hidden') !== 'false') return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(element => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  },

  exportCsv() {
    const headers = ['Candidate', 'Inquiry ID', 'Student ID', 'Course', 'Structure', 'Date Time', 'Interviewer', 'Mode', 'Status', 'Score'];
    const rows = this.filteredInterviews().map(item => [item.name, item.inquiryId, item.studentId, item.course, this.structureById(item.structureId)?.name || '', item.datetime, this.interviewerById(item.interviewerId)?.name || '', item.mode, item.status, item.score]);
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ams-interviews-${this.dateKey(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },

  navigateCalendar(direction) {
    if (direction === 'today') {
      this.state.selectedDate = this.dateKey(new Date());
      this.state.calendarDate = this.state.selectedDate;
    } else {
      const current = this.parseDateKey(this.state.selectedDate);
      let next;
      if (this.state.calendarView === 'month') {
        next = new Date(current);
        const selectedDay = next.getDate();
        next.setDate(1);
        next.setMonth(next.getMonth() + (direction === 'next' ? 1 : -1));
        const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(selectedDay, lastDay));
      } else {
        const amount = this.state.calendarView === 'week' ? 7 : 1;
        next = this.addDays(current, direction === 'next' ? amount : -amount);
      }
      this.state.selectedDate = this.dateKey(next);
      this.state.calendarDate = this.state.selectedDate;
    }
    this.render();
  },

  navigateMonth(direction) {
    const date = this.parseDateKey(this.state.calendarDate);
    date.setDate(1);
    date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    this.state.calendarDate = this.dateKey(date);
    this.state.selectedDate = this.dateKey(new Date(date.getFullYear(), date.getMonth(), 1));
    this.render();
  },

  calendarTitle() {
    const selected = this.parseDateKey(this.state.selectedDate);
    if (this.state.calendarView === 'month') return selected.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (this.state.calendarView === 'day') return selected.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const start = this.startOfWeek(selected);
    const end = this.addDays(start, 6);
    return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  },

  uniqueCandidates() {
    const map = new Map();
    this.interviews.forEach(item => {
      if (!map.has(item.studentId)) map.set(item.studentId, { studentId: item.studentId, inquiryId: item.inquiryId, name: item.name, email: item.email, phone: item.phone, course: item.course, structureId: item.structureId });
    });
    return [...map.values()];
  },

  structureById(id) { return this.structures.find(item => item.id === id); },
  interviewerById(id) { return this.interviewers.find(item => item.id === id); },
  statusClass(status) { return String(status).toLowerCase().replace(/\s+/g, '-'); },
  initials(name) { return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(); },
  titleCase(value) { return value.charAt(0).toUpperCase() + value.slice(1); },
  formatDate(value) { return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); },
  formatTime(value) { return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); },
  offsetDateTime(offset, time) { return `${this.dateKey(this.addDays(new Date(), offset))}T${time}`; },
  addDays(value, count) { const date = new Date(value); date.setDate(date.getDate() + count); return date; },
  startOfWeek(value) { const date = new Date(value); const day = date.getDay(); date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); return date; },
  parseDateKey(value) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); },
  dateKey(value) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; },
  escape(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
};

window.AMSInterviews = AMSInterviews;
