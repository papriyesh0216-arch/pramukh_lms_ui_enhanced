// ============================================================
// AMS-DATA.JS - AMS records generated from shortlisted LMS leads
// ============================================================

const AMS_STATUS_FLOW = [
  { key: 'form_pending', label: 'Form Pending', icon: 'fa-file-pen' },
  { key: 'form_submitted', label: 'Form Submitted', icon: 'fa-file-signature' },
  { key: 'document_verification', label: 'Document Verification', icon: 'fa-folder-open' },
  { key: 'fee_pending', label: 'Fee Pending', icon: 'fa-receipt' },
  { key: 'batch_allocation', label: 'Batch Allocation', icon: 'fa-users-rectangle' },
  { key: 'onboarded', label: 'Onboarded', icon: 'fa-user-graduate' },
  { key: 'rejected', label: 'Rejected', icon: 'fa-circle-xmark' }
];

const AMS_SHORTLISTED_LEAD_CONFIG = {
  1: {
    statusKey: 'form_pending',
    application: 'Shortlisted - Form Pending',
    documents: '0/6 verified',
    feeStatus: 'Not Started',
    paid: 0,
    total: 85000,
    scholarship: 'Merit 10%',
    batch: 'UPSC July Morning',
    nextStep: 'Send admission form',
    dueDate: '04 Jul 2026'
  },
  4: {
    statusKey: 'document_verification',
    application: 'Form Submitted',
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
    statusKey: 'fee_pending',
    application: 'Application Approved',
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
    statusKey: 'batch_allocation',
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
    statusKey: rejected ? 'rejected' : confirmed ? 'onboarded' : 'form_pending',
    application: rejected ? 'Rejected by admission team' : confirmed ? 'Student Created' : 'Shortlisted - Form Pending',
    documents: confirmed ? '6/6 verified' : rejected ? 'Verification stopped' : '0/6 verified',
    feeStatus: confirmed ? 'Paid' : rejected ? 'Closed' : 'Not Started',
    paid: confirmed ? courseFee(lead.course) : 0,
    total: courseFee(lead.course),
    scholarship: 'Not Applied',
    batch: confirmed ? `${normalizeCourse(lead.course)} Active Batch` : 'Pending Allocation',
    nextStep: confirmed ? 'Orientation checklist' : 'Send admission form',
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
        admissionNo: `ADM-2026-${String(148 + index).padStart(4, '0')}`,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        course: normalizeCourse(lead.course),
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

const AMS_SOURCE_LEADS = mergeLeadSources(window.APP_DATA?.LEAD_DATA || [], getStoredAdmissionShortlist());
const AMS_STUDENTS = buildAdmissionRowsFromLeads(AMS_SOURCE_LEADS);

const AMS_PIPELINE = AMS_STATUS_FLOW
  .filter(stage => stage.key !== 'rejected')
  .map(stage => {
    const count = AMS_STUDENTS.filter(student => student.statusKey === stage.key).length;
    return {
      label: stage.label,
      count,
      pct: AMS_STUDENTS.length ? Math.max(8, Math.round((count / AMS_STUDENTS.length) * 100)) : 0,
      icon: stage.icon,
      key: stage.key
    };
  });

window.APP_DATA = {
  ...(window.APP_DATA || {}),
  AMS_STATUS_FLOW,
  AMS_STUDENTS,
  AMS_PIPELINE
};
