// ============================================================
// LEADS.JS — Lead List Module
// ============================================================

const LeadsModule = {
  leads: [],
  filteredLeads: [],
  activeStatus: 'all',
  activeSubStatus: 'exam',
  viewMode: 'row',
  allExpanded: false,
  currentPage: 1,
  perPage: 10,
  selectedLeads: new Set(),
  filterCourse: 'all',
  filterSource: 'all',
  filterSearch: '',
  filterCounselor: 'all',
  filterMode: 'all',
  filterAcademicStatus: 'all',
  filterCity: '',
  filterInquiryDate: '',
  filterFollowupDate: '',
  filterSegment: 'all',
  sortOption: 'date-newest',

  init() {
    this.leads = [...window.APP_DATA.LEAD_DATA];
    this.injectMockLeads();
    this.filteredLeads = [...this.leads];
    this.selectedLeads.clear();
    
    this.renderStatusBar();
    this.setupFilters();
    this.applyFilters();
    this.setupToolbar();
    this.updateStatusBarCounts();
  },

  injectMockLeads() {
    // If not already injected, add some leads for other statuses
    if (this.leads.length <= 6) {
      const extraLeads = [
        {
          id: 10, enqNo: 'ENQ1001', name: 'Amit Kumar', phone: '9988776655', whatsapp: '9988776655',
          email: 'amit.kumar@gmail.com', city: 'Surat, Gujarat', course: 'UPSC Foundation',
          mode: 'Classroom', source: 'Instagram Ad', campaign: 'UPSC May 2026',
          inquiryDate: '26-06-2026 10:00 AM', owner: 'Bharat Sir', ownerTeam: 'UPSC Team',
          status: 'exam', statusLabel: 'Exam Scheduled', priority: 'medium',
          leadScore: 75, leadAge: '0 Days', academicStatus: 'Graduation Running',
          query: 'Exam syllabus.', assignedTo: 'Bharat Sir',
          assignedDate: '26-06-2026 10:00 AM', timeAgo: '7 hrs ago', isHot: false,
          stage: 3, stageLabel: 'Form Sent',
          communications: []
        },
        {
          id: 11, enqNo: 'ENQ1002', name: 'Priya Sharma', phone: '9911223344', whatsapp: '9911223344',
          email: 'priya.sharma@gmail.com', city: 'Rajkot, Gujarat', course: 'GPSC Class 1-2',
          mode: 'Online', source: 'Website', campaign: '-',
          inquiryDate: '25-06-2026 11:30 AM', owner: 'Vivek Sir', ownerTeam: 'GPSC Team',
          status: 'interview', statusLabel: 'Interview Scheduled', priority: 'high',
          leadScore: 82, leadAge: '1 Day', academicStatus: 'Post Graduation',
          query: 'Interview prep.', assignedTo: 'Vivek Sir',
          assignedDate: '25-06-2026 11:30 AM', timeAgo: '1 day ago', isHot: true,
          stage: 3, stageLabel: 'Form Sent',
          communications: []
        },
        {
          id: 12, enqNo: 'ENQ1003', name: 'Rohan Mehta', phone: '9822334455', whatsapp: '9822334455',
          email: 'rohan.mehta@gmail.com', city: 'Ahmedabad, Gujarat', course: 'Sankalp Programme',
          mode: 'Residential Mode', source: 'Seminar', campaign: '-',
          inquiryDate: '24-06-2026 09:15 AM', owner: 'Pooja Shah', ownerTeam: 'Sankalp Team',
          status: 'admission_confirmed', statusLabel: 'Admission Confirmed', priority: 'high',
          leadScore: 95, leadAge: '2 Days', academicStatus: 'Graduation Completed',
          query: 'Fees paid.', assignedTo: 'Pooja Shah',
          assignedDate: '24-06-2026 09:15 AM', timeAgo: '2 days ago', isHot: false,
          stage: 4, stageLabel: 'Admission',
          communications: []
        },
        {
          id: 13, enqNo: 'ENQ1004', name: 'Kunal Patel', phone: '9733445566', whatsapp: '9733445566',
          email: 'kunal.patel@gmail.com', city: 'Vadodara, Gujarat', course: 'UPSC Foundation',
          mode: 'Classroom', source: 'Walk-in', campaign: '-',
          inquiryDate: '23-06-2026 04:00 PM', owner: 'Bharat Sir', ownerTeam: 'UPSC Team',
          status: 'admission_rejected', statusLabel: 'Admission Rejected', priority: 'low',
          leadScore: 40, leadAge: '3 Days', academicStatus: 'Graduation Completed',
          query: 'Could not pass test.', assignedTo: 'Bharat Sir',
          assignedDate: '23-06-2026 04:00 PM', timeAgo: '3 days ago', isHot: false,
          stage: 4, stageLabel: 'Admission',
          communications: []
        },
        {
          id: 14, enqNo: 'ENQ1005', name: 'Divya Shah', phone: '9644556677', whatsapp: '9644556677',
          email: 'divya.shah@gmail.com', city: 'Surat, Gujarat', course: 'GPSC Class 1-2',
          mode: 'Online', source: 'Google Ads', campaign: '-',
          inquiryDate: '22-06-2026 12:00 PM', owner: 'Jignesh Trivedi', ownerTeam: 'Admin',
          status: 'closed', statusLabel: 'Closed', priority: 'low',
          leadScore: 30, leadAge: '4 Days', academicStatus: 'HSC Completed',
          query: 'Not interested anymore.', assignedTo: 'Jignesh Trivedi',
          assignedDate: '22-06-2026 12:00 PM', timeAgo: '4 days ago', isHot: false,
          stage: 5, stageLabel: 'Closed',
          communications: []
        }
      ];
      this.leads.push(...extraLeads);
      this.syncAppDataLeads();
    }
  },

  syncAppDataLeads() {
    if (!window.APP_DATA) return;
    window.APP_DATA.LEAD_DATA = this.leads;
  },

  getLeadStatusKey(lead) {
    if (lead.archived) return null;
    const stageLabel = (lead.stageLabel || '').toLowerCase();
    const status = (lead.status || '').toLowerCase();
    const priority = (lead.priority || '').toLowerCase();
    
    // Check Admission Form sub-statuses
    if (status === 'exam' || status === 'interview' || status === 'admission_confirmed' || status === 'admission_rejected' || status === 'admissionconfirmed' || status === 'admissionrejected') {
      return 'admission_form';
    }
    if (status === 'converted' || status === 'admission_confirmed' || stageLabel === 'student created') return 'converted';
    if (status === 'lost' || status === 'not_interested') return 'lost';
    if (status === 'closed') return 'closed';
    if (status === 'admission_process' || stageLabel === 'admission') return 'admission_process';
    if (stageLabel === 'counselling' || status === 'counselling') {
      return 'counselling';
    }
    if (status === 'followup' || lead.followupDate) return 'followup';
    if (status === 'interested') return priority === 'high' || lead.isHot ? 'hotlead' : 'interested';
    if (priority === 'low') return 'coldlead';
    if (status === 'contacted' || stageLabel === 'contacted') return 'contacted';
    if (status === 'pending') return 'pending';
    return 'new'; // default
  },

  getLeadSubStatusKey(lead) {
    const status = (lead.status || '').toLowerCase();
    if (status === 'exam') return 'exam';
    if (status === 'interview') return 'interview';
    if (status === 'admission_confirmed' || status === 'admissionconfirmed') return 'admission_confirmed';
    if (status === 'admission_rejected' || status === 'admissionrejected') return 'admission_rejected';
    return null;
  },

  renderStatusBar() {
    const statuses = [
      { key: 'all', label: 'All' },
      { key: 'new', label: 'New Inquiry' },
      { key: 'contacted', label: 'Contacted' },
      { key: 'interested', label: 'Interested' },
      { key: 'followup', label: 'Follow-up' },
      { key: 'counselling', label: 'Counselling' },
      { key: 'hotlead', label: 'Hot Lead' },
      { key: 'coldlead', label: 'Cold Lead' },
      { key: 'admission_process', label: 'Admission Process' },
      { key: 'converted', label: 'Converted' },
      { key: 'lost', label: 'Lost' },
      { key: 'closed', label: 'Closed' },
      { key: 'admission_form', label: 'Admission Forms' }
    ];
    const container = document.getElementById('status-bar');
    if (!container) return;
    container.innerHTML = statuses.map(s => `
      <div class="status-tab ${s.key === this.activeStatus ? 'active' : ''}" 
           data-status="${s.key}" id="status-tab-${s.key}" onclick="LeadsModule.setStatus('${s.key}', this)">
        ${s.label}
        <span class="status-count" id="count-status-${s.key}">0</span>
      </div>
    `).join('');
  },

  updateStatusBarCounts() {
    const counts = {
      all: 0, new: 0, pending: 0, contacted: 0, interested: 0, followup: 0, counselling: 0, hotlead: 0, coldlead: 0,
      admission_process: 0, converted: 0, lost: 0, closed: 0, admission_form: 0,
      exam: 0, interview: 0, admission_confirmed: 0, admission_rejected: 0
    };
    
    this.leads.forEach(l => {
      if (l.archived) return;
      counts.all++;
      const statusKey = this.getLeadStatusKey(l);
      if (statusKey && counts.hasOwnProperty(statusKey)) {
        counts[statusKey]++;
      }
      
      // Calculate sub-statuses
      const subStatusKey = this.getLeadSubStatusKey(l);
      if (subStatusKey && counts.hasOwnProperty(subStatusKey)) {
        counts[subStatusKey]++;
      }
    });
    
    // Assign count labels
    for (const [key, count] of Object.entries(counts)) {
      const el = document.getElementById(`count-status-${key}`) || document.getElementById(`count-${key}`);
      if (el) el.textContent = count;
    }
  },

  setStatus(key, el) {
    this.activeStatus = key;
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    
    const subBar = document.getElementById('status-sub-bar');
    if (key === 'admission_form') {
      if (subBar) subBar.style.display = 'flex';
      document.querySelectorAll('.status-sub-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.substatus === this.activeSubStatus);
      });
    } else {
      if (subBar) subBar.style.display = 'none';
    }
    
    this.applyFilters();
  },

  setSubStatus(key, el) {
    this.activeSubStatus = key;
    document.querySelectorAll('.status-sub-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    this.applyFilters();
  },

  applyFilters() {
    this.filterCourse = document.getElementById('filter-course')?.value || this.filterCourse || 'all';
    this.filterSource = document.getElementById('filter-source')?.value || this.filterSource || 'all';
    this.filterSearch = document.getElementById('filter-search-input')?.value || this.filterSearch || '';
    let result = [...this.leads].filter(l => !l.archived);

    // Apply status filter
    if (this.activeStatus !== 'all') {
      if (this.activeStatus === 'admission_form') {
        result = result.filter(l => this.getLeadSubStatusKey(l) === this.activeSubStatus);
      } else {
        result = result.filter(l => this.getLeadStatusKey(l) === this.activeStatus);
      }
    }

    // Apply course filter
    if (this.filterCourse !== 'all') {
      result = result.filter(l => l.course === this.filterCourse);
    }

    // Apply source filter
    if (this.filterSource !== 'all') {
      result = result.filter(l => l.source === this.filterSource || this.normalizeSource(l.source) === this.normalizeSource(this.filterSource));
    }

    this.filterCounselor = document.getElementById('filter-counselor')?.value || this.filterCounselor || 'all';
    this.filterMode = document.getElementById('filter-mode')?.value || this.filterMode || 'all';
    this.filterAcademicStatus = document.getElementById('filter-academic-status')?.value || this.filterAcademicStatus || 'all';
    this.filterCity = document.getElementById('filter-city')?.value || this.filterCity || '';
    this.filterInquiryDate = document.getElementById('filter-inquiry-date')?.value || this.filterInquiryDate || '';
    this.filterFollowupDate = document.getElementById('filter-followup-date')?.value || this.filterFollowupDate || '';
    this.filterSegment = document.getElementById('filter-segment')?.value || this.filterSegment || 'all';

    if (this.filterCounselor !== 'all') {
      result = result.filter(l => this.filterCounselor === 'Unassigned' ? !l.assignedTo || l.assignedTo === 'Unassigned' : (l.assignedTo || l.owner) === this.filterCounselor);
    }
    if (this.filterMode !== 'all') {
      result = result.filter(l => l.mode === this.filterMode);
    }
    if (this.filterAcademicStatus !== 'all') {
      result = result.filter(l => l.academicStatus === this.filterAcademicStatus);
    }
    if (this.filterCity) {
      const city = this.filterCity.toLowerCase();
      result = result.filter(l => (l.city || '').toLowerCase().includes(city));
    }
    if (this.filterInquiryDate) {
      result = result.filter(l => this.dateKey(l.inquiryDate) === this.filterInquiryDate);
    }
    if (this.filterFollowupDate) {
      result = result.filter(l => this.dateKey(l.followupDate) === this.filterFollowupDate);
    }
    if (this.filterSegment !== 'all') {
      const segment = window.APP_DATA.SEGMENT_DATA?.find(s => s.name === this.filterSegment);
      if (segment) result = result.filter(l => segment.leadIds.includes(l.id));
    }

    // Apply search filter
    if (this.filterSearch) {
      const q = this.filterSearch.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.enqNo.toLowerCase().includes(q) ||
        l.course.toLowerCase().includes(q)
      );
    }

    // Apply Sorting
    if (this.sortOption === 'date-newest') {
      result.sort((a, b) => b.id - a.id);
    } else if (this.sortOption === 'date-oldest') {
      result.sort((a, b) => a.id - b.id);
    } else if (this.sortOption === 'score-highest') {
      result.sort((a, b) => b.leadScore - a.leadScore);
    } else if (this.sortOption === 'score-lowest') {
      result.sort((a, b) => a.leadScore - b.leadScore);
    } else if (this.sortOption === 'name-az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortOption === 'name-za') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (this.sortOption === 'followup-date') {
      result.sort((a, b) => (this.dateKey(a.followupDate) || '9999').localeCompare(this.dateKey(b.followupDate) || '9999'));
    } else if (this.sortOption === 'last-updated') {
      result.sort((a, b) => b.id - a.id);
    }

    this.filteredLeads = result;
    const maxPage = Math.max(1, Math.ceil(this.filteredLeads.length / this.perPage));
    if (this.currentPage > maxPage) this.currentPage = maxPage;
    this.renderLeads();
    this.updateSelectAllCheckboxState();
    this.updateSelectionUI();
    this.syncCollapseAllButton();
  },

  normalizeSource(value = '') {
    return String(value).toLowerCase().replace(/[-\s]/g, '');
  },

  dateKey(value = '') {
    if (!value || value === '-') return '';
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

  getLeadSegmentName(lead) {
    const segment = window.APP_DATA.SEGMENT_DATA?.find(item => item.leadIds?.includes(lead.id) && !item.archived);
    return segment?.name || '';
  },

  renderLeads() {
    const container = document.getElementById('lead-list');
    if (!container) return;
    const total = this.filteredLeads.length;
    const start = total ? (this.currentPage - 1) * this.perPage : 0;
    const end = Math.min(start + this.perPage, total);
    const pageLeads = this.filteredLeads.slice(start, end);

    if (total === 0) {
      container.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text-muted)">
        <i class="fas fa-search" style="font-size:32px;margin-bottom:12px;opacity:0.3"></i>
        <p style="font-size:14px">No leads found</p>
      </div>`;
      const info1 = document.getElementById('leads-count-label');
      const info2 = document.getElementById('leads-count-label-2');
      if (info1) info1.textContent = `Showing 0 of 0 leads`;
      if (info2) info2.textContent = `Showing 0 of 0 leads`;
      this.renderPagination();
      return;
    }
    
    container.innerHTML = pageLeads.map((lead, idx) => this.renderLeadCard(lead, start + idx + 1)).join('');
    
    const labelText = `Showing ${start + 1} to ${end} of ${total} leads`;
    const info1 = document.getElementById('leads-count-label');
    const info2 = document.getElementById('leads-count-label-2');
    if (info1) info1.textContent = labelText;
    if (info2) info2.textContent = labelText;
    this.renderPagination();
  },

  renderPagination() {
    const totalPages = Math.max(1, Math.ceil(this.filteredLeads.length / this.perPage));
    const btnWrap = document.querySelector('.pagination-btns');
    const sizeSelect = document.querySelector('.page-size-select');
    if (btnWrap) {
      const visible = new Set([1, totalPages, this.currentPage - 1, this.currentPage, this.currentPage + 1].filter(p => p >= 1 && p <= totalPages));
      const pages = Array.from(visible).sort((a, b) => a - b);
      let html = `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="LeadsModule.setPage(${this.currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
      pages.forEach((page, index) => {
        if (index > 0 && page - pages[index - 1] > 1) html += `<span style="padding:0 4px;color:var(--text-muted);font-size:12px">...</span>`;
        html += `<button class="page-btn ${page === this.currentPage ? 'active' : ''}" onclick="LeadsModule.setPage(${page})">${page}</button>`;
      });
      html += `<button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="LeadsModule.setPage(${this.currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
      btnWrap.innerHTML = html;
    }
    if (sizeSelect) {
      sizeSelect.value = `${this.perPage} / page`;
      sizeSelect.onchange = () => this.setPageSize(parseInt(sizeSelect.value, 10));
    }
  },

  setPage(page) {
    const totalPages = Math.max(1, Math.ceil(this.filteredLeads.length / this.perPage));
    this.currentPage = Math.min(Math.max(1, page), totalPages);
    this.renderLeads();
    this.updateSelectAllCheckboxState();
  },

  setPageSize(size) {
    this.perPage = Number.isFinite(size) ? size : 10;
    this.currentPage = 1;
    this.renderLeads();
    this.updateSelectAllCheckboxState();
  },

  renderLeadCard(lead, num) {
    const statusClass = `status-${lead.status}`;
    const isExpanded = this.allExpanded;
    const avatarLetter = lead.name.charAt(0);
    const avatarColors = ['#4F6EF7','#10B981','#F59E0B','#8B5CF6','#F97316','#EF4444','#06B6D4'];
    const avatarColor = avatarColors[lead.id % avatarColors.length];
    const isChecked = this.selectedLeads.has(lead.id) ? 'checked' : '';

    return `
      <div class="lead-card ${isExpanded ? 'is-expanded' : ''}" id="lead-card-${lead.id}">
        <div class="lead-card-header" onclick="LeadsModule.handleRowClick(event, ${lead.id})">
          <div class="lead-checkbox-cell" onclick="event.stopPropagation()">
            <input type="checkbox" class="lead-select-checkbox" data-id="${lead.id}" ${isChecked} onchange="LeadsModule.toggleLeadSelection(${lead.id})">
          </div>
          <div class="lead-number">${num}</div>
          <div class="lead-avatar" style="background:${avatarColor}">
            ${avatarLetter}
            ${lead.isHot ? '<span class="hot-indicator"></span>' : ''}
          </div>
          <div class="lead-main-info">
            <div class="lead-name-row">
              <span class="lead-name" onclick="DrawerModule.open(${lead.id}); event.stopPropagation()">${lead.name}</span>
              ${lead.isHot ? '<span class="badge badge-danger" style="font-size:9px;padding:1px 6px">🔥 Hot</span>' : ''}
            </div>
            <div class="lead-phone">
              <i class="fas fa-phone"></i> ${lead.phone}
              <i class="fab fa-whatsapp wa-icon" style="margin-left:4px"></i>
            </div>
            <div class="lead-tags-row">
              <span class="lead-mini-tag">${lead.assignedTo || 'Unassigned'}</span>
              <span class="lead-mini-tag">${lead.followupDate ? 'Next: ' + lead.followupDate : 'No follow-up'}</span>
              <span class="lead-mini-tag">Score ${lead.leadScore || 0}</span>
            </div>
          </div>

          <div class="lead-status-wrap">
            <span class="lead-status-pill ${statusClass}">${lead.statusLabel}</span>
            <span class="status-type-tag">New Enquiry</span>
          </div>

          <div class="lead-meta">
            <span class="lead-meta-item"><i class="fas fa-book"></i>${lead.course}</span>
            <span class="lead-meta-item"><i class="fas fa-map-marker-alt"></i>${lead.city}</span>
          </div>

          <span class="lead-timestamp">${lead.timeAgo}</span>

          <div class="lead-actions" onclick="event.stopPropagation()">
            <button class="lead-action-btn funnel-btn" data-tip="Follow-up History" onclick="LeadsModule.showFollowupHistory(${lead.id})">
              <i class="fas fa-history"></i>
            </button>
            <button class="lead-action-btn call-btn" data-tip="Call" onclick="LeadsModule.callLead(${lead.id})">
              <i class="fas fa-phone"></i>
            </button>
            <button class="lead-action-btn wa-btn" data-tip="WhatsApp" onclick="LeadsModule.whatsapp(${lead.id})">
              <i class="fab fa-whatsapp"></i>
            </button>
            <button class="lead-action-btn email-btn" data-tip="Email" onclick="LeadsModule.email(${lead.id})">
              <i class="fas fa-envelope"></i>
            </button>
            <div class="more-dropdown">
              <button class="lead-action-btn" data-tip="More Options" onclick="LeadsModule.toggleMoreMenu(event, ${lead.id})">
                <i class="fas fa-ellipsis-v"></i>
              </button>
            </div>
            <button class="lead-action-btn collapse-btn" data-tip="${isExpanded ? 'Collapse' : 'Expand'}" onclick="LeadsModule.toggleExpand(${lead.id}); event.stopPropagation()">
              <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'}" id="chevron-${lead.id}"></i>
            </button>
          </div>
        </div>

        <div class="lead-expanded-body" id="lead-body-${lead.id}" style="display:${isExpanded ? 'block' : 'none'}">
          <div class="lead-detail-grid">
            <div class="lead-detail-col">
              <div class="detail-row">
                <span class="detail-label">Ref. No</span>
                <span class="detail-value">${lead.enqNo}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Full Name</span>
                <span class="detail-value">${lead.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mobile No</span>
                <span class="detail-value">${lead.phone}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">City</span>
                <span class="detail-value">${lead.city}</span>
              </div>
            </div>
            <div class="lead-detail-col">
              <div class="detail-row">
                <span class="detail-label">Email ID</span>
                <span class="detail-value detail-link">${lead.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Academic Status</span>
                <span class="detail-value">${lead.academicStatus}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Class</span>
                <span class="detail-value">${lead.course}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Any Query</span>
                <span class="detail-value">${lead.query}</span>
              </div>
            </div>
            <div class="lead-detail-col">
              <div class="detail-row">
                <span class="detail-label">Mode of Learning</span>
                <span class="detail-value">${lead.mode}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Lead Date</span>
                <span class="detail-value">${lead.inquiryDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Source</span>
                <span class="detail-value">${lead.source}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Next Follow-up</span>
                <span class="detail-value">${lead.followupDate || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Last Activity</span>
                <span class="detail-value">${lead.communications?.[0]?.title || lead.stageLabel || 'Inquiry Created'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Tags</span>
                <span class="detail-value">${lead.isHot ? 'Hot Lead, ' : ''}${lead.segment || this.getLeadSegmentName(lead) || 'General Inquiry'}</span>
              </div>
            </div>
          </div>
          <div class="lead-assignment-row">
            <span><i class="fas fa-user-check"></i> Inquiry Assigned to <strong>${lead.assignedTo}</strong> on ${lead.assignedDate}</span>
            <button class="edit-assign-btn" onclick="LeadsModule.action('changeclass', ${lead.id})"><i class="fas fa-edit"></i></button>
          </div>
        </div>
      </div>
    `;
  },

  handleRowClick(e, id) {
    if (e.target.closest('.lead-select-checkbox') || 
        e.target.closest('.lead-action-btn') || 
        e.target.closest('.more-dropdown') ||
        e.target.closest('.lead-name') ||
        e.target.closest('.detail-link') ||
        e.target.closest('button')) {
      return;
    }
    DrawerModule.open(id);
  },

  toggleExpand(id) {
    const body = document.getElementById(`lead-body-${id}`);
    const card = document.getElementById(`lead-card-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    if (!body) return;
    const isVisible = body.style.display !== 'none';
    body.style.display = isVisible ? 'none' : 'block';
    if (card) card.classList.toggle('is-expanded', !isVisible);
    if (chevron) {
      chevron.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    }
    this.syncCollapseAllButton();
  },

  syncCollapseAllButton() {
    const cards = document.querySelectorAll('.lead-card');
    const expanded = document.querySelectorAll('.lead-card.is-expanded');
    const toggleBtn = document.getElementById('collapse-toggle-btn');
    if (!toggleBtn) return;
    if (cards.length > 0 && expanded.length === cards.length) {
      this.allExpanded = true;
      toggleBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Collapse All';
    } else {
      this.allExpanded = false;
      toggleBtn.innerHTML = '<i class="fas fa-expand-alt"></i> Expand All';
    }
  },

  toggleLeadSelection(id) {
    if (this.selectedLeads.has(id)) {
      this.selectedLeads.delete(id);
    } else {
      this.selectedLeads.add(id);
    }
    this.updateSelectAllCheckboxState();
    this.updateSelectionUI();
  },

  toggleSelectAll(masterCheckbox) {
    const checked = masterCheckbox.checked;
    const start = (this.currentPage - 1) * this.perPage;
    this.filteredLeads.slice(start, start + this.perPage).forEach(l => {
      if (checked) {
        this.selectedLeads.add(l.id);
      } else {
        this.selectedLeads.delete(l.id);
      }
    });
    document.querySelectorAll('.lead-select-checkbox').forEach(cb => {
      cb.checked = checked;
    });
    this.updateSelectionUI();
  },

  updateSelectAllCheckboxState() {
    const master = document.getElementById('select-all-leads');
    if (!master) return;
    const visibleIds = this.filteredLeads.slice((this.currentPage - 1) * this.perPage, this.currentPage * this.perPage).map(l => l.id);
    if (visibleIds.length === 0) {
      master.checked = false;
      master.disabled = true;
      return;
    }
    master.disabled = false;
    const selectedVisible = visibleIds.filter(id => this.selectedLeads.has(id)).length;
    master.checked = selectedVisible === visibleIds.length;
    master.indeterminate = selectedVisible > 0 && !master.checked;
  },

  updateSelectionUI() {
    const count = this.selectedLeads.size;
    const badge = document.getElementById('selected-count-badge');
    const badgeNum = document.getElementById('selected-count-num');
    const batchActions = document.getElementById('batch-actions-wrap');
    
    if (count > 0) {
      if (badge) badge.style.display = 'inline-block';
      if (badgeNum) badgeNum.textContent = count;
      if (batchActions) batchActions.style.display = 'flex';
    } else {
      if (badge) badge.style.display = 'none';
      if (batchActions) batchActions.style.display = 'none';
    }
  },

  batchAction(type) {
    const count = this.selectedLeads.size;
    if (count === 0) return;
    const selectedIds = Array.from(this.selectedLeads);
    const selectedNames = selectedIds.map(id => this.leads.find(l => l.id === id)?.name).filter(Boolean).slice(0, 3).join(', ');
    
    if (type === 'archive') {
      if (confirm(`Are you sure you want to archive ${count} selected lead(s)?\n(${selectedNames}${count > 3 ? '...' : ''})`)) {
        selectedIds.forEach(id => {
          const lead = this.leads.find(l => l.id === id);
          if (lead) lead.archived = true;
        });
        this.selectedLeads.clear();
        this.applyFilters();
        this.updateStatusBarCounts();
        this.showToast(`${count} lead(s) archived successfully!`, 'warning');
      }
    } else if (type === 'email') {
      this.bulkEmail(selectedIds);
    } else if (type === 'whatsapp') {
      this.bulkWhatsApp(selectedIds);
    } else if (type === 'assign') {
      selectedIds.forEach(id => {
        const lead = this.leads.find(l => l.id === id);
        if (lead) {
          lead.assignedTo = 'Bharat Sir';
          lead.owner = 'Bharat Sir';
          this.recordTimelineAction(lead, 'Bulk Assignment', 'Assigned through bulk operation.');
        }
      });
      this.applyFilters();
      this.showToast(`${count} lead(s) assigned to Bharat Sir`, 'success');
    } else if (type === 'status') {
      selectedIds.forEach(id => {
        const lead = this.leads.find(l => l.id === id);
        if (lead) {
          lead.status = 'followup';
          lead.statusLabel = 'Follow-up';
          this.recordTimelineAction(lead, 'Bulk Status Changed', 'Status moved to Follow-up.');
        }
      });
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast(`${count} lead status updated to Follow-up`, 'success');
    } else if (type === 'segment') {
      selectedIds.forEach(id => {
        const lead = this.leads.find(l => l.id === id);
        if (lead) lead.segment = 'Bulk Review Segment';
      });
      this.applyFilters();
      this.showToast(`${count} lead(s) added to segment`, 'success');
    } else if (type === 'export') {
      this.exportLeads(selectedIds);
    }
  },

  exportLeads(ids = null, filename = 'leads-export.csv') {
    const rows = ids ? this.leads.filter(l => ids.includes(l.id)) : this.filteredLeads;
    const headers = ['Enquiry No', 'Name', 'Phone', 'Email', 'City', 'Course', 'Source', 'Status', 'Assigned To', 'Inquiry Date'];
    const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(',')].concat(rows.map(lead => [
      lead.enqNo, lead.name, lead.phone, lead.email, lead.city, lead.course, lead.source, lead.statusLabel, lead.assignedTo || lead.owner || 'Unassigned', lead.inquiryDate
    ].map(escape).join(','))).join('\n');
    this.downloadTextFile(filename, csv, 'text/csv');
    this.showToast(`${rows.length} lead(s) exported`, 'success');
  },

  downloadTextFile(filename, text, type = 'text/plain') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  bulkEmail(ids = null) {
    const rows = ids ? this.leads.filter(l => ids.includes(l.id)) : this.filteredLeads;
    if (!rows.length) return this.showToast('No leads available to email', 'warning');
    rows.forEach(lead => this.recordTimelineAction(lead, 'Bulk Email Queued', 'Email communication prepared from lead list.'));
    window.location.href = `mailto:?bcc=${rows.map(l => l.email).filter(Boolean).join(',')}&subject=${encodeURIComponent('Pramukh Academy Inquiry Follow-up')}`;
    this.showToast(`Email prepared for ${rows.length} lead(s)`, 'success');
  },

  bulkWhatsApp(ids = null) {
    const rows = ids ? this.leads.filter(l => ids.includes(l.id)) : this.filteredLeads;
    if (!rows.length) return this.showToast('No leads available for WhatsApp', 'warning');
    rows.forEach(lead => this.recordTimelineAction(lead, 'Bulk WhatsApp Queued', 'WhatsApp follow-up prepared from lead list.'));
    const first = rows[0];
    window.open(`https://wa.me/${String(first.whatsapp || first.phone).replace(/\D/g, '')}?text=${encodeURIComponent('Hello, this is Pramukh Academy following up on your inquiry.')}`, '_blank');
    this.showToast(`WhatsApp prepared for ${rows.length} lead(s); opened first lead`, 'success');
  },

  showImportModal() {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas fa-file-import" style="color:var(--primary)"></i> Import Leads</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body">
          <div class="form-field full">
            <label>CSV File</label>
            <input type="file" id="lead-import-file" accept=".csv,text/csv">
          </div>
          <div style="font-size:12px;color:var(--text-muted)">Expected columns: name, phone, email, city, course, source.</div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-outline btn-sm" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="LeadsModule.importLeadsFromFile()"><i class="fas fa-upload"></i> Import</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  importLeadsFromFile() {
    const file = document.getElementById('lead-import-file')?.files?.[0];
    if (!file) return this.showToast('Please choose a CSV file', 'warning');
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result || '').split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return this.showToast('CSV has no lead rows', 'warning');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const maxId = Math.max(...this.leads.map(l => Number(l.id) || 0), 0);
      const created = lines.slice(1).map((line, index) => {
        const cells = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const get = key => cells[headers.indexOf(key)] || '';
        return {
          id: maxId + index + 1,
          enqNo: `ENQ${Date.now().toString().slice(-5)}${index}`,
          name: get('name') || `Imported Lead ${index + 1}`,
          phone: get('phone'),
          whatsapp: get('phone'),
          email: get('email'),
          city: get('city') || '-',
          course: get('course') || 'UPSC Foundation',
          mode: 'Classroom',
          source: get('source') || 'Excel Import',
          campaign: '-',
          inquiryDate: new Date().toLocaleString('en-IN'),
          owner: 'Unassigned',
          ownerTeam: 'Admin',
          status: 'new',
          statusLabel: 'New',
          priority: 'medium',
          leadScore: 50,
          leadAge: '0 Days',
          academicStatus: 'Graduation Running',
          query: 'Imported lead.',
          assignedTo: 'Unassigned',
          assignedDate: '-',
          timeAgo: 'Just now',
          isHot: false,
          stage: 0,
          stageLabel: 'New',
          communications: []
        };
      });
      this.leads.unshift(...created);
      this.syncAppDataLeads();
      document.querySelector('.custom-modal-overlay')?.remove();
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast(`${created.length} lead(s) imported`, 'success');
    };
    reader.readAsText(file);
  },

  setupSortDropdown(e) {
    e.stopPropagation();
    document.querySelectorAll('.more-dropdown-menu').forEach(m => m.remove());
    const btn = document.getElementById('sort-toggle-btn');
    if (!btn) return;
    
    const menu = document.createElement('div');
    menu.className = 'more-dropdown-menu';
    menu.style.cssText = `
      position: absolute;
      top: ${btn.offsetTop + btn.offsetHeight + 4}px;
      left: ${btn.offsetLeft}px;
      z-index: 500;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-xl);
      min-width: 180px;
    `;
    
    const sortOpts = [
      { key: 'date-newest', label: 'Date: Newest First' },
      { key: 'date-oldest', label: 'Date: Oldest First' },
      { key: 'followup-date', label: 'Follow-up Date' },
      { key: 'last-updated', label: 'Last Updated' },
      { key: 'score-highest', label: 'Lead Score: High to Low' },
      { key: 'score-lowest', label: 'Lead Score: Low to High' },
      { key: 'name-az', label: 'Name: A to Z' },
      { key: 'name-za', label: 'Name: Z to A' }
    ];
    
    menu.innerHTML = sortOpts.map(o => `
      <div class="dropdown-item ${this.sortOption === o.key ? 'active' : ''}" 
           style="${this.sortOption === o.key ? 'background:var(--primary-light);color:var(--primary);font-weight:600' : ''}"
           onclick="LeadsModule.setSortOption('${o.key}')">
        ${o.label}
      </div>
    `).join('');
    
    document.querySelector('.leads-toolbar').appendChild(menu);
  },

  setSortOption(opt) {
    this.sortOption = opt;
    document.querySelectorAll('.more-dropdown-menu').forEach(m => m.remove());
    this.applyFilters();
    this.showToast(`Sorted by ${opt.replace('-', ' ')}`, 'info');
  },

  setupFilters() {
    const filterBtn = document.getElementById('filter-toggle-btn');
    const filterPanel = document.getElementById('leads-filter-panel');
    if (filterBtn && filterPanel) {
      filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = filterPanel.style.display === 'none';
        filterPanel.style.display = isHidden ? 'flex' : 'none';
        filterBtn.classList.toggle('active', isHidden);
      });
    }

    const searchInput = document.getElementById('quick-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.filterSearch = searchInput.value;
        const panelInput = document.getElementById('filter-search-input');
        if (panelInput) panelInput.value = searchInput.value;
        this.applyFilters();
      });
    }
  },

  resetFilters() {
    this.filterCourse = 'all';
    this.filterSource = 'all';
    this.filterSearch = '';
    this.filterCounselor = 'all';
    this.filterMode = 'all';
    this.filterAcademicStatus = 'all';
    this.filterCity = '';
    this.filterInquiryDate = '';
    this.filterFollowupDate = '';
    this.filterSegment = 'all';
    
    const courseSel = document.getElementById('filter-course');
    if (courseSel) courseSel.value = 'all';
    
    const sourceSel = document.getElementById('filter-source');
    if (sourceSel) sourceSel.value = 'all';
    
    const searchInput = document.getElementById('filter-search-input');
    if (searchInput) searchInput.value = '';

    ['filter-counselor', 'filter-mode', 'filter-academic-status', 'filter-segment'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = 'all';
    });
    ['filter-city', 'filter-inquiry-date', 'filter-followup-date'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    const quickSearch = document.getElementById('quick-search-input');
    if (quickSearch) quickSearch.value = '';
    
    this.applyFilters();
    this.showToast('Filters cleared', 'info');
  },

  toggleMoreMenu(e, id) {
    e.stopPropagation();
    document.querySelectorAll('.more-dropdown-menu').forEach(m => m.remove());
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    
    const menu = document.createElement('div');
    menu.className = 'more-dropdown-menu';
    menu.innerHTML = `
      <div class="dropdown-item" onclick="LeadsModule.action('followup', ${id})"><i class="fas fa-redo"></i> Manage Follow-up</div>
      <div class="dropdown-item" onclick="LeadsModule.action('counselling', ${id})"><i class="fas fa-comments"></i> Schedule Counselling</div>
      <div class="dropdown-item" onclick="LeadsModule.action('note', ${id})"><i class="fas fa-sticky-note"></i> Add Internal Note</div>
      <div class="dropdown-item" onclick="LeadsModule.action('assign', ${id})"><i class="fas fa-user-check"></i> Assign / Reassign</div>
      <div class="dropdown-item" onclick="LeadsModule.action('edit', ${id})"><i class="fas fa-edit"></i> Edit Lead</div>
      <div class="dropdown-item" onclick="LeadsModule.action('submit', ${id})"><i class="fas fa-paper-plane"></i> Submit Lead</div>
      <div class="dropdown-item" onclick="LeadsModule.action('convert', ${id})"><i class="fas fa-graduation-cap"></i> Convert to Admission</div>
      <div class="dropdown-item" onclick="LeadsModule.action('print', ${id})"><i class="fas fa-print"></i> Print Inquiry Form</div>
      <div class="dropdown-item" onclick="LeadsModule.action('copy', ${id})"><i class="fas fa-copy"></i> Copy Lead (New Course)</div>
      <div class="dropdown-item" onclick="LeadsModule.action('changeclass', ${id})"><i class="fas fa-exchange-alt"></i> Change Class / Status</div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item danger" onclick="LeadsModule.action('lost', ${id})"><i class="fas fa-user-times"></i> Mark as Lost</div>
      <div class="dropdown-item danger" onclick="LeadsModule.action('archive', ${id})"><i class="fas fa-archive"></i> Archive Lead</div>
    `;
    e.currentTarget.closest('.more-dropdown').appendChild(menu);
    
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.right = '0';
      menu.style.left = 'auto';
    }
  },

  action(type, id) {
    document.querySelectorAll('.more-dropdown-menu').forEach(m => m.remove());
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    
    if (type === 'followup') {
      this.showManageFollowup(id);
    } else if (type === 'edit') {
      this.showAddEditModal(lead);
    } else if (type === 'submit') {
      this.submitLead(id);
    } else if (type === 'changeclass') {
      this.showChangeClassModal(id);
    } else if (type === 'note') {
      this.recordTimelineAction(lead, 'Internal Note', 'Internal note added for counselor review.');
      this.showToast(`Internal note added for ${lead.name}`, 'success');
    } else if (type === 'assign') {
      lead.assignedTo = lead.assignedTo === 'Bharat Sir' ? 'Vivek Sir' : 'Bharat Sir';
      lead.owner = lead.assignedTo;
      this.recordTimelineAction(lead, 'Assignment Changed', `Assigned to ${lead.assignedTo}.`);
      this.applyFilters();
      this.showToast(`${lead.name} assigned to ${lead.assignedTo}`, 'success');
    } else if (type === 'counselling') {
      this.showCounsellingModal(id);
    } else if (type === 'convert') {
      lead.status = 'converted';
      lead.statusLabel = 'Converted';
      lead.stage = 8;
      this.recordTimelineAction(lead, 'Admission Process Started', 'Inquiry converted to admission workflow.');
      this.applyFilters();
      this.showToast(`${lead.name} converted to admission`, 'success');
    } else if (type === 'lost') {
      lead.status = 'lost';
      lead.statusLabel = 'Lost';
      lead.lostReason = lead.lostReason || 'No Response';
      this.recordTimelineAction(lead, 'Marked Lost', `Reason: ${lead.lostReason}`);
      this.applyFilters();
      this.showToast(`${lead.name} marked as lost`, 'warning');
    } else if (type === 'archive') {
      this.archiveLead(id);
    } else if (type === 'copy') {
      const copy = { ...lead, id: Date.now(), enqNo: `ENQ${Date.now().toString().slice(-6)}`, course: `${lead.course} (Copy)`, status: 'new', statusLabel: 'New', stage: 0, stageLabel: 'New', communications: [] };
      this.leads.unshift(copy);
      this.syncAppDataLeads();
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast(`Copied ${lead.name} as a new inquiry`, 'success');
    } else if (type === 'print') {
      DrawerModule.open(id);
      setTimeout(() => window.print(), 150);
    } else {
      const labels = {
        print: 'Print Inquiry Form',
        copy: 'Copy Lead for new course'
      };
      this.showToast(`${labels[type]} — ${lead.name}`, 'info');
    }
  },

  recordTimelineAction(lead, title, desc) {
    if (!lead.communications) lead.communications = [];
    const now = new Date();
    lead.communications.unshift({
      type: 'note',
      day: String(now.getDate()).padStart(2, '0'),
      month: now.toLocaleString('en-IN', { month: 'short' }),
      title,
      desc,
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      by: 'Bharat Sir'
    });
    this.syncAppDataLeads();
  },

  showAddEditModal(lead = null) {
    const isEdit = lead !== null;
    const title = isEdit ? 'Edit Lead Details' : 'Add New Inquiry';
    
    const name = isEdit ? lead.name : '';
    const phone = isEdit ? lead.phone : '';
    const email = isEdit ? lead.email : '';
    const city = isEdit ? lead.city : 'Ahmedabad';
    const course = isEdit ? lead.course : 'UPSC Foundation';
    const mode = isEdit ? lead.mode : 'Classroom';
    const source = isEdit ? lead.source : 'Instagram Ad';
    const priority = isEdit ? lead.priority : 'medium';
    const query = isEdit ? lead.query : '';
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card wide">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas ${isEdit ? 'fa-edit' : 'fa-user-plus'}" style="color:var(--primary)"></i>${title}</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body">
          <form id="add-lead-form" onsubmit="event.preventDefault(); LeadsModule.saveLeadForm(${isEdit ? lead.id : 'null'})">
            <div class="modal-grid-2">
              <div class="form-field">
                <label>Student Name *</label>
                <input type="text" id="m-name" value="${name}" required placeholder="Full Name">
              </div>
              <div class="form-field">
                <label>Mobile Number *</label>
                <input type="tel" id="m-phone" value="${phone}" required placeholder="10-digit number">
              </div>
              <div class="form-field">
                <label>Email Address</label>
                <input type="email" id="m-email" value="${email}" placeholder="email@gmail.com">
              </div>
              <div class="form-field">
                <label>City / Location</label>
                <input type="text" id="m-city" value="${city}" placeholder="City name">
              </div>
              <div class="form-field">
                <label>Course Interested</label>
                <select id="m-course">
                  <option value="UPSC Foundation" ${course === 'UPSC Foundation' ? 'selected' : ''}>UPSC Foundation</option>
                  <option value="GPSC (Class 1 & 2) - Foundation" ${course === 'GPSC (Class 1 & 2) - Foundation' ? 'selected' : ''}>GPSC Foundation</option>
                  <option value="GPSC Class 1-2" ${course === 'GPSC Class 1-2' ? 'selected' : ''}>GPSC Class 1-2</option>
                  <option value="Sankalp Programme" ${course === 'Sankalp Programme' ? 'selected' : ''}>Sankalp Programme</option>
                </select>
              </div>
              <div class="form-field">
                <label>Mode of Learning</label>
                <select id="m-mode">
                  <option value="Classroom" ${mode === 'Classroom' ? 'selected' : ''}>Classroom</option>
                  <option value="Online" ${mode === 'Online' ? 'selected' : ''}>Online</option>
                  <option value="Residential Mode" ${mode === 'Residential Mode' ? 'selected' : ''}>Residential Mode</option>
                  <option value="Walk-in" ${mode === 'Walk-in' ? 'selected' : ''}>Walk-in</option>
                </select>
              </div>
              <div class="form-field">
                <label>Source of Lead</label>
                <select id="m-source">
                  <option value="Instagram Ad" ${source === 'Instagram Ad' ? 'selected' : ''}>Instagram Ad</option>
                  <option value="Website" ${source === 'Website' ? 'selected' : ''}>Website</option>
                  <option value="Walk-in" ${source === 'Walk-in' ? 'selected' : ''}>Walk-in</option>
                  <option value="Google Ads" ${source === 'Google Ads' ? 'selected' : ''}>Google Ads</option>
                  <option value="Seminar" ${source === 'Seminar' ? 'selected' : ''}>Seminar</option>
                </select>
              </div>
              <div class="form-field">
                <label>Priority</label>
                <select id="m-priority">
                  <option value="high" ${priority === 'high' ? 'selected' : ''}>🔥 High</option>
                  <option value="medium" ${priority === 'medium' ? 'selected' : ''}>⚡ Medium</option>
                  <option value="low" ${priority === 'low' ? 'selected' : ''}>❄️ Low</option>
                </select>
              </div>
              <div class="form-field full">
                <label>Specific Query / Remarks</label>
                <textarea id="m-query" rows="2" placeholder="Ask details about...">${query}</textarea>
              </div>
            </div>
            <input type="submit" style="display:none" id="submit-hidden-btn">
          </form>
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-outline btn-sm" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('submit-hidden-btn').click()"><i class="fas fa-save"></i> Save Changes</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveLeadForm(leadId) {
    const isEdit = leadId !== null;
    const name = document.getElementById('m-name').value;
    const phone = document.getElementById('m-phone').value;
    const email = document.getElementById('m-email').value;
    const city = document.getElementById('m-city').value || '-';
    const course = document.getElementById('m-course').value;
    const mode = document.getElementById('m-mode').value;
    const source = document.getElementById('m-source').value;
    const priority = document.getElementById('m-priority').value;
    const query = document.getElementById('m-query').value;
    
    if (isEdit) {
      const lead = this.leads.find(l => l.id === leadId);
      if (lead) {
        lead.name = name;
        lead.phone = phone;
        lead.whatsapp = phone;
        lead.email = email;
        lead.city = city;
        lead.course = course;
        lead.mode = mode;
        lead.source = source;
        lead.priority = priority;
        lead.query = query;
        lead.isHot = priority === 'high';
        this.showToast('Lead details updated successfully!', 'success');
      }
    } else {
      const newLead = {
        id: Date.now(),
        enqNo: 'ENQ' + Math.floor(Math.random() * 9000 + 1000),
        name: name,
        phone: phone,
        whatsapp: phone,
        email: email,
        city: city,
        course: course,
        mode: mode,
        source: source,
        campaign: '-',
        inquiryDate: '26-06-2026 05:00 PM',
        owner: 'Bharat Sir',
        ownerTeam: 'UPSC Team',
        status: 'new',
        statusLabel: 'New',
        priority: priority,
        leadScore: priority === 'high' ? 85 : priority === 'medium' ? 65 : 45,
        leadAge: '0 Days',
        academicStatus: 'Graduation Running',
        query: query,
        assignedTo: 'Bharat Sir',
        assignedDate: '26-06-2026 05:00 PM',
        timeAgo: 'Just now',
        isHot: priority === 'high',
        stage: 0,
        stageLabel: 'New',
        communications: []
      };
      this.leads.unshift(newLead);
      this.syncAppDataLeads();
      this.showToast('New inquiry added successfully!', 'success');
    }
    
    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
    this.updateStatusBarCounts();
  },

  renderCourseOption(value, subtitle, selected) {
    return `
      <label class="radio-card">
        <input type="radio" name="m-course" value="${value}" ${selected === value ? 'checked' : ''} required>
        <span class="radio-mark"></span>
        <span>
          <span class="radio-title">${value}</span>
          <span class="radio-subtitle">${subtitle}</span>
        </span>
      </label>
    `;
  },

  renderModeOption(value, selected) {
    return `
      <label class="radio-pill">
        <input type="radio" name="m-mode" value="${value}" ${selected === value ? 'checked' : ''} required>
        ${value}
      </label>
    `;
  },

  buildUtmTracking(formSource = 'CRM Add Inquiry') {
    return {
      source: formSource,
      medium: 'inquiry_form',
      campaign: 'direct_inquiry',
      content: 'lead_capture',
      term: '-',
      landingPage: formSource === 'Public Inquiry Form' ? 'inquiry-form.html' : 'all-leads/add-inquiry',
      referrer: formSource === 'Public Inquiry Form' ? document.referrer || 'Direct' : 'Internal CRM'
    };
  },

  showAddEditModal(lead = null) {
    const isEdit = lead !== null;
    const title = isEdit ? 'Edit Lead Details' : 'Add New Inquiry';
    const name = isEdit ? lead.name : '';
    const phone = isEdit ? lead.phone : '';
    const email = isEdit ? lead.email : '';
    const pincode = isEdit ? (lead.pincode || '') : '';
    const city = isEdit ? lead.city : '';
    const academicStatus = isEdit ? lead.academicStatus : 'Graduation Running';
    const course = isEdit ? lead.course : 'UPSC Foundation';
    const mode = isEdit ? lead.mode : 'Classroom';
    const query = isEdit ? lead.query : '';

    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card wide">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas ${isEdit ? 'fa-edit' : 'fa-user-plus'}" style="color:var(--primary)"></i>${title}</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body">
          <form id="add-lead-form" onsubmit="event.preventDefault(); LeadsModule.saveLeadForm(${isEdit ? lead.id : 'null'})">
            <div class="modal-grid-2">
              <div class="form-field">
                <label>Full Name *</label>
                <input type="text" id="m-name" value="${name}" required placeholder="Full Name">
              </div>
              <div class="form-field">
                <label>Contact No. *</label>
                <input type="tel" id="m-phone" value="${phone}" required placeholder="10-digit number">
              </div>
              <div class="form-field">
                <label>Email ID *</label>
                <input type="email" id="m-email" value="${email}" required placeholder="email@gmail.com">
              </div>
              <div class="form-field">
                <label>Pincode *</label>
                <input type="text" id="m-pincode" value="${pincode}" required inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="6-digit pincode">
              </div>
              <div class="form-field">
                <label>City *</label>
                <input type="text" id="m-city" value="${city}" required placeholder="City name">
              </div>
              <div class="form-field">
                <label>Academic Status *</label>
                <select id="m-academic-status" required>
                  <option value="HSC Running" ${academicStatus === 'HSC Running' ? 'selected' : ''}>HSC Running</option>
                  <option value="HSC Completed" ${academicStatus === 'HSC Completed' ? 'selected' : ''}>HSC Completed</option>
                  <option value="Graduation Running" ${academicStatus === 'Graduation Running' ? 'selected' : ''}>Graduation Running</option>
                  <option value="Graduation Completed" ${academicStatus === 'Graduation Completed' ? 'selected' : ''}>Graduation Completed</option>
                  <option value="Post Graduation" ${academicStatus === 'Post Graduation' ? 'selected' : ''}>Post Graduation</option>
                </select>
              </div>
              <div class="form-field span-2">
                <label>Inquiry For (Course Selection) *</label>
                <div class="radio-card-grid cols-3">
                  ${this.renderCourseOption('UPSC Foundation', 'Foundation batch', course)}
                  ${this.renderCourseOption('GPSC Class 1-2', 'Class 1-2 preparation', course)}
                  ${this.renderCourseOption('Sankalp Programme', 'Residential preparation', course)}
                  ${this.renderCourseOption('IAS/IPS Coaching', 'Advanced civil services', course)}
                  ${this.renderCourseOption('Interview Prep', 'Interview guidance', course)}
                  ${this.renderCourseOption('Other', 'Counselor to confirm', course)}
                </div>
              </div>
              <div class="form-field span-2">
                <label>Preferred Mode of Learning *</label>
                <div class="radio-inline-group">
                  ${this.renderModeOption('Classroom', mode)}
                  ${this.renderModeOption('Online', mode)}
                  ${this.renderModeOption('Residential Mode', mode)}
                  ${this.renderModeOption('Hybrid', mode)}
                </div>
              </div>
              <div class="form-field full">
                <label>Any Specific Query (Optional)</label>
                <textarea id="m-query" rows="3" placeholder="Write questions, timing preference, or course doubts...">${query}</textarea>
              </div>
            </div>
            <input type="submit" style="display:none" id="submit-hidden-btn">
          </form>
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-outline btn-sm" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('submit-hidden-btn').click()"><i class="fas fa-save"></i> ${isEdit ? 'Save Changes' : 'Add Inquiry'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveLeadForm(leadId) {
    const isEdit = leadId !== null;
    const name = document.getElementById('m-name').value.trim();
    const phone = document.getElementById('m-phone').value.trim();
    const email = document.getElementById('m-email').value.trim();
    const pincode = document.getElementById('m-pincode').value.trim();
    const city = document.getElementById('m-city').value.trim();
    const academicStatus = document.getElementById('m-academic-status').value;
    const course = document.querySelector('input[name="m-course"]:checked')?.value;
    const mode = document.querySelector('input[name="m-mode"]:checked')?.value;
    const query = document.getElementById('m-query').value.trim();
    if (!name || !phone || !email || !pincode || !city || !academicStatus || !course || !mode) return;

    if (isEdit) {
      const lead = this.leads.find(l => l.id === leadId);
      if (lead) {
        lead.name = name;
        lead.phone = phone;
        lead.whatsapp = phone;
        lead.email = email;
        lead.pincode = pincode;
        lead.city = city;
        lead.course = course;
        lead.mode = mode;
        lead.academicStatus = academicStatus;
        lead.query = query;
        if (!lead.utm) lead.utm = this.buildUtmTracking('CRM Add Inquiry');
        this.showToast('Lead details updated successfully!', 'success');
      }
    } else {
      const now = new Date();
      const timestamp = now.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const newLead = {
        id: Date.now(),
        enqNo: 'ENQ' + Math.floor(Math.random() * 9000 + 1000),
        name,
        phone,
        whatsapp: phone,
        email,
        pincode,
        city,
        course,
        mode,
        source: 'Inquiry Form',
        campaign: 'direct_inquiry',
        utm: this.buildUtmTracking('CRM Add Inquiry'),
        inquiryDate: timestamp,
        owner: 'Bharat Sir',
        ownerTeam: 'UPSC Team',
        status: 'new',
        statusLabel: 'New',
        priority: 'medium',
        leadScore: 65,
        leadAge: '0 Days',
        academicStatus,
        query,
        assignedTo: 'Bharat Sir',
        assignedDate: timestamp,
        timeAgo: 'Just now',
        isHot: false,
        stage: 0,
        stageLabel: 'New',
        communications: []
      };
      this.leads.unshift(newLead);
      this.syncAppDataLeads();
      this.showToast('New inquiry added successfully!', 'success');
    }

    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
    this.updateStatusBarCounts();
  },

  showCounsellingModal(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;

    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card wide">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas fa-comments" style="color:var(--primary)"></i>Counselling Management - ${lead.name}</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body">
          <form id="counselling-form" onsubmit="event.preventDefault(); LeadsModule.saveCounselling(${lead.id})">
            <div class="modal-grid-2 compact-grid">
              <div class="form-field">
                <label>Counselling Date</label>
                <input type="date" id="cs-date" required>
              </div>
              <div class="form-field">
                <label>Counselling Time</label>
                <input type="time" id="cs-time" required>
              </div>
              <div class="form-field">
                <label>Counselor Name</label>
                <select id="cs-counselor">
                  <option>Bharat Sir</option>
                  <option>Vivek Sir</option>
                  <option>Pooja Shah</option>
                  <option>Jignesh Trivedi</option>
                </select>
              </div>
              <div class="form-field">
                <label>Counselling Mode</label>
                <select id="cs-mode">
                  <option>Phone Counselling</option>
                  <option>Online Meeting</option>
                  <option>Campus Visit</option>
                  <option>Walk-in Counselling</option>
                  <option>Parent Counselling</option>
                </select>
              </div>
              <div class="form-field">
                <label>Interest Level</label>
                <select id="cs-interest">
                  <option>Highly Interested</option>
                  <option>Interested</option>
                  <option>Need More Information</option>
                  <option>Thinking</option>
                  <option>Not Interested</option>
                </select>
              </div>
              <div class="form-field">
                <label>Next Recommended Action</label>
                <select id="cs-next-action">
                  <option>Schedule Follow-up</option>
                  <option>Send Brochure</option>
                  <option>Campus Visit</option>
                  <option>Admission Form</option>
                  <option>Fee Discussion</option>
                  <option>Parent Meeting</option>
                  <option>Close Inquiry</option>
                </select>
              </div>
              <div class="form-field">
                <label>Recommended Course</label>
                <input type="text" id="cs-course" value="${lead.course}">
              </div>
              <div class="form-field">
                <label>Recommended Learning Mode</label>
                <input type="text" id="cs-learning-mode" value="${lead.mode}">
              </div>
              <div class="form-field full">
                <label>Student Requirement</label>
                <textarea id="cs-requirement" rows="2" placeholder="Student goal, timeline, parent expectation, constraints..." required></textarea>
              </div>
              <div class="form-field full">
                <label>Discussion Summary</label>
                <textarea id="cs-summary" rows="3" placeholder="Counselling discussion summary..." required></textarea>
              </div>
              <div class="form-field full">
                <label>Remarks</label>
                <textarea id="cs-remarks" rows="2" placeholder="Internal counselling remarks..."></textarea>
              </div>
            </div>
            <input type="submit" style="display:none" id="submit-counselling-hidden">
          </form>
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-outline btn-sm" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('submit-counselling-hidden').click()"><i class="fas fa-check"></i> Save Counselling</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveCounselling(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    const date = document.getElementById('cs-date').value;
    const time = document.getElementById('cs-time').value;
    const counselor = document.getElementById('cs-counselor').value;
    const mode = document.getElementById('cs-mode').value;
    const interest = document.getElementById('cs-interest').value;
    const nextAction = document.getElementById('cs-next-action').value;
    const course = document.getElementById('cs-course').value;
    const learningMode = document.getElementById('cs-learning-mode').value;
    const requirement = document.getElementById('cs-requirement').value;
    const summary = document.getElementById('cs-summary').value;
    const remarks = document.getElementById('cs-remarks').value;

    lead.status = 'counselling';
    lead.statusLabel = 'Counselling';
    lead.stage = Math.max(lead.stage || 0, 4);
    lead.counselling = { date, time, counselor, mode, interest, nextAction, course, learningMode, requirement, summary, remarks };
    this.recordTimelineAction(lead, 'Counselling Conducted', `${mode}. ${summary} Interest: ${interest}. Next action: ${nextAction}.`);
    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
    this.updateStatusBarCounts();
    this.showToast(`Counselling saved for ${lead.name}`, 'success');
  },

  showManageFollowup(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    
    const listHTML = lead.communications.length > 0 
      ? lead.communications.map(c => `
          <div style="background:var(--bg);padding:8px 12px;border-radius:var(--radius);border:1px solid var(--border);margin-bottom:8px;font-size:11.5px">
            <div style="display:flex;justify-content:between;margin-bottom:4px">
              <strong>${c.title}</strong>
              <span style="color:var(--text-muted);font-size:10px;margin-left:auto">${c.day} ${c.month} • ${c.time}</span>
            </div>
            <div style="color:var(--text-secondary)">${c.desc}</div>
            <div style="font-size:9.5px;color:var(--text-muted);margin-top:4px">By ${c.by}</div>
          </div>
        `).join('')
      : '<p style="color:var(--text-muted);text-align:center;font-size:11.5px;padding:12px">No follow-ups recorded yet.</p>';
      
    overlay.innerHTML = `
      <div class="custom-modal-card wide">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas fa-redo" style="color:var(--primary)"></i>Manage Follow-up — ${lead.name}</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-height:70vh">
          <div>
            <h4 style="font-size:12px;font-weight:700;margin-bottom:10px;text-transform:uppercase;color:var(--text-muted)">Follow-up History</h4>
            <div style="max-height:280px;overflow-y:auto;padding-right:4px">${listHTML}</div>
          </div>
          <div>
            <h4 style="font-size:12px;font-weight:700;margin-bottom:10px;text-transform:uppercase;color:var(--text-muted)">Add Follow-up Action</h4>
            <form id="followup-form" onsubmit="event.preventDefault(); LeadsModule.saveFollowup(${lead.id})">
              <div class="modal-grid-2 compact-grid">
                <div class="form-field">
                  <label>Follow-up Date</label>
                  <input type="date" id="f-date" required>
                </div>
                <div class="form-field">
                  <label>Follow-up Time</label>
                  <input type="time" id="f-time" required>
                </div>
                <div class="form-field">
                  <label>Follow-up Type</label>
                  <select id="f-type">
                    <option value="call">Phone Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="meeting">In-Person Meeting</option>
                    <option value="online">Online Meeting</option>
                    <option value="campus">Campus Visit</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Follow-up Status</label>
                  <select id="f-status">
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Rescheduled">Rescheduled</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Missed">Missed</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Counselor</label>
                  <select id="f-counselor">
                    <option>Bharat Sir</option>
                    <option>Vivek Sir</option>
                    <option>Pooja Shah</option>
                    <option>Jignesh Trivedi</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Outcome</label>
                  <select id="f-outcome">
                    <option>Interested</option>
                    <option>Need More Information</option>
                    <option>Call Later</option>
                    <option>Counselling Required</option>
                    <option>Admission Form Sent</option>
                    <option>Admission Confirmed</option>
                    <option>Not Interested</option>
                    <option>No Response</option>
                  </select>
                </div>
                <div class="form-field full">
                  <label>Follow-up Purpose</label>
                  <input type="text" id="f-purpose" placeholder="Share details, confirm interest, collect documents..." required>
                </div>
                <div class="form-field full">
                  <label>Remarks / Discussion Notes</label>
                  <textarea id="f-desc" rows="3" required placeholder="Enter communication summary..."></textarea>
                </div>
                <div class="form-field">
                  <label>Next Follow-up Date</label>
                  <input type="date" id="f-next-date">
                </div>
              </div>
              <input type="submit" style="display:none" id="submit-followup-hidden">
            </form>
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-outline btn-sm" onclick="this.closest('.custom-modal-overlay').remove()">Close</button>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('submit-followup-hidden').click()"><i class="fas fa-plus"></i> Add Action</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveFollowup(leadId) {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return;
    
    const type = document.getElementById('f-type').value;
    const desc = document.getElementById('f-desc').value;
    const followupDate = document.getElementById('f-date').value;
    const followupTime = document.getElementById('f-time').value;
    const followupStatus = document.getElementById('f-status').value;
    const counselor = document.getElementById('f-counselor').value;
    const outcome = document.getElementById('f-outcome').value;
    const purpose = document.getElementById('f-purpose').value;
    const nextDate = document.getElementById('f-next-date').value;
    
    const titles = {
      call: 'Phone Call Follow-up',
      whatsapp: 'WhatsApp Chat',
      email: 'Email Communication',
      meeting: 'In-Person Meeting',
      online: 'Online Meeting',
      campus: 'Campus Visit',
      reminder: 'Reminder'
    };
    
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    
    const newComm = {
      type: type,
      day: now.getDate().toString(),
      month: months[now.getMonth()],
      title: `${titles[type]} (${followupStatus})`,
      desc: `${purpose}. ${desc} Outcome: ${outcome}.`,
      time: followupTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      by: counselor
    };
    
    lead.communications.unshift(newComm);
    lead.followupDate = nextDate || followupDate;
    lead.followupTime = followupTime;
    lead.followupType = titles[type];
    lead.followupStatus = followupStatus;
    lead.followupOutcome = outcome;
    lead.followupPurpose = purpose;
    if (followupStatus === 'Completed') lead.status = outcome === 'Counselling Required' ? 'counselling' : 'followup';
    if (lead.status === 'followup') lead.statusLabel = 'Follow-up';
    this.syncAppDataLeads();
    this.showToast('Follow-up activity recorded successfully!', 'success');
    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
  },

  submitLead(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    
    if (confirm(`Are you sure you want to submit the lead "${lead.name}" to admissions?`)) {
      lead.status = 'admission_confirmed';
      lead.statusLabel = 'Admission Confirmed';
      lead.stage = 4;
      lead.stageLabel = 'Admission';
      
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast(`Lead ${lead.name} submitted to admissions!`, 'success');
    }
  },

  showChangeClassModal(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas fa-exchange-alt" style="color:var(--primary)"></i>Change Lead Status</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body">
          <div class="form-field">
            <label>Current Status</label>
            <input type="text" value="${lead.statusLabel}" readonly style="background:var(--bg)">
          </div>
          <div class="form-field">
            <label>Select New Status</label>
            <select id="c-status">
              <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New Inquiry</option>
              <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="interested" ${lead.status === 'interested' ? 'selected' : ''}>Interested</option>
              <option value="followup" ${lead.status === 'followup' ? 'selected' : ''}>Follow-up</option>
              <option value="counselling" ${lead.status === 'counselling' ? 'selected' : ''}>Counselling</option>
              <option value="admission_process" ${lead.status === 'admission_process' ? 'selected' : ''}>Admission Process</option>
              <option value="converted" ${lead.status === 'converted' ? 'selected' : ''}>Converted</option>
              <option value="lost" ${lead.status === 'lost' ? 'selected' : ''}>Lost</option>
              <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>Closed</option>
              <option value="exam" ${lead.status === 'exam' ? 'selected' : ''}>Admission: Exam</option>
              <option value="interview" ${lead.status === 'interview' ? 'selected' : ''}>Admission: Interview</option>
              <option value="admission_confirmed" ${lead.status === 'admission_confirmed' ? 'selected' : ''}>Admission: Confirmed</option>
              <option value="admission_rejected" ${lead.status === 'admission_rejected' ? 'selected' : ''}>Admission: Rejected</option>
            </select>
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-outline btn-sm" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="LeadsModule.saveChangeClass(${lead.id})">Update Status</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveChangeClass(leadId) {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return;
    
    const newStatus = document.getElementById('c-status').value;
    const statusLabels = {
      new: 'New',
      pending: 'Pending',
      contacted: 'Contacted',
      interested: 'Interested',
      followup: 'Follow-up',
      counselling: 'Counselling',
      admission_process: 'Admission Process',
      converted: 'Converted',
      lost: 'Lost',
      closed: 'Closed',
      exam: 'Exam',
      interview: 'Interview',
      admission_confirmed: 'Admission Confirmed',
      admission_rejected: 'Admission Rejected'
    };
    
    lead.status = newStatus;
    lead.statusLabel = statusLabels[newStatus];
    
    if (newStatus === 'new') { lead.stage = 0; lead.stageLabel = 'New'; }
    else if (newStatus === 'contacted') { lead.stage = 1; lead.stageLabel = 'Contacted'; }
    else if (newStatus === 'followup') { lead.stage = 3; lead.stageLabel = 'Follow-up'; }
    else if (newStatus === 'interested' || newStatus === 'counselling') { lead.stage = 2; lead.stageLabel = 'Counselling'; }
    else if (newStatus === 'admission_process') { lead.stage = 6; lead.stageLabel = 'Admission'; }
    else if (newStatus === 'converted') { lead.stage = 8; lead.stageLabel = 'Student Created'; }
    else if (newStatus === 'lost') { lead.stage = 5; lead.stageLabel = 'Closed'; }
    else if (newStatus === 'exam' || newStatus === 'interview') { lead.stage = 3; lead.stageLabel = 'Form Sent'; }
    else if (newStatus === 'admission_confirmed' || newStatus === 'admission_rejected') { lead.stage = 4; lead.stageLabel = 'Admission'; }
    else if (newStatus === 'closed') { lead.stage = 5; lead.stageLabel = 'Closed'; }
    
    this.showToast(`Status updated to ${statusLabels[newStatus]} successfully!`, 'success');
    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
    this.updateStatusBarCounts();
  },

  archiveLead(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    
    if (confirm(`Are you sure you want to archive the lead "${lead.name}"? The lead will disappear from the lists.`)) {
      lead.archived = true;
      this.selectedLeads.delete(id);
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast(`Lead ${lead.name} archived successfully!`, 'warning');
    }
  },

  showFollowupHistory(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    const existing = document.getElementById('followup-history-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'followup-history-overlay';
    overlay.className = 'followup-history-panel';
    const commIcons = { call: 'tl-call fa-phone', whatsapp: 'tl-whatsapp fa-whatsapp fab', email: 'tl-email fa-envelope', meeting: 'tl-meeting fa-handshake' };
    const timelineHTML = lead.communications.length > 0
      ? lead.communications.map(c => {
          const iconParts = commIcons[c.type]?.split(' ') || ['tl-note', 'fa-sticky-note'];
          const dotCls = iconParts[0];
          const iconCls = iconParts.slice(1).join(' ');
          const prefix = c.type === 'whatsapp' ? 'fab' : 'fas';
          return `
            <div class="timeline-item">
              <div class="timeline-dot ${dotCls}"><i class="${prefix} ${iconParts.slice(1).join(' ')}"></i></div>
              <div class="timeline-content">
                <div class="timeline-date">${c.day} ${c.month} • ${c.time}</div>
                <div class="timeline-title">${c.title}</div>
                <div class="timeline-desc">${c.desc}</div>
                <div class="timeline-by">By ${c.by}</div>
              </div>
            </div>
          `;
        }).join('')
      : '<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-history" style="font-size:28px;opacity:0.3;margin-bottom:8px"></i><p>No follow-up history yet</p></div>';

    overlay.innerHTML = `
      <div class="followup-panel-content">
        <div class="panel-header">
          <div>
            <div class="panel-title">Follow-up History — ${lead.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${lead.enqNo}</div>
          </div>
          <button class="panel-close" onclick="document.getElementById('followup-history-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="panel-body">
          <div class="timeline">${timelineHTML}</div>
        </div>
        <div style="padding:12px 16px;border-top:1px solid var(--border)">
          <button class="btn btn-primary btn-sm" style="width:100%" onclick="document.getElementById('followup-history-overlay').remove(); LeadsModule.showManageFollowup(${lead.id})">
            <i class="fas fa-plus"></i> Add / Manage Follow-up
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  },

  whatsapp(id) {
    const lead = this.leads.find(l => l.id === id);
    if (lead) {
      this.recordTimelineAction(lead, 'WhatsApp Opened', 'WhatsApp conversation opened from lead action.');
      window.open(`https://wa.me/${String(lead.whatsapp || lead.phone).replace(/\D/g, '')}?text=${encodeURIComponent('Hello, this is Pramukh Academy following up on your inquiry.')}`, '_blank');
      this.showToast(`Opening WhatsApp for ${lead.name}`, 'success');
    }
  },

  callLead(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    DialerModule.open(id);
    this.showToast(`Dialer opened for ${lead.name}`, 'info');
  },

  email(id) {
    const lead = this.leads.find(l => l.id === id);
    if (lead) {
      this.recordTimelineAction(lead, 'Email Opened', 'Email communication opened from lead action.');
      window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent('Pramukh Academy Inquiry Follow-up')}`;
      this.showToast(`Opening Email for ${lead.name}`, 'info');
    }
  },

  setupToolbar() {
    // View mode toggles
    const rowBtn = document.getElementById('row-view-btn');
    const calendarBtn = document.getElementById('calendar-view-btn');
    rowBtn?.addEventListener('click', () => this.toggleViewMode('row'));
    calendarBtn?.addEventListener('click', () => {
      this.toggleViewMode('row');
      App.goToCalendar();
    });

    // Collapse/Expand toggle
    const toggleBtn = document.getElementById('collapse-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.viewMode === 'calendar') return;
        this.allExpanded = !this.allExpanded;
        toggleBtn.innerHTML = this.allExpanded
          ? '<i class="fas fa-compress-alt"></i> Collapse All'
          : '<i class="fas fa-expand-alt"></i> Expand All';
        document.querySelectorAll('.lead-card').forEach((card) => {
          const id = parseInt(card.id.replace('lead-card-', ''));
          const body = document.getElementById(`lead-body-${id}`);
          const chevron = document.getElementById(`chevron-${id}`);
          if (body) body.style.display = this.allExpanded ? 'block' : 'none';
          card.classList.toggle('is-expanded', this.allExpanded);
          if (chevron) chevron.className = this.allExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        });
      });
    }

    // Refresh
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
      this.selectedLeads.clear();
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast('Leads refreshed successfully!', 'success');
    });

    // Mass admission
    document.getElementById('mass-admit-btn')?.addEventListener('click', () => {
      const ids = this.selectedLeads.size ? Array.from(this.selectedLeads) : this.filteredLeads.map(l => l.id);
      ids.forEach(id => {
        const lead = this.leads.find(l => l.id === id);
        if (!lead) return;
        lead.status = 'admission_confirmed';
        lead.statusLabel = 'Admission Confirmed';
        lead.stage = 4;
        lead.stageLabel = 'Admission';
        this.recordTimelineAction(lead, 'Mass Admission Confirmed', 'Lead confirmed through mass admission action.');
      });
      this.selectedLeads.clear();
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast(`${ids.length} lead(s) moved to Admission Confirmed`, 'success');
    });

    // Add lead
    document.getElementById('add-lead-btn')?.addEventListener('click', () => {
      this.showAddEditModal();
    });

    // Sort toggle
    const sortBtn = document.getElementById('sort-toggle-btn');
    sortBtn?.addEventListener('click', (e) => {
      this.setupSortDropdown(e);
    });

    // Email all
    const emailAllBtn = document.getElementById('email-all-btn');
    emailAllBtn?.addEventListener('click', () => {
      this.bulkEmail();
    });

    document.getElementById('import-leads-btn')?.addEventListener('click', () => this.showImportModal());
    document.getElementById('export-leads-btn')?.addEventListener('click', () => this.exportLeads());
    document.getElementById('download-leads-btn')?.addEventListener('click', () => this.exportLeads(null, 'current-leads-download.csv'));
  },

  toggleViewMode(mode) {
    const rowBtn = document.getElementById('row-view-btn');
    const calendarBtn = document.getElementById('calendar-view-btn');
    const leadList = document.getElementById('lead-list');
    const calendarView = document.getElementById('lead-calendar-view');
    const pagination = document.querySelector('.leads-pagination');
    const collapseBtn = document.getElementById('collapse-toggle-btn');

    this.viewMode = mode;
    if (rowBtn) rowBtn.classList.toggle('active', mode === 'row');
    if (calendarBtn) calendarBtn.classList.toggle('active', mode === 'calendar');

    if (leadList) leadList.style.display = mode === 'row' ? 'flex' : 'none';
    if (calendarView) calendarView.style.display = mode === 'calendar' ? 'block' : 'none';
    if (pagination) pagination.style.display = mode === 'calendar' ? 'none' : 'flex';
    if (collapseBtn) {
      collapseBtn.disabled = mode === 'calendar';
      collapseBtn.style.opacity = mode === 'calendar' ? '0.5' : '1';
      collapseBtn.style.cursor = mode === 'calendar' ? 'not-allowed' : 'pointer';
    }

    if (mode === 'calendar') {
      this.renderCalendarView();
    } else {
      this.renderLeads();
    }
  },

  renderCalendarView() {
    const container = document.getElementById('lead-calendar-view');
    if (!container) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const startPad = firstDay === 0 ? 6 : firstDay - 1;
    const calData = window.APP_DATA.FOLLOWUP_CALENDAR_DATA || {};

    let cells = '';
    for (let i = startPad - 1; i >= 0; i--) {
      cells += `<div class="calendar-cell other-month"><div class="calendar-day">${prevDays - i}</div></div>`;
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const ev = calData[dateKey] || { pending: 0, overdue: 0, followup: 0, completed: 0 };
      const isToday = d === today.getDate();
      const events = [];
      if (ev.pending) events.push(`<span class="calendar-event event-pending">P ${ev.pending}</span>`);
      if (ev.overdue) events.push(`<span class="calendar-event event-overdue">O ${ev.overdue}</span>`);
      if (ev.followup) events.push(`<span class="calendar-event event-followup">F ${ev.followup}</span>`);
      if (ev.completed) events.push(`<span class="calendar-event event-completed">C ${ev.completed}</span>`);
      cells += `
        <div class="calendar-cell${isToday ? ' today' : ''}">
          <div class="calendar-day">${d}</div>
          <div class="calendar-events">${events.join('')}</div>
        </div>
      `;
    }
    const remaining = 35 - (startPad + totalDays);
    for (let d = 1; d <= remaining; d++) {
      cells += `<div class="calendar-cell other-month"><div class="calendar-day">${d}</div></div>`;
    }

    container.innerHTML = `
      <div class="calendar-header">
        <h4>${monthNames[month]} ${year} — Follow-up Calendar</h4>
      </div>
      <div class="calendar-grid">
        <div class="calendar-cell calendar-weekday">Mon</div>
        <div class="calendar-cell calendar-weekday">Tue</div>
        <div class="calendar-cell calendar-weekday">Wed</div>
        <div class="calendar-cell calendar-weekday">Thu</div>
        <div class="calendar-cell calendar-weekday">Fri</div>
        <div class="calendar-cell calendar-weekday">Sat</div>
        <div class="calendar-cell calendar-weekday">Sun</div>
        ${cells}
      </div>
    `;
  },

  showToast(msg, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    const colors = { success: 'var(--success)', info: 'var(--primary)', warning: 'var(--warning)', danger: 'var(--danger)' };
    const icons = { success: 'fa-check-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle', danger: 'fa-times-circle' };
    toast.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:9999;
      background:var(--bg-card);border-left:4px solid ${colors[type]};
      color:var(--text-primary);
      padding:12px 16px;border-radius:var(--radius-md);
      box-shadow:var(--shadow-xl);
      display:flex;align-items:center;gap:10px;
      font-size:13px;font-family:var(--font);
      animation:slideInRight 0.3s ease;
      max-width:320px;
    `;
    toast.innerHTML = `<i class="fas ${icons[type]}" style="color:${colors[type]}"></i><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'fadeIn 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); }, 3000);
  }
};
