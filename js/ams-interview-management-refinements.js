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

  if (window.AMSInterviews?.__amsInterviewStructureLiveMappingInstalled) {
    loadRuntime();
    return;
  }

  const existing = document.querySelector(MAPPING_SELECTOR);
  if (existing) {
    existing.addEventListener('load', loadRuntime, { once: true });
    existing.addEventListener('error', loadRuntime, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = 'js/ams-interview-structure-live-mapping.js';
  script.async = false;
  script.dataset.amsInterviewStructureLiveMapping = 'true';
  script.addEventListener('load', loadRuntime, { once: true });
  script.addEventListener('error', loadRuntime, { once: true });
  document.head.appendChild(script);
})();
