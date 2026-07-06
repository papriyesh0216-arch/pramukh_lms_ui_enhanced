# TODO - Inquiry Form changes

- [ ] Update `js/inquiry-form.js`:
  - [ ] Goal 1: When `Academic Status` is `School Student` and `Inquiry Type` is `Course Inquiry`, default `Course` to `Sankalp` (already exists) AND make `Any Specific Query` required so user only needs to fill that query.
  - [ ] Ensure query label shows asterisk `*` in that default scenario.
  - [ ] Goal 2: When `Course` is `Class -3`, batch dropdown should show `Master batch` and `Other` (replace “Others (Please Specify in Remarks)” text) and make batch/mode non-mandatory (already partially implemented).
- [ ] Reload `inquiry-form.html` and validate:
  - [ ] Switching to School Student auto-selects Course Inquiry + Sankalp and shows only query requirement.
  - [ ] Selecting Class 3 shows correct batch options and submission works with batch/mode left empty.

