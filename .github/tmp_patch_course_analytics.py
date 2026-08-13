from pathlib import Path
import re

js_path = Path('js/ams-dashboard.js')
css_path = Path('css/ams-dashboard.css')
js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

new_methods = r'''  courseModeBucket(student = {}) {
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

  rotatingPanel(data) {'''

js, count = re.subn(
    r"  courseFlowRows\(data\) \{.*?\n  rotatingPanel\(data\) \{",
    new_methods,
    js,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit('Could not replace Course Analytics implementation exactly once')

click_needle = "    const kpi = event.target.closest('[data-amsd-kpi]')?.dataset.amsdKpi;\n"
click_insert = """    const courseToggle = event.target.closest('[data-amsd-course-toggle]')?.dataset.amsdCourseToggle;
    if (courseToggle) return this.toggleCourseAnalytics(courseToggle);
    const courseList = event.target.closest('[data-amsd-course-list]');
    if (courseList) return this.openCourseStudentList(courseList.dataset.amsdCourseList || 'all', courseList.dataset.course || '');
"""
if click_needle not in js:
    raise SystemExit('Could not find Course Analytics click insertion point')
js = js.replace(click_needle, click_insert + click_needle, 1)

export_pattern = re.compile(r"    \} else if \(key === 'courses'\) \{.*?    \} else if \(key === 'activity'\) \{", re.S)
export_replacement = """    } else if (key === 'courses') {
      const courseRows = this.courseEnrollmentRows(data);
      headers = ['Course', 'Offline Students', 'Online Students', 'Total Students', 'Offline Percentage', 'Online Percentage'];
      rows = courseRows.map(item => [item.course, item.offline, item.online, item.total, `${item.offlinePct}%`, `${item.onlinePct}%`]);
    } else if (key === 'activity') {"""
js, count = export_pattern.subn(export_replacement, js, count=1)
if count != 1:
    raise SystemExit('Could not replace Course Analytics export exactly once')

css_block = r'''.amsd-course-enrollment-report{display:grid;gap:22px;min-width:0}.amsd-course-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.amsd-course-summary-card{--tone:var(--primary);display:grid;grid-template-columns:58px minmax(0,1fr) auto;align-items:center;gap:14px;min-width:0;min-height:118px;padding:18px;border:1px solid var(--border);border-radius:18px;background:var(--bg-card);box-shadow:var(--shadow-xs)}.amsd-course-summary-icon{display:grid;width:58px;height:58px;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--tone) 12%,transparent);color:var(--tone);font-size:24px}.amsd-course-summary-copy{display:block;min-width:0}.amsd-course-summary-copy small,.amsd-course-summary-copy em{display:block;color:var(--text-muted);font-style:normal;line-height:1.35}.amsd-course-summary-copy small{color:var(--text-secondary);font-size:11px;font-weight:700}.amsd-course-summary-copy strong,.amsd-course-summary-value{display:block;margin:6px 0 5px;border:0;background:transparent;color:var(--tone);font-size:28px;font-weight:800;line-height:1;text-align:left}.amsd-course-summary-value{padding:0;cursor:pointer}.amsd-course-summary-value:hover{text-decoration:underline}.amsd-course-summary-copy em{font-size:10px}.amsd-course-ring{--pct:0;position:relative;display:grid;width:54px;height:54px;place-items:center;border-radius:50%;background:conic-gradient(var(--tone) calc(var(--pct)*1%),color-mix(in srgb,var(--tone) 12%,transparent) 0)}.amsd-course-ring:before{position:absolute;inset:7px;border-radius:50%;background:var(--bg-card);content:''}.amsd-course-ring b{position:relative;z-index:1;color:var(--tone);font-size:11px}.amsd-course-section-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:2px 10px}.amsd-course-section-head>div{display:flex;align-items:center;gap:8px}.amsd-course-section-head h3{margin:0;color:var(--text-primary);font-size:16px}.amsd-course-section-head>div>span{color:var(--text-muted);font-size:11px}.amsd-course-section-head p{margin:0;color:var(--text-muted);font-size:10px}.amsd-course-section-head p i{margin-right:6px;color:var(--primary)}.amsd-course-table{overflow:hidden;border:1px solid var(--border);border-radius:16px}.amsd-course-table-head,.amsd-course-row-main{display:grid;grid-template-columns:minmax(210px,1fr) minmax(380px,2fr) minmax(130px,.65fr) 36px;align-items:center;gap:18px}.amsd-course-table-head{min-height:48px;padding:0 18px;background:var(--bg-subtle);color:var(--text-secondary);font-size:10px;font-weight:700}.amsd-course-table-head>span:nth-child(2){display:grid;grid-template-columns:1fr 1fr;gap:30px}.amsd-course-row{border-top:1px solid var(--border-light);background:var(--bg-card)}.amsd-course-row:first-child{border-top:0}.amsd-course-row-main{min-height:120px;padding:18px}.amsd-course-name{display:flex;align-items:center;gap:14px;min-width:0}.amsd-course-name>span{display:grid;width:48px;height:48px;flex:0 0 auto;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--tone) 11%,transparent);color:var(--tone);font-size:18px}.amsd-course-name strong{min-width:0;color:var(--text-primary);font-size:16px;line-height:1.3;overflow-wrap:anywhere}.amsd-course-split{display:grid;gap:8px;min-width:0}.amsd-course-split-values{display:grid;grid-template-columns:1fr 1fr;gap:30px}.amsd-course-split-values button{display:flex;align-items:baseline;gap:10px;width:fit-content;padding:0;border:0;background:transparent;cursor:pointer}.amsd-course-split-values button:first-child strong{color:#16a05d}.amsd-course-split-values button:last-child strong{color:#7544d8}.amsd-course-split-values strong{font-size:20px}.amsd-course-split-values small{color:var(--text-secondary);font-size:11px}.amsd-course-split-values button:hover strong{text-decoration:underline}.amsd-course-split-bar{display:flex;width:100%;height:9px;overflow:hidden;border-radius:99px;background:var(--border-light)}.amsd-course-split-bar span{display:block;height:100%}.amsd-course-split-bar .offline{background:#28b66f}.amsd-course-split-bar .online{background:#a47be4}.amsd-course-split-legend{display:flex;align-items:center;gap:22px;color:var(--text-secondary);font-size:9px}.amsd-course-split-legend span{display:flex;align-items:center;gap:6px}.amsd-course-split-legend i{width:7px;height:7px;border-radius:50%}.amsd-course-split-legend i.offline{background:#28b66f}.amsd-course-split-legend i.online{background:#7544d8}.amsd-course-total{display:grid;gap:4px;justify-items:center;padding:4px;border:0;background:transparent;color:var(--text-primary);cursor:pointer}.amsd-course-total strong{font-size:20px}.amsd-course-total small{color:var(--text-muted);font-size:10px}.amsd-course-total:hover strong{text-decoration:underline}.amsd-course-toggle{display:grid;width:34px;height:34px;place-items:center;border:0;border-radius:9px;background:transparent;color:var(--text-secondary);cursor:pointer}.amsd-course-toggle:hover{background:var(--bg-subtle);color:var(--primary)}.amsd-course-expanded{padding:0 18px 16px 250px;background:linear-gradient(180deg,color-mix(in srgb,var(--primary) 3%,transparent),transparent)}.amsd-course-expanded[hidden]{display:none}.amsd-course-expanded-head,.amsd-course-expanded-row{display:grid;grid-template-columns:minmax(180px,1.5fr) minmax(140px,1fr) 100px;gap:18px;align-items:center}.amsd-course-expanded-head{padding:10px 12px;border-bottom:1px solid var(--border);color:var(--text-muted);font-size:9px;font-weight:800;text-transform:uppercase}.amsd-course-expanded-row{min-height:42px;padding:8px 12px;border-bottom:1px solid var(--border-light);color:var(--text-secondary);font-size:10px}.amsd-course-expanded-row:last-child{border-bottom:0}.amsd-course-expanded-row strong{color:var(--text-primary)}.amsd-course-expanded-row b{text-align:right;color:var(--text-primary)}.amsd-course-footnote{display:flex;align-items:center;gap:9px;margin:0;padding:12px 14px;border-radius:12px;background:color-mix(in srgb,var(--primary) 6%,var(--bg-subtle));color:var(--text-secondary);font-size:10px}.amsd-course-footnote i{color:var(--primary)}
'''

css, count = re.subn(
    r"\.amsd-course-report\{.*?(?=\.amsd-report-rotator\{)",
    css_block,
    css,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit('Could not replace previous Course Analytics/Sankey CSS exactly once')

css += r'''
@media(max-width:1120px){.amsd-course-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.amsd-course-table-head,.amsd-course-row-main{grid-template-columns:minmax(190px,.9fr) minmax(330px,1.6fr) 120px 34px}.amsd-course-expanded{padding-left:210px}}
@media(max-width:820px){.amsd-course-section-head{align-items:flex-start;flex-direction:column}.amsd-course-table{overflow-x:auto}.amsd-course-table-head,.amsd-course-row-main{min-width:760px}.amsd-course-expanded{min-width:760px;padding-left:210px}.amsd-course-summary-card{grid-template-columns:50px minmax(0,1fr) auto}.amsd-course-summary-icon{width:50px;height:50px}}
@media(max-width:560px){.amsd-course-summary{grid-template-columns:1fr}.amsd-course-summary-card{min-height:104px}.amsd-course-summary-copy strong,.amsd-course-summary-value{font-size:25px}.amsd-course-section-head{padding-inline:2px}}
'''

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
