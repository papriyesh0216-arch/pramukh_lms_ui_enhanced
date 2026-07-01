// ============================================================
// APP.JS — Router, Navigation, Screen Switching
// ============================================================

const App = {
  currentScreen: 'dashboard',
  expandedLeads: new Set(),
  allExpanded: false,
  mobileScrollTicking: false,
  mobileSectionsByScreen: {
    dashboard: [
      { id: 'dashboard-overview', label: 'Overview', icon: 'fa-house' },
      { id: 'dashboard-journey', label: 'Journey', icon: 'fa-route' },
      { id: 'kpi-row', label: 'KPIs', icon: 'fa-chart-simple' },
      { id: 'dashboard-insights', label: 'Insights', icon: 'fa-chart-pie' },
      { id: 'dashboard-support', label: 'Support', icon: 'fa-life-ring' }
    ],
    segmentation: [
      { id: 'segmentation-summary', label: 'Summary', icon: 'fa-table-list', tab: 'segments' },
      { id: 'segmentation-build', label: 'Build', icon: 'fa-pen-ruler', tab: 'segments' },
      { id: 'segmentation-library', label: 'Library', icon: 'fa-layer-group', tab: 'segments' },
      { id: 'segmentation-assign', label: 'Assign', icon: 'fa-user-check', tab: 'assignments' },
      { id: 'segmentation-roadmap', label: 'Roadmap', icon: 'fa-road', tab: 'future' }
    ]
  },

  init() {
    this.setupNavigation();
    this.setupTopbar();
    this.setupResponsiveShell();
    this.setupMobileSectionTracking();
    this.setupGlobalButtons();
    this.showScreen('dashboard');
    // Render all screens
    DashboardModule.init();
    LeadsModule.init();
    SegmentationModule.init();
    CalendarModule.init();
    DrawerModule.init();
    DialerModule.init();
  },

  setupNavigation() {
    // Nav group toggles
    document.querySelectorAll('.nav-subitem[data-submenu]').forEach(item => {
      item.addEventListener('click', (e) => {
        const submenuId = item.dataset.submenu;
        const submenu = document.getElementById(submenuId);
        if (!submenu) return;
        const isOpen = submenu.classList.contains('open');
        // Close all
        document.querySelectorAll('.nav-submenu.open').forEach(m => m.classList.remove('open'));
        document.querySelectorAll('.nav-subitem.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) {
          submenu.classList.add('open');
          item.classList.add('open');
        }
      });
    });

    // Screen nav items
    document.querySelectorAll('[data-screen]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const screen = el.dataset.screen;
        this.showScreen(screen);
      });
    });
  },

  setupTopbar() {
    // Theme toggle: read preference and attach handler
    try {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      const saved = localStorage.getItem('pa-theme');
      const isDark = saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.body.classList.toggle('dark', isDark);
      if (themeIcon) themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          const nowDark = !document.body.classList.contains('dark');
          document.body.classList.toggle('dark', nowDark);
          document.body.classList.remove('theme-fade');
          void document.body.offsetWidth;
          document.body.classList.add('theme-fade');
          window.setTimeout(() => document.body.classList.remove('theme-fade'), 360);
          if (themeIcon) themeIcon.className = nowDark ? 'fas fa-moon' : 'fas fa-sun';
          try { localStorage.setItem('pa-theme', nowDark ? 'dark' : 'light'); } catch (e) {}
          try { DashboardModule.refreshTheme?.(); } catch (e) {}
        });
      }
    } catch (e) {
      // ignore
    }
  },

  setupResponsiveShell() {
    const topbar = document.querySelector('.topbar');
    const sidebar = document.querySelector('.sidebar');
    if (!topbar || !sidebar || document.getElementById('mobile-menu-btn')) return;

    const menuBtn = document.createElement('button');
    menuBtn.id = 'mobile-menu-btn';
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.type = 'button';
    menuBtn.setAttribute('aria-label', 'Open navigation');
    menuBtn.innerHTML = '<i class="fas fa-bars"></i>';

    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-nav-backdrop';

    topbar.insertBefore(menuBtn, topbar.firstChild);
    document.body.appendChild(backdrop);

    this.closeResponsiveMenu = () => {
      document.body.classList.remove('mobile-nav-open');
      menuBtn.setAttribute('aria-label', 'Open navigation');
      menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    };
    const toggleMenu = () => {
      const isOpen = document.body.classList.toggle('mobile-nav-open');
      menuBtn.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      menuBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    };

    menuBtn.addEventListener('click', toggleMenu);
    backdrop.addEventListener('click', this.closeResponsiveMenu);
    sidebar.addEventListener('click', (event) => {
      if (event.target.closest('[data-screen], .nav-sub-subitem:not([data-submenu])')) this.closeResponsiveMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) this.closeResponsiveMenu();
    });
  },

  setupMobileSectionTracking() {
    document.querySelectorAll('.content-area').forEach(area => {
      area.addEventListener('scroll', () => {
        if (window.innerWidth > 720 || this.mobileScrollTicking) return;
        this.mobileScrollTicking = true;
        window.requestAnimationFrame(() => {
          this.mobileScrollTicking = false;
          this.syncMobileSectionHighlight();
        });
      }, { passive: true });
    });
  },

  renderMobileBottomNav() {
    const nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;
    const sections = this.mobileSectionsByScreen[this.currentScreen] || [];
    const screenLabels = {
      leads: { label: 'Inquiry List', icon: 'fa-users' },
      calendar: { label: 'Calendar', icon: 'fa-calendar-days' }
    };

    let items = [];
    if (sections.length) {
      items = sections.map(section => `
        <button class="mobile-bottom-nav__item" type="button" data-mobile-segment="${section.id}">
          <i class="fas ${section.icon}"></i>
          <span>${section.label}</span>
        </button>
      `);
    } else {
      const current = screenLabels[this.currentScreen] || { label: 'Module', icon: 'fa-table-columns' };
      items = [
        `<div class="mobile-bottom-nav__item mobile-bottom-nav__item--current active" data-mobile-current="${this.currentScreen}">
          <i class="fas ${current.icon}"></i>
          <span>${current.label}</span>
        </div>`
      ];
    }

    items.push(`
      <button class="mobile-bottom-nav__item mobile-bottom-nav__item--menu" type="button" data-mobile-action="menu">
        <i class="fas fa-bars-staggered"></i>
        <span>Menu</span>
      </button>
    `);

    nav.classList.toggle('mobile-bottom-nav--compact', !sections.length);
    nav.innerHTML = items.join('');

    nav.querySelectorAll('[data-mobile-action="menu"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const isOpen = document.body.classList.contains('mobile-nav-open');
        if (isOpen) {
          this.closeResponsiveMenu?.();
        } else {
          document.getElementById('mobile-menu-btn')?.click();
        }
      });
    });

    nav.querySelectorAll('[data-mobile-segment]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sectionId = btn.dataset.mobileSegment;
        this.goToMobileSection(sectionId);
      });
    });

    this.syncMobileSectionHighlight();
  },

  goToMobileSection(sectionId) {
    const section = this.getMobileSection(sectionId);
    if (!section) return;
    const config = (this.mobileSectionsByScreen[this.currentScreen] || []).find(item => item.id === sectionId);
    if (config?.tab) {
      SegmentationModule.switchTab?.(config.tab);
    }
    window.setTimeout(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.setActiveMobileSection(sectionId);
    }, config?.tab ? 40 : 0);
  },

  getMobileSection(sectionId) {
    return document.getElementById(sectionId);
  },

  setActiveMobileSection(sectionId) {
    document.querySelectorAll('.mobile-bottom-nav__item[data-mobile-segment]').forEach(item => {
      item.classList.toggle('active', item.dataset.mobileSegment === sectionId);
    });
  },

  syncMobileSectionHighlight() {
    const sections = this.mobileSectionsByScreen[this.currentScreen] || [];
    if (!sections.length || window.innerWidth > 720) return;
    const activeScreen = document.getElementById(`screen-${this.currentScreen}`);
    if (!activeScreen) return;
    const container = activeScreen.querySelector('.content-area') || activeScreen;
    const containerRect = container.getBoundingClientRect();
    const anchor = containerRect.top + 130;
    let activeId = sections[0].id;

    sections.forEach(section => {
      const node = this.getMobileSection(section.id);
      if (!node || node.offsetParent === null) return;
      const rect = node.getBoundingClientRect();
      if (rect.top <= anchor) {
        activeId = section.id;
      }
    });

    this.setActiveMobileSection(activeId);
  },

  syncActiveNavigation(name) {
    document.querySelectorAll('[data-screen]').forEach(item => {
      item.classList.toggle('active', item.dataset.screen === name);
    });

    const inquiryParent = document.querySelector('.nav-subitem[data-submenu="submenu-inquiry-lead"]');
    const inquirySubmenu = document.getElementById('submenu-inquiry-lead');
    const isInquiryScreen = name === 'leads' || name === 'segmentation';
    if (inquiryParent) {
      inquiryParent.classList.toggle('active', isInquiryScreen);
      inquiryParent.classList.toggle('open', isInquiryScreen);
    }
    if (inquirySubmenu) {
      inquirySubmenu.classList.toggle('open', isInquiryScreen);
    }
  },

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`screen-${name}`);
    if (screen) screen.classList.add('active');
    this.currentScreen = name;
    this.syncActiveNavigation(name);
    this.renderMobileBottomNav();
    this.closeResponsiveMenu?.();
    // Update page title in topbar
    const titles = {
      dashboard: 'Student Inquiry Dashboard',
      leads: 'Inquiry List',
      calendar: 'Follow-Up Calendar',
      segmentation: 'Assignment & Segmentation'
    };
    const titleEl = document.getElementById('page-section-title');
    if (titleEl) titleEl.textContent = titles[name] || '';
  },

  goToCalendar() {
    this.showScreen('calendar');
    document.getElementById('day-popup-overlay')?.remove();
    try { CalendarModule.renderCalendar?.(); } catch (e) {}
  },

  setupGlobalButtons() {
    document.getElementById('dashboard-filter-btn')?.addEventListener('click', () => {
      this.showScreen('leads');
      document.getElementById('leads-filter-panel').style.display = 'flex';
      document.getElementById('filter-toggle-btn')?.classList.add('active');
    });
    document.getElementById('dashboard-add-lead-btn')?.addEventListener('click', () => {
      this.showScreen('leads');
      LeadsModule.showAddEditModal();
    });
    document.getElementById('dashboard-qa-add')?.addEventListener('click', () => {
      this.showScreen('leads');
      LeadsModule.showAddEditModal();
    });
    document.getElementById('dashboard-qa-list')?.addEventListener('click', () => this.showScreen('leads'));
    document.getElementById('dashboard-qa-assign')?.addEventListener('click', () => this.showScreen('segmentation'));
    document.getElementById('dashboard-qa-followup')?.addEventListener('click', () => {
      this.showScreen('leads');
      const lead = LeadsModule.filteredLeads?.[0] || LeadsModule.leads?.[0];
      if (lead) LeadsModule.showManageFollowup(lead.id);
    });
    document.getElementById('dashboard-qa-counselling')?.addEventListener('click', () => {
      this.showScreen('leads');
      const lead = LeadsModule.filteredLeads?.[0] || LeadsModule.leads?.[0];
      if (lead) LeadsModule.showCounsellingModal(lead.id);
    });
    document.getElementById('dashboard-print-btn')?.addEventListener('click', () => window.print());
    document.getElementById('dashboard-report-pdf')?.addEventListener('click', () => this.exportDashboardReport('pdf'));
    document.getElementById('dashboard-report-excel')?.addEventListener('click', () => this.exportDashboardReport('excel'));
    document.getElementById('dashboard-report-csv')?.addEventListener('click', () => this.exportDashboardReport('csv'));
    document.getElementById('counselor-download-btn')?.addEventListener('click', () => this.exportCounselorReport());
    document.getElementById('tasks-view-all-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.goToCalendar();
    });
    document.getElementById('notification-btn')?.addEventListener('click', () => {
      this.goToCalendar();
      LeadsModule.showToast('Showing follow-up notifications in calendar', 'info');
    });
  },

  exportDashboardReport(format = 'csv') {
    if (format === 'pdf') {
      window.print();
      LeadsModule.showToast('Print dialog opened for PDF export', 'info');
      return;
    }
    const rows = Array.from(document.querySelectorAll('#dashboard-report-grid .seg-report-card, #dashboard-report-grid .report-tile')).map(card => {
      const title = card.querySelector('.report-title, .seg-report-label')?.textContent?.trim() || '';
      const value = card.querySelector('.report-value, .seg-report-value')?.textContent?.trim() || '';
      const meta = card.querySelector('.report-meta, .seg-report-meta')?.textContent?.trim() || '';
      return { title, value, meta };
    });
    const csv = ['Report,Value,Details'].concat(rows.map(r => [r.title, r.value, r.meta].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))).join('\n');
    LeadsModule.downloadTextFile(`dashboard-report.${format === 'excel' ? 'xls' : 'csv'}`, csv, 'text/csv');
    LeadsModule.showToast(`Dashboard ${format.toUpperCase()} export prepared`, 'success');
  },

  exportCounselorReport() {
    const rows = window.APP_DATA.COUNSELOR_DATA || [];
    const csv = ['Counselor,Assigned,Contacted,Interested,Admissions,Conversion'].concat(rows.map(c => [
      c.name, c.assigned, c.contacted, c.interested, c.admissions, `${c.rate}%`
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))).join('\n');
    LeadsModule.downloadTextFile('counselor-performance.csv', csv, 'text/csv');
    LeadsModule.showToast('Counselor report downloaded', 'success');
  }
};

const SegmentationModule = {
  segments: [],
  counselors: [],
  activeTab: 'segments',
  selectedSegmentId: null,

  init() {
    this.segments = window.APP_DATA.SEGMENT_DATA.map(s => ({ ...s, assignedTo: s.assignedTo || 'Unassigned' }));
    this.counselors = window.APP_DATA.COUNSELOR_DATA.map(c => ({ ...c }));
    this.selectedSegmentId = this.segments.filter(s => !s.archived).length ? this.segments.filter(s => !s.archived)[0].id : null;
    this.segmentType = 'static';
    this.groupType = 'counselors';
    this.draggedSegmentId = null;

    this.segmentForm = document.getElementById('segment-form');
    this.segmentNameInput = document.getElementById('segment-name');
    this.segmentCriteriaInput = document.getElementById('segment-criteria');
    this.segmentGeneratedInquiry = document.getElementById('segment-generated-inquiry');
    this.segmentSource = document.getElementById('segment-source');
    this.segmentCourse = document.getElementById('segment-course');
    this.segmentMode = document.getElementById('segment-mode');
    this.segmentDate = document.getElementById('segment-date');
    this.segmentAcademicStatus = document.getElementById('segment-academic-status');
    this.segmentCity = document.getElementById('segment-city');
    this.segmentPincode = document.getElementById('segment-pincode');
    this.segmentStatus = document.getElementById('segment-status');
    this.segmentLeadAge = document.getElementById('segment-lead-age');
    this.segmentAssignedCounselor = document.getElementById('segment-assigned-counselor');
    this.segmentOwner = document.getElementById('segment-owner');
    this.segmentTypeSummary = document.getElementById('segment-type-summary');
    this.segmentListCount = document.getElementById('segment-list-count');
    this.segmentListContainer = document.getElementById('segment-list');
    this.segmentArchiveListContainer = document.getElementById('segment-archive-list');
    this.segmentSummaryCount = document.getElementById('summary-segment-count');
    this.counselorSummaryCount = document.getElementById('summary-counselor-count');
    this.unassignedSummaryCount = document.getElementById('summary-unassigned-count');
    this.workloadSummaryCount = document.getElementById('summary-workload-count');
    this.segmentReportGrid = document.getElementById('segment-report-grid');
    this.assignmentSummaryGrid = document.getElementById('assignment-summary-grid');
    this.futureEnhancementGrid = document.getElementById('future-enhancement-grid');
    this.assignmentUserList = document.getElementById('assignment-user-list');
    this.assignmentSegmentQueue = document.getElementById('assignment-segment-queue');
    this.toastContainer = document.getElementById('toast-container');
    this.formStatus = document.getElementById('segment-form-status');
    this.segmentActiveGrid = this.segmentListContainer;
    this.segmentArchiveGrid = this.segmentArchiveListContainer;

    this.userGroups = {
      counselors: this.counselors.map(c => ({ name: c.name, role: 'Counselor', initials: c.initials, color: c.color })),
      admission: [
        { name: 'Admission Lead', role: 'Admission Team', initials: 'AL', color: '#0EA5E9' },
        { name: 'Campus Intake', role: 'Admission Team', initials: 'CI', color: '#06B6D4' },
        { name: 'Lead Support', role: 'Admission Team', initials: 'LS', color: '#7C3AED' }
      ],
      tally: [
        { name: 'Tally Caller 1', role: 'Tally Caller', initials: 'TC', color: '#F59E0B' },
        { name: 'Tally Caller 2', role: 'Tally Caller', initials: 'TC', color: '#F97316' }
      ],
      staff: [
        { name: 'Office Admin', role: 'Staff', initials: 'OA', color: '#10B981' },
        { name: 'Operations', role: 'Staff', initials: 'OP', color: '#14B8A6' }
      ]
    };

    this.setupForm();
    this.renderSummaryCards();
    this.renderSegmentReports();
    this.renderAssignmentReports();
    this.renderFutureEnhancements();
    this.renderSegmentList();
    this.bindArchiveDrop();
    this.renderAssignmentUsers();
    this.renderAssignmentQueue();
    this.switchTab('segments');
    this.setSegmentType('static');
  },

  setupForm() {
    if (!this.segmentForm) return;
    this.segmentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createSegment();
    });
  },

  setSegmentType(type) {
    this.segmentType = type;
    document.querySelectorAll('.segment-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    const staticFields = document.querySelectorAll('.segment-static-fields');
    const dynamicFields = document.querySelectorAll('.segment-dynamic-fields');
    staticFields.forEach(el => el.style.display = type === 'static' ? '' : 'none');
    dynamicFields.forEach(el => el.style.display = type === 'dynamic' ? '' : 'none');

    if (this.segmentTypeSummary) {
      this.segmentTypeSummary.textContent = type === 'static'
        ? 'Static segments capture a fixed group of leads defined by manual criteria.'
        : 'Dynamic segments update automatically based on selected property values.';
    }
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.seg-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    document.querySelectorAll('.segmentation-panel-body').forEach(panel => panel.classList.toggle('active', panel.id === `segmentation-panel-${tab}`));
    window.setTimeout(() => App.syncMobileSectionHighlight?.(), 30);
  },


  createSegment() {
    if (!this.segmentNameInput || !this.segmentCriteriaInput) return;
    const name = this.segmentNameInput.value.trim();
    const baseCriteria = this.segmentCriteriaInput.value.trim();

    if (!name || !baseCriteria) {
      this.showFormStatus('Please provide a segment name and criteria.', true);
      return;
    }

    let criteria = baseCriteria;
    let description = `Segment created for ${name}.`;
    let dynamicRule = null;

    if (this.segmentType === 'dynamic') {
      const ruleParts = [];
      const source = this.segmentSource.value;
      const course = this.segmentCourse.value;
      const mode = this.segmentMode.value;
      const date = this.segmentDate.value;
      const academicStatus = this.segmentAcademicStatus.value;
      const city = this.segmentCity.value.trim();
      const pincode = this.segmentPincode.value.trim();
      const status = this.segmentStatus.value;
      const leadAge = this.segmentLeadAge.value;
      const assignedCounselor = this.segmentAssignedCounselor.value;
      const owner = this.segmentOwner.value;

      if (source) ruleParts.push(`Source = ${source}`);
      if (course) ruleParts.push(`Course = ${course}`);
      if (mode) ruleParts.push(`Mode = ${mode}`);
      if (date) ruleParts.push(`Date = ${date}`);
      if (academicStatus) ruleParts.push(`Academic status = ${academicStatus}`);
      if (city) ruleParts.push(`City = ${city}`);
      if (pincode) ruleParts.push(`Pincode = ${pincode}`);
      if (status) ruleParts.push(`Status = ${status}`);
      if (leadAge) ruleParts.push(`Lead age = ${leadAge}`);
      if (assignedCounselor) ruleParts.push(`Assigned counselor = ${assignedCounselor}`);
      if (owner) ruleParts.push(`Lead owner = ${owner}`);

      if (!ruleParts.length) {
        this.showFormStatus('Please select at least one dynamic rule.', true);
        return;
      }

      dynamicRule = { source, course, mode, date, academicStatus, city, pincode, status, leadAge, assignedCounselor, owner };
      criteria = `${baseCriteria} • ${ruleParts.join(' • ')}`;
      description = `Dynamic segment based on ${ruleParts.join(', ')}.`;
    }

    const leadIds = this.matchLeadsByCriteria(criteria);
    const newSegment = {
      id: Date.now(),
      name,
      description,
      criteria,
      assignedUsers: [],
      leadIds,
      type: this.segmentType,
      dynamicRule,
      createdAt: this.formatDate(new Date()),
      archived: false
    };

    this.segments.unshift(newSegment);
    this.selectedSegmentId = newSegment.id;
    this.segmentNameInput.value = '';
    this.segmentCriteriaInput.value = '';
    if (this.segmentType === 'static') {
      this.segmentGeneratedInquiry.value = 'today';
    } else {
      this.segmentSource.value = 'Instagram Ad';
      this.segmentCourse.value = 'UPSC Foundation';
      this.segmentMode.value = 'Classroom';
      this.segmentDate.value = '';
      this.segmentAcademicStatus.value = 'Graduation Running';
      this.segmentCity.value = '';
      this.segmentPincode.value = '';
      this.segmentStatus.value = '';
      this.segmentLeadAge.value = '';
      this.segmentAssignedCounselor.value = '';
      this.segmentOwner.value = '';
    }

    this.renderSegmentList();
    this.renderAssignmentQueue();
    this.renderSummaryCards();
    this.showFormStatus('Segment created successfully.', false);
    this.switchTab('assignments');
  },

  exportSegments() {
    const rows = this.segments || [];
    const csv = ['Name,Type,Criteria,Leads,Assigned,Archived'].concat(rows.map(segment => [
      segment.name,
      segment.type || 'static',
      segment.criteria,
      segment.leadIds?.length || 0,
      segment.assignedUsers?.join('; ') || 'Unassigned',
      segment.archived ? 'Yes' : 'No'
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))).join('\n');
    LeadsModule.downloadTextFile('segments-export.csv', csv, 'text/csv');
    this.showToast('Segments exported successfully.');
  },

  editSelectedSegment() {
    const segment = this.segments.find(s => s.id === this.selectedSegmentId) || this.segments.find(s => !s.archived);
    if (!segment) return this.showFormStatus('No segment selected to edit.', true);
    this.selectedSegmentId = segment.id;
    this.segmentNameInput.value = segment.name;
    this.segmentCriteriaInput.value = segment.criteria;
    this.setSegmentType(segment.type || 'static');
    this.showFormStatus('Segment loaded into the form. Save to create an updated segment.', false);
  },

  duplicateSelectedSegment() {
    const segment = this.segments.find(s => s.id === this.selectedSegmentId) || this.segments.find(s => !s.archived);
    if (!segment) return this.showFormStatus('No segment selected to duplicate.', true);
    const copy = { ...segment, id: Date.now(), name: `${segment.name} Copy`, createdAt: this.formatDate(new Date()), archived: false };
    this.segments.unshift(copy);
    this.selectedSegmentId = copy.id;
    this.renderSegmentList();
    this.renderAssignmentQueue();
    this.showToast(`${copy.name} created.`);
  },

  archiveSelectedSegment() {
    const segment = this.segments.find(s => s.id === this.selectedSegmentId) || this.segments.find(s => !s.archived);
    if (!segment) return this.showFormStatus('No segment selected to archive.', true);
    this.toggleArchive(segment.id);
  },

  matchLeadsByCriteria(criteria) {
    const query = criteria.toLowerCase();
    const orParts = query.split(/\bor\b/i).map(item => item.trim()).filter(Boolean);
    const conditions = orParts.flatMap(segment => segment.split(/•|\band\b/i).map(item => item.trim()).filter(Boolean));
    const normalize = (item) => item.replace(/course\s*=\s*|source\s*=\s*|city\s*=\s*|pincode\s*=\s*|mode\s*=\s*|date\s*=\s*|academic status\s*=\s*|status\s*=\s*|lead age\s*=\s*|assigned counselor\s*=\s*|lead owner\s*=\s*|contains\s*/g, '').trim();
    const normalizedConditions = conditions.map(normalize).filter(Boolean);
    const useOr = /\bor\b/i.test(query);

    return window.APP_DATA.LEAD_DATA.filter(lead => {
      const haystack = `${lead.name} ${lead.course} ${lead.source} ${lead.city} ${lead.pincode || ''} ${lead.mode} ${lead.academicStatus} ${lead.status} ${lead.statusLabel} ${lead.leadAge} ${lead.assignedTo} ${lead.owner} ${lead.ownerTeam}`.toLowerCase();
      if (useOr) {
        return normalizedConditions.some(cond => haystack.includes(cond));
      }
      return normalizedConditions.every(cond => haystack.includes(cond));
    }).map(lead => lead.id);
  },

  renderSummaryCards() {
    if (this.segmentSummaryCount) this.segmentSummaryCount.textContent = this.segments.length;
    if (this.counselorSummaryCount) this.counselorSummaryCount.textContent = this.counselors.length;
    const leads = window.APP_DATA.LEAD_DATA || [];
    const unassigned = leads.filter(lead => !lead.assignedTo || lead.assignedTo === 'Unassigned').length;
    const avg = this.counselors.length ? Math.round(leads.length / this.counselors.length) : 0;
    if (this.unassignedSummaryCount) this.unassignedSummaryCount.textContent = unassigned;
    if (this.workloadSummaryCount) this.workloadSummaryCount.textContent = avg;
  },

  renderSegmentReports() {
    if (!this.segmentReportGrid) return;
    const active = this.segments.filter(segment => !segment.archived);
    const unassigned = active.filter(segment => !segment.assignedUsers?.length).length;
    const totalInquiryCount = active.reduce((sum, segment) => sum + (segment.leadIds?.length || 0), 0);
    const topSegment = [...active].sort((a, b) => (b.leadIds?.length || 0) - (a.leadIds?.length || 0))[0];
    const cards = [
      { label: 'Active Segments', value: active.length, meta: 'Reusable business groups' },
      { label: 'Inquiry Count by Segment', value: totalInquiryCount, meta: 'Membership across active segments' },
      { label: 'Unassigned Segments', value: unassigned, meta: 'Needs assignment' },
      { label: 'Top Segment', value: topSegment?.name || '-', meta: topSegment ? `${topSegment.leadIds.length} inquiries` : 'No active segment' }
    ];
    this.segmentReportGrid.innerHTML = cards.map(card => `
      <div class="seg-report-card">
        <div class="seg-report-label">${card.label}</div>
        <div class="seg-report-value">${card.value}</div>
        <div class="seg-report-meta">${card.meta}</div>
      </div>
    `).join('');
  },

  renderAssignmentReports() {
    if (!this.assignmentSummaryGrid) return;
    const leads = window.APP_DATA.LEAD_DATA || [];
    const assigned = leads.filter(lead => lead.assignedTo && lead.assignedTo !== 'Unassigned').length;
    const unassigned = leads.length - assigned;
    const reassigned = leads.filter(lead => lead.communications?.some(item => /assignment/i.test(item.title || ''))).length;
    const workload = this.counselors.map(counselor => leads.filter(lead => (lead.assignedTo || lead.owner) === counselor.name).length);
    const avg = workload.length ? Math.round(workload.reduce((sum, count) => sum + count, 0) / workload.length) : 0;
    const cards = [
      { label: 'Assigned Leads', value: assigned, meta: 'Current owner present' },
      { label: 'Unassigned Leads', value: unassigned, meta: 'Needs manual assignment' },
      { label: 'Reassigned Leads', value: reassigned, meta: 'Ownership changed' },
      { label: 'Average Leads / Counselor', value: avg, meta: 'Workload distribution' }
    ];
    this.assignmentSummaryGrid.innerHTML = cards.map(card => `
      <div class="seg-report-card">
        <div class="seg-report-label">${card.label}</div>
        <div class="seg-report-value">${card.value}</div>
        <div class="seg-report-meta">${card.meta}</div>
      </div>
    `).join('') + `
      <div class="assignment-history-panel">
        <div class="panel-heading">
          <h2>Assignment History</h2>
          <span class="panel-subtitle">Presentation record of ownership changes</span>
        </div>
        <div class="assignment-history-list">
          ${leads.slice(0, 4).map((lead, index) => `
            <div class="assignment-history-row">
              <span>${lead.enqNo}</span>
              <strong>${lead.assignedTo || lead.owner || 'Unassigned'}</strong>
              <span>Assigned By: ${index % 2 ? 'Lead Management Head' : 'Bharat Sir'}</span>
              <span>${lead.assignedDate || lead.inquiryDate || 'Today'}</span>
              <span>${index % 2 ? 'Reassignment' : 'Manual'}</span>
              <span>Current Owner: ${lead.owner || lead.assignedTo || '-'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderFutureEnhancements() {
    if (!this.futureEnhancementGrid) return;
    const modules = [
      {
        title: 'Dashboard',
        items: ['Customizable widgets', 'Personal dashboard layouts', 'AI priority recommendations', 'Predictive admission trends', 'Real-time notifications', 'Multi-campus comparison', 'Mobile dashboard']
      },
      {
        title: 'Inquiry List',
        items: ['Saved filter views', 'Custom columns', 'Drag-and-drop lead management', 'AI-powered search', 'Smart lead prioritization', 'Duplicate inquiry suggestions', 'Advanced bulk operations', 'Pin favorite inquiries']
      },
      {
        title: 'Inquiry Details',
        items: ['Voice call recording', 'WhatsApp conversation sync', 'AI counselling summary', 'Sentiment analysis', 'Document upload', 'Admission readiness score', 'AI suggested next action', 'Student timeline analytics']
      },
      {
        title: 'Lead Actions',
        items: ['Click-to-call integration', 'Automatic call recording', 'WhatsApp Business API', 'Email templates', 'AI call summary', 'Voice-to-text notes', 'Digital document sharing', 'E-signature support']
      },
      {
        title: 'Follow-up',
        items: ['Automatic reminders', 'Google Calendar integration', 'Outlook integration', 'WhatsApp reminder automation', 'AI follow-up timing', 'AI follow-up summaries', 'Voice transcription', 'Follow-up SLA monitoring']
      },
      {
        title: 'Counselling',
        items: ['Video meeting integration', 'Counselling templates', 'AI-generated counselling summary', 'Parent counselling workflow', 'Admission readiness score', 'AI course suggestions', 'Digital counselling feedback']
      },
      {
        title: 'Assignment',
        items: ['Automatic assignment', 'Round-robin assignment', 'Workload-based assignment', 'Skill-based assignment', 'AI assignment recommendations', 'Assignment SLA monitoring']
      },
      {
        title: 'Segmentation',
        items: ['AI smart segments', 'Predictive lead grouping', 'Auto-refresh saved segments', 'Rule-based segmentation', 'Geographic map segmentation', 'Segment sharing across branches', 'Multi-campus segments']
      },
      {
        title: 'Lead Journey',
        items: ['AI admission probability', 'Journey health score', 'Predictive bottleneck analysis', 'Custom journey templates', 'Multi-program journeys', 'Parent journey tracking', 'Multi-campus journey analytics']
      },
      {
        title: 'Reports',
        items: ['Custom report builder', 'Interactive charts', 'AI-powered insights', 'Predictive admission analytics', 'Scheduled reports', 'Saved report templates', 'Executive dashboard']
      }
    ];

    this.futureEnhancementGrid.innerHTML = modules.map(module => `
      <div class="future-module-card">
        <div class="future-module-title">${module.title}</div>
        <div class="future-module-list">
          ${module.items.map(item => `<span><i class="fas fa-check"></i>${item}</span>`).join('')}
        </div>
      </div>
    `).join('');
  },

  renderSegmentList() {
    if (!this.segmentListContainer || !this.segmentArchiveListContainer) return;
    const activeSegments = this.segments.filter(s => !s.archived);
    const archivedSegments = this.segments.filter(s => s.archived);

    if (!activeSegments.length) {
      this.segmentListContainer.innerHTML = `<div class="empty-state">No active segments yet. Create one to begin assignment.</div>`;
    } else {
      this.segmentListContainer.innerHTML = activeSegments.map(segment => {
        const assignedNames = segment.assignedUsers && segment.assignedUsers.length ? segment.assignedUsers.join(', ') : 'Unassigned';
        const assignedPills = segment.assignedUsers && segment.assignedUsers.length
        ? segment.assignedUsers.map(user => `
            <span class="segment-assigned-pill">
              ${user}
              <button type="button" class="pill-remove" onclick="SegmentationModule.removeAssignment('${user}', ${segment.id}, event)">&times;</button>
            </span>
          `).join('')
        : '<span class="segment-assigned-pill muted">Unassigned</span>';
      return `
          <div class="segment-card-item" draggable="true" data-segment-id="${segment.id}">
            <div class="segment-card-top">
              <div class="segment-card-title">${segment.name}</div>
              <button type="button" class="segment-card-action" onclick="SegmentationModule.toggleArchive(${segment.id}, event)">Archive</button>
            </div>
            <div class="segment-card-meta">${segment.description}</div>
            <div class="segment-card-details">
              <span><strong>${segment.leadIds.length}</strong> leads</span>
            </div>
            <div class="segment-tag-row">
              <span class="state-chip">Scholarship</span>
              <span class="state-chip">High Priority</span>
              <span class="state-chip">Parent Inquiry</span>
              <span class="state-chip">Repeat Inquiry</span>
            </div>
            <div class="segment-assigned-list">${assignedPills}</div>
            <div class="segment-card-criteria">${segment.criteria}</div>
            <div class="segment-card-footer">
              <span>Created ${segment.createdAt}</span>
              <button type="button" class="segment-card-action" onclick="SegmentationModule.renameSegment(${segment.id}, event)">Rename</button>
              <button type="button" class="segment-card-action" onclick="SegmentationModule.viewSegmentDetails(${segment.id}, event)">View Details</button>
              <button type="button" class="segment-card-action" onclick="SegmentationModule.toggleArchive(${segment.id}, event)">Activate/Deactivate</button>
            </div>
          </div>
        `;
      }).join('');
    }

    if (!archivedSegments.length) {
      this.segmentArchiveListContainer.innerHTML = `<div class="empty-state">No archived segments.</div>`;
    } else {
      this.segmentArchiveListContainer.innerHTML = archivedSegments.map(segment => {
        const assignedNames = segment.assignedUsers && segment.assignedUsers.length ? segment.assignedUsers.join(', ') : 'Unassigned';
        const assignedPills = segment.assignedUsers && segment.assignedUsers.length
        ? segment.assignedUsers.map(user => `
            <span class="segment-assigned-pill">
              ${user}
              <button type="button" class="pill-remove" onclick="SegmentationModule.removeAssignment('${user}', ${segment.id}, event)">&times;</button>
            </span>
          `).join('')
        : '<span class="segment-assigned-pill muted">Unassigned</span>';
      return `
          <div class="segment-card-item archived" draggable="true" data-segment-id="${segment.id}">
            <div class="segment-card-top">
              <div class="segment-card-title">${segment.name}</div>
              <button type="button" class="segment-card-action" onclick="SegmentationModule.toggleArchive(${segment.id}, event)">Restore</button>
            </div>
            <div class="segment-card-meta">${segment.description}</div>
            <div class="segment-card-details">
              <span><strong>${segment.leadIds.length}</strong> leads</span>
            </div>
            <div class="segment-tag-row">
              <span class="state-chip">Scholarship</span>
              <span class="state-chip">High Priority</span>
              <span class="state-chip">Parent Inquiry</span>
              <span class="state-chip">Repeat Inquiry</span>
            </div>
            <div class="segment-assigned-list">${assignedPills}</div>
            <div class="segment-card-criteria">${segment.criteria}</div>
            <div class="segment-card-footer">Created ${segment.createdAt}</div>
          </div>
        `;
      }).join('');
    }

    if (this.segmentListCount) this.segmentListCount.textContent = `${activeSegments.length} active segments`;
    this.renderSummaryCards();
    this.renderSegmentReports();
    this.bindSegmentDrag();
    this.bindArchiveDrop();
  },

  selectSegment(id) {
    this.selectedSegmentId = id;
    this.renderSegmentList();
    this.renderAssignmentQueue();
  },

  renameSegment(segmentId, event) {
    if (event) event.stopPropagation();
    const segment = this.segments.find(s => s.id === segmentId);
    if (!segment) return;
    segment.name = `${segment.name} (Renamed)`;
    this.renderSegmentList();
    this.showToast('Segment renamed for demo.');
  },

  viewSegmentDetails(segmentId, event) {
    if (event) event.stopPropagation();
    const segment = this.segments.find(s => s.id === segmentId);
    if (!segment) return;
    this.showToast(`${segment.name}: ${segment.leadIds?.length || 0} inquiries, ${segment.criteria}`);
  },

  toggleArchive(segmentId, event) {
    if (event) event.stopPropagation();
    const segment = this.segments.find(s => s.id === segmentId);
    if (!segment) return;
    segment.archived = !segment.archived;
    this.renderSegmentList();
    this.renderAssignmentQueue();
    this.showToast(segment.archived ? `${segment.name} moved to archive.` : `${segment.name} restored to active.`);
  },

  selectGroup(groupType) {
    if (!this.userGroups[groupType]) return;
    this.groupType = groupType;
    document.querySelectorAll('.assignment-filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.group === groupType));
    this.renderAssignmentUsers();
  },

  renderAssignmentUsers() {
    if (!this.assignmentUserList) return;
    const users = this.userGroups[this.groupType] || [];
    if (!users.length) {
      this.assignmentUserList.innerHTML = `<div class="empty-state">No members in this group.</div>`;
      return;
    }
    this.assignmentUserList.innerHTML = users.map(user => {
      const assignedSegments = this.segments
        .filter(segment => segment.assignedUsers?.includes(user.name) && !segment.archived)
        .map(segment => ({ id: segment.id, name: segment.name }));
      const assignedPills = assignedSegments.length
        ? assignedSegments.map(segment => `
            <span class="assignment-pill">
              ${segment.name}
              <button type="button" class="pill-remove" onclick="SegmentationModule.removeAssignment('${user.name}', ${segment.id}, event)">&times;</button>
            </span>
          `).join('')
        : '<span class="assignment-pill muted">No segments</span>';

      return `
        <div class="assignment-user-card" data-user="${user.name}">
          <div>
            <div class="assignment-user-name">${user.name}</div>
            <div class="assignment-user-role">${user.role}</div>
          </div>
          <div class="assignment-user-segments">${assignedPills}</div>
        </div>
      `;
    }).join('');
    this.bindAssignmentDrop();
  },

  renderAssignmentQueue() {
    if (!this.assignmentSegmentQueue) return;
    const activeSegments = this.segments.filter(segment => !segment.archived);
    if (!activeSegments.length) {
      this.assignmentSegmentQueue.innerHTML = `<div class="empty-state">No active segment cards yet. Create a segment to begin assignment.</div>`;
      return;
    }

    this.assignmentSegmentQueue.innerHTML = activeSegments.map(segment => {
      const assignedNames = segment.assignedUsers && segment.assignedUsers.length ? segment.assignedUsers.join(', ') : 'Unassigned';
      return `
        <div class="assignment-segment-card" draggable="true" data-segment-id="${segment.id}">
          <div class="assignment-user-name">${segment.name}</div>
          <div class="assignment-segment-meta">${assignedNames}</div>
          <div class="assignment-segment-date">${segment.criteria}</div>
        </div>
      `;
    }).join('');
    this.bindSegmentDrag();
  },

  bindSegmentDrag() {
    const dragCards = document.querySelectorAll('.assignment-segment-card, .segment-card-item[draggable="true"]');
    dragCards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedSegmentId = Number(card.dataset.segmentId);
        e.dataTransfer.setData('text/plain', card.dataset.segmentId);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        this.draggedSegmentId = null;
        card.classList.remove('dragging');
      });
    });
  },

  bindArchiveDrop() {
    const activeDrop = this.segmentActiveGrid;
    const archiveDrop = this.segmentArchiveGrid;
    if (!activeDrop || !archiveDrop) return;

    [activeDrop, archiveDrop].forEach(container => {
      container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.classList.add('drag-over');
      });
      container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
      });
      container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');
        const segmentId = Number(e.dataTransfer.getData('text/plain') || this.draggedSegmentId);
        const segment = this.segments.find(s => s.id === segmentId);
        if (!segment) return;
        const shouldArchive = container === archiveDrop;
        if (segment.archived !== shouldArchive) {
          segment.archived = shouldArchive;
          this.renderSegmentList();
          this.renderAssignmentQueue();
          this.showToast(shouldArchive ? `${segment.name} archived.` : `${segment.name} restored to active.`);
        }
      });
    });
  },

  bindAssignmentDrop() {
    if (!this.assignmentUserList) return;
    this.assignmentUserList.querySelectorAll('.assignment-user-card').forEach(card => {
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('active');
      });
      card.addEventListener('dragleave', () => {
        card.classList.remove('active');
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('active');
        const segmentId = Number(e.dataTransfer.getData('text/plain') || this.draggedSegmentId);
        const user = card.dataset.user;
        if (segmentId && user) {
          this.assignSegmentToUser(segmentId, user);
        }
      });
    });
  },

  assignSegmentToUser(segmentId, userName) {
    const segment = this.segments.find(s => s.id === segmentId);
    if (!segment) return;
    if (!segment.assignedUsers) segment.assignedUsers = [];
    if (!segment.assignedUsers.includes(userName)) {
      segment.assignedUsers.push(userName);
    }
    this.renderSegmentList();
    this.renderAssignmentUsers();
    this.renderAssignmentQueue();
    this.renderAssignmentReports();
    this.showToast(`Segment ${segment.name} assigned to ${userName}.`);
  },

  removeAssignment(userName, segmentId, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const segment = this.segments.find(s => s.id === segmentId);
    if (!segment || !segment.assignedUsers) return;
    segment.assignedUsers = segment.assignedUsers.filter(user => user !== userName);
    this.renderSegmentList();
    this.renderAssignmentUsers();
    this.renderAssignmentQueue();
    this.renderAssignmentReports();
    this.showToast(`Removed ${segment.name} from ${userName}.`);
  },

  showFormStatus(message, isError) {
    if (!this.formStatus) return;
    this.formStatus.textContent = message;
    this.formStatus.style.color = isError ? 'var(--danger)' : 'var(--success)';
    setTimeout(() => { if (this.formStatus) this.formStatus.textContent = ''; }, 3000);
  },

  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  },

  formatDate(date) {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
};

window.SegmentationModule = SegmentationModule;

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.more-dropdown')) {
    document.querySelectorAll('.more-dropdown-menu').forEach(m => m.remove());
  }
  if (!e.target.closest('.date-picker-modal')) {
    // Date picker handled separately
  }
});

document.addEventListener('DOMContentLoaded', () => App.init());
