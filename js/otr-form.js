// ============================================================
// OTR-FORM.JS - AMS-only One Time Registration form
// ============================================================

const AMSOTR = {
  storageKey: 'paAMSOTRRecords',
  uploadedPhoto: null,
  governmentExamSequence: 0,

  pinMaster: {
    '110': { state: 'Delhi', districts: ['New Delhi', 'Central Delhi', 'South Delhi'] },
    '360': { state: 'Gujarat', districts: ['Rajkot'] },
    '361': { state: 'Gujarat', districts: ['Jamnagar', 'Devbhumi Dwarka'] },
    '362': { state: 'Gujarat', districts: ['Junagadh', 'Gir Somnath'] },
    '363': { state: 'Gujarat', districts: ['Surendranagar', 'Morbi'] },
    '364': { state: 'Gujarat', districts: ['Bhavnagar', 'Botad'] },
    '365': { state: 'Gujarat', districts: ['Amreli'] },
    '370': { state: 'Gujarat', districts: ['Kutch'] },
    '380': { state: 'Gujarat', districts: ['Ahmedabad'] },
    '382': { state: 'Gujarat', districts: ['Ahmedabad', 'Gandhinagar'] },
    '383': { state: 'Gujarat', districts: ['Sabarkantha', 'Aravalli'] },
    '384': { state: 'Gujarat', districts: ['Mehsana', 'Patan'] },
    '385': { state: 'Gujarat', districts: ['Banaskantha'] },
    '387': { state: 'Gujarat', districts: ['Kheda'] },
    '388': { state: 'Gujarat', districts: ['Anand'] },
    '389': { state: 'Gujarat', districts: ['Panchmahal', 'Dahod', 'Mahisagar'] },
    '390': { state: 'Gujarat', districts: ['Vadodara'] },
    '391': { state: 'Gujarat', districts: ['Vadodara', 'Chhota Udaipur'] },
    '392': { state: 'Gujarat', districts: ['Bharuch'] },
    '393': { state: 'Gujarat', districts: ['Bharuch', 'Narmada'] },
    '394': { state: 'Gujarat', districts: ['Surat', 'Tapi'] },
    '395': { state: 'Gujarat', districts: ['Surat'] },
    '396': { state: 'Gujarat', districts: ['Valsad', 'Navsari', 'Dang'] },
    '400': { state: 'Maharashtra', districts: ['Mumbai City', 'Mumbai Suburban', 'Thane'] },
    '411': { state: 'Maharashtra', districts: ['Pune'] },
    '560': { state: 'Karnataka', districts: ['Bengaluru Urban'] },
    '600': { state: 'Tamil Nadu', districts: ['Chennai'] },
    '700': { state: 'West Bengal', districts: ['Kolkata'] }
  },

  init() {
    if (!document.body.classList.contains('otr-public-page')) this.seedSampleRecords();
    this.setupStandaloneTheme();
    this.bindProfileEvents();
    if (!document.getElementById('otr-form')) return;
    this.renderSections();
    this.bindEvents();
    this.addAchievement();
    this.addGovernmentExam();
  },

  setupStandaloneTheme() {
    if (!document.body.classList.contains('otr-public-page')) return;
    const toggle = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    let isDark = false;
    try {
      const saved = localStorage.getItem('pa-theme');
      isDark = saved === 'dark' || (!saved && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    } catch (error) {}
    const apply = value => {
      document.body.classList.toggle('dark', value);
      if (icon) icon.className = value ? 'fas fa-moon' : 'fas fa-sun';
    };
    apply(isDark);
    toggle?.addEventListener('click', () => {
      isDark = !document.body.classList.contains('dark');
      apply(isDark);
      try { localStorage.setItem('pa-theme', isDark ? 'dark' : 'light'); } catch (error) {}
    });
  },

  bindProfileEvents() {
    document.getElementById('otr-profile-modal')?.addEventListener('click', event => {
      if (event.target.id === 'otr-profile-modal') this.closeProfile();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.closeProfile();
    });
  },

  seedSampleRecords() {
    const samples = window.APP_DATA?.AMS_OTR_SAMPLE_RECORDS || [];
    if (!samples.length) return;
    const records = this.getRecords();
    const additions = samples.filter(sample => !records.some(record =>
      record.id === sample.id ||
      record.otrNo === sample.otrNo ||
      record.personal?.email?.toLowerCase() === sample.personal.email.toLowerCase() ||
      record.personal?.phone === sample.personal.phone
    ));
    if (!additions.length) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...records, ...additions]));
    } catch (error) {
      console.warn('AMS sample OTR records could not be stored.', error);
    }
  },

  renderSections() {
    const container = document.getElementById('otr-sections');
    if (!container) return;
    container.innerHTML = `
      ${this.personalSection()}
      ${this.educationSection()}
      ${this.achievementsSection()}
      ${this.satsangSection()}
      ${this.governmentSection()}
      ${this.documentsSection()}
    `;
  },

  field(label, name, options = {}) {
    const { type = 'text', placeholder = '', required = false, extra = '', span = '', hint = '' } = options;
    return `
      <div class="otr-field ${span}" data-field-wrap="${name}">
        <label for="otr-${name}">${label}${required ? ' <span class="required">*</span>' : ''}</label>
        <input id="otr-${name}" name="${name}" type="${type}" placeholder="${placeholder}" ${required ? 'required' : ''} ${extra} />
        ${hint ? `<small class="otr-field-hint">${hint}</small>` : ''}
        <small class="otr-field-error"></small>
      </div>
    `;
  },

  select(label, name, items, options = {}) {
    const { placeholder = 'Select', required = false, span = '', extra = '' } = options;
    return `
      <div class="otr-field ${span}" data-field-wrap="${name}">
        <label for="otr-${name}">${label}${required ? ' <span class="required">*</span>' : ''}</label>
        <select id="otr-${name}" name="${name}" ${required ? 'required' : ''} ${extra}>
          <option value="">${placeholder}</option>
          ${items.map(item => `<option value="${this.escape(item)}">${this.escape(item)}</option>`).join('')}
        </select>
        <small class="otr-field-error"></small>
      </div>
    `;
  },

  radio(label, name, required = false) {
    return `
      <fieldset class="otr-field otr-radio-field" data-field-wrap="${name}">
        <legend>${label}${required ? ' <span class="required">*</span>' : ''}</legend>
        <div class="otr-radio-group">
          ${['Yes', 'No'].map(value => `
            <label class="otr-radio-option">
              <input type="radio" name="${name}" value="${value}" ${required ? 'required' : ''} />
              <span><i class="fas ${value === 'Yes' ? 'fa-check' : 'fa-xmark'}"></i>${value}</span>
            </label>
          `).join('')}
        </div>
        <small class="otr-field-error"></small>
      </fieldset>
    `;
  },

  sectionHead(icon, title) {
    return `
      <div class="otr-section-head">
        <div class="otr-section-symbol"><i class="fas ${icon}"></i></div>
        <h2>${title}</h2>
      </div>
    `;
  },

  personalSection() {
    return `
      <section class="otr-section" id="otr-personal-section">
        ${this.sectionHead('fa-user', 'Personal Details')}
        <div class="otr-grid">
          ${this.field('Full Name', 'fullName', { placeholder: 'Full Name', required: true, span: 'span-2', extra: 'autocomplete="name"' })}
          ${this.field('Date of Birth', 'dateOfBirth', { type: 'date', required: true })}
          ${this.select('Gender', 'gender', ['Male', 'Female', 'Other'], { placeholder: 'Select Gender', required: true })}
          ${this.select('Religion', 'religion', ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Other'], { placeholder: 'Select Religion', required: true })}
          ${this.field('Phone No.', 'phone', { type: 'tel', placeholder: 'XXXXXXXXXX', required: true, extra: 'inputmode="numeric" maxlength="10" pattern="[6-9][0-9]{9}" autocomplete="tel"' })}
          ${this.radio('Is your WhatsApp number the same as your primary phone number? ', 'differentWhatsapp', true)}
          <div class="otr-conditional" id="otr-whatsapp-wrap" hidden>
            ${this.field('WhatsApp No.', 'whatsapp', { type: 'tel', placeholder: 'XXXXXXXXXX', extra: 'inputmode="numeric" maxlength="10" pattern="[6-9][0-9]{9}"' })}
          </div>
          ${this.field('Email ID', 'email', { type: 'email', placeholder: 'example@gmail.com', required: true, extra: 'autocomplete="email"' })}
        </div>
        <div class="otr-subsection-divider">
          <span><i class="fas fa-location-dot"></i></span>
          <div>
            <h3>Correspondence Address</h3>
          </div>
        </div>
        <div class="otr-grid">
          ${this.field('Pincode', 'pincode', { placeholder: 'Pincode', required: true, extra: 'inputmode="numeric" maxlength="6" pattern="[1-9][0-9]{5}"', hint: 'Enter a valid 6-digit Indian pincode.' })}
          ${this.select('State', 'state', [], { placeholder: 'State', required: true, extra: 'disabled' })}
          ${this.select('District', 'district', [], { placeholder: 'District', required: true, extra: 'disabled' })}
          ${this.field('Postal Address Line 1', 'addressLine1', { placeholder: 'House No./ Appartment No./ Building No.', span: 'span-2', extra: 'autocomplete="address-line1"' })}
          ${this.field('Postal Address Line 2', 'addressLine2', { placeholder: 'Village / Town / City', span: 'span-2', extra: 'autocomplete="address-line2"' })}
        </div>
      </section>
    `;
  },

  educationSection() {
    const boards = ['GSEB', 'CBSE', 'ICSE', 'NIOS', 'Other'];
    const mediums = ['Gujarati', 'English', 'Hindi', 'Marathi', 'Other'];
    const streams = ['Arts', 'Commerce', 'Science', 'Engineering', 'Management', 'Law', 'Other'];
    const years = Array.from({ length: 45 }, (_, index) => String(new Date().getFullYear() - index));
    const qualification = (key, title, config = {}) => `
      <div class="otr-qualification ${config.required ? 'required-block open' : ''}" data-education-card="${key}">
        <button class="otr-subsection-title" type="button" aria-expanded="${config.required ? 'true' : 'false'}" aria-controls="otr-education-${key}">
          <div><i class="fas ${config.icon || 'fa-book-open'}"></i><strong>${title}</strong></div>
          <span>${config.required ? 'All fields required' : 'Optional'} <i class="fas fa-chevron-down"></i></span>
        </button>
        <div class="otr-education-content" id="otr-education-${key}" ${config.required ? '' : 'hidden'}>
          <div class="otr-grid otr-education-grid">
            ${config.university ? this.field('University Name', `${key}University`, { placeholder: 'Name of University', required: config.required }) : this.select('Board', `${key}Board`, boards, { placeholder: 'Select Board', required: config.required })}
            ${config.stream ? this.select('Stream', `${key}Stream`, streams, { placeholder: 'Select your Stream', required: config.required }) : ''}
            ${this.select('Medium', `${key}Medium`, mediums, { placeholder: 'Select Medium', required: config.required })}
            ${this.select('Passing Year', `${key}PassingYear`, years, { placeholder: 'Select Year', required: config.required })}
            ${this.field('Result', `${key}Result`, { placeholder: config.degree ? 'Percentage / Percentile / CGPA' : 'Percentage / Percentile / Grade', required: config.required })}
          </div>
        </div>
      </div>
    `;
    return `
      <section class="otr-section" id="otr-education-section">
        ${this.sectionHead('fa-graduation-cap', 'Education Details')}
        <div class="otr-qualification-stack">
          ${qualification('ssc', '10th (SSC)', { required: true, icon: 'fa-school' })}
          ${qualification('hsc', '12th (HSC)', { stream: true, icon: 'fa-building-columns' })}
          ${qualification('diploma', 'Diploma', { university: true, stream: true, degree: true, icon: 'fa-certificate' })}
          ${qualification('bachelor', "Bachelor's Degree Details", { university: true, stream: true, degree: true, icon: 'fa-user-graduate' })}
          ${qualification('master', "Master's Degree Details", { university: true, stream: true, degree: true, icon: 'fa-graduation-cap' })}
        </div>
      </section>
    `;
  },

  achievementsSection() {
    return `
      <section class="otr-section" id="otr-achievements-section">
        ${this.sectionHead('fa-trophy', 'Achievements')}
        <div id="otr-achievement-list" class="otr-achievement-list"></div>
        <button class="otr-add-button" id="otr-add-achievement" type="button"><i class="fas fa-plus"></i> Add another achievement</button>
      </section>
    `;
  },

  satsangSection() {
    return `
      <section class="otr-section" id="otr-satsang-section">
        ${this.sectionHead('fa-hands-praying', 'Satsang')}
        <div class="otr-grid">
          ${this.radio('Are you connected with the BAPS Organization?', 'bapsConnected', true)}
        </div>
        <div class="otr-conditional-panel" id="otr-satsang-fields" hidden>
          <div class="otr-grid">
            ${this.radio('Do you attend Weekly Sabha?', 'weeklySabha')}
            ${this.field('Specific Remark', 'satsangRemark', { placeholder: 'Add Details' })}
            ${this.field('Mandal', 'mandal', { placeholder: 'Mandal Name' })}
            ${this.field('Shetra', 'shetra', { placeholder: 'Shetra Name' })}
            ${this.field('Karyakar Name', 'karyakarName', { placeholder: 'Karyakar Name' })}
            ${this.field('Karyakar Number', 'karyakarNumber', { type: 'tel', placeholder: 'Karyakar Number', extra: 'inputmode="numeric" maxlength="10" pattern="[6-9][0-9]{9}"' })}
            ${this.field('Mandir', 'mandir', { placeholder: 'Nearest Mandir', span: 'span-2' })}
          </div>
        </div>
      </section>
    `;
  },

  governmentSection() {
    return `
      <section class="otr-section" id="otr-government-section">
        <div class="otr-section-head">
          <div class="otr-section-symbol"><i class="fas fa-landmark"></i></div>
          <h2>Government Exam</h2>
          <button class="otr-section-add" id="otr-add-government-exam" type="button" title="Add government exam" aria-label="Add government exam">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="otr-government-list" id="otr-government-list"></div>
      </section>
    `;
  },

  documentsSection() {
    return `
      <section class="otr-section" id="otr-documents-section">
        ${this.sectionHead('fa-file-arrow-up', 'Documents')}
        <div class="otr-upload-zone" id="otr-upload-zone">
          <input id="otr-passportPhoto" name="passportPhoto" type="file" accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg" required />
          <div class="otr-upload-empty" id="otr-upload-empty">
            <span><i class="fas fa-cloud-arrow-up"></i></span>
            <strong>Upload passport-size photo <em>*</em></strong>
            <p>Drag and drop or browse a PDF, JPG, or JPEG file</p>
            <small>Maximum file size: 800 KB</small>
            <button class="btn btn-outline" type="button" id="otr-browse-photo">Choose file</button>
          </div>
          <div class="otr-upload-file" id="otr-upload-file" hidden>
            <span class="otr-file-icon"><i class="fas fa-file-circle-check"></i></span>
            <div><strong id="otr-file-name"></strong><small id="otr-file-meta"></small></div>
            <button type="button" id="otr-remove-photo" aria-label="Remove uploaded photo"><i class="fas fa-trash"></i></button>
          </div>
          <small class="otr-field-error" id="otr-photo-error"></small>
        </div>
        <div class="otr-review-note"><i class="fas fa-circle-info"></i><div><strong>Ready to submit?</strong><span>We will validate every required field and create the student in the Admission Student List.</span></div></div>
      </section>
    `;
  },

  bindEvents() {
    document.getElementById('otr-form')?.addEventListener('submit', event => this.submit(event));
    document.getElementById('otr-add-achievement')?.addEventListener('click', () => this.addAchievement());
    document.getElementById('otr-add-government-exam')?.addEventListener('click', () => this.addGovernmentExam());
    document.getElementById('otr-browse-photo')?.addEventListener('click', () => document.getElementById('otr-passportPhoto')?.click());
    document.getElementById('otr-remove-photo')?.addEventListener('click', () => this.clearPhoto());
    document.getElementById('otr-passportPhoto')?.addEventListener('change', event => this.handlePhoto(event.target.files?.[0]));
    document.getElementById('otr-pincode')?.addEventListener('input', event => this.lookupPincode(event.target.value));
    const uploadZone = document.getElementById('otr-upload-zone');
    uploadZone?.addEventListener('dragover', event => {
      event.preventDefault();
      uploadZone.classList.add('dragging');
    });
    uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('dragging'));
    uploadZone?.addEventListener('drop', event => {
      event.preventDefault();
      uploadZone.classList.remove('dragging');
      this.handlePhoto(event.dataTransfer?.files?.[0]);
    });

    document.querySelectorAll('[name="differentWhatsapp"], [name="bapsConnected"]').forEach(input => {
      input.addEventListener('change', event => this.handleConditionalChange(event));
    });
    document.querySelectorAll('[data-education-card] > .otr-subsection-title').forEach(button => {
      button.addEventListener('click', () => this.toggleEducationCard(button.closest('[data-education-card]')));
    });
    document.getElementById('otr-form')?.addEventListener('input', event => {
      this.clearFieldError(event.target);
    });
  },

  applyConditionalState() {
    const toggle = (selector, wrapId, isActive, requiredNames) => {
      const wrap = document.getElementById(wrapId);
      if (wrap) wrap.hidden = !isActive;
      requiredNames.forEach(name => {
        const elements = document.querySelectorAll(`[name="${name}"]`);
        elements.forEach(element => {
          element.required = isActive;
          if (!isActive) this.clearFieldError(element);
        });
      });
    };
    toggle('[name="differentWhatsapp"]', 'otr-whatsapp-wrap', this.radioValue('differentWhatsapp') === 'No', ['whatsapp']);
    toggle('[name="bapsConnected"]', 'otr-satsang-fields', this.radioValue('bapsConnected') === 'Yes', ['weeklySabha', 'satsangRemark', 'mandal', 'shetra', 'karyakarName', 'karyakarNumber', 'mandir']);
  },

  handleConditionalChange(event) {
    const selectedOption = event.currentTarget;
    const scrollLeft = window.scrollX;
    const scrollTop = window.scrollY;
    this.applyConditionalState();
    selectedOption.focus({ preventScroll: true });
    window.scrollTo(scrollLeft, scrollTop);
    requestAnimationFrame(() => {
      window.scrollTo(scrollLeft, scrollTop);
      selectedOption.focus({ preventScroll: true });
    });
  },

  toggleEducationCard(targetCard) {
    if (!targetCard) return;
    const shouldOpen = !targetCard.classList.contains('open');
    document.querySelectorAll('[data-education-card]').forEach(card => {
      const isTarget = card === targetCard && shouldOpen;
      card.classList.toggle('open', isTarget);
      card.querySelector('.otr-subsection-title')?.setAttribute('aria-expanded', String(isTarget));
      const content = card.querySelector('.otr-education-content');
      if (content) content.hidden = !isTarget;
    });
  },

  openEducationCardFor(field) {
    const card = field?.closest?.('[data-education-card]');
    if (card && !card.classList.contains('open')) this.toggleEducationCard(card);
  },

  lookupPincode(value) {
    const state = document.getElementById('otr-state');
    const district = document.getElementById('otr-district');
    if (!state || !district) return;
    state.innerHTML = '<option value="">State</option>';
    district.innerHTML = '<option value="">District</option>';
    state.disabled = true;
    district.disabled = true;
    if (value.length !== 6) return;

    const match = this.pinMaster[value.slice(0, 3)];
    if (!match) {
      this.setFieldError(document.getElementById('otr-pincode'), 'Pincode is not available in the AMS location master.');
      return;
    }
    const masterDistricts = typeof INDIAN_STATE_DISTRICTS !== 'undefined'
      ? INDIAN_STATE_DISTRICTS[match.state] || []
      : match.districts;
    const validDistricts = match.districts.filter(item => masterDistricts.includes(item));
    state.innerHTML = `<option value="${this.escape(match.state)}">${this.escape(match.state)}</option>`;
    state.disabled = false;
    district.innerHTML = `<option value="">Select District</option>${validDistricts.map(item => `<option value="${this.escape(item)}">${this.escape(item)}</option>`).join('')}`;
    district.disabled = false;
    if (validDistricts.length === 1) district.value = validDistricts[0];
    this.clearFieldError(document.getElementById('otr-pincode'));
  },

  addAchievement(values = {}) {
    const list = document.getElementById('otr-achievement-list');
    if (!list) return;
    const index = list.children.length;
    const years = Array.from({ length: 45 }, (_, itemIndex) => String(new Date().getFullYear() - itemIndex));
    const card = document.createElement('div');
    card.className = 'otr-achievement-card';
    card.innerHTML = `
      <div class="otr-achievement-head"><strong>Achievement ${index + 1}</strong><button type="button" class="otr-remove-achievement"><i class="fas fa-trash"></i> Delete</button></div>
      <div class="otr-grid otr-achievement-grid">
        ${this.field('Title', `achievementTitle${index}`, { placeholder: 'Achievement Title' })}
        ${this.select('Year', `achievementYear${index}`, years, { placeholder: 'Select the Year' })}
        <div class="otr-field otr-achievement-details" data-field-wrap="achievementDetails${index}"><label>Details</label><textarea name="achievementDetails${index}" placeholder="Details" rows="1"></textarea><small class="otr-field-error"></small></div>
      </div>
    `;
    list.appendChild(card);
    card.querySelector(`[name="achievementTitle${index}"]`).value = values.title || '';
    card.querySelector(`[name="achievementYear${index}"]`).value = values.year || '';
    card.querySelector(`[name="achievementDetails${index}"]`).value = values.details || '';
    card.querySelector('.otr-remove-achievement')?.addEventListener('click', () => {
      card.remove();
      this.renumberAchievements();
    });
  },

  renumberAchievements() {
    document.querySelectorAll('.otr-achievement-card').forEach((card, index) => {
      const title = card.querySelector('.otr-achievement-head strong');
      if (title) title.textContent = `Achievement ${index + 1}`;
    });
  },

  addGovernmentExam(values = {}) {
    const list = document.getElementById('otr-government-list');
    if (!list) return;
    const fieldIndex = this.governmentExamSequence++;
    const displayIndex = list.children.length + 1;
    const years = Array.from({ length: 45 }, (_, index) => String(new Date().getFullYear() - index));
    const card = document.createElement('div');
    card.className = 'otr-government-card';
    card.setAttribute('data-government-exam', '');
    card.innerHTML = `
      <div class="otr-government-head">
        <strong>Government Exam ${displayIndex}</strong>
        <button class="otr-remove-government-exam" type="button" title="Delete government exam" aria-label="Delete government exam ${displayIndex}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="otr-grid otr-government-grid">
        ${this.field('Exam Name', `examName${fieldIndex}`, { placeholder: 'Exam name you have appeared for' })}
        ${this.select('Year', `examYear${fieldIndex}`, years, { placeholder: 'Select the Year you gave the exam' })}
        ${this.field('Post', `examPost${fieldIndex}`, { placeholder: 'Exam Post' })}
        ${this.select('Exam Status', `examStatus${fieldIndex}`, ['Appeared In Prelims', 'Appeared In Mains', 'Appeared In Interview', 'Finally Passed The Exam'], { placeholder: 'Select Status' })}
      </div>
    `;
    list.appendChild(card);
    card.querySelector(`[name="examName${fieldIndex}"]`).value = values.examName || '';
    card.querySelector(`[name="examYear${fieldIndex}"]`).value = values.examYear || '';
    card.querySelector(`[name="examPost${fieldIndex}"]`).value = values.examPost || '';
    card.querySelector(`[name="examStatus${fieldIndex}"]`).value = values.examStatus || '';
    card.querySelector('.otr-remove-government-exam')?.addEventListener('click', () => {
      card.remove();
      this.renumberGovernmentExams();
    });
  },

  renumberGovernmentExams() {
    document.querySelectorAll('[data-government-exam]').forEach((card, index) => {
      const title = card.querySelector('.otr-government-head strong');
      const removeButton = card.querySelector('.otr-remove-government-exam');
      if (title) title.textContent = `Government Exam ${index + 1}`;
      removeButton?.setAttribute('aria-label', `Delete government exam ${index + 1}`);
    });
  },

  validateAll() {
    this.applyConditionalState();
    let valid = true;
    let firstInvalid = null;
    document.querySelectorAll('#otr-form input, #otr-form select, #otr-form textarea').forEach(field => {
      if (field.disabled || field.type === 'file') return;
      if (!field.checkValidity()) {
        valid = false;
        firstInvalid ||= field;
        this.setFieldError(field, this.validationMessage(field));
        this.openEducationCardFor(field);
      }
    });
    if (!this.uploadedPhoto) {
      valid = false;
      document.getElementById('otr-photo-error').textContent = 'Upload a passport-size photo before submitting.';
      document.getElementById('otr-upload-zone')?.classList.add('invalid');
      firstInvalid ||= document.getElementById('otr-upload-zone');
    }
    if (document.getElementById('otr-pincode')?.value.length === 6 && document.getElementById('otr-state')?.disabled) {
      valid = false;
      this.setFieldError(document.getElementById('otr-pincode'), 'Pincode is not available in the AMS location master.');
      firstInvalid ||= document.getElementById('otr-pincode');
    }
    if (!valid) {
      this.showAlert('Please complete the highlighted required fields before submitting.');
      firstInvalid?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus?.({ preventScroll: true });
    } else {
      this.hideAlert();
    }
    return valid;
  },

  validationMessage(field) {
    if (field.validity.valueMissing) return 'This field is required.';
    if (field.validity.typeMismatch) return field.type === 'email' ? 'Enter a valid email address.' : 'Enter a valid value.';
    if (field.validity.patternMismatch) return field.name === 'pincode' ? 'Enter a valid 6-digit pincode.' : 'Enter a valid 10-digit mobile number.';
    return 'Check this value and try again.';
  },

  setFieldError(field, message) {
    const wrap = field?.closest('[data-field-wrap]');
    if (!wrap) return;
    wrap.classList.add('invalid');
    const error = wrap.querySelector('.otr-field-error');
    if (error) error.textContent = message;
  },

  clearFieldError(field) {
    const wrap = field?.closest?.('[data-field-wrap]');
    if (!wrap) return;
    wrap.classList.remove('invalid');
    const error = wrap.querySelector('.otr-field-error');
    if (error) error.textContent = '';
  },

  handlePhoto(file) {
    const error = document.getElementById('otr-photo-error');
    document.getElementById('otr-upload-zone')?.classList.remove('invalid');
    if (error) error.textContent = '';
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg'];
    const extensionAllowed = /\.(pdf|jpe?g)$/i.test(file.name);
    if (!allowed.includes(file.type) && !extensionAllowed) {
      this.clearPhoto();
      if (error) error.textContent = 'Only PDF, JPG, and JPEG files are accepted.';
      document.getElementById('otr-upload-zone')?.classList.add('invalid');
      return;
    }
    if (file.size > 800 * 1024) {
      this.clearPhoto();
      if (error) error.textContent = 'File size must not exceed 800 KB.';
      document.getElementById('otr-upload-zone')?.classList.add('invalid');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.uploadedPhoto = { name: file.name, type: file.type || this.mimeFromName(file.name), size: file.size, dataUrl: reader.result };
      document.getElementById('otr-upload-empty').hidden = true;
      document.getElementById('otr-upload-file').hidden = false;
      document.getElementById('otr-file-name').textContent = file.name;
      document.getElementById('otr-file-meta').textContent = `${this.formatBytes(file.size)} · Ready to submit`;
    };
    reader.readAsDataURL(file);
  },

  clearPhoto() {
    this.uploadedPhoto = null;
    const input = document.getElementById('otr-passportPhoto');
    if (input) input.value = '';
    document.getElementById('otr-upload-empty').hidden = false;
    document.getElementById('otr-upload-file').hidden = true;
  },

  collectData() {
    const form = document.getElementById('otr-form');
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.passportPhoto;
    const achievements = Array.from(document.querySelectorAll('.otr-achievement-card')).map(card => ({
      title: card.querySelector('[name^="achievementTitle"]')?.value.trim() || '',
      year: card.querySelector('[name^="achievementYear"]')?.value || '',
      details: card.querySelector('[name^="achievementDetails"]')?.value.trim() || ''
    })).filter(item => item.title || item.year || item.details);
    const governmentExams = Array.from(document.querySelectorAll('[data-government-exam]')).map(card => ({
      examName: card.querySelector('[name^="examName"]')?.value.trim() || '',
      examYear: card.querySelector('[name^="examYear"]')?.value || '',
      examPost: card.querySelector('[name^="examPost"]')?.value.trim() || '',
      examStatus: card.querySelector('[name^="examStatus"]')?.value || ''
    })).filter(item => item.examName || item.examYear || item.examPost || item.examStatus);
    Object.keys(data).filter(key => key.startsWith('achievement')).forEach(key => delete data[key]);
    return {
      personal: this.pick(data, ['fullName', 'dateOfBirth', 'gender', 'religion', 'phone', 'differentWhatsapp', 'whatsapp', 'email']),
      address: this.pick(data, ['pincode', 'state', 'district', 'addressLine1', 'addressLine2']),
      education: {
        ssc: this.pickPrefixed(data, 'ssc'),
        hsc: this.pickPrefixed(data, 'hsc'),
        diploma: this.pickPrefixed(data, 'diploma'),
        bachelor: this.pickPrefixed(data, 'bachelor'),
        master: this.pickPrefixed(data, 'master')
      },
      achievements,
      satsang: this.pick(data, ['bapsConnected', 'weeklySabha', 'satsangRemark', 'mandal', 'shetra', 'karyakarName', 'karyakarNumber', 'mandir']),
      governmentExam: governmentExams,
      documents: { passportPhoto: this.uploadedPhoto }
    };
  },

  submit(event) {
    event.preventDefault();
    if (!this.validateAll()) return;
    const payload = this.collectData();
    const records = this.getRecords();
    const matchIndex = records.findIndex(record => record.personal.email.toLowerCase() === payload.personal.email.toLowerCase() || record.personal.phone === payload.personal.phone);
    const existing = matchIndex >= 0 ? records[matchIndex] : null;
    const admissionMatch = (window.APP_DATA?.AMS_STUDENTS || []).find(student =>
      student.email?.toLowerCase() === payload.personal.email.toLowerCase() || student.phone === payload.personal.phone
    );
    const sequence = String(records.length + 1).padStart(4, '0');
    const record = {
      ...payload,
      id: existing?.id || `OTR-${Date.now()}`,
      otrNo: this.normalizeOtrNo(existing?.otrNo || admissionMatch?.otrNo || `AMS-OTR-${new Date().getFullYear()}-${sequence}`),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusKey: 'form_submitted',
      status: 'Form Submitted'
    };
    if (matchIndex >= 0) records[matchIndex] = record;
    else records.push(record);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch (error) {
      this.showAlert('The photo could not be saved in AMS storage. Try a smaller file and submit again.');
      return;
    }
    window.AMSModule?.renderDashboard?.();
    window.AMSModule?.renderStudents?.();
    this.reset();
    if (typeof AMSApp !== 'undefined') AMSApp.showScreen('ams-students');
    this.showToast(`${record.otrNo} created for ${record.personal.fullName}.`);
  },

  reset() {
    document.getElementById('otr-form')?.reset();
    this.clearPhoto();
    document.getElementById('otr-achievement-list').innerHTML = '';
    this.addAchievement();
    document.getElementById('otr-government-list').innerHTML = '';
    this.governmentExamSequence = 0;
    this.addGovernmentExam();
    this.applyConditionalState();
    this.lookupPincode('');
    const sscCard = document.querySelector('[data-education-card="ssc"]');
    if (sscCard && !sscCard.classList.contains('open')) this.toggleEducationCard(sscCard);
    this.hideAlert();
    document.querySelector('.otr-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  getRecords() {
    try {
      const records = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      if (!Array.isArray(records)) return [];
      const allowedPersonalFields = ['fullName', 'dateOfBirth', 'gender', 'religion', 'phone', 'differentWhatsapp', 'whatsapp', 'email'];
      let changed = false;
      const sanitized = records.map(record => {
        if (!record || typeof record !== 'object') return record;
        const normalized = { ...record };
        const otrNo = this.normalizeOtrNo(normalized.otrNo || normalized.admissionNo);
        if (normalized.otrNo !== otrNo) {
          normalized.otrNo = otrNo;
          changed = true;
        }
        if (Object.prototype.hasOwnProperty.call(normalized, 'admissionNo')) {
          delete normalized.admissionNo;
          changed = true;
        }
        if (!normalized.personal) return normalized;
        const personal = Object.fromEntries(allowedPersonalFields.map(key => [key, normalized.personal[key] || '']));
        changed ||= Object.keys(normalized.personal).some(key => !allowedPersonalFields.includes(key));
        return { ...normalized, personal };
      });
      if (changed) localStorage.setItem(this.storageKey, JSON.stringify(sanitized));
      return sanitized;
    } catch (error) {
      return [];
    }
  },

  getStudentRows() {
    return this.getRecords().map(record => ({
      otrNo: record.otrNo,
      name: record.personal.fullName,
      phone: record.personal.phone,
      email: record.personal.email,
      city: record.address.addressLine2 || record.address.district,
      course: 'Course Not Assigned',
      batch: 'Pending Allocation',
      application: 'OTR Submitted',
      documents: '1/1 uploaded',
      scholarship: 'Not Applied',
      feeStatus: 'Not Started',
      paid: 0,
      total: 0,
      owner: 'Admission Desk',
      statusKey: record.statusKey || 'form_submitted',
      status: record.status || 'Form Submitted',
      leadStatus: 'Direct AMS OTR',
      sourceLeadNo: 'AMS Direct',
      nextStep: 'Review OTR details',
      dueDate: new Date(record.updatedAt).toLocaleDateString('en-IN'),
      otrId: record.id
    }));
  },

  normalizeOtrNo(value) {
    const otrNo = String(value || '').trim();
    if (/^ADM-\d{4}-/i.test(otrNo)) return otrNo.replace(/^ADM-/i, 'AMS-OTR-');
    if (/^OTR-\d{4}-/i.test(otrNo)) return `AMS-${otrNo}`;
    return otrNo;
  },

  openProfile(id) {
    const record = this.getRecords().find(item => item.id === id);
    const modal = document.getElementById('otr-profile-modal');
    const body = document.getElementById('otr-profile-body');
    if (!record || !modal || !body) return;
    document.getElementById('otr-profile-title').textContent = record.personal.fullName;
    const section = (title, icon, rows) => `
      <section class="otr-profile-section"><h3><i class="fas ${icon}"></i>${title}</h3><div class="otr-profile-grid">
        ${rows.map(([label, value]) => `<div><span>${this.escape(label)}</span><strong>${this.escape(value || '—')}</strong></div>`).join('')}
      </div></section>
    `;
    const educationRows = Object.entries(record.education || {}).flatMap(([level, fields]) => {
      const populated = Object.values(fields || {}).some(Boolean);
      return populated ? Object.entries(fields).map(([key, value]) => [`${this.titleCase(level)} · ${this.titleCase(key)}`, value]) : [];
    });
    const achievementRows = record.achievements?.length
      ? record.achievements.map((item, index) => [`Achievement ${index + 1}`, [item.title, item.year, item.details].filter(Boolean).join(' · ')])
      : [['Achievements', 'Not provided']];
    const governmentExams = Array.isArray(record.governmentExam)
      ? record.governmentExam
      : (record.governmentExam ? [record.governmentExam] : []);
    const governmentExamRows = governmentExams.flatMap((exam, index) => Object.entries(exam || {})
      .filter(([, value]) => value)
      .map(([key, value]) => [`Exam ${index + 1} · ${this.titleCase(key)}`, value]));
    body.innerHTML = `
      <div class="otr-profile-banner"><div class="otr-profile-avatar">${this.initials(record.personal.fullName)}</div><div><strong>${this.escape(record.otrNo)}</strong><span>Submitted ${new Date(record.updatedAt).toLocaleString('en-IN')}</span></div><span class="badge badge-primary">${this.escape(record.status)}</span></div>
      ${section('Personal Details', 'fa-user', Object.entries(record.personal).map(([key, value]) => [this.titleCase(key), value]))}
      ${section('Correspondence Address', 'fa-location-dot', Object.entries(record.address).map(([key, value]) => [this.titleCase(key), value]))}
      ${section('Education', 'fa-graduation-cap', educationRows.length ? educationRows : [['Education', 'Not provided']])}
      ${section('Achievements', 'fa-trophy', achievementRows)}
      ${section('Satsang', 'fa-hands-praying', Object.entries(record.satsang).map(([key, value]) => [this.titleCase(key), value]))}
      ${section('Government Exam', 'fa-landmark', governmentExamRows.length ? governmentExamRows : [['Government Exam', 'Not provided']])}
      ${section('Documents', 'fa-file-arrow-up', [['Passport-size Photo', record.documents.passportPhoto?.name], ['File Type', record.documents.passportPhoto?.type], ['File Size', this.formatBytes(record.documents.passportPhoto?.size || 0)]])}
    `;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('otr-profile-open');
  },

  closeProfile() {
    document.getElementById('otr-profile-modal')?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('otr-profile-open');
  },

  showAlert(message) {
    const alert = document.getElementById('otr-form-alert');
    if (!alert) return;
    alert.innerHTML = `<i class="fas fa-triangle-exclamation"></i><span>${this.escape(message)}</span>`;
    alert.hidden = false;
  },

  hideAlert() {
    const alert = document.getElementById('otr-form-alert');
    if (alert) alert.hidden = true;
  },

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'otr-toast';
    toast.innerHTML = `<i class="fas fa-circle-check"></i><div><strong>OTR submitted successfully</strong><span>${this.escape(message)}</span></div>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 4500);
  },

  pick(object, keys) {
    return Object.fromEntries(keys.map(key => [key, object[key] || '']));
  },

  pickPrefixed(object, prefix) {
    return Object.fromEntries(Object.entries(object).filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length).replace(/^./, char => char.toLowerCase()), value]));
  },

  radioValue(name) {
    return document.querySelector(`[name="${name}"]:checked`)?.value || '';
  },

  mimeFromName(name) {
    return /\.pdf$/i.test(name) ? 'application/pdf' : 'image/jpeg';
  },

  formatBytes(bytes) {
    if (!bytes) return '0 KB';
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  },

  titleCase(value) {
    return String(value).replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());
  },

  initials(name = '') {
    return name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  },

  escape(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  }
};

window.AMSOTR = AMSOTR;
document.addEventListener('DOMContentLoaded', () => AMSOTR.init());
