(function () {
  'use strict';

  const AccountsApp = {
    route: 'r1',
    r2Action: 'payment',
    student: null,
    students: [],
    specialSelected: new Set(),
    expandedStructures: new Set(),
    lastReceipt: null,

    init() {
      this.students = window.AccountsData.students();
      this.student = window.AccountsData.selectedStudent();
      if (this.student) window.AccountsData.selectStudent(this.student.key);
      this.bindEvents();
      this.applyTheme();
      this.show('r1');
    },

    bindEvents() {
      document.addEventListener('click', event => this.handleClick(event));
      document.addEventListener('change', event => this.handleChange(event));
      document.addEventListener('input', event => this.handleInput(event));
      document.getElementById('accounts-backdrop')?.addEventListener('click', () => this.toggleNavigation(false));
      document.getElementById('accounts-mobile-menu')?.addEventListener('click', () => this.toggleNavigation());
      document.getElementById('accounts-dialog')?.addEventListener('click', event => {
        if (event.target.id === 'accounts-dialog' || event.target.closest('[data-dialog-close]')) this.closeDialog();
      });
      document.getElementById('accounts-payment-layer')?.addEventListener('click', event => {
        if (event.target.id === 'accounts-payment-layer') this.closePaymentPopup();
      });
      document.getElementById('accounts-special-layer')?.addEventListener('click', event => {
        if (event.target.id === 'accounts-special-layer') this.closeSpecialPopup();
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          if (document.getElementById('accounts-dialog')?.getAttribute('aria-hidden') === 'false') this.closeDialog();
          else if (this.isSpecialOpen()) this.closeSpecialPopup();
          else if (this.isPaymentOpen()) this.closePaymentPopup();
          this.toggleNavigation(false);
        }
      });
      window.addEventListener('accounts:data-change', () => {
        this.students = window.AccountsData.students();
      });
    },

    handleClick(event) {
      if (event.target.closest('[data-close-payment]')) return this.closePaymentPopup();
      if (event.target.closest('[data-close-special]')) return this.closeSpecialPopup();
      if (event.target.closest('[data-accounts-theme]')) return this.toggleTheme();
      const action = event.target.closest('[data-accounts-action]')?.dataset.accountsAction;
      if (action) return this.action(action);
      const quick = event.target.closest('[data-r2-action]')?.dataset.r2Action;
      if (quick) return this.showR2Action(quick);
      const toggle = event.target.closest('[data-structure-toggle]')?.dataset.structureToggle;
      if (toggle) return this.toggleStructure(toggle);
      const add = event.target.closest('[data-add-installment]')?.dataset.addInstallment;
      if (add) return this.addSpecialInstallment(add);
      const remove = event.target.closest('[data-remove-installment]');
      if (remove) return this.removeSpecialInstallment(remove);
    },

    handleChange(event) {
      if (event.target.matches('[data-student-select]')) return this.selectStudent(event.target.value);
      if (event.target.matches('[data-r1-select], [data-r1-amount], [data-r1-due]')) return this.syncR1();
      if (event.target.matches('[data-special-head]')) return this.toggleSpecialHead(event.target.value, event.target.checked);
      if (event.target.closest('[data-special-row]')) return this.calculateSpecialRow(event.target.closest('[data-special-row]'));
    },

    handleInput(event) {
      if (event.target.matches('[data-r1-amount]')) return this.syncR1();
      if (event.target.closest('[data-special-row]')) return this.calculateSpecialRow(event.target.closest('[data-special-row]'));
    },

    show() {
      if (!this.student && this.students.length) this.student = this.students[0];
      this.route = 'r1';
      const title = document.getElementById('accounts-page-title');
      if (title) title.textContent = 'Fees Receipt';
      const root = document.getElementById('accounts-root');
      if (!root) return;
      root.innerHTML = !this.student ? this.emptyState() : this.renderR1();
      if (this.student) this.syncR1();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    isPaymentOpen() {
      return document.getElementById('accounts-payment-layer')?.getAttribute('aria-hidden') === 'false';
    },

    isSpecialOpen() {
      return document.getElementById('accounts-special-layer')?.getAttribute('aria-hidden') === 'false';
    },

    openPaymentPopup(options = {}) {
      const layer = document.getElementById('accounts-payment-layer');
      const body = document.getElementById('accounts-payment-body');
      if (!layer || !body || !this.student) return;
      if (body.dataset.studentKey !== this.student.key || !body.children.length) {
        body.innerHTML = this.renderR2();
        body.dataset.studentKey = this.student.key;
      }
      layer.setAttribute('aria-hidden', 'false');
      const shell = document.querySelector('.accounts-shell');
      if (shell) shell.inert = true;
      document.body.classList.add('accounts-layer-open', 'accounts-payment-open');
      if (options.highlightSpecial) {
        body.querySelector('[data-r2-action="special"]')?.focus();
        this.toast('Use Special Fees inside the Payment popup to open its structure.', 'success');
      }
    },

    closePaymentPopup() {
      if (this.isSpecialOpen()) this.closeSpecialPopup();
      document.getElementById('accounts-payment-layer')?.setAttribute('aria-hidden', 'true');
      const shell = document.querySelector('.accounts-shell');
      const paymentPanel = document.querySelector('#accounts-payment-layer .accounts-layer-panel');
      if (shell) shell.inert = false;
      if (paymentPanel) paymentPanel.inert = false;
      document.body.classList.remove('accounts-payment-open', 'accounts-layer-open');
    },

    openSpecialPopup() {
      const layer = document.getElementById('accounts-special-layer');
      const body = document.getElementById('accounts-special-body');
      if (!layer || !body || !this.student || !this.isPaymentOpen()) return;
      if (body.dataset.studentKey !== this.student.key || !body.children.length) {
        body.innerHTML = this.renderR3();
        body.dataset.studentKey = this.student.key;
        this.initializeSpecialState(body);
      }
      layer.setAttribute('aria-hidden', 'false');
      const paymentPanel = document.querySelector('#accounts-payment-layer .accounts-layer-panel');
      if (paymentPanel) paymentPanel.inert = true;
      document.body.classList.add('accounts-layer-open', 'accounts-special-open');
    },

    closeSpecialPopup() {
      document.getElementById('accounts-special-layer')?.setAttribute('aria-hidden', 'true');
      const paymentPanel = document.querySelector('#accounts-payment-layer .accounts-layer-panel');
      if (paymentPanel) paymentPanel.inert = false;
      document.body.classList.remove('accounts-special-open');
      if (!this.isPaymentOpen()) document.body.classList.remove('accounts-layer-open');
    },

    emptyState() {
      return '<section class="accounts-card accounts-empty"><i class="fas fa-user-graduate"></i><strong>No AMS student records are available</strong><span>Create or shortlist a student in AMS, then return to Accounts.</span><div style="margin-top:16px"><a class="accounts-btn primary" href="ams.html">Open AMS</a></div></section>';
    },

    renderR1() {
      const student = this.student;
      const account = window.AccountsData.accountFor(student);
      const receipts = window.AccountsData.receiptsFor(student.key);
      const refunds = window.AccountsData.refundsFor(student.key);
      const receiptNumber = window.AccountsData.nextReceiptNumber();
      const collected = receipts.reduce((sum, receipt) => sum + Number(receipt.totalAmount || 0), 0)
        - refunds.reduce((sum, refund) => sum + Number(refund.amount || 0), 0);
      const total = account.installments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
      return [
        '<section class="accounts-view" data-view="r1">',
          '<div class="accounts-page-head">',
            '<div><h2>Fees Receipt</h2><p>Create an admission-linked receipt for fee collection, deposits, fines, token charges, optional fees, and special fees.</p></div>',
            '<div class="accounts-page-actions"><button class="accounts-btn primary" type="button" data-accounts-action="new-receipt"><i class="fas fa-plus"></i> New Receipt</button></div>',
          '</div>',
          this.studentCard(),
          '<section class="accounts-card">',
            '<div class="accounts-card-head"><h3><i class="fas fa-bolt"></i> Main Actions</h3></div>',
            '<div class="accounts-card-body accounts-action-grid">',
              this.actionTile('online-payment', 'fa-credit-card', 'Online Payment', 'Open the payment workflow'),
              this.actionTile('fee-head-group', 'fa-layer-group', 'Fees Head Group', 'Add or manage fee heads'),
              this.actionTile('optional-fees', 'fa-square-plus', 'Optional Fees Head', 'Include an optional charge'),
              this.actionTile('special-fees', 'fa-wand-magic-sparkles', 'Special Fees', 'Configure a student structure'),
            '</div>',
          '</section>',
          '<section class="accounts-card">',
            '<div class="accounts-card-head"><h3><i class="fas fa-file-invoice"></i> Receipt Information</h3><span class="accounts-connection">' + receipts.length + ' previous receipt' + (receipts.length === 1 ? '' : 's') + '</span></div>',
            '<div class="accounts-card-body accounts-form-grid">',
              this.field('Receipt Number', 'receiptNumber', receiptNumber, 'text', 'readonly'),
              this.field('Reference Number', 'referenceNumber', '', 'text', 'placeholder="Bank / gateway / manual reference"'),
            '</div>',
          '</section>',
          '<section class="accounts-card">',
            '<div class="accounts-card-head"><h3><i class="fas fa-list-check"></i> Fees Installments</h3><span>Select the heads to collect</span></div>',
            '<div class="accounts-table-wrap"><table class="accounts-table"><thead><tr><th>Fees Installment Head</th><th>Amount</th><th>Paid</th><th>Net Amount</th><th>Select</th><th>Due Date</th></tr></thead><tbody>',
              account.installments.map(row => this.r1Row(row)).join(''),
            '</tbody></table></div>',
          '</section>',
          '<section class="accounts-card">',
            '<div class="accounts-card-head"><h3><i class="fas fa-calculator"></i> Collection Summary</h3></div>',
            '<div class="accounts-card-body accounts-summary-grid">',
              this.summaryCard('Total Amount', total, ''),
              this.summaryCard('Collection', collected, ''),
              this.summaryCard('Payment', 0, 'primary', 'r1-payment-total'),
            '</div>',
          '</section>',
          '<section class="accounts-card">',
            '<div class="accounts-card-head"><h3><i class="fas fa-wallet"></i> Payment Details</h3></div>',
            '<div class="accounts-card-body accounts-form-grid">',
              this.selectField('Payment Mode', 'paymentMode', ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Online Gateway'], true),
              '<label class="accounts-field span-2"><span>Remark</span><textarea name="remark" id="r1-remark" placeholder="Add collection notes"></textarea></label>',
            '</div>',
            '<div class="accounts-footer-actions">',
              '<button class="accounts-btn secondary" type="button" data-accounts-action="cancel-r1">Cancel</button>',
              '<button class="accounts-btn secondary" type="button" data-accounts-action="save-print-r1"><i class="fas fa-print"></i> Save and Print</button>',
              '<button class="accounts-btn primary" type="button" data-accounts-action="save-r1"><i class="fas fa-floppy-disk"></i> Save</button>',
            '</div>',
          '</section>',
        '</section>'
      ].join('');
    },

    studentCard() {
      const s = this.student;
      return [
        '<section class="accounts-card">',
          '<div class="accounts-card-head"><h3><i class="fas fa-user-graduate"></i> Student Information</h3><span class="accounts-connection"><i class="fas fa-database"></i> AMS Record</span></div>',
          '<div class="accounts-card-body accounts-student-strip">',
            '<label class="accounts-field"><span>Search / Select Student</span><select data-student-select>' + this.studentOptions() + '</select></label>',
            this.readOnlyField('UID', s.uid),
            this.readOnlyField('Admission Number', s.admissionNo),
            this.readOnlyField('GR Number', s.grNumber || 'Not assigned'),
          '</div>',
          '<div class="accounts-student-summary">',
            this.info('Student Name', s.name),
            this.info('Date of Admission', this.formatDate(s.admissionDate)),
            this.info('Course / Programme', s.course || 'Not assigned'),
            this.info('Batch', s.batch || 'Not allocated'),
            this.info('Fees Category', s.feesCategory),
            this.info('Email ID', s.email),
            this.info('Contact Number', s.phone),
            this.info('Entry Date', this.formatDate(s.entryDate)),
          '</div>',
        '</section>'
      ].join('');
    },

    r1Row(row) {
      const net = Math.max(0, Number(row.amount || 0) - Number(row.paidAmount || 0));
      return '<tr data-r1-row="' + this.escape(row.id) + '" data-fee-head-id="' + this.escape(row.feeHeadId) + '">' +
        '<td><strong>' + this.escape(row.installment || row.feeHead) + '</strong><br><small>' + this.escape(row.feeHead) + '</small></td>' +
        '<td><input type="number" min="0" step="0.01" value="' + Number(row.amount || 0) + '" data-r1-amount aria-label="Amount for ' + this.escape(row.feeHead) + '"></td>' +
        '<td class="money">' + this.money(row.paidAmount) + '</td>' +
        '<td class="money" data-r1-net>' + this.money(net) + '</td>' +
        '<td><input class="accounts-checkbox" type="checkbox" data-r1-select ' + (net > 0 ? '' : 'disabled') + ' aria-label="Select ' + this.escape(row.feeHead) + '"></td>' +
        '<td><input type="date" value="' + this.escape(row.dueDate || '') + '" data-r1-due aria-label="Due date for ' + this.escape(row.feeHead) + '"></td>' +
      '</tr>';
    },

    syncR1() {
      let payment = 0;
      document.querySelectorAll('[data-r1-row]').forEach(row => {
        const amount = Math.max(0, Number(row.querySelector('[data-r1-amount]')?.value || 0));
        const paidText = row.children[2]?.textContent || '';
        const paid = Number(paidText.replace(/[^0-9.-]/g, '')) || 0;
        const net = Math.max(0, amount - paid);
        const select = row.querySelector('[data-r1-select]');
        const netCell = row.querySelector('[data-r1-net]');
        if (netCell) netCell.textContent = this.money(net);
        if (select) {
          select.disabled = net <= 0;
          if (net <= 0) select.checked = false;
          if (select.checked) payment += net;
        }
      });
      const total = document.getElementById('r1-payment-total');
      if (total) total.textContent = this.money(payment);
    },

    saveR1(printAfter) {
      const rows = [...document.querySelectorAll('[data-r1-row]')];
      const account = window.AccountsData.accountFor(this.student);
      rows.forEach(row => {
        const installment = account.installments.find(item => item.id === row.dataset.r1Row);
        if (installment) {
          installment.amount = Math.max(0, Number(row.querySelector('[data-r1-amount]')?.value || 0));
          installment.dueDate = row.querySelector('[data-r1-due]')?.value || '';
        }
      });
      window.AccountsData.saveAccount(account);
      const items = rows.filter(row => row.querySelector('[data-r1-select]')?.checked).map(row => {
        const installment = account.installments.find(item => item.id === row.dataset.r1Row);
        return {
          installmentId: installment.id,
          feeHeadId: installment.feeHeadId,
          feeHead: installment.feeHead,
          installment: installment.installment,
          amount: Math.max(0, Number(installment.amount || 0) - Number(installment.paidAmount || 0))
        };
      }).filter(item => item.amount > 0);
      const paymentMode = document.querySelector('[name="paymentMode"]')?.value || '';
      if (!items.length) return this.toast('Select at least one installment with an outstanding amount.', 'error');
      if (!paymentMode) return this.toast('Select a payment mode before saving.', 'error');
      this.lastReceipt = window.AccountsData.addReceipt(this.student, {
        receiptNumber: document.querySelector('[name="receiptNumber"]')?.value,
        referenceNumber: document.querySelector('[name="referenceNumber"]')?.value,
        paymentMode,
        remark: document.getElementById('r1-remark')?.value,
        items
      });
      this.toast(this.lastReceipt.receiptNumber + ' saved successfully.', 'success');
      this.show('r1');
      if (printAfter) window.setTimeout(() => window.print(), 120);
    },

    renderR2() {
      const s = this.student;
      const nextReceipt = window.AccountsData.nextReceiptNumber();
      return [
        '<section class="accounts-view accounts-popup-view" data-popup-view="payment">',
          '<div class="accounts-page-head"><div><h2>Payment</h2><p>Record and review student payments, collections, refunds, and receipts without leaving the Fees Receipt form.</p></div></div>',
          '<div class="accounts-payment-layout"><div class="accounts-view">',
            '<section class="accounts-card"><div class="accounts-card-head"><h3><i class="fas fa-file-invoice-dollar"></i> Receipt Information</h3></div><div class="accounts-card-body accounts-form-grid">',
              this.field('Entry Number', 'entryNumber', 'AUTO', 'text', 'readonly'),
              this.field('Receipt Number', 'r2ReceiptNumber', nextReceipt, 'text', 'readonly'),
            '</div></section>',
            '<section class="accounts-card"><div class="accounts-card-head"><h3><i class="fas fa-graduation-cap"></i> Academic Details</h3></div><div class="accounts-card-body accounts-form-grid">',
              this.readOnlyField('Exam', s.course || 'Not assigned'),
              this.readOnlyField('Course', s.course || 'Not assigned'),
              this.readOnlyField('Learning Mode', s.mode || 'Not assigned'),
              this.readOnlyField('Batch', s.batch || 'Not allocated'),
            '</div></section>',
            '<section class="accounts-card"><div class="accounts-card-head"><h3><i class="fas fa-id-card"></i> Student Identification</h3></div><div class="accounts-card-body accounts-form-grid">',
              this.readOnlyField('UID', s.uid),
              '<label class="accounts-field span-2"><span>Search Student</span><select data-student-select>' + this.studentOptions() + '</select></label>',
              this.readOnlyField('Admission Number', s.admissionNo),
            '</div></section>',
            '<section class="accounts-card"><div class="accounts-card-head"><h3><i class="fas fa-building"></i> Trust Company</h3></div><div class="accounts-card-body accounts-form-grid">',
              this.selectField('Trust Company', 'trustCompany', ['Pramukh Academy Trust', 'Pramukh Education Foundation'], true),
            '</div></section>',
            '<section class="accounts-card" id="r2-workspace">' + this.renderR2Workspace() + '</section>',
          '</div>',
          '<aside class="accounts-card accounts-quick-panel"><div class="accounts-card-head"><h3><i class="fas fa-bolt"></i> Quick Actions</h3></div><div class="accounts-quick-actions">',
            this.quickAction('payment', 'fa-credit-card', 'Payment'),
            this.quickAction('collection', 'fa-list-check', 'Collection Details'),
            this.quickAction('refund', 'fa-rotate-left', 'Fees Refund'),
            this.quickAction('refund-detail', 'fa-clock-rotate-left', 'Fees Refund Detail'),
            this.quickAction('print-last', 'fa-print', 'Print Last Receipt'),
            this.quickAction('reset', 'fa-arrow-rotate-right', 'Reset'),
            this.quickAction('special', 'fa-layer-group', 'Special Fees'),
          '</div></aside></div>',
        '</section>'
      ].join('');
    },

    renderR2Workspace() {
      if (this.r2Action === 'collection') return this.collectionWorkspace();
      if (this.r2Action === 'refund') return this.refundWorkspace();
      if (this.r2Action === 'refund-detail') return this.refundDetailWorkspace();
      return this.paymentWorkspace();
    },

    paymentWorkspace() {
      const account = window.AccountsData.accountFor(this.student);
      const outstanding = account.installments.reduce((sum, row) => sum + Math.max(0, Number(row.amount || 0) - Number(row.paidAmount || 0)), 0);
      return '<div class="accounts-card-head"><h3><i class="fas fa-credit-card"></i> Payment</h3><span class="accounts-connection" data-payment-outstanding>Outstanding ' + this.money(outstanding) + '</span></div>' +
        '<div class="accounts-card-body accounts-form-grid">' +
          this.field('Payment Amount', 'r2Amount', outstanding || '', 'number', 'min="0.01" step="0.01" placeholder="0.00" data-payment-amount data-suggested="' + outstanding + '"') +
          this.selectField('Payment Mode', 'r2PaymentMode', ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Online Gateway'], true) +
          this.field('Transaction Reference', 'r2TransactionReference', '', 'text', 'placeholder="Reference number"') +
          '<label class="accounts-field span-2"><span>Remark</span><textarea name="r2Remark" placeholder="Payment notes"></textarea></label>' +
        '</div><div class="accounts-footer-actions"><button class="accounts-btn primary" type="button" data-accounts-action="record-r2-payment"><i class="fas fa-floppy-disk"></i> Record Payment</button></div>';
    },

    collectionWorkspace() {
      const receipts = window.AccountsData.receiptsFor(this.student.key).slice().reverse();
      return '<div class="accounts-card-head"><h3><i class="fas fa-list-check"></i> Collection Details</h3></div>' +
        (receipts.length ? '<div class="accounts-table-wrap"><table class="accounts-table"><thead><tr><th>Receipt</th><th>Date</th><th>Mode</th><th>Reference</th><th>Amount</th></tr></thead><tbody>' +
          receipts.map(receipt => '<tr><td><strong>' + this.escape(receipt.receiptNumber) + '</strong></td><td>' + this.formatDateTime(receipt.createdAt) + '</td><td>' + this.escape(receipt.paymentMode) + '</td><td>' + this.escape(receipt.referenceNumber || '—') + '</td><td class="money">' + this.money(receipt.totalAmount) + '</td></tr>').join('') +
        '</tbody></table></div>' : this.inlineEmpty('No collections have been recorded for this student.'));
    },

    refundWorkspace() {
      const receipts = window.AccountsData.receiptsFor(this.student.key).slice().reverse();
      return '<div class="accounts-card-head"><h3><i class="fas fa-rotate-left"></i> Fees Refund</h3></div><div class="accounts-card-body accounts-form-grid">' +
        '<label class="accounts-field"><span>Receipt Number</span><select name="refundReceipt"><option value="">Select receipt</option>' + receipts.map(receipt => '<option value="' + this.escape(receipt.receiptNumber) + '">' + this.escape(receipt.receiptNumber) + ' · ' + this.money(receipt.totalAmount) + '</option>').join('') + '</select></label>' +
        this.field('Refund Amount', 'refundAmount', '', 'number', 'min="0.01" step="0.01" placeholder="0.00"') +
        this.selectField('Refund Mode', 'refundMode', ['Cash', 'UPI', 'Bank Transfer', 'Cheque'], true) +
        '<label class="accounts-field span-2"><span>Reason</span><textarea name="refundReason" placeholder="Reason for refund"></textarea></label>' +
        '</div><div class="accounts-footer-actions"><button class="accounts-btn danger" type="button" data-accounts-action="record-refund"><i class="fas fa-rotate-left"></i> Record Refund</button></div>';
    },

    refundDetailWorkspace() {
      const refunds = window.AccountsData.refundsFor(this.student.key).slice().reverse();
      return '<div class="accounts-card-head"><h3><i class="fas fa-clock-rotate-left"></i> Fees Refund Detail</h3></div>' +
        (refunds.length ? '<div class="accounts-table-wrap"><table class="accounts-table"><thead><tr><th>Refund ID</th><th>Date</th><th>Receipt</th><th>Mode</th><th>Reason</th><th>Amount</th></tr></thead><tbody>' +
          refunds.map(refund => '<tr><td><strong>' + this.escape(refund.id) + '</strong></td><td>' + this.formatDateTime(refund.createdAt) + '</td><td>' + this.escape(refund.receiptNumber || '—') + '</td><td>' + this.escape(refund.mode) + '</td><td>' + this.escape(refund.reason || '—') + '</td><td class="money">' + this.money(refund.amount) + '</td></tr>').join('') +
        '</tbody></table></div>' : this.inlineEmpty('No fee refunds have been recorded for this student.'));
    },

    showR2Action(action) {
      if (action === 'print-last') return this.printLastReceipt();
      if (action === 'reset') {
        this.r2Action = 'payment';
        const body = document.getElementById('accounts-payment-body');
        if (body) body.innerHTML = this.renderR2();
        this.toast('Payment form reset.', 'success');
        return;
      }
      if (action === 'special') return this.openSpecialPopup();
      this.r2Action = action;
      this.refreshPaymentWorkspace();
    },

    refreshPaymentWorkspace() {
      const body = document.getElementById('accounts-payment-body');
      const workspace = body?.querySelector('#r2-workspace');
      if (workspace) workspace.innerHTML = this.renderR2Workspace();
      body?.querySelectorAll('[data-r2-action]').forEach(button =>
        button.classList.toggle('active', button.dataset.r2Action === this.r2Action)
      );
    },

    refreshPaymentFinancials() {
      const account = window.AccountsData.accountFor(this.student);
      const outstanding = account.installments.reduce((sum, row) => sum + Math.max(0, Number(row.amount || 0) - Number(row.paidAmount || 0)), 0);
      const label = document.querySelector('#accounts-payment-body [data-payment-outstanding]');
      if (label) label.textContent = 'Outstanding ' + this.money(outstanding);
      const amount = document.querySelector('#accounts-payment-body [data-payment-amount]');
      if (amount) {
        const previousSuggestion = Number(amount.dataset.suggested || 0);
        if (!amount.value || Number(amount.value) === previousSuggestion) amount.value = String(outstanding || '');
        amount.dataset.suggested = String(outstanding);
      }
    },

    recordR2Payment() {
      const amount = Number(document.querySelector('[name="r2Amount"]')?.value || 0);
      const mode = document.querySelector('[name="r2PaymentMode"]')?.value || '';
      const account = window.AccountsData.accountFor(this.student);
      if (!(amount > 0)) return this.toast('Enter a payment amount greater than zero.', 'error');
      if (!mode) return this.toast('Select a payment mode.', 'error');
      let remaining = amount;
      const items = [];
      account.installments.forEach(row => {
        const due = Math.max(0, Number(row.amount || 0) - Number(row.paidAmount || 0));
        const applied = Math.min(due, remaining);
        if (applied > 0) items.push({ installmentId: row.id, feeHeadId: row.feeHeadId, feeHead: row.feeHead, installment: row.installment, amount: applied });
        remaining -= applied;
      });
      if (!items.length || remaining > 0.009) return this.toast('Payment exceeds the current outstanding amount.', 'error');
      this.lastReceipt = window.AccountsData.addReceipt(this.student, {
        receiptNumber: document.querySelector('[name="r2ReceiptNumber"]')?.value,
        transactionReference: document.querySelector('[name="r2TransactionReference"]')?.value,
        paymentMode: mode,
        trustCompany: document.querySelector('[name="trustCompany"]')?.value,
        remark: document.querySelector('[name="r2Remark"]')?.value,
        items
      });
      this.toast(this.lastReceipt.receiptNumber + ' payment recorded.', 'success');
      this.r2Action = 'collection';
      this.refreshPaymentWorkspace();
      this.refreshPrimaryAfterFinancialChange();
    },

    recordRefund() {
      const receiptNumber = document.querySelector('[name="refundReceipt"]')?.value || '';
      const amount = Number(document.querySelector('[name="refundAmount"]')?.value || 0);
      const mode = document.querySelector('[name="refundMode"]')?.value || '';
      if (!receiptNumber) return this.toast('Select the receipt to refund.', 'error');
      if (!(amount > 0)) return this.toast('Enter a refund amount greater than zero.', 'error');
      const receipt = window.AccountsData.receiptsFor(this.student.key).find(item => item.receiptNumber === receiptNumber);
      const alreadyRefunded = window.AccountsData.refundsFor(this.student.key).filter(item => item.receiptNumber === receiptNumber).reduce((sum, item) => sum + item.amount, 0);
      if (!receipt || amount > receipt.totalAmount - alreadyRefunded) return this.toast('Refund exceeds the refundable receipt balance.', 'error');
      if (!mode) return this.toast('Select a refund mode.', 'error');
      window.AccountsData.addRefund(this.student, {
        receiptNumber,
        amount,
        mode,
        reason: document.querySelector('[name="refundReason"]')?.value
      });
      this.toast('Refund recorded successfully.', 'success');
      this.r2Action = 'refund-detail';
      this.refreshPaymentWorkspace();
      this.refreshPrimaryAfterFinancialChange();
    },

    printLastReceipt() {
      const receipts = window.AccountsData.receiptsFor(this.student.key);
      if (!receipts.length) return this.toast('There is no receipt to print for this student.', 'error');
      this.lastReceipt = receipts[receipts.length - 1];
      this.r2Action = 'collection';
      this.refreshPaymentWorkspace();
      window.setTimeout(() => window.print(), 120);
    },

    renderR3() {
      const account = window.AccountsData.accountFor(this.student);
      const savedIds = Object.keys(account.specialStructures || {});
      if (!this.specialSelected.size) ['fine', 'security-deposit', 'prayaschita', 'token-charge', ...savedIds].forEach(id => this.specialSelected.add(id));
      const heads = window.AccountsData.feeHeads();
      return [
        '<section class="accounts-view accounts-popup-view" data-popup-view="special-fees">',
          '<div class="accounts-page-head"><div><h2>Special Fees Structure</h2><p>Configure student-specific amounts, discounts, waivers, and installments above the active Payment popup.</p></div></div>',
          this.studentCard(),
          '<div class="accounts-banner"><i class="fas fa-circle-info"></i><div><strong>Amount calculation rules</strong><ul><li>New Amount directly sets the calculated amount when provided.</li><li>Discounted Percentage is applied to the Template Amount when New Amount is blank.</li><li>When both values are provided, New Amount has priority.</li><li>Waiver sets the calculated amount to zero while retaining the original values for audit.</li></ul></div></div>',
          '<section class="accounts-card"><div class="accounts-card-head"><h3><i class="fas fa-tags"></i> Fees Head Panel</h3><button class="accounts-btn secondary" type="button" data-accounts-action="fee-head-group"><i class="fas fa-plus"></i> Add Fee Head</button></div><div class="accounts-card-body accounts-fee-heads">',
            heads.map(head => '<label class="accounts-fee-head-choice"><input type="checkbox" value="' + this.escape(head.id) + '" data-special-head ' + (this.specialSelected.has(head.id) ? 'checked' : '') + '><span>' + this.escape(head.name) + (head.refundable ? ' — Refundable' : '') + '</span></label>').join(''),
          '</div></section>',
          '<div id="special-structures">' + this.renderSpecialStructures() + '</div>',
          '<section class="accounts-card"><div class="accounts-footer-actions"><button class="accounts-btn secondary" type="button" data-close-special>Cancel</button><button class="accounts-btn primary" type="button" data-accounts-action="save-special"><i class="fas fa-floppy-disk"></i> Save Structure</button></div></section>',
        '</section>'
      ].join('');
    },

    initializeSpecialState(scope = document) {
      scope.querySelectorAll('[data-special-row]').forEach(row => this.calculateSpecialRow(row));
    },

    renderSpecialStructures() {
      const account = window.AccountsData.accountFor(this.student);
      return window.AccountsData.feeHeads().filter(head => this.specialSelected.has(head.id)).map(head => {
        const saved = account.specialStructures?.[head.id];
        const rows = saved?.installments?.length ? saved.installments : [this.blankSpecialRow(head, 0)];
        const collapsed = this.expandedStructures.has(head.id) ? '' : '';
        return '<section class="accounts-structure ' + collapsed + '" data-structure="' + this.escape(head.id) + '">' +
          '<button class="accounts-structure-head" type="button" data-structure-toggle="' + this.escape(head.id) + '"><span><i class="fas fa-folder-open"></i>' + this.escape(head.name) + (head.refundable ? ' — Refundable' : '') + '</span><i class="fas fa-chevron-up"></i></button>' +
          '<div class="accounts-structure-body"><div class="accounts-table-wrap"><table class="accounts-table accounts-special-table"><thead><tr><th>Installment</th><th>Template Amount</th><th>Original Amount</th><th>Paid Amount</th><th>Discount Amount</th><th>New Amount to Be Taken</th><th>Discounted %</th><th>Calculated Amount</th><th>Remark</th><th>Is Waiver</th><th></th></tr></thead><tbody>' +
          rows.map((row, index) => this.specialRow(head, row, index)).join('') +
          '</tbody></table></div><div class="accounts-special-tools"><span></span><button class="accounts-btn secondary" type="button" data-add-installment="' + this.escape(head.id) + '"><i class="fas fa-plus"></i> Add More Installments</button></div></div>' +
        '</section>';
      }).join('');
    },

    blankSpecialRow(head, index) {
      const accountRow = window.AccountsData.accountFor(this.student).installments.find(row => row.feeHeadId === head.id);
      return {
        id: head.id + '-' + Date.now() + '-' + index,
        installment: head.name + ' - Installment ' + (index + 1),
        templateAmount: Number(accountRow?.amount || 0),
        originalAmount: Number(accountRow?.amount || 0),
        paidAmount: Number(accountRow?.paidAmount || 0),
        newAmount: '',
        discountedPercentage: '',
        calculatedAmount: Number(accountRow?.amount || 0),
        remark: '',
        waiver: false
      };
    },

    specialRow(head, row, index) {
      const original = Number(row.originalAmount ?? row.templateAmount ?? 0);
      const calculated = this.specialCalculation(row);
      return '<tr data-special-row data-head-id="' + this.escape(head.id) + '" data-row-id="' + this.escape(row.id || head.id + '-' + index) + '">' +
        '<td><input name="installment" value="' + this.escape(row.installment || head.name + ' - Installment ' + (index + 1)) + '"></td>' +
        '<td><input name="templateAmount" type="number" min="0" step="0.01" value="' + Number(row.templateAmount || 0) + '"></td>' +
        '<td><input name="originalAmount" type="number" min="0" step="0.01" value="' + original + '"></td>' +
        '<td><input name="paidAmount" type="number" min="0" step="0.01" value="' + Number(row.paidAmount || 0) + '"></td>' +
        '<td class="money" data-discount-amount>' + this.money(Math.max(0, original - calculated)) + '</td>' +
        '<td><input name="newAmount" type="number" min="0" step="0.01" value="' + this.escape(row.newAmount ?? '') + '" placeholder="Priority amount"></td>' +
        '<td><input name="discountedPercentage" type="number" min="0" max="100" step="0.01" value="' + this.escape(row.discountedPercentage ?? '') + '" placeholder="0"></td>' +
        '<td><span class="accounts-calculated" data-calculated data-value="' + calculated + '">' + this.money(calculated) + '</span></td>' +
        '<td><input name="remark" value="' + this.escape(row.remark || '') + '" placeholder="Remark"></td>' +
        '<td><input class="accounts-checkbox" name="waiver" type="checkbox" ' + (row.waiver ? 'checked' : '') + '></td>' +
        '<td><button class="accounts-btn danger" type="button" data-remove-installment aria-label="Remove installment"><i class="fas fa-trash"></i></button></td>' +
      '</tr>';
    },

    specialCalculation(row) {
      const waiver = Boolean(row.waiver);
      if (waiver) return 0;
      const original = Number(row.originalAmount ?? row.templateAmount ?? 0);
      const newAmount = row.newAmount;
      if (newAmount !== '' && newAmount != null && Number(newAmount) >= 0) return Number(newAmount);
      const percentage = Math.min(100, Math.max(0, Number(row.discountedPercentage || 0)));
      return Math.max(0, original * (1 - percentage / 100));
    },

    calculateSpecialRow(row) {
      const get = name => row.querySelector('[name="' + name + '"]');
      const values = {
        templateAmount: get('templateAmount')?.value || 0,
        originalAmount: get('originalAmount')?.value || 0,
        paidAmount: get('paidAmount')?.value || 0,
        newAmount: get('newAmount')?.value ?? '',
        discountedPercentage: get('discountedPercentage')?.value ?? '',
        waiver: get('waiver')?.checked
      };
      const calculated = this.specialCalculation(values);
      const original = Number(values.originalAmount || values.templateAmount || 0);
      const calculatedEl = row.querySelector('[data-calculated]');
      if (calculatedEl) {
        calculatedEl.dataset.value = String(calculated);
        calculatedEl.textContent = this.money(calculated);
      }
      const discountEl = row.querySelector('[data-discount-amount]');
      if (discountEl) discountEl.textContent = this.money(Math.max(0, original - calculated));
    },

    toggleSpecialHead(id, selected) {
      selected ? this.specialSelected.add(id) : this.specialSelected.delete(id);
      const container = document.getElementById('special-structures');
      if (container) {
        container.innerHTML = this.renderSpecialStructures();
        this.initializeSpecialState();
      }
    },

    toggleStructure(id) {
      const structure = document.querySelector('[data-structure="' + CSS.escape(id) + '"]');
      if (!structure) return;
      structure.classList.toggle('collapsed');
      const icon = structure.querySelector('[data-structure-toggle] > i:last-child');
      if (icon) icon.className = structure.classList.contains('collapsed') ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    },

    addSpecialInstallment(id) {
      const structure = document.querySelector('[data-structure="' + CSS.escape(id) + '"]');
      const body = structure?.querySelector('tbody');
      const head = window.AccountsData.feeHeads().find(item => item.id === id);
      if (!body || !head) return;
      const wrapper = document.createElement('tbody');
      wrapper.innerHTML = this.specialRow(head, this.blankSpecialRow(head, body.children.length), body.children.length);
      body.appendChild(wrapper.firstElementChild);
      this.calculateSpecialRow(body.lastElementChild);
    },

    removeSpecialInstallment(button) {
      const row = button.closest('[data-special-row]');
      const body = row?.parentElement;
      if (!row || !body) return;
      if (body.children.length === 1) return this.toast('Each selected fee head must keep at least one installment.', 'error');
      row.remove();
    },

    saveSpecial() {
      if (!this.specialSelected.size) return this.toast('Select at least one fee head.', 'error');
      const structures = {};
      const specialBody = document.getElementById('accounts-special-body');
      specialBody?.querySelectorAll('[data-structure]').forEach(section => {
        const id = section.dataset.structure;
        const head = window.AccountsData.feeHeads().find(item => item.id === id);
        const installments = [...section.querySelectorAll('[data-special-row]')].map(row => {
          const value = name => row.querySelector('[name="' + name + '"]')?.value || '';
          return {
            id: row.dataset.rowId,
            installment: value('installment'),
            templateAmount: Number(value('templateAmount') || 0),
            originalAmount: Number(value('originalAmount') || 0),
            paidAmount: Number(value('paidAmount') || 0),
            newAmount: value('newAmount'),
            discountedPercentage: value('discountedPercentage'),
            calculatedAmount: Number(row.querySelector('[data-calculated]')?.dataset.value || 0),
            remark: value('remark'),
            waiver: Boolean(row.querySelector('[name="waiver"]')?.checked)
          };
        });
        structures[id] = { name: head?.name || id, refundable: Boolean(head?.refundable), installments };
      });
      const primaryDraft = this.capturePrimaryDraft(new Set(Object.keys(structures)));
      window.AccountsData.saveSpecialStructure(this.student, structures);
      this.toast('Special fee structure saved for ' + this.student.name + '.', 'success');
      this.refreshPrimaryAfterFinancialChange(primaryDraft);
      this.refreshPaymentFinancials();
      this.closeSpecialPopup();
    },

    capturePrimaryDraft(excludedFeeHeadIds = new Set()) {
      const draft = {
        scrollY: window.scrollY,
        receiptNumber: document.querySelector('#accounts-root [name="receiptNumber"]')?.value || '',
        referenceNumber: document.querySelector('#accounts-root [name="referenceNumber"]')?.value || '',
        paymentMode: document.querySelector('#accounts-root [name="paymentMode"]')?.value || '',
        remark: document.getElementById('r1-remark')?.value || '',
        rows: {}
      };
      document.querySelectorAll('#accounts-root [data-r1-row]').forEach(row => {
        if (excludedFeeHeadIds.has(row.dataset.feeHeadId)) return;
        draft.rows[row.dataset.r1Row] = {
          amount: row.querySelector('[data-r1-amount]')?.value || '0',
          dueDate: row.querySelector('[data-r1-due]')?.value || '',
          selected: Boolean(row.querySelector('[data-r1-select]')?.checked)
        };
      });
      return draft;
    },

    restorePrimaryDraft(draft) {
      if (!draft) return this.syncR1();
      const setValue = (selector, value) => {
        const field = document.querySelector(selector);
        if (field) field.value = value;
      };
      setValue('#accounts-root [name="receiptNumber"]', draft.receiptNumber);
      setValue('#accounts-root [name="referenceNumber"]', draft.referenceNumber);
      setValue('#accounts-root [name="paymentMode"]', draft.paymentMode);
      setValue('#r1-remark', draft.remark);
      Object.entries(draft.rows || {}).forEach(([id, values]) => {
        const row = document.querySelector('#accounts-root [data-r1-row="' + CSS.escape(id) + '"]');
        if (!row) return;
        const amount = row.querySelector('[data-r1-amount]');
        const due = row.querySelector('[data-r1-due]');
        if (amount) amount.value = values.amount;
        if (due) due.value = values.dueDate;
      });
      this.syncR1();
      Object.entries(draft.rows || {}).forEach(([id, values]) => {
        const select = document.querySelector('#accounts-root [data-r1-row="' + CSS.escape(id) + '"] [data-r1-select]');
        if (select && !select.disabled) select.checked = values.selected;
      });
      this.syncR1();
      window.scrollTo({ top: draft.scrollY, behavior: 'auto' });
    },

    refreshPrimaryAfterFinancialChange(draft = this.capturePrimaryDraft()) {
      const root = document.getElementById('accounts-root');
      if (!root || !this.student) return;
      root.innerHTML = this.renderR1();
      this.restorePrimaryDraft(draft);
    },

    action(action) {
      const routes = {
        'online-payment': () => this.openPaymentPopup(),
        'special-fees': () => this.openPaymentPopup({ highlightSpecial: true }),
        'save-r1': () => this.saveR1(false),
        'save-print-r1': () => this.saveR1(true),
        'cancel-r1': () => this.show('r1'),
        'new-receipt': () => this.show('r1'),
        'record-r2-payment': () => this.recordR2Payment(),
        'record-refund': () => this.recordRefund(),
        'save-special': () => this.saveSpecial(),
        'fee-head-group': () => this.openFeeHeadDialog(),
        'optional-fees': () => this.enableOptionalFee()
      };
      routes[action]?.();
    },

    openFeeHeadDialog() {
      this.openDialog('Add Fee Head', '<form id="accounts-fee-head-form" class="accounts-form-grid"><label class="accounts-field span-2"><span>Fee Head Name *</span><input name="feeHeadName" required placeholder="Example: Examination Charge"></label><label class="accounts-field"><span>Type</span><select name="feeHeadType"><option value="custom">Custom</option><option value="standard">Standard</option><option value="deposit">Deposit</option><option value="fine">Fine</option><option value="optional">Optional</option><option value="special">Special</option></select></label><div class="accounts-footer-actions span-all"><button class="accounts-btn secondary" type="button" data-dialog-close>Cancel</button><button class="accounts-btn primary" type="submit">Add Fee Head</button></div></form>');
      document.getElementById('accounts-fee-head-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const primaryDraft = this.capturePrimaryDraft();
        const head = window.AccountsData.addFeeHead(form.get('feeHeadName'), form.get('feeHeadType'));
        if (!head) return this.toast('Enter a fee head name.', 'error');
        const account = window.AccountsData.accountFor(this.student);
        account.installments.push({
          id: head.id + '-1',
          feeHeadId: head.id,
          feeHead: head.name,
          installment: head.name,
          amount: 0,
          paidAmount: 0,
          dueDate: this.student.admissionDate || '',
          remark: '',
          waiver: false
        });
        window.AccountsData.saveAccount(account);
        this.closeDialog();
        this.toast(head.name + ' added.', 'success');
        this.refreshPrimaryAfterFinancialChange(primaryDraft);
        const specialHeadPanel = document.querySelector('#accounts-special-body .accounts-fee-heads');
        if (specialHeadPanel) {
          specialHeadPanel.insertAdjacentHTML('beforeend', '<label class="accounts-fee-head-choice"><input type="checkbox" value="' + this.escape(head.id) + '" data-special-head><span>' + this.escape(head.name) + '</span></label>');
        }
      });
    },

    enableOptionalFee() {
      const row = document.querySelector('[data-fee-head-id="optional-fees"]');
      if (!row) return this.show('r1');
      const amount = row.querySelector('[data-r1-amount]');
      const select = row.querySelector('[data-r1-select]');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      amount?.focus();
      if (Number(amount?.value || 0) > 0 && select) select.checked = true;
      this.syncR1();
    },

    selectStudent(key) {
      const student = this.students.find(item => item.key === key);
      if (!student) return;
      const paymentWasOpen = this.isPaymentOpen();
      const specialWasOpen = this.isSpecialOpen();
      this.student = student;
      window.AccountsData.selectStudent(key);
      this.specialSelected.clear();
      const paymentBody = document.getElementById('accounts-payment-body');
      const specialBody = document.getElementById('accounts-special-body');
      if (paymentBody) paymentBody.innerHTML = '';
      if (specialBody) specialBody.innerHTML = '';
      this.show();
      if (paymentWasOpen) this.openPaymentPopup();
      if (specialWasOpen) this.openSpecialPopup();
    },

    openDialog(title, html) {
      const dialog = document.getElementById('accounts-dialog');
      document.getElementById('accounts-dialog-title').textContent = title;
      document.getElementById('accounts-dialog-body').innerHTML = html;
      dialog.setAttribute('aria-hidden', 'false');
    },

    closeDialog() {
      document.getElementById('accounts-dialog')?.setAttribute('aria-hidden', 'true');
    },

    toast(message, type) {
      const region = document.getElementById('accounts-toast-region');
      if (!region) return;
      const toast = document.createElement('div');
      toast.className = 'accounts-toast ' + (type || '');
      toast.innerHTML = '<i class="fas ' + (type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check') + '"></i><span>' + this.escape(message) + '</span>';
      region.appendChild(toast);
      window.setTimeout(() => toast.remove(), 3600);
    },

    toggleNavigation(force) {
      const open = typeof force === 'boolean' ? force : !document.body.classList.contains('accounts-nav-open');
      document.body.classList.toggle('accounts-nav-open', open);
    },

    applyTheme() {
      document.body.classList.toggle('dark', localStorage.getItem('pa-theme') === 'dark');
      const icon = document.querySelector('[data-accounts-theme] i');
      if (icon) icon.className = document.body.classList.contains('dark') ? 'fas fa-sun' : 'fas fa-moon';
    },

    toggleTheme() {
      const dark = !document.body.classList.contains('dark');
      localStorage.setItem('pa-theme', dark ? 'dark' : 'light');
      this.applyTheme();
    },

    studentOptions() {
      return this.students.map(student => '<option value="' + this.escape(student.key) + '" ' + (student.key === this.student?.key ? 'selected' : '') + '>' + this.escape(student.name || 'Unnamed student') + ' · ' + this.escape(student.uid || student.admissionNo || '') + '</option>').join('');
    },

    actionTile(action, icon, label, description) {
      return '<button class="accounts-action-tile" type="button" data-accounts-action="' + action + '"><i class="fas ' + icon + '"></i><span><strong>' + label + '</strong><small>' + description + '</small></span></button>';
    },

    quickAction(action, icon, label) {
      return '<button class="accounts-quick-action ' + (this.r2Action === action ? 'active' : '') + '" type="button" data-r2-action="' + action + '"><i class="fas ' + icon + '"></i><span>' + label + '</span></button>';
    },

    field(label, name, value, type, extra) {
      return '<label class="accounts-field"><span>' + label + '</span><input name="' + name + '" type="' + (type || 'text') + '" value="' + this.escape(value ?? '') + '" ' + (extra || '') + '></label>';
    },

    readOnlyField(label, value) {
      return '<label class="accounts-field"><span>' + label + '</span><input value="' + this.escape(value || '—') + '" readonly></label>';
    },

    selectField(label, name, options, required) {
      return '<label class="accounts-field"><span>' + label + (required ? ' *' : '') + '</span><select name="' + name + '" ' + (required ? 'required' : '') + '><option value="">Select</option>' + options.map(option => '<option value="' + this.escape(option) + '">' + this.escape(option) + '</option>').join('') + '</select></label>';
    },

    info(label, value) {
      return '<div><span>' + this.escape(label) + '</span><strong title="' + this.escape(value || '—') + '">' + this.escape(value || '—') + '</strong></div>';
    },

    summaryCard(label, value, className, id) {
      return '<div class="accounts-summary-card ' + (className || '') + '"><span>' + label + '</span><strong ' + (id ? 'id="' + id + '"' : '') + '>' + this.money(value) + '</strong></div>';
    },

    inlineEmpty(message) {
      return '<div class="accounts-empty"><i class="fas fa-receipt"></i><strong>Nothing to display</strong><span>' + this.escape(message) + '</span></div>';
    },

    money(value) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
    },

    formatDate(value) {
      if (!value) return '—';
      const date = new Date(String(value).length === 10 ? value + 'T00:00:00' : value);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatDateTime(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value || '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    escape(value) {
      return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
    }
  };

  window.AccountsApp = AccountsApp;
  document.addEventListener('DOMContentLoaded', () => AccountsApp.init());
})();
