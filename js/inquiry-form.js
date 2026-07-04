// ============================================================
// INQUIRY-FORM.JS - Standalone Inquiry Module
// ============================================================

const InquiryFormPage = {
  storageKey: 'pa-inquiry-submissions',

  init() {
    this.setupTheme();
    this.setupLocationFields();
    this.setupInquiryFields();
    this.setupForm();
  },

  setupTheme() {
    try {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      const saved = localStorage.getItem('pa-theme');
      const isDark = saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.body.classList.toggle('dark', isDark);
      if (themeIcon) themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
      themeToggle?.addEventListener('click', () => {
        const nowDark = !document.body.classList.contains('dark');
        document.body.classList.toggle('dark', nowDark);
        document.body.classList.remove('theme-fade');
        void document.body.offsetWidth;
        document.body.classList.add('theme-fade');
        window.setTimeout(() => document.body.classList.remove('theme-fade'), 360);
        if (themeIcon) themeIcon.className = nowDark ? 'fas fa-moon' : 'fas fa-sun';
        try { localStorage.setItem('pa-theme', nowDark ? 'dark' : 'light'); } catch (e) {}
      });
    } catch (e) {
      // ignore theme failures
    }
  },

  getTrackingData() {
    return {
      source: 'Public Inquiry Form',
      medium: 'inquiry_form',
      campaign: 'direct_inquiry',
      content: 'lead_capture',
      term: '-',
      landingPage: 'inquiry-form.html',
      referrer: document.referrer || 'Direct'
    };
  },

  getSubmissions() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveSubmissions(submissions) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(submissions));
    } catch (e) {
      // ignore storage failures
    }
  },

  setupLocationFields() {
    const stateSelect = document.getElementById('i-state');
    const districtSelect = document.getElementById('i-district');
    if (!stateSelect || !districtSelect || typeof INDIAN_STATE_DISTRICTS === 'undefined') return;

    Object.keys(INDIAN_STATE_DISTRICTS).forEach((state) => {
      stateSelect.insertAdjacentHTML('beforeend', `<option value="${state}">${state}</option>`);
    });

    stateSelect.addEventListener('change', () => {
      const districts = INDIAN_STATE_DISTRICTS[stateSelect.value] || [];
      districtSelect.innerHTML = '<option value="">Select District</option>';
      districts.forEach((district) => {
        districtSelect.insertAdjacentHTML('beforeend', `<option value="${district}">${district}</option>`);
      });
      districtSelect.disabled = districts.length === 0;
      districtSelect.value = '';
    });
  },

  setupInquiryFields() {
    const typeInputs = Array.from(document.querySelectorAll('input[name="inquiryType"]'));
    const courseSelect = document.getElementById('i-course');
    if (!typeInputs.length || !courseSelect) return;
    typeInputs.forEach((input) => input.addEventListener('change', () => this.updateInquiryFields()));
    courseSelect.addEventListener('change', () => this.updateInquiryFields());
    this.updateInquiryFields();
  },

  updateInquiryFields() {
    const inquiryType = document.querySelector('input[name="inquiryType"]:checked')?.value || 'General Inquiry';
    const courseSelect = document.getElementById('i-course');
    const batchSelect = document.getElementById('i-batch');
    const modeInputs = Array.from(document.querySelectorAll('input[name="mode"]'));
    const query = document.getElementById('i-query');
    const queryLabel = document.getElementById('i-query-label');
    const isCourseInquiry = inquiryType === 'Course Inquiry';
    const needsBatchMode = this.courseNeedsBatchMode(courseSelect?.value);

    document.getElementById('i-course-wrap').hidden = !isCourseInquiry;
    document.getElementById('i-batch-wrap').hidden = !isCourseInquiry || !needsBatchMode;
    document.getElementById('i-mode-wrap').hidden = !isCourseInquiry || !needsBatchMode;
    document.getElementById('i-query-wrap').hidden = false;

    if (courseSelect) {
      courseSelect.required = isCourseInquiry;
      if (!isCourseInquiry) courseSelect.value = '';
    }
    if (batchSelect) {
      batchSelect.required = isCourseInquiry && needsBatchMode;
      if (!needsBatchMode) batchSelect.value = '';
    }
    modeInputs.forEach((input) => {
      input.required = isCourseInquiry && needsBatchMode;
      if (!needsBatchMode) input.checked = false;
    });
    if (query) {
      query.required = !isCourseInquiry;
    }
    if (queryLabel) {
      queryLabel.textContent = isCourseInquiry ? 'Any Specific Query (Optional)' : 'Any Specific Query *';
    }
  },

  courseNeedsBatchMode(course) {
    return ['UPSC', 'GPSC-Class1,2', 'GPSC', 'Class -3'].includes(course);
  },

  setupForm() {
    const form = document.getElementById('inquiry-form');
    const statusEl = document.getElementById('inquiry-status');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('i-name').value.trim();
      const phone = document.getElementById('i-phone').value.trim();
      const email = document.getElementById('i-email').value.trim();
      const state = document.getElementById('i-state').value;
      const district = document.getElementById('i-district').value;
      const academicStatus = document.getElementById('i-academic-status').value;
      const inquiryType = document.querySelector('input[name="inquiryType"]:checked')?.value;
      const course = document.getElementById('i-course').value;
      const batch = document.getElementById('i-batch').value;
      const mode = document.querySelector('input[name="mode"]:checked')?.value;
      const query = document.getElementById('i-query').value.trim();
      const requiresCourse = inquiryType === 'Course Inquiry';
      const requiresBatchMode = requiresCourse && this.courseNeedsBatchMode(course);

      if (!name || !phone || !email || !state || !district || !academicStatus || !inquiryType || (!requiresCourse && !query) || (requiresCourse && !course) || (requiresBatchMode && (!batch || !mode))) {
        if (statusEl) {
          statusEl.textContent = 'Please complete all required fields.';
          statusEl.classList.add('error');
        }
        return;
      }

      const submissions = this.getSubmissions();
      const createdAt = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      submissions.unshift({
        id: Date.now(),
        enqNo: 'INQ' + Math.floor(Math.random() * 9000 + 1000),
        name,
        phone,
        email,
        state,
        district,
        academicStatus,
        inquiryType,
        course: requiresCourse ? course : 'General Inquiry',
        batch: requiresBatchMode ? batch : '',
        mode: requiresBatchMode ? mode : '',
        query,
        createdAt,
        utm: this.getTrackingData()
      });

      this.saveSubmissions(submissions);
      form.reset();
      document.getElementById('i-district').innerHTML = '<option value="">Select District</option>';
      document.getElementById('i-district').disabled = true;
      const generalDefault = form.querySelector('input[name="inquiryType"][value="General Inquiry"]');
      if (generalDefault) generalDefault.checked = true;
      this.updateInquiryFields();
      if (statusEl) {
        statusEl.classList.remove('error');
        statusEl.textContent = 'Inquiry saved successfully.';
      }
      window.setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 3000);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => InquiryFormPage.init());
