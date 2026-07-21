// ============================================================
// AMS DASHBOARD - Operational overview built only from AMS data
// ============================================================

const AMSDashboard = {
  initialized: false,
  activeKpi: 'all',

  init() {
    const root = document.getElementById('ams-dashboard-root');
    if (!root || this.initialized) return;
    this.initialized = true;
    root.addEventListener('click', event => this.handleClick(event));
    window.addEventListener('ams:data-change', () => {
      if (window.AMSApp?.currentScreen === 'ams-dashboard') this.render();
    });
    window.addEventListener('storage', event => {
      if (['paAMSOTRRecords', 'paAMSInterviews', 'paAMSInterviewStructures'].includes(event.key)) this.render();
    });
    this.render();
  },

  data() {
    const students = Array.isArray(window.AMSStudentList?.rows)
      ? window.AMSStudentList.rows
      : (window.AMSModule?.students || []);
    const otr = window.AMSOTR?.getRecords?.() || [];
    const interviews = Array.isArray(window.AMSInterviews?.interviews) ? window.AMSInterviews.interviews : [];
    const structures = Array.isArray(window.AMSInterviews?.structures) ? window.AMSInterviews.structures : [];
    const now = new Date();
    const today = this.dateKey(now);
    const weekEnd = this.dateKey(this.addDays(now, 7));
    const monthEnd = this.dateKey(this.addDays(now, 30));
    const activeStatuses = new Set(['Scheduled', 'Awaiting Assignment', 'In Progress', 'Rescheduled']);
    const interviewDate = item => String(item.datetime || '').slice(0, 10);
    const todayInterviews = interviews.filter(item => interviewDate(item) === today && item.status !== 'Cancelled');
    const upcoming = interviews.filter(item => interviewDate(item) > today && interviewDate(item) <= weekEnd && activeStatuses.has(item.status));
    const overdue = interviews.filter(item => item.datetime && new Date(item.datetime) < now && activeStatuses.has(item.status));
    const completed = interviews.filter(item => item.status === 'Completed');
    const awaitingAssignment = interviews.filter(item => item.status === 'Awaiting Assignment' || !item.interviewerId);
    const pendingEvaluations = interviews.filter(item => ['In Progress', 'Completed'].includes(item.status) && !this.hasEvaluation(item));
    const documents = students.reduce((result, student) => {
      const verified = Number(student.verifiedDocuments ?? this.documentRatio(student.documents)[0]);
      const total = Number(student.totalDocuments ?? this.documentRatio(student.documents)[1]);
      result.verified += verified;
      result.total += total;
      if (verified < total) result.pendingStudents += 1;
      if (verified === 0) result.missingStudents += 1;
      if (/reject/i.test(String(student.documents || student.documentStatus || ''))) result.rejectedStudents += 1;
      return result;
    }, { verified: 0, total: 0, pendingStudents: 0, missingStudents: 0, rejectedStudents: 0 });
    documents.pending = Math.max(0, documents.total - documents.verified);
    documents.progress = documents.total ? Math.round((documents.verified / documents.total) * 100) : 0;

    const statusCount = key => students.filter(item => item.statusKey === key || item.stageKey === key).length;
    const otrCounts = {
      pending: statusCount('form_pending') + otr.filter(item => /pending/i.test(item.statusKey || item.status || '')).length,
      draft: otr.filter(item => /draft/i.test(item.statusKey || item.status || '')).length,
      submitted: otr.filter(item => /submitted/i.test(item.statusKey || item.status || '')).length,
      returned: otr.filter(item => /returned/i.test(item.statusKey || item.status || '')).length,
      approved: otr.filter(item => /approved/i.test(item.statusKey || item.status || '')).length
    };

    return {
      students, otr, interviews, structures, now, today, weekEnd, monthEnd,
      todayInterviews, upcoming, overdue, completed, awaitingAssignment, pendingEvaluations,
      documents, otrCounts,
      activeAdmissions: students.filter(item => !['rejected', 'onboarded'].includes(item.statusKey)).length,
      confirmed: statusCount('onboarded'),
      rejected: statusCount('rejected'),
      awaitingApproval: students.filter(item => ['document_verification', 'form_submitted'].includes(item.statusKey)).length,
      awaitingInterview: students.filter(item => ['form_submitted', 'document_verification'].includes(item.statusKey)).length,
      awaitingFee: statusCount('fee_pending')
    };
  },

  render() {
    const root = document.getElementById('ams-dashboard-root');
    if (!root) return;
    const data = this.data();
    root.innerHTML = `
      ${this.header(data)}
      ${this.kpis(data)}
      <div class="amsd-layout">
        ${this.panel('Admission Funnel', 'Live movement across the complete AMS journey', this.funnel(data), 'wide', '<span class="amsd-live"><i></i> Live AMS data</span>')}
        ${this.panel('Interview Overview', 'Today, upcoming work, overdue items, and outcomes', this.interviewOverview(data), 'span-2', this.linkButton('Open Interviews', 'interviews'))}
        ${this.panel("Today's Timeline", `${this.formatDate(data.today)} interview workload`, this.timeline(data), '', this.linkButton('Full Calendar', 'interview-calendar'))}
        ${this.panel('OTR Form Analytics', 'Submission status and recorded activity trends', this.otrAnalytics(data), '')}
        ${this.panel('Document Verification', 'Verification progress across AMS admission records', this.documentAnalytics(data), '', this.linkButton('Verify Records', 'documents'))}
        ${this.panel('Admission Status', 'Current approval, interview, fee, and outcome queues', this.admissionStatus(data), '')}
        ${this.panel('Course Analytics', 'Admission volume by course, batch, and learning mode', this.courseAnalytics(data), 'span-2')}
        ${this.panel('Interview Structure Analytics', 'Active evaluation design and real usage', this.structureAnalytics(data), '', this.linkButton('Manage', 'structures'))}
        ${this.panel('Student Progress', 'Students requiring the closest operational attention', this.studentProgress(data), 'span-2', this.linkButton('All Students', 'students'))}
        ${this.panel('Pending Work', 'Actionable queues ordered by operational priority', this.pendingWork(data), '')}
        ${this.panel('Recent Activity', 'Latest timestamped activity available in AMS', this.recentActivity(data), 'span-2')}
        ${this.panel('Operational Calendar', 'Interviews and admission deadlines for the next seven days', this.calendar(data), '')}
        ${this.panel('Notifications', 'Urgent operational signals from current AMS records', this.notifications(data), '')}
        ${this.panel('Quick Actions', 'Frequently used Admission Team workflows', this.quickActions(), 'wide')}
      </div>
    `;
  },

  header(data) {
    return `<header class="amsd-header">
      <div><span class="amsd-eyebrow">Admission Management System</span><h1>Admission Operations Dashboard</h1><p>One live view of admissions, OTR forms, interviews, verification, structures, and pending work.</p></div>
      <div class="amsd-header-actions"><span class="amsd-updated"><i class="fas fa-database"></i> ${data.students.length + data.otr.length + data.interviews.length} managed records</span><button type="button" class="btn btn-outline" data-amsd-action="refresh"><i class="fas fa-rotate"></i> Refresh</button><button type="button" class="btn btn-primary" data-amsd-go="students"><i class="fas fa-users"></i> Student List</button></div>
    </header>`;
  },

  kpis(data) {
    const cards = [
      ['all', 'fa-users', 'Total Admissions', data.students.length, 'All AMS admission records', 'blue'],
      ['active', 'fa-user-clock', 'Active Admissions', data.activeAdmissions, 'Currently in progress', 'navy'],
      ['otr-pending', 'fa-file-circle-exclamation', 'OTR Pending', data.otrCounts.pending, 'Awaiting submission', 'amber'],
      ['otr-completed', 'fa-file-circle-check', 'OTR Submitted', data.otrCounts.submitted, `${this.periodCount(data.otr, 7, 'updatedAt')} in last 7 days`, 'teal'],
      ['today-interviews', 'fa-calendar-day', 'Interviews Today', data.todayInterviews.length, `${data.awaitingAssignment.length} awaiting assignment`, 'purple'],
      ['upcoming-interviews', 'fa-clock', 'Upcoming Interviews', data.upcoming.length, 'Next 7 days', 'blue'],
      ['pending-documents', 'fa-folder-open', 'Documents Pending', data.documents.pending, `${data.documents.pendingStudents} student records`, 'amber'],
      ['confirmed', 'fa-circle-check', 'Confirmed', data.confirmed, 'Admission completed', 'green'],
      ['rejected', 'fa-circle-xmark', 'Rejected', data.rejected, 'Closed admission records', 'red'],
      ['approval', 'fa-stamp', 'Awaiting Approval', data.awaitingApproval, 'Review required', 'purple']
    ];
    return `<section class="amsd-kpis" aria-label="AMS key performance indicators">${cards.map(card => `<button type="button" class="amsd-kpi ${this.activeKpi === card[0] ? 'active' : ''} tone-${card[5]}" data-amsd-kpi="${card[0]}"><span class="amsd-kpi-icon"><i class="fas ${card[1]}"></i></span><span class="amsd-kpi-copy"><small>${card[2]}</small><strong>${card[3]}</strong><em>${card[4]}</em></span><i class="fas fa-arrow-right amsd-kpi-arrow"></i></button>`).join('')}</section>`;
  },

  funnel(data) {
    const studentKeys = new Set(data.students.flatMap(item => [item.email?.toLowerCase(), item.phone].filter(Boolean)));
    const mappedInterviews = data.interviews.filter(item => studentKeys.has(item.email?.toLowerCase()) || studentKeys.has(item.phone));
    const uniqueInterviewStudents = new Set(mappedInterviews.map(item => item.email?.toLowerCase() || item.phone).filter(Boolean)).size;
    const otrStarted = Math.min(data.students.length, data.otrCounts.pending + data.otrCounts.draft + data.otrCounts.submitted + data.otrCounts.returned + data.otrCounts.approved);
    const stages = [
      ['Inquiry / Admission Record', data.students.length],
      ['OTR Sent / Started', otrStarted],
      ['OTR Submitted', data.otrCounts.submitted],
      ['OTR / Documents Verified', data.students.filter(item => Number(item.verifiedDocuments) >= Number(item.totalDocuments) && Number(item.totalDocuments) > 0).length],
      ['Interview Scheduled', uniqueInterviewStudents],
      ['Interview Completed', new Set(mappedInterviews.filter(item => item.status === 'Completed').map(item => item.email?.toLowerCase() || item.phone).filter(Boolean)).size],
      ['Admission Approved', data.confirmed + data.awaitingFee],
      ['Admission Confirmed', data.confirmed],
      ['Admission Rejected', data.rejected]
    ];
    const base = Math.max(1, stages[0][1]);
    return `<div class="amsd-funnel">${stages.map((stage, index) => {
      const previous = index ? stages[index - 1][1] : base;
      const pct = Math.round((stage[1] / base) * 100);
      const conversion = previous ? Math.min(100, Math.round((stage[1] / previous) * 100)) : 0;
      const drop = Math.max(0, previous - stage[1]);
      return `<button type="button" class="amsd-funnel-stage" data-amsd-go="${index >= 4 && index <= 5 ? 'interviews' : 'students'}"><span>${index + 1}</span><div><strong>${stage[0]}</strong><small>${conversion}% conversion · ${drop} drop-off</small></div><b>${stage[1]}</b><em>${pct}%</em><i style="--value:${Math.min(100, pct)}%"></i></button>`;
    }).join('')}</div>`;
  },

  interviewOverview(data) {
    const items = [
      ['today', 'Today', data.todayInterviews.length, 'fa-calendar-day', 'blue'],
      ['upcoming', 'Upcoming', data.upcoming.length, 'fa-clock', 'amber'],
      ['overdue', 'Overdue', data.overdue.length, 'fa-triangle-exclamation', 'red'],
      ['rescheduled', 'Rescheduled', data.interviews.filter(item => item.status === 'Rescheduled').length, 'fa-calendar-plus', 'purple'],
      ['completed', 'Completed', data.completed.length, 'fa-circle-check', 'green'],
      ['evaluation', 'Pending Evaluation', data.pendingEvaluations.length, 'fa-clipboard-check', 'teal']
    ];
    const workload = this.groupBy(data.todayInterviews, item => window.AMSInterviews?.interviewerById?.(item.interviewerId)?.name || 'Unassigned');
    return `<div class="amsd-stat-grid">${items.map(item => `<button type="button" data-amsd-interview="${item[0]}" class="amsd-mini-stat tone-${item[4]}"><i class="fas ${item[3]}"></i><span><small>${item[1]}</small><strong>${item[2]}</strong></span></button>`).join('')}</div><div class="amsd-workload"><div class="amsd-subhead"><strong>Today's workload</strong><span>${data.todayInterviews.length} scheduled</span></div>${this.barRows(workload, data.todayInterviews.length, 'No interviewer workload for today.')}</div>`;
  },

  timeline(data) {
    const rows = [...data.todayInterviews].sort((a, b) => String(a.datetime).localeCompare(String(b.datetime)));
    return rows.length ? `<div class="amsd-timeline">${rows.map(item => `<button type="button" data-amsd-interview-id="${this.escape(item.id)}"><time>${this.formatTime(item.datetime)}</time><i class="${this.statusTone(item.status)}"></i><span><strong>${this.escape(item.name)}</strong><small>${this.escape(item.course)} · ${this.escape(item.status)}</small></span></button>`).join('')}</div>` : this.empty('fa-calendar-check', 'No interviews scheduled today', 'The timeline will update from Interview Management.');
  },

  otrAnalytics(data) {
    const items = [['Pending', data.otrCounts.pending], ['Draft', data.otrCounts.draft], ['Submitted', data.otrCounts.submitted], ['Returned', data.otrCounts.returned], ['Approved', data.otrCounts.approved]];
    const days = Array.from({ length: 7 }, (_, index) => this.addDays(data.now, index - 6));
    const counts = days.map(day => data.otr.filter(item => this.dateKey(new Date(item.updatedAt || item.createdAt)) === this.dateKey(day)).length);
    const max = Math.max(1, ...counts);
    return `<div class="amsd-segment-list">${items.map(item => `<span><small>${item[0]}</small><strong>${item[1]}</strong></span>`).join('')}</div><div class="amsd-trend-summary"><span><b>${this.periodCount(data.otr, 1, 'updatedAt')}</b> Today</span><span><b>${this.periodCount(data.otr, 7, 'updatedAt')}</b> 7 days</span><span><b>${this.periodCount(data.otr, 30, 'updatedAt')}</b> 30 days</span></div><div class="amsd-spark" aria-label="Daily OTR submission trend">${counts.map((count, index) => `<span title="${this.formatDate(this.dateKey(days[index]))}: ${count}"><i style="height:${Math.max(5, Math.round((count / max) * 100))}%"></i><small>${days[index].toLocaleDateString('en-IN', { weekday: 'narrow' })}</small></span>`).join('')}</div>`;
  },

  documentAnalytics(data) {
    const d = data.documents;
    return `<div class="amsd-donut-row"><div class="amsd-donut" style="--value:${d.progress}"><strong>${d.progress}%</strong><span>verified</span></div><div class="amsd-legend"><span><i class="green"></i>Verified <b>${d.verified}</b></span><span><i class="amber"></i>Pending <b>${d.pending}</b></span><span><i class="red"></i>Rejected records <b>${d.rejectedStudents}</b></span><span><i class="gray"></i>No documents <b>${d.missingStudents}</b></span></div></div><button type="button" class="amsd-callout" data-amsd-go="documents"><i class="fas fa-folder-open"></i><span><strong>${d.pendingStudents} students need document attention</strong><small>Open filtered Admission Student List</small></span><i class="fas fa-chevron-right"></i></button>`;
  },

  admissionStatus(data) {
    const items = [['Awaiting Interview', data.awaitingInterview, 'interviews'], ['Awaiting Approval', data.awaitingApproval, 'students'], ['Awaiting Fee', data.awaitingFee, 'students'], ['Admission Confirmed', data.confirmed, 'students'], ['Admission Rejected', data.rejected, 'students']];
    const max = Math.max(1, ...items.map(item => item[1]));
    return `<div class="amsd-horizontal-chart">${items.map(item => `<button type="button" data-amsd-go="${item[2]}"><span>${item[0]}</span><i><em style="width:${Math.round((item[1] / max) * 100)}%"></em></i><b>${item[1]}</b></button>`).join('')}</div>`;
  },

  courseAnalytics(data) {
    const courses = this.groupBy(data.students, item => item.course || 'Course not mapped');
    const batches = this.groupBy(data.students, item => item.batch || 'Batch not mapped');
    const modes = this.groupBy(data.interviews, item => item.learningMode || item.mode || 'Mode not mapped');
    return `<div class="amsd-analytics-columns"><div><div class="amsd-subhead"><strong>Admissions per course</strong><span>${Object.keys(courses).length} courses</span></div>${this.barRows(courses, data.students.length, 'No course mappings available.')}</div><div><div class="amsd-subhead"><strong>Admissions per batch</strong><span>${Object.keys(batches).length} batches</span></div>${this.barRows(batches, data.students.length, 'No batch mappings available.')}</div><div><div class="amsd-subhead"><strong>Learning mode</strong><span>Mapped interviews</span></div>${this.barRows(modes, data.interviews.length, 'No learning modes mapped.')}</div></div><div class="amsd-capacity-note"><i class="fas fa-circle-info"></i><span><strong>Course occupancy and remaining capacity</strong><small>Seat capacity is not configured in the stored AMS course or batch records. Counts above remain live; occupancy will appear when capacity is stored.</small></span></div>`;
  },

  structureAnalytics(data) {
    const usage = this.groupBy(data.interviews, item => window.AMSInterviews?.structureById?.(item.structureId)?.name || 'Structure not mapped');
    const scores = data.completed.map(item => Number(item.score)).filter(Number.isFinite);
    const mostUsed = Object.entries(usage).sort((a, b) => b[1] - a[1])[0];
    return `<div class="amsd-structure-summary"><span><small>Total Structures</small><strong>${data.structures.length}</strong></span><span><small>Active</small><strong>${data.structures.filter(item => item.active).length}</strong></span><span><small>Average Score</small><strong>${scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : '—'}</strong></span><span><small>Most Used</small><strong title="${this.escape(mostUsed?.[0] || '')}">${this.escape(mostUsed?.[0] || 'No usage')}</strong></span></div>${this.barRows(usage, data.interviews.length, 'No interview structure usage recorded.')}`;
  },

  studentProgress(data) {
    const filtered = this.filteredStudents(data);
    const rows = filtered.slice(0, 6);
    if (!rows.length) return this.empty('fa-user-graduate', 'No matching students', 'Select another KPI or open the full student list.');
    return `<div class="amsd-table-wrap"><table class="amsd-table"><thead><tr><th>Student</th><th>Admission Stage</th><th>Interview</th><th>Documents</th><th>OTR</th><th></th></tr></thead><tbody>${rows.map(student => {
      const interview = data.interviews.find(item => item.email?.toLowerCase() === student.email?.toLowerCase() || item.phone === student.phone);
      const otr = data.otr.find(item => item.personal?.email?.toLowerCase() === student.email?.toLowerCase() || item.personal?.phone === student.phone);
      return `<tr><td><strong>${this.escape(student.name)}</strong><small>${this.escape(student.admissionNo || student.otrNo || '')}</small></td><td><span class="amsd-status ${this.slug(student.stageStatus || student.status)}">${this.escape(student.stage || student.status)}</span></td><td>${this.escape(interview?.status || 'Not scheduled')}</td><td>${this.escape(student.documents || `${student.verifiedDocuments}/${student.totalDocuments} verified`)}</td><td>${this.escape(otr?.status || (student.statusKey === 'form_pending' ? 'Pending' : 'Submitted'))}</td><td><button type="button" data-amsd-student="${this.escape(student.key || student.otrId || student.admissionNo)}" title="Open student"><i class="fas fa-chevron-right"></i></button></td></tr>`;
    }).join('')}</tbody></table></div>`;
  },

  pendingWork(data) {
    const work = [
      ['fa-user-clock', 'Interviews awaiting assignment', data.awaitingAssignment.length, 'interviews', 'urgent'],
      ['fa-clipboard-check', 'Interviews awaiting evaluation', data.pendingEvaluations.length, 'interviews', 'warning'],
      ['fa-file-circle-exclamation', 'Pending OTR review / submission', data.otrCounts.pending, 'otr', 'warning'],
      ['fa-folder-open', 'Pending document verification', data.documents.pendingStudents, 'documents', 'warning'],
      ['fa-stamp', 'Admissions awaiting approval', data.awaitingApproval, 'students', 'info'],
      ['fa-phone-volume', 'Admissions requiring follow-up', data.students.filter(item => item.nextStep && !['onboarded', 'rejected'].includes(item.statusKey)).length, 'students', 'info']
    ];
    return `<div class="amsd-work-list">${work.map(item => `<button type="button" data-amsd-go="${item[3]}" class="${item[4]}"><i class="fas ${item[0]}"></i><span><strong>${item[1]}</strong><small>${item[2] ? 'Open the related AMS queue' : 'No pending records'}</small></span><b>${item[2]}</b><i class="fas fa-chevron-right"></i></button>`).join('')}</div>`;
  },

  recentActivity(data) {
    const activities = [
      ...data.otr.map(item => ({ date: item.updatedAt || item.createdAt, icon: 'fa-file-circle-check', tone: 'blue', user: item.owner || 'AMS system', student: item.personal?.fullName, action: 'OTR submitted' })),
      ...data.interviews.map(item => ({ date: item.updatedAt || item.submittedDate || item.datetime, icon: item.status === 'Completed' ? 'fa-circle-check' : 'fa-calendar-check', tone: item.status === 'Completed' ? 'green' : 'purple', user: window.AMSInterviews?.interviewerById?.(item.interviewerId)?.name || 'Admission Team', student: item.name, action: `Interview ${String(item.status || 'scheduled').toLowerCase()}` })),
      ...data.students.filter(item => ['onboarded', 'rejected'].includes(item.statusKey)).map(item => ({ date: item.updatedAt || item.createdAt, icon: item.statusKey === 'onboarded' ? 'fa-user-check' : 'fa-user-xmark', tone: item.statusKey === 'onboarded' ? 'green' : 'red', user: item.owner || 'Admission Team', student: item.name, action: item.statusKey === 'onboarded' ? 'Admission confirmed' : 'Admission rejected' }))
    ].filter(item => item.date && !Number.isNaN(new Date(item.date).getTime())).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);
    return activities.length ? `<div class="amsd-activity-list">${activities.map(item => `<div><span class="tone-${item.tone}"><i class="fas ${item.icon}"></i></span><p><strong>${this.escape(item.action)}</strong><small>${this.escape(item.student || 'AMS record')} · ${this.escape(item.user)}</small></p><time>${this.timeAgo(item.date)}</time></div>`).join('')}</div>` : this.empty('fa-clock-rotate-left', 'No timestamped activity available', 'Activity appears when AMS records are created or updated.');
  },

  calendar(data) {
    const days = Array.from({ length: 7 }, (_, index) => this.addDays(data.now, index));
    const interviewEvents = data.interviews.filter(item => String(item.datetime).slice(0, 10) >= data.today && String(item.datetime).slice(0, 10) <= data.weekEnd && item.status !== 'Cancelled').map(item => ({ type: 'interview', date: String(item.datetime).slice(0, 10), datetime: item.datetime, id: item.id, title: item.name, meta: item.status }));
    const admissionEvents = data.students.map(item => ({ item, date: this.dateKey(new Date(item.dueDate || '')) })).filter(event => event.date >= data.today && event.date <= data.weekEnd).map(event => ({ type: 'student', date: event.date, datetime: `${event.date}T23:59:00`, id: event.item.key || event.item.admissionNo, title: event.item.name, meta: event.item.statusKey === 'document_verification' ? 'Document verification deadline' : (event.item.nextStep || 'Admission deadline') }));
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
      data.documents.missingStudents && ['warning', 'fa-file-circle-xmark', `${data.documents.missingStudents} students have no verified documents`, 'Document follow-up required', 'documents'],
      data.awaitingApproval && ['info', 'fa-stamp', `${data.awaitingApproval} admission${data.awaitingApproval === 1 ? '' : 's'} awaiting approval`, 'Open the approval queue', 'students'],
      data.upcoming.length && ['success', 'fa-calendar-days', `${data.upcoming.length} interview${data.upcoming.length === 1 ? '' : 's'} in the next 7 days`, 'Prepare interviewer workload', 'interviews']
    ].filter(Boolean);
    return notices.length ? `<div class="amsd-notices">${notices.map(item => `<button type="button" class="${item[0]}" data-amsd-go="${item[4]}"><i class="fas ${item[1]}"></i><span><strong>${item[2]}</strong><small>${item[3]}</small></span><i class="fas fa-chevron-right"></i></button>`).join('')}</div>` : this.empty('fa-bell-slash', 'No operational alerts', 'Current AMS queues have no urgent notifications.');
  },

  quickActions() {
    const actions = [
      ['create-admission', 'fa-user-plus', 'Create Admission', 'Start a new admission'],
      ['otr', 'fa-paper-plane', 'Send OTR Form', 'Open student OTR link'],
      ['schedule', 'fa-calendar-plus', 'Schedule Interview', 'Create a new schedule'],
      ['create-structure', 'fa-diagram-project', 'Create Structure', 'Design interview attributes'],
      ['documents', 'fa-folder-open', 'Verify Documents', 'Open pending records'],
      ['confirm', 'fa-user-check', 'Confirm Admission', 'Open approval records'],
      ['search', 'fa-magnifying-glass', 'Search Student', 'Find an admission'],
      ['reports', 'fa-chart-column', 'Reports & Charts', 'Review dashboard analytics']
    ];
    return `<div class="amsd-quick-grid">${actions.map(item => `<button type="button" data-amsd-go="${item[0]}"><i class="fas ${item[1]}"></i><span><strong>${item[2]}</strong><small>${item[3]}</small></span><i class="fas fa-arrow-right"></i></button>`).join('')}</div>`;
  },

  panel(title, subtitle, content, className = '', action = '') {
    return `<section class="amsd-panel ${className}"><header><div><h2>${title}</h2><p>${subtitle}</p></div>${action}</header><div class="amsd-panel-body">${content}</div></section>`;
  },

  linkButton(label, target) {
    return `<button type="button" class="amsd-panel-link" data-amsd-go="${target}">${label} <i class="fas fa-arrow-right"></i></button>`;
  },

  handleClick(event) {
    const kpi = event.target.closest('[data-amsd-kpi]');
    if (kpi) {
      this.activeKpi = kpi.dataset.amsdKpi;
      this.render();
      document.querySelector('.amsd-panel:nth-of-type(2)')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const interviewFilter = event.target.closest('[data-amsd-interview]')?.dataset.amsdInterview;
    if (interviewFilter) return this.openInterviews(interviewFilter);
    const interviewId = event.target.closest('[data-amsd-interview-id]')?.dataset.amsdInterviewId;
    if (interviewId) return this.openInterview(interviewId);
    const date = event.target.closest('[data-amsd-calendar-date]')?.dataset.amsdCalendarDate;
    if (date) return this.openInterviewCalendar(date);
    const student = event.target.closest('[data-amsd-student]')?.dataset.amsdStudent;
    if (student) return this.openStudent(student);
    const action = event.target.closest('[data-amsd-action]')?.dataset.amsdAction;
    if (action === 'refresh') {
      window.AMSInterviews?.loadData?.();
      return this.render();
    }
    const target = event.target.closest('[data-amsd-go]')?.dataset.amsdGo;
    if (target) this.navigate(target);
  },

  navigate(target) {
    if (target === 'otr') return window.open('otr-form.html', '_blank', 'noopener');
    if (target === 'create-admission') return window.AMSStudentList?.handleTool?.('new');
    if (target === 'schedule') {
      window.AMSApp?.showScreen?.('ams-interviews');
      return window.AMSInterviews?.openScheduleForm?.();
    }
    if (target === 'create-structure') {
      window.AMSApp?.showScreen?.('ams-interviews');
      return window.AMSInterviewStructures?.openStructureForm?.();
    }
    if (target === 'structures') {
      window.AMSApp?.showScreen?.('ams-interviews');
      return window.AMSInterviewStructures?.openManagement?.(window.AMSInterviews?.structures?.[0]?.id);
    }
    if (['interviews', 'interview-calendar'].includes(target)) return this.openInterviews(target === 'interview-calendar' ? 'calendar' : 'all');
    if (['documents', 'confirm', 'search', 'students'].includes(target)) {
      window.AMSApp?.showScreen?.('ams-students');
      if (target === 'documents') window.AMSStudentList?.setStage?.('interview');
      if (target === 'confirm') {
        window.AMSStudentList?.setStage?.('interview');
        if (window.AMSStudentList) {
          window.AMSStudentList.state.stageStatus = 'Completed';
          window.AMSStudentList.render();
        }
      }
      if (target === 'search') setTimeout(() => document.getElementById('amsl-search')?.focus(), 0);
      return;
    }
    if (target === 'reports') document.querySelector('.amsd-layout')?.scrollIntoView({ behavior: 'smooth' });
  },

  openInterviews(filter = 'all') {
    window.AMSApp?.showScreen?.('ams-interviews');
    if (!window.AMSInterviews) return;
    Object.assign(window.AMSInterviews.state.filters, { search: '', from: '', to: '', course: 'all', interviewer: 'all', structure: 'all', status: 'all', mode: 'all' });
    window.AMSInterviews.state.activeKpi = 'all';
    if (filter === 'calendar') window.AMSInterviews.state.view = 'calendar';
    else if (['today', 'upcoming', 'completed', 'overdue', 'evaluation'].includes(filter)) {
      window.AMSInterviews.state.view = 'list';
      window.AMSInterviews.state.activeKpi = filter;
    } else if (filter === 'rescheduled') {
      window.AMSInterviews.state.view = 'list';
      window.AMSInterviews.state.filters.status = 'Rescheduled';
    }
    window.AMSInterviews.render();
  },

  openInterviewCalendar(date) {
    if (window.AMSInterviews) {
      window.AMSInterviews.state.view = 'calendar';
      window.AMSInterviews.state.calendarView = 'day';
      window.AMSInterviews.state.selectedDate = date;
      window.AMSInterviews.state.calendarDate = date;
    }
    this.openInterviews('calendar');
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

  filteredStudents(data) {
    const key = this.activeKpi;
    if (key === 'active') return data.students.filter(item => !['rejected', 'onboarded'].includes(item.statusKey));
    if (key === 'otr-pending') return data.students.filter(item => item.statusKey === 'form_pending');
    if (key === 'confirmed') return data.students.filter(item => item.statusKey === 'onboarded');
    if (key === 'rejected') return data.students.filter(item => item.statusKey === 'rejected');
    if (key === 'approval') return data.students.filter(item => ['form_submitted', 'document_verification'].includes(item.statusKey));
    if (key === 'pending-documents') return data.students.filter(item => Number(item.verifiedDocuments) < Number(item.totalDocuments));
    if (key === 'otr-completed') {
      const otrKeys = new Set(data.otr.flatMap(item => [item.personal?.email?.toLowerCase(), item.personal?.phone].filter(Boolean)));
      return data.students.filter(item => otrKeys.has(item.email?.toLowerCase()) || otrKeys.has(item.phone));
    }
    if (['today-interviews', 'upcoming-interviews'].includes(key)) {
      const rows = key === 'today-interviews' ? data.todayInterviews : data.upcoming;
      const interviewKeys = new Set(rows.flatMap(item => [item.email?.toLowerCase(), item.phone].filter(Boolean)));
      return data.students.filter(item => interviewKeys.has(item.email?.toLowerCase()) || interviewKeys.has(item.phone));
    }
    return data.students;
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

  hasEvaluation(item) {
    return Boolean(item.score || (item.evaluation && Object.keys(item.evaluation).length));
  },

  documentRatio(value) {
    const match = String(value || '').match(/(\d+)\s*\/\s*(\d+)/);
    return match ? [Number(match[1]), Number(match[2])] : [0, 6];
  },

  periodCount(records, days, field) {
    const start = this.addDays(new Date(), -(days - 1));
    start.setHours(0, 0, 0, 0);
    return records.filter(item => {
      const date = new Date(item[field] || item.createdAt || '');
      return !Number.isNaN(date.getTime()) && date >= start;
    }).length;
  },

  empty(icon, title, text) {
    return `<div class="amsd-empty"><i class="fas ${icon}"></i><strong>${title}</strong><span>${text}</span></div>`;
  },

  statusTone(status) {
    if (status === 'Completed') return 'green';
    if (status === 'Cancelled') return 'red';
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

  slug(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  },

  escape(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  }
};

window.AMSDashboard = AMSDashboard;
