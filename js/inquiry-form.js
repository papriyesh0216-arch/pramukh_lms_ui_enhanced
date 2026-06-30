// ============================================================
// INQUIRY-FORM.JS - Standalone Inquiry Module
// ============================================================

const InquiryFormPage = {
  storageKey: 'pa-inquiry-submissions',

  init() {
    this.setupTheme();
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

  setupForm() {
    const form = document.getElementById('inquiry-form');
    const statusEl = document.getElementById('inquiry-status');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('i-name').value.trim();
      const phone = document.getElementById('i-phone').value.trim();
      const email = document.getElementById('i-email').value.trim();
      const pincode = document.getElementById('i-pincode').value.trim();
      const city = document.getElementById('i-city').value.trim();
      const academicStatus = document.getElementById('i-academic-status').value;
      const course = document.querySelector('input[name="course"]:checked')?.value;
      const mode = document.querySelector('input[name="mode"]:checked')?.value;
      const query = document.getElementById('i-query').value.trim();

      if (!name || !phone || !email || !pincode || !city || !academicStatus || !course || !mode) {
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
        pincode,
        city,
        academicStatus,
        course,
        mode,
        query,
        createdAt,
        utm: this.getTrackingData()
      });

      this.saveSubmissions(submissions);
      form.reset();
      const courseDefault = form.querySelector('input[name="course"][value="UPSC Foundation"]');
      const modeDefault = form.querySelector('input[name="mode"][value="Classroom"]');
      if (courseDefault) courseDefault.checked = true;
      if (modeDefault) modeDefault.checked = true;
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
