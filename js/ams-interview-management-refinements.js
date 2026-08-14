// ============================================================
// AMS INTERVIEW MANAGEMENT REFINEMENT BOOTSTRAP
// Loads canonical Interview Structure mapping before lifecycle refinements.
// Scope: AMS -> Interview Management only.
// ============================================================

(() => {
  const MAPPING_SELECTOR = 'script[data-ams-interview-structure-live-mapping]';
  const RUNTIME_SELECTOR = 'script[data-ams-interview-management-runtime]';

  function loadRuntime() {
    if (document.querySelector(RUNTIME_SELECTOR)) return;
    const script = document.createElement('script');
    script.src = 'js/ams-interview-management-refinements-runtime.js';
    script.async = false;
    script.dataset.amsInterviewManagementRuntime = 'true';
    document.head.appendChild(script);
  }

  function scheduleRuntime() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => window.setTimeout(loadRuntime, 0), { once: true });
    } else {
      window.setTimeout(loadRuntime, 0);
    }
  }

  if (window.AMSInterviews?.__amsInterviewStructureLiveMappingInstalled) {
    scheduleRuntime();
    return;
  }

  const existing = document.querySelector(MAPPING_SELECTOR);
  if (existing) {
    existing.addEventListener('load', scheduleRuntime, { once: true });
    existing.addEventListener('error', scheduleRuntime, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = 'js/ams-interview-structure-live-mapping.js';
  script.async = false;
  script.dataset.amsInterviewStructureLiveMapping = 'true';
  script.addEventListener('load', scheduleRuntime, { once: true });
  script.addEventListener('error', scheduleRuntime, { once: true });
  document.head.appendChild(script);
})();
