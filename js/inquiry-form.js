// ============================================================
// INQUIRY-FORM.JS - Standalone Inquiry Module
// ============================================================

const InquiryFormPage = {
  storageKey: 'pa-inquiry-submissions',
  defaultBatchOptions: null,

  init() {
    this.setupTheme();
    this.setupLocationFields();
    this.setupInquiryFields();
    this.setupForm();
    this.cacheDefaultBatchOptions();
    this.syncBatchOptionsWithCourse();
    // Apply Goal 1 defaults immediately on load
    this.updateInquiryFields();
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
    const courseSelect = document.getElementById('i-course');
    const batchSelect = document.getElementById('i-batch');
    const modeInputs = Array.from(document.querySelectorAll('input[name="mode"]'));
    const query = document.getElementById('i-query');
    const queryLabel = document.getElementById('i-query-label');

    // Goal 1: If Academic Status is "School Student", default to Course Inquiry and set Course to "Sankalp".
    const academicStatus = document.getElementById('i-academic-status');
    if (academicStatus && academicStatus.value === 'School Student') {
      const courseRadio = document.querySelector('input[name="inquiryType"][value="Course Inquiry"]');
      const generalRadio = document.querySelector('input[name="inquiryType"][value="General Inquiry"]');
      if (courseRadio) courseRadio.checked = true;
      if (generalRadio) generalRadio.checked = false;
      if (courseSelect) courseSelect.value = 'Sankalp';
    }

    // Re-evaluate inquiryType after mutations above.
    const finalInquiryType = document.querySelector('input[name="inquiryType"]:checked')?.value || 'General Inquiry';
    const isCourseInquiry = finalInquiryType === 'Course Inquiry';

    const needsBatchMode = this.courseNeedsBatchMode(courseSelect?.value);
    const isClass3Course = isCourseInquiry && courseSelect?.value === 'Class -3';


    // Ensure batch options are synced whenever course changes
    this.syncBatchOptionsWithCourse();

    document.getElementById('i-course-wrap').hidden = !isCourseInquiry;
    document.getElementById('i-batch-wrap').hidden = !isCourseInquiry || !needsBatchMode;
    document.getElementById('i-mode-wrap').hidden = !isCourseInquiry || !needsBatchMode;
    document.getElementById('i-query-wrap').hidden = false;

    if (courseSelect) {
      courseSelect.required = isCourseInquiry;
      if (!isCourseInquiry) courseSelect.value = '';
    }

    if (batchSelect) {
      // Goal 2: For Class 3, batch should NOT be mandatory.
      batchSelect.required = isCourseInquiry && needsBatchMode && !isClass3Course;

      if (!needsBatchMode) batchSelect.value = '';

      // If current selection is no longer valid after option sync, reset.
      if (needsBatchMode && batchSelect.value) {
        const isValid = Array.from(batchSelect.options).some((o) => o.value === batchSelect.value);
        if (!isValid) batchSelect.value = '';
      }
    }

    modeInputs.forEach((input) => {
      // Goal 2: For Class 3, mode should also be optional.
      input.required = isCourseInquiry && needsBatchMode && !isClass3Course;
      if (!needsBatchMode) input.checked = false;
    });

    const academicStatusValue = document.getElementById('i-academic-status')?.value;
    const isSchoolStudent = academicStatusValue === 'School Student';

    if (query) {
      // Goal 1: For Course Inquiry make query required only in the School Student default flow.
      query.required = isCourseInquiry ? isSchoolStudent : true;

    }

    if (queryLabel) {
      if (isCourseInquiry) {
        queryLabel.textContent = isSchoolStudent ? 'Any Specific Query *' : 'Any Specific Query (Optional)';
      } else {
        queryLabel.textContent = 'Any Specific Query *';
      }
    }

  },



  cacheDefaultBatchOptions() {
    try {
      const batchSelect = document.getElementById('i-batch');
      if (!batchSelect) return;
      // Preserve the original HTML options so we can switch back for non-Class-3 courses
      this.defaultBatchOptions = Array.from(batchSelect.options).map((o) => ({
        value: o.value,
        text: o.textContent
      }));
    } catch (e) {
      this.defaultBatchOptions = null;
    }
  },

  syncBatchOptionsWithCourse() {
    const courseSelect = document.getElementById('i-course');
    const batchSelect = document.getElementById('i-batch');
    if (!courseSelect || !batchSelect) return;

    const course = courseSelect.value;

    // Requirement: When user selects Class 3, show only:
    // "Master batch" & "Others (Please Specify in Remarks)"
    if (course === 'Class -3') {
      batchSelect.innerHTML = '';

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select Batch';
      batchSelect.appendChild(placeholder);

      const opt1 = document.createElement('option');
      opt1.value = 'master-batch';
      opt1.textContent = 'Master batch';
      batchSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = 'others';
      opt2.textContent = 'Other';
      batchSelect.appendChild(opt2);


      // Keep selection if still valid (otherwise reset)
      const isValid = Array.from(batchSelect.options).some((o) => o.value === batchSelect.value);
      if (!isValid) batchSelect.value = '';
      return;
    }

    // Revert to default batch options for other courses
    if (this.defaultBatchOptions) {
      batchSelect.innerHTML = '';
      this.defaultBatchOptions.forEach((o) => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.text;
        batchSelect.appendChild(opt);
      });
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

      // Goal 2: For Class 3, both batch and mode should be optional.
      const isClass3 = requiresCourse && course === 'Class -3';
      const missingMode = requiresBatchMode && !mode && !isClass3;
      const missingBatch = requiresBatchMode && !batch && !isClass3;

      if (!name || !phone || !email || !state || !district || !academicStatus || !inquiryType || (!requiresCourse && !query) || (requiresCourse && !course) || missingMode || missingBatch) {


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
