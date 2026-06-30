// ============================================================
// DASHBOARD.JS — Student Inquiry Dashboard Logic
// ============================================================

const DashboardModule = {
  charts: {},

  cssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  },

  refreshTheme() {
    this.renderSegmentationChart();
    this.renderStatusChart();
  },

  init() {
    this.renderKPIs();
    this.renderMetrics();
    this.renderAlerts();
    this.renderCounselorTable();
    this.renderLeadJourneyAnalytics();
    this.renderOperationalReports();
    this.renderMiniCalendar();
    this.renderTasks();
    // Charts after a small delay to let DOM settle
    setTimeout(() => {
      this.renderSegmentationChart();
      this.renderStatusChart();
      this.renderFunnelChart();
    }, 100);
    this.setupDateFilter();
    this.setupMiniCalNav();
    this.setupMiniCalRedirect();
  },

  renderKPIs() {
    const kpis = [
      { cls: 'kpi-leads', icon: 'fa-users', label: 'Total Leads', value: '2,350', date: 'This Month', growth: '+18%', up: true },
      { cls: 'kpi-calls', icon: 'fa-user-plus', label: 'New Leads', value: '987', date: 'New Inquiry', growth: '+11%', up: true },
      { cls: 'kpi-admissions', icon: 'fa-user-check', label: 'Assigned Leads', value: '2,214', date: 'Active owners', growth: '+8%', up: true },
      { cls: 'kpi-rate', icon: 'fa-user-clock', label: 'Unassigned Leads', value: '136', date: 'Needs action', growth: '-4%', up: true },
      { cls: 'kpi-followup', icon: 'fa-calendar-day', label: 'Follow-ups Due Today', value: '41', date: 'Today', growth: '+6%', up: false },
      { cls: 'kpi-counselling', icon: 'fa-comments', label: 'Counselling Scheduled', value: '28', date: 'Today', growth: '+9%', up: true },
      { cls: 'kpi-converted', icon: 'fa-graduation-cap', label: 'Admissions Converted', value: '94', date: 'This Month', growth: '+20%', up: true },
      { cls: 'kpi-lost', icon: 'fa-user-times', label: 'Lost Leads', value: '47', date: 'This Month', growth: '-2%', up: true },
    ];
    const container = document.getElementById('kpi-row');
    if (!container) return;
    container.innerHTML = kpis.map(k => `
      <div class="kpi-card ${k.cls}">
        <div class="kpi-icon-wrap"><i class="fas ${k.icon}"></i></div>
        <div class="kpi-body">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value">${k.value}</div>
          <div class="kpi-meta">
            <span class="${k.up ? 'growth-up' : 'growth-down'}">
              <i class="fas fa-arrow-${k.up ? 'up' : 'down'}"></i>${k.growth}
            </span>
            <span class="kpi-date">${k.date}</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderLeadJourneyAnalytics() {
    const container = document.getElementById('dashboard-journey-analytics');
    if (!container) return;
    const stages = [
      { name: 'Inquiry Created', count: 2350, pct: 100, state: 'done' },
      { name: 'Lead Assigned', count: 2214, pct: 94, state: 'done' },
      { name: 'First Contact', count: 1876, pct: 80, state: 'done' },
      { name: 'Follow-up', count: 987, pct: 42, state: 'current' },
      { name: 'Counselling', count: 423, pct: 18, state: 'current' },
      { name: 'Qualified Lead', count: 235, pct: 10, state: 'upcoming' },
      { name: 'Admission Process Started', count: 146, pct: 6, state: 'upcoming' },
      { name: 'Fee Paid', count: 104, pct: 4, state: 'upcoming' },
      { name: 'Student Created', count: 94, pct: 4, state: 'upcoming' }
    ];

    container.innerHTML = stages.map(stage => `
      <div class="journey-analytics-step ${stage.state}">
        <div class="journey-step-head">
          <span>${stage.name}</span>
          <strong>${stage.count.toLocaleString()}</strong>
        </div>
        <div class="journey-progress-track">
          <div class="journey-progress-fill" style="width:${stage.pct}%"></div>
        </div>
        <div class="journey-step-meta">${stage.pct}% of inquiries</div>
      </div>
    `).join('');
  },

  renderOperationalReports() {
    const container = document.getElementById('dashboard-report-grid');
    if (!container) return;
    const reports = [
      { icon: 'fa-list-check', title: 'Daily Inquiry Report', value: '126', meta: 'New inquiries today' },
      { icon: 'fa-chart-pie', title: 'Status-wise Inquiry Report', value: '8', meta: 'Active lead statuses' },
      { icon: 'fa-clock', title: 'Overdue Follow-ups', value: '23', meta: 'Requires escalation' },
      { icon: 'fa-calendar-check', title: 'Completed Follow-ups', value: '78', meta: 'Completed today' },
      { icon: 'fa-comments', title: 'Counselling Conversion', value: '22.2%', meta: 'Converted after counselling' },
      { icon: 'fa-user-check', title: 'Counselor-wise Assigned', value: '2,214', meta: 'Owned inquiries' },
      { icon: 'fa-route', title: 'Stage-wise Inquiry Count', value: '9', meta: 'Journey stages tracked' },
      { icon: 'fa-hourglass-half', title: 'Avg. Time Per Stage', value: '2.4d', meta: 'Operational bottleneck view' }
    ];

    container.innerHTML = reports.map(report => `
      <div class="report-tile">
        <div class="report-icon"><i class="fas ${report.icon}"></i></div>
        <div>
          <div class="report-title">${report.title}</div>
          <div class="report-value">${report.value}</div>
          <div class="report-meta">${report.meta}</div>
        </div>
      </div>
    `).join('');
  },

  renderMetrics() {
    const metrics = [
      { cls: 'metric-untouch', icon: 'fa-eye-slash', name: 'Untouched Leads', count: 47, desc: 'Never Contacted', view: 'pending' },
      { cls: 'metric-overdue', icon: 'fa-clock', name: 'Overdue Follow-ups', count: 23, desc: 'Past Due Date', view: 'overdue' },
      { cls: 'metric-hot', icon: 'fa-fire', name: 'Hot Leads', count: 15, desc: 'High Priority', view: 'hot' },
      { cls: 'metric-leakage', icon: 'fa-filter', name: 'Lead Leakage Lost', count: 38, desc: 'Dropped Leads', view: 'lost' },
    ];
    const container = document.getElementById('kpi-metrics-row');
    if (!container) return;
    container.innerHTML = metrics.map(m => `
      <div class="metric-card ${m.cls}" onclick="App.showScreen('leads')">
        <div class="metric-top">
          <div>
            <div class="metric-name">${m.name}</div>
            <div class="metric-desc">${m.desc}</div>
          </div>
          <div class="metric-icon-wrap"><i class="fas ${m.icon}"></i></div>
        </div>
        <div class="metric-count">${m.count}</div>
        <button class="metric-view-btn">View Leads <i class="fas fa-arrow-right"></i></button>
      </div>
    `).join('');
  },

  renderAlerts() {
    const alerts = [
      { type: 'alert-warning', icon: 'fa-eye-slash', title: '47 Leads Untouched', sub: 'Leads with no activity in 3+ days', action: 'View All' },
      { type: 'alert-danger', icon: 'fa-clock', title: '23 Follow-ups Overdue', sub: 'Follow-up date passed, no action taken', action: 'Take Action' },
      { type: 'alert-info', icon: 'fa-file-alt', title: '12 Admission Forms Pending', sub: 'Forms submitted but not processed', action: 'Review Now' },
    ];
    const container = document.getElementById('alerts-list');
    if (!container) return;
    container.innerHTML = alerts.map(a => `
      <div class="alert-item ${a.type}" onclick="App.showScreen('leads')">
        <span class="alert-dot"></span>
        <div class="alert-icon"><i class="fas ${a.icon}"></i></div>
        <div class="alert-body">
          <div class="alert-title">${a.title}</div>
          <div class="alert-sub">${a.sub}</div>
        </div>
        <span class="alert-action">${a.action}</span>
      </div>
    `).join('');
  },

  renderCounselorTable() {
    const container = document.getElementById('counselor-table-body');
    if (!container) return;
    const colors = ['#4F6EF7','#10B981','#F59E0B','#8B5CF6','#F97316'];
    container.innerHTML = window.APP_DATA.COUNSELOR_DATA.map((c, i) => `
      <tr>
        <td>
          <div class="counselor-cell">
            <div class="counselor-avatar" style="background:${c.color}">${c.initials}</div>
            <span>${c.name}</span>
          </div>
        </td>
        <td><strong>${c.assigned}</strong></td>
        <td>${c.contacted}</td>
        <td>${c.interested}</td>
        <td><strong>${c.admissions}</strong></td>
        <td>
          <div class="progress-bar-wrap">
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width:${c.rate}%"></div>
            </div>
            <span class="pct-label">${c.rate}%</span>
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderSegmentationChart() {
    const canvas = document.getElementById('chart-segmentation');
    if (!canvas || typeof Chart === 'undefined') return;
    const data = window.APP_DATA.SEGMENTATION_DATA;
    const chartStroke = this.cssVar('--chart-stroke') || 'transparent';
    if (this.charts.seg) this.charts.seg.destroy();
    this.charts.seg = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.value),
          backgroundColor: data.map(d => d.color),
          borderWidth: 3,
          borderColor: chartStroke,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw}%`
            }
          }
        },
        animation: { animateScale: true, duration: 800 }
      }
    });
    // Render legend
    const legendEl = document.getElementById('seg-legend');
    if (legendEl) {
      legendEl.innerHTML = data.map(d => `
        <div class="legend-item">
          <div class="legend-dot" style="background:${d.color}"></div>
          <span class="legend-label">${d.label}</span>
          <span class="legend-value">${d.value}%</span>
        </div>
      `).join('');
    }
  },

  renderStatusChart() {
    const canvas = document.getElementById('chart-status');
    if (!canvas || typeof Chart === 'undefined') return;
    const data = window.APP_DATA.STATUS_DISTRIBUTION;
    const chartStroke = this.cssVar('--chart-stroke') || 'transparent';
    if (this.charts.status) this.charts.status.destroy();
    this.charts.status = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: data.map(d => d.color),
          borderWidth: 3,
          borderColor: chartStroke,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw} (${data[ctx.dataIndex].pct}%)`
            }
          }
        },
        animation: { animateScale: true, duration: 900 }
      }
    });
    const legendEl = document.getElementById('status-legend');
    if (legendEl) {
      legendEl.innerHTML = data.map(d => `
        <div class="legend-item">
          <div class="legend-dot" style="background:${d.color}"></div>
          <span class="legend-label">${d.label}</span>
          <span class="legend-value">${d.count}</span>
          <span class="legend-pct">(${d.pct}%)</span>
        </div>
      `).join('');
    }
  },

  renderFunnelChart() {
    const container = document.getElementById('funnel-container');
    if (!container) return;
    const data = window.APP_DATA.FUNNEL_DATA;
    container.innerHTML = data.map(d => `
      <div class="funnel-stage">
        <span class="funnel-label">${d.label}</span>
        <div class="funnel-bar-outer">
          <div class="funnel-bar-fill" style="width:${d.pct}%; background:${d.color}">
            ${d.pct > 15 ? d.pct + '%' : ''}
          </div>
        </div>
        <span class="funnel-count">${d.count.toLocaleString()}</span>
      </div>
    `).join('');
    setTimeout(() => {
      container.querySelectorAll('.funnel-bar-fill').forEach(bar => {
        bar.style.width = bar.style.width; // Trigger reflow for animation
      });
    }, 50);
  },

  renderMiniCalendar() {
    const now = new Date(2026, 5, 26); // June 26 2026
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    document.getElementById('mini-cal-month-label').textContent = `${monthNames[month]} ${year}`;

    const calData = window.APP_DATA.FOLLOWUP_CALENDAR_DATA;
    let days = '';
    // prev month padding
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days += `<div class="mini-cal-day other-month">${prevDays - i}</div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const ev = calData[dateKey];
      let cls = d === today ? ' today' : '';
      if (ev && ev.overdue > 0) cls += ' has-overdue has-events';
      else if (ev && (ev.pending > 0 || ev.followup > 0)) cls += ' has-events';
      days += `<div class="mini-cal-day${cls}" title="${d} Jun" onclick="DashboardModule.selectMiniCalDay(${d}, this)">${d}</div>`;
    }
    const gridEl = document.getElementById('mini-cal-days');
    if (gridEl) gridEl.innerHTML = days;
  },

  renderTasks() {
    const tasks = [
      { type: 'task-call', icon: 'fa-phone', name: 'Call Rahul Patel', course: 'UPSC Foundation', time: '10:30 AM' },
      { type: 'task-chat', icon: 'fa-comments', name: 'Counseling with Neha Joshi', course: 'GPSC Class 1-2', time: '12:00 PM' },
      { type: 'task-follow', icon: 'fa-redo', name: 'Follow up with Hardik Patel', course: 'UPSC Foundation', time: '02:30 PM' },
      { type: 'task-email', icon: 'fa-envelope', name: 'Send Brochure to Sneha Desai', course: 'Sankalp Programme', time: '04:00 PM' },
    ];
    const container = document.getElementById('tasks-list');
    if (!container) return;
    container.innerHTML = tasks.map(t => `
      <div class="task-item">
        <div class="task-icon ${t.type}"><i class="fas ${t.icon}"></i></div>
        <div class="task-body">
          <div class="task-name">${t.name}</div>
          <div class="task-course">${t.course}</div>
        </div>
        <div class="task-time">${t.time}</div>
      </div>
    `).join('');
  },

  setupDateFilter() {
    const btn = document.getElementById('date-filter-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      // Show simple date picker modal
      const existing = document.getElementById('date-picker-modal');
      if (existing) { existing.remove(); return; }
      const modal = document.createElement('div');
      modal.id = 'date-picker-modal';
      modal.className = 'date-picker-modal';
      modal.innerHTML = `
        <div class="date-picker-panel">
          <h3><i class="fas fa-calendar-alt" style="color:var(--primary);margin-right:8px"></i>Custom Date Range</h3>
          <div class="date-range-row">
            <div class="date-input-group">
              <label>From Date</label>
              <input type="date" id="date-from" value="2026-06-01">
            </div>
            <div class="date-input-group">
              <label>To Date</label>
              <input type="date" id="date-to" value="2026-06-26">
            </div>
          </div>
          <div class="quick-ranges">
            <button class="quick-range-btn active" onclick="DashboardModule.setRange('month',this)">This Month</button>
            <button class="quick-range-btn" onclick="DashboardModule.setRange('week',this)">This Week</button>
            <button class="quick-range-btn" onclick="DashboardModule.setRange('today',this)">Today</button>
            <button class="quick-range-btn" onclick="DashboardModule.setRange('quarter',this)">Quarter</button>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-outline btn-sm" onclick="document.getElementById('date-picker-modal').remove()">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="DashboardModule.applyDateFilter()">
              <i class="fas fa-check"></i> Apply Filter
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    });
  },

  setRange(range, btn) {
    btn.closest('.quick-ranges').querySelectorAll('.quick-range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  applyDateFilter() {
    const from = document.getElementById('date-from')?.value;
    const to = document.getElementById('date-to')?.value;
    const btn = document.getElementById('date-filter-btn');
    if (btn && from && to) {
      btn.innerHTML = `<i class="fas fa-calendar-alt"></i> ${from} → ${to} <i class="fas fa-times" onclick="DashboardModule.clearFilter(event)"></i>`;
      btn.style.borderColor = 'var(--primary)';
      btn.style.color = 'var(--primary)';
    }
    document.getElementById('date-picker-modal')?.remove();
    // Pulse KPI cards
    document.querySelectorAll('.kpi-card').forEach(c => {
      c.style.animation = 'none';
      setTimeout(() => c.style.animation = 'fadeIn 0.4s ease', 50);
    });
    this.randomizeDashboardData();
  },

  setupMiniCalNav() {
    const prev = document.getElementById('mini-prev');
    const next = document.getElementById('mini-next');
    let calMonth = 5; // June
    let calYear = 2026;
    const re = () => {
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      document.getElementById('mini-cal-month-label').textContent = `${monthNames[calMonth]} ${calYear}`;
      const firstDay = new Date(calYear, calMonth, 1).getDay();
      const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
      const prevDays = new Date(calYear, calMonth, 0).getDate();
      const startDay = firstDay === 0 ? 6 : firstDay - 1;
      const calData = window.APP_DATA.FOLLOWUP_CALENDAR_DATA;
      let days = '';
      for (let i = startDay - 1; i >= 0; i--) days += `<div class="mini-cal-day other-month">${prevDays - i}</div>`;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const ev = calData[dateKey];
        let cls = (calYear === 2026 && calMonth === 5 && d === 26) ? ' today' : '';
        if (ev && ev.overdue > 0) cls += ' has-overdue has-events';
        else if (ev && (ev.pending > 0 || ev.followup > 0)) cls += ' has-events';
        days += `<div class="mini-cal-day${cls}" onclick="DashboardModule.selectMiniCalDay(${d}, this)">${d}</div>`;
      }
      const gridEl = document.getElementById('mini-cal-days');
      if (gridEl) gridEl.innerHTML = days;
    };
    prev?.addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } re(); });
    next?.addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } re(); });
  },

  clearFilter(e) {
    e.stopPropagation();
    const btn = document.getElementById('date-filter-btn');
    if (btn) {
      btn.innerHTML = `<i class="fas fa-calendar-alt"></i> Date Filter (Custom)`;
      btn.style.borderColor = '';
      btn.style.color = '';
    }
  },

  setupMiniCalRedirect() {
    const btn = document.getElementById('mini-goto-cal');
    btn?.addEventListener('click', () => {
      App.goToCalendar();
      document.querySelectorAll('.nav-subitem').forEach(i => i.classList.remove('active'));
      const calSubitem = document.querySelector('[data-screen="calendar"]');
      if (calSubitem) calSubitem.classList.add('active');
    });
  },

  selectMiniCalDay(day, element) {
    document.querySelectorAll('.mini-cal-day').forEach(d => d.classList.remove('selected-day'));
    element.classList.add('selected-day');
    const welcome = document.querySelector('.dashboard-welcome');
    if (welcome) {
      welcome.textContent = `June ${day}, 2026 — Showing data for Selected Date`;
    }
    this.randomizeDashboardData();
  },

  randomizeDashboardData() {
    // Randomize KPI values
    const kpiRow = document.getElementById('kpi-row');
    if (kpiRow) {
      const generated = Math.floor(Math.random() * 200) + 50;
      const calls = Math.floor(generated * 0.8);
      const admissions = Math.floor(generated * 0.05) + 1;
      const rate = ((admissions / generated) * 100).toFixed(1) + '%';
      
      const kpis = [
        { cls: 'kpi-leads', icon: 'fa-user-plus', label: 'Leads Generated', value: generated.toLocaleString(), date: 'Selected Day', growth: '+5%', up: true },
        { cls: 'kpi-calls', icon: 'fa-phone', label: 'Voice Calls Done', value: calls.toLocaleString(), date: 'Selected Day', growth: '+2%', up: true },
        { cls: 'kpi-admissions', icon: 'fa-graduation-cap', label: 'Admission Confirmed', value: admissions.toLocaleString(), date: 'Selected Day', growth: '+8%', up: true },
        { cls: 'kpi-rate', icon: 'fa-chart-line', label: 'Conversion Rate', value: rate, date: 'Selected Day', growth: '-1%', up: false },
      ];
      
      kpiRow.innerHTML = kpis.map(k => `
        <div class="kpi-card ${k.cls}">
          <div class="kpi-icon-wrap"><i class="fas ${k.icon}"></i></div>
          <div class="kpi-body">
            <div class="kpi-label">${k.label}</div>
            <div class="kpi-value">${k.value}</div>
            <div class="kpi-meta">
              <span class="${k.up ? 'growth-up' : 'growth-down'}">
                <i class="fas fa-arrow-${k.up ? 'up' : 'down'}"></i>${k.growth}
              </span>
              <span class="kpi-date">${k.date}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Randomize counselor data
    window.APP_DATA.COUNSELOR_DATA.forEach(c => {
      c.assigned = Math.floor(Math.random() * 30) + 5;
      c.contacted = Math.floor(c.assigned * 0.8);
      c.interested = Math.floor(c.contacted * 0.5);
      c.admissions = Math.floor(c.interested * 0.3);
      c.rate = c.assigned > 0 ? parseFloat(((c.admissions / c.assigned) * 100).toFixed(1)) : 0;
    });
    this.renderCounselorTable();

    // Randomize charts data
    window.APP_DATA.SEGMENTATION_DATA.forEach(d => {
      d.value = Math.floor(Math.random() * 40) + 10;
    });
    const totalSeg = window.APP_DATA.SEGMENTATION_DATA.reduce((sum, d) => sum + d.value, 0);
    window.APP_DATA.SEGMENTATION_DATA.forEach(d => {
      d.value = Math.round((d.value / totalSeg) * 100);
    });
    this.renderSegmentationChart();

    window.APP_DATA.STATUS_DISTRIBUTION.forEach(d => {
      d.count = Math.floor(Math.random() * 100) + 10;
    });
    const totalStatus = window.APP_DATA.STATUS_DISTRIBUTION.reduce((sum, d) => sum + d.count, 0);
    window.APP_DATA.STATUS_DISTRIBUTION.forEach(d => {
      d.pct = Math.round((d.count / totalStatus) * 100);
    });
    this.renderStatusChart();

    // Randomize Funnel Data
    let lastFunnel = Math.floor(Math.random() * 500) + 100;
    window.APP_DATA.FUNNEL_DATA.forEach((d, idx) => {
      if (idx === 0) d.count = lastFunnel;
      else {
        d.count = Math.floor(lastFunnel * (0.8 - idx * 0.15));
        lastFunnel = d.count;
      }
      d.pct = Math.round((d.count / window.APP_DATA.FUNNEL_DATA[0].count) * 100);
    });
    this.renderFunnelChart();

    // Randomize Today's Tasks
    const names = ['Rahul Patel', 'Neha Joshi', 'Hardik Patel', 'Sneha Desai', 'Naimesh', 'Banoth Mahesh', 'Amit Kumar', 'Priya Sharma'];
    const courses = ['UPSC Foundation', 'GPSC Class 1-2', 'Sankalp Programme', 'IAS/IPS'];
    const tasks = [
      { type: 'task-call', icon: 'fa-phone', name: `Call ${names[Math.floor(Math.random()*names.length)]}`, course: courses[Math.floor(Math.random()*courses.length)], time: '10:30 AM' },
      { type: 'task-chat', icon: 'fa-comments', name: `Counseling with ${names[Math.floor(Math.random()*names.length)]}`, course: courses[Math.floor(Math.random()*courses.length)], time: '12:00 PM' },
      { type: 'task-follow', icon: 'fa-redo', name: `Follow up with ${names[Math.floor(Math.random()*names.length)]}`, course: courses[Math.floor(Math.random()*courses.length)], time: '02:30 PM' },
      { type: 'task-email', icon: 'fa-envelope', name: `Send Brochure to ${names[Math.floor(Math.random()*names.length)]}`, course: courses[Math.floor(Math.random()*courses.length)], time: '04:00 PM' },
    ];
    const container = document.getElementById('tasks-list');
    if (container) {
      container.innerHTML = tasks.map(t => `
        <div class="task-item">
          <div class="task-icon ${t.type}"><i class="fas ${t.icon}"></i></div>
          <div class="task-body">
            <div class="task-name">${t.name}</div>
            <div class="task-course">${t.course}</div>
          </div>
          <div class="task-time">${t.time}</div>
        </div>
      `).join('');
    }
  }
};
