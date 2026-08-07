// ============================================================
// AMS STUDENT PIPELINE - scoped toolbar cleanup
// Removes only the redundant quick-row sliders/filter-toggle control.
// The same toolbar is reused by Row View and Calendar View.
// ============================================================

(() => {
  function removeRedundantPipelineFilterToggle() {
    const quickRow = document.querySelector('#screen-ams-students .amsl-tools-card .amsl-quick-row');
    if (!quickRow) return;

    const redundantButton = [...quickRow.querySelectorAll('[data-amsl-action="filter-toggle"]')]
      .find(button => button.querySelector('.fa-sliders'));

    redundantButton?.remove();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeRedundantPipelineFilterToggle, { once: true });
  } else {
    removeRedundantPipelineFilterToggle();
  }
})();
