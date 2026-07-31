// ============================================================
// DASHBOARD.JS — Student Inquiry Dashboard Logic
// ============================================================

const DashboardModule = {
  charts: {},
  kpiResizeBound: false,
  dashboardActivityView: 'calendar',
  dashboardActivityTimer: null,
  dashboardActivityOrder: ['calendar', 'today', 'recent'],
  dashboardDateFrom: '',
  dashboardDateTo: '',
  dashboardSelectedDate: '',
  miniCalendarDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),

  cssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  },

  refreshTheme() {
    this.renderSegmentationChart();
    this.renderStatusChart();
  },

  init() {
    this.injectDashboardGoalStyles();
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
      this.applyDashboardGoalLayout();
      this.startDashboardActivityCarousel();
    }, 100);
    this.setupDateFilter();
    this.setupJourneyCourseFilter();
    this.setupMiniCalNav();
    this.setupMiniCalRedirect();
    this.applyDashboardGoalLayout();
    this.startDashboardActivityCarousel();
  },

  injectDashboardGoalStyles() {
    if (document.getElementById('dashboard-goal-layout-style')) return;
    const style = document.createElement('style');
    style.id = 'dashboard-goal-layout-style';
    style.textContent = `
      #screen-dashboard #kpi-row { display:grid !important; grid-template-columns:repeat(6,minmax(0,1fr)) !important; gap:12px !important; margin-bottom:18px !important; }
      #screen-dashboard #kpi-row .kpi-card { min-height:92px !important; padding:12px 14px !important; gap:10px !important; align-items:center !important; border-radius:16px !important; }
      #screen-dashboard #kpi-row .kpi-icon-wrap { width:38px !important; height:38px !important; min-width:38px !important; border-radius:12px !important; font-size:15px !important; }
      #screen-dashboard #kpi-row .kpi-label { font-size:9.5px !important; line-height:1.15 !important; margin-bottom:4px !important; white-space:normal !important; }
      #screen-dashboard #kpi-row .kpi-value { font-size:22px !important; line-height:1 !important; margin-bottom:4px !important; }
      #screen-dashboard #kpi-row .kpi-meta { gap:4px !important; font-size:10px !important; flex-wrap:wrap !important; }
      #screen-dashboard .alerts-card { display:none !important; }

      #screen-dashboard #dashboard-insights { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:16px !important; align-items:stretch !important; }
      #screen-dashboard #dashboard-kpis { grid-column:1/-1 !important; width:100% !important; }
      #screen-dashboard #dashboard-insights > .chart-card { grid-column:auto !important; grid-row:auto !important; width:100% !important; min-width:0 !important; min-height:270px !important; }
      #screen-dashboard #dashboard-insights > .chart-card .chart-body { height:150px !important; }
      #screen-dashboard #dashboard-insights > .chart-card #funnel-container { min-height:150px !important; }

      #screen-dashboard .dashboard-performance-calendar-row { display:grid !important; grid-template-columns:minmax(0,1fr) minmax(0,1fr) !important; gap:16px !important; align-items:stretch !important; margin:16px 0 14px !important; }
      #screen-dashboard .dashboard-performance-calendar-row .table-card,
      #screen-dashboard .dashboard-performance-calendar-row .dashboard-right-panel { grid-column:auto !important; grid-row:auto !important; width:100% !important; min-width:0 !important; margin:0 !important; }
      #screen-dashboard .dashboard-performance-calendar-row .table-card { overflow-x:auto !important; }
      #screen-dashboard .dashboard-performance-calendar-row .data-table { min-width:640px !important; }

      #screen-dashboard #dashboard-support { position:relative !important; min-height:410px !important; overflow:hidden !important; border-radius:24px !important; background:rgba(255,255,255,.94) !important; border:1px solid rgba(16,56,96,.10) !important; box-shadow:0 18px 42px rgba(16,56,96,.10) !important; }
      body.dark #screen-dashboard #dashboard-support { background:rgba(15,34,56,.9) !important; border-color:rgba(255,255,255,.10) !important; }
      #screen-dashboard #dashboard-support .dashboard-carousel-slide { position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; margin:0 !important; border:0 !important; border-radius:24px !important; box-shadow:none !important; opacity:0 !important; pointer-events:none !important; transform:translateX(18px) scale(.985) !important; transition:opacity .45s ease, transform .45s ease !important; overflow:auto !important; }
      #screen-dashboard #dashboard-support .dashboard-carousel-slide.dashboard-activity-active { opacity:1 !important; pointer-events:auto !important; transform:translateX(0) scale(1) !important; }
      #screen-dashboard #dashboard-support .mini-calendar-card.dashboard-carousel-slide { padding:14px 16px 16px !important; }
      #screen-dashboard #dashboard-support .tasks-card.dashboard-carousel-slide { padding:18px !important; background:transparent !important; }
      #screen-dashboard #dashboard-support .tasks-list { max-height:none !important; }
      #screen-dashboard #dashboard-support .mini-cal-header { border-radius:18px !important; padding:12px !important; background:linear-gradient(135deg,var(--academy-blue,#003860),#6d28d9) !important; color:#fff !important; }
      #screen-dashboard #dashboard-support .mini-cal-title { color:#fff !important; font-weight:900 !important; }
      #screen-dashboard #dashboard-support .mini-cal-nav { background:rgba(255,255,255,.92) !important; color:var(--academy-blue,#003860) !important; }
      #screen-dashboard #dashboard-support .mini-cal-days { min-height:210px !important; }

      #screen-dashboard .dashboard-activity-switcher { position:absolute !important; top:50% !important; transform:translateY(-50%) !important; z-index:20 !important; width:36px !important; height:36px !important; border-radius:999px !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; border:1px solid rgba(16,56,96,.16) !important; background:rgba(255,255,255,.96) !important; color:var(--academy-blue,#003860) !important; box-shadow:0 10px 24px rgba(16,56,96,.18) !important; cursor:pointer !important; }
      #screen-dashboard .dashboard-activity-switcher:hover { background:linear-gradient(135deg,var(--academy-blue,#003860),var(--primary,#0077B6)) !important; color:#fff !important; }
      #screen-dashboard .dashboard-activity-switcher.prev { left:10px !important; }
      #screen-dashboard .dashboard-activity-switcher.next { right:10px !important; }
      #screen-dashboard .dashboard-activity-dots { position:absolute !important; left:50% !important; bottom:12px !important; transform:translateX(-50%) !important; z-index:21 !important; display:flex !important; gap:6px !important; }
      #screen-dashboard .dashboard-activity-dot { width:7px !important; height:7px !important; border-radius:999px !important; background:rgba(16,56,96,.22) !important; }
      #screen-dashboard .dashboard-activity-dot.active { width:18px !important; background:var(--academy-blue,#003860) !important; }

      @media (max-width:1440px){ #screen-dashboard #kpi-row{grid-template-columns:repeat(3,minmax(0,1fr)) !important;} }
      @media (max-width:1100px){ #screen-dashboard .dashboard-performance-calendar-row,#screen-dashboard #dashboard-insights{grid-template-columns:1fr !important;} #screen-dashboard #kpi-row{grid-template-columns:repeat(2,minmax(0,1fr)) !important;} }
      @media (max-width:760px){ #screen-dashboard #kpi-row{grid-template-columns:1fr !important;} #screen-dashboard #dashboard-support{min-height:390px !important;} }
    `;
    document.head.appendChild(style);
  },

  getScopedLeads() {
    const leads = (typeof LeadsModule !== 'undefined' && LeadsModule.leads?.length)
      ? LeadsModule.leads
      : (window.APP_DATA?.LEAD_DATA || []);
    return window.AuthModule ? AuthModule.applyScope(leads).filter(l => !l.archived) : leads.filter(l => !l.archived);
  },

  dateKey(value) {
    if (!value) return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }
    if (typeof CalendarModule !== 'undefined' && CalendarModule.parseDateKey) {
      return CalendarModule.parseDateKey(value);
    }
    const match = String(value).trim().match(/(\d{1,2})[-/\s]([A-Za-z]{3,}|\d{1,2})[-/\s](\d{4})/);
    if (!match) return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : '';
    const months = { jan:1, january:1, feb:2, february:2, mar:3, march:3, apr:4, april:4, may:5, jun:6, june:6, jul:7, july:7, aug:8, august:8, sep:9, september:9, oct:10, october:10, nov:11, november:11, dec:12, december:12 };
    const month = Number(match[2]) || months[match[2].toLowerCase()];
    return month ? `${match[3]}-${String(month).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}` : '';
  },

  getDashboardLeads() {
    return this.getScopedLeads().filter((lead) => {
      const key = this.dateKey(lead.inquiryDate || lead.createdAt || lead.assignedDate);
      if (this.dashboardSelectedDate && key !== this.dashboardSelectedDate) return false;
      if (this.dashboardDateFrom && (!key || key < this.dashboardDateFrom)) return false;
      if (this.dashboardDateTo && (!key || key > this.dashboardDateTo)) return false;
      return true;
    });
  },

  refreshDataDrivenViews() {
    this.renderKPIs();
    this.renderMetrics();
    this.renderCounselorTable();
    this.renderSegmentationChart();
    this.renderStatusChart();
    this.renderFunnelChart();
    this.renderMiniCalendar();
    this.renderTasks();
    this.renderRecentActivities();
    this.applyDashboardGoalLayout();
  },

  getKpiGridColumns() {
    if (window.innerWidth <= 760) return '1fr';
    if (window.innerWidth <= 1100) return 'repeat(2, minmax(0, 1fr))';
    if (window.innerWidth <= 1440) return 'repeat(3, minmax(0, 1fr))';
    return 'repeat(6, minmax(0, 1fr))';
  },

  applyKpiGridLayout(container) {
    if (!container) return;
    container.style.setProperty('display', 'grid', 'important');
    container.style.setProperty('grid-template-columns', this.getKpiGridColumns(), 'important');
    container.style.setProperty('gap', '12px', 'important');
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
          <div class="kpi-meta"><span class="${k.up ? 'growth-up' : 'growth-down'}"><i class="fas fa-arrow-${k.up ? 'up' : 'down'}"></i>${k.growth}</span><span class="kpi-date">${k.date}</span></div>
        </div>
      </div>`).join('');
  },

  renderKPIs() {
    const scopedLeads = this.getDashboardLeads();
    const total = scopedLeads.length;
    const pending = scopedLeads.filter(l => ['new', 'pending'].includes(l.status)).length;
    const todayKey = this.dateKey(new Date());
    const followups = scopedLeads.filter(l => this.dateKey(l.followupDate) === todayKey).length;
    const counselling = scopedLeads.filter(l => /counselling/i.test(l.stageLabel || l.statusLabel || '')).length;
    const converted = scopedLeads.filter(l => ['admission_confirmed', 'converted'].includes(l.status)).length;
    const closed = scopedLeads.filter(l => ['lost', 'closed', 'admission_rejected'].includes(l.status)).length;
    this.renderKpiCards([
      { cls: 'kpi-leads', icon: 'fa-users', label: 'Total Leads', value: total.toLocaleString(), date: window.AuthModule?.profile?.scopeLine || 'Current Scope', growth: 'Live', up: true },
      { cls: 'kpi-calls', icon: 'fa-user-plus', label: 'Pending Leads', value: pending.toLocaleString(), date: 'New Inquiry', growth: 'Live', up: true },
      { cls: 'kpi-followup', icon: 'fa-calendar-day', label: 'Follow-ups Due', value: followups.toLocaleString(), date: 'Today', growth: 'Live', up: followups === 0 },
      { cls: 'kpi-counselling', icon: 'fa-comments', label: 'Counselling Scheduled', value: counselling.toLocaleString(), date: 'Current Scope', growth: 'Live', up: true },
      { cls: 'kpi-converted', icon: 'fa-graduation-cap', label: 'Total Admission Form', value: converted.toLocaleString(), date: 'Current Scope', growth: 'Live', up: true },
      { cls: 'kpi-lost', icon: 'fa-user-times', label: 'Close Leads', value: closed.toLocaleString(), date: 'Current Scope', growth: 'Live', up: closed === 0 },
    ]);
  },

  applyDashboardGoalLayout() {
    this.injectDashboardGoalStyles();
    this.preparePerformanceCalendarLayout();
    this.updateActivityPanelVisibility();
  },

  preparePerformanceCalendarLayout() {
    const insights = document.getElementById('dashboard-insights');
    const table = document.querySelector('#screen-dashboard .table-card');
    const support = document.getElementById('dashboard-support');
    if (!insights || !table || !support) return;

    let row = document.getElementById('dashboard-performance-calendar-row');
    if (!row) {
      row = document.createElement('div');
      row.id = 'dashboard-performance-calendar-row';
      row.className = 'dashboard-performance-calendar-row';
      insights.insertAdjacentElement('afterend', row);
    }
    if (table.parentElement !== row) row.appendChild(table);
    if (support.parentElement !== row) row.appendChild(support);

    this.prepareActivityCarousel(support);
  },

  prepareActivityCarousel(support) {
    if (!support || support.dataset.carouselReady === 'true') return;
    support.dataset.carouselReady = 'true';

    const calendarCard = support.querySelector('.mini-calendar-card');
    const todayCard = support.querySelector('.tasks-card:not(.recent-activities-card)');
    const recentCard = support.querySelector('.recent-activities-card');

    calendarCard?.classList.add('dashboard-carousel-slide', 'dashboard-calendar-card');
    todayCard?.classList.add('dashboard-carousel-slide', 'dashboard-today-activity-card');
    recentCard?.classList.add('dashboard-carousel-slide', 'dashboard-recent-activity-card');

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'dashboard-activity-switcher prev';
    prev.title = 'Previous panel';
    prev.setAttribute('aria-label', 'Previous panel');
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'dashboard-activity-switcher next';
    next.title = 'Next panel';
    next.setAttribute('aria-label', 'Next panel');
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';

    const dots = document.createElement('div');
    dots.className = 'dashboard-activity-dots';
    dots.innerHTML = this.dashboardActivityOrder.map(v => `<span class="dashboard-activity-dot" data-view="${v}"></span>`).join('');

    prev.addEventListener('click', () => this.stepDashboardActivity(-1, true));
    next.addEventListener('click', () => this.stepDashboardActivity(1, true));
    support.appendChild(prev);
    support.appendChild(next);
    support.appendChild(dots);
  },

  stepDashboardActivity(direction = 1, restart = false) {
    const idx = this.dashboardActivityOrder.indexOf(this.dashboardActivityView);
    const nextIndex = (idx + direction + this.dashboardActivityOrder.length) % this.dashboardActivityOrder.length;
    this.dashboardActivityView = this.dashboardActivityOrder[nextIndex];
    this.updateActivityPanelVisibility();
    if (restart) this.startDashboardActivityCarousel();
  },

  startDashboardActivityCarousel() {
    if (this.dashboardActivityTimer) clearInterval(this.dashboardActivityTimer);
    this.dashboardActivityTimer = setInterval(() => this.stepDashboardActivity(1, false), 2000);
  },

  updateActivityPanelVisibility() {
    const support = document.getElementById('dashboard-support');
    if (!support) return;
    support.querySelector('.dashboard-calendar-card')?.classList.toggle('dashboard-activity-active', this.dashboardActivityView === 'calendar');
    support.querySelector('.dashboard-today-activity-card')?.classList.toggle('dashboard-activity-active', this.dashboardActivityView === 'today');
    support.querySelector('.dashboard-recent-activity-card')?.classList.toggle('dashboard-activity-active', this.dashboardActivityView === 'recent');
    support.querySelectorAll('.dashboard-activity-dot').forEach(dot => dot.classList.toggle('active', dot.dataset.view === this.dashboardActivityView));
  },

  renderLeadJourneyAnalytics() {
    const container = document.getElementById('dashboard-journey-analytics');
    if (!container) return;
    container.innerHTML = '';
  },

  setupJourneyCourseFilter() {
    document.getElementById('dashboard-journey-course')?.addEventListener('change', () => this.renderLeadJourneyAnalytics());
  },

  renderMetrics() {
    const leads = this.getDashboardLeads();
    const todayKey = this.dateKey(new Date());
    const metrics = [
      { cls: 'metric-untouch', icon: 'fa-eye-slash', name: 'Untouched Leads', count: leads.filter((lead) => !(lead.communications || []).length).length, desc: 'Never Contacted' },
      { cls: 'metric-overdue', icon: 'fa-clock', name: 'Overdue Follow-ups', count: leads.filter((lead) => { const key = this.dateKey(lead.followupDate); return key && key < todayKey; }).length, desc: 'Past Due Date' },
      { cls: 'metric-hot', icon: 'fa-fire', name: 'Hot Leads', count: leads.filter((lead) => lead.isHot || String(lead.priority).toLowerCase() === 'high').length, desc: 'High Priority' },
    ];
    const container = document.getElementById('kpi-metrics-row');
    if (!container) return;
    container.innerHTML = metrics.map(m => `
      <div class="metric-card ${m.cls}" onclick="App.showScreen('leads')">
        <div class="metric-top"><div><div class="metric-name">${m.name}</div><div class="metric-desc">${m.desc}</div></div><div class="metric-icon-wrap"><i class="fas ${m.icon}"></i></div></div>
        <div class="metric-count">${m.count}</div>
        <button class="metric-view-btn">View Leads <i class="fas fa-arrow-right"></i></button>
      </div>`).join('');
  },

  renderAlerts() {
    const alertsCard = document.querySelector('#screen-dashboard .alerts-card');
    if (alertsCard) alertsCard.style.display = 'none';
    const container = document.getElementById('alerts-list');
    if (container) container.innerHTML = '';
  },

  renderCounselorTable() {
    const container = document.getElementById('counselor-table-body');
    if (!container) return;
    const auth = window.DEMO_AUTH || {};
    const leads = this.getDashboardLeads();
    const rows = (window.APP_DATA.COUNSELOR_DATA || []).filter(c => {
      if (auth.role === 'counselor') return c.name === auth.user;
      if (auth.role === 'hod') return ['Bharat Sir', 'Hary Sir'].includes(c.name);
      return true;
    }).map((c) => {
      const assignedLeads = leads.filter((lead) => (lead.owner || lead.assignedTo) === c.name);
      const contacted = assignedLeads.filter((lead) => (lead.communications || []).length || !['new', 'pending'].includes(String(lead.status).toLowerCase())).length;
      const interested = assignedLeads.filter((lead) => lead.isHot || ['interested', 'counselling', 'followup'].includes(String(lead.status).toLowerCase())).length;
      const admissions = assignedLeads.filter((lead) => ['admission_confirmed', 'converted'].includes(String(lead.status).toLowerCase())).length;
      return { ...c, assigned: assignedLeads.length, contacted, interested, admissions, rate: assignedLeads.length ? Number(((admissions / assignedLeads.length) * 100).toFixed(1)) : 0 };
    });
    container.innerHTML = rows.map(c => `
      <tr>
        <td><div class="counselor-cell"><div class="counselor-avatar" style="background:${c.color}">${c.initials}</div><span>${c.name}</span></div></td>
        <td><strong>${c.assigned}</strong></td><td>${c.contacted}</td><td>${c.interested}</td><td><strong>${c.admissions}</strong></td>
        <td><div class="progress-bar-wrap"><div class="progress-bar"><div class="progress-bar-fill" style="width:${c.rate}%"></div></div><span class="pct-label">${c.rate}%</span></div></td>
      </tr>`).join('');
  },

  renderSegmentationChart() {
    const canvas = document.getElementById('chart-segmentation');
    if (!canvas || typeof Chart === 'undefined') return;
    const leads = this.getDashboardLeads();
    const colors = ['#4F6EF7','#10B981','#F59E0B','#8B5CF6','#94A3B8','#0EA5E9'];
    const grouped = leads.reduce((result, lead) => {
      const course = String(lead.course || 'Others').replace(/-Class.*$/i, '').trim() || 'Others';
      result[course] = (result[course] || 0) + 1;
      return result;
    }, {});
    const data = Object.entries(grouped).map(([label, count], index) => ({
      label,
      value: leads.length ? Number(((count / leads.length) * 100).toFixed(1)) : 0,
      color: colors[index % colors.length]
    }));
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
    const leads = this.getDashboardLeads();
    const definitions = [
      { label: 'New', color: '#4F6EF7' },
      { label: 'Contacted', color: '#06B6D4' },
      { label: 'Interested', color: '#10B981' },
      { label: 'Counselling', color: '#8B5CF6' },
      { label: 'OTR Form', color: '#0EA5E9' },
      { label: 'Admission', color: '#F59E0B' },
      { label: 'Closed', color: '#EF4444' }
    ];
    const categoryFor = (lead) => {
      const status = String(lead.status || '').toLowerCase();
      const stageText = String(lead.stageLabel || lead.statusLabel || lead.status || '');
      if (['lost', 'closed', 'admission_rejected'].includes(status)) return 'Closed';
      if (['admission_confirmed', 'converted'].includes(status)) return 'Admission';
      if (/otr|form sent|admission form/i.test(stageText)) return 'OTR Form';
      if (/counselling/i.test(stageText)) return 'Counselling';
      if (status === 'interested') return 'Interested';
      if (['contacted', 'followup'].includes(status)) return 'Contacted';
      return 'New';
    };
    const data = definitions.map((entry) => {
      const count = leads.filter((lead) => categoryFor(lead) === entry.label).length;
      return { ...entry, count, pct: leads.length ? Number(((count / leads.length) * 100).toFixed(1)) : 0 };
    });
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
    const leads = this.getDashboardLeads();
    const total = leads.length;
    const stages = [
      { label: 'Total Leads', minStage: 0, color: '#4F6EF7' },
      { label: 'Contacted', minStage: 1, color: '#06B6D4' },
      { label: 'Interested', minStage: 2, color: '#10B981' },
      { label: 'Counselled', minStage: 3, color: '#F59E0B' },
      { label: 'Admission', minStage: 4, color: '#EF4444' }
    ];
    let previous = total;
    const data = stages.map((stage, index) => {
      const count = index === 0 ? total : Math.min(previous, leads.filter((lead) => Number(lead.stage || 0) >= stage.minStage || ['admission_confirmed', 'converted'].includes(String(lead.status).toLowerCase())).length);
      previous = count;
      return { ...stage, count, pct: total ? Number(((count / total) * 100).toFixed(1)) : 0 };
    });
    container.innerHTML = data.map(d => `
      <div class="funnel-stage"><span class="funnel-label">${d.label}</span><div class="funnel-bar-outer"><div class="funnel-bar-fill" style="width:${d.pct}%; background:${d.color}">${d.pct > 15 ? d.pct + '%' : ''}</div></div><span class="funnel-count">${d.count.toLocaleString()}</span></div>`).join('');
  },

  renderMiniCalendar() {
    const now = this.miniCalendarDate;
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = this.dateKey(new Date());
    const label = document.getElementById('mini-cal-month-label');
    if (label) label.textContent = `${monthNames[month]} ${year}`;
    const leads = this.getDashboardLeads();
    let days = '';
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) days += `<div class="mini-cal-day other-month">${prevDays - i}</div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const datedLeads = leads.filter((lead) => [this.dateKey(lead.followupDate), this.dateKey(lead.inquiryDate)].includes(dateKey));
      const hasOverdue = datedLeads.some((lead) => this.dateKey(lead.followupDate) === dateKey && dateKey < todayKey);
      let cls = dateKey === todayKey ? ' today' : '';
      if (hasOverdue) cls += ' has-overdue has-events';
      else if (datedLeads.length) cls += ' has-events';
      days += `<div class="mini-cal-day${cls}" title="${d} ${monthNames[month]}" onclick="DashboardModule.selectMiniCalDay(${d}, this)">${d}</div>`;
    }
    const gridEl = document.getElementById('mini-cal-days');
    if (gridEl) gridEl.innerHTML = days;
  },

  renderTasks() {
    const todayKey = this.dateKey(new Date());
    const tasks = this.getDashboardLeads()
      .filter((lead) => this.dateKey(lead.followupDate) === todayKey || (!lead.followupDate && ['new', 'pending'].includes(String(lead.status).toLowerCase())))
      .slice(0, 6)
      .map((lead) => ({
        type: lead.followupDate ? 'task-follow' : 'task-call',
        icon: lead.followupDate ? 'fa-redo' : 'fa-user-plus',
        name: `${lead.followupDate ? 'Follow-up with' : 'New inquiry review -'} ${lead.name}`,
        course: lead.course || 'Course not selected',
        time: lead.followupTime || 'Pending'
      }));
    const container = document.getElementById('tasks-list');
    if (container) container.innerHTML = tasks.length
      ? tasks.map(t => `<div class="task-item"><div class="task-icon ${t.type}"><i class="fas ${t.icon}"></i></div><div class="task-body"><div class="task-name">${t.name}</div><div class="task-course">${t.course}</div></div><div class="task-time">${t.time}</div></div>`).join('')
      : '<div class="task-item"><div class="task-body"><div class="task-name">No activities due today</div><div class="task-course">Your current scope is clear.</div></div></div>';
  },

  renderRecentActivities() {
    const container = document.getElementById('recent-activities-list');
    if (!container) return;
    const items = this.getDashboardLeads().flatMap((lead) => {
      const communicationItems = (lead.communications || []).map((item) => ({
        type: item.type === 'email' ? 'task-email' : item.type === 'call' ? 'task-call' : 'task-chat',
        icon: item.type === 'email' ? 'fa-envelope' : item.type === 'call' ? 'fa-phone' : 'fa-comments',
        name: `${item.title || 'Activity'} - ${lead.name}`,
        course: item.desc || lead.course || '',
        time: item.time || ''
      }));
      if (communicationItems.length) return communicationItems;
      return [{ type: 'task-call', icon: 'fa-user-plus', name: `Inquiry created - ${lead.name}`, course: lead.source || 'LMS inquiry', time: lead.timeAgo || '' }];
    }).slice(0, 6);
    container.innerHTML = items.length
      ? items.map(item => `<div class="task-item"><div class="task-icon ${item.type}"><i class="fas ${item.icon}"></i></div><div class="task-body"><div class="task-name">${item.name}</div><div class="task-course">${item.course}</div></div><div class="task-time">${item.time}</div></div>`).join('')
      : '<div class="task-item"><div class="task-body"><div class="task-name">No recent activity</div></div></div>';
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
      const today = new Date();
      const monthStart = this.dateKey(new Date(today.getFullYear(), today.getMonth(), 1));
      const todayValue = this.dateKey(today);
      modal.innerHTML = `<div class="date-picker-panel"><h3><i class="fas fa-calendar-alt" style="color:var(--primary);margin-right:8px"></i>Custom Date Range</h3><div class="date-range-row"><div class="date-input-group"><label>From Date</label><input type="date" id="date-from" value="${this.dashboardDateFrom || monthStart}"></div><div class="date-input-group"><label>To Date</label><input type="date" id="date-to" value="${this.dashboardDateTo || todayValue}"></div></div><div class="quick-ranges"><button class="quick-range-btn active" onclick="DashboardModule.setRange('month',this)">This Month</button><button class="quick-range-btn" onclick="DashboardModule.setRange('week',this)">This Week</button><button class="quick-range-btn" onclick="DashboardModule.setRange('today',this)">Today</button><button class="quick-range-btn" onclick="DashboardModule.setRange('quarter',this)">Quarter</button></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-outline btn-sm" onclick="document.getElementById('date-picker-modal').remove()">Cancel</button><button class="btn btn-primary btn-sm" onclick="DashboardModule.applyDateFilter()"><i class="fas fa-check"></i> Apply Filter</button></div></div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    });
  },

  setRange(range, btn) {
    btn.closest('.quick-ranges').querySelectorAll('.quick-range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const today = new Date();
    const to = this.dateKey(today);
    let from = to;
    if (range === 'month') from = this.dateKey(new Date(today.getFullYear(), today.getMonth(), 1));
    if (range === 'week') from = this.dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6));
    if (range === 'quarter') from = this.dateKey(new Date(today.getFullYear(), today.getMonth() - 2, 1));
    const fromInput = document.getElementById('date-from');
    const toInput = document.getElementById('date-to');
    if (fromInput) fromInput.value = from;
    if (toInput) toInput.value = to;
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
    this.dashboardDateFrom = from || '';
    this.dashboardDateTo = to || '';
    this.dashboardSelectedDate = '';
    document.getElementById('date-picker-modal')?.remove();
    this.refreshDataDrivenViews();
  },

  setupMiniCalNav() {
    const prev = document.getElementById('mini-prev');
    const next = document.getElementById('mini-next');
    prev?.addEventListener('click', () => {
      this.miniCalendarDate = new Date(this.miniCalendarDate.getFullYear(), this.miniCalendarDate.getMonth() - 1, 1);
      this.renderMiniCalendar();
    });
    next?.addEventListener('click', () => {
      this.miniCalendarDate = new Date(this.miniCalendarDate.getFullYear(), this.miniCalendarDate.getMonth() + 1, 1);
      this.renderMiniCalendar();
    });
  },

  clearFilter(e) {
    e.stopPropagation();
    const btn = document.getElementById('date-filter-btn');
    if (btn) {
      btn.innerHTML = `<i class="fas fa-calendar-alt"></i> Date Filter (Custom)`;
      btn.style.borderColor = '';
      btn.style.color = '';
    }
    this.dashboardDateFrom = '';
    this.dashboardDateTo = '';
    this.dashboardSelectedDate = '';
    this.refreshDataDrivenViews();
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
    this.dashboardSelectedDate = this.dateKey(new Date(this.miniCalendarDate.getFullYear(), this.miniCalendarDate.getMonth(), day));
    this.dashboardDateFrom = '';
    this.dashboardDateTo = '';
    const welcome = document.querySelector('.dashboard-welcome');
    if (welcome) welcome.textContent = `${this.dashboardSelectedDate} — Showing data for selected date`;
    this.refreshDataDrivenViews();
  }
};
