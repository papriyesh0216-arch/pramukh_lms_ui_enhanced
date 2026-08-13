// ============================================================
// AMS DASHBOARD - Focused operational overview using AMS data only
// Reporting redesign is scoped to AMS Dashboard only.
// ============================================================

const AMSDashboard = {
  initialized: false,
  activeKpi: '',
  courseFilter: 'all',
  dateFrom: '',
  dateTo: '',
  rotatorIndex: 0,
  rotationTimer: null,
  rotationOrder: ['activity', 'calendar'],

  init() {
    const root = document.getElementById('ams-dashboard-root');
    if (!root || this.initialized) return;
    this.initialized = true;
    this.ensureDateDialogStyles();
    root.addEventListener('click', event => this.handleClick(event));
    root.addEventListener('change', event => this.handleChange(event));
    window.addEventListener('ams:data-change', () => {
      if (window.AMSApp?.currentScreen === 'ams-dashboard') this.render();
    });
    window.addEventListener('storage', event => {
      if (['paAMSOTRRecords', 'paAMSInterviews', 'paAdmissionShortlist'].includes(event.key)) this.render();
    });
    this.render();
    this.startRotation();
  },

  rawData() {
    return {
      students: Array.isArray(window.AMSStudentList?.rows)
        ? window.AMSStudentList.rows
        : (window.AMSModule?.students || []),
      otr: window.AMSOTR?.getRecords?.() || [],
      interviews: Array.isArray(window.AMSInterviews?.interviews) ? window.AMSInterviews.interviews : []
    };
  },

  availableCourses(raw) {
    const courses = new Set();
    raw.students.forEach(item => item.course && courses.add(String(item.course)));
    raw.interviews.forEach(item => item.course && courses.add(String(item.course)));
    raw.otr.forEach(item => {
      const direct = item.course || item.selectedCourse || item.admissionCourse || item.personal?.course;
      if (direct) courses.add(String(direct));
      else {
        const student = this.findStudentForRecord(item, raw.students);
        if (student?.course) courses.add(String(student.course));
      }
    });
    return [...courses].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  },

  normalizeEmail(value = '') { return String(value).trim().toLowerCase(); },
  normalizePhone(value = '') { return String(value).replace(/\D/g, ''); },

  identity(item = {}) {
    const email = this.normalizeEmail(item.email || item.personal?.email || item.otr?.personal?.email);
    const phone = this.normalizePhone(item.phone || item.personal?.phone || item.otr?.personal?.phone);
    return email || phone || String(item.studentId || item.otrNo || item.admissionNo || item.key || item.id || item.name || '');
  },

  findStudentForRecord(record, students) {
    const recordEmail = this.normalizeEmail(record.email || record.personal?.email || record.otr?.personal?.email);
    const recordPhone = this.normalizePhone(record.phone || record.personal?.phone || record.otr?.personal?.phone);
    const recordOtr = String(record.otrNo || record.otr?.otrNo || '').toUpperCase();
    return students.find(student => {
      const email = this.normalizeEmail(student.email);
      const phone = this.normalizePhone(student.phone);
      const otr = String(student.otrNo || student.admissionNo || '').toUpperCase();
      return (recordEmail && email === recordEmail)
        || (recordPhone && phone === recordPhone)
        || (recordOtr && otr === recordOtr);
    });
  },

  recordCourse(record, students) {
    return String(
      record.course
      || record.selectedCourse
      || record.admissionCourse
      || record.personal?.course
      || this.findStudentForRecord(record, students)?.course
      || 'Course not mapped'
    );
  },

  recordDate(item, type) {
    if (type === 'interview') return item.datetime || item.updatedAt || item.submittedDate || '';
    if (type === 'otr') return item.updatedAt || item.createdAt || '';
    return item.updatedAt || item.admissionDateTime || item.createdAt || item.admissionDate || item.applicationDate || '';
  },

  inDateRange(value) {
    if (!this.dateFrom && !this.dateTo) return true;
    const key = this.dateKey(new Date(value || ''));
    if (!key) return false;
    if (this.dateFrom && key < this.dateFrom) return false;
    if (this.dateTo && key > this.dateTo) return false;
    return true;
  },

  buildOtrDataset(students, otrRecords) {
    const result = [];
    const usedRecords = new Set();
    students.forEach((student, index) => {
      const matchedIndex = otrRecords.findIndex((record, recordIndex) => {
        if (usedRecords.has(recordIndex)) return false;
        return Boolean(this.findStudentForRecord(record, [student]));
      });
      const matched = matchedIndex >= 0 ? otrRecords[matchedIndex] : null;
      if (matchedIndex >= 0) usedRecords.add(matchedIndex);
      const statusKey = String(student.statusKey || '').toLowerCase();
      const matchedStatus = String(matched?.statusKey || matched?.status || '').toLowerCase();
      let status = 'Submitted';
      if (statusKey === 'otr_draft' || /draft/.test(matchedStatus)) status = 'Draft';
      else if (statusKey === 'otr_pending' || /pending/.test(matchedStatus)) status = 'Pending';
      else if (student.stageKey === 'otr' && statusKey !== 'otr_submitted' && !matched) status = 'Pending';
      result.push({
        key: String(student.otrNo || student.admissionNo || matched?.otrNo || `AMS-OTR-${index}`),
        course: String(student.course || matched?.__course || 'Course not mapped'),
        status,
        student,
        record: matched
      });
    });
    otrRecords.forEach((record, index) => {
      if (usedRecords.has(index)) return;
      const rawStatus = String(record.statusKey || record.status || '').toLowerCase();
      const status = /draft/.test(rawStatus) ? 'Draft' : /pending/.test(rawStatus) ? 'Pending' : 'Submitted';
      result.push({
        key: String(record.otrNo || record.id || `AMS-OTR-EXTRA-${index}`),
        course: String(record.__course || 'Course not mapped'),
        status,
        student: null,
        record
      });
    });
    return [...new Map(result.map(item => [item.key, item])).values()];
  },

  uniqueRows(rows) {
    const byIdentity = new Map();
    rows.forEach((item, index) => {
      const key = this.identity(item) || `row-${index}`;
      if (!byIdentity.has(key)) byIdentity.set(key, item);
    });
    return [...byIdentity.values()];
  },

  isWaitingListInterview(interview, students) {
    if (String(interview.status || '') !== 'Completed') return false;
    const student = this.findStudentForRecord(interview, students);
    const text = [
      interview.waitingList, interview.result, interview.outcome, interview.decision,
      interview.evaluation?.result, interview.evaluation?.overallResult,
      student?.waitingList, student?.subStatus, student?.stageStatus, student?.nextStep, student?.purpose
    ].filter(value => value !== undefined && value !== null).join(' ').toLowerCase();
    return interview.waitingList === true
      || student?.waitingList === true
      || /waiting\s*list|waitlist|on\s*hold|reserve\s*list/.test(text);
  },

  data() {
    const raw = this.rawData();
    const availableCourses = this.availableCourses(raw);
    const selectedCourse = this.courseFilter;
    let students = raw.students.filter(item => selectedCourse === 'all' || String(item.course || '') === selectedCourse);
    let interviews = raw.interviews.filter(item => selectedCourse === 'all' || String(item.course || '') === selectedCourse);
    let otr = raw.otr.map(record => ({ ...record, __course: this.recordCourse(record, raw.students) }))
      .filter(item => selectedCourse === 'all' || item.__course === selectedCourse);

    students = students.filter(item => this.inDateRange(this.recordDate(item, 'student')));
    interviews = interviews.filter(item => this.inDateRange(this.recordDate(item, 'interview')));
    otr = otr.filter(item => this.inDateRange(this.recordDate(item, 'otr')));

    const now = new Date();
    const today = this.dateKey(now);
    const weekEnd = this.dateKey(this.addDays(now, 7));
    const activeInterviewStatuses = new Set(['Scheduled', 'Awaiting Assignment', 'In Progress', 'Rescheduled', 'Pending']);
    const scheduledInterviewStatuses = new Set(['Scheduled', 'In Progress', 'Rescheduled']);
    const interviewDate = item => String(item.datetime || '').slice(0, 10);
    const todayInterviews = interviews.filter(item => interviewDate(item) === today && !['Cancelled', 'Canceled'].includes(item.status));
    const upcoming = interviews.filter(item => interviewDate(item) > today && interviewDate(item) <= weekEnd && activeInterviewStatuses.has(item.status));
    const overdue = interviews.filter(item => item.datetime && new Date(item.datetime) < now && activeInterviewStatuses.has(item.status));
    const completed = interviews.filter(item => item.status === 'Completed');
    const waitingList = completed.filter(item => this.isWaitingListInterview(item, students));
    const pendingInterviewRecords = interviews.filter(item => {
      const status = String(item.status || '');
      return status === 'Awaiting Assignment' || status === 'Pending' || (!item.interviewerId && !['Completed', 'Cancelled', 'Canceled'].includes(status));
    });
    const interviewStageStudentsWithoutRecord = students.filter(student => {
      if (student.stageKey !== 'interview') return false;
      return !interviews.some(item => Boolean(this.findStudentForRecord(item, [student])));
    });
    const pendingInterviews = this.uniqueRows([...pendingInterviewRecords, ...interviewStageStudentsWithoutRecord]);
    const scheduledInterviews = this.uniqueRows(interviews.filter(item => scheduledInterviewStatuses.has(item.status) && item.interviewerId));
    const otrDataset = this.buildOtrDataset(students, otr);
    const statusCount = key => students.filter(item => item.statusKey === key || item.stageKey === key).length;
    const confirmed = statusCount('admission_confirmed');
    const closed = statusCount('application_rejected') + statusCount('declined_by_student');
    const examProcess = students.filter(item => item.stageKey === 'exam' || /^exam_/.test(String(item.statusKey || ''))).length;

    return {
      students, otr, interviews, availableCourses, now, today, weekEnd,
      todayInterviews, upcoming, overdue, completed, waitingList,
      pendingInterviews, scheduledInterviews, otrDataset,
      totalOtrGenerated: otrDataset.length,
      otrPending: otrDataset.filter(item => item.status === 'Pending').length,
      examProcess, confirmed, closed
    };
  },

  render() {
    const root = document.getElementById('ams-dashboard-root');
    if (!root) return;
    const data = this.data();
    root.innerHTML = `
      ${this.header(data)}
      ${this.kpis(data)}
      <div class="amsd-layout amsd-report-layout">
        ${this.panel('Interview Overview', 'Upcoming, current, overdue, completed, and post-interview waiting records', this.interviewOverview(data), 'amsd-report-interviews span-2', this.reportActions('interviews', this.linkButton('Open Interviews', 'interviews')))}
        ${this.panel('OTR Form Analytics', 'OTR submission counts with course-level filtering', this.otrAnalytics(data), 'amsd-report-otr', this.reportActions('otr'))}
        ${this.panel('Course Analytics', 'Admission volume by course, batch, and learning mode', this.courseAnalytics(data), 'amsd-report-course', this.reportActions('courses'))}
        ${this.rotatingPanel(data)}
      </div>`;
  },

  // Header intentionally preserved from the current AMS Dashboard implementation.
  header(data) {
    const options = ['<option value="all">All Courses</option>']
      .concat(data.availableCourses.map(course => `<option value="${this.escape(course)}" ${this.courseFilter === course ? 'selected' : ''}>${this.escape(course)}</option>`)).join('');
    return `<header class="dashboard-header dashboard-hero-header amsd-lms-header">
      <div class="dashboard-title-wrap"><div class="section-eyebrow">Admission Management System</div><h1>Admission Operations <span>Dashboard</span></h1><div class="dashboard-welcome">One live view of OTR, exams, interviews, course movement, and admission outcomes.</div></div>
      <div class="dashboard-controls"><select class="chart-filter-select" id="amsd-course-filter" aria-label="Filter AMS Dashboard by course">${options}</select><button class="date-filter-btn" type="button" data-amsd-action="date-filter" title="${this.dateFrom || this.dateTo ? `${this.dateFrom || 'Start'} to ${this.dateTo || 'Today'}` : 'Custom Date'}"><i class="fas fa-calendar-alt"></i> Custom Date</button></div>
    </header>`;
  },

  kpis(data) {
    const cards = [
      ['total-otr', 'fa-id-card', 'Total OTR Generated', data.totalOtrGenerated, 'Generated OTR records', 'blue'],
      ['otr-pending', 'fa-file-circle-exclamation', 'OTR Pending', data.otrPending, 'Awaiting OTR completion', 'amber'],
      ['exam-process', 'fa-clipboard-list', 'Exam Process', data.examProcess, 'Currently in exam process', 'navy'],
      ['pending-interview', 'fa-user-clock', 'Pending Interview', data.pendingInterviews.length, 'Interview needs scheduling', 'purple'],
      ['interview-scheduled', 'fa-calendar-check', 'Interview Scheduled', data.scheduledInterviews.length, 'Assigned / scheduled interviews', 'teal'],
      ['confirmed', 'fa-circle-check', 'Admission Confirmed', data.confirmed, 'Admission completed', 'green'],
      ['closed', 'fa-circle-xmark', 'Admission Closed', data.closed, 'Admission process closed', 'red']
    ];
    return `<section class="amsd-kpis" aria-label="AMS key performance indicators">${cards.map(card => `<button type="button" class="amsd-kpi ${this.activeKpi === card[0] ? 'active' : ''} tone-${card[5]}" data-amsd-kpi="${card[0]}"><span class="amsd-kpi-icon"><i class="fas ${card[1]}"></i></span><span class="amsd-kpi-copy"><small>${card[2]}</small><strong>${card[3]}</strong><em>${card[4]}</em></span><i class="fas fa-arrow-right amsd-kpi-arrow"></i></button>`).join('')}</section>`;
  },

  interviewOverview(data) {
    const items = [
      ['upcoming', 'Upcoming', data.upcoming.length, 'amber'],
      ['today', 'Today', data.todayInterviews.length, 'blue'],
      ['overdue', 'Overdue', data.overdue.length, 'red'],
      ['completed', 'Completed', data.completed.length, 'green'],
      ['waiting', 'Student Waiting List', data.waitingList.length, 'purple']
    ];
    const actualTotal = items.reduce((sum, item) => sum + item[2], 0);
    const denominator = Math.max(1, actualTotal);
    const segments = actualTotal
      ? items.map((item, index) => {
          const previous = items.slice(0, index).reduce((sum, entry) => sum + entry[2], 0);
          const start = (previous / denominator) * 100;
          const end = ((previous + item[2]) / denominator) * 100;
          return `var(--report-${item[3]}) ${start.toFixed(2)}% ${end.toFixed(2)}%`;
        }).join(', ')
      : 'var(--border-light) 0 100%';

    return `<div class="amsd-interview-report amsd-interview-report-single">
      <div class="amsd-interview-summary">
        <div class="amsd-report-donut" style="--donut:${segments}" aria-label="${actualTotal} interview records"><div><strong>${actualTotal}</strong><span>interview records</span></div></div>
        <div class="amsd-report-legend">${items.map(item => {
          const percent = Math.round((item[2] / denominator) * 100);
          return `<button type="button" data-amsd-interview="${item[0]}" title="${item[1]}: ${item[2]} (${percent}%)"><i class="tone-${item[3]}"></i><span>${item[1]}</span><strong>${item[2]}</strong><small>${percent}%</small></button>`;
        }).join('')}</div>
      </div>
    </div>`;
  },

  otrAnalytics(data) {
    const rows = data.otrDataset;
    const metrics = [
      ['Pending', rows.filter(item => item.status === 'Pending').length, 'amber'],
      ['Draft', rows.filter(item => item.status === 'Draft').length, 'purple'],
      ['Submitted', rows.filter(item => item.status === 'Submitted').length, 'green']
    ];
    const total = rows.length;
    const denominator = Math.max(1, total);

    return `<div class="amsd-otr-report">
      <div class="amsd-otr-flow">
        <article class="amsd-otr-total">
          <span class="tone-navy"><i class="fas fa-file-lines"></i></span>
          <small>Total OTR</small>
          <strong>${total}</strong>
          <em>Generated records</em>
        </article>
        <div class="amsd-otr-flow-arrow" aria-hidden="true"><i class="fas fa-arrow-right"></i></div>
        <div class="amsd-otr-statuses">${metrics.map(item => {
          const percent = Math.round((item[1] / denominator) * 100);
          return `<article class="amsd-otr-status" title="${item[0]}: ${item[1]} (${percent}%)">
            <div><span><i class="tone-${item[2]}"></i>${item[0]}</span><strong>${item[1]}</strong><small>${percent}%</small></div>
            <b><i class="tone-${item[2]}" style="width:${percent}%"></i></b>
          </article>`;
        }).join('')}</div>
      </div>
    </div>`;
  },

  courseModeBucket(student = {}) {
    const raw = String(student.mode || student.learningMode || student.modeOfLearning || '').trim().toLowerCase();
    if (raw === 'online' || raw.startsWith('online ')) return 'Online';
    if (raw === 'offline' || raw.startsWith('offline ')) return 'Offline';
    return 'Unmapped';
  },

  courseEnrollmentRows(data) {
    const grouped = new Map();
    data.students.forEach(student => {
      const course = String(student.course || 'Course not mapped');
      if (!grouped.has(course)) grouped.set(course, []);
      grouped.get(course).push(student);
    });
    return [...grouped.entries()].map(([course, students]) => {
      const total = students.length;
      const offline = students.filter(student => this.courseModeBucket(student) === 'Offline').length;
      const online = students.filter(student => this.courseModeBucket(student) === 'Online').length;
      return {
        course,
        students,
        total,
        offline,
        online,
        offlinePct: total ? Math.round((offline / total) * 100) : 0,
        onlinePct: total ? Math.round((online / total) * 100) : 0
      };
    }).sort((a, b) => b.total - a.total || a.course.localeCompare(b.course, undefined, { numeric: true }));
  },

  courseBatchDetails(students) {
    const groups = new Map();
    students.forEach(student => {
      const batch = String(student.batch || 'Batch not mapped');
      const mode = String(student.mode || student.learningMode || student.modeOfLearning || 'Mode not mapped');
      const key = `${batch}␟${mode}`;
      if (!groups.has(key)) groups.set(key, { batch, mode, count: 0 });
      groups.get(key).count += 1;
    });
    return [...groups.values()].sort((a, b) => b.count - a.count || a.batch.localeCompare(b.batch, undefined, { numeric: true }) || a.mode.localeCompare(b.mode));
  },

  courseAnalytics(data) {
    const courses = this.courseEnrollmentRows(data);
    const total = data.students.length;
    const offline = data.students.filter(student => this.courseModeBucket(student) === 'Offline').length;
    const online = data.students.filter(student => this.courseModeBucket(student) === 'Online').length;
    const denominator = Math.max(1, total);
    const offlinePct = Math.round((offline / denominator) * 100);
    const onlinePct = Math.round((online / denominator) * 100);
    const activeCourses = courses.filter(item => item.course && item.course !== 'Course not mapped').length;
    const iconSet = [
      ['fa-book-open', 'blue'],
      ['fa-shield-halved', 'green'],
      ['fa-certificate', 'amber'],
      ['fa-user-graduate', 'purple'],
      ['fa-graduation-cap', 'red']
    ];
    this.expandedCourses ||= new Set();

    const summary = [
      ['enrollments', 'fa-users', 'Total Enrollments', total, '100% of filtered students', 'blue', 100],
      ['offline', 'fa-building', 'Offline Students', offline, `${offlinePct}% of filtered students`, 'green', offlinePct],
      ['online', 'fa-wifi', 'Online Students', online, `${onlinePct}% of filtered students`, 'purple', onlinePct],
      ['courses', 'fa-graduation-cap', 'Total Courses', activeCourses, 'Active mapped courses', 'amber', null]
    ];

    return `<div class="amsd-course-enrollment-report">
      <div class="amsd-course-summary">${summary.map(item => {
        const clickable = item[0] !== 'courses';
        const mode = item[0] === 'online' ? 'Online' : item[0] === 'offline' ? 'Offline' : 'all';
        return `<article class="amsd-course-summary-card tone-${item[5]}">
          <span class="amsd-course-summary-icon"><i class="fas ${item[1]}"></i></span>
          <div class="amsd-course-summary-copy"><small>${item[2]}</small>${clickable ? `<button type="button" class="amsd-course-summary-value" data-amsd-course-list="${mode}" aria-label="View ${item[2]} students">${item[3]}</button>` : `<strong>${item[3]}</strong>`}<em>${item[4]}</em></div>
          ${item[6] !== null && item[0] !== 'enrollments' ? `<span class="amsd-course-ring" style="--pct:${item[6]}" aria-label="${item[6]} percent"><b>${item[6]}%</b></span>` : ''}
        </article>`;
      }).join('')}</div>

      <div class="amsd-course-section-head">
        <div><h3>Course-wise Enrollment</h3><span title="Counts use the currently filtered AMS student data"><i class="fas fa-circle-info"></i></span></div>
        <p><i class="fas fa-arrow-pointer"></i> Click any student count to open the filtered student list</p>
      </div>

      ${courses.length ? `<div class="amsd-course-table">
        <div class="amsd-course-table-head"><span>Course</span><span><b>Offline Students</b><b>Online Students</b></span><span>Total Students</span><span></span></div>
        <div class="amsd-course-table-body">${courses.map((item, index) => {
          const expanded = this.expandedCourses.has(item.course);
          const icon = iconSet[index % iconSet.length];
          const details = this.courseBatchDetails(item.students);
          return `<article class="amsd-course-row ${expanded ? 'is-expanded' : ''}">
            <div class="amsd-course-row-main">
              <div class="amsd-course-name"><span class="tone-${icon[1]}"><i class="fas ${icon[0]}"></i></span><strong>${this.escape(item.course)}</strong></div>
              <div class="amsd-course-split">
                <div class="amsd-course-split-values">
                  <button type="button" data-amsd-course-list="Offline" data-course="${this.escape(item.course)}"><strong>${item.offline}</strong><small>${item.offlinePct}%</small></button>
                  <button type="button" data-amsd-course-list="Online" data-course="${this.escape(item.course)}"><strong>${item.online}</strong><small>${item.onlinePct}%</small></button>
                </div>
                <div class="amsd-course-split-bar" title="Offline ${item.offlinePct}% · Online ${item.onlinePct}%"><span class="offline" style="width:${item.offlinePct}%"></span><span class="online" style="width:${item.onlinePct}%"></span></div>
                <div class="amsd-course-split-legend"><span><i class="offline"></i>Offline ${item.offlinePct}%</span><span><i class="online"></i>Online ${item.onlinePct}%</span></div>
              </div>
              <button type="button" class="amsd-course-total" data-amsd-course-list="all" data-course="${this.escape(item.course)}"><strong>${item.total}</strong><small>Total Students</small></button>
              <button type="button" class="amsd-course-toggle" data-amsd-course-toggle="${this.escape(item.course)}" aria-expanded="${expanded}" aria-label="${expanded ? 'Collapse' : 'Expand'} ${this.escape(item.course)} course details"><i class="fas fa-chevron-${expanded ? 'up' : 'down'}"></i></button>
            </div>
            <div class="amsd-course-expanded" ${expanded ? '' : 'hidden'}>
              <div class="amsd-course-expanded-head"><span>Batch</span><span>Learning Mode</span><span>Student Count</span></div>
              ${details.map(detail => `<div class="amsd-course-expanded-row"><strong>${this.escape(detail.batch)}</strong><span>${this.escape(detail.mode)}</span><b>${detail.count}</b></div>`).join('') || '<div class="amsd-inline-empty">No batch or learning-mode mapping is available for this course.</div>'}
            </div>
          </article>`;
        }).join('')}</div>
      </div>` : this.empty('fa-graduation-cap', 'No course enrollment data available', 'Course enrollment rows will appear when AMS student records are available.')}

      <p class="amsd-course-footnote"><i class="fas fa-circle-info"></i> Enrollment data reflects the current AMS Dashboard course and date filters.</p>
    </div>`;
  },

  toggleCourseAnalytics(course) {
    this.expandedCourses ||= new Set();
    if (this.expandedCourses.has(course)) this.expandedCourses.delete(course);
    else this.expandedCourses.add(course);
    this.render();
  },

  openCourseStudentList(mode = 'all', course = '') {
    const module = window.AMSStudentList;
    window.AMSApp?.showScreen?.('ams-students');
    if (!module) return;
    const targetCourse = course || (this.courseFilter !== 'all' ? this.courseFilter : 'all');
    module.state.stage = 'all';
    module.state.stageStatus = 'all';
    module.state.page = 1;
    module.state.filtersVisible = true;
    module.selected?.clear?.();
    Object.assign(module.state.filters, {
      search: '',
      course: targetCourse,
      mode: mode === 'all' ? 'all' : mode,
      gender: 'all',
      enquiry: '',
      otr: '',
      owner: 'all',
      dateFrom: this.dateFrom || '',
      dateTo: this.dateTo || ''
    });
    module.render?.();
  },

  rotatingPanel(data) {
    const view = this.rotatorView(data);
    return `<section class="amsd-panel amsd-report-rotator" id="amsd-rotator-panel"><header><div><h2 id="amsd-rotator-title">${view.title}</h2><p id="amsd-rotator-subtitle">${view.subtitle}</p></div><div class="amsd-report-header-actions"><button type="button" class="amsd-report-export" id="amsd-rotator-export" data-amsd-export="${view.key}" title="Export ${view.title}" aria-label="Export ${view.title}"><i class="fas fa-download"></i></button><div class="amsd-rotator-controls" aria-label="Dashboard report navigation"><button type="button" data-amsd-rotate="prev" title="Previous report" aria-label="Previous report"><i class="fas fa-chevron-left"></i></button><button type="button" data-amsd-rotate="next" title="Next report" aria-label="Next report"><i class="fas fa-chevron-right"></i></button></div></div></header><div class="amsd-panel-body amsd-rotator-body" id="amsd-rotator-body" aria-live="polite">${view.content}</div></section>`;
  },

  rotatorView(data) {
    const key = this.rotationOrder[this.rotatorIndex] || 'activity';
    if (key === 'calendar') return { key: 'calendar', title: 'Operational Calendar', subtitle: 'Interviews and admission deadlines for the next seven days', content: this.calendar(data) };
    return { key: 'activity', title: 'Recent Activity', subtitle: 'Latest timestamped activity available in AMS', content: this.recentActivity(data) };
  },

  updateRotator() {
    const panel = document.getElementById('amsd-rotator-panel');
    if (!panel) return;
    const view = this.rotatorView(this.data());
    const title = document.getElementById('amsd-rotator-title');
    const subtitle = document.getElementById('amsd-rotator-subtitle');
    const body = document.getElementById('amsd-rotator-body');
    const exporter = document.getElementById('amsd-rotator-export');
    if (title) title.textContent = view.title;
    if (subtitle) subtitle.textContent = view.subtitle;
    if (exporter) {
      exporter.dataset.amsdExport = view.key;
      exporter.title = `Export ${view.title}`;
      exporter.setAttribute('aria-label', `Export ${view.title}`);
    }
    if (body) {
      body.classList.remove('is-switching');
      void body.offsetWidth;
      body.classList.add('is-switching');
      body.innerHTML = view.content;
    }
  },

  advanceRotator(delta, manual = false) {
    this.rotatorIndex = (this.rotatorIndex + delta + this.rotationOrder.length) % this.rotationOrder.length;
    this.updateRotator();
    if (manual) this.startRotation();
  },

  startRotation() {
    if (this.rotationTimer) window.clearInterval(this.rotationTimer);
    this.rotationTimer = window.setInterval(() => {
      if (window.AMSApp?.currentScreen !== 'ams-dashboard' || document.visibilityState === 'hidden') return;
      this.advanceRotator(1, false);
    }, 2000);
  },

  activityRows(data) {
    return [
      ...data.otr.map(item => ({
        date: item.updatedAt || item.createdAt,
        student: item.personal?.fullName || this.findStudentForRecord(item, data.students)?.name || 'AMS record',
        action: 'OTR submitted',
        user: item.owner || 'AMS system',
        course: item.__course || this.recordCourse(item, data.students),
        type: 'OTR'
      })),
      ...data.interviews.map(item => ({
        date: item.updatedAt || item.submittedDate || item.datetime,
        student: item.name || 'AMS record',
        action: `Interview ${String(item.status || 'scheduled').toLowerCase()}`,
        user: window.AMSInterviews?.interviewerById?.(item.interviewerId)?.name || 'Admission Team',
        course: item.course || 'Course not mapped',
        type: 'Interview'
      })),
      ...data.students.filter(item => ['admission_confirmed', 'application_rejected', 'declined_by_student'].includes(item.statusKey)).map(item => ({
        date: item.updatedAt || item.createdAt,
        student: item.name || 'AMS record',
        action: item.statusKey === 'admission_confirmed' ? 'Admission confirmed' : 'Admission closed',
        user: item.owner || 'Admission Team',
        course: item.course || 'Course not mapped',
        type: 'Admission'
      }))
    ].filter(item => item.date && !Number.isNaN(new Date(item.date).getTime())).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  recentActivity(data) {
    const activities = this.activityRows(data).slice(0, 8);
    return activities.length ? `<div class="amsd-activity-report"><div class="amsd-activity-head"><span>Student / Course</span><span>Activity</span><span>Performed by</span><span>Date / Time</span></div>${activities.map(item => `<div class="amsd-activity-row"><div><strong>${this.escape(item.student)}</strong><small>${this.escape(item.course)}</small></div><div><span class="amsd-activity-type">${this.escape(item.type)}</span><strong>${this.escape(item.action)}</strong></div><div><span>${this.escape(item.user)}</span></div><time>${this.formatShortDate(item.date)}<small>${this.formatTime(item.date)}</small></time></div>`).join('')}</div>` : this.empty('fa-clock-rotate-left', 'No timestamped activity available', 'Activity appears when AMS records are created or updated.');
  },

  calendarEvents(data) {
    const interviewEvents = data.interviews
      .filter(item => String(item.datetime).slice(0, 10) >= data.today && String(item.datetime).slice(0, 10) <= data.weekEnd && !['Cancelled', 'Canceled'].includes(item.status))
      .map(item => ({ type: 'Interview', date: String(item.datetime).slice(0, 10), datetime: item.datetime, id: item.id, student: item.name, course: item.course || 'Course not mapped', detail: item.status || 'Scheduled' }));
    const admissionEvents = data.students
      .map(item => ({ item, date: this.dateKey(new Date(item.dueDate || item.nextActionDate || '')) }))
      .filter(event => event.date >= data.today && event.date <= data.weekEnd)
      .map(event => ({ type: 'Admission milestone', date: event.date, datetime: `${event.date}T23:59:00`, id: event.item.key || event.item.admissionNo, student: event.item.name, course: event.item.course || 'Course not mapped', detail: event.item.nextStep || event.item.purpose || 'Admission deadline' }));
    return [...interviewEvents, ...admissionEvents].sort((a, b) => String(a.datetime).localeCompare(String(b.datetime)));
  },

  calendar(data) {
    const days = Array.from({ length: 7 }, (_, index) => this.addDays(data.now, index));
    const events = this.calendarEvents(data);
    return `<div class="amsd-calendar-report"><div class="amsd-calendar-strip">${days.map(day => {
      const key = this.dateKey(day);
      const count = events.filter(item => item.date === key).length;
      return `<button type="button" data-amsd-calendar-date="${key}" class="${key === data.today ? 'today' : ''}"><small>${day.toLocaleDateString('en-IN', { weekday: 'short' })}</small><strong>${day.getDate()}</strong><span>${count}</span></button>`;
    }).join('')}</div><div class="amsd-calendar-table"><div class="amsd-calendar-table-head"><span>Date / Time</span><span>Student / Course</span><span>Type</span><span>Status / Milestone</span></div>${events.slice(0, 8).map(item => `<button type="button" class="amsd-calendar-event-row" ${item.type === 'Interview' ? `data-amsd-interview-id="${this.escape(item.id)}"` : `data-amsd-student="${this.escape(item.id)}"`}><time>${this.formatShortDate(item.datetime)}<small>${item.type === 'Interview' ? this.formatTime(item.datetime) : 'Deadline'}</small></time><span><strong>${this.escape(item.student)}</strong><small>${this.escape(item.course)}</small></span><span>${this.escape(item.type)}</span><strong>${this.escape(item.detail)}</strong></button>`).join('') || '<div class="amsd-inline-empty">No upcoming operational events.</div>'}</div></div>`;
  },

  reportActions(exportKey, extra = '') {
    return `<div class="amsd-report-header-actions">${extra}<button type="button" class="amsd-report-export" data-amsd-export="${exportKey}" title="Export report data" aria-label="Export report data"><i class="fas fa-download"></i></button></div>`;
  },

  exportReport(key) {
    const data = this.data();
    const filename = `ams-${key}-report.csv`;
    let headers = [];
    let rows = [];

    if (key === 'interviews') {
      headers = ['Category', 'Student', 'OTR ID', 'Course', 'Interview Date', 'Interview Status', 'Interviewer'];
      const categories = [
        ['Upcoming', data.upcoming],
        ['Today', data.todayInterviews],
        ['Overdue', data.overdue],
        ['Completed', data.completed],
        ['Student Waiting List', data.waitingList]
      ];
      categories.forEach(([category, records]) => records.forEach(item => rows.push([
        category,
        item.name || '',
        item.otrNo || item.otr?.otrNo || '',
        item.course || '',
        item.datetime || '',
        item.status || '',
        window.AMSInterviews?.interviewerById?.(item.interviewerId)?.name || ''
      ])));
    } else if (key === 'otr') {
      headers = ['OTR ID', 'Student', 'Course', 'OTR Status'];
      rows = data.otrDataset.map(item => [
        item.key,
        item.student?.name || item.record?.personal?.fullName || '',
        item.course,
        item.status
      ]);
    } else if (key === 'courses') {
      const courseRows = this.courseEnrollmentRows(data);
      headers = ['Course', 'Offline Students', 'Online Students', 'Total Students', 'Offline Percentage', 'Online Percentage'];
      rows = courseRows.map(item => [item.course, item.offline, item.online, item.total, `${item.offlinePct}%`, `${item.onlinePct}%`]);
    } else if (key === 'activity') {
      headers = ['Date / Time', 'Student', 'Course', 'Activity Type', 'Activity', 'Performed By'];
      rows = this.activityRows(data).map(item => [item.date, item.student, item.course, item.type, item.action, item.user]);
    } else if (key === 'calendar') {
      headers = ['Date / Time', 'Student', 'Course', 'Event Type', 'Status / Milestone'];
      rows = this.calendarEvents(data).map(item => [item.datetime, item.student, item.course, item.type, item.detail]);
    } else return;

    const filterContext = [
      ['Dashboard Course', this.courseFilter === 'all' ? 'All Courses' : this.courseFilter],
      ['From Date', this.dateFrom || 'All dates'],
      ['To Date', this.dateTo || 'All dates']
    ];
    const csv = [
      ['Report Filters'],
      ...filterContext,
      [],
      headers,
      ...rows
    ].map(row => row.map(value => this.csvCell(value)).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  },

  csvCell(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  },

  ensureDateDialogStyles() {
    if (document.getElementById('amsd-date-dialog-reference-style')) return;
    const style = document.createElement('style');
    style.id = 'amsd-date-dialog-reference-style';
    style.textContent = `
      #amsd-date-overlay.amsd-date-overlay{position:fixed!important;inset:0!important;z-index:2147483000!important;display:grid!important;place-items:center!important;padding:24px!important;background:rgba(38,54,73,.50)!important;backdrop-filter:blur(4px)!important;-webkit-backdrop-filter:blur(4px)!important}
      #amsd-date-overlay .amsd-date-card{width:min(450px,calc(100vw - 32px))!important;border:0!important;border-radius:28px!important;background:#f8fafc!important;box-shadow:0 28px 80px rgba(15,23,42,.28)!important;padding:28px 30px 30px!important;color:#162033!important}
      body.dark #amsd-date-overlay .amsd-date-card{background:#111d2e!important;color:#f8fafc!important}
      #amsd-date-overlay .amsd-date-head{display:flex!important;align-items:center!important;gap:12px!important;padding:0 0 24px!important;border:0!important}
      #amsd-date-overlay .amsd-date-head>i{font-size:18px!important;color:#0e4775!important}
      #amsd-date-overlay .amsd-date-head h2{margin:0!important;font-size:20px!important;line-height:1.2!important;font-weight:800!important;letter-spacing:-.02em!important;color:inherit!important}
      #amsd-date-overlay .amsd-date-fields{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important;padding:0!important}
      #amsd-date-overlay .amsd-date-fields label{display:grid!important;gap:8px!important}
      #amsd-date-overlay .amsd-date-fields label span{font-size:13px!important;font-weight:800!important;letter-spacing:.02em!important;text-transform:uppercase!important;color:#64748b!important}
      #amsd-date-overlay .amsd-date-fields input{width:100%!important;min-height:44px!important;padding:0 14px!important;border:1px solid #d8dee8!important;border-radius:18px!important;background:#fff!important;color:#263044!important;font-size:14px!important}
      #amsd-date-overlay .amsd-date-quick{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:8px!important;margin:20px 0!important}
      #amsd-date-overlay .amsd-date-quick button{min-height:29px!important;padding:5px 13px!important;border:1px solid #d9e0e9!important;border-radius:999px!important;background:transparent!important;color:#172033!important;font-size:13px!important;font-weight:500!important;line-height:1!important}
      #amsd-date-overlay .amsd-date-quick button.active{border-color:#0f4674!important;background:#0f4674!important;color:#fff!important;font-weight:700!important}
      #amsd-date-overlay .amsd-date-actions{display:flex!important;justify-content:flex-end!important;gap:10px!important;padding:0!important;margin-top:4px!important}
      #amsd-date-overlay .amsd-date-actions button{min-height:42px!important;padding:9px 16px!important;border-radius:18px!important;font-size:13px!important;font-weight:700!important}
      #amsd-date-overlay .amsd-date-cancel{border:1px solid #d8dee8!important;background:#fff!important;color:#173052!important}
      #amsd-date-overlay .amsd-date-apply{border:1px solid #135080!important;background:#135080!important;color:#fff!important;padding-inline:18px!important}
      #amsd-date-overlay .amsd-date-apply i{margin-right:6px!important}
      @media(max-width:560px){#amsd-date-overlay.amsd-date-overlay{padding:14px!important}#amsd-date-overlay .amsd-date-card{padding:24px 20px!important;border-radius:24px!important}#amsd-date-overlay .amsd-date-fields{grid-template-columns:1fr!important}#amsd-date-overlay .amsd-date-actions{justify-content:stretch!important}#amsd-date-overlay .amsd-date-actions button{flex:1!important}}
    `;
    document.head.appendChild(style);
  },

  showDateDialog() {
    document.getElementById('amsd-date-overlay')?.remove();
    this.ensureDateDialogStyles();
    const root = document.getElementById('ams-dashboard-root');
    if (!root) return;
    const overlay = document.createElement('div');
    overlay.id = 'amsd-date-overlay';
    overlay.className = 'amsd-date-overlay';
    const today = this.dateKey(new Date());
    const initialFrom = this.dateFrom || this.dateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const initialTo = this.dateTo || today;
    overlay.innerHTML = `<div class="amsd-date-card" role="dialog" aria-modal="true" aria-labelledby="amsd-date-title">
      <div class="amsd-date-head"><i class="fas fa-calendar-alt" aria-hidden="true"></i><h2 id="amsd-date-title">Custom Date Range</h2></div>
      <div class="amsd-date-fields"><label><span>From Date</span><input id="amsd-date-from" type="date" value="${initialFrom}"></label><label><span>To Date</span><input id="amsd-date-to" type="date" value="${initialTo}"></label></div>
      <div class="amsd-date-quick" aria-label="Quick date ranges"><button type="button" data-amsd-range="month">This Month</button><button type="button" data-amsd-range="week">This Week</button><button type="button" data-amsd-range="today">Today</button><button type="button" data-amsd-range="quarter">Quarter</button></div>
      <div class="amsd-date-actions"><button type="button" class="amsd-date-cancel" data-amsd-action="date-close">Cancel</button><button type="button" class="amsd-date-apply" data-amsd-action="date-apply"><i class="fas fa-check"></i>Apply Filter</button></div>
    </div>`;
    root.appendChild(overlay);
    this.syncDateQuickState();
  },

  quickRange(range) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from = new Date(today);
    let to = new Date(today);
    if (range === 'month') from = new Date(today.getFullYear(), today.getMonth(), 1);
    else if (range === 'week') {
      const day = today.getDay();
      from = this.addDays(today, day === 0 ? -6 : 1 - day);
    } else if (range === 'quarter') from = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const fromInput = document.getElementById('amsd-date-from');
    const toInput = document.getElementById('amsd-date-to');
    if (fromInput) fromInput.value = this.dateKey(from);
    if (toInput) toInput.value = this.dateKey(to);
    this.syncDateQuickState(range);
  },

  syncDateQuickState(forced = '') {
    const overlay = document.getElementById('amsd-date-overlay');
    if (!overlay) return;
    const from = document.getElementById('amsd-date-from')?.value || '';
    const to = document.getElementById('amsd-date-to')?.value || '';
    let active = forced;
    if (!active) {
      const now = new Date();
      const today = this.dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      const monthStart = this.dateKey(new Date(now.getFullYear(), now.getMonth(), 1));
      const day = now.getDay();
      const weekStart = this.dateKey(this.addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), day === 0 ? -6 : 1 - day));
      const quarterStart = this.dateKey(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1));
      if (from === today && to === today) active = 'today';
      else if (from === weekStart && to === today) active = 'week';
      else if (from === monthStart && to === today) active = 'month';
      else if (from === quarterStart && to === today) active = 'quarter';
    }
    overlay.querySelectorAll('[data-amsd-range]').forEach(button => button.classList.toggle('active', button.dataset.amsdRange === active));
  },

  handleChange(event) {
    if (event.target.id === 'amsd-course-filter') {
      this.courseFilter = event.target.value || 'all';
      this.render();
      return;
    }
    if (event.target.id === 'amsd-date-from' || event.target.id === 'amsd-date-to') this.syncDateQuickState();
  },

  handleClick(event) {
    const exportKey = event.target.closest('[data-amsd-export]')?.dataset.amsdExport;
    if (exportKey) return this.exportReport(exportKey);
    const range = event.target.closest('[data-amsd-range]')?.dataset.amsdRange;
    if (range) return this.quickRange(range);
    const rotate = event.target.closest('[data-amsd-rotate]')?.dataset.amsdRotate;
    if (rotate) return this.advanceRotator(rotate === 'prev' ? -1 : 1, true);
    const action = event.target.closest('[data-amsd-action]')?.dataset.amsdAction;
    if (action === 'date-filter') return this.showDateDialog();
    if (action === 'date-close') return document.getElementById('amsd-date-overlay')?.remove();
    if (action === 'date-apply') {
      let from = document.getElementById('amsd-date-from')?.value || '';
      let to = document.getElementById('amsd-date-to')?.value || '';
      if (from && to && from > to) [from, to] = [to, from];
      this.dateFrom = from;
      this.dateTo = to;
      document.getElementById('amsd-date-overlay')?.remove();
      return this.render();
    }
    const courseToggle = event.target.closest('[data-amsd-course-toggle]')?.dataset.amsdCourseToggle;
    if (courseToggle) return this.toggleCourseAnalytics(courseToggle);
    const courseList = event.target.closest('[data-amsd-course-list]');
    if (courseList) return this.openCourseStudentList(courseList.dataset.amsdCourseList || 'all', courseList.dataset.course || '');
    const kpi = event.target.closest('[data-amsd-kpi]')?.dataset.amsdKpi;
    if (kpi) { this.activeKpi = kpi; return this.openKpi(kpi); }
    const interviewFilter = event.target.closest('[data-amsd-interview]')?.dataset.amsdInterview;
    if (interviewFilter) return this.openInterviews(interviewFilter);
    const interviewId = event.target.closest('[data-amsd-interview-id]')?.dataset.amsdInterviewId;
    if (interviewId) return this.openInterview(interviewId);
    const date = event.target.closest('[data-amsd-calendar-date]')?.dataset.amsdCalendarDate;
    if (date) return this.openInterviewCalendar(date);
    const student = event.target.closest('[data-amsd-student]')?.dataset.amsdStudent;
    if (student) return this.openStudent(student);
    const target = event.target.closest('[data-amsd-go]')?.dataset.amsdGo;
    if (target) this.navigate(target);
  },

  openKpi(key) {
    if (key === 'pending-interview') return this.openInterviews('pending');
    if (key === 'interview-scheduled') return this.openInterviews('scheduled');
    window.AMSApp?.showScreen?.('ams-students');
    if (!window.AMSStudentList) return;
    if (key === 'otr-pending') { window.AMSStudentList.setStage?.('otr'); window.AMSStudentList.state.stageStatus = 'Pending'; return window.AMSStudentList.render?.(); }
    if (key === 'exam-process') return window.AMSStudentList.setStage?.('exam');
    if (key === 'confirmed') return window.AMSStudentList.setStage?.('confirmed');
    if (key === 'closed') return window.AMSStudentList.setStage?.('closed');
    return window.AMSStudentList.setStage?.('all');
  },

  navigate(target) {
    if (target === 'interviews') return this.openInterviews('all');
    if (target === 'students') return window.AMSApp?.showScreen?.('ams-students');
  },

  openInterviews(filter = 'all') {
    window.AMSApp?.showScreen?.('ams-interviews');
    if (!window.AMSInterviews) return;
    const module = window.AMSInterviews;
    Object.assign(module.state.filters, { search: '', from: '', to: '', course: 'all', interviewer: 'all', structure: 'all', status: 'all', mode: 'all' });
    module.state.view = 'list';
    module.state.activeKpi = 'pending';
    if (filter === 'pending') module.state.activeKpi = 'pending';
    else if (filter === 'scheduled') module.state.activeKpi = 'scheduled';
    else if (filter === 'completed' || filter === 'waiting') module.state.activeKpi = 'completed';
    else if (filter === 'today') { module.state.activeKpi = 'scheduled'; const today = this.dateKey(new Date()); module.state.filters.from = today; module.state.filters.to = today; }
    else if (filter === 'upcoming') { module.state.activeKpi = 'scheduled'; module.state.filters.from = this.dateKey(this.addDays(new Date(), 1)); module.state.filters.to = this.dateKey(this.addDays(new Date(), 7)); }
    else if (filter === 'overdue') { module.state.activeKpi = 'scheduled'; module.state.filters.to = this.dateKey(this.addDays(new Date(), -1)); }
    module.render();
  },

  openInterviewCalendar(date) {
    if (window.AMSInterviews) {
      window.AMSInterviews.state.view = 'calendar';
      window.AMSInterviews.state.calendarView = 'day';
      window.AMSInterviews.state.selectedDate = date;
      window.AMSInterviews.state.calendarDate = date;
    }
    window.AMSApp?.showScreen?.('ams-interviews');
    window.AMSInterviews?.render?.();
  },

  openInterview(id) {
    window.AMSApp?.showScreen?.('ams-interviews');
    window.AMSInterviews?.openInterviewDetail?.(id) || window.AMSInterviews?.openCandidateProfile?.(id);
  },

  openStudent(key) {
    window.AMSApp?.showScreen?.('ams-students');
    const row = window.AMSStudentList?.rows?.find(item => String(item.key || item.admissionNo) === String(key));
    if (row) window.AMSStudentList?.openProfile?.(row.key);
  },

  panel(title, subtitle, content, className = '', action = '') {
    return `<section class="amsd-panel ${className}"><header><div><h2>${title}</h2><p>${subtitle}</p></div>${action}</header><div class="amsd-panel-body">${content}</div></section>`;
  },

  linkButton(label, target) {
    return `<button type="button" class="amsd-panel-link" data-amsd-go="${target}">${label} <i class="fas fa-arrow-right"></i></button>`;
  },

  barRows(groups, total, emptyText) {
    const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 7);
    if (!entries.length) return `<div class="amsd-inline-empty">${emptyText}</div>`;
    const max = Math.max(1, ...entries.map(item => item[1]));
    return `<div class="amsd-bars">${entries.map(([label, value]) => `<div><span title="${this.escape(label)}">${this.escape(label)}</span><i><em style="width:${Math.round((value / max) * 100)}%"></em></i><b>${value}</b><small>${total ? Math.round((value / total) * 100) : 0}%</small></div>`).join('')}</div>`;
  },

  groupBy(rows, getKey) {
    return rows.reduce((result, item) => {
      const key = getKey(item) || 'Not mapped';
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
  },

  empty(icon, title, text) {
    return `<div class="amsd-empty"><i class="fas ${icon}"></i><strong>${title}</strong><span>${text}</span></div>`;
  },

  dateKey(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },
  addDays(date, days) { const result = new Date(date); result.setDate(result.getDate() + days); return result; },
  formatShortDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); },
  formatTime(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); },
  escape(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
};

window.AMSDashboard = AMSDashboard;
