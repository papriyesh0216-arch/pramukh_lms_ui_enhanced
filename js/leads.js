// ============================================================
// LEADS.JS — Lead List Module
// ============================================================

const LeadsModule = {
  leads: [],
  filteredLeads: [],
  activeStatus: 'all',
  activeSubStatus: 'called',
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
  filterBatch: 'all',
  filterState: '',
  filterDateFrom: '',
  filterDateTo: '',
  filterInquiryNumber: '',
  filterAssignInquiry: 'all',
  filterInquiryDate: '',
  filterFollowupDate: '',
  filterSegment: 'all',
  leadListView: 'inquiry',
  archivedStatusFilter: 'all',
  sortOption: 'created-desc',

  init() {
    this.leads = [...window.APP_DATA.LEAD_DATA];
    this.injectMockLeads();
    this.normalizeInquiryLeadData();
    this.filteredLeads = [...this.leads];
    this.selectedLeads.clear();
    
    this.renderStatusBar();
    this.setupFilters();
    this.applyFilters();
    this.setupToolbar();
    this.setupLeadListSwitch();
    this.updateStatusBarCounts();
  },

  injectMockLeads() {
    // If not already injected, add some leads for other statuses
    if (this.leads.length <= 7) {
      const extraLeads = [
        {
          id: 10, enqNo: 'ENQ1001', name: 'Amit Kumar', phone: '9988776655', whatsapp: '9988776655',
          email: 'amit.kumar@gmail.com', state: 'Gujarat', district: 'Surat', city: 'Surat, Gujarat', course: 'UPSC',
          batch: 'Foundation', mode: 'Class', source: 'Instagram Ad', campaign: 'UPSC May 2026',
          inquiryDate: '26-06-2026 10:00 AM', owner: 'Bharat Sir', ownerTeam: 'UPSC Team',
          status: 'exam', statusLabel: 'Exam Scheduled', priority: 'medium',
          leadScore: 75, leadAge: '0 Days', academicStatus: 'College Student',
          query: 'Exam syllabus.', assignedTo: 'Bharat Sir',
          assignedDate: '26-06-2026 10:00 AM', timeAgo: '7 hrs ago', isHot: false,
          stage: 3, stageLabel: 'Form Sent',
          communications: []
        },
        {
          id: 11, enqNo: 'ENQ1002', name: 'Priya Sharma', phone: '9911223344', whatsapp: '9911223344',
          email: 'priya.sharma@gmail.com', state: 'Gujarat', district: 'Rajkot', city: 'Rajkot, Gujarat', course: 'GPSC-Class1,2',
          mode: 'Online', source: 'Website', campaign: '-',
          inquiryDate: '25-06-2026 11:30 AM', owner: 'Vivek Sir', ownerTeam: 'GPSC Team',
          status: 'interview', statusLabel: 'Interview Scheduled', priority: 'high',
          batch: 'Foundation',
          leadScore: 82, leadAge: '1 Day', academicStatus: 'College Student',
          query: 'Interview prep.', assignedTo: 'Vivek Sir',
          assignedDate: '25-06-2026 11:30 AM', timeAgo: '1 day ago', isHot: true,
          stage: 3, stageLabel: 'Form Sent',
          communications: []
        },
        {
          id: 12, enqNo: 'ENQ1003', name: 'Rohan Mehta', phone: '9822334455', whatsapp: '9822334455',
          email: 'rohan.mehta@gmail.com', state: 'Gujarat', district: 'Ahmedabad', city: 'Ahmedabad, Gujarat', course: 'Sankalp',
          batch: '', mode: '', source: 'Seminar', campaign: '-',
          inquiryDate: '24-06-2026 09:15 AM', owner: 'Pooja Shah', ownerTeam: 'Sankalp Team',
          status: 'admission_confirmed', statusLabel: 'Admission Confirmed', priority: 'high',
          leadScore: 95, leadAge: '2 Days', academicStatus: 'Graducation Completed',
          query: 'Fees paid.', assignedTo: 'Pooja Shah',
          assignedDate: '24-06-2026 09:15 AM', timeAgo: '2 days ago', isHot: false,
          stage: 4, stageLabel: 'Admission',
          communications: []
        },
        {
          id: 13, enqNo: 'ENQ1004', name: 'Kunal Patel', phone: '9733445566', whatsapp: '9733445566',
          email: 'kunal.patel@gmail.com', state: 'Gujarat', district: 'Vadodara', city: 'Vadodara, Gujarat', course: 'UPSC',
          batch: 'Foundation', mode: 'Class', source: 'Walk-in', campaign: '-',
          inquiryDate: '23-06-2026 04:00 PM', owner: 'Bharat Sir', ownerTeam: 'UPSC Team',
          status: 'admission_rejected', statusLabel: 'Admission Rejected', priority: 'low',
          leadScore: 40, leadAge: '3 Days', academicStatus: 'Graducation Completed',
          query: 'Could not pass test.', assignedTo: 'Bharat Sir',
          assignedDate: '23-06-2026 04:00 PM', timeAgo: '3 days ago', isHot: false,
          stage: 4, stageLabel: 'Admission',
          communications: []
        },
        {
          id: 14, enqNo: 'ENQ1005', name: 'Divya Shah', phone: '9644556677', whatsapp: '9644556677',
          email: 'divya.shah@gmail.com', state: 'Gujarat', district: 'Surat', city: 'Surat, Gujarat', course: 'GPSC-Class1,2',
          mode: 'Online', source: 'Google Ads', campaign: '-',
          inquiryDate: '22-06-2026 12:00 PM', owner: 'Jignesh Trivedi', ownerTeam: 'Admin',
          status: 'closed', statusLabel: 'Closed', priority: 'low',
          batch: 'Foundation',
          leadScore: 30, leadAge: '4 Days', academicStatus: 'School Student',
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
    this.syncAdmissionShortlist();
  },

  syncAdmissionShortlist() {
    const admissionStatuses = ['admission_process', 'converted', 'exam', 'interview', 'admission_confirmed', 'admission_rejected', 'admission_form', 'form_submission', 'form_submitted'];
    const shortlist = this.leads.filter(lead => (
      lead.shortlistedForAdmission ||
      lead.stageKey === 'admission_form' ||
      admissionStatuses.includes((lead.status || '').toLowerCase())
    ));
    try {
      localStorage.setItem('paAdmissionShortlist', JSON.stringify(shortlist));
    } catch (e) {
      // localStorage can be unavailable in restricted browser contexts.
    }
  },

  normalizeInquiryLeadData() {
    this.leads.forEach((lead) => {
      lead.state = this.getLeadState(lead);
      lead.district = this.getLeadDistrict(lead);
      lead.academicStatus = this.normalizeAcademicStatus(lead.academicStatus);
      lead.course = this.normalizeInquiryCourse(lead.course);
      lead.mode = this.normalizeLearningMode(lead.mode, lead.course);
      if (!this.courseNeedsBatchMode(lead.course)) {
        lead.batch = '';
        lead.mode = '';
      } else if (!lead.batch) {
        lead.batch = 'Foundation';
      }
      this.normalizeLeadStageData(lead);
      lead.createdAt = lead.createdAt || lead.inquiryDate;
      lead.modifiedAt = lead.modifiedAt || lead.assignedDate || lead.inquiryDate;
    });
    this.syncAppDataLeads();
  },

  getLeadState(lead) {
    if (lead?.state) return lead.state;
    const cityText = String(lead?.city || '');
    const locations = typeof INDIAN_STATE_DISTRICTS !== 'undefined' ? INDIAN_STATE_DISTRICTS : {};
    const state = Object.keys(locations).find((item) => cityText.toLowerCase().includes(item.toLowerCase()));
    return state || 'Gujarat';
  },

  getLeadDistrict(lead) {
    if (lead?.district) return lead.district;
    const cityText = String(lead?.city || '').split(',')[0].trim();
    return cityText && cityText !== '-' ? cityText : 'Ahmedabad';
  },

  normalizeAcademicStatus(status) {
    if (['School Student', 'College Student', 'Graducation Completed'].includes(status)) return status;
    if (['HSC Running', 'HSC Completed'].includes(status)) return 'School Student';
    if (status === 'Graduation Completed') return 'Graducation Completed';
    return 'College Student';
  },

  normalizeInquiryCourse(course) {
    if (['General Inquiry', 'UPSC', 'GPSC-Class1,2', 'Class -3', 'Sankalp', 'Sampurn'].includes(course)) return course;
    if (String(course || '').includes('GPSC-Class 1,2')) return 'GPSC-Class1,2';
    if (String(course || '').includes('GPSC Class 1-2')) return 'GPSC-Class1,2';
    if (String(course || '').includes('GPSC')) return 'GPSC-Class1,2';
    if (String(course || '').includes('Class -3')) return 'Class -3';
    if (String(course || '').includes('Sankalp')) return 'Sankalp';
    if (String(course || '').includes('Sampurn')) return 'Sampurn';
    if (String(course || '').includes('UPSC') || String(course || '').includes('IAS')) return 'UPSC';
    return 'General Inquiry';
  },

  normalizeLearningMode(mode, course) {
    if (!this.courseNeedsBatchMode(course)) return '';
    if (mode === 'residental' || mode === 'Residential Mode') return 'residental';
    if (mode === 'Online') return 'Online';
    return 'Class';
  },

  courseNeedsBatchMode(course) {
    return ['UPSC', 'GPSC-Class1,2', 'Class -3'].includes(course);
  },

  getStageDefinitions() {
    return [
      { key: 'all', label: 'All' },
      { key: 'pending', label: 'Pending' },
      { key: 'voicecall', label: 'Voicecall' },
      { key: 'hot_lead', label: 'Hot Lead' },
      { key: 'cold_lead', label: 'Cold Lead' },
      { key: 'counselling', label: 'Counselling' },
      { key: 'admission_form', label: 'Admission Form' },
      { key: 'closed', label: 'Closed' }
    ];
  },

  getStageStatusDefinitions(stageKey) {
    const statuses = {
      voicecall: [
        { key: 'called', label: 'Called' },
        { key: 'not_connected', label: 'Not Connected' },
        { key: 'switched_off', label: 'Switched Off' },
        { key: 'schedule', label: 'Schedule' }
      ],
      counselling: [
        { key: 'reschedules', label: 'Reschedules' },
        { key: 'conducted', label: 'Conducted' },
        { key: 'schedule', label: 'Schedule' }
      ],
      admission_form: [
        { key: 'form_submitted', label: 'Form Submitted' },
        { key: 'form_submission', label: 'Form Submission' }
      ]
    };
    return statuses[stageKey] || [];
  },

  formatStageLabel(stageKey) {
    return this.getStageDefinitions().find((stage) => stage.key === stageKey)?.label || 'Pending';
  },

  formatStageStatusLabel(stageKey, stageStatusKey) {
    return this.getStageStatusDefinitions(stageKey).find((item) => item.key === stageStatusKey)?.label || '';
  },

  normalizeLeadStageData(lead) {
    const stageKey = this.getLeadStatusKey(lead);
    const stageStatus = this.getLeadSubStatusKey(lead);
    lead.stageKey = stageKey;
    lead.stageStatus = stageStatus;
    lead.status = lead.status || stageKey;
    lead.statusLabel = this.formatStageLabel(stageKey);
    lead.stageLabel = this.formatStageLabel(stageKey);
    lead.stageStatusLabel = this.formatStageStatusLabel(stageKey, stageStatus);
    lead.shortlistedForAdmission = stageKey === 'admission_form';
  },

  getSortOptions() {
    return [
      { key: 'created-asc', label: 'Created Date: Ascending' },
      { key: 'created-desc', label: 'Created Date: Descending' },
      { key: 'modified-asc', label: 'Modified Date: Ascending' },
      { key: 'modified-desc', label: 'Modified Date: Descending' },
      { key: 'name-az', label: 'Name: A to Z' },
      { key: 'name-za', label: 'Name: Z to A' }
    ];
  },

  getSortLabel(key = this.sortOption) {
    return this.getSortOptions().find((option) => option.key === key)?.label || 'Created Date: Descending';
  },

  parseDateTimeValue(value = '') {
    if (!value || value === '-') return 0;
    const normalized = String(value).trim();
    const direct = Date.parse(normalized);
    if (!Number.isNaN(direct)) return direct;

    const match = normalized.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:,\s*|\s+)?(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i);
    if (!match) return 0;

    const [, day, month, year, hourRaw, minute, meridiem] = match;
    let hour = Number(hourRaw);
    if (meridiem) {
      const upper = meridiem.toUpperCase();
      if (upper === 'PM' && hour < 12) hour += 12;
      if (upper === 'AM' && hour === 12) hour = 0;
    }
    return new Date(Number(year), Number(month) - 1, Number(day), hour, Number(minute)).getTime();
  },

  getLeadCreatedAt(lead) {
    return this.parseDateTimeValue(lead?.createdAt || lead?.inquiryDate) || Number(lead?.id) || 0;
  },

  getLeadModifiedAt(lead) {
    return this.parseDateTimeValue(lead?.modifiedAt || lead?.updatedAt || lead?.assignedDate || lead?.inquiryDate) || this.getLeadCreatedAt(lead);
  },

  stampLeadModified(lead, stamp = new Date()) {
    if (!lead) return;
    lead.modifiedAt = stamp.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  applyRoleScope(rows) {
    return window.AuthModule ? AuthModule.applyScope(rows) : rows;
  },

  can(module, action) {
    return window.AuthModule ? AuthModule.can(module, action) : true;
  },

  getLeadStatusKey(lead) {
    if (lead.archived) return null;
    if (lead.stageKey && lead.stageKey !== 'all') return lead.stageKey;
    const stageLabel = String(lead.stageLabel || '').toLowerCase().replace(/[\s_-]/g, '');
    const status = String(lead.status || '').toLowerCase().replace(/[\s_-]/g, '');
    const priority = String(lead.priority || '').toLowerCase();

    if (['closed', 'lost', 'notinterested', 'converted', 'admissionconfirmed', 'admissionrejected'].includes(status) || stageLabel === 'closed') {
      return 'closed';
    }
    if (['admissionprocess', 'admissionform', 'exam', 'interview', 'formsubmission', 'formsubmitted'].includes(status) || stageLabel === 'admission') {
      return 'admission_form';
    }
    if (['counselling', 'reschedules', 'reschedule', 'conducted'].includes(status) || stageLabel === 'counselling') {
      return 'counselling';
    }
    if (priority === 'high' || lead.isHot || status === 'hotlead') {
      return 'hot_lead';
    }
    if (priority === 'low' || status === 'coldlead') {
      return 'cold_lead';
    }
    if (['voicecall', 'called', 'notconnected', 'switchedoff', 'schedule', 'contacted', 'followup'].includes(status) || lead.followupDate) {
      return 'voicecall';
    }
    return 'pending';
  },

  getLeadSubStatusKey(lead) {
    if (lead.stageStatus) return lead.stageStatus;
    const stageKey = this.getLeadStatusKey(lead);
    const status = String(lead.status || '').toLowerCase().replace(/[\s_-]/g, '');
    const statusLabel = String(lead.statusLabel || '').toLowerCase().replace(/[\s_-]/g, '');

    if (stageKey === 'voicecall') {
      if (['called'].includes(status) || statusLabel === 'called') return 'called';
      if (['notconnected'].includes(status) || statusLabel === 'notconnected') return 'not_connected';
      if (['switchedoff'].includes(status) || statusLabel === 'switchedoff') return 'switched_off';
      if (lead.followupDate || ['voicecall', 'contacted', 'followup', 'schedule', 'scheduled'].includes(status)) return 'schedule';
    }
    if (stageKey === 'counselling') {
      if (['conducted'].includes(status) || statusLabel === 'conducted') return 'conducted';
      if (['reschedule', 'reschedules', 'rescheduled'].includes(status) || statusLabel.startsWith('reschedule')) return 'reschedules';
      return 'schedule';
    }
    if (stageKey === 'admission_form') {
      if (['formsubmitted', 'converted'].includes(status) || statusLabel === 'formsubmitted') return 'form_submitted';
      return 'form_submission';
    }
    return '';
  },

  renderStatusBar() {
    const container = document.getElementById('status-bar');
    if (!container) return;
    container.innerHTML = this.getStageDefinitions().map(s => `
      <div class="status-tab ${s.key === this.activeStatus ? 'active' : ''}" 
           data-status="${s.key}" id="status-tab-${s.key}" onclick="LeadsModule.setStatus('${s.key}', this)">
        ${s.label}
        <span class="status-count" id="count-status-${s.key}">0</span>
      </div>
    `).join('');
    this.renderStageStatusBar();
  },

  renderStageStatusBar() {
    const subBar = document.getElementById('status-sub-bar');
    if (!subBar) return;
    const stageStatuses = this.getStageStatusDefinitions(this.activeStatus);
    if (!stageStatuses.length) {
      subBar.style.display = 'none';
      subBar.innerHTML = '';
      return;
    }

    subBar.style.display = 'flex';
    subBar.innerHTML = stageStatuses.map((status) => `
      <div
        class="status-sub-tab ${status.key === this.activeSubStatus ? 'active' : ''}"
        data-substatus="${status.key}"
        onclick="LeadsModule.setSubStatus('${status.key}', this)"
      >
        ${status.label}
        <span class="status-count" id="count-status-${this.activeStatus}-${status.key}">0</span>
      </div>
    `).join('');
  },

  updateStatusBarCounts() {
    const counts = {
      all: 0,
      pending: 0,
      voicecall: 0,
      hot_lead: 0,
      cold_lead: 0,
      counselling: 0,
      admission_form: 0,
      closed: 0,
      called: 0,
      not_connected: 0,
      switched_off: 0,
      reschedules: 0,
      conducted: 0,
      form_submitted: 0,
      form_submission: 0
    };
    
    this.applyRoleScope(this.leads).forEach(l => {
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
    
    for (const [key, count] of Object.entries(counts)) {
      const el = document.getElementById(`count-status-${key}`);
      if (el) el.textContent = count;
    }

    this.getStageDefinitions()
      .filter((stage) => stage.key !== 'all')
      .forEach((stage) => {
        this.getStageStatusDefinitions(stage.key).forEach((status) => {
          const count = this.applyRoleScope(this.leads).filter((lead) => (
            !lead.archived &&
            this.getLeadStatusKey(lead) === stage.key &&
            this.getLeadSubStatusKey(lead) === status.key
          )).length;
          const el = document.getElementById(`count-status-${stage.key}-${status.key}`);
          if (el) el.textContent = count;
        });
      });
  },

  setStatus(key, el) {
    this.activeStatus = key;
    this.activeSubStatus = '';
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    this.renderStageStatusBar();
    this.updateStatusBarCounts();
    this.applyFilters();
  },

  setSubStatus(key, el) {
    this.activeSubStatus = key;
    document.querySelectorAll('.status-sub-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    this.applyFilters();
  },

  applyFilters() {
    // Read values only from the allowed filter set.
    this.filterCourse = document.getElementById('filter-course')?.value || this.filterCourse || 'all';
    this.filterSearch = document.getElementById('filter-search-input')?.value || this.filterSearch || '';
    this.filterSource = 'all';
    this.filterCounselor = 'all';
    this.filterAcademicStatus = 'all';
    this.filterInquiryDate = '';
    this.filterFollowupDate = '';

    // In the UI, Search represents (Name, Number, Email). Course/others are filtered separately.
    let result = this.applyRoleScope([...this.leads]).filter(l => !l.archived);


    // Apply status filter
    if (this.activeStatus !== 'all') {
      result = result.filter(l => this.getLeadStatusKey(l) === this.activeStatus);
      if (this.activeSubStatus && this.getStageStatusDefinitions(this.activeStatus).length) {
        result = result.filter(l => this.getLeadSubStatusKey(l) === this.activeSubStatus);
      }
    }

    // Apply course filter
    if (this.filterCourse !== 'all') {
      result = result.filter(l => l.course === this.filterCourse);
    }

    this.filterMode = document.getElementById('filter-mode')?.value || this.filterMode || 'all';
    this.filterBatch = document.getElementById('filter-batch')?.value || this.filterBatch || 'all';
    this.filterState = document.getElementById('filter-state')?.value || this.filterState || '';
    this.filterCity = document.getElementById('filter-district')?.value || this.filterCity || '';
    this.filterDateFrom = document.getElementById('filter-date-from')?.value || this.filterDateFrom || '';
    this.filterDateTo = document.getElementById('filter-date-to')?.value || this.filterDateTo || '';
    this.filterInquiryNumber = document.getElementById('filter-inquiry-number')?.value || this.filterInquiryNumber || '';
    this.filterAssignInquiry = document.getElementById('filter-assign-inquiry')?.value || this.filterAssignInquiry || 'all';
    this.filterSegment = document.getElementById('filter-segment')?.value || this.filterSegment || 'all';

    if (this.filterMode !== 'all') {
      result = result.filter(l => l.mode === this.filterMode);
    }
    if (this.filterBatch !== 'all') {
      result = result.filter(l => (l.batch || '') === this.filterBatch);
    }
    if (this.filterState) {
      const state = this.filterState.toLowerCase();
      result = result.filter(l => this.getLeadState(l).toLowerCase().includes(state));
    }
    if (this.filterCity) {
      const district = this.filterCity.toLowerCase();
      result = result.filter(l => this.getLeadDistrict(l).toLowerCase().includes(district));
    }
    if (this.filterDateFrom || this.filterDateTo) {
      result = result.filter(l => {
        const inquiryDate = this.dateKey(l.inquiryDate);
        if (!inquiryDate) return false;
        if (this.filterDateFrom && inquiryDate < this.filterDateFrom) return false;
        if (this.filterDateTo && inquiryDate > this.filterDateTo) return false;
        return true;
      });
    }
    if (this.filterInquiryNumber) {
      const inquiryNumber = this.filterInquiryNumber.toLowerCase();
      result = result.filter(l => (l.enqNo || '').toLowerCase().includes(inquiryNumber));
    }
    if (this.filterAssignInquiry !== 'all') {
      result = result.filter(l => this.filterAssignInquiry === 'Unassigned' ? !l.assignedTo || l.assignedTo === 'Unassigned' : (l.assignedTo || l.owner) === this.filterAssignInquiry);
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
        l.email.toLowerCase().includes(q)
      );
    }

    // Apply Sorting
    if (this.sortOption === 'created-asc') {
      result.sort((a, b) => this.getLeadCreatedAt(a) - this.getLeadCreatedAt(b));
    } else if (this.sortOption === 'created-desc') {
      result.sort((a, b) => this.getLeadCreatedAt(b) - this.getLeadCreatedAt(a));
    } else if (this.sortOption === 'modified-asc') {
      result.sort((a, b) => this.getLeadModifiedAt(a) - this.getLeadModifiedAt(b));
    } else if (this.sortOption === 'modified-desc') {
      result.sort((a, b) => this.getLeadModifiedAt(b) - this.getLeadModifiedAt(a));
    } else if (this.sortOption === 'name-az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortOption === 'name-za') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    this.filteredLeads = result;
    const maxPage = Math.max(1, Math.ceil(this.filteredLeads.length / this.perPage));
    if (this.currentPage > maxPage) this.currentPage = maxPage;
    this.renderLeads();
    this.updateSelectAllCheckboxState();
    this.updateSelectionUI();
    this.syncCollapseAllButton();
    this.updateSortButtonLabel();
    this.applyToolbarPermissions?.();
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

  setupLeadListSwitch() {
    this.switchLeadListView(this.leadListView || 'inquiry');
  },

  switchLeadListView(view) {
    this.leadListView = view === 'archived' ? 'archived' : 'inquiry';
    const isArchived = this.leadListView === 'archived';
    const screen = document.getElementById('screen-leads');
    const archivedView = document.getElementById('archived-lead-view');
    const inquiryBtn = document.getElementById('lead-switch-inquiry');
    const archivedBtn = document.getElementById('lead-switch-archived');

    screen?.classList.toggle('archived-lead-mode', isArchived);
    if (archivedView) archivedView.hidden = !isArchived;
    inquiryBtn?.classList.toggle('active', !isArchived);
    archivedBtn?.classList.toggle('active', isArchived);
    inquiryBtn?.setAttribute('aria-selected', String(!isArchived));
    archivedBtn?.setAttribute('aria-selected', String(isArchived));

    if (isArchived) this.renderArchivedLeadList();
  },

  setArchivedStatusFilter(status) {
    this.archivedStatusFilter = ['all', 'duplicate', 'archived'].includes(status) ? status : 'all';
    this.renderArchivedLeadList();
  },

  getArchiveAuditRecords() {
    try {
      return JSON.parse(localStorage.getItem('paAuditDeleted') || '[]');
    } catch (e) {
      return [];
    }
  },

  getArchiveAuditForLead(lead) {
    const records = this.getArchiveAuditRecords();
    return records.find((record) => (
      (lead.enqNo && record.enqNo === lead.enqNo) ||
      (lead.name && record.name === lead.name)
    )) || null;
  },

  getArchivedStatusFromAction(action = '') {
    const text = String(action).toLowerCase();
    return text.includes('duplicate') || text.includes('merged into') ? 'duplicate' : 'archived';
  },

  getArchivedLeadRows() {
    const scopedArchived = this.applyRoleScope(this.leads).filter((lead) => lead.archived);
    const rows = scopedArchived.map((lead) => {
      const audit = this.getArchiveAuditForLead(lead);
      const action = audit?.action || lead.archiveReason || 'Archived inquiry';
      const status = this.getArchivedStatusFromAction(action);
      return {
        key: `lead-${lead.id}`,
        status,
        lead,
        audit,
        name: lead.name || audit?.name || '-',
        enqNo: lead.enqNo || audit?.enqNo || '-',
        phone: lead.phone || '-',
        email: lead.email || '-',
        course: lead.course || lead.inquiryType || '-',
        query: lead.query || '-',
        assignedTo: lead.assignedTo || lead.owner || '-',
        archivedBy: audit?.by || lead.archivedBy || '-',
        archivedAt: audit?.at || lead.archivedAt || '-',
        duplicateDetails: status === 'duplicate' ? action : '-'
      };
    });

    this.getArchiveAuditRecords().forEach((audit, index) => {
      const exists = rows.some((row) => row.enqNo === audit.enqNo || row.name === audit.name);
      if (exists) return;
      const status = this.getArchivedStatusFromAction(audit.action);
      rows.push({
        key: `audit-${index}-${audit.enqNo || audit.name || 'record'}`,
        status,
        lead: null,
        audit,
        name: audit.name || '-',
        enqNo: audit.enqNo || '-',
        phone: '-',
        email: '-',
        course: '-',
        query: '-',
        assignedTo: '-',
        archivedBy: audit.by || '-',
        archivedAt: audit.at || '-',
        duplicateDetails: status === 'duplicate' ? audit.action : '-'
      });
    });

    return rows;
  },

  renderArchivedLeadRow(row) {
    const statusLabel = row.status === 'duplicate' ? 'Duplicate' : 'Archived';
    return `
      <article class="archived-lead-row">
        <div class="archived-lead-meta">
          <span class="archived-label">Student</span>
          <strong>${this.escapeHtml(row.name)}</strong>
          <span>${this.escapeHtml(row.enqNo)}</span>
          <span>${this.escapeHtml(row.phone)}${row.email && row.email !== '-' ? ` / ${this.escapeHtml(row.email)}` : ''}</span>
        </div>
        <div class="archived-lead-meta">
          <span class="archived-label">Inquiry Details</span>
          <span>${this.escapeHtml(row.course)}</span>
          <span>${this.escapeHtml(row.query)}</span>
          <span class="archived-status-pill ${row.status}">${statusLabel}</span>
        </div>
        <div class="archived-lead-meta">
          <span class="archived-label">Assigned User</span>
          <strong>${this.escapeHtml(row.assignedTo)}</strong>
          <span>Archived by: ${this.escapeHtml(row.archivedBy)}</span>
          <span>${this.escapeHtml(row.archivedAt)}</span>
        </div>
        <div class="archived-lead-meta">
          <span class="archived-label">Duplicate Details</span>
          <span>${this.escapeHtml(row.duplicateDetails)}</span>
        </div>
      </article>
    `;
  },

  renderArchivedLeadList() {
    const container = document.getElementById('archived-lead-list');
    if (!container) return;
    const rows = this.getArchivedLeadRows();
    const counts = {
      all: rows.length,
      duplicate: rows.filter((row) => row.status === 'duplicate').length,
      archived: rows.filter((row) => row.status === 'archived').length
    };

    Object.entries(counts).forEach(([key, value]) => {
      const el = document.getElementById(`archived-count-${key}`);
      if (el) el.textContent = value;
    });

    ['all', 'duplicate', 'archived'].forEach((key) => {
      document.getElementById(`archived-status-${key}`)?.classList.toggle('active', this.archivedStatusFilter === key);
    });

    const filtered = this.archivedStatusFilter === 'all'
      ? rows
      : rows.filter((row) => row.status === this.archivedStatusFilter);

    container.innerHTML = filtered.length
      ? filtered.map((row) => this.renderArchivedLeadRow(row)).join('')
      : `<div class="archived-empty-state">
          <i class="fas fa-box-open" style="font-size:26px;margin-bottom:10px;display:block"></i>
          No ${this.archivedStatusFilter === 'all' ? 'duplicate or archived' : this.archivedStatusFilter} records found.
        </div>`;
  },

  escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
    const stageKey = this.getLeadStatusKey(lead);
    const stageStatusLabel = this.formatStageStatusLabel(stageKey, this.getLeadSubStatusKey(lead));
    const statusClass = `status-${stageKey}`;
    const isExpanded = this.allExpanded;
    const isSelected = this.selectedLeads.has(lead.id);

    return `
      <div class="lead-card ${isExpanded ? 'is-expanded' : ''}" id="lead-card-${lead.id}">
        <div class="lead-card-header" onclick="LeadsModule.handleRowClick(event, ${lead.id})">
          <button
            type="button"
            class="lead-number lead-serial-select ${isSelected ? 'is-selected' : ''}"
            data-id="${lead.id}"
            onclick="LeadsModule.toggleLeadSelection(${lead.id}); event.stopPropagation()"
            aria-label="${isSelected ? 'Deselect' : 'Select'} lead ${num}"
          >
            ${isSelected ? '<i class="fas fa-check"></i>' : num}
          </button>
          <div class="lead-main-info">
            <div class="lead-name-row">
              <span class="lead-name" onclick="DrawerModule.open(${lead.id}); event.stopPropagation()">${lead.name}</span>
              ${lead.isHot ? '<span class="badge badge-danger" style="font-size:9px;padding:1px 6px">🔥 Hot</span>' : ''}
            </div>
            <div class="lead-phone">
              <i class="fas fa-phone"></i> ${lead.phone}
              <button class="lead-inline-email" type="button" title="Email ${lead.name}" aria-label="Email ${lead.name}" onclick="LeadsModule.email(${lead.id}); event.stopPropagation()">
                <i class="fas fa-envelope"></i>
              </button>
            </div>
          </div>

          <div class="lead-status-wrap">
            <span class="lead-status-pill ${statusClass}">${this.formatStageLabel(stageKey)}</span>
            ${stageStatusLabel ? `<span class="status-type-tag">${stageStatusLabel}</span>` : ''}
          </div>

          <div class="lead-meta">
          <span class="lead-meta-item"><i class="fas fa-book"></i>${lead.course}</span>
            <span class="lead-meta-item"><i class="fas fa-map-marker-alt"></i>${this.getLeadDistrict(lead)}, ${this.getLeadState(lead)}</span>
          </div>

          <span class="lead-timestamp">${lead.timeAgo}</span>

          <div class="lead-actions" onclick="event.stopPropagation()">
            <button class="lead-action-btn funnel-btn" data-tip="Inquiry Funnel" onclick="LeadsModule.showInquiryFunnel(${lead.id})">
              <i class="fas fa-route"></i>
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
                <span class="detail-label">Inquiry Reference No.</span>
                <span class="detail-value">${lead.enqNo}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Full Name</span>
                <span class="detail-value">${lead.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mobile Number</span>
                <span class="detail-value">${lead.phone}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">State</span>
                <span class="detail-value">${this.getLeadState(lead)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">District</span>
                <span class="detail-value">${this.getLeadDistrict(lead)}</span>
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
                <span class="detail-label">Inquiry For</span>
                <span class="detail-value">${lead.course}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Batch Selection</span>
                <span class="detail-value">${lead.batch || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Any Query</span>
                <span class="detail-value">${lead.query}</span>
              </div>
            </div>
            <div class="lead-detail-col">
              <div class="detail-row">
                <span class="detail-label">Mode Of Learning</span>
                <span class="detail-value">${lead.mode || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Inquiry Date/Time</span>
                <span class="detail-value">${lead.inquiryDate}</span>
              </div>
            </div>
          </div>
          <div class="lead-assignment-row">
            <span><i class="fas fa-user-check"></i> Inquiry Assigned to <strong>${lead.assignedTo}</strong> on ${lead.assignedDate}</span>
            ${this.can('inquiryList', 'status') ? `<button class="edit-assign-btn" onclick="LeadsModule.action('changeclass', ${lead.id})"><i class="fas fa-edit"></i></button>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  handleRowClick(e, id) {
    if (e.target.closest('.lead-serial-select') ||
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
      toggleBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
      this.makeIconOnlyButton(toggleBtn, 'Collapse All');
    } else {
      this.allExpanded = false;
      toggleBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
      this.makeIconOnlyButton(toggleBtn, 'Expand All');
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

  toggleSelectAll() {
    const start = (this.currentPage - 1) * this.perPage;
    const visible = this.filteredLeads.slice(start, start + this.perPage);
    const allSelected = visible.length > 0 && visible.every(l => this.selectedLeads.has(l.id));
    visible.forEach(l => {
      if (allSelected) this.selectedLeads.delete(l.id);
      else this.selectedLeads.add(l.id);
    });
    this.renderLeads();
    this.updateSelectAllCheckboxState();
    this.updateSelectionUI();
  },

  updateSelectAllCheckboxState() {
    const master = document.getElementById('select-all-leads');
    if (!master) return;
    const visibleIds = this.filteredLeads.slice((this.currentPage - 1) * this.perPage, this.currentPage * this.perPage).map(l => l.id);
    if (visibleIds.length === 0) {
      master.disabled = true;
      master.classList.remove('active', 'is-partial');
      return;
    }
    master.disabled = false;
    const selectedVisible = visibleIds.filter(id => this.selectedLeads.has(id)).length;
    master.classList.toggle('active', selectedVisible === visibleIds.length);
    master.classList.toggle('is-partial', selectedVisible > 0 && selectedVisible < visibleIds.length);
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
      this.applyToolbarPermissions();
    } else {
      if (badge) badge.style.display = 'none';
      if (batchActions) batchActions.style.display = 'none';
    }
  },

  batchAction(type) {
    const count = this.selectedLeads.size;
    if (count === 0) return;
    const actionMap = { archive: 'delete', assign: 'assign', segment: 'assign', export: 'export', email: 'export', whatsapp: 'export', status: 'status', stages: 'status' };
    const required = actionMap[type];
    if (required && !this.can('inquiryList', required)) {
      this.showToast('This action is not available for the current role.', 'warning');
      return;
    }
    const selectedIds = Array.from(this.selectedLeads);
    const selectedNames = selectedIds.map(id => this.leads.find(l => l.id === id)?.name).filter(Boolean).slice(0, 3).join(', ');
    
    if (type === 'archive') {
      if (confirm(`Are you sure you want to archive ${count} selected lead(s)?\n(${selectedNames}${count > 3 ? '...' : ''})`)) {
        selectedIds.forEach(id => {
          const lead = this.leads.find(l => l.id === id);
          if (lead) {
            this.addAuditRecord(lead, 'Batch archived inquiry');
            lead.archived = true;
          }
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
    } else if (type === 'status' || type === 'stages') {
      this.showBulkStagesModal(selectedIds);
    } else if (type === 'segment') {
      this.showBulkSegmentModal(selectedIds);
    } else if (type === 'export') {
      this.exportLeads(selectedIds);
    }
  },

  getBulkStageModalOptions() {
    return this.getStageDefinitions().filter((stage) => stage.key !== 'all').map((stage) => ({
      ...stage,
      statuses: this.getStageStatusDefinitions(stage.key).length
        ? this.getStageStatusDefinitions(stage.key)
        : [{ key: stage.key, label: stage.label }]
    }));
  },

  renderBulkStageStatusOptions(stageKey) {
    const statusSelect = document.getElementById('bulk-stage-status');
    if (!statusSelect) return;
    const stage = this.getBulkStageModalOptions().find((item) => item.key === stageKey);
    statusSelect.innerHTML = '<option value="">Select Stage Status</option>' + (stage?.statuses || []).map((status) => (
      `<option value="${status.key}">${status.label}</option>`
    )).join('');
  },

  syncBulkStageVisibility() {
    const stageKey = document.getElementById('bulk-stage')?.value || '';
    const dateWrap = document.getElementById('bulk-stage-date-wrap');
    const timeWrap = document.getElementById('bulk-stage-time-wrap');
    const dateInput = document.getElementById('bulk-stage-date');
    const timeInput = document.getElementById('bulk-stage-time');
    const shouldHideSchedule = ['closed', 'admission_form'].includes(stageKey);

    this.renderBulkStageStatusOptions(stageKey);
    if (dateWrap) dateWrap.hidden = shouldHideSchedule;
    if (timeWrap) timeWrap.hidden = shouldHideSchedule;
    if (dateInput) dateInput.required = !shouldHideSchedule;
    if (timeInput) timeInput.required = false;
    if (shouldHideSchedule) {
      if (dateInput) dateInput.value = '';
      if (timeInput) timeInput.value = '';
    }
  },

  syncFollowupStageVisibility() {
    const stageKey = document.getElementById('f-stage')?.value || '';
    const statusSelect = document.getElementById('f-stage-status');
    const dateWrap = document.getElementById('f-date-wrap');
    const timeWrap = document.getElementById('f-time-wrap');
    const dateInput = document.getElementById('f-date');
    const timeInput = document.getElementById('f-time');
    const shouldHideSchedule = ['closed', 'admission_form'].includes(stageKey);
    const stage = this.getBulkStageModalOptions().find((item) => item.key === stageKey);

    if (statusSelect) {
      statusSelect.innerHTML = '<option value="">Select Stage Status</option>' + (stage?.statuses || []).map((status) => (
        `<option value="${status.key}">${status.label}</option>`
      )).join('');
    }
    if (dateWrap) dateWrap.hidden = shouldHideSchedule;
    if (timeWrap) timeWrap.hidden = shouldHideSchedule;
    if (dateInput) dateInput.required = !shouldHideSchedule;
    if (timeInput) timeInput.required = false;
    if (shouldHideSchedule) {
      if (dateInput) dateInput.value = '';
      if (timeInput) timeInput.value = '';
    }
  },

  showBulkStagesModal(selectedIds) {
    const leads = selectedIds.map((id) => this.leads.find((lead) => lead.id === id)).filter(Boolean);
    const followedBy = [...new Set(leads.map((lead) => lead.assignedTo || lead.owner || 'Unassigned'))].join(', ');
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card wide">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas fa-tags" style="color:var(--primary)"></i> Update Lead Stages</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body">
          <form id="bulk-stage-form" data-ids="${selectedIds.join(',')}" onsubmit="event.preventDefault(); LeadsModule.saveBulkStages()">
            <div class="modal-grid-2 compact-grid">
              <div class="form-field">
                <label>Follow-up Stage *</label>
                <select id="bulk-stage" required onchange="LeadsModule.syncBulkStageVisibility()">
                  <option value="">Select Follow-up Stage</option>
                  ${this.getBulkStageModalOptions().map((stage) => `<option value="${stage.key}">${stage.label}</option>`).join('')}
                </select>
              </div>
              <div class="form-field">
                <label>Follow-up Stage Status</label>
                <select id="bulk-stage-status">
                  <option value="">Select Stage Status</option>
                </select>
              </div>
              <div class="form-field">
                <label>Ref No.</label>
                <input type="text" id="bulk-stage-ref" placeholder="Optional reference number">
              </div>
              <div class="form-field" id="bulk-stage-date-wrap">
                <label>Follow-up Date *</label>
                <input type="date" id="bulk-stage-date" required>
              </div>
              <div class="form-field" id="bulk-stage-time-wrap">
                <label>Follow-up Time</label>
                <input type="time" id="bulk-stage-time">
              </div>
              <div class="form-field">
                <label>Followed By</label>
                <div class="readonly-field">${followedBy}</div>
              </div>
              <div class="form-field full">
                <label>Purpose *</label>
                <textarea id="bulk-stage-purpose" rows="3" required placeholder="Enter purpose"></textarea>
              </div>
            </div>
            <input type="submit" id="bulk-stage-submit" style="display:none">
          </form>
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-outline btn-sm" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('bulk-stage-submit').click()">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.syncBulkStageVisibility();
  },

  saveBulkStages() {
    const form = document.getElementById('bulk-stage-form');
    if (!form) return;
    const ids = (form.dataset.ids || '').split(',').map((value) => Number(value)).filter(Boolean);
    const stageKey = document.getElementById('bulk-stage')?.value || '';
    const stageStatus = document.getElementById('bulk-stage-status')?.value || '';
    const refNo = document.getElementById('bulk-stage-ref')?.value.trim() || '';
    const followupDate = document.getElementById('bulk-stage-date')?.value || '';
    const followupTime = document.getElementById('bulk-stage-time')?.value || '';
    const purpose = document.getElementById('bulk-stage-purpose')?.value.trim() || '';
    const needsSchedule = !['closed', 'admission_form'].includes(stageKey);
    if (!stageKey || !purpose || (needsSchedule && !followupDate)) return;
    const followedBy = document.querySelector('#bulk-stage-form .readonly-field')?.textContent || '';

    ids.forEach((id) => {
      const lead = this.leads.find((item) => item.id === id);
      if (!lead) return;
      lead.stageKey = stageKey;
      lead.stageStatus = stageStatus === stageKey ? '' : stageStatus;
      lead.status = stageStatus || stageKey;
      lead.followupRefNo = refNo;
      if (needsSchedule) {
        lead.followupDate = followupDate;
        lead.followupTime = followupTime;
      } else {
        lead.followupDate = '';
        lead.followupTime = '';
      }
      lead.followupPurpose = purpose;
      lead.followupManagement = { stageKey, stageStatus: lead.stageStatus, refNo, followupDate: lead.followupDate, followupTime: lead.followupTime, purpose, followedBy };
      this.normalizeLeadStageData(lead);
      this.stampLeadModified(lead);
      if (stageKey === 'counselling') {
        this.recordEmailNotification(
          lead,
          'Counselling scheduled - Pramukh Academy',
          `Dear ${lead.name}, your counselling follow-up is scheduled on ${lead.followupDate || '-'}${lead.followupTime ? ` at ${lead.followupTime}` : ''}. Purpose: ${purpose}.`,
          'Automatic counselling stage email.'
        );
      }
      if (stageKey === 'admission_form') {
        this.recordEmailNotification(
          lead,
          'Admission form link - Pramukh Academy',
          `Dear ${lead.name}, your inquiry has moved to admission. Please complete the admission form: ams.html`,
          'Automatic admission stage email.'
        );
      }
      this.recordTimelineAction(lead, 'Bulk Stage Updated', `${this.formatStageLabel(stageKey)}${lead.stageStatusLabel ? ` - ${lead.stageStatusLabel}` : ''}. Purpose: ${purpose}${refNo ? `. Ref No: ${refNo}` : ''}`);
    });

    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
    this.updateStatusBarCounts();
    this.syncAppDataLeads();
    this.showToast(`${ids.length} lead(s) updated`, 'success');
  },

  showBulkSegmentModal(selectedIds) {
    const segments = (window.APP_DATA.SEGMENT_DATA || []).filter((segment) => !segment.archived);
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card wide">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas fa-layer-group" style="color:var(--primary)"></i> Assign Leads to Segment</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body">
          <form id="bulk-segment-form" data-ids="${selectedIds.join(',')}" onsubmit="event.preventDefault(); LeadsModule.assignBulkSegment()">
            <p style="margin:0 0 16px;font-size:13px;color:var(--text-secondary)">Select below segment to assign the leads.</p>
            <div class="segment-selection-list">
              ${segments.map((segment) => `
                <label class="segment-selection-card">
                  <input type="radio" name="bulk-segment-id" value="${segment.id}" ${selectedIds.every((leadId) => segment.leadIds?.includes(leadId)) ? 'checked' : ''}>
                  <span class="segment-selection-body">
                    <span class="segment-selection-head">
                      <strong>${segment.name}</strong>
                      <span>${segment.leadIds?.length || 0} leads</span>
                    </span>
                    <span class="segment-selection-meta">Assigned to: ${(segment.assignedUsers && segment.assignedUsers.length) ? segment.assignedUsers.join(', ') : 'Unassigned'}</span>
                    <span class="segment-selection-meta">${segment.criteria || 'No criteria added'}</span>
                  </span>
                </label>
              `).join('')}
            </div>
            <input type="submit" id="bulk-segment-submit" style="display:none">
          </form>
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-outline btn-sm" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('bulk-segment-submit').click()">Assign Leads</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  assignBulkSegment() {
    const form = document.getElementById('bulk-segment-form');
    if (!form) return;
    const ids = (form.dataset.ids || '').split(',').map((value) => Number(value)).filter(Boolean);
    const selectedSegmentId = Number(document.querySelector('input[name="bulk-segment-id"]:checked')?.value);
    const segment = (window.APP_DATA.SEGMENT_DATA || []).find((item) => item.id === selectedSegmentId);
    if (!segment) return;

    if (!Array.isArray(segment.leadIds)) segment.leadIds = [];
    ids.forEach((leadId) => {
      if (!segment.leadIds.includes(leadId)) segment.leadIds.push(leadId);
      const lead = this.leads.find((item) => item.id === leadId);
      if (lead) {
        lead.segment = segment.name;
        this.stampLeadModified(lead);
        this.recordTimelineAction(lead, 'Segment Assigned', `Assigned to segment ${segment.name}.`);
      }
    });

    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
    this.syncAppDataLeads();
    this.showToast(`${ids.length} lead(s) assigned to ${segment.name}`, 'success');
  },

  exportLeads(ids = null, filename = 'leads-export.csv') {
    const rows = ids ? this.applyRoleScope(this.leads).filter(l => ids.includes(l.id)) : this.filteredLeads;
    const headers = ['Inquiry Reference No.', 'Full Name', 'Contact No.', 'Email ID', 'State', 'District', 'Academic Status', 'Inquiry For', 'Batch Selection', 'Mode Of Learning', 'Any Specific Query', 'Inquiry Date/Time'];
    const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(',')].concat(rows.map(lead => [
      lead.enqNo,
      lead.name,
      lead.phone,
      lead.email,
      this.getLeadState(lead),
      this.getLeadDistrict(lead),
      lead.academicStatus || '',
      lead.course,
      lead.batch || '',
      lead.mode || '',
      lead.query || '',
      lead.inquiryDate
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

  addAuditRecord(lead, action) {
    const records = JSON.parse(localStorage.getItem('paAuditDeleted') || '[]');
    records.unshift({
      id: Date.now(),
      enqNo: lead.enqNo,
      name: lead.name,
      action,
      by: window.DEMO_AUTH?.user || 'Admin',
      at: new Date().toLocaleString('en-IN')
    });
    localStorage.setItem('paAuditDeleted', JSON.stringify(records.slice(0, 50)));
  },

  recordEmailNotification(lead, subject, body, remarks = '') {
    if (!lead?.email) return;
    const record = {
      id: Date.now(),
      leadId: lead.id,
      enqNo: lead.enqNo,
      to: lead.email,
      subject,
      body,
      remarks,
      at: new Date().toLocaleString('en-IN'),
      status: 'queued'
    };
    try {
      const outbox = JSON.parse(localStorage.getItem('pa-email-outbox') || '[]');
      outbox.unshift(record);
      localStorage.setItem('pa-email-outbox', JSON.stringify(outbox.slice(0, 100)));
    } catch (e) {}
    if (!lead.communications) lead.communications = [];
    lead.communications.unshift({
      type: 'email',
      day: new Date().getDate().toString().padStart(2, '0'),
      month: new Date().toLocaleString('en-IN', { month: 'short' }),
      title: `Email: ${subject}`,
      desc: body,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      by: 'System',
      emailRemarks: remarks,
      payload: { to: lead.email, subject, body }
    });
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
    if (!this.can('inquiryList', 'import')) {
      this.showToast('Import is not available for the current role.', 'warning');
      return;
    }
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
          <div style="font-size:12px;color:var(--text-muted)">Expected columns: name, phone, email, state, district, academicStatus, course, batch, mode, query.</div>
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
        const state = get('state') || 'Gujarat';
        const district = get('district') || 'Ahmedabad';
        const course = this.normalizeInquiryCourse(get('course') || 'General Inquiry');
        return {
          id: maxId + index + 1,
          enqNo: `ENQ${Date.now().toString().slice(-5)}${index}`,
          name: get('name') || `Imported Lead ${index + 1}`,
          phone: get('phone'),
          whatsapp: get('phone'),
          email: get('email'),
          state,
          district,
          city: `${district}, ${state}`,
          course,
          batch: this.courseNeedsBatchMode(course) ? (get('batch') || 'Foundation') : '',
          mode: this.courseNeedsBatchMode(course) ? (get('mode') || 'Class') : '',
          source: 'Inquiry Form',
          campaign: '-',
          inquiryDate: new Date().toLocaleString('en-IN'),
          owner: 'Unassigned',
          ownerTeam: 'Admin',
          status: 'pending',
          statusLabel: 'Pending',
          priority: 'medium',
          leadScore: 50,
          leadAge: '0 Days',
          academicStatus: this.normalizeAcademicStatus(get('academicstatus') || 'College Student'),
          query: get('query') || 'Imported inquiry.',
          assignedTo: 'Unassigned',
          assignedDate: '-',
          timeAgo: 'Just now',
          isHot: false,
          stageKey: 'pending',
          stageStatus: '',
          stage: 0,
          stageLabel: 'Pending',
          communications: []
        };
      });
      this.leads.unshift(...created);
      this.normalizeInquiryLeadData();
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
    
    const sortOpts = this.getSortOptions();

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
    this.showToast(`Sorted by ${this.getSortLabel(opt)}`, 'info');
  },

  updateSortButtonLabel() {
    const button = document.getElementById('sort-toggle-btn');
    if (!button) return;
    const label = this.getSortLabel();
    this.makeIconOnlyButton(button, label);
    button.title = label;
    button.setAttribute('aria-label', label);
  },

  buildFilterPanel() {
    const filterPanel = document.getElementById('leads-filter-panel');
    if (!filterPanel) return;
    const stateOptions = Object.keys(typeof INDIAN_STATE_DISTRICTS !== 'undefined' ? INDIAN_STATE_DISTRICTS : {}).map((state) => (
      `<option value="${state}">${state}</option>`
    )).join('');
    const segmentOptions = (window.APP_DATA?.SEGMENT_DATA || []).map((segment) => (
      `<option value="${segment.name}">${segment.name}</option>`
    )).join('');
    filterPanel.innerHTML = `
      <div class="filter-field">
        <label>Search</label>
        <input type="text" id="filter-search-input" placeholder="Name, number, email" oninput="LeadsModule.applyFilters()">
      </div>
      <div class="filter-field">
        <label>Course</label>
        <select id="filter-course" onchange="LeadsModule.applyFilters()">
          <option value="all">All Courses</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="UPSC">UPSC</option>
          <option value="GPSC-Class1,2">GPSC Class 1&2</option>
          <option value="Class -3">Class 3</option>
          <option value="Sankalp">Sankalp</option>
          <option value="Sampurn">Sampurn</option>
        </select>
      </div>
      <div class="filter-field">
        <label>Batch</label>
        <select id="filter-batch" onchange="LeadsModule.applyFilters()">
          <option value="all">All Batches</option>
          <option value="Foundation">Foundation</option>
          <option value="mentorship">Mentorship</option>
          <option value="Interview">Interview</option>
          <option value="mains">Mains</option>
          <option value="master-batch">Master batch</option>
          <option value="others">Other</option>
        </select>
      </div>
      <div class="filter-field">
        <label>State</label>
        <select id="filter-state" onchange="LeadsModule.applyFilters()">
          <option value="">All States</option>
          ${stateOptions}
        </select>
      </div>
      <div class="filter-field">
        <label>District</label>
        <input type="text" id="filter-district" placeholder="District" oninput="LeadsModule.applyFilters()">
      </div>
      <div class="filter-field">
        <label>Mode</label>
        <select id="filter-mode" onchange="LeadsModule.applyFilters()">
          <option value="all">All Modes</option>
          <option value="residental">Residental</option>
          <option value="Class">Classroom</option>
          <option value="Online">Online</option>
        </select>
      </div>
      <div class="filter-field">
        <label>Date Range</label>
        <div class="date-range-filter">
          <input type="date" id="filter-date-from" onchange="LeadsModule.applyFilters()">
          <input type="date" id="filter-date-to" onchange="LeadsModule.applyFilters()">
        </div>
      </div>
      <div class="filter-field">
        <label>Lead Segment</label>
        <select id="filter-segment" onchange="LeadsModule.applyFilters()">
          <option value="all">All Segments</option>
          ${segmentOptions}
        </select>
      </div>
      <div class="filter-field">
        <label>Inquiry Number</label>
        <input type="text" id="filter-inquiry-number" placeholder="Inquiry number" oninput="LeadsModule.applyFilters()">
      </div>
      <div class="filter-field">
        <label>Assigned To</label>
        <select id="filter-assign-inquiry" onchange="LeadsModule.applyFilters()">
          <option value="all">All Assigned</option>
          <option value="Bharat Sir">Bharat Sir</option>
          <option value="Vivek Sir">Vivek Sir</option>
          <option value="Pooja Shah">Pooja Shah</option>
          <option value="Jignesh Trivedi">Jignesh Trivedi</option>
          <option value="Unassigned">Unassigned</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-outline btn-sm" onclick="LeadsModule.resetFilters()">Reset</button>
      </div>
    `;
  },

  setupFilters() {
    this.buildFilterPanel();
    const filterBtn = document.getElementById('filter-toggle-btn');
    const filterPanel = document.getElementById('leads-filter-panel');
    if (filterBtn && filterPanel) {
      filterPanel.style.display = '';
      filterPanel.classList.add('is-hidden');
      filterBtn.classList.remove('active');
      filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = filterPanel.classList.contains('is-hidden');
        filterPanel.classList.toggle('is-hidden', !isHidden);
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
    this.filterBatch = 'all';
    this.filterState = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterInquiryNumber = '';
    this.filterAssignInquiry = 'all';
    this.filterInquiryDate = '';
    this.filterFollowupDate = '';
    this.filterSegment = 'all';
    
    const courseSel = document.getElementById('filter-course');
    if (courseSel) courseSel.value = 'all';
    
    const sourceSel = document.getElementById('filter-source');
    if (sourceSel) sourceSel.value = 'all';
    
    const searchInput = document.getElementById('filter-search-input');
    if (searchInput) searchInput.value = '';

    ['filter-counselor', 'filter-mode', 'filter-academic-status', 'filter-segment', 'filter-batch', 'filter-assign-inquiry'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = 'all';
    });
    ['filter-district', 'filter-state', 'filter-date-from', 'filter-date-to', 'filter-inquiry-number', 'filter-inquiry-date', 'filter-followup-date'].forEach(id => {
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
    if (window.AuthModule && !AuthModule.isInScope(lead)) {
      this.showToast('This inquiry is outside the current role scope.', 'warning');
      return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'more-dropdown-menu';
    const items = [];
    if (this.can('inquiryList', 'followup')) items.push(`<div class="dropdown-item" onclick="LeadsModule.action('followup', ${id})"><i class="fas fa-redo"></i> Manage Follow-up</div>`);
    if (this.can('inquiryList', 'followup')) items.push(`<div class="dropdown-item" onclick="LeadsModule.action('counselling', ${id})"><i class="fas fa-comments"></i> Schedule Counselling</div>`);
    if (this.can('inquiryList', 'export')) items.push(`<div class="dropdown-item" onclick="LeadsModule.action('print', ${id})"><i class="fas fa-print"></i> Print Inquiry Form</div>`);
    if (this.can('inquiryList', 'edit')) items.push(`<div class="dropdown-item" onclick="LeadsModule.action('duplicate_scan', ${id})"><i class="fas fa-clone"></i> Duplicate Scan</div>`);
    if (this.can('inquiryList', 'delete')) items.push('<div class="dropdown-divider"></div>');
    if (this.can('inquiryList', 'delete')) {
      items.push(`<div class="dropdown-item danger" onclick="LeadsModule.action('delete', ${id})"><i class="fas fa-trash"></i> Delete</div>`);
      items.push(`<div class="dropdown-item danger" onclick="LeadsModule.action('archive', ${id})"><i class="fas fa-archive"></i> Archive</div>`);
    }
    menu.innerHTML = items.join('');
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
    const permissionByAction = {
      followup: 'followup',
      counselling: 'followup',
      duplicate_scan: 'edit',
      archive: 'delete',
      delete: 'delete',
      print: 'export',
      changeclass: 'status'
    };
    const required = permissionByAction[type];
    if (required && !this.can('inquiryList', required)) {
      this.showToast('This action is not available for the current role.', 'warning');
      return;
    }
    
    if (type === 'followup') {
      this.showManageFollowup(id);
    } else if (type === 'changeclass') {
      this.showChangeClassModal(id);
    } else if (type === 'counselling') {
      this.showCounsellingModal(id);
    } else if (type === 'archive') {
      this.archiveLead(id);
    } else if (type === 'delete') {
      this.addAuditRecord(lead, 'Admin delete requested');
      lead.archived = true;
      this.selectedLeads.delete(id);
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast('Inquiry moved to Admin audit log.', 'warning');
    } else if (type === 'duplicate_scan') {
      this.showDuplicateScanModal(id);
    } else if (type === 'print') {
      DrawerModule.open(id);
      setTimeout(() => window.print(), 150);
    }
  },

  recordTimelineAction(lead, title, desc) {
    if (!lead.communications) lead.communications = [];
    const now = new Date();
    this.stampLeadModified(lead, now);
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

  showLostReasonModal(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas fa-user-times" style="color:var(--danger)"></i> Mark as Lost</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body">
          <div class="form-field">
            <label>Lost Reason *</label>
            <select id="lost-reason-select" required>
              <option>Not Interested</option>
              <option>Joined Elsewhere</option>
              <option>Financial</option>
              <option>Course Mismatch</option>
              <option>No Response</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-outline btn-sm" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="LeadsModule.confirmLost(${id})">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  confirmLost(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    const reason = document.getElementById('lost-reason-select')?.value || 'No Response';
    lead.stageKey = 'closed';
    lead.stageStatus = '';
    lead.status = 'closed';
    lead.statusLabel = 'Closed';
    lead.lostReason = reason;
    this.normalizeLeadStageData(lead);
    this.stampLeadModified(lead);
    this.recordTimelineAction(lead, 'Marked Lost', `Reason: ${reason}`);
    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
    this.updateStatusBarCounts();
    this.showToast(`${lead.name} marked as lost`, 'warning');
  },

  showAddEditModal(lead = null) {
    const isEdit = lead !== null;
    const title = isEdit ? 'View/Edit Inquiry Details' : 'Add New Inquiry';
    
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
                <label>Preferred Learning Mode</label>
                <select id="m-mode">
                  <option value="Classroom" ${mode === 'Classroom' ? 'selected' : ''}>Classroom</option>
                  <option value="Online" ${mode === 'Online' ? 'selected' : ''}>Online</option>
                  <option value="Residential Mode" ${mode === 'Residential Mode' ? 'selected' : ''}>Residential Mode</option>
                  <option value="Walk-in" ${mode === 'Walk-in' ? 'selected' : ''}>Walk-in</option>
                </select>
              </div>
              <div class="form-field">
                <label>Inquiry Source</label>
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

  renderModeOption(value, selected, label = value) {
    return `
      <label class="radio-pill">
        <input type="radio" name="m-mode" value="${value}" ${selected === value ? 'checked' : ''} required>
        ${label}
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

  setupLeadLocationFields(selectedState = '', selectedDistrict = '') {
    const stateSelect = document.getElementById('m-state');
    const districtSelect = document.getElementById('m-district');
    if (!stateSelect || !districtSelect || typeof INDIAN_STATE_DISTRICTS === 'undefined') return;

    Object.keys(INDIAN_STATE_DISTRICTS).forEach((state) => {
      stateSelect.insertAdjacentHTML('beforeend', `<option value="${state}">${state}</option>`);
    });

    const renderDistricts = () => {
      const districts = INDIAN_STATE_DISTRICTS[stateSelect.value] || [];
      districtSelect.innerHTML = '<option value="">Select District</option>';
      districts.forEach((district) => {
        districtSelect.insertAdjacentHTML('beforeend', `<option value="${district}">${district}</option>`);
      });
      districtSelect.disabled = districts.length === 0;
      districtSelect.value = districts.includes(selectedDistrict) ? selectedDistrict : '';
    };

    stateSelect.addEventListener('change', () => {
      selectedDistrict = '';
      renderDistricts();
    });
    stateSelect.value = selectedState;
    renderDistricts();
  },

  setupLeadInquiryFields() {
    document.querySelectorAll('input[name="m-inquiry-type"]').forEach((input) => {
      input.addEventListener('change', () => this.updateLeadInquiryFields());
    });
    document.getElementById('m-course')?.addEventListener('change', () => this.updateLeadInquiryFields());
    document.getElementById('m-academic-status')?.addEventListener('change', () => {
      this.applyLeadAcademicStatusDefaults();
      this.updateLeadInquiryFields();
    });
    this.applyLeadAcademicStatusDefaults();
    this.updateLeadInquiryFields();
  },

  applyLeadAcademicStatusDefaults() {
    const academicStatus = document.getElementById('m-academic-status')?.value;
    const courseInquiry = document.querySelector('input[name="m-inquiry-type"][value="Course Inquiry"]');
    const generalInquiry = document.querySelector('input[name="m-inquiry-type"][value="General Inquiry"]');
    const courseSelect = document.getElementById('m-course');
    if (academicStatus !== 'School Student' || !courseInquiry || !courseSelect) return;

    courseInquiry.checked = true;
    if (generalInquiry) generalInquiry.checked = false;
    courseSelect.value = 'Sankalp';
  },

  updateLeadInquiryFields() {
    const form = document.getElementById('add-lead-form');
    const optionalForm = form?.dataset.optional === 'true';
    const inquiryType = document.querySelector('input[name="m-inquiry-type"]:checked')?.value || 'General Inquiry';
    const courseSelect = document.getElementById('m-course');
    const batchSelect = document.getElementById('m-batch');
    const modeInputs = Array.from(document.querySelectorAll('input[name="m-mode"]'));
    const query = document.getElementById('m-query');
    const queryLabel = document.getElementById('m-query-label');
    const isCourseInquiry = inquiryType === 'Course Inquiry';
    const needsBatchMode = this.courseNeedsBatchMode(courseSelect?.value);
    const academicStatus = document.getElementById('m-academic-status')?.value;
    const isSchoolStudent = academicStatus === 'School Student';
    const isClass3Course = isCourseInquiry && courseSelect?.value === 'Class -3';

    document.getElementById('m-course-wrap').hidden = !isCourseInquiry;
    document.getElementById('m-batch-wrap').hidden = !isCourseInquiry || !needsBatchMode;
    document.getElementById('m-mode-wrap').hidden = !isCourseInquiry || !needsBatchMode;
    document.getElementById('m-query-wrap').hidden = false;

    if (courseSelect) {
      courseSelect.required = !optionalForm && isCourseInquiry;
      if (!isCourseInquiry) courseSelect.value = '';
    }
    if (batchSelect) {
      this.renderLeadBatchOptions(batchSelect, courseSelect?.value);
      batchSelect.required = !optionalForm && isCourseInquiry && needsBatchMode && !isClass3Course;
      if (!needsBatchMode) batchSelect.value = '';
    }
    modeInputs.forEach((input) => {
      input.required = !optionalForm && isCourseInquiry && needsBatchMode && !isClass3Course;
      if (!needsBatchMode) input.checked = false;
    });
    if (query) {
      query.required = !optionalForm && (isCourseInquiry ? isSchoolStudent : true);
    }
    if (queryLabel) {
      if (optionalForm) {
        queryLabel.textContent = 'Any Specific Query (Optional)';
      } else if (isCourseInquiry) {
        queryLabel.textContent = isSchoolStudent ? 'Any Specific Query *' : 'Any Specific Query (Optional)';
      } else {
        queryLabel.textContent = 'Any Specific Query *';
      }
    }
  },

  getLeadBatchOptions(course) {
    if (course === 'Class -3') {
      return [
        { value: 'master-batch', label: 'Master batch' },
        { value: 'others', label: 'Other' }
      ];
    }
    return [
      { value: 'Foundation', label: 'Foundation' },
      { value: 'mentorship', label: 'Mentorship' },
      { value: 'Interview', label: 'Interview' },
      { value: 'mains', label: 'Mains' }
    ];
  },

  renderLeadBatchOptions(batchSelect, course) {
    const selected = batchSelect.value;
    const options = this.getLeadBatchOptions(course);
    batchSelect.innerHTML = '<option value="">Select Batch</option>' + options.map((option) => (
      `<option value="${option.value}">${option.label}</option>`
    )).join('');
    batchSelect.value = options.some((option) => option.value === selected) ? selected : '';
  },

  showAddEditModal(lead = null) {
    const isEdit = lead !== null;
    const optionalForm = !isEdit;
    const requiredMark = optionalForm ? '' : ' *';
    const requiredAttr = optionalForm ? '' : ' required';
    const title = isEdit ? 'Edit Lead Details' : 'Add New Inquiry';
    const name = isEdit ? lead.name : '';
    const phone = isEdit ? lead.phone : '';
    const email = isEdit ? lead.email : '';
    const state = isEdit ? this.getLeadState(lead) : '';
    const district = isEdit ? this.getLeadDistrict(lead) : '';
    const academicStatus = isEdit ? this.normalizeAcademicStatus(lead.academicStatus) : 'College Student';
    const course = isEdit ? this.normalizeInquiryCourse(lead.course) : '';
    const batch = isEdit ? (lead.batch || '') : '';
    const mode = isEdit ? this.normalizeLearningMode(lead.mode, course) : '';
    const inquiryType = isEdit && course !== 'General Inquiry' ? 'Course Inquiry' : 'General Inquiry';
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
          <form id="add-lead-form" data-optional="${optionalForm ? 'true' : 'false'}" onsubmit="event.preventDefault(); LeadsModule.saveLeadForm(${isEdit ? lead.id : 'null'})">
            <div class="modal-grid-2">
              <div class="form-field">
                <label>Full Name${requiredMark}</label>
                <input type="text" id="m-name" value="${name}"${requiredAttr} placeholder="Full Name">
              </div>
              <div class="form-field">
                <label>Contact No.${requiredMark}</label>
                <input type="tel" id="m-phone" value="${phone}"${requiredAttr} placeholder="10-digit number">
              </div>
              <div class="form-field">
                <label>Email ID${requiredMark}</label>
                <input type="email" id="m-email" value="${email}"${requiredAttr} placeholder="email@gmail.com">
              </div>
              <div class="form-field">
                <label>State${requiredMark}</label>
                <select id="m-state"${requiredAttr}>
                  <option value="">Select State</option>
                </select>
              </div>
              <div class="form-field">
                <label>District${requiredMark}</label>
                <select id="m-district"${requiredAttr} disabled>
                  <option value="">Select District</option>
                </select>
              </div>
              <div class="form-field">
                <label>Academic Status${requiredMark}</label>
                <select id="m-academic-status"${requiredAttr}>
                  <option value="School Student" ${academicStatus === 'School Student' ? 'selected' : ''}>School Student</option>
                  <option value="College Student" ${academicStatus === 'College Student' ? 'selected' : ''}>College Student</option>
                  <option value="Graducation Completed" ${academicStatus === 'Graducation Completed' ? 'selected' : ''}>Graducation Completed</option>
                </select>
              </div>
              <div class="form-field span-2">
                <label>Inquiry For${requiredMark}</label>
                <div class="radio-card-grid cols-2">
                  <label class="radio-card">
                    <input type="radio" name="m-inquiry-type" value="General Inquiry" ${inquiryType === 'General Inquiry' ? 'checked' : ''}${requiredAttr}>
                    <span class="radio-mark"></span>
                    <span><span class="radio-title">General inquiry</span><span class="radio-subtitle">Ask a specific question</span></span>
                  </label>
                  <label class="radio-card">
                    <input type="radio" name="m-inquiry-type" value="Course Inquiry" ${inquiryType === 'Course Inquiry' ? 'checked' : ''}${requiredAttr}>
                    <span class="radio-mark"></span>
                    <span><span class="radio-title">Course Inquiry</span><span class="radio-subtitle">Select course details</span></span>
                  </label>
                </div>
              </div>
              <div class="form-field span-2" id="m-course-wrap" hidden>
                <label>Course${requiredMark}</label>
                <select id="m-course">
                  <option value="">Select Course</option>
                  <option value="UPSC" ${course === 'UPSC' ? 'selected' : ''}>UPSC</option>
                  <option value="GPSC-Class1,2" ${course === 'GPSC-Class1,2' ? 'selected' : ''}>GPSC Class 1&2</option>
                  <option value="Class -3" ${course === 'Class -3' ? 'selected' : ''}>Class 3</option>
                  <option value="Sankalp" ${course === 'Sankalp' ? 'selected' : ''}>Sankalp (For School Student)</option>
                  <option value="Sampurn" ${course === 'Sampurn' ? 'selected' : ''}>Sampurn (For College Student)</option>
                </select>
              </div>
              <div class="form-field" id="m-batch-wrap" hidden>
                <label>Batch Selection${requiredMark}</label>
                <select id="m-batch">
                  <option value="">Select Batch</option>
                  <option value="Foundation" ${batch === 'Foundation' ? 'selected' : ''}>Foundation</option>
                  <option value="mentorship" ${batch === 'mentorship' ? 'selected' : ''}>Mentorship</option>
                  <option value="Interview" ${batch === 'Interview' ? 'selected' : ''}>Interview</option>
                  <option value="mains" ${batch === 'mains' ? 'selected' : ''}>Mains</option>
                </select>
              </div>
              <div class="form-field" id="m-mode-wrap" hidden>
                <label>Mode Of Learning${requiredMark}</label>
                <div class="radio-inline-group">
                  ${this.renderModeOption('residental', mode, 'Residental')}
                  ${this.renderModeOption('Class', mode, 'ClassRoom')}
                  ${this.renderModeOption('Online', mode, 'Online')}
                </div>
              </div>
              <div class="form-field full" id="m-query-wrap">
                <label id="m-query-label">${optionalForm ? 'Any Specific Query (Optional)' : 'Any Specific Query *'}</label>
                <textarea id="m-query" rows="3"${requiredAttr} placeholder="Write your query...">${query}</textarea>
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
    this.setupLeadLocationFields(state, district);
    this.setupLeadInquiryFields();
  },

  saveLeadForm(leadId) {
    const isEdit = leadId !== null;
    const name = document.getElementById('m-name').value.trim();
    const phone = document.getElementById('m-phone').value.trim();
    const email = document.getElementById('m-email').value.trim();
    const state = document.getElementById('m-state').value;
    const district = document.getElementById('m-district').value;
    const academicStatus = document.getElementById('m-academic-status').value;
    const inquiryType = document.querySelector('input[name="m-inquiry-type"]:checked')?.value;
    const selectedCourse = document.getElementById('m-course').value;
    const course = inquiryType === 'Course Inquiry' ? selectedCourse : 'General Inquiry';
    const batch = document.getElementById('m-batch').value;
    const mode = document.querySelector('input[name="m-mode"]:checked')?.value;
    const query = document.getElementById('m-query').value.trim();
    const requiresBatchMode = inquiryType === 'Course Inquiry' && this.courseNeedsBatchMode(course);
    const optionalForm = !isEdit && document.getElementById('add-lead-form')?.dataset.optional === 'true';
    const isSchoolStudent = academicStatus === 'School Student';
    const isClass3Course = inquiryType === 'Course Inquiry' && course === 'Class -3';
    if (!optionalForm && (!name || !phone || !email || !state || !district || !academicStatus || !inquiryType || (inquiryType === 'General Inquiry' && !query) || (inquiryType === 'Course Inquiry' && !selectedCourse) || (requiresBatchMode && !isClass3Course && (!batch || !mode)) || (inquiryType === 'Course Inquiry' && isSchoolStudent && !query))) return;
    const displayLocation = district && state ? `${district}, ${state}` : district || state || '-';

    if (isEdit) {
      const lead = this.leads.find(l => l.id === leadId);
      if (lead) {
        lead.name = name;
        lead.phone = phone;
        lead.whatsapp = phone;
        lead.email = email;
        lead.state = state;
        lead.district = district;
        lead.city = displayLocation;
        lead.pincode = '';
        lead.inquiryType = inquiryType;
        lead.course = course;
        lead.batch = requiresBatchMode ? batch : '';
        lead.mode = requiresBatchMode ? mode : '';
        lead.academicStatus = academicStatus;
        lead.query = query;
        if (!lead.utm) lead.utm = this.buildUtmTracking('CRM Add Inquiry');
        this.normalizeLeadStageData(lead);
        this.stampLeadModified(lead);
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
        pincode: '',
        state,
        district,
        city: displayLocation,
        inquiryType,
        course,
        batch: requiresBatchMode ? batch : '',
        mode: requiresBatchMode ? mode : '',
        source: 'Inquiry Form',
        campaign: 'direct_inquiry',
        utm: this.buildUtmTracking('CRM Add Inquiry'),
        inquiryDate: timestamp,
        owner: 'Bharat Sir',
        ownerTeam: 'UPSC Team',
        status: 'pending',
        statusLabel: 'Pending',
        priority: 'medium',
        leadScore: 65,
        leadAge: '0 Days',
        academicStatus,
        query,
        assignedTo: 'Bharat Sir',
        assignedDate: timestamp,
        timeAgo: 'Just now',
        isHot: false,
        stageKey: 'pending',
        stageStatus: '',
        stage: 0,
        stageLabel: 'Pending',
        communications: []
      };
      this.normalizeLeadStageData(newLead);
      this.recordEmailNotification(
        newLead,
        'Inquiry confirmation - Pramukh Academy',
        `Dear ${newLead.name}, your inquiry ${newLead.enqNo} has been received. Our team will contact you shortly.`,
        'Automatic inquiry confirmation email.'
      );
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
                  <option>Need More Info</option>
                  <option>Thinking</option>
                  <option>Not Interested</option>
                </select>
              </div>
              <div class="form-field">
                <label>Parent Involvement</label>
                <select id="cs-parent-involvement">
                  <option>Not Required</option>
                  <option>Parent Interested</option>
                  <option>Parent Meeting Needed</option>
                  <option>Parent Already Counselled</option>
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
    const parentInvolvement = document.getElementById('cs-parent-involvement').value;
    const nextAction = document.getElementById('cs-next-action').value;
    const course = document.getElementById('cs-course').value;
    const learningMode = document.getElementById('cs-learning-mode').value;
    const requirement = document.getElementById('cs-requirement').value;
    const summary = document.getElementById('cs-summary').value;
    const remarks = document.getElementById('cs-remarks').value;

    lead.stageKey = 'counselling';
    lead.stageStatus = 'conducted';
    lead.status = 'conducted';
    lead.counselling = { date, time, counselor, mode, interest, parentInvolvement, nextAction, course, learningMode, requirement, summary, remarks };
    this.normalizeLeadStageData(lead);
    this.stampLeadModified(lead);
    this.recordEmailNotification(
      lead,
      'Counselling scheduled - Pramukh Academy',
      `Dear ${lead.name}, your counselling is scheduled on ${date || '-'} at ${time || '-'}. Counselor: ${counselor}.`,
      remarks || 'Automatic counselling schedule email.'
    );
    this.recordTimelineAction(lead, 'Counselling Conducted', `${mode}. ${summary} Interest: ${interest}. Parent involvement: ${parentInvolvement}. Next action: ${nextAction}.`);
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
                  <label>Follow-up Stage *</label>
                  <select id="f-stage" required onchange="LeadsModule.syncFollowupStageVisibility()">
                    <option value="">Select Follow-up Stage</option>
                    ${this.getBulkStageModalOptions().map((stage) => `<option value="${stage.key}">${stage.label}</option>`).join('')}
                  </select>
                </div>
                <div class="form-field">
                  <label>Follow-up Stage Status</label>
                  <select id="f-stage-status">
                    <option value="">Select Stage Status</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Ref No.</label>
                  <input type="text" id="f-ref" placeholder="Optional reference number">
                </div>
                <div class="form-field" id="f-date-wrap">
                  <label>Follow-up Date *</label>
                  <input type="date" id="f-date" required>
                </div>
                <div class="form-field" id="f-time-wrap">
                  <label>Follow-up Time</label>
                  <input type="time" id="f-time">
                </div>
                <div class="form-field">
                  <label>Followed By</label>
                  <div class="readonly-field" id="f-followed-by">${lead.assignedTo || lead.owner || 'Unassigned'}</div>
                </div>
                <div class="form-field full">
                  <label>Purpose *</label>
                  <textarea id="f-purpose" rows="3" required placeholder="Enter purpose"></textarea>
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
    this.syncFollowupStageVisibility();
  },

  saveFollowup(leadId) {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return;

    const stageKey = document.getElementById('f-stage')?.value || '';
    const stageStatus = document.getElementById('f-stage-status')?.value || '';
    const refNo = document.getElementById('f-ref')?.value.trim() || '';
    const followupDate = document.getElementById('f-date').value;
    const followupTime = document.getElementById('f-time').value;
    const purpose = document.getElementById('f-purpose').value.trim();
    const followedBy = document.getElementById('f-followed-by')?.textContent || lead.assignedTo || lead.owner || 'Unassigned';
    const needsSchedule = !['closed', 'admission_form'].includes(stageKey);
    if (!stageKey || !purpose || (needsSchedule && !followupDate)) return;

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();

    const newComm = {
      type: 'followup',
      day: now.getDate().toString(),
      month: months[now.getMonth()],
      title: 'Follow-up Management',
      desc: `${this.formatStageLabel(stageKey)}${stageStatus ? ` - ${this.formatStageStatusLabel(stageKey, stageStatus)}` : ''}. Purpose: ${purpose}${refNo ? `. Ref No: ${refNo}` : ''}`,
      time: followupTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      by: followedBy,
      followupData: { stageKey, stageStatus, refNo, followupDate: needsSchedule ? followupDate : '', followupTime: needsSchedule ? followupTime : '', purpose, followedBy }
    };

    lead.communications.unshift(newComm);
    lead.stageKey = stageKey;
    lead.stageStatus = stageStatus === stageKey ? '' : stageStatus;
    lead.status = stageStatus || stageKey;
    lead.followupRefNo = refNo;
    lead.followupDate = needsSchedule ? followupDate : '';
    lead.followupTime = needsSchedule ? followupTime : '';
    lead.followupPurpose = purpose;
    lead.followupManagement = newComm.followupData;
    this.normalizeLeadStageData(lead);
    this.stampLeadModified(lead);
    if (stageKey === 'counselling') {
      this.recordEmailNotification(
        lead,
        'Counselling scheduled - Pramukh Academy',
        `Dear ${lead.name}, your counselling follow-up is scheduled on ${lead.followupDate || '-'}${lead.followupTime ? ` at ${lead.followupTime}` : ''}. Purpose: ${purpose}.`,
        'Automatic counselling follow-up email.'
      );
    }
    if (stageKey === 'admission_form') {
      this.recordEmailNotification(
        lead,
        'Admission form link - Pramukh Academy',
        `Dear ${lead.name}, your inquiry has moved to admission. Please complete the admission form: ams.html`,
        'Automatic admission follow-up email.'
      );
    }
    this.syncAppDataLeads();
    this.showToast('Follow-up activity recorded successfully!', 'success');
    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
  },

  submitLead(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    
    if (confirm(`Are you sure you want to convert the inquiry "${lead.name}" to admission?`)) {
      lead.stageKey = 'admission_form';
      lead.stageStatus = 'form_submission';
      lead.status = 'form_submission';
      this.normalizeLeadStageData(lead);
      this.stampLeadModified(lead);
      this.recordEmailNotification(
        lead,
        'Admission form link - Pramukh Academy',
        `Dear ${lead.name}, your inquiry has moved to admission. Please complete the admission form: ams.html`,
        'Automatic admission form link email.'
      );
      this.recordTimelineAction(lead, 'Shortlisted for Admission', 'Admission form workflow started.');
      
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast(`Inquiry ${lead.name} shortlisted for admission form.`, 'success');
    }
  },

  showChangeClassModal(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    const currentStage = this.getLeadStatusKey(lead);
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas fa-exchange-alt" style="color:var(--primary)"></i>Update Inquiry Status</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body">
          <div class="form-field">
            <label>Current Stage</label>
            <input type="text" value="${this.formatStageLabel(currentStage)}" readonly class="readonly-field">
          </div>
          <div class="form-field">
            <label>Select New Stage</label>
            <select id="c-status">
              <option value="pending" ${currentStage === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="voicecall" ${currentStage === 'voicecall' ? 'selected' : ''}>Voicecall</option>
              <option value="hot_lead" ${currentStage === 'hot_lead' ? 'selected' : ''}>Hot Lead</option>
              <option value="cold_lead" ${currentStage === 'cold_lead' ? 'selected' : ''}>Cold Lead</option>
              <option value="counselling" ${currentStage === 'counselling' ? 'selected' : ''}>Counselling</option>
              <option value="admission_form" ${currentStage === 'admission_form' ? 'selected' : ''}>Admission Form</option>
              <option value="closed" ${currentStage === 'closed' ? 'selected' : ''}>Closed</option>
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
    lead.stageKey = newStatus;
    lead.stageStatus =
      newStatus === 'voicecall' ? 'schedule' :
      newStatus === 'counselling' ? 'schedule' :
      newStatus === 'admission_form' ? 'form_submission' :
      '';
    lead.status = lead.stageStatus || newStatus;
    this.normalizeLeadStageData(lead);
    this.stampLeadModified(lead);

    this.showToast(`Stage updated to ${this.formatStageLabel(newStatus)} successfully!`, 'success');
    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
    this.updateStatusBarCounts();
    this.syncAppDataLeads();
  },

  findDuplicateLeads(leadId) {
    const sourceLead = this.leads.find((lead) => lead.id === leadId);
    if (!sourceLead) return { sourceLead: null, matches: [] };
    const comparableFields = [
      ['name', sourceLead.name],
      ['phone', sourceLead.phone],
      ['email', sourceLead.email],
      ['state', this.getLeadState(sourceLead)],
      ['district', this.getLeadDistrict(sourceLead)],
      ['course', sourceLead.course],
      ['batch', sourceLead.batch || ''],
      ['mode', sourceLead.mode || ''],
      ['academicStatus', sourceLead.academicStatus],
      ['query', sourceLead.query || '']
    ];

    const matches = this.applyRoleScope(this.leads).filter((lead) => {
      if (lead.id === leadId || lead.archived) return false;
      const matchedFields = comparableFields
        .filter(([field, value]) => String(value || '').trim() && String((field === 'state' ? this.getLeadState(lead) : field === 'district' ? this.getLeadDistrict(lead) : lead[field]) || '').trim().toLowerCase() === String(value).trim().toLowerCase())
        .map(([field]) => field);
      const qualifies =
        matchedFields.includes('phone') ||
        matchedFields.includes('email') ||
        (matchedFields.includes('name') && matchedFields.includes('course') && matchedFields.includes('state') && matchedFields.includes('district'));
      return qualifies ? { ...lead, matchedFields } : false;
    }).map((lead) => {
      const matchedFields = comparableFields
        .filter(([field, value]) => String(value || '').trim() && String((field === 'state' ? this.getLeadState(lead) : field === 'district' ? this.getLeadDistrict(lead) : lead[field]) || '').trim().toLowerCase() === String(value).trim().toLowerCase())
        .map(([field]) => field);
      return { ...lead, matchedFields };
    });

    return { sourceLead, matches };
  },

  renderDuplicateRecordCard(lead, checkboxName) {
    const stageKey = this.getLeadStatusKey(lead);
    const stageStatusLabel = this.formatStageStatusLabel(stageKey, this.getLeadSubStatusKey(lead));
    return `
      <label class="segment-selection-card duplicate-record-card">
        <input type="checkbox" name="${checkboxName}" value="${lead.id}">
        <span class="segment-selection-body">
          <span class="segment-selection-head">
            <strong>${lead.name} (${lead.enqNo})</strong>
            <span>${lead.phone}</span>
          </span>
          <span class="segment-selection-meta">Matched fields: ${lead.matchedFields.join(', ')}</span>
          <span class="segment-selection-meta">Email: ${lead.email || '-'}</span>
          <span class="segment-selection-meta">Location: ${this.getLeadDistrict(lead)}, ${this.getLeadState(lead)}</span>
          <span class="segment-selection-meta">Course: ${lead.course || '-'} | Batch: ${lead.batch || '-'} | Mode: ${lead.mode || '-'}</span>
          <span class="segment-selection-meta">Academic Status: ${lead.academicStatus || '-'} | Query: ${lead.query || '-'}</span>
          <span class="segment-selection-meta">Stage: ${this.formatStageLabel(stageKey)}${stageStatusLabel ? ` - ${stageStatusLabel}` : ''}</span>
        </span>
      </label>
    `;
  },

  showDuplicateScanModal(leadId) {
    const { sourceLead, matches } = this.findDuplicateLeads(leadId);
    if (!sourceLead) return;
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
      <div class="custom-modal-card wide">
        <div class="custom-modal-header">
          <span class="custom-modal-title"><i class="fas fa-clone" style="color:var(--primary)"></i> Duplicate Scan</span>
          <button class="custom-modal-close" onclick="this.closest('.custom-modal-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="custom-modal-body">
          <div class="form-field full" style="margin-bottom:16px">
            <label>Selected Lead</label>
            <div class="readonly-field">${sourceLead.name} | ${sourceLead.phone} | ${sourceLead.email || '-'} | ${this.getLeadDistrict(sourceLead)}, ${this.getLeadState(sourceLead)} | ${sourceLead.course}</div>
          </div>
          ${matches.length ? `
            <form id="duplicate-scan-form" data-source-id="${leadId}" onsubmit="event.preventDefault(); LeadsModule.archiveSelectedDuplicates()">
              <div class="segment-selection-list">
                ${matches.map((lead) => this.renderDuplicateRecordCard(lead, 'duplicate-lead-id')).join('')}
              </div>
              <input type="submit" id="duplicate-scan-submit" style="display:none">
            </form>
          ` : '<div class="readonly-field">No matching duplicate records found.</div>'}
        </div>
        <div class="custom-modal-footer">
          <button class="btn btn-outline btn-sm" onclick="this.closest('.custom-modal-overlay').remove()">Close</button>
          ${matches.length ? `<button class="btn btn-outline btn-sm" onclick="LeadsModule.mergeSelectedDuplicates()">Merge</button><button class="btn btn-primary btn-sm" onclick="document.getElementById('duplicate-scan-submit').click()">Archive Selected</button>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  archiveSelectedDuplicates() {
    const ids = Array.from(document.querySelectorAll('input[name="duplicate-lead-id"]:checked')).map((input) => Number(input.value)).filter(Boolean);
    if (!ids.length) return this.showToast('Select duplicate records to archive.', 'warning');
    ids.forEach((id) => {
      const lead = this.leads.find((item) => item.id === id);
      if (!lead) return;
      this.addAuditRecord(lead, 'Archived from duplicate scan');
      lead.archived = true;
      this.selectedLeads.delete(id);
    });
    document.querySelector('.custom-modal-overlay')?.remove();
    this.applyFilters();
    this.updateStatusBarCounts();
    this.syncAppDataLeads();
    this.showToast(`${ids.length} duplicate record(s) archived`, 'success');
  },

  mergeSelectedDuplicates() {
    const form = document.getElementById('duplicate-scan-form');
    const sourceId = Number(form?.dataset.sourceId);
    const sourceLead = this.leads.find((lead) => lead.id === sourceId);
    const ids = Array.from(document.querySelectorAll('input[name="duplicate-lead-id"]:checked')).map((input) => Number(input.value)).filter(Boolean);
    if (!sourceLead || !ids.length) return this.showToast('Select duplicate records to merge.', 'warning');

    ids.forEach((id) => {
      const duplicate = this.leads.find((lead) => lead.id === id);
      if (!duplicate) return;
      ['email', 'phone', 'whatsapp', 'state', 'district', 'city', 'academicStatus', 'course', 'batch', 'mode', 'query'].forEach((field) => {
        if (!sourceLead[field] && duplicate[field]) sourceLead[field] = duplicate[field];
      });
      sourceLead.communications = [...(sourceLead.communications || []), ...(duplicate.communications || [])];
      this.addAuditRecord(duplicate, `Merged into ${sourceLead.enqNo}`);
      duplicate.archived = true;
      this.selectedLeads.delete(id);
    });
    this.recordTimelineAction(sourceLead, 'Duplicate Records Merged', `${ids.length} duplicate record(s) merged into this inquiry.`);
    document.querySelector('.custom-modal-overlay')?.remove();
    this.normalizeInquiryLeadData();
    this.applyFilters();
    this.updateStatusBarCounts();
    this.showToast(`${ids.length} duplicate record(s) merged`, 'success');
  },

  archiveLead(id) {
    if (!this.can('inquiryList', 'delete')) {
      this.showToast('Archive is Admin-only.', 'warning');
      return;
    }
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    
    if (confirm(`Are you sure you want to archive the lead "${lead.name}"? The lead will disappear from the lists.`)) {
      this.addAuditRecord(lead, 'Archived inquiry');
      lead.archived = true;
      this.selectedLeads.delete(id);
      this.applyFilters();
      this.updateStatusBarCounts();
      this.showToast(`Lead ${lead.name} archived successfully!`, 'warning');
    }
  },

  showInquiryFunnel(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;
    const existing = document.getElementById('followup-history-overlay');
    if (existing) existing.remove();

    const entries = [
      {
        type: 'created',
        title: 'Inquiry Created',
        desc: `${lead.course || 'General Inquiry'} inquiry submitted. Query: ${lead.query || '-'}`,
        by: lead.owner || lead.assignedTo || 'System',
        at: lead.inquiryDate || '-'
      },
      ...(lead.communications || []).map((item) => ({
        type: item.type || 'note',
        title: item.title,
        desc: item.desc,
        by: item.by || lead.assignedTo || 'System',
        at: `${item.day || ''} ${item.month || ''} ${item.time || ''}`.trim(),
        remarks: item.remarks || item.emailRemarks || item.whatsappRemarks || item.callRemarks || '',
        payload: item.payload || item.followupData || null
      }))
    ];

    const iconMap = {
      created: 'fa-flag',
      email: 'fa-envelope',
      whatsapp: 'fa-message',
      call: 'fa-phone',
      followup: 'fa-calendar-check',
      note: 'fa-clipboard-list'
    };

    const timelineHTML = entries.map((entry) => `
      <div class="timeline-item">
        <div class="timeline-dot tl-note"><i class="fas ${iconMap[entry.type] || 'fa-clipboard-list'}"></i></div>
        <div class="timeline-content">
          <div class="timeline-date">${entry.at || '-'}</div>
          <div class="timeline-title">${entry.title || 'Activity'}</div>
          <div class="timeline-desc">${entry.desc || '-'}</div>
          ${entry.payload ? `<div class="timeline-desc">Details: ${Object.entries(entry.payload).map(([key, value]) => `${key}: ${value || '-'}`).join('; ')}</div>` : ''}
          ${entry.remarks ? `<div class="timeline-desc">Remarks: ${entry.remarks}</div>` : ''}
          <div class="timeline-by">Handled by ${entry.by || 'System'}</div>
        </div>
      </div>
    `).join('');

    const overlay = document.createElement('div');
    overlay.id = 'followup-history-overlay';
    overlay.className = 'followup-history-panel';
    overlay.innerHTML = `
      <div class="followup-panel-content inquiry-funnel-panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">Inquiry Funnel - ${lead.name}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${lead.enqNo} | ${this.formatStageLabel(this.getLeadStatusKey(lead))} | ${lead.assignedTo || lead.owner || 'Unassigned'}</div>
          </div>
          <button class="panel-close" onclick="document.getElementById('followup-history-overlay').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="panel-body">
          <div class="lead-detail-grid" style="grid-template-columns:1fr;margin-bottom:14px">
            <div class="lead-detail-col" style="border-right:0">
              <div class="detail-row"><span class="detail-label">Handled By</span><span class="detail-value">${lead.assignedTo || lead.owner || 'Unassigned'}</span></div>
              <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${lead.email || '-'}</span></div>
              <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${lead.phone || '-'}</span></div>
              <div class="detail-row"><span class="detail-label">WhatsApp</span><span class="detail-value">${lead.whatsapp || lead.phone || '-'}</span></div>
            </div>
          </div>
          <div class="timeline">${timelineHTML}</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  showFollowupHistory(id) {
    return this.showInquiryFunnel(id);
  },

  showLegacyFollowupHistory(id) {
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

  makeIconOnlyButton(button, label) {
    if (!button) return;
    const icon = button.querySelector('i');
    button.classList.add('icon-only');
    button.title = label;
    button.setAttribute('aria-label', label);
    button.innerHTML = '';
    if (icon) button.appendChild(icon);
  },

  normalizeToolbarButtons() {
    const toolbarLabels = {
      'select-all-leads': 'Select All On Page',
      'filter-toggle-btn': 'Filters',
      'refresh-btn': 'Refresh',
      'add-lead-btn': 'Add New Inquiry',
      'import-leads-btn': 'Mass Import',
      'export-leads-btn': 'Export',
      'download-leads-btn': 'Download',
      'email-all-btn': 'Email All',
      'sort-toggle-btn': 'Sort Leads',
      'saved-filter-btn': 'Saved Filters',
      'view-toggle-btn': 'Calendar View',
      'collapse-toggle-btn': 'Expand All'
    };
    Object.entries(toolbarLabels).forEach(([id, label]) => {
      this.makeIconOnlyButton(document.getElementById(id), label);
    });
  },

  normalizeBulkToolbar() {
    const actionLabels = {
      email: 'Email',
      stages: 'Stages',
      status: 'Stages',
      segment: 'Segment',
      export: 'Export Selected',
      archive: 'Archive'
    };

    document.querySelectorAll('#batch-actions-wrap button').forEach((btn) => {
      const action = btn.getAttribute('onclick')?.match(/batchAction\('([^']+)'\)/)?.[1];
      if (!action || action === 'whatsapp' || action === 'assign') {
        btn.remove();
        return;
      }
      btn.dataset.batchAction = action;
      this.makeIconOnlyButton(btn, actionLabels[action] || action);
    });
  },

  setupToolbar() {
    // Remove “Mass Admission” button if present
    document.getElementById('mass-admit-btn')?.remove();
    document.querySelectorAll('button, .toolbar-btn').forEach((btn) => {
      if (btn.textContent && btn.textContent.trim().toLowerCase() === 'mass admission') btn.remove();
    });

    this.normalizeToolbarButtons();
    this.normalizeBulkToolbar();
    this.updateSortButtonLabel();
    this.updateViewToggleButton();


    const viewToggleBtn = document.getElementById('view-toggle-btn');
    viewToggleBtn?.addEventListener('click', () => {
      this.toggleViewMode(this.viewMode === 'row' ? 'calendar' : 'row');
    });

    // Collapse/Expand toggle
    const toggleBtn = document.getElementById('collapse-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.viewMode === 'calendar') return;
        this.allExpanded = !this.allExpanded;
        toggleBtn.innerHTML = this.allExpanded
          ? '<i class="fas fa-compress-alt"></i>'
          : '<i class="fas fa-expand-alt"></i>';
        this.makeIconOnlyButton(toggleBtn, this.allExpanded ? 'Collapse All' : 'Expand All');
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
    this.applyToolbarPermissions();
  },

  applyToolbarPermissions() {
    const setVisible = (id, visible) => {
      const el = document.getElementById(id);
      if (el) el.style.display = visible ? '' : 'none';
    };
    setVisible('import-leads-btn', this.can('inquiryList', 'import'));
    document.querySelectorAll('#batch-actions-wrap button').forEach(btn => {
      const action = btn.dataset.batchAction || '';
      const allowed =
        action === 'segment' ? this.can('inquiryList', 'assign') :
        action === 'archive' ? this.can('inquiryList', 'delete') :
        (action === 'status' || action === 'stages') ? this.can('inquiryList', 'status') :
        true;
      btn.style.display = allowed ? '' : 'none';
    });
  },

  updateViewToggleButton() {
    const button = document.getElementById('view-toggle-btn');
    if (!button) return;
    const targetMode = this.viewMode === 'row' ? 'calendar' : 'row';
    const icon = targetMode === 'calendar' ? 'fa-calendar-alt' : 'fa-list';
    const label = targetMode === 'calendar' ? 'Calendar View' : 'Row View';
    this.makeIconOnlyButton(button, label);
    button.innerHTML = `<i class="fas ${icon}"></i>`;
  },

  toggleViewMode(mode) {
    const leadList = document.getElementById('lead-list');
    const calendarView = document.getElementById('lead-calendar-view');
    const pagination = document.querySelector('.leads-pagination');
    const collapseBtn = document.getElementById('collapse-toggle-btn');

    this.viewMode = mode;
    this.updateViewToggleButton();

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
