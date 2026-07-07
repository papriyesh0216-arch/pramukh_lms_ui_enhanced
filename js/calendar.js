// ============================================================
// CALENDAR.JS — Follow-Up Calendar Module
// ============================================================

const CalendarModule = {
  currentDate: new Date(2026, 5, 1), // June 2026
  today: new Date(2026, 5, 26),

  init() {
    this.renderCalendar();
    document.getElementById('cal-prev-btn')?.addEventListener('click', () => {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
      this.renderCalendar();
    });
    document.getElementById('cal-next-btn')?.addEventListener('click', () => {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
      this.renderCalendar();
    });
    document.getElementById('cal-today-btn')?.addEventListener('click', () => {
      this.currentDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
      this.renderCalendar();
    });
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
      if (window.App?.goToCalendar) {
        App.goToCalendar();
      } else {
        document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
        document.getElementById('screen-calendar')?.classList.add('active');
        this.renderCalendar();
      }
    }, true);
  },

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    document.getElementById('cal-month-title').textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const startPad = firstDay === 0 ? 6 : firstDay - 1;
    const calData = window.APP_DATA.FOLLOWUP_CALENDAR_DATA;

    const grid = document.getElementById('cal-days-grid');
    if (!grid) return;

    let cells = '';
    const totalCells = 35;

    // Prev month padding
    for (let i = startPad - 1; i >= 0; i--) {
      cells += `<div class="cal-day-cell other-month">
        <div class="cal-day-num">${prevDays - i}</div>
      </div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const ev = calData[dateKey];
      const isToday = year === this.today.getFullYear() && month === this.today.getMonth() && d === this.today.getDate();

      let pillsHTML = '';
      if (ev) {
        if (ev.pending > 0) pillsHTML += `<div class="cal-stat-pill cal-pill-pending" onclick="CalendarModule.showDayPopup('${dateKey}', event)"><span class="cal-stat-dot"></span>${ev.pending} Pending</div>`;
        if (ev.overdue > 0) pillsHTML += `<div class="cal-stat-pill cal-pill-overdue" onclick="CalendarModule.showDayPopup('${dateKey}', event)"><span class="cal-stat-dot"></span>${ev.overdue} Overdue</div>`;
        if (ev.followup > 0) pillsHTML += `<div class="cal-stat-pill cal-pill-followup" onclick="CalendarModule.showDayPopup('${dateKey}', event)"><span class="cal-stat-dot"></span>${ev.followup} Follow-ups</div>`;
        if (ev.completed > 0) pillsHTML += `<div class="cal-stat-pill cal-pill-completed" onclick="CalendarModule.showDayPopup('${dateKey}', event)"><span class="cal-stat-dot"></span>${ev.completed} Done</div>`;
      }

      cells += `
        <div class="cal-day-cell ${isToday ? 'today' : ''}" onclick="CalendarModule.showDayPopup('${dateKey}', event)" data-date="${dateKey}">
          <div class="cal-day-num">${d}</div>
          <div class="cal-day-stats">${pillsHTML}</div>
        </div>
      `;
    }

    // Fill remaining cells for next month
    const used = startPad + daysInMonth;
    const remaining = totalCells - used;
    for (let d = 1; d <= remaining; d++) {
      cells += `<div class="cal-day-cell other-month"><div class="cal-day-num">${d}</div></div>`;
    }

    grid.innerHTML = cells;
  },

  showDayPopup(dateKey, e) {
    e?.stopPropagation();
    const existing = document.getElementById('day-popup-overlay');
    if (existing) existing.remove();

    const ev = window.APP_DATA.FOLLOWUP_CALENDAR_DATA[dateKey] || { pending: 0, overdue: 0, followup: 0, completed: 0 };
    const [year, month, day] = dateKey.split('-');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dateLabel = `${parseInt(day)} ${monthNames[parseInt(month)-1]} ${year}`;

    // Sample leads for this day
    const dayLeads = window.APP_DATA.LEAD_DATA.slice(0, Math.min(3, ev.pending + ev.followup + 1));
    const avatarColors = ['#4F6EF7','#10B981','#F59E0B','#8B5CF6','#F97316'];

    const overlay = document.createElement('div');
    overlay.id = 'day-popup-overlay';
    overlay.className = 'day-popup-overlay';
    overlay.innerHTML = `
      <div class="day-popup">
        <div class="day-popup-header">
          <div class="day-popup-date"><i class="fas fa-calendar-day" style="margin-right:8px"></i>${dateLabel}</div>
          <button class="day-popup-close" onclick="document.getElementById('day-popup-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="day-popup-counts">
          <div class="day-count-item dci-pending" onclick="CalendarModule.filterByType('pending')">
            <div class="day-count-num">${ev.pending}</div>
            <div class="day-count-label">Pending Leads</div>
          </div>
          <div class="day-count-item dci-overdue" onclick="CalendarModule.filterByType('overdue')">
            <div class="day-count-num">${ev.overdue}</div>
            <div class="day-count-label">Overdue</div>
          </div>
          <div class="day-count-item dci-today" onclick="CalendarModule.filterByType('today')">
            <div class="day-count-num">${ev.pending + ev.overdue}</div>
            <div class="day-count-label">Today's Leads</div>
          </div>
          <div class="day-count-item dci-followup" onclick="CalendarModule.filterByType('followup')">
            <div class="day-count-num">${ev.followup}</div>
            <div class="day-count-label">Follow-ups</div>
          </div>
          <div class="day-count-item dci-completed" onclick="CalendarModule.filterByType('completed')">
            <div class="day-count-num">${ev.completed}</div>
            <div class="day-count-label">Completed</div>
          </div>
        </div>

        <div style="padding:6px 14px 4px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em">
          Leads for this Day
        </div>
        <div class="day-popup-leads">
          ${dayLeads.map((lead, i) => `
            <div class="day-lead-row" onclick="DrawerModule.open(${lead.id}); document.getElementById('day-popup-overlay').remove()">
              <div class="day-lead-avatar-sm" style="background:${avatarColors[i % avatarColors.length]}">${lead.name.charAt(0)}</div>
              <div class="day-lead-info">
                <div class="day-lead-name">${lead.name}</div>
                <div class="day-lead-detail">${lead.course} • ${lead.followupType || 'Follow-up'} at ${lead.followupTime || '10:00 AM'}</div>
              </div>
              <span class="badge status-${lead.status}" style="font-size:10px;margin-right:6px">${lead.statusLabel}</span>
              <div class="day-lead-actions">
                <button class="day-action-btn" title="Call" onclick="CalendarModule.leadAction('call', ${lead.id}, event)"><i class="fas fa-phone"></i></button>
                <button class="day-action-btn" title="WhatsApp" onclick="CalendarModule.leadAction('whatsapp', ${lead.id}, event)"><i class="fab fa-whatsapp"></i></button>
                <button class="day-action-btn" title="Remark" onclick="CalendarModule.leadAction('remark', ${lead.id}, event)"><i class="fas fa-edit"></i></button>
              </div>
            </div>
          `).join('')}
          ${dayLeads.length === 0 ? '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:12px">No leads scheduled for this day</div>' : ''}
        </div>

        <div class="day-popup-footer">
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('day-popup-overlay').remove()">Close</button>
          <button class="btn btn-primary btn-sm" onclick="App.showScreen('leads'); document.getElementById('day-popup-overlay').remove()">
            <i class="fas fa-list"></i> Inquiry List
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  },

  filterByType(type) {
    document.getElementById('day-popup-overlay')?.remove();
    App.showScreen('leads');
    if (type === 'overdue' || type === 'followup' || type === 'pending') {
      LeadsModule.setStatus(type === 'pending' ? 'new' : 'followup', document.getElementById(`status-tab-${type === 'pending' ? 'new' : 'followup'}`));
    }
    LeadsModule.showToast(`Filtered by: ${type} leads`, 'info');
  },

  leadAction(type, leadId, event) {
    event?.stopPropagation();
    if (type === 'call') {
      const lead = LeadsModule.leads.find(l => l.id === leadId);
      if (lead) {
        document.getElementById('day-popup-overlay')?.remove();
        DialerModule.open(leadId);
        LeadsModule.showToast(`Dialer opened for ${lead.name}`, 'info');
      }
    } else if (type === 'whatsapp') {
      LeadsModule.whatsapp(leadId);
    } else if (type === 'remark') {
      document.getElementById('day-popup-overlay')?.remove();
      LeadsModule.showManageFollowup(leadId);
    }
  }
};
