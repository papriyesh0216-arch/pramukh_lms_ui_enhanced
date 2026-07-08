// ============================================================
// CALENDAR.JS - Follow-Up Calendar Module
// ============================================================

const CalendarModule = {
  currentDate: new Date(2026, 5, 1),
  today: new Date(2026, 5, 26),
  selectedDate: new Date(2026, 5, 26),
  viewMode: 'week',

  init() {
    this.renderCalendar();
    this.bindLeadToolbarCalendarButton();
  },

  bindLeadToolbarCalendarButton() {
    const btn = document.getElementById('view-toggle-btn');
    if (!btn || btn.dataset.calendarRouteBound === 'true') return;
    btn.dataset.calendarRouteBound = 'true';
    btn.title = 'Open Follow-Up Calendar';
    btn.setAttribute('aria-label', 'Open Follow-Up Calendar');
    btn.innerHTML = '<i class="fas fa-calendar-alt"></i>';
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.openExistingCalendar();
    }, true);
  },

  openExistingCalendar() {
    if (typeof App !== 'undefined' && App.goToCalendar) {
      App.goToCalendar();
    } else {
      document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
      document.getElementById('screen-calendar')?.classList.add('active');
      this.renderCalendar();
    }
  },

  goToInquiryList(resetList = false) {
    if (typeof App !== 'undefined' && App.showScreen) {
      App.showScreen('leads');
    } else {
      document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
      document.getElementById('screen-leads')?.classList.add('active');
    }

    if (resetList) this.resetInquiryListState();
  },

  resetInquiryListState() {
    if (typeof LeadsModule === 'undefined') return;

    LeadsModule.viewMode = 'row';
    LeadsModule.activeStatus = 'all';
    LeadsModule.activeSubStatus = '';
    LeadsModule.currentPage = 1;
    LeadsModule.filterCourse = 'all';
    LeadsModule.filterSource = 'all';
    LeadsModule.filterSearch = '';
    LeadsModule.filterCounselor = 'all';
    LeadsModule.filterMode = 'all';
    LeadsModule.filterAcademicStatus = 'all';
    LeadsModule.filterCity = '';
    LeadsModule.filterBatch = 'all';
    LeadsModule.filterState = '';
    LeadsModule.filterDateFrom = '';
    LeadsModule.filterDateTo = '';
    LeadsModule.filterInquiryNumber = '';
    LeadsModule.filterAssignInquiry = 'all';
    LeadsModule.filterInquiryDate = '';
    LeadsModule.filterFollowupDate = '';
    LeadsModule.filterSegment = 'all';
    LeadsModule.selectedLeads?.clear?.();
    this.clearLeadFilterControls();

    document.querySelectorAll('.status-tab, .status-sub-tab').forEach((tab) => tab.classList.remove('active'));
    document.getElementById('status-tab-all')?.classList.add('active');

    this.showLeadRowContainer();
    LeadsModule.renderStageStatusBar?.();
    LeadsModule.updateViewToggleButton?.();
    LeadsModule.applyFilters?.();
    LeadsModule.updateStatusBarCounts?.();
  },

  clearLeadFilterControls() {
    [
      'filter-search-input',
      'quick-search-input',
      'filter-state',
      'filter-district',
      'filter-date-from',
      'filter-date-to',
      'filter-inquiry-number',
      'filter-followup-date'
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    [
      ['filter-course', 'all'],
      ['filter-mode', 'all'],
      ['filter-batch', 'all'],
      ['filter-assign-inquiry', 'all'],
      ['filter-segment', 'all']
    ].forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    });
  },

  showLeadRowContainer() {
    const leadList = document.getElementById('lead-list');
    const leadCalendarView = document.getElementById('lead-calendar-view');
    const pagination = document.querySelector('.leads-pagination');
    if (leadList) leadList.style.display = 'flex';
    if (leadCalendarView) leadCalendarView.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';
  },

  openLeadRow(leadId) {
    if (typeof LeadsModule === 'undefined') return;
    const lead = LeadsModule.leads.find((item) => item.id === leadId);
    if (!lead) return;
    if (window.AuthModule && !AuthModule.isInScope(lead)) {
      LeadsModule.showToast?.('This inquiry is outside the current role scope.', 'warning');
      return;
    }

    this.goToInquiryList(false);
    LeadsModule.viewMode = 'row';
    LeadsModule.activeStatus = 'all';
    LeadsModule.activeSubStatus = '';
    LeadsModule.currentPage = 1;
    LeadsModule.selectedLeads?.clear?.();
    this.clearLeadFilterControls();
    document.querySelectorAll('.status-tab, .status-sub-tab').forEach((tab) => tab.classList.remove('active'));
    document.getElementById('status-tab-all')?.classList.add('active');
    LeadsModule.renderStageStatusBar?.();
    LeadsModule.filteredLeads = [lead];
    this.showLeadRowContainer();
    LeadsModule.updateViewToggleButton?.();
    LeadsModule.renderLeads?.();
    LeadsModule.updateSelectAllCheckboxState?.();
    LeadsModule.updateSelectionUI?.();
    LeadsModule.syncCollapseAllButton?.();
    LeadsModule.showToast?.(`Opened ${lead.name}`, 'info');
  },

  renderCalendar() {
    const container = document.querySelector('#screen-calendar .content-area');
    if (!container) return;
    container.innerHTML = `
      <div class="calendar-page-v2">
        <aside class="calendar-side-panel">
          ${this.renderMiniCalendarCard()}
          ${this.renderLeadListSection('overdue')}
          ${this.renderLeadListSection('followup')}
          ${this.renderLeadListSection('pending')}
        </aside>
        <section class="calendar-main-panel">
          <div class="calendar-metric-grid">
            ${this.renderMetricCard('all')}
            ${this.renderMetricCard('overdue')}
            ${this.renderMetricCard('followup')}
            ${this.renderMetricCard('pending')}
          </div>
          ${this.renderPlannerView()}
        </section>
      </div>
    `;
  },

  renderMiniCalendarCard() {
    const monthNames = this.monthNames();
    return `
      <div class="calendar-card-v2 mini-calendar-v2">
        <div class="calendar-title-block">
          <h1>Follow-Up Calendar</h1>
          <p>Click on any date to view scheduled leads and follow-ups</p>
        </div>
        <div class="mini-calendar-nav">
          <button type="button" class="cal-icon-btn" onclick="CalendarModule.moveMonth(-1)" aria-label="Previous month">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button type="button" class="cal-today-btn-v2" onclick="CalendarModule.goToday()">Today</button>
          <button type="button" class="cal-icon-btn" onclick="CalendarModule.moveMonth(1)" aria-label="Next month">
            <i class="fas fa-chevron-right"></i>
          </button>
          <button type="button" class="mini-month-select" onclick="CalendarModule.goToday()">
            ${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
        <div class="mini-weekdays">
          ${['MO','TU','WE','TH','FR','SA','SU'].map((day) => `<span>${day}</span>`).join('')}
        </div>
        <div class="mini-days-grid">
          ${this.renderMiniDays()}
        </div>
        <div class="mini-legend">
          <span><i class="cal-dot dot-pending"></i>Pending</span>
          <span><i class="cal-dot dot-overdue"></i>Overdue</span>
          <span><i class="cal-dot dot-followup"></i>Follow-up</span>
          <span><i class="cal-dot dot-done"></i>Done</span>
        </div>
      </div>
    `;
  },

  renderMiniDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startPad = firstDay === 0 ? 6 : firstDay - 1;
    const cells = [];

    for (let i = 0; i < startPad; i++) {
      cells.push('<button type="button" class="mini-day is-empty" tabindex="-1"></button>');
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = this.dateKey(date);
      const counts = this.getCalendarCounts(key);
      const selected = this.dateKey(date) === this.dateKey(this.selectedDate);
      const hasEvents = counts.pending || counts.overdue || counts.followup || counts.completed;
      const dots = [
        counts.pending ? '<i class="cal-dot dot-pending"></i>' : '',
        counts.overdue ? '<i class="cal-dot dot-overdue"></i>' : '',
        counts.followup ? '<i class="cal-dot dot-followup"></i>' : '',
        counts.completed ? '<i class="cal-dot dot-done"></i>' : ''
      ].join('');
      cells.push(`
        <button type="button" class="mini-day ${selected ? 'is-selected' : ''} ${hasEvents ? 'has-events' : ''}" onclick="CalendarModule.selectDate('${key}')">
          <span>${day}</span>
          <span class="mini-day-dots">${dots}</span>
        </button>
      `);
    }

    return cells.join('');
  },

  renderLeadListSection(type) {
    const config = {
      overdue: { title: 'Overdue Leads', color: 'danger', suffix: 'Past due follow-up' },
      followup: { title: 'Follow-up Due Today', color: 'primary', suffix: 'Follow-up due' },
      pending: { title: 'Pending Leads', color: 'warning', suffix: 'No follow-up set' }
    }[type];
    const items = this.getLeadGroups()[type];
    const visible = items.slice(0, 3);
    const extra = Math.max(0, items.length - visible.length);

    return `
      <div class="calendar-card-v2 calendar-list-card ${config.color}">
        <div class="calendar-list-head">
          <h2>${config.title} (${items.length})</h2>
          <button type="button" onclick="CalendarModule.scrollCalendarList('${type}')">View All</button>
        </div>
        <div class="calendar-lead-list" id="calendar-list-${type}">
          ${visible.map((item) => this.renderCalendarLeadItem(item, type, config.suffix)).join('')}
          ${extra ? `<button type="button" class="calendar-more-link" onclick="CalendarModule.expandLeadSection('${type}')">+ ${extra} more ${type === 'pending' ? 'pending lead' : 'follow-up'}</button>` : ''}
          ${items.length === 0 ? '<div class="calendar-empty-line">No leads in this group</div>' : ''}
        </div>
      </div>
    `;
  },

  renderCalendarLeadItem(item, type, suffix) {
    const badge = type === 'followup' ? item.time : (type === 'pending' ? 'Pending' : 'Overdue');
    const colorClass = type === 'overdue' ? 'danger' : (type === 'pending' ? 'warning' : 'primary');
    return `
      <button type="button" class="calendar-lead-item" onclick="CalendarModule.openLeadRow(${item.lead.id})">
        <span class="calendar-avatar" style="background:${item.color}">${this.initials(item.lead.name)}</span>
        <span class="calendar-lead-copy">
          <strong>${this.escapeHtml(item.lead.name)}</strong>
          <small>${this.escapeHtml(item.lead.course || '-')} - ${suffix}${item.time ? ` at ${item.time}` : ''}</small>
        </span>
        <span class="calendar-item-badge ${colorClass}">${badge}</span>
        <span class="calendar-call-icon" onclick="CalendarModule.leadAction('call', ${item.lead.id}, event)">
          <i class="fas fa-phone"></i>
        </span>
      </button>
    `;
  },

  renderMetricCard(type) {
    const selectedCounts = this.getCalendarCounts(this.dateKey(this.selectedDate));
    const data = {
      all: {
        icon: 'fa-table-cells-large',
        title: 'All',
        subtitle: 'Total Tasks',
        value: selectedCounts.pending + selectedCounts.overdue + selectedCounts.followup + selectedCounts.completed,
        color: 'blue'
      },
      overdue: {
        icon: 'fa-clock',
        title: 'Overdue',
        subtitle: 'Past Due Date',
        value: this.getLeadGroups().overdue.length,
        color: 'red'
      },
      followup: {
        icon: 'fa-calendar-day',
        title: 'Follow-up Due',
        subtitle: 'Due Today',
        value: selectedCounts.followup,
        color: 'sky'
      },
      pending: {
        icon: 'fa-calendar-plus',
        title: 'Pending Leads',
        subtitle: 'No Follow-up Set',
        value: selectedCounts.pending,
        color: 'gold'
      }
    }[type];

    return `
      <div class="calendar-metric-card ${data.color}">
        <div class="metric-icon"><i class="fas ${data.icon}"></i></div>
        <div class="metric-copy">
          <strong>${data.value}</strong>
          <span>${data.title}</span>
          <small>${data.subtitle}</small>
        </div>
        ${type === 'all' ? '<i class="fas fa-check metric-check"></i>' : ''}
      </div>
    `;
  },

  renderPlannerView() {
    if (this.viewMode === 'day') return this.renderDayPlanner();
    if (this.viewMode === 'month') return this.renderMonthPlanner();
    return this.renderWeekPlanner();
  },

  renderPlannerToolbar(title, period = 'week') {
    const moveMethod = period === 'month' ? 'moveMonth' : period === 'day' ? 'moveDay' : 'moveWeek';
    const previousLabel = period === 'month' ? 'Previous month' : period === 'day' ? 'Previous day' : 'Previous week';
    const nextLabel = period === 'month' ? 'Next month' : period === 'day' ? 'Next day' : 'Next week';
    return `
      <div class="week-planner-toolbar">
        <div class="week-nav-cluster">
          <button type="button" class="cal-icon-btn" onclick="CalendarModule.${moveMethod}(-1)" aria-label="${previousLabel}">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button type="button" class="cal-today-btn-v2" onclick="CalendarModule.goToday()">Today</button>
          <button type="button" class="cal-icon-btn" onclick="CalendarModule.${moveMethod}(1)" aria-label="${nextLabel}">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <h2>${title}</h2>
        <div class="view-toggle-group">
          ${this.renderViewButton('week', 'fa-calendar-week', 'Week View')}
          ${this.renderViewButton('day', 'fa-list', 'Day View')}
          ${this.renderViewButton('month', 'fa-calendar-days', 'Month View')}
        </div>
      </div>
    `;
  },

  renderWeekPlanner() {
    const weekStart = this.startOfWeek(this.selectedDate);
    const weekEnd = this.addDays(weekStart, 6);
    const days = Array.from({ length: 7 }, (_, index) => this.addDays(weekStart, index));
    const hours = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'];

    return `
      <div class="calendar-card-v2 week-planner-card">
        ${this.renderPlannerToolbar(this.formatDateRange(weekStart, weekEnd), 'week')}
        <div class="week-grid" style="--hour-count:${hours.length}">
          <div class="week-corner"></div>
          ${days.map((date) => `
            <button type="button" class="week-day-head ${this.dateKey(date) === this.dateKey(this.selectedDate) ? 'is-selected' : ''}" onclick="CalendarModule.selectDate('${this.dateKey(date)}')">
              <span>${this.weekdayShort(date)}</span>
              <strong>${date.getDate()}</strong>
            </button>
          `).join('')}
          <div class="week-time-label all-day">All Day</div>
          ${days.map(() => '<div class="week-all-day-cell"></div>').join('')}
          ${hours.map((hour) => `
            <div class="week-time-label">${hour}</div>
            ${days.map((date) => this.renderHourCell(date, hour)).join('')}
          `).join('')}
        </div>
      </div>
    `;
  },

  renderDayPlanner() {
    const hours = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'];
    const dayItems = this.getWeekItems().filter((item) => item.dateKey === this.dateKey(this.selectedDate));
    const title = `${this.weekdayLong(this.selectedDate)}, ${this.monthNames()[this.selectedDate.getMonth()]} ${this.selectedDate.getDate()}, ${this.selectedDate.getFullYear()}`;

    return `
      <div class="calendar-card-v2 week-planner-card day-planner-card">
        ${this.renderPlannerToolbar(title, 'day')}
        <div class="day-agenda">
          <div class="day-agenda-summary">
            <strong>${dayItems.length}</strong>
            <span>scheduled item${dayItems.length === 1 ? '' : 's'}</span>
          </div>
          <div class="day-agenda-grid">
            ${hours.map((hour) => {
              const items = dayItems.filter((item) => item.time === hour);
              return `
                <div class="day-time-label">${hour}</div>
                <div class="day-time-slot">
                  ${items.length ? items.map((item) => this.renderAgendaEvent(item)).join('') : '<span class="empty-slot">No activity scheduled</span>'}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderMonthPlanner() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = this.monthNames();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const startPad = firstDay === 0 ? 6 : firstDay - 1;
    const totalCells = 42;
    const cells = [];

    for (let i = startPad - 1; i >= 0; i--) {
      cells.push(this.renderMonthCell(prevDays - i, null, true));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      cells.push(this.renderMonthCell(day, date, false));
    }

    for (let day = 1; cells.length < totalCells; day++) {
      cells.push(this.renderMonthCell(day, null, true));
    }

    return `
      <div class="calendar-card-v2 week-planner-card month-planner-card">
        ${this.renderPlannerToolbar(`${monthNames[month]} ${year}`, 'month')}
        <div class="month-grid">
          ${['MON','TUE','WED','THU','FRI','SAT','SUN'].map((day) => `<div class="month-weekday">${day}</div>`).join('')}
          ${cells.join('')}
        </div>
      </div>
    `;
  },

  renderMonthCell(day, date, muted) {
    const key = date ? this.dateKey(date) : '';
    const counts = date ? this.getCalendarCounts(key) : { pending: 0, overdue: 0, followup: 0, completed: 0 };
    const items = date ? this.getWeekItems().filter((item) => item.dateKey === key).slice(0, 2) : [];
    const isSelected = date && key === this.dateKey(this.selectedDate);
    const isToday = date && key === this.dateKey(this.today);
    const countPills = [
      counts.pending ? `<span class="month-count pending">${counts.pending} Pending</span>` : '',
      counts.overdue ? `<span class="month-count overdue">${counts.overdue} Overdue</span>` : '',
      counts.followup ? `<span class="month-count followup">${counts.followup} Follow-ups</span>` : '',
      counts.completed ? `<span class="month-count done">${counts.completed} Done</span>` : ''
    ].join('');

    return `
      <button type="button" class="month-day-cell ${muted ? 'is-muted' : ''} ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}" ${date ? `onclick="CalendarModule.selectDate('${key}')"` : 'tabindex="-1"'}>
        <span class="month-day-num">${day}</span>
        <span class="month-counts">${countPills}</span>
        <span class="month-events">
          ${items.map((item) => `<span class="month-event event-${item.type}">${item.time} ${this.escapeHtml(item.lead.name)}</span>`).join('')}
        </span>
      </button>
    `;
  },

  renderViewButton(mode, icon, label) {
    return `
      <button type="button" class="calendar-view-btn ${this.viewMode === mode ? 'active' : ''}" onclick="CalendarModule.setViewMode('${mode}')">
        <i class="fas ${icon}"></i>${label}
      </button>
    `;
  },

  renderHourCell(date, hour) {
    const key = this.dateKey(date);
    const items = this.getWeekItems().filter((item) => item.dateKey === key && item.time === hour);
    return `
      <div class="week-hour-cell">
        ${items.map((item) => `
          <button type="button" class="week-event event-${item.type}" onclick="CalendarModule.openLeadRow(${item.lead.id})">
            <span>${item.time}</span>
            <strong>${item.title}</strong>
            <small>${this.escapeHtml(item.lead.name)}</small>
          </button>
        `).join('')}
      </div>
    `;
  },

  renderAgendaEvent(item) {
    return `
      <button type="button" class="agenda-event event-${item.type}" onclick="CalendarModule.openLeadRow(${item.lead.id})">
        <span>${item.time}</span>
        <strong>${item.title}</strong>
        <small>${this.escapeHtml(item.lead.name)} - ${this.escapeHtml(item.lead.course || '-')}</small>
      </button>
    `;
  },

  getLeadGroups() {
    const leads = this.getScopedLeads();
    const pendingLeads = leads.filter((lead) => this.isPendingLead(lead));
    const followupLeads = leads.filter((lead) => this.isFollowupLead(lead));
    const overdueLeads = leads.filter((lead) => this.isOverdueLead(lead));
    const palette = ['#4F6EF7','#10B981','#8B5CF6','#0EA5E9','#F59E0B','#0F766E','#D97706'];
    const asItems = (rows, fallbackTime) => rows.map((lead, index) => ({
      lead,
      time: lead.followupTime || fallbackTime(index),
      color: palette[index % palette.length]
    }));

    return {
      overdue: asItems(overdueLeads.length ? overdueLeads : followupLeads.slice(0, 3), (index) => ['10:00 AM','11:00 AM','2:00 PM'][index % 3]),
      followup: asItems(followupLeads.length ? followupLeads : leads.slice(0, 5), (index) => ['11:00 AM','12:00 PM','1:00 PM','2:00 PM','4:00 PM'][index % 5]),
      pending: asItems(pendingLeads.length ? pendingLeads : leads.slice(0, 4), (index) => ['10:30 AM','11:15 AM','1:45 PM','3:00 PM'][index % 4])
    };
  },

  getWeekItems() {
    const leads = this.getScopedLeads();
    const weekStart = this.startOfWeek(this.selectedDate);
    const definitions = [
      [0, '9:00 AM', 'counselling', 'Counselling', 0],
      [0, '11:00 AM', 'followup', 'Follow-up', 3],
      [0, '2:00 PM', 'pending', 'Follow-up', 4],
      [1, '10:00 AM', 'pending', 'Follow-up', 6],
      [1, '12:00 PM', 'followup', 'Counselling', 8],
      [1, '4:00 PM', 'overdue', 'Overdue Follow-up', 10],
      [2, '9:00 AM', 'followup', 'Counselling', 11],
      [2, '11:00 AM', 'pending', 'Follow-up', 1],
      [2, '1:00 PM', 'followup', 'Follow-up', 3],
      [2, '3:00 PM', 'counselling', 'Follow-up', 2],
      [3, '10:00 AM', 'counselling', 'Counselling', 0],
      [3, '4:00 PM', 'pending', 'Follow-up', 8],
      [4, '9:00 AM', 'pending', 'Follow-up', 4],
      [4, '11:00 AM', 'followup', 'Counselling', 6],
      [4, '2:00 PM', 'counselling', 'Follow-up', 10],
      [4, '5:00 PM', 'overdue', 'Overdue Follow-up', 2],
      [5, '10:00 AM', 'followup', 'Follow-up', 0],
      [5, '12:00 PM', 'pending', 'Counselling', 5],
      [6, '11:00 AM', 'followup', 'Follow-up', 11],
      [6, '3:00 PM', 'pending', 'Counselling', 0]
    ];

    return definitions.map(([dayOffset, time, type, title, leadIndex]) => {
      const lead = leads[leadIndex % leads.length] || leads[0];
      return {
        dateKey: this.dateKey(this.addDays(weekStart, dayOffset)),
        time,
        type,
        title,
        lead
      };
    }).filter((item) => item.lead);
  },

  getCalendarCounts(dateKey) {
    const data = window.APP_DATA?.FOLLOWUP_CALENDAR_DATA || {};
    return data[dateKey] || { pending: 0, overdue: 0, followup: 0, completed: 0 };
  },

  getScopedLeads() {
    const rows = (typeof LeadsModule !== 'undefined' && LeadsModule.leads?.length)
      ? LeadsModule.leads
      : (window.APP_DATA?.LEAD_DATA || []);
    const active = rows.filter((lead) => !lead.archived);
    return window.AuthModule ? active.filter((lead) => AuthModule.isInScope(lead)) : active;
  },

  isPendingLead(lead) {
    return ['pending', 'new'].includes(String(lead.status || '').toLowerCase()) && !lead.followupDate;
  },

  isFollowupLead(lead) {
    const status = String(lead.status || '').toLowerCase();
    return Boolean(lead.followupDate) || ['followup', 'contacted', 'interested'].includes(status);
  },

  isOverdueLead(lead) {
    const key = (typeof LeadsModule !== 'undefined' && LeadsModule.dateKey)
      ? LeadsModule.dateKey(lead.followupDate)
      : this.parseDateKey(lead.followupDate);
    return Boolean(key && key < this.dateKey(this.today));
  },

  selectDate(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    this.selectedDate = new Date(year, month - 1, day);
    this.currentDate = new Date(year, month - 1, 1);
    this.renderCalendar();
  },

  moveMonth(delta) {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + delta, 1);
    this.renderCalendar();
  },

  moveWeek(delta) {
    this.selectedDate = this.addDays(this.selectedDate, delta * 7);
    this.currentDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
    this.renderCalendar();
  },

  moveDay(delta) {
    this.selectedDate = this.addDays(this.selectedDate, delta);
    this.currentDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
    this.renderCalendar();
  },

  goToday() {
    this.selectedDate = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    this.currentDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.renderCalendar();
  },

  setViewMode(mode) {
    this.viewMode = mode;
    this.renderCalendar();
  },

  expandLeadSection(type) {
    const section = document.getElementById(`calendar-list-${type}`);
    if (!section) return;
    const config = {
      overdue: { suffix: 'Past due follow-up' },
      followup: { suffix: 'Follow-up due' },
      pending: { suffix: 'No follow-up set' }
    }[type];
    section.innerHTML = this.getLeadGroups()[type]
      .map((item) => this.renderCalendarLeadItem(item, type, config.suffix))
      .join('');
  },

  scrollCalendarList(type) {
    this.expandLeadSection(type);
    document.getElementById(`calendar-list-${type}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  leadAction(type, leadId, event) {
    event?.stopPropagation();
    if (type === 'call') {
      if (typeof DialerModule !== 'undefined') DialerModule.open?.(leadId);
    } else if (type === 'whatsapp') {
      if (typeof LeadsModule !== 'undefined') LeadsModule.whatsapp?.(leadId);
    } else if (type === 'remark') {
      if (typeof LeadsModule !== 'undefined') LeadsModule.showManageFollowup?.(leadId);
    }
  },

  addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  },

  startOfWeek(date) {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return start;
  },

  dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  parseDateKey(value = '') {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const match = raw.match(/(\d{1,2})[-/\s]([A-Za-z]{3,}|\d{1,2})[-/\s](\d{4})/);
    if (!match) return '';
    const months = {
      jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
      apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
      aug: '08', august: '08', sep: '09', september: '09', oct: '10', october: '10',
      nov: '11', november: '11', dec: '12', december: '12'
    };
    const day = String(match[1]).padStart(2, '0');
    const month = Number.isNaN(Number(match[2])) ? months[match[2].toLowerCase()] : String(match[2]).padStart(2, '0');
    return month ? `${match[3]}-${month}-${day}` : '';
  },

  formatDateRange(start, end) {
    const monthNames = this.monthNames();
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = sameMonth ? `${monthNames[start.getMonth()]} ${start.getDate()}` : `${monthNames[start.getMonth()]} ${start.getDate()}`;
    return `${startLabel} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  },

  weekdayShort(date) {
    return ['SUN','MON','TUE','WED','THU','FRI','SAT'][date.getDay()];
  },

  weekdayLong(date) {
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
  },

  monthNames() {
    return ['January','February','March','April','May','June','July','August','September','October','November','December'];
  },

  initials(name = '') {
    return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'L';
  },

  escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
