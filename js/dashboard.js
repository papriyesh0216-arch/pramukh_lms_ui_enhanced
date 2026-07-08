// ============================================================
// DASHBOARD.JS — Student Inquiry Dashboard Logic
// ============================================================

const DashboardModule = {
  charts: {},
  kpiResizeBound: false,

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
    this.renderMiniCalendar();
    this.renderTasks();
    this.renderRecentActivities();
    setTimeout(() => {
      this.renderSegmentationChart();
      this.renderStatusChart();
      this.renderFunnelChart();
    }, 100);
    this.setupDateFilter();
    this.setupJourneyCourseFilter();
    this.setupMiniCalNav();
    this.setupMiniCalRedirect();
  },

  getScopedLeads() {
    const leads = window.APP_DATA?.LEAD_DATA || [];
    const scoped = window.AuthModule ? AuthModule.applyScope(leads).filter(l => !l.archived) : leads.filter(l => !l.archived);
    return scoped;
  },

  getKpiGridColumns() {
    if (window.innerWidth <= 760) return '1fr';
    if (window.innerWidth <= 1100) return 'repeat(2, minmax(0, 1fr))';
    return 'repeat(3, minmax(0, 1fr))';
  },

  applyKpiGridLayout(container) {
    if (!container) return;
    container.style.setProperty('display', 'grid', 'important');
    container.style.setProperty('grid-template-columns', this.getKpiGridColumns(), 'important');
    container.style.setProperty('gap', '16px', 'important');
    if (!this.kpiResizeBound) {
      this.kpiResizeBound = true;
      window.addEventListener('resize', () => {
        const row = document.getElementById('kpi-row');
        if (row) row.style.setProperty('grid-template-columns', this.getKpiGridColumns(), 'important');
      });
    }
  },

  renderKpiCards(kpis) {
    const container = document.getElementById('kpi-row');
    if (!container) return;
    this.applyKpiGridLayout(container);
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

  renderKPIs() {
    const scopedLeads = this.getScopedLeads();
    const total = scopedLeads.length;
    const pending = scopedLeads.filter(l => ['new', 'pending'].includes(l.status)).length;
    const followups = scopedLeads.filter(l => l.followupDate).length;
    const counselling = scopedLeads.filter(l => /counselling/i.test(l.stageLabel || l.statusLabel || '')).length;
    const converted = scopedLeads.filter(l => ['admission_confirmed', 'converted'].includes(l.status)).length;
    const closed = scopedLeads.filter(l => ['lost', 'closed', 'admission_rejected'].includes(l.status)).length;
    const kpis = [
      { cls: 'kpi-leads', icon: 'fa-users', label: 'Total Leads', value: total.toLocaleString(), date: window.AuthModule?.profile?.scopeLine || 'This Month', growth: '+18%', up: true },
      { cls: 'kpi-calls', icon: 'fa-user-plus', label: 'Pending Leads', value: pending.toLocaleString(), date: 'New Inquiry', growth: '+11%', up: true },
      { cls: 'kpi-followup', icon: 'fa-calendar-day', label: 'Follow-ups Due', value: followups.toLocaleString(), date: 'Today', growth: '+6%', up: false },
      { cls: 'kpi-counselling', icon: 'fa-comments', label: 'Counselling Scheduled', value: counselling.toLocaleString(), date: 'Today', growth: '+9%', up: true },
      { cls: 'kpi-converted', icon: 'fa-graduation-cap', label: 'Total Admission Form', value: converted.toLocaleString(), date: 'This Month', growth: '+20%', up: true },
      { cls: 'kpi-lost', icon: 'fa-user-times', label: 'Close Leads', value: closed.toLocaleString(), date: 'This Month', growth: '-2%', up: true },
    ];
    this.renderKpiCards(kpis);
  },

  renderLeadJourneyAnalytics() {
    const container = document.getElementById('dashboard-journey-analytics');
    if (!container) return;
    const selectedCourse = document.getElementById('dashboard-journey-course')?.value || 'all';
    const scopedLeads = this.getScopedLeads();
    const baseTotal = Math.max((window.APP_DATA?.LEAD_DATA || []).filter(l => !l.archived).length, 1);
    const scopeFactor = Math.max(scopedLeads.length / baseTotal, scopedLeads.length ? 0.08 : 0);
    const courseFactor = { all: 1, upsc: 0.42, gpsc: 0.31, sankalp: 0.18 }[selectedCourse] || 1;
    const stages = [
      { name: 'Inquiry Created', count: 2350, pct: 100, state: 'done' },
      { name: 'Lead Assigned', count: 2214, pct: 94, state: 'done' },
      { name: 'First Contact', count: 1876, pct: 80, state: 'done' },
      { name: 'Follow-up', count: 987, pct: 42, state: 'current' },
      { name: 'Counselling', count: 423, pct: 18, state: 'current' },
      { name: 'Qualified Lead', count: 235, pct: 10, state: 'upcoming' },
      { name: 'Admission Form Started', count: 146, pct: 6, state: 'upcoming' },
      { name: 'Fee Paid', count: 104, pct: 4, state: 'upcoming' },
      { name: 'Student Created', count: 94, pct: 4, state: 'upcoming' }
    ];
    container.innerHTML = stages.map(stage => `
      <div class="journey-analytics-step ${stage.state}">
        <div class="journey-step-head">
          <span>${stage.name}</span>
          <strong>${Math.max(scopedLeads.length ? 1 : 0, Math.round(stage.count * scopeFactor * courseFactor)).toLocaleString()}</strong>
        </div>
        <div class="journey-progress-track"><div class="journey-progress-fill" style="width:${stage.pct}%"></div></div>
        <div class="journey-step-meta">${stage.pct}% of inquiries</div>
      </div>
    `).join('');
  },

  setupJourneyCourseFilter() {
    document.getElementById('dashboard-journey-course')?.addEventListener('change', () => this.renderLeadJourneyAnalytics());
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
          <div><div class="metric-name">${m.name}</div><div class="metric-desc">${m.desc}</div></div>
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
        <span class="alert-dot"></span><div class="alert-icon"><i class="fas ${a.icon}"></i></div>
        <div class="alert-body"><div class="alert-title">${a.title}</div><div class="alert-sub">${a.sub}</div></div>
        <span class="alert-action">${a.action}</span>
      </div>
    `).join('');
  },

  renderCounselorTable() {
    const container = document.getElementById('counselor-table-body');
    if (!container) return;
    const auth = window.DEMO_AUTH || {};
    const rows = (window.APP_DATA.COUNSELOR_DATA || []).filter(c => {
      if (auth.role === 'counselor') return c.name === auth.user;
      if (auth.role === 'hod') return ['Bharat Sir', 'Hary Sir'].includes(c.name);
      return true;
    });
    container.innerHTML = rows.map(c => `
      <tr>
        <td><div class="counselor-cell"><div class="counselor-avatar" style="background:${c.color}">${c.initials}</div><span>${c.name}</span></div></td>
        <td><strong>${c.assigned}</strong></td><td>${c.contacted}</td><td>${c.interested}</td><td><strong>${c.admissions}</strong></td>
        <td><div class="progress-bar-wrap"><div class="progress-bar"><div class="progress-bar-fill" style="width:${c.rate}%"></div></div><span class="pct-label">${c.rate}%</span></div></td>
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
      data: { labels: data.map(d => d.label), datasets: [{ data: data.map(d => d.value), backgroundColor: data.map(d => d.color), borderWidth: 3, borderColor: chartStroke, hoverOffset: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` } } }, animation: { animateScale: true, duration: 800 } }
    });
    const legendEl = document.getElementById('seg-legend');
    if (legendEl) legendEl.innerHTML = data.map(d => `<div class="legend-item"><div class="legend-dot" style="background:${d.color}"></div><span class="legend-label">${d.label}</span><span class="legend-value">${d.value}%</span></div>`).join('');
  },

  renderStatusChart() {
    const canvas = document.getElementById('chart-status');
    if (!canvas || typeof Chart === 'undefined') return;
    const data = window.APP_DATA.STATUS_DISTRIBUTION;
    const chartStroke = this.cssVar('--chart-stroke') || 'transparent';
    if (this.charts.status) this.charts.status.destroy();
    this.charts.status = new Chart(canvas, {
      type: 'doughnut',
      data: { labels: data.map(d => d.label), datasets: [{ data: data.map(d => d.count), backgroundColor: data.map(d => d.color), borderWidth: 3, borderColor: chartStroke, hoverOffset: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} (${data[ctx.dataIndex].pct}%)` } } }, animation: { animateScale: true, duration: 900 } }
    });
    const legendEl = document.getElementById('status-legend');
    if (legendEl) legendEl.innerHTML = data.map(d => `<div class="legend-item"><div class="legend-dot" style="background:${d.color}"></div><span class="legend-label">${d.label}</span><span class="legend-value">${d.count}</span><span class="legend-pct">(${d.pct}%)</span></div>`).join('');
  },

  renderFunnelChart() {
    const container = document.getElementById('funnel-container');
    if (!container) return;
    const data = window.APP_DATA.FUNNEL_DATA;
    container.innerHTML = data.map(d => `
      <div class="funnel-stage"><span class="funnel-label">${d.label}</span><div class="funnel-bar-outer"><div class="funnel-bar-fill" style="width:${d.pct}%; background:${d.color}">${d.pct > 15 ? d.pct + '%' : ''}</div></div><span class="funnel-count">${d.count.toLocaleString()}</span></div>
    `).join('');
  },

  renderMiniCalendar() {
    const now = new Date(2026, 5, 26);
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();
    const label = document.getElementById('mini-cal-month-label');
    if (label) label.textContent = `${monthNames[month]} ${year}`;
    const calData = window.APP_DATA.FOLLOWUP_CALENDAR_DATA;
    let days = '';
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) days += `<div class="mini-cal-day other-month">${prevDays - i}</div>`;
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
      { type: 'task-call', icon: 'fa-user-plus', name: 'New inquiry review - Rahul Patel', course: 'UPSC Foundation', time: '09:45 AM' },
      { type: 'task-chat', icon: 'fa-comments', name: 'Counselling with Neha Joshi', course: 'GPSC Class 1-2', time: '12:00 PM' },
      { type: 'task-follow', icon: 'fa-redo', name: 'Follow-up with Hardik Patel', course: 'UPSC Foundation', time: '02:30 PM' },
      { type: 'task-email', icon: 'fa-list-check', name: 'Pending task: send brochure to Sneha', course: 'Sankalp Programme', time: '04:00 PM' },
    ];
    const container = document.getElementById('tasks-list');
    if (!container) return;
    container.innerHTML = tasks.map(t => `<div class="task-item"><div class="task-icon ${t.type}"><i class="fas ${t.icon}"></i></div><div class="task-body"><div class="task-name">${t.name}</div><div class="task-course">${t.course}</div></div><div class="task-time">${t.time}</div></div>`).join('');
  },

  renderRecentActivities() {
    const container = document.getElementById('recent-activities-list');
    if (!container) return;
    const items = [
      { type: 'task-call', icon: 'fa-user-plus', name: 'Inquiry created - Rahul Patel', course: 'Website Inquiry Form', time: '09:30 AM' },
      { type: 'task-follow', icon: 'fa-user-check', name: 'Assigned to Bharat Sir', course: 'Manual assignment', time: '09:24 AM' },
      { type: 'task-chat', icon: 'fa-calendar-check', name: 'Follow-up completed', course: 'Outcome: Interested', time: '09:18 AM' },
      { type: 'task-email', icon: 'fa-comments', name: 'Counselling scheduled', course: 'Parent meeting requested', time: '09:05 AM' },
      { type: 'task-call', icon: 'fa-graduation-cap', name: 'Converted to admission', course: 'Admission Form Started', time: '08:57 AM' }
    ];
    container.innerHTML = items.map(item => `<div class="task-item"><div class="task-icon ${item.type}"><i class="fas ${item.icon}"></i></div><div class="task-body"><div class="task-name">${item.name}</div><div class="task-course">${item.course}</div></div><div class="task-time">${item.time}</div></div>`).join('');
  },

  setupDateFilter() {
    const btn = document.getElementById('date-filter-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const existing = document.getElementById('date-picker-modal');
      if (existing) { existing.remove(); return; }
      const modal = document.createElement('div');
      modal.id = 'date-picker-modal';
      modal.className = 'date-picker-modal';
      modal.innerHTML = `
        <div class="date-picker-panel">
          <h3><i class="fas fa-calendar-alt" style="color:var(--primary);margin-right:8px"></i>Custom Date Range</h3>
          <div class="date-range-row">
            <div class="date-input-group"><label>From Date</label><input type="date" id="date-from" value="2026-06-01"></div>
            <div class="date-input-group"><label>To Date</label><input type="date" id="date-to" value="2026-06-26"></div>
          </div>
          <div class="quick-ranges">
            <button class="quick-range-btn active" onclick="DashboardModule.setRange('month',this)">This Month</button>
            <button class="quick-range-btn" onclick="DashboardModule.setRange('week',this)">This Week</button>
            <button class="quick-range-btn" onclick="DashboardModule.setRange('today',this)">Today</button>
            <button class="quick-range-btn" onclick="DashboardModule.setRange('quarter',this)">Quarter</button>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-outline btn-sm" onclick="document.getElementById('date-picker-modal').remove()">Cancel</button><button class="btn btn-primary btn-sm" onclick="DashboardModule.applyDateFilter()"><i class="fas fa-check"></i> Apply Filter</button></div>
        </div>`;
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
    this.randomizeDashboardData();
  },

  setupMiniCalNav() {
    const prev = document.getElementById('mini-prev');
    const next = document.getElementById('mini-next');
    let calMonth = 5;
    let calYear = 2026;
    const render = () => {
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const label = document.getElementById('mini-cal-month-label');
      if (label) label.textContent = `${monthNames[calMonth]} ${calYear}`;
    };
    prev?.addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } render(); });
    next?.addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } render(); });
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
    if (welcome) welcome.textContent = `June ${day}, 2026 — Showing data for Selected Date`;
    this.randomizeDashboardData();
  },

  randomizeDashboardData() {
    const generated = Math.floor(Math.random() * 200) + 50;
    const pending = Math.floor(generated * 0.2);
    const followups = Math.floor(generated * 0.12);
    const counselling = Math.floor(generated * 0.08);
    const admissions = Math.floor(generated * 0.05) + 1;
    const closed = Math.floor(generated * 0.04);
    this.renderKpiCards([
      { cls: 'kpi-leads', icon: 'fa-users', label: 'Total Leads', value: generated.toLocaleString(), date: 'Selected Day', growth: '+5%', up: true },
      { cls: 'kpi-calls', icon: 'fa-user-plus', label: 'Pending Leads', value: pending.toLocaleString(), date: 'Selected Day', growth: '+2%', up: true },
      { cls: 'kpi-followup', icon: 'fa-calendar-day', label: 'Follow-ups Due', value: followups.toLocaleString(), date: 'Selected Day', growth: '+6%', up: false },
      { cls: 'kpi-counselling', icon: 'fa-comments', label: 'Counselling Scheduled', value: counselling.toLocaleString(), date: 'Selected Day', growth: '+9%', up: true },
      { cls: 'kpi-converted', icon: 'fa-graduation-cap', label: 'Total Admission Form', value: admissions.toLocaleString(), date: 'Selected Day', growth: '+8%', up: true },
      { cls: 'kpi-lost', icon: 'fa-user-times', label: 'Close Leads', value: closed.toLocaleString(), date: 'Selected Day', growth: '-2%', up: true },
    ]);

    window.APP_DATA.COUNSELOR_DATA.forEach(c => {
      c.assigned = Math.floor(Math.random() * 30) + 5;
      c.contacted = Math.floor(c.assigned * 0.8);
      c.interested = Math.floor(c.contacted * 0.5);
      c.admissions = Math.floor(c.interested * 0.3);
      c.rate = c.assigned > 0 ? parseFloat(((c.admissions / c.assigned) * 100).toFixed(1)) : 0;
    });
    this.renderCounselorTable();
    this.renderSegmentationChart();
    this.renderStatusChart();
    this.renderFunnelChart();
    this.renderTasks();
  }
};
