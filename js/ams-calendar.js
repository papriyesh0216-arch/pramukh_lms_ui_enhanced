// ============================================================
// AMS CALENDAR ADAPTER
// Reuses the LMS Calendar presentation/interaction module while
// replacing every data-facing operation with AMS admission data.
// ============================================================

(() => {
  if (typeof CalendarModule === 'undefined') return;

  const AMSCalendar = CalendarModule;
  const palette = ['#4F6EF7', '#10B981', '#8B5CF6', '#0EA5E9', '#F59E0B', '#0F766E', '#D97706'];

  Object.assign(AMSCalendar, {
    initializedForAMS: false,

    init() {
      if (this.initializedForAMS) return;
      this.initializedForAMS = true;
      const now = new Date();
      this.today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      this.selectedDate = new Date(this.today);
      this.currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
      this.viewMode = 'week';
      this.displayMode = 'calendar';
      this.calendarFilter = 'all';
      window.addEventListener('ams:data-change', () => {
        if (document.getElementById('screen-calendar')?.classList.contains('active')) this.renderCalendar();
        this.refreshInquiryPopup();
      });
      this.renderCalendar();
    },

    bindLeadToolbarCalendarButton() {},

    openExistingCalendar() {
      if (typeof AMSApp !== 'undefined') AMSApp.showScreen('calendar');
      this.renderCalendar();
    },

    goToInquiryList() {
      if (typeof AMSApp !== 'undefined') AMSApp.showScreen('ams-students');
    },

    resetInquiryListState() {},
    clearLeadFilterControls() {},
    showLeadRowContainer() {},

    admissionRows() {
      return (window.AMSStudentList?.rows || []).map((row, index) => ({
        ...row,
        id: index + 1,
        calendarId: index + 1,
        admissionKey: row.key
      }));
    },

    rowByCalendarId(id) {
      return this.admissionRows().find(row => Number(row.calendarId) === Number(id));
    },

    openLeadRow(admissionId, event) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      this.openInquiryRows([admissionId], event);
    },

    openInquiryRows(admissionIds = [], event) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      const requested = new Set(admissionIds.map(Number));
      const rows = this.admissionRows().filter(row => requested.has(Number(row.calendarId)));
      if (!rows.length) {
        window.AMSAdmissionOps?.toast?.('No admission records are available for this calendar item.', 'warning');
        return;
      }

      this.closeInquiryPopup();
      this.popupLeadIds = rows.map(row => row.calendarId);
      const overlay = document.createElement('div');
      overlay.className = 'calendar-inquiry-popup-overlay ams-calendar-popup-overlay';
      overlay.id = 'calendar-inquiry-popup';
      overlay.innerHTML = `
        <section class="calendar-inquiry-popup-card ams-calendar-popup-card" role="dialog" aria-modal="true" aria-labelledby="calendar-inquiry-popup-title">
          <header class="calendar-inquiry-popup-header">
            <div>
              <span class="calendar-inquiry-popup-eyebrow">AMS Calendar</span>
              <h2 id="calendar-inquiry-popup-title">${rows.length} Admission ${rows.length === 1 ? 'Record' : 'Records'}</h2>
            </div>
            <button type="button" class="calendar-inquiry-popup-close" onclick="CalendarModule.closeInquiryPopup()" aria-label="Close admission calendar details">
              <i class="fas fa-times"></i>
            </button>
          </header>
          <div class="calendar-inquiry-popup-body">
            <div class="calendar-inquiry-popup-list ams-calendar-popup-list">
              ${rows.map(row => this.renderAdmissionPopupCard(row)).join('')}
            </div>
          </div>
        </section>
      `;
      overlay.addEventListener('click', clickEvent => {
        if (clickEvent.target === overlay) this.closeInquiryPopup();
      });
      overlay.addEventListener('click', clickEvent => this.handlePopupAction(clickEvent));
      document.body.appendChild(overlay);
      this.popupKeyHandler = keyEvent => {
        if (keyEvent.key === 'Escape') this.closeInquiryPopup();
      };
      document.addEventListener('keydown', this.popupKeyHandler);
      overlay.querySelector('.calendar-inquiry-popup-close')?.focus();
    },

    renderAdmissionPopupCard(row) {
      const events = this.calendarEvents().filter(item => item.lead.admissionKey === row.admissionKey);
      const interviews = window.AMSInterviews?.interviewsForStudent?.(row) || [];
      const latestInterview = interviews[0];
      const activity = (window.AMSAdmissionOps?.store?.activities?.[row.key] || [])[0];
      return `
        <article class="ams-calendar-admission-card">
          <header>
            <span class="calendar-avatar" style="background:${palette[(row.calendarId - 1) % palette.length]}">${this.initials(row.name)}</span>
            <div><strong>${this.escapeHtml(row.name)}</strong><small>${this.escapeHtml(row.otrNo || row.admissionNo || 'OTR ID unavailable')}</small></div>
            <span class="ams-calendar-stage">${this.escapeHtml(row.stage)} · ${this.escapeHtml(row.stageStatus)}</span>
          </header>
          <div class="ams-calendar-detail-grid">
            ${this.popupDetail('Mobile', row.phone)}
            ${this.popupDetail('Email', row.email)}
            ${this.popupDetail('OTR Information', row.otrRecord?.otrNo || row.submissionStatus)}
            ${this.popupDetail('Course', row.course)}
            ${this.popupDetail('Batch', row.batch)}
            ${this.popupDetail('Interview Status', latestInterview?.status || 'Not scheduled')}
            ${this.popupDetail('Document Status', row.documents || `${row.verifiedDocuments}/${row.totalDocuments} verified`)}
            ${this.popupDetail('Admission Status', `${row.stage} · ${row.stageStatus}`)}
            ${this.popupDetail('Owner', row.owner)}
            ${this.popupDetail('Scheduled Time', events[0] ? `${events[0].dateKey} · ${events[0].time}` : 'Not scheduled')}
            ${this.popupDetail('Follow-up Details', row.followupPurpose || activity?.description)}
            ${this.popupDetail('Latest Communication', activity?.title)}
          </div>
          <footer>
            <button type="button" data-ams-calendar-action="view360" data-key="${this.escapeHtml(row.admissionKey)}"><i class="fas fa-arrows-to-eye"></i>360° Details</button>
            <button type="button" data-ams-calendar-action="followup" data-key="${this.escapeHtml(row.admissionKey)}"><i class="fas fa-calendar-check"></i>Manage Follow-up</button>
            <button type="button" data-ams-calendar-action="interview" data-key="${this.escapeHtml(row.admissionKey)}"><i class="fas fa-user-tie"></i>Schedule Interview</button>
            <button type="button" data-ams-calendar-action="call" data-key="${this.escapeHtml(row.admissionKey)}"><i class="fas fa-phone"></i>Call</button>
          </footer>
        </article>
      `;
    },

    popupDetail(label, value) {
      return `<div><span>${this.escapeHtml(label)}</span><strong>${this.escapeHtml(value || '—')}</strong></div>`;
    },

    handlePopupAction(event) {
      const button = event.target.closest('[data-ams-calendar-action]');
      if (!button) return;
      const row = this.admissionRows().find(item => item.admissionKey === button.dataset.key);
      if (!row) return;
      const action = button.dataset.amsCalendarAction;
      if (action === 'view360') {
        this.closeInquiryPopup();
        return window.AMSAdmissionDrawer?.open?.(row.key);
      }
      if (action === 'followup') return window.AMSAdmissionOps?.showFollowup?.(row.key);
      if (action === 'interview') return window.AMSInterviews?.openStudentSchedule?.(row);
      if (action === 'call') window.location.href = `tel:${window.AMSStudentList?.phone?.(row.phone) || row.phone || ''}`;
    },

    refreshInquiryPopup() {
      const overlay = document.getElementById('calendar-inquiry-popup');
      if (!overlay || !this.popupLeadIds?.length) return;
      const requested = new Set(this.popupLeadIds.map(Number));
      const rows = this.admissionRows().filter(row => requested.has(Number(row.calendarId)));
      if (!rows.length) return this.closeInquiryPopup();
      const title = overlay.querySelector('#calendar-inquiry-popup-title');
      const list = overlay.querySelector('.ams-calendar-popup-list');
      if (title) title.textContent = `${rows.length} Admission ${rows.length === 1 ? 'Record' : 'Records'}`;
      if (list) list.innerHTML = rows.map(row => this.renderAdmissionPopupCard(row)).join('');
    },

    getScopedLeads() {
      return this.admissionRows();
    },

    calendarEvents() {
      const rows = this.admissionRows();
      const events = [];
      const seen = new Set();
      const add = event => {
        if (!event.lead || !event.dateKey) return;
        const signature = `${event.lead.admissionKey}|${event.dateKey}|${event.time}|${event.title}`;
        if (seen.has(signature)) return;
        seen.add(signature);
        events.push(event);
      };

      rows.forEach(row => {
        const activities = window.AMSAdmissionOps?.store?.activities?.[row.key] || [];
        activities.forEach(activity => {
          const payload = activity.payload || {};
          const dateKey = this.parseDateKey(payload.followupDate || payload.date || String(activity.at || '').slice(0, 10));
          const isOverdue = activity.type === 'followup' && dateKey && dateKey < this.dateKey(this.today);
          add({
            dateKey,
            time: this.normalizeTime(payload.followupTime || String(activity.at || '').slice(11, 16)),
            type: isOverdue ? 'overdue' : activity.type === 'followup' ? 'followup' : 'counselling',
            title: isOverdue ? 'Overdue Follow-up' : this.activityTitle(activity),
            completed: ['document', 'otr'].includes(activity.type),
            lead: row,
            source: 'activity',
            sourceId: activity.id
          });
        });

        if (row.followupDate && !activities.some(activity => activity.payload?.followupDate === row.followupDate)) {
          const dateKey = this.parseDateKey(row.followupDate);
          add({
            dateKey,
            time: this.normalizeTime(row.followupTime || '11:00'),
            type: dateKey < this.dateKey(this.today) ? 'overdue' : 'followup',
            title: dateKey < this.dateKey(this.today) ? 'Overdue Follow-up' : 'Follow-up',
            lead: row,
            source: 'followup'
          });
        }

        (window.AMSInterviews?.interviewsForStudent?.(row) || []).forEach(interview => {
          add({
            dateKey: String(interview.datetime || '').slice(0, 10),
            time: this.normalizeTime(String(interview.datetime || '').slice(11, 16)),
            type: interview.status === 'Cancelled' ? 'overdue' : interview.status === 'Completed' ? 'followup' : 'counselling',
            title: `Interview · ${interview.status || 'Scheduled'}`,
            completed: interview.status === 'Completed',
            lead: row,
            source: 'interview',
            sourceId: interview.id
          });
        });

        const statusDate = this.parseDateKey(String(row.updatedAt || row.admissionDateTime || row.admissionDate || '').slice(0, 10));
        if (statusDate) {
          const statusTitles = {
            otr: 'OTR Form',
            course_selection: 'Course Selection',
            exam: 'Exam',
            interview: 'Interview Stage',
            fees_pending: 'Fees Pending',
            confirmed: 'Admission Confirmation',
            closed: 'Admission Closed'
          };
          add({
            dateKey: statusDate,
            time: this.normalizeTime(String(row.updatedAt || row.admissionDateTime || '').slice(11, 16)),
            type: row.stageKey === 'closed' ? 'overdue' : ['confirmed', 'interview'].includes(row.stageKey) ? 'followup' : 'pending',
            title: statusTitles[row.stageKey] || 'Admission Update',
            completed: row.stageKey === 'confirmed',
            lead: row,
            source: 'admission'
          });
        }

        if (!row.followupDate && !['confirmed', 'closed'].includes(row.stageKey)) {
          const pendingDate = this.parseDateKey(row.nextActionDate)
            || this.parseDateKey(row.admissionDate)
            || this.dateKey(this.today);
          add({
            dateKey: pendingDate,
            time: this.normalizeTime('10:00'),
            type: 'pending',
            title: 'Pending Admission Action',
            lead: row,
            source: 'pending'
          });
        }
      });

      return events.sort((left, right) => `${left.dateKey} ${left.time}`.localeCompare(`${right.dateKey} ${right.time}`));
    },

    activityTitle(activity) {
      const title = String(activity.title || 'Admission Activity');
      if (activity.type === 'document') return 'Document Verification';
      if (activity.type === 'otr') return 'OTR Form';
      return title;
    },

    getCalendarItemCategory(item) {
      if (item?.completed) return 'completed';
      const title = String(item?.title || '').toLowerCase();
      if (title.includes('overdue')) return 'overdue';
      if (item?.type === 'pending') return 'pending';
      if (title.includes('follow-up') || item?.type === 'followup') return 'followup';
      if (title.includes('interview') || item?.type === 'counselling') return 'counselling';
      return item?.type || 'pending';
    },

    getBaseWeekItems(anchorDate = this.selectedDate) {
      const start = this.startOfWeek(anchorDate);
      const end = this.addDays(start, 6);
      const startKey = this.dateKey(start);
      const endKey = this.dateKey(end);
      return this.calendarEvents().filter(item => item.dateKey >= startKey && item.dateKey <= endKey);
    },

    getCalendarCounts(dateKey) {
      return this.calendarEvents()
        .filter(item => item.dateKey === dateKey)
        .reduce((counts, item) => {
          const category = this.getCalendarItemCategory(item);
          if (category === 'pending') counts.pending += 1;
          else if (category === 'overdue') counts.overdue += 1;
          else if (category === 'followup') counts.followup += 1;
          else counts.completed += 1;
          return counts;
        }, { pending: 0, overdue: 0, followup: 0, completed: 0 });
    },

    getLeadGroups() {
      const selectedKey = this.dateKey(this.selectedDate);
      const events = this.calendarEvents();
      const groups = {
        overdue: events.filter(item => this.getCalendarItemCategory(item) === 'overdue' && item.dateKey <= selectedKey),
        followup: events.filter(item => this.getCalendarItemCategory(item) === 'followup' && item.dateKey === selectedKey),
        pending: events.filter(item => this.getCalendarItemCategory(item) === 'pending' && item.dateKey <= selectedKey)
      };
      const unique = items => {
        const used = new Set();
        return items.filter(item => {
          if (used.has(item.lead.admissionKey)) return false;
          used.add(item.lead.admissionKey);
          return true;
        }).map((item, index) => ({ lead: item.lead, time: item.time, color: palette[index % palette.length] }));
      };
      return { overdue: unique(groups.overdue), followup: unique(groups.followup), pending: unique(groups.pending) };
    },

    isPendingLead(row) {
      return !row.followupDate && !['confirmed', 'closed'].includes(row.stageKey);
    },

    isFollowupLead(row) {
      return Boolean(row.followupDate);
    },

    isOverdueLead(row) {
      const key = this.parseDateKey(row.followupDate);
      return Boolean(key && key < this.dateKey(this.today));
    },

    renderRowPlanner() {
      const items = this.getPeriodItems(true);
      const title = this.viewMode === 'day'
        ? `${this.weekdayLong(this.selectedDate)}, ${this.monthNames()[this.selectedDate.getMonth()]} ${this.selectedDate.getDate()}, ${this.selectedDate.getFullYear()}`
        : this.viewMode === 'month'
          ? `${this.monthNames()[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`
          : this.formatDateRange(this.startOfWeek(this.selectedDate), this.addDays(this.startOfWeek(this.selectedDate), 6));
      return `
        <div class="calendar-card-v2 week-planner-card calendar-row-planner-card">
          ${this.renderPlannerToolbar(title, this.viewMode)}
          <div class="calendar-row-list ams-calendar-row-list">
            ${items.length ? items.map(item => `
              <button type="button" class="ams-calendar-row-event event-${item.type}" onclick="CalendarModule.openLeadRow(${item.lead.calendarId}, event)">
                <time>${this.escapeHtml(item.dateKey)} · ${this.escapeHtml(item.time)}</time>
                <span><strong>${this.escapeHtml(item.title)}</strong><small>${this.escapeHtml(item.lead.name)} · ${this.escapeHtml(item.lead.otrNo || item.lead.admissionNo)} · ${this.escapeHtml(item.lead.course || 'Course not assigned')}</small></span>
                <em>${this.escapeHtml(item.lead.owner || 'Admission Desk')}</em>
                <i class="fas fa-chevron-right"></i>
              </button>`).join('') : '<div class="calendar-row-empty">No admission activity requires action for this period.</div>'}
          </div>
        </div>
      `;
    },

    renderHourCell(date, hour) {
      const key = this.dateKey(date);
      const items = this.getWeekItems().filter(item => item.dateKey === key && this.slotHour(item.time) === hour);
      return `
        <div class="week-hour-cell">
          ${items.map(item => `
            <button type="button" class="week-event event-${item.type}" onclick="CalendarModule.openLeadRow(${item.lead.calendarId}, event)" title="${this.escapeHtml(`${item.title} · ${item.lead.name} · ${item.lead.otrNo || item.lead.admissionNo} · ${item.lead.course || 'Course not assigned'} · ${item.lead.owner || 'Admission Desk'}`)}">
              <span>${this.escapeHtml(item.time)}</span>
              <strong>${this.escapeHtml(item.title)}</strong>
              <small>${this.escapeHtml(`${item.lead.name} · ${item.lead.otrNo || item.lead.admissionNo}`)}</small>
            </button>
          `).join('')}
        </div>
      `;
    },

    renderDayPlanner() {
      const hours = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
      const dayItems = this.getItemsForDate(this.selectedDate, true);
      const title = `${this.weekdayLong(this.selectedDate)}, ${this.monthNames()[this.selectedDate.getMonth()]} ${this.selectedDate.getDate()}, ${this.selectedDate.getFullYear()}`;
      return `
        <div class="calendar-card-v2 week-planner-card day-planner-card">
          ${this.renderPlannerToolbar(title, 'day')}
          <div class="day-agenda">
            <div class="day-agenda-summary"><strong>${dayItems.length}</strong><span>scheduled item${dayItems.length === 1 ? '' : 's'}</span></div>
            <div class="day-agenda-grid">
              ${hours.map(hour => {
                const items = dayItems.filter(item => this.slotHour(item.time) === hour);
                return `<div class="day-time-label">${hour}</div><div class="day-time-slot">${items.length ? items.map(item => this.renderAgendaEvent(item)).join('') : '<span class="empty-slot">No activity scheduled</span>'}</div>`;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    },

    renderAgendaEvent(item) {
      return `
        <button type="button" class="agenda-event event-${item.type}" onclick="CalendarModule.openLeadRow(${item.lead.calendarId}, event)">
          <span>${this.escapeHtml(item.time)}</span>
          <strong>${this.escapeHtml(item.title)}</strong>
          <small>${this.escapeHtml(`${item.lead.name} · ${item.lead.otrNo || item.lead.admissionNo} · ${item.lead.course || 'Course not assigned'} · ${item.lead.owner || 'Admission Desk'}`)}</small>
        </button>
      `;
    },

    leadAction(type, admissionId, event) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      const row = this.rowByCalendarId(admissionId);
      if (!row) return;
      if (type === 'call') window.location.href = `tel:${window.AMSStudentList?.phone?.(row.phone) || row.phone || ''}`;
      else if (type === 'whatsapp') window.open(`https://wa.me/91${window.AMSStudentList?.phone?.(row.phone) || ''}`, '_blank', 'noopener');
      else if (type === 'remark') window.AMSAdmissionOps?.showFollowup?.(row.key);
    },

    normalizeTime(value) {
      const raw = String(value || '').trim();
      if (/^\d{1,2}:\d{2}\s(?:AM|PM)$/i.test(raw)) return raw.replace(/^(\d):/, '0$1:').toUpperCase();
      const match = raw.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return '10:00 AM';
      const hour = Number(match[1]);
      const minute = match[2];
      const suffix = hour >= 12 ? 'PM' : 'AM';
      return `${hour % 12 || 12}:${minute} ${suffix}`;
    },

    slotHour(value) {
      const match = String(value || '').match(/^(\d{1,2}):\d{2}\s(AM|PM)$/i);
      if (!match) return '10:00 AM';
      return `${Number(match[1])}:00 ${match[2].toUpperCase()}`;
    }
  });

  window.AMSCalendar = AMSCalendar;
})();
