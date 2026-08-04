(function () {
  'use strict';

  const STORAGE_KEY = 'paAccountsFinanceV1';
  const SELECTED_STUDENT_KEY = 'paAccountsSelectedStudent';

  const DEFAULT_FEE_HEADS = [
    { id: 'admission-fees', name: 'Admission Fees', type: 'standard', refundable: false },
    { id: 'course-fees', name: 'Course Fees', type: 'standard', refundable: false },
    { id: 'security-deposit', name: 'Security Deposit', type: 'deposit', refundable: true },
    { id: 'fine', name: 'Fine', type: 'fine', refundable: false },
    { id: 'prayaschita', name: 'Prayaschita', type: 'special', refundable: false },
    { id: 'token-charge', name: 'Token Charge', type: 'token', refundable: false },
    { id: 'optional-fees', name: 'Optional Fees', type: 'optional', refundable: false },
    { id: 'special-fees', name: 'Special Fees', type: 'special', refundable: false }
  ];

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value == null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clean(value) {
    return String(value || '').trim();
  }

  function identity(student) {
    return [student.otrNo, student.admissionNo, student.email?.toLowerCase(), student.phone]
      .map(clean)
      .filter(Boolean);
  }

  function dateOnly(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? clean(value).slice(0, 10) : date.toISOString().slice(0, 10);
  }

  const AccountsData = {
    storageKey: STORAGE_KEY,
    selectedStudentKey: SELECTED_STUDENT_KEY,

    store() {
      const saved = readJson(STORAGE_KEY, {});
      return {
        version: 1,
        feeHeads: Array.isArray(saved.feeHeads) && saved.feeHeads.length ? saved.feeHeads : clone(DEFAULT_FEE_HEADS),
        accounts: saved.accounts && typeof saved.accounts === 'object' ? saved.accounts : {},
        receipts: Array.isArray(saved.receipts) ? saved.receipts : [],
        refunds: Array.isArray(saved.refunds) ? saved.refunds : []
      };
    },

    persist(store) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      window.dispatchEvent(new CustomEvent('accounts:data-change', { detail: { source: 'accounts' } }));
      return store;
    },

    feeHeads() {
      return this.store().feeHeads;
    },

    addFeeHead(name, type = 'custom') {
      const label = clean(name);
      if (!label) return null;
      const store = this.store();
      const id = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'fee'}-${Date.now()}`;
      const head = { id, name: label, type, refundable: false, custom: true };
      store.feeHeads.push(head);
      this.persist(store);
      return head;
    },

    otrRecords() {
      const records = readJson('paAMSOTRRecords', []);
      return Array.isArray(records) ? records.filter(Boolean) : [];
    },

    students() {
      const base = Array.isArray(window.APP_DATA?.AMS_STUDENTS) ? clone(window.APP_DATA.AMS_STUDENTS) : [];
      const records = this.otrRecords();
      const merged = [...base];

      records.forEach(record => {
        const personal = record.personal || {};
        const candidate = {
          otrId: record.id,
          otrNo: record.otrNo,
          name: personal.fullName,
          phone: personal.phone,
          email: personal.email,
          city: record.address?.addressLine2 || record.address?.district || '',
          state: record.address?.state || '',
          district: record.address?.district || '',
          course: record.course || '',
          batch: record.batch || '',
          learningMode: record.learningMode || record.mode || '',
          feesCategory: record.feesCategory || '',
          grNumber: record.grNumber || record.grNo || '',
          uid: record.uid || '',
          total: Number(record.total || 0),
          paid: Number(record.paid || 0),
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          statusKey: record.statusKey || 'form_submitted',
          status: record.status || 'Form Submitted',
          otrRecord: record
        };
        const keys = identity(candidate);
        const index = merged.findIndex(student => identity(student).some(key => keys.includes(key)));
        if (index < 0) merged.push(candidate);
        else merged[index] = {
          ...candidate,
          ...merged[index],
          otrId: merged[index].otrId || candidate.otrId,
          otrNo: merged[index].otrNo || candidate.otrNo,
          name: merged[index].name || candidate.name,
          phone: merged[index].phone || candidate.phone,
          email: merged[index].email || candidate.email,
          otrRecord: record
        };
      });

      return merged.map((student, index) => this.normalizeStudent(student, index));
    },

    normalizeStudent(student, index) {
      const record = student.otrRecord || (student.otrId ? this.otrRecords().find(item => item.id === student.otrId) : null);
      const personal = record?.personal || {};
      const address = record?.address || {};
      const admissionNo = clean(student.admissionNo || student.otrNo || student.sourceLeadNo).replace(/^AMS-OTR-/i, 'ADM-');
      const key = clean(student.otrId || student.key || admissionNo || student.email || student.phone || `AMS-STUDENT-${index}`);
      const account = this.store().accounts[key] || {};
      return {
        ...student,
        key,
        admissionNo,
        uid: clean(student.uid || personal.uid || admissionNo || student.otrNo),
        grNumber: clean(student.grNumber || student.grNo || record?.grNumber || record?.grNo),
        name: clean(student.name || personal.fullName),
        phone: clean(student.phone || personal.phone),
        email: clean(student.email || personal.email),
        course: clean(student.course || record?.course),
        batch: clean(student.batch || record?.batch),
        mode: clean(student.mode || student.learningMode || record?.learningMode || record?.mode),
        feesCategory: clean(student.feesCategory || record?.feesCategory || 'General'),
        admissionDate: dateOnly(student.admissionDate || student.createdAt || record?.createdAt),
        entryDate: dateOnly(account.entryDate || student.entryDate || student.updatedAt || record?.updatedAt || student.createdAt || record?.createdAt),
        total: Number(student.total || 0),
        paid: Number(student.paid || 0),
        address,
        otrRecord: record || null
      };
    },

    findStudent(value) {
      const needle = clean(value).toLowerCase();
      if (!needle) return null;
      return this.students().find(student => [student.key, student.uid, student.admissionNo, student.name, student.email, student.phone]
        .some(field => clean(field).toLowerCase() === needle)) || null;
    },

    selectedStudent() {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get('student') || localStorage.getItem(SELECTED_STUDENT_KEY) || '';
      const students = this.students();
      return this.findStudent(requested) || students[0] || null;
    },

    selectStudent(key) {
      if (key) localStorage.setItem(SELECTED_STUDENT_KEY, key);
    },

    defaultInstallments(student) {
      const dueDate = student.admissionDate || '';
      return this.feeHeads().filter(head => head.id !== 'prayaschita').map((head, index) => ({
        id: `${head.id}-1`,
        feeHeadId: head.id,
        feeHead: head.name,
        installment: index === 1 ? 'Course Fee - Installment 1' : head.name,
        amount: head.id === 'course-fees' ? Number(student.total || 0) : 0,
        paidAmount: head.id === 'course-fees' ? Number(student.paid || 0) : 0,
        dueDate,
        remark: '',
        waiver: false
      }));
    },

    accountFor(student) {
      if (!student) return null;
      const store = this.store();
      const existing = store.accounts[student.key] || {};
      return {
        studentKey: student.key,
        uid: student.uid,
        admissionNo: student.admissionNo,
        entryDate: existing.entryDate || new Date().toISOString(),
        installments: Array.isArray(existing.installments) && existing.installments.length
          ? existing.installments
          : this.defaultInstallments(student),
        specialStructures: existing.specialStructures || {},
        ...existing
      };
    },

    saveAccount(account) {
      const store = this.store();
      store.accounts[account.studentKey] = account;
      this.persist(store);
      return account;
    },

    nextReceiptNumber() {
      const store = this.store();
      return `ACC-RCPT-${new Date().getFullYear()}-${String(store.receipts.length + 1).padStart(5, '0')}`;
    },

    addReceipt(student, payload) {
      const store = this.store();
      const account = this.accountFor(student);
      const receipt = {
        id: `RCPT-${Date.now()}`,
        receiptNumber: payload.receiptNumber || this.nextReceiptNumber(),
        referenceNumber: clean(payload.referenceNumber),
        studentKey: student.key,
        uid: student.uid,
        admissionNo: student.admissionNo,
        items: payload.items.map(item => ({ ...item, amount: Number(item.amount || 0) })),
        totalAmount: payload.items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        paymentMode: payload.paymentMode,
        remark: clean(payload.remark),
        trustCompany: clean(payload.trustCompany),
        transactionReference: clean(payload.transactionReference),
        createdAt: new Date().toISOString()
      };

      receipt.items.forEach(item => {
        const installment = account.installments.find(row => row.id === item.installmentId);
        if (installment) installment.paidAmount = Number(installment.paidAmount || 0) + Number(item.amount || 0);
      });
      store.accounts[student.key] = account;
      store.receipts.push(receipt);
      this.persist(store);
      return receipt;
    },

    receiptsFor(studentKey) {
      return this.store().receipts.filter(receipt => receipt.studentKey === studentKey);
    },

    addRefund(student, payload) {
      const store = this.store();
      const account = this.accountFor(student);
      const receipt = store.receipts.find(item => item.studentKey === student.key && item.receiptNumber === payload.receiptNumber);
      const refund = {
        id: `REF-${Date.now()}`,
        studentKey: student.key,
        uid: student.uid,
        admissionNo: student.admissionNo,
        amount: Number(payload.amount || 0),
        mode: payload.mode,
        reason: clean(payload.reason),
        receiptNumber: clean(payload.receiptNumber),
        createdAt: new Date().toISOString()
      };
      let remaining = refund.amount;
      (receipt?.items || []).slice().reverse().forEach(item => {
        if (remaining <= 0) return;
        const installment = account.installments.find(row => row.id === item.installmentId);
        if (!installment) return;
        const refundable = Math.min(Number(item.amount || 0), Number(installment.paidAmount || 0), remaining);
        installment.paidAmount = Math.max(0, Number(installment.paidAmount || 0) - refundable);
        remaining -= refundable;
      });
      store.accounts[student.key] = account;
      store.refunds.push(refund);
      this.persist(store);
      return refund;
    },

    refundsFor(studentKey) {
      return this.store().refunds.filter(refund => refund.studentKey === studentKey);
    },

    saveSpecialStructure(student, structures) {
      const account = this.accountFor(student);
      account.specialStructures = structures;
      const retained = account.installments.filter(row => !row.specialStructure);
      const specialRows = Object.entries(structures).flatMap(([feeHeadId, structure]) =>
        (structure.installments || []).map((row, index) => ({
          id: row.id || `${feeHeadId}-${Date.now()}-${index}`,
          feeHeadId,
          feeHead: structure.name,
          installment: row.installment || `${structure.name} - Installment ${index + 1}`,
          amount: Number(row.calculatedAmount || 0),
          paidAmount: Number(row.paidAmount || 0),
          dueDate: row.dueDate || '',
          remark: row.remark || '',
          waiver: Boolean(row.waiver),
          specialStructure: true
        }))
      );
      account.installments = [...retained, ...specialRows];
      return this.saveAccount(account);
    }
  };

  window.AccountsData = AccountsData;
})();
