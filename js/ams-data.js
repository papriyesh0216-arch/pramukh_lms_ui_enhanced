// ============================================================
// AMS-DATA.JS - AMS records generated from shortlisted LMS leads
// ============================================================

const AMS_STATUS_FLOW = [
  { key: 'otr_pending', stageKey: 'otr', stage: 'OTR Form', label: 'Pending', icon: 'fa-file-pen' },
  { key: 'otr_draft', stageKey: 'otr', stage: 'OTR Form', label: 'Draft', icon: 'fa-file' },
  { key: 'otr_submitted', stageKey: 'otr', stage: 'OTR Form', label: 'Submitted', icon: 'fa-file-signature' },
  { key: 'course_selection', stageKey: 'course_selection', stage: 'Course Selection', label: '', icon: 'fa-book-open' },
  { key: 'exam_mcq', stageKey: 'exam', stage: 'Exam', label: 'MCQ Stage', icon: 'fa-list-check' },
  { key: 'exam_descriptive', stageKey: 'exam', stage: 'Exam', label: 'Descriptive Stage', icon: 'fa-pen-to-square' },
  { key: 'exam_submitted', stageKey: 'exam', stage: 'Exam', label: 'Submitted', icon: 'fa-paper-plane' },
  { key: 'interview_academic', stageKey: 'interview', stage: 'Interview Stage', label: 'Academic', icon: 'fa-graduation-cap' },
  { key: 'interview_personality', stageKey: 'interview', stage: 'Interview Stage', label: 'Personality', icon: 'fa-user-check' },
  { key: 'interview_overall', stageKey: 'interview', stage: 'Interview Stage', label: 'Overall', icon: 'fa-clipboard-check' },
  { key: 'fees_pending', stageKey: 'fees_pending', stage: 'Fees Pending', label: '', icon: 'fa-receipt' },
  { key: 'admission_confirmed', stageKey: 'confirmed', stage: 'Admission Confirmed', label: '', icon: 'fa-user-graduate' },
  { key: 'application_rejected', stageKey: 'closed', stage: 'Admission Closed', label: 'Application Rejected', icon: 'fa-circle-xmark' },
  { key: 'declined_by_student', stageKey: 'closed', stage: 'Admission Closed', label: 'Declined by Student', icon: 'fa-user-slash' }
];

const AMS_OTR_SAMPLE_RECORDS = [
  {
    id: 'OTR-SAMPLE-001',
    otrNo: 'PA260015',
    createdAt: '2026-07-12T05:30:00.000Z',
    updatedAt: '2026-07-12T05:30:00.000Z',
    statusKey: 'otr_submitted',
    status: 'Submitted',
    personal: {
      fullName: 'Aarav Patel',
      dateOfBirth: '2002-08-14',
      gender: 'Male',
      religion: 'Hindu',
      phone: '9000000001',
      differentWhatsapp: 'No',
      whatsapp: '',
      email: 'aarav.patel@example.com'
    },
    address: {
      pincode: '380015',
      state: 'Gujarat',
      district: 'Ahmedabad',
      addressLine1: 'B-204, Shyam Residency',
      addressLine2: 'Satellite, Ahmedabad'
    },
    education: {
      ssc: { board: 'GSEB', medium: 'Gujarati', passingYear: '2018', result: '82.40%' },
      hsc: { board: 'GSEB', stream: 'Arts', medium: 'Gujarati', passingYear: '2020', result: '78.20%' },
      diploma: { university: '', stream: '', medium: '', passingYear: '', result: '' },
      bachelor: { university: 'Gujarat University', stream: 'Arts', medium: 'English', passingYear: '2023', result: '7.8 CGPA' },
      master: { university: '', stream: '', medium: '', passingYear: '', result: '' }
    },
    achievements: [
      { title: 'District Debate Winner', year: '2022', details: 'First position in the district-level youth debate competition.' },
      { title: 'NSS Volunteer', year: '2023', details: 'Completed 120 hours of community service.' }
    ],
    satsang: {
      bapsConnected: 'Yes',
      weeklySabha: 'Yes',
      satsangRemark: 'Attends weekly Yuvak Sabha regularly.',
      mandal: 'Satellite Yuvak Mandal',
      shetra: 'Ahmedabad West',
      karyakarName: 'Mehul Shah',
      karyakarNumber: '9000000101',
      mandir: 'BAPS Swaminarayan Mandir, Shahibaug'
    },
    governmentExam: {
      examName: 'GPSC Class 1-2',
      examYear: '2025',
      examPost: 'Section Officer',
      examStatus: 'Appeared In Prelims'
    },
    documents: {
      passportPhoto: { name: 'aarav-patel-photo.jpg', type: 'image/jpeg', size: 184320, dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2Q==' }
    }
  },
  {
    id: 'OTR-SAMPLE-002',
    otrNo: 'PA260016',
    createdAt: '2026-07-13T06:15:00.000Z',
    updatedAt: '2026-07-13T06:15:00.000Z',
    statusKey: 'otr_submitted',
    status: 'Submitted',
    personal: {
      fullName: 'Diya Shah',
      dateOfBirth: '2001-11-23',
      gender: 'Female',
      religion: 'Jain',
      phone: '9000000002',
      differentWhatsapp: 'Yes',
      whatsapp: '9000000202',
      email: 'diya.shah@example.com'
    },
    address: {
      pincode: '390007',
      state: 'Gujarat',
      district: 'Vadodara',
      addressLine1: '18, Akota Avenue',
      addressLine2: 'Akota, Vadodara'
    },
    education: {
      ssc: { board: 'CBSE', medium: 'English', passingYear: '2017', result: '91.20%' },
      hsc: { board: 'CBSE', stream: 'Commerce', medium: 'English', passingYear: '2019', result: '88.60%' },
      diploma: { university: '', stream: '', medium: '', passingYear: '', result: '' },
      bachelor: { university: 'The Maharaja Sayajirao University of Baroda', stream: 'Commerce', medium: 'English', passingYear: '2022', result: '8.4 CGPA' },
      master: { university: 'The Maharaja Sayajirao University of Baroda', stream: 'Management', medium: 'English', passingYear: '2024', result: '8.7 CGPA' }
    },
    achievements: [
      { title: 'University Merit List', year: '2022', details: 'Ranked among the top ten students in the commerce faculty.' }
    ],
    satsang: {
      bapsConnected: 'No',
      weeklySabha: '',
      satsangRemark: '',
      mandal: '',
      shetra: '',
      karyakarName: '',
      karyakarNumber: '',
      mandir: ''
    },
    governmentExam: {
      examName: 'UPSC Civil Services',
      examYear: '2025',
      examPost: 'Civil Services',
      examStatus: 'Appeared In Mains'
    },
    documents: {
      passportPhoto: { name: 'diya-shah-photo.jpeg', type: 'image/jpeg', size: 212992, dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2Q==' }
    }
  },
  {
    id: 'OTR-SAMPLE-003',
    otrNo: 'PA260017',
    createdAt: '2026-07-14T08:45:00.000Z',
    updatedAt: '2026-07-14T08:45:00.000Z',
    statusKey: 'otr_submitted',
    status: 'Submitted',
    personal: {
      fullName: 'Krish Mehta',
      dateOfBirth: '2000-03-09',
      gender: 'Male',
      religion: 'Hindu',
      phone: '9000000003',
      differentWhatsapp: 'No',
      whatsapp: '',
      email: 'krish.mehta@example.com'
    },
    address: {
      pincode: '395007',
      state: 'Gujarat',
      district: 'Surat',
      addressLine1: '42, Green Park Society',
      addressLine2: 'Vesu, Surat'
    },
    education: {
      ssc: { board: 'GSEB', medium: 'English', passingYear: '2016', result: '86.00%' },
      hsc: { board: 'GSEB', stream: 'Science', medium: 'English', passingYear: '2018', result: '81.50%' },
      diploma: { university: 'Gujarat Technological University', stream: 'Engineering', medium: 'English', passingYear: '2021', result: '8.1 CGPA' },
      bachelor: { university: 'Gujarat Technological University', stream: 'Engineering', medium: 'English', passingYear: '2024', result: '8.3 CGPA' },
      master: { university: '', stream: '', medium: '', passingYear: '', result: '' }
    },
    achievements: [],
    satsang: {
      bapsConnected: 'Yes',
      weeklySabha: 'No',
      satsangRemark: 'Connected through family satsang activities.',
      mandal: 'Vesu Yuvak Mandal',
      shetra: 'Surat South',
      karyakarName: 'Jignesh Patel',
      karyakarNumber: '9000000103',
      mandir: 'BAPS Swaminarayan Mandir, Surat'
    },
    governmentExam: {
      examName: 'SSC CGL',
      examYear: '2024',
      examPost: 'Assistant Section Officer',
      examStatus: 'Appeared In Interview'
    },
    documents: {
      passportPhoto: { name: 'krish-mehta-photo.pdf', type: 'application/pdf', size: 245760, dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==' }
    }
  }
];

const AMS_SHORTLISTED_LEAD_CONFIG = {
  1: {
    statusKey: 'otr_pending',
    application: 'OTR Form - Pending',
    documents: '0/6 verified',
    feeStatus: 'Not Started',
    paid: 0,
    total: 85000,
    scholarship: 'Merit 10%',
    batch: 'UPSC July Morning',
    nextStep: 'Send OTR form',
    dueDate: '04 Jul 2026'
  },
  4: {
    statusKey: 'interview_academic',
    application: 'OTR Form - Submitted',
    documents: '2/6 verified',
    feeStatus: 'Token Pending',
    paid: 0,
    total: 62000,
    scholarship: 'Not Applied',
    batch: 'GPSC Weekend',
    nextStep: 'Verify marksheet and ID proof',
    dueDate: '05 Jul 2026'
  },
  5: {
    statusKey: 'fees_pending',
    application: 'Fees Pending',
    documents: '6/6 verified',
    feeStatus: 'Balance Due',
    paid: 45000,
    total: 125000,
    scholarship: 'Need Based 15%',
    batch: 'UPSC Residential',
    nextStep: 'Collect first installment',
    dueDate: '03 Jul 2026'
  },
  7: {
    statusKey: 'course_selection',
    application: 'Fee Plan Confirmed',
    documents: '6/6 verified',
    feeStatus: 'Installment 1 Paid',
    paid: 35000,
    total: 85000,
    scholarship: 'Not Applied',
    batch: 'Pending Allocation',
    nextStep: 'Allocate course batch',
    dueDate: '08 Jul 2026'
  }
};

function isLeadAdmissionShortlisted(lead) {
  const admissionStatuses = [
    'admission_process',
    'converted',
    'exam',
    'interview',
    'admission_confirmed',
    'admission_rejected'
  ];
  return Boolean(
    AMS_SHORTLISTED_LEAD_CONFIG[lead.id] ||
    lead.shortlistedForAdmission ||
    admissionStatuses.includes((lead.status || '').toLowerCase())
  );
}

function courseFee(course = '') {
  if (/gpsc/i.test(course)) return 62000;
  if (/sankalp/i.test(course)) return 54000;
  return 85000;
}

function normalizeCourse(course = '') {
  if (/gpsc/i.test(course)) return 'GPSC Class 1-2';
  if (/sankalp/i.test(course)) return 'Sankalp Programme';
  return 'UPSC Foundation';
}

function defaultAdmissionConfig(lead) {
  const confirmed = ['admission_confirmed', 'converted'].includes((lead.status || '').toLowerCase());
  const rejected = (lead.status || '').toLowerCase() === 'admission_rejected';
  return {
    statusKey: rejected ? 'application_rejected' : confirmed ? 'admission_confirmed' : 'otr_pending',
    application: rejected ? 'Application Rejected' : confirmed ? 'Admission Confirmed' : 'OTR Form - Pending',
    documents: confirmed ? '6/6 verified' : rejected ? 'Verification stopped' : '0/6 verified',
    feeStatus: confirmed ? 'Paid' : rejected ? 'Closed' : 'Not Started',
    paid: confirmed ? courseFee(lead.course) : 0,
    total: courseFee(lead.course),
    scholarship: 'Not Applied',
    batch: confirmed ? `${normalizeCourse(lead.course)} Active Batch` : 'Pending Allocation',
    nextStep: confirmed ? 'Orientation checklist' : 'Send OTR form',
    dueDate: '08 Jul 2026'
  };
}

function buildAdmissionRowsFromLeads(leads = []) {
  return leads
    .filter(isLeadAdmissionShortlisted)
    .map((lead, index) => {
      const config = {
        ...defaultAdmissionConfig(lead),
        ...(AMS_SHORTLISTED_LEAD_CONFIG[lead.id] || {})
      };
      const status = AMS_STATUS_FLOW.find(item => item.key === config.statusKey) || AMS_STATUS_FLOW[0];
      return {
        leadId: lead.id,
        sourceLeadNo: lead.enqNo,
        leadStatus: lead.statusLabel,
        otrNo: /^PA\d{6}$/i.test(String(lead.otrNo || ''))
          ? String(lead.otrNo).toUpperCase()
          : `PA26${String(index + 1).padStart(4, '0')}`,
        enquiryId: lead.enqNo,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        gender: lead.gender || (index % 2 ? 'Female' : 'Male'),
        city: lead.city,
        course: normalizeCourse(lead.course),
        learningMode: lead.learningMode || lead.mode || 'Offline',
        hostelStatus: lead.hostelStatus || ((lead.learningMode || lead.mode) === 'Online' ? 'Not Applicable' : (index % 2 ? 'Without Hostel' : 'With Hostel')),
        createdAt: lead.createdAt || lead.inquiryDate || '2026-07-01T09:00:00.000Z',
        owner: lead.assignedTo || lead.owner || 'Admission Desk',
        statusKey: status.key,
        status: status.label,
        ...config
      };
    });
}

function getStoredAdmissionShortlist() {
  try {
    return JSON.parse(localStorage.getItem('paAdmissionShortlist') || '[]');
  } catch (e) {
    return [];
  }
}

function mergeLeadSources(baseLeads = [], storedLeads = []) {
  const byId = new Map();
  baseLeads.forEach(lead => byId.set(lead.id, lead));
  storedLeads.forEach(lead => byId.set(lead.id, { ...(byId.get(lead.id) || {}), ...lead }));
  return Array.from(byId.values());
}

// The shortlist is a persisted AMS intake handoff. Never fall back to the
// live LMS Inquiry dataset from this standalone AMS entry point.
const AMS_SOURCE_LEADS = mergeLeadSources([], getStoredAdmissionShortlist());
const AMS_STUDENTS = buildAdmissionRowsFromLeads(AMS_SOURCE_LEADS);

const AMS_PIPELINE = [...new Map(AMS_STATUS_FLOW.map(status => [status.stageKey, status])).values()]
  .filter(stage => stage.stageKey !== 'closed')
  .map(stage => {
    const count = AMS_STUDENTS.filter(student => (AMS_STATUS_FLOW.find(status => status.key === student.statusKey)?.stageKey || 'otr') === stage.stageKey).length;
    return {
      label: stage.stage,
      count,
      pct: AMS_STUDENTS.length ? Math.max(8, Math.round((count / AMS_STUDENTS.length) * 100)) : 0,
      icon: stage.icon,
      key: stage.stageKey
    };
  });

window.APP_DATA = {
  ...(window.APP_DATA || {}),
  AMS_STATUS_FLOW,
  AMS_STUDENTS,
  AMS_PIPELINE,
  AMS_OTR_SAMPLE_RECORDS
};
