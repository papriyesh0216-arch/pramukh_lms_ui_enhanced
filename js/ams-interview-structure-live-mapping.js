// ============================================================
// AMS INTERVIEW STRUCTURE LIVE MAPPING
// Scope: AMS -> Interview Management only.
// Consumes Interview Structure Management without modifying its implementation.
// ============================================================

(() => {
  const FLAG = '__amsInterviewStructureLiveMappingInstalled';
  const LEGACY_HISTORY_KEY = 'paAMSInterviewStructureLiveHistoryV1';

  function normalize(value) {
    return String(value ?? '').trim();
  }

  function clone(value) {
    if (!value) return value;
    try { return JSON.parse(JSON.stringify(value)); } catch (error) { return value; }
  }

  function activeStructureView(structure) {
    if (!structure) return null;
    const snapshot = clone(structure);
    snapshot.groups = (snapshot.groups || [])
      .filter(group => group.active !== false)
      .map(group => ({
        ...group,
        attributes: (group.attributes || []).filter(attribute => attribute.active !== false)
      }));
    snapshot.rounds = snapshot.groups.length;
    snapshot.attributes = snapshot.groups.reduce((sum, group) => sum + group.attributes.length, 0);
    return snapshot;
  }

  function install() {
    const interviews = window.AMSInterviews;
    if (!interviews || interviews[FLAG]) return Boolean(interviews?.[FLAG]);
    interviews[FLAG] = true;

    const original = {
      loadData: interviews.loadData?.bind(interviews),
      saveStructures: interviews.saveStructures?.bind(interviews),
      saveInterviews: interviews.saveInterviews?.bind(interviews),
      openInterviewDetail: interviews.openInterviewDetail?.bind(interviews),
      saveEvaluation: interviews.saveEvaluation?.bind(interviews),
      openStudentSchedule: interviews.openStudentSchedule?.bind(interviews)
    };

    const liveStructure = id => interviews.structures.find(structure => structure.id === id) || null;
    const snapshotStructure = item => item?.structureSnapshot || item?.evaluationStructureSnapshot || null;

    const migrateLegacyHistory = () => {
      let legacy = null;
      try { legacy = JSON.parse(localStorage.getItem(LEGACY_HISTORY_KEY) || 'null'); } catch (error) {}
      if (legacy) {
        interviews.interviews.forEach(item => {
          const structureId = item.structureId || legacy.interviewStructureIds?.[item.id] || '';
          if (!item.structureId && structureId) item.structureId = structureId;
          if (!item.structureSnapshot && structureId && legacy.structures?.[structureId]) {
            item.structureSnapshot = clone(legacy.structures[structureId]);
          }
        });
      }
      try { localStorage.removeItem(LEGACY_HISTORY_KEY); } catch (error) {}
    };

    const captureInterviewSnapshots = () => {
      interviews.interviews.forEach(item => {
        const structure = liveStructure(item.structureId);
        if (structure) item.structureSnapshot = clone(structure);
      });
    };

    const selectableStructures = (course = '', currentId = '') => {
      const targetCourse = normalize(course);
      return interviews.structures.filter(structure => {
        if (structure.id === currentId) return true;
        if (structure.active === false) return false;
        return !targetCourse || !structure.course || structure.course === targetCourse;
      });
    };

    const isSelectableStructure = (structureId, course = '', currentId = '') => {
      const structure = liveStructure(structureId);
      if (!structure) return false;
      if (structure.id === currentId) return true;
      if (structure.active === false) return false;
      const targetCourse = normalize(course);
      return !targetCourse || !structure.course || structure.course === targetCourse;
    };

    const evaluationStructureFor = item => {
      if (!item) return null;
      const live = liveStructure(item.structureId);
      const archived = snapshotStructure(item);
      const historical = item.status === 'Completed' || Boolean(item.evaluation && Object.keys(item.evaluation).length);
      if (historical && item.evaluationStructureSnapshot) {
        const snapshot = activeStructureView(item.evaluationStructureSnapshot);
        if (!snapshot) return live || archived;
        snapshot.name = live?.name || archived?.name || snapshot.name;
        snapshot.course = live?.course || archived?.course || snapshot.course;
        snapshot.mode = live?.mode || archived?.mode || snapshot.mode;
        return snapshot;
      }
      return activeStructureView(live || archived);
    };

    const ensureHistoricalSnapshots = () => {
      let changed = false;
      interviews.interviews.forEach(item => {
        const historical = item.status === 'Completed' || Boolean(item.evaluation && Object.keys(item.evaluation).length);
        if (!historical || item.evaluationStructureSnapshot) return;
        const structure = activeStructureView(liveStructure(item.structureId) || snapshotStructure(item));
        if (!structure) return;
        item.evaluationStructureSnapshot = clone(structure);
        changed = true;
      });
      if (changed) interviews.saveInterviews();
      return changed;
    };

    // The legacy base fallback list is never used as an independent source once this layer is installed.
    interviews.defaultStructures = () => [];

    interviews.structureById = function canonicalStructureById(id) {
      if (!id) return null;
      return liveStructure(id);
    };

    interviews.structureForInterview = function structureForInterview(item) {
      if (!item) return null;
      return liveStructure(item.structureId) || snapshotStructure(item);
    };

    interviews.preserveStructureSnapshot = function preserveStructureSnapshot(structureId) {
      const structure = liveStructure(structureId);
      if (!structure) return;
      this.interviews.forEach(item => {
        if (item.structureId === structureId) item.structureSnapshot = clone(structure);
      });
    };

    interviews.selectableInterviewStructures = selectableStructures;
    interviews.evaluationStructureFor = evaluationStructureFor;

    if (original.saveStructures) {
      interviews.saveStructures = function saveCanonicalStructures() {
        const result = original.saveStructures();
        if (this.state?.filters?.structure !== 'all' && !liveStructure(this.state.filters.structure)) {
          this.state.filters.structure = 'all';
        }
        return result;
      };
    }

    if (original.saveInterviews) {
      interviews.saveInterviews = function saveInterviewsWithStructureIntegrity() {
        this.interviews.forEach(item => {
          if (!item?.id) return;
          const current = liveStructure(item.structureId);
          if (current) item.structureSnapshot = clone(current);
          else if (!item.structureId && item.structureSnapshot?.id) item.structureId = item.structureSnapshot.id;
        });
        return original.saveInterviews();
      };
    }

    if (original.loadData) {
      interviews.loadData = function loadDataWithCanonicalStructures() {
        const result = original.loadData();
        migrateLegacyHistory();
        captureInterviewSnapshots();
        ensureHistoricalSnapshots();
        original.saveInterviews();
        return result;
      };
    }

    if (original.saveEvaluation) {
      interviews.saveEvaluation = function saveStructureBoundEvaluation(id, complete = false) {
        const item = this.interviews.find(interview => interview.id === id);
        if (!item) return original.saveEvaluation(id, complete);
        const structure = activeStructureView(liveStructure(item.structureId) || snapshotStructure(item));
        if (complete && structure && !item.evaluationStructureSnapshot) {
          item.evaluationStructureSnapshot = clone(structure);
        }
        if (!structure) return original.saveEvaluation(id, complete);

        const resolver = this.structureById;
        this.structureById = queryId => queryId === item.structureId ? structure : resolver.call(this, queryId);
        try { return original.saveEvaluation(id, complete); }
        finally { this.structureById = resolver; }
      };
    }

    if (original.openInterviewDetail) {
      interviews.openInterviewDetail = function openStructureBoundInterviewDetail(id, ...args) {
        const item = this.interviews.find(interview => interview.id === id);
        const structure = evaluationStructureFor(item);
        if (!item || !structure) return original.openInterviewDetail(id, ...args);

        const resolver = this.structureById;
        this.structureById = queryId => queryId === item.structureId ? structure : resolver.call(this, queryId);
        try { return original.openInterviewDetail(id, ...args); }
        finally { this.structureById = resolver; }
      };
    }

    interviews.openStudentOverallReport = function openStructureBoundStudentOverallReport(row) {
      const rows = this.interviewsForStudent(row)
        .filter(item => item.status === 'Completed' || Object.keys(item.evaluation || {}).length);
      if (!rows.length) return;
      const sections = rows.map(item => {
        const structure = evaluationStructureFor(item);
        const interviewer = this.interviewerById(item.interviewerId);
        const attributes = (structure?.groups || []).flatMap(group => group.attributes || []);
        return `<section class="ams-overall-report-section">
          <header><div><i class="far fa-hand-point-right"></i><strong>${this.escape(structure?.name || 'Interview Result')}</strong></div></header>
          <div class="ams-report-meta"><span><i class="fas fa-user"></i><b>Interviewer:</b> ${this.escape(interviewer?.name || 'Not Assigned')}</span><span><i class="fas fa-user"></i><b>Interview Date:</b> ${this.formatDate(item.datetime)}</span></div>
          <dl>${attributes.map(attribute => `<div><dt>${this.escape(attribute.name)}</dt><dd>${this.escape(item.evaluation?.[attribute.id] || '—')}</dd></div>`).join('')}
            <div><dt>Total</dt><dd>${this.escape(item.score || '0')}</dd></div>
            <div class="wide"><dt>Remarks</dt><dd>${this.escape(item.remarks || '—')}</dd></div>
          </dl>
        </section>`;
      }).join('');
      this.openWideModal(`Overall Interview Report · ${row.name}`, `<div class="ams-overall-report">${sections}</div>`);
    };

    interviews.studentScheduleForm = function canonicalStudentScheduleForm(row, existing) {
      const date = existing?.datetime?.slice(0, 10) || this.state.selectedDate || this.dateKey(new Date());
      const startTime = existing?.datetime?.slice(11, 16) || '10:00';
      const endTime = existing?.endTime || '11:00';
      const course = row?.course || existing?.course || '';
      const options = selectableStructures(course, existing?.structureId || '');
      const currentExists = existing?.structureId && Boolean(liveStructure(existing.structureId));
      const archived = existing?.structureId && !currentExists ? snapshotStructure(existing) : null;
      const emptyLabel = archived ? `${archived.name} was removed — select a current structure` : 'Select';
      return `<section class="ams-student-schedule-panel">
        <header><i class="fas fa-hourglass-half"></i><strong>${existing ? 'Edit Scheduled Interview' : 'Schedule Interview'}</strong></header>
        <form id="ams-student-schedule-form">
          <label><span>Interview Date<b>*</b></span><input type="date" name="date" value="${date}" required></label>
          <label><span>Start Time<b>*</b></span><input type="time" name="startTime" value="${startTime}" required></label>
          <label><span>End Time<b>*</b></span><input type="time" name="endTime" value="${endTime}" required></label>
          <label><span>Interview Structure<b>*</b></span><select name="structureId" required><option value="">${this.escape(emptyLabel)}</option>${options.map(item => `<option value="${this.escape(item.id)}" ${item.id === existing?.structureId ? 'selected' : ''}>${this.escape(item.name)}${item.active === false ? ' (Inactive)' : ''}</option>`).join('')}</select></label>
          <label><span>Interviewer Name<b>*</b></span><select name="interviewerId" required><option value="">Select Interviewer</option>${this.interviewers.map(item => `<option value="${this.escape(item.id)}" ${item.id === existing?.interviewerId ? 'selected' : ''}>${this.escape(item.name)}</option>`).join('')}</select></label>
          <div class="ams-student-schedule-actions"><button type="submit" class="btn btn-primary">Save &amp; Next</button><button type="button" class="btn btn-danger" id="ams-student-schedule-cancel">Cancel</button></div>
        </form>
      </section>`;
    };

    if (original.openStudentSchedule) {
      interviews.openStudentSchedule = function openStudentScheduleWithCanonicalValidation(...args) {
        const result = original.openStudentSchedule(...args);
        const row = args[0];
        const editId = args[2] || '';
        const existing = editId ? this.interviews.find(item => item.id === editId) : null;
        const form = document.getElementById('ams-student-schedule-form');
        form?.addEventListener('submit', event => {
          const structureId = String(new FormData(event.currentTarget).get('structureId') || '');
          const valid = isSelectableStructure(structureId, row?.course || existing?.course || '', existing?.structureId || '');
          if (valid) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          event.currentTarget.elements.structureId.setCustomValidity('Select an active Interview Structure mapped to this course.');
          event.currentTarget.elements.structureId.reportValidity();
        }, true);
        return result;
      };
    }

    interviews.openScheduleForm = function canonicalScheduleForm(id = '', markRescheduled = false, nested = false) {
      const existing = this.interviews.find(item => item.id === id);
      const candidates = this.uniqueCandidates();
      const defaultCandidate = existing || candidates[0];
      if (!defaultCandidate) return;

      const renderStructureOptions = candidate => {
        const course = candidate?.course || existing?.course || '';
        const options = selectableStructures(course, existing?.structureId || '');
        const currentExists = existing?.structureId && Boolean(liveStructure(existing.structureId));
        const archived = existing?.structureId && !currentExists ? snapshotStructure(existing) : null;
        const emptyLabel = archived ? `${archived.name} was removed — select a current structure` : 'Select Interview Structure';
        return `<option value="">${this.escape(emptyLabel)}</option>${options.map(item => `<option value="${this.escape(item.id)}" ${item.id === (existing?.structureId || candidate?.structureId) ? 'selected' : ''}>${this.escape(item.name)}</option>`).join('')}`;
      };

      const date = existing?.datetime?.slice(0, 10) || this.state.selectedDate || this.dateKey(new Date());
      const time = existing?.datetime?.slice(11, 16) || '10:00';
      this.openModal(existing ? (markRescheduled ? 'Reschedule Interview' : 'Edit Interview') : 'Schedule Interview', `
        <form class="im-form" id="im-schedule-form">
          <div class="im-form-grid">
            <label><span>Student <b>*</b></span><select name="studentId" required ${existing ? 'disabled' : ''}>${candidates.map(item => `<option value="${this.escape(item.studentId)}" ${(existing?.studentId || defaultCandidate.studentId) === item.studentId ? 'selected' : ''}>${this.escape(item.name)} · ${this.escape(item.course)}</option>`).join('')}</select></label>
            <label><span>Interview Structure <b>*</b></span><select name="structureId" required>${renderStructureOptions(defaultCandidate)}</select></label>
            <label><span>Date <b>*</b></span><input type="date" name="date" value="${date}" required /></label>
            <label><span>Time <b>*</b></span><input type="time" name="time" value="${time}" required /></label>
            <label><span>Interviewer</span><select name="interviewerId"><option value="">Awaiting Assignment</option>${this.interviewers.map(item => `<option value="${this.escape(item.id)}" ${item.id === existing?.interviewerId ? 'selected' : ''}>${this.escape(item.name)} · ${this.escape(item.department)}</option>`).join('')}</select></label>
            <label><span>Interview Mode <b>*</b></span><select name="mode" required>${['Online', 'In-Person'].map(mode => `<option ${mode === (existing?.mode || 'In-Person') ? 'selected' : ''}>${mode}</option>`).join('')}</select></label>
          </div>
          <div class="im-form-actions"><button type="button" class="btn btn-outline" data-im-close>Cancel</button><button class="btn btn-primary" type="submit"><i class="fas fa-calendar-check"></i>${existing ? 'Save Changes' : 'Schedule Interview'}</button></div>
        </form>
      `, markRescheduled ? 'md' : 'lg', { nested });

      const form = document.getElementById('im-schedule-form');
      form?.elements.studentId?.addEventListener('change', event => {
        const candidate = candidates.find(item => item.studentId === event.target.value);
        if (candidate) form.elements.structureId.innerHTML = renderStructureOptions(candidate);
      });
      form?.addEventListener('submit', event => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const candidate = existing || candidates.find(item => item.studentId === data.studentId);
        if (!isSelectableStructure(data.structureId, candidate?.course || '', existing?.structureId || '')) {
          event.currentTarget.elements.structureId.setCustomValidity('Select an active Interview Structure mapped to this course.');
          event.currentTarget.elements.structureId.reportValidity();
          return;
        }
        event.currentTarget.elements.structureId.setCustomValidity('');

        if (existing) {
          Object.assign(existing, {
            structureId: data.structureId,
            datetime: `${data.date}T${data.time}`,
            interviewerId: data.interviewerId,
            mode: data.mode,
            status: existing.status === 'Completed' ? 'Completed' : markRescheduled ? 'Rescheduled' : (data.interviewerId ? 'Scheduled' : 'Awaiting Assignment')
          });
        } else {
          const nextNumber = String(Date.now()).slice(-6);
          this.interviews.push({ ...candidate, id: `IV-${nextNumber}`, structureId: data.structureId, datetime: `${data.date}T${data.time}`, interviewerId: data.interviewerId, mode: data.mode, status: data.interviewerId ? 'Scheduled' : 'Awaiting Assignment', score: '', evaluation: {}, remarks: '' });
        }
        this.state.selectedDate = data.date;
        this.state.calendarDate = data.date;
        this.saveInterviews();
        this.render();
        if (nested && existing) {
          this.modalStack = [];
          this.openInterviewDetail(existing.id);
        } else this.closeModal();
      });
    };

    const finalizeLoadedData = () => {
      migrateLegacyHistory();
      captureInterviewSnapshots();
      ensureHistoricalSnapshots();
      if (interviews.state?.filters?.structure !== 'all' && !liveStructure(interviews.state.filters.structure)) {
        interviews.state.filters.structure = 'all';
      }
    };

    // If installation occurs after AMSInterviews.init(), normalize the already-loaded state now.
    if (interviews.interviews.length || interviews.structures.length) finalizeLoadedData();

    window.addEventListener('ams:data-change', event => {
      if (event.detail?.source !== 'structures') return;
      if (interviews.state?.filters?.structure !== 'all' && !liveStructure(interviews.state.filters.structure)) {
        interviews.state.filters.structure = 'all';
      }
      requestAnimationFrame(() => {
        if (document.getElementById('ams-interview-root')) interviews.render?.();
      });
    });

    return true;
  }

  function boot() {
    if (install()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 240) window.clearInterval(timer);
    }, 25);
  }

  // AMSInterviews is defined by the static interview engine before this integration is loaded.
  // Install immediately so loadData() consumes only the canonical structure source.
  boot();
})();
