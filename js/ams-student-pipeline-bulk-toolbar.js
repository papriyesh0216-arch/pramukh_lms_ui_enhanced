// ============================================================
// AMS STUDENT PIPELINE - bulk selection toolbar refinement
// Scope: AMS Student Pipeline / Admission Student List only.
// ============================================================

(() => {
  const INSTALL_FLAG = '__amsStudentPipelineBulkToolbarInstalled';
  const ITEM_ATTR = 'data-amsl-toolbar-selection';

  function ensureStyles() {
    if (document.getElementById('ams-student-pipeline-bulk-toolbar-style')) return;
    const style = document.createElement('style');
    style.id = 'ams-student-pipeline-bulk-toolbar-style';
    style.textContent = `
      .amsl-tool-row.amsl-has-bulk-selection {
        flex-wrap: wrap;
      }

      .amsl-tool-row .amsl-toolbar-selection-count {
        display: inline-flex;
        min-height: 30px;
        padding: 0 10px;
        align-items: center;
        gap: 4px;
        border-radius: 7px;
        background: var(--primary-light);
        color: var(--primary);
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
      }

      .amsl-tool-row button[${ITEM_ATTR}].danger {
        border-color: color-mix(in srgb, var(--danger) 36%, var(--border));
        color: var(--danger);
      }

      .amsl-tool-row button[${ITEM_ATTR}].danger:hover {
        border-color: var(--danger);
        background: color-mix(in srgb, var(--danger) 8%, #fff);
        color: var(--danger);
      }
    `;
    document.head.appendChild(style);
  }

  function clearToolbarSelectionUi() {
    document.querySelectorAll(`[${ITEM_ATTR}]`).forEach(element => element.remove());
    document.querySelector('.amsl-tools-card .amsl-tool-row')?.classList.remove('amsl-has-bulk-selection');
  }

  function createAction(action, icon, label, danger = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.amslAction = action;
    button.setAttribute(ITEM_ATTR, 'action');
    button.dataset.tooltip = label;
    button.title = label;
    button.setAttribute('aria-label', label);
    if (danger) button.classList.add('danger');
    button.innerHTML = `<i class="fas ${icon}"></i>`;
    return button;
  }

  function install() {
    if (window[INSTALL_FLAG]) return true;
    const list = window.AMSStudentList;
    if (!list) return false;
    window[INSTALL_FLAG] = true;

    ensureStyles();
    document.getElementById('amsl-selection-bar')?.remove();

    list.renderSelectionBar = function renderSelectionInAdmissionTools() {
      clearToolbarSelectionUi();

      const count = this.selected.size;
      if (!count) return;

      const toolRow = document.querySelector('.amsl-tools-card .amsl-tool-row');
      const sortButton = toolRow?.querySelector('[data-amsl-action="sort"]');
      if (!toolRow || !sortButton) return;

      toolRow.classList.add('amsl-has-bulk-selection');

      const countBadge = document.createElement('span');
      countBadge.className = 'amsl-toolbar-selection-count';
      countBadge.setAttribute(ITEM_ATTR, 'count');
      countBadge.setAttribute('aria-live', 'polite');
      countBadge.innerHTML = `<b>${count}</b> selected`;

      const actions = [
        ['bulk-followup', 'fa-redo', 'Follow-up', false],
        ['bulk-stage', 'fa-tags', 'Stage', false],
        ['bulk-assign', 'fa-user-check', 'Assign', false],
        ['bulk-communication', 'fa-comments', 'Communicate', false],
        ['bulk-export', 'fa-file-export', 'Export', false],
        ['bulk-archive', 'fa-box-archive', 'Archive', true],
        ['bulk-delete', 'fa-trash', 'Delete', true],
        ['clear-selection', 'fa-xmark', 'Clear Selection', false]
      ];

      let anchor = sortButton;
      [countBadge, ...actions.map(args => createAction(...args))].forEach(element => {
        anchor.insertAdjacentElement('afterend', element);
        anchor = element;
      });
    };

    list.renderSelectionBar();
    return true;
  }

  function boot() {
    if (install()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 120) window.clearInterval(timer);
    }, 25);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

// ============================================================
// AMS STUDENT PIPELINE - row OTR identity + Satsangi indicator
// Scope: Student Pipeline row identity only.
// ============================================================

(() => {
  const INSTALL_FLAG = '__amsStudentPipelineRowIdentityInstalled';

  function ensureStyles() {
    if (document.getElementById('ams-student-pipeline-row-identity-style')) return;
    const style = document.createElement('style');
    style.id = 'ams-student-pipeline-row-identity-style';
    style.textContent = `
      #screen-ams-students .amsl-card-student .amsl-row-otr-id {
        display: inline-flex;
        min-height: 18px;
        margin-left: 7px;
        padding: 2px 7px;
        align-items: center;
        justify-content: center;
        border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--border));
        border-radius: 999px;
        background: var(--primary-light);
        color: var(--primary);
        font-size: 8px;
        font-weight: 800;
        line-height: 1;
        vertical-align: middle;
        white-space: nowrap;
      }

      #screen-ams-students .amsl-card-student .amsl-satsangi-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        margin-left: 6px;
        border: 2px solid #f59e0b;
        border-radius: 50%;
        background: #dc2626;
        box-sizing: border-box;
        vertical-align: middle;
      }
    `;
    document.head.appendChild(style);
  }

  function isSatsangi(row) {
    return String(row?.otrRecord?.satsang?.bapsConnected || '').trim().toLowerCase() === 'yes';
  }

  function install() {
    if (window[INSTALL_FLAG]) return true;
    const list = window.AMSStudentList;
    if (!list?.renderRow) return false;
    window[INSTALL_FLAG] = true;

    ensureStyles();

    const originalRenderRow = list.renderRow.bind(list);
    list.renderRow = function renderRowWithOtrIdentity(row, sequence) {
      const html = originalRenderRow(row, sequence);
      if (html.includes('amsl-row-otr-id')) return html;

      const otrNo = row.otrNo || this.normalizeOtrId?.(row.admissionNo, row.createdAt, sequence) || '';
      if (!otrNo) return html;

      const identity = `<span class="amsl-row-otr-id" title="OTR ID">${this.escape(otrNo)}</span>${isSatsangi(row) ? '<span class="amsl-satsangi-indicator" title="Satsangi" aria-label="Satsangi"></span>' : ''}`;
      return html.replace(
        /(<button type="button" class="amsl-card-name"[^>]*>[\s\S]*?<\/button>)/,
        `$1${identity}`
      );
    };

    list.renderTable?.();
    return true;
  }

  function boot() {
    if (install()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 120) window.clearInterval(timer);
    }, 25);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
