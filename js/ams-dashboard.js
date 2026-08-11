// ============================================================
// AMS DASHBOARD - Focused operational overview using AMS data only
// ============================================================

const AMSDashboard = {
  initialized: false,
  activeKpi: '',
  courseFilter: 'all',
  dateFrom: '',
  dateTo: '',
  otrCourseFilter: 'all',
  rotatorIndex: 0,
  rotationTimer: null,
  rotationOrder: ['timeline', 'activity', 'calendar'],

  init() {
    const root = document.getElementById('ams-dashboard-root');
    if (!root || this.initialized) return;
    this.initialized = true;
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

  normalizeEmail(value = '') {
    return String(value).trim().toLowerCase();
  },

  normalizePhone(value = '') {
    return String(value).replace(/\D/g, '');
  },

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
        const matchedStudent = this.findStudentForRecord(record, [student]);
        return Boolean(matchedStudent);
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
      interview.waitingList,
      interview.result,
      interview.outcome,
      interview.decision,
      interview.evaluation?.result,
      interview.evaluation?.overallResult,
      student?.waitingList,
      student?.subStatus,
      student?.stageStatus,
      student?.nextStep,
      student?.purpose
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

    const documents = students.reduce((result, student) => {
      const verified = Number(student.verifiedDocuments ?? this.documentRatio(student.documents)[0]);
      const total = Number(student.totalDocuments ?? this.documentRatio(student.documents)[1]);
      result.verified += verified;
      result.total += total;
      if (verified < total) result.pendingStudents += 1;
      if (verified === 0) result.missingStudents += 1;
      return result;
    }, { verified: 0, total: 0, pendingStudents: 0, missingStudents: 0 });

    const otrDataset = this.buildOtrDataset(students, otr);
    const statusCount = key => students.filter(item => item.statusKey === key || item.stageKey === key).length;
    const confirmed = statusCount('admission_confirmed');
    const closed = statusCount('application_rejected') + statusCount('declined_by_student');
    const examProcess = students.filter(item => item.stageKey === 'exam' || /^exam_/.test(String(item.statusKey || ''))).length;

    return {
      students,
      otr,
      interviews,
      availableCourses,
      now,
      today,
      weekEnd,
      todayInterviews,
      upcoming,
      overdue,
      completed,
      waitingList,
      pendingInterviews,
      scheduledInterviews,
      documents,
      otrDataset,
      totalOtrGenerated: otrDataset.length,
      otrPending: otrDataset.filter(item => item.status === 'Pending').length,
      examProcess,
      confirmed,
      closed,
      awaitingInterview: students.filter(item => item.stageKey === 'interview').length,
      awaitingApproval: students.filter(item => ['otr_submitted', 'course_selection', 'exam_submitted'].includes(item.statusKey)).length,
      awaitingFee: statusCount('fees_pending')
    };
  },

  render() {
    const root = document.getElementById('ams-dashboard-root');
    if (!root) return;
    const data = this.data();
    root.innerHTML = `
      ${this.header(data)}
      ${this.kpis(data)}
      <div class="amsd-layout amsd-focused-layout">
        ${this.panel('Interview Overview', 'Upcoming, current, overdue, completed, and post-interview waiting records', this.interviewOverview(data), 'span-2 amsd-interview-panel', this.linkButton('Open Interviews', 'interviews'))}
        ${this.panel('OTR Form Analytics', 'OTR submission counts with course-level filtering', this.otrAnalytics(data), 'amsd-otr-panel')}
        ${this.panel('Admission Status', 'Current approval, interview, fee, and outcome queues', this.admissionStatus(data), 'amsd-admission-panel')}
        ${this.panel('Course Analytics', 'Admission volume by course, batch, and learning mode', this.courseAnalytics(data), 'span-2 amsd-course-panel')}
        ${this.rotatingPanel(data)}
        ${this.panel('Notifications', 'Urgent operational signals from current AMS records', this.notifications(data), 'amsd-notifications-panel')}
      </div>
    `;
  },

  header(data) {
    const options = ['<option value="all">All Courses</option>']
      .concat(data.availableCourses.map(course => `<option value="${this.escape(course)}" ${this.courseFilter === course ? 'selected' : ''}>${this.escape(course)}</option>`))
      .join('');
    return `
      <header class="dashboard-header dashboard-hero-header amsd-lms-header">
        <div class="dashboard-title-wrap">
          <div class="section-eyebrow">Admission Management System</div>
          <h1>Admission Operations <span>Dashboard</span></h1>
          <div class="dashboard-welcome">One live view of OTR, exams, interviews, course movement, and admission outcomes.</div>
        </div>
        <div class="dashboard-controls">
          <select class="chart-filter-select" id="amsd-course-filter" aria-label="Filter AMS Dashboard by course">${options}</select>
          <button class="date-filter-btn" type="button" data-amsd-action="date-filter" title="${this.dateFrom || this.dateTo ? `${this.dateFrom || 'Start'} to ${this.dateTo || 'Today'}` : 'Custom Date'}"><i class="fas fa-calendar-alt"></i> Custom Date</button>
        </div>
      </header>
    `;
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
      ['upcoming', 'Upcoming', data.upcoming.length, 'fa-clock', 'amber'],
      ['today', 'Today', data.todayInterviews.length, 'fa-calendar-day', 'blue'],
      ['overdue', 'Overdue', data.overdue.length, 'fa-triangle-exclamation', 'red'],
      ['completed', 'Completed', data.completed.length, 'fa-circle-check', 'green'],
      ['waiting', 'Student Waiting List', data.waitingList.length, 'fa-list-check', 'purple']
    ];
    return `<div class="amsd-stat-grid amsd-interview-grid">${items.map(item => `<button type="button" data-amsd-interview="${item[0]}" class="amsd-mini-stat tone-${item[4]}"><i class="fas ${item[3]}"></i><span><small>${item[1]}</small><strong>${item[2]}</strong></span></button>`).join('')}</div>`;
  },

  otrAnalytics(data) {
    const selected = this.otrCourseFilter;
    const rows = data.otrDataset.filter(item => selected === 'all' || item.course === selected);
    const items = [
      ['All', rows.length],
      ['Pending', rows.filter(item => item.status === 'Pending').length],
      ['Draft', rows.filter(item => item.status === 'Draft').length],
      ['Submitted', rows.filter(item => item.status === 'Submitted').length]
    ];
    const available = this.courseFilter === 'all' ? data.availableCourses : data.availableCourses.filter(course => course === this.courseFilter);
    const options = ['<option value="all">All Courses</option>']
      .concat(available.map(course => `<option value="${this.escape(course)}" ${selected === course ? 'selected' : ''}>${this.escape(course)}</option>`))
      .join('');
    return `
      <div class="amsd-otr-toolbar"><select class="chart-filter-select" id="amsd-otr-course-filter" aria-label="Filter OTR analytics by course">${options}</select></div>
      <div class="amsd-segment-list amsd-otr-counts">${items.map(item => `<span><small>${item[0]}</small><strong>${item[1]}</strong></span>`).join('')}</div>
    `;
  },

  admissionStatus(data) {
    const items = [
      ['Interview Stage', data.awaitingInterview, 'interviews'],
      ['Course / Exam Review', data.awaitingApproval, 'students'],
      ['Fees Pending', data.awaitingFee, 'students'],
      ['Admission Confirmed', data.confirmed, 'students'],
      ['Admission Closed', data.closed, 'students']
    ];
    const max = Math.max(1, ...items.map(item => item[1]));
    return `<div class="amsd-horizontal-chart">${items.map(item => `<button type="button" data-amsd-go="${item[2]}"><span>${item[0]}</span><i><em style="width:${Math.round((item[1] / max) * 100)}%"></em></i><b>${item[1]}</b></button>`).join('')}</div>`;
  },

  courseAnalytics(data) {
    const courses = this.groupBy(data.students, item => item.course || 'Course not mapped');
    const batches = this.groupBy(data.students, item => item.batch || 'Batch not mapped');
    const modes = this.groupBy(data.interviews, item => item.learningMode || item.mode || 'Mode not mapped');
    return `<div class="amsd-analytics-columns"><div><div class="amsd-subhead"><strong>Admissions per course</strong><span>${Object.keys(courses).length} courses</span></div>${this.barRows(courses, data.students.length, 'No course mappings available.')}</div><div><div class="amsd-subhead"><strong>Admissions per batch</strong><span>${Object.keys(batches).length} batches</span></div>${this.barRows(batches, data.students.length, 'No batch mappings available.')}</div><div><div class="amsd-subhead"><strong>Learning mode</strong><span>Mapped interviews</span></div>${this.barRows(modes, data.interviews.length, 'No learning modes mapped.')}</div></div><div class="amsd-capacity-note"><i class="fas fa-circle-info"></i><span><strong>Course occupancy and remaining capacity</strong><small>Seat capacity is not configured in the stored AMS course or batch records. Counts remain live and use existing AMS mappings.</small></span></div>`;
  },

  rotatingPanel(data) {
    const view = this.rotatorView(data);
    return `
      <section class="amsd-panel span-2 amsd-rotator-panel" id="amsd-rotator-panel">
        <header>
          <div><h2 id="amsd-rotator-title">${view.title}</h2><p id="amsd-rotator-subtitle">${view.subtitle}</p></div>
          <div class="amsd-rotator-controls" aria-label="Dashboard activity navigation">
            <button type="button" data-amsd-rotate="prev" title="Previous view" aria-label="Previous view"><i class="fas fa-chevron-left"></i></button>
            <button type="button" data-amsd-rotate="next" title="Next view" aria-label="Next view"><i class="fas fa-chevron-right"></i></button>
          </div>
        </header>
        <div class="amsd-panel-body amsd-rotator-body" id="amsd-rotator-body" aria-live="polite">${view.content}</div>
      </section>
    `;
  },

  rotatorView(data) {
    const key = this.rotationOrder[this.rotatorIndex] || 'timeline';
    if (key === 'activity') {
      return { title: 'Recent Activity', subtitle: 'Latest timestamped activity available in AMS', content: this.recentActivity(data) };
    }
    if (key === 'calendar') {
      return { title: 'Operational Calendar', subtitle: 'Interviews and admission deadlines for the next seven days', content: this.calendar(data) };
    }
    return { title: "Today’s Timeline", subtitle: `${this.formatDate(data.today)} interview workload`, content: this.timeline(data) };
  },

  updateRotator() {
    const panel = document.getElementById('amsd-rotator-panel');
    if (!panel) return;
    const view = this.rotatorView(this.data());
    const title = document.getElementById('amsd-rotator-title');
    const subtitle = document.getElementById('amsd-rotator-subtitle');
    const body = document.getElementById('amsd-rotator-body');
    if (title) title.textContent = view.title;
    if (subtitle) subtitle.textContent = view.subtitle;
    if (body) {
      body.classList.remove('is-switching');
      void body.offsetWidth;
      body.classList.add('is-switching');
      body.innerHTML = view.content;
    }
  },

  advanceRotator(delta, manual = false) {
    const length = this.rotationOrder.length;
    this.rotatorIndex = (this.rotatorIndex + delta + length) % length;
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

  timeline(data) {
    const rows = [...data.todayInterviews].sort((a, b) => String(a.datetime).localeCompare(String(b.datetime)));
    return rows.length ? `<div class="amsd-timeline">${rows.map(item => `<button type="button" data-amsd-interview-id="${this.escape(item.id)}"><time>${this.formatTime(item.datetime)}</time><i class="${this.statusTone(item.status)}"></i><span><strong>${this.escape(item.name)}</strong><small>${this.escape(item.course)} · ${this.escape(item.status)}</small></span></button>`).join('')}</div>` : this.empty('fa-calendar-check', 'No interviews scheduled today', 'The timeline will update from Interview Management.');
  },

  recentActivity(data) {
    const activities = [
      ...data.otr.map(item => ({ date: item.updatedAt || item.createdAt, icon: 'fa-file-circle-check', tone: 'blue', user: item.owner || 'AMS system', student: item.personal?.fullName, action: 'OTR submitted' })),
      ...data.interviews.map(item => ({ date: item.updatedAt || item.submittedDate || item.datetime, icon: item.status === 'Completed' ? 'fa-circle-check' : 'fa-calendar-check', tone: item.status === 'Completed' ? 'green' : 'purple', user: window.AMSInterviews?.interviewerById?.(item.interviewerId)?.name || 'Admission Team', student: item.name, action: `Interview ${String(item.status || 'scheduled').toLowerCase()}` })),
      ...data.students.filter(item => ['admission_confirmed', 'application_rejected', 'declined_by_student'].includes(item.statusKey)).map(item => ({ date: item.updatedAt || item.createdAt, icon: item.statusKey === 'admission_confirmed' ? 'fa-user-check' : 'fa-user-xmark', tone: item.statusKey === 'admission_confirmed' ? 'green' : 'red', user: item.owner || 'Admission Team', student: item.name, action: item.statusKey === 'admission_confirmed' ? 'Admission confirmed' : 'Admission closed' }))
    ].filter(item => item.date && !Number.isNaN(new Date(item.date).getTime())).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);
    return activities.length ? `<div class="amsd-activity-list">${activities.map(item => `<div><span class="tone-${item.tone}"><i class="fas ${item.icon}"></i></span><p><strong>${this.escape(item.action)}</strong><small>${this.escape(item.student || 'AMS record')} · ${this.escape(item.user)}</small></p><time>${this.timeAgo(item.date)}</time></div>`).join('')}</div>` : this.empty('fa-clock-rotate-left', 'No timestamped activity available', 'Activity appears when AMS records are created or updated.');
  },

  calendar(data) {
    const days = Array.from({ length: 7 }, (_, index) => this.addDays(data.now, index));
    const interviewEvents = data.interviews.filter(item => String(item.datetime).slice(0, 10) >= data.today && String(item.datetime).slice(0, 10) <= data.weekEnd && !['Cancelled', 'Canceled'].includes(item.status)).map(item => ({ type: 'interview', date: String(item.datetime).slice(0, 10), datetime: item.datetime, id: item.id, title: item.name, meta: item.status }));
    const admissionEvents = data.students.map(item => ({ item, date: this.dateKey(new Date(item.dueDate || item.nextActionDate || '')) })).filter(event => event.date >= data.today && event.date <= data.weekEnd).map(event => ({ type: 'student', date: event.date, datetime: `${event.date}T23:59:00`, id: event.item.key || event.item.admissionNo, title: event.item.name, meta: event.item.nextStep || event.item.purpose || 'Admission deadline' }));
    const events = [...interviewEvents, ...admissionEvents].sort((a, b) => String(a.datetime).localeCompare(String(b.datetime)));
    return `<div class="amsd-calendar-strip">${days.map(day => {
      const key = this.dateKey(day);
      const count = events.filter(item => item.date === key).length;
      return `<button type="button" data-amsd-calendar-date="${key}" class="${key === data.today ? 'today' : ''}"><small>${day.toLocaleDateString('en-IN', { weekday: 'short' })}</small><strong>${day.getDate()}</strong><span>${count || ''}</span></button>`;
    }).join('')}</div><div class="amsd-calendar-events">${events.slice(0, 5).map(item => `<button type="button" ${item.type === 'interview' ? `data-amsd-interview-id="${this.escape(item.id)}"` : `data-amsd-student="${this.escape(item.id)}"`}><time>${this.formatShortDate(item.datetime)}${item.type === 'interview' ? ` · ${this.formatTime(item.datetime)}` : ''}</time><strong>${this.escape(item.title)}</strong><span>${this.escape(item.meta)}</span></button>`).join('') || '<div class="amsd-inline-empty">No upcoming calendar events.</div>'}</div>`;
  },

  notifications(data) {
    const notices = [
      data.overdue.length && ['danger', 'fa-triangle-exclamation', `${data.overdue.length} overdue interview${data.overdue.length === 1 ? '' : 's'}`, 'Review the interview schedule now', 'interviews'],
      data.documents.missingStudents && ['warning', 'fa-file-circle-xmark', `${data.documents.missingStudents} students have no verified documents`, 'Document follow-up required', 'students'],
      data.awaitingApproval && ['info', 'fa-stamp', `${data.awaitingApproval} admission${data.awaitingApproval === 1 ? '' : 's'} awaiting approval`, 'Open the approval queue', 'students'],
      data.upcoming.length && ['success', 'fa-calendar-days', `${data.upcoming.length} interview${data.upcoming.length === 1 ? '' : 's'} in the next 7 days`, 'Prepare interview workload', 'interviews']
    ].filter(Boolean);
    return notices.length ? `<div class="amsd-notices">${notices.map(item => `<button type="button" class="${item[0]}" data-amsd-go="${item[4]}"><i class="fas ${item[1]}"></i><span><strong>${item[2]}</strong><small>${item[3]}</small></span><i class="fas fa-chevron-right"></i></button>`).join('')}</div>` : this.empty('fa-bell-slash', 'No operational alerts', 'Current AMS queues have no urgent notifications.');
  },

  showDateDialog() {
    document.getElementById('amsd-date-overlay')?.remove();
    const root = document.getElementById('ams-dashboard-root');
    if (!root) return;
    const overlay = document.createElement('div');
    overlay.id = 'amsd-date-overlay';
    overlay.className = 'amsd-date-overlay';
    overlay.innerHTML = `
      <div class="amsd-date-card" role="dialog" aria-modal="true" aria-labelledby="amsd-date-title">
        <div class="amsd-date-head"><div><span>AMS Dashboard</span><h2 id="amsd-date-title">Custom Date</h2></div><button type="button" data-amsd-action="date-close" aria-label="Close"><i class="fas fa-times"></i></button></div>
        <div class="amsd-date-fields"><label><span>From</span><input id="amsd-date-from" type="date" value="${this.dateFrom}"></label><label><span>To</span><input id="amsd-date-to" type="date" value="${this.dateTo}"></label></div>
        <div class="amsd-date-actions"><button type="button" class="btn btn-outline" data-amsd-action="date-clear">Clear</button><button type="button" class="btn btn-primary" data-amsd-action="date-apply">Apply</button></div>
      </div>
    `;
    root.appendChild(overlay);
  },

  handleChange(event) {
    if (event.target.id === 'amsd-course-filter') {
      this.courseFilter = event.target.value || 'all';
      this.otrCourseFilter = 'all';
      this.render();
      return;
    }
    if (event.target.id === 'amsd-otr-course-filter') {
      this.otrCourseFilter = event.target.value || 'all';
      this.render();
    }
  },

  handleClick(event) {
    const rotate = event.target.closest('[data-amsd-rotate]')?.dataset.amsdRotate;
    if (rotate) {
      this.advanceRotator(rotate === 'prev' ? -1 : 1, true);
      return;
    }

    const action = event.target.closest('[data-amsd-action]')?.dataset.amsdAction;
    if (action === 'date-filter') return this.showDateDialog();
    if (action === 'date-close') return document.getElementById('amsd-date-overlay')?.remove();
    if (action === 'date-clear') {
      this.dateFrom = '';
      this.dateTo = '';
      return this.render();
    }
    if (action === 'date-apply') {
      let from = document.getElementById('amsd-date-from')?.value || '';
      let to = document.getElementById('amsd-date-to')?.value || '';
      if (from && to && from > to) [from, to] = [to, from];
      this.dateFrom = from;
      this.dateTo = to;
      return this.render();
    }

    const kpi = event.target.closest('[data-amsd-kpi]')?.dataset.amsdKpi;
    if (kpi) {
      this.activeKpi = kpi;
      return this.openKpi(kpi);
    }

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
    if (key === 'otr-pending') {
      window.AMSStudentList.setStage?.('otr');
      window.AMSStudentList.state.stageStatus = 'Pending';
      return window.AMSStudentList.render?.();
    }
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
    else if (filter === 'today') {
      module.state.activeKpi = 'scheduled';
      const today = this.dateKey(new Date());
      module.state.filters.from = today;
      module.state.filters.to = today;
    } else if (filter === 'upcoming') {
      module.state.activeKpi = 'scheduled';
      module.state.filters.from = this.dateKey(this.addDays(new Date(), 1));
      module.state.filters.to = this.dateKey(this.addDays(new Date(), 7));
    } else if (filter === 'overdue') {
      module.state.activeKpi = 'scheduled';
      module.state.filters.to = this.dateKey(this.addDays(new Date(), -1));
    } else {
      module.state.activeKpi = 'pending';
    }
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
    const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 6);
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

  documentRatio(value) {
    const match = String(value || '').match(/(\d+)\s*\/\s*(\d+)/);
    return match ? [Number(match[1]), Number(match[2])] : [0, 6];
  },

  empty(icon, title, text) {
    return `<div class="amsd-empty"><i class="fas ${icon}"></i><strong>${title}</strong><span>${text}</span></div>`;
  },

  statusTone(status) {
    if (status === 'Completed') return 'green';
    if (status === 'Cancelled' || status === 'Canceled') return 'red';
    if (status === 'Awaiting Assignment') return 'amber';
    if (status === 'Rescheduled') return 'purple';
    return 'blue';
  },

  dateKey(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  formatDate(value) {
    const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatShortDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  },

  formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  },

  timeAgo(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Time unavailable';
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`;
    return this.formatShortDate(value);
  },

  escape(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  }
};

window.AMSDashboard = AMSDashboard;