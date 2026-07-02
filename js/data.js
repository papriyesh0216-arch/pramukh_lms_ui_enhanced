// ============================================================
// DATA.JS — Mock Data for Lead Management System
// ============================================================

const LEAD_DATA = [
  {
    id: 1, enqNo: 'ENQ0002387', name: 'Rahul Patel', phone: '9876543210', whatsapp: '9876543210',
    email: 'rahulpatel@gmail.com', city: 'Ahmedabad, Gujarat', course: 'UPSC Foundation',
    mode: 'Classroom', source: 'Instagram Ad', campaign: 'UPSC May 2025',
    inquiryDate: '15 May 2025', owner: 'Bharat Sir', ownerTeam: 'UPSC Team',
    status: 'interested', statusLabel: 'Interested', priority: 'high',
    leadScore: 85, leadAge: '2 Days', academicStatus: 'Graduation Running',
    query: 'Details about foundation batch & fees.', assignedTo: 'Bharat Sir',
    assignedDate: '15-05-2026 10:26 AM', timeAgo: '2 min ago', isHot: true,
    followupDate: '18 May 2025', followupTime: '11:00 AM', followupType: 'Call',
    followupPurpose: 'Share batch structure, demo class & fee options.',
    stage: 2, stageLabel: 'Counselling',
    communications: [
      { type: 'call', day: '15', month: 'May', title: 'Voice Call (Connected)', desc: 'Spoke with student, interested in Foundation batch.', time: '10:20 AM', by: 'Bharat Sir' },
      { type: 'whatsapp', day: '15', month: 'May', title: 'WhatsApp Message', desc: 'Brochure & fee details sent.', time: '10:35 AM', by: 'Bharat Sir' },
      { type: 'email', day: '15', month: 'May', title: 'Email Sent', desc: 'UPSC Foundation Brochure & Syllabus sent.', time: '10:45 AM', by: 'Bharat Sir' },
      { type: 'meeting', day: '14', month: 'May', title: 'Counselling Session (Completed)', desc: 'Counselling done at 11:00 AM. Student showing interest.', time: '11:00 AM', by: 'Bharat Sir' },
      { type: 'call', day: '12', month: 'May', title: 'Voice Call (Connected)', desc: 'Initial inquiry call. Student wants details.', time: '04:15 PM', by: 'Bharat Sir' },
    ]
  },
  {
    id: 2, enqNo: 'ENQ1921', name: 'Naimesh', phone: '98795133', whatsapp: '98795133',
    email: 'naimesh22481@gmail.com', city: '-', course: 'GPSC (Class 1 & 2) - Foundation',
    mode: 'Residential Mode', source: 'Website', campaign: '-',
    inquiryDate: '25-06-2026 02:16 PM', owner: 'Apurva Mahipatbhai Jani', ownerTeam: 'Admin',
    status: 'pending', statusLabel: 'Pending', priority: 'medium',
    leadScore: 60, leadAge: '0 Days', academicStatus: 'Graduation Completed',
    query: 'B.Sc. Agriculture.', assignedTo: 'Apurva Mahipatbhai Jani',
    assignedDate: '25-06-2026 02:16 PM', timeAgo: '19 min ago', isHot: false,
    stage: 0, stageLabel: 'New',
    communications: []
  },
  {
    id: 3, enqNo: 'ENQ1922', name: 'Banoth Mahesh', phone: '9520986849', whatsapp: '9520986849',
    email: 'mahesh.banoth@gmail.com', city: '-', course: 'UPSC Foundation',
    mode: 'Walk-in', source: 'Walk-in', campaign: '-',
    inquiryDate: '25-06-2026 01:57 PM', owner: 'Jignesh Trivedi', ownerTeam: 'Admin',
    status: 'pending', statusLabel: 'Pending', priority: 'medium',
    leadScore: 55, leadAge: '0 Days', academicStatus: 'Graduation Completed',
    query: 'Details about UPSC Foundation.', assignedTo: 'Jignesh Trivedi',
    assignedDate: '25-06-2026 01:57 PM', timeAgo: '38 min ago', isHot: false,
    stage: 0, stageLabel: 'New',
    communications: []
  },
  {
    id: 4, enqNo: 'ENQ1903', name: 'Neha Joshi', phone: '9876011124', whatsapp: '9876011124',
    email: 'neha.joshi@gmail.com', city: 'Surat, Gujarat', course: 'GPSC Class 1-2',
    mode: 'Online', source: 'Website', campaign: 'Google SEO',
    inquiryDate: '14 May 2025', owner: 'Vivek Sir', ownerTeam: 'GPSC Team',
    status: 'contacted', statusLabel: 'Contacted', priority: 'medium',
    leadScore: 72, leadAge: '5 Days', academicStatus: 'Graduation Completed',
    query: 'Batch schedule and fee details.', assignedTo: 'Vivek Sir',
    assignedDate: '14-05-2025 09:15 AM', timeAgo: '5 hrs ago', isHot: false,
    stage: 1, stageLabel: 'Contacted',
    communications: [
      { type: 'call', day: '14', month: 'May', title: 'Voice Call (Connected)', desc: 'Discussed batch schedule.', time: '09:15 AM', by: 'Vivek Sir' }
    ]
  },
  {
    id: 5, enqNo: 'ENQ1889', name: 'Hardik Patel', phone: '9876512345', whatsapp: '9876512345',
    email: 'hardik.patel@gmail.com', city: 'Vadodara, Gujarat', course: 'UPSC Foundation',
    mode: 'Classroom', source: 'Google Ads', campaign: 'UPSC May 2025',
    inquiryDate: '13 May 2025', owner: 'Bharat Sir', ownerTeam: 'UPSC Team',
    status: 'interested', statusLabel: 'Interested', priority: 'high',
    leadScore: 90, leadAge: '6 Days', academicStatus: 'Graduation Completed',
    query: 'Admission process and scholarship.', assignedTo: 'Bharat Sir',
    assignedDate: '13-05-2025 11:10 AM', timeAgo: '1 day ago', isHot: true,
    stage: 3, stageLabel: 'Form Sent',
    communications: [
      { type: 'meeting', day: '13', month: 'May', title: 'Counselling Done', desc: 'Counselling session completed.', time: '11:10 AM', by: 'Bharat Sir' }
    ]
  },
  {
    id: 6, enqNo: 'ENQ1875', name: 'Sneha Desai', phone: '9876323466', whatsapp: '9876323466',
    email: 'sneha.desai@gmail.com', city: 'Rajkot, Gujarat', course: 'Sankalp Programme',
    mode: 'Classroom', source: 'Seminar', campaign: 'Sankalp Seminar',
    inquiryDate: '13 Apr 2025', owner: 'Pooja Shah', ownerTeam: 'Sankalp Team',
    status: 'contacted', statusLabel: 'Contacted', priority: 'low',
    leadScore: 68, leadAge: '12 Days', academicStatus: 'HSC Running',
    query: 'Hostel facility available?', assignedTo: 'Pooja Shah',
    assignedDate: '13-04-2025 04:30 PM', timeAgo: '2 days ago', isHot: false,
    stage: 1, stageLabel: 'Contacted',
    communications: []
  },
  {
    id: 7, enqNo: 'ENQ1950', name: 'Mehul Shah', phone: '9876001122', whatsapp: '9876001122',
    email: 'mehul.shah@gmail.com', city: 'Ahmedabad, Gujarat', course: 'UPSC Foundation',
    mode: 'Classroom', source: 'Website Inquiry Form', campaign: 'UPSC July 2026',
    inquiryDate: '27-06-2026 10:30 AM', owner: 'Hary Sir', ownerTeam: 'UPSC Team',
    status: 'followup', statusLabel: 'Follow-up', priority: 'medium',
    leadScore: 76, leadAge: '1 Day', academicStatus: 'Graduation Running',
    query: 'Needs counselling for weekday batch timing.', assignedTo: 'Hary Sir',
    assignedDate: '27-06-2026 10:45 AM', timeAgo: '1 hr ago', isHot: false,
    followupDate: '28-06-2026', followupTime: '04:00 PM', followupType: 'Call',
    followupPurpose: 'Confirm batch timing and scholarship eligibility.',
    stage: 3, stageLabel: 'Follow-up',
    communications: [
      { type: 'call', day: '27', month: 'Jun', title: 'Initial Call Connected', desc: 'Student asked for UPSC weekday batch details.', time: '10:50 AM', by: 'Hary Sir' }
    ]
  },
];

const COUNSELOR_DATA = [
  { name: 'Bharat Sir', initials: 'BS', color: '#4F6EF7', assigned: 120, contacted: 98, interested: 45, admissions: 18, rate: 15 },
  { name: 'Vivek Sir', initials: 'VS', color: '#10B981', assigned: 95, contacted: 78, interested: 32, admissions: 12, rate: 12.6 },
  { name: 'Pooja Shah', initials: 'PS', color: '#F59E0B', assigned: 80, contacted: 65, interested: 28, admissions: 9, rate: 11.3 },
  { name: 'Apurva Jani', initials: 'AJ', color: '#8B5CF6', assigned: 65, contacted: 50, interested: 20, admissions: 7, rate: 10.8 },
  { name: 'Jignesh Trivedi', initials: 'JT', color: '#F97316', assigned: 55, contacted: 42, interested: 18, admissions: 5, rate: 9.1 },
  { name: 'Hary Sir', initials: 'HS', color: '#0EA5E9', assigned: 42, contacted: 30, interested: 14, admissions: 4, rate: 9.5 },
];

const FOLLOWUP_CALENDAR_DATA = {
  '2026-06-15': { pending: 5, overdue: 2, followup: 8, completed: 3 },
  '2026-06-16': { pending: 3, overdue: 1, followup: 5, completed: 7 },
  '2026-06-18': { pending: 8, overdue: 0, followup: 12, completed: 4 },
  '2026-06-20': { pending: 2, overdue: 3, followup: 6, completed: 9 },
  '2026-06-23': { pending: 6, overdue: 1, followup: 9, completed: 5 },
  '2026-06-25': { pending: 4, overdue: 2, followup: 7, completed: 6 },
  '2026-06-26': { pending: 19, overdue: 3, followup: 11, completed: 6 },
  '2026-06-27': { pending: 7, overdue: 0, followup: 14, completed: 0 },
  '2026-06-28': { pending: 5, overdue: 1, followup: 8, completed: 0 },
};

const SEGMENTATION_DATA = [
  { label: 'UPSC', value: 42, color: '#4F6EF7' },
  { label: 'GPSC', value: 28, color: '#10B981' },
  { label: 'Sankalp', value: 15, color: '#F59E0B' },
  { label: 'IAS/IPS', value: 10, color: '#8B5CF6' },
  { label: 'Others', value: 5, color: '#94A3B8' },
];

const SEGMENT_DATA = [
  {
    id: 1,
    name: 'UPSC Aspirants',
    description: 'Candidates for UPSC courses and walk-in prospects.',
    criteria: 'Course = UPSC Foundation OR Source = Walk-in',
    leadIds: [1, 3, 5],
    createdAt: '26 Jun 2026',
    archived: false,
    assignedUsers: ['Bharat Sir'],
  },
  {
    id: 2,
    name: 'GPSC Campaign',
    description: 'GPSC leads from website and ads.',
    criteria: 'Course contains GPSC OR Source = Instagram Ad',
    leadIds: [2, 4],
    createdAt: '25 Jun 2026',
    archived: false,
    assignedUsers: ['Vivek Sir'],
  },
  {
    id: 3,
    name: 'Sankalp Seminar',
    description: 'Seminar leads to be nurtured for Sankalp.',
    criteria: 'Course = Sankalp Programme AND Source = Seminar',
    leadIds: [6],
    createdAt: '24 Jun 2026',
    archived: false,
    assignedUsers: ['Pooja Shah'],
  },
  {
    id: 4,
    name: 'Interview Prep',
    description: 'Leads preparing for interview rounds.',
    criteria: 'Source = Website AND Status = Interested',
    leadIds: [2, 5],
    createdAt: '23 Jun 2026',
    archived: false,
    assignedUsers: [],
  },
  {
    id: 5,
    name: 'First-Time Visitors',
    description: 'Recent inquiries from first-time website visitors.',
    criteria: 'Source = Website AND LeadAge < 2 Days',
    leadIds: [1, 6],
    createdAt: '22 Jun 2026',
    archived: false,
    assignedUsers: [],
  },
  {
    id: 6,
    name: 'GPSC High Priority',
    description: 'High-priority GPSC candidates from ads.',
    criteria: 'Course = GPSC Class 1-2 AND Priority = High',
    leadIds: [4],
    createdAt: '21 Jun 2026',
    archived: true,
    assignedUsers: ['Admission Lead'],
  },
  {
    id: 7,
    name: 'Sankalp Seminar Follow-up',
    description: 'Seminar attendees requiring follow-up.',
    criteria: 'Source = Seminar AND Course = Sankalp Programme',
    leadIds: [6],
    createdAt: '20 Jun 2026',
    archived: true,
    assignedUsers: [],
  },
  {
    id: 8,
    name: 'Older Admission Pool',
    description: 'Previously active leads now archived.',
    criteria: 'LeadAge > 14 Days',
    leadIds: [5],
    createdAt: '18 Jun 2026',
    archived: true,
    assignedUsers: [],
  }
];

const FUNNEL_DATA = [
  { label: 'Total Leads', count: 2350, pct: 100, color: '#4F6EF7' },
  { label: 'Contacted', count: 1876, pct: 79.8, color: '#06B6D4' },
  { label: 'Interested', count: 987, pct: 42.0, color: '#10B981' },
  { label: 'Counselled', count: 423, pct: 18.0, color: '#F59E0B' },
  { label: 'Admission', count: 94, pct: 4.0, color: '#EF4444' },
];

const STATUS_DISTRIBUTION = [
  { label: 'New', count: 987, pct: 42, color: '#4F6EF7' },
  { label: 'Contacted', count: 564, pct: 24, color: '#06B6D4' },
  { label: 'Interested', count: 423, pct: 18, color: '#10B981' },
  { label: 'Counselling', count: 235, pct: 10, color: '#8B5CF6' },
  { label: 'Admission', count: 94, pct: 4, color: '#F59E0B' },
  { label: 'Lost', count: 47, pct: 2, color: '#EF4444' },
];

window.APP_DATA = { LEAD_DATA, COUNSELOR_DATA, FOLLOWUP_CALENDAR_DATA, SEGMENTATION_DATA, SEGMENT_DATA, FUNNEL_DATA, STATUS_DISTRIBUTION };
