# Phase 1 - Primary Requirements

## Admission Management System - One Time Registration Form

### Screen Purpose

Capture the approved personal, address, education, achievement, Satsang, government exam, and document information required to create or update an AMS student registration record.

### Users/Roles

- The approved screen identifies the user as **AMS Admin - Admission Desk**.
- Additional roles permitted to access or submit the OTR Form are `Needs Business Confirmation`.

### Primary Business Requirements

- **BR-01:** The Admission Desk user must be able to open a blank OTR Form from the AMS navigation or New Admission action.
- **BR-02:** The form must capture all seven approved information areas before creating an admission student record.
- **BR-03:** Submission must be blocked until every currently required field and the required document satisfy the approved validations.
- **BR-04:** A successful submission must create or update one AMS student record, assign or retain its admission number, and set its status to Form Submitted.
- **BR-05:** After successful submission, the form must reset and the user must be taken to the Admission Student List with a success notification.

### Functional Requirements

#### Form Sections

- **FR-01:** The form must display Personal Details and Correspondence Address fields.
- **FR-02:** Education Details must provide separate expandable sections for 10th (SSC), 12th (HSC), Diploma, Bachelor's Degree, and Master's Degree.
- **FR-03:** The 10th (SSC) section must be open initially and all its fields must be required.
- **FR-04:** The remaining education sections must be optional and expandable one at a time.
- **FR-05:** Achievements must start with one optional entry and allow the user to add or delete additional entries.
- **FR-06:** The form must provide Satsang, Government Exam, and Documents sections. Government Exam entries must be editable and repeatable using the add and delete controls.

#### Conditional Behavior

- **FR-07:** Selecting No for the WhatsApp same-number question must reveal and require the WhatsApp number field. Selecting Yes must hide it and remove its required state.
- **FR-09:** Selecting Yes for BAPS connection must reveal and require Weekly Sabha, Specific Remark, Mandal, Shetra, Karyakar Name, Karyakar Number, and Mandir.
- **FR-10:** Selecting No for BAPS connection must hide those fields and remove their required state.
- **FR-11:** Entering a supported six-digit pincode must populate State and enable the applicable District choices.
- **FR-12:** State and District must remain unavailable until the entered pincode matches the approved location master.

#### Document Upload

- **FR-13:** A passport-size photo document must be uploaded by file selection or drag and drop.
- **FR-14:** The upload area must display the selected file name, file size, and ready status.
- **FR-15:** The user must be able to remove the selected file before submission.

#### Submission

- **FR-16:** Submit OTR must validate all enabled required fields and the uploaded document.
- **FR-17:** Validation failures must display field-level messages, a form-level alert, and focus the first invalid field.
- **FR-18:** If an invalid field is inside a collapsed education section, that section must open.
- **FR-19:** An existing OTR record with the same email address or primary phone number must be updated instead of duplicated.
- **FR-20:** When the submitted email address or phone number matches an existing AMS admission candidate, the existing admission number must be retained.
- **FR-21:** A new unmatched submission must receive a generated OTR admission number.
- **FR-22:** A successful record must be marked Form Submitted and made available to the Admission Student List.
- **FR-23:** If the record cannot be stored, the form must remain available and display the approved storage error.

### Field Requirements

| Section | Field | Requirement |
|---|---|---|
| Personal Details | Full Name | Required |
| Personal Details | Date of Birth | Required date |
| Personal Details | Gender | Required: Male, Female, or Other |
| Personal Details | Religion | Required: Hindu, Muslim, Sikh, Christian, Jain, or Other |
| Personal Details | Phone No. | Required valid 10-digit Indian mobile number |
| Personal Details | WhatsApp same-number question | Required Yes/No selection |
| Personal Details | WhatsApp No. | Required only when the WhatsApp same-number response is No |
| Personal Details | Email ID | Required valid email address |
| Correspondence Address | Pincode | Required valid and supported six-digit Indian pincode |
| Correspondence Address | State | Required; populated from pincode |
| Correspondence Address | District | Required; selected from pincode-based choices |
| Correspondence Address | Postal Address Line 1 | Optional |
| Correspondence Address | Postal Address Line 2 | Optional |
| 10th (SSC) | Board, Medium, Passing Year, Result | All required |
| 12th (HSC) | Board, Stream, Medium, Passing Year, Result | Optional |
| Diploma | University Name, Stream, Medium, Passing Year, Result | Optional |
| Bachelor's Degree | University Name, Stream, Medium, Passing Year, Result | Optional |
| Master's Degree | University Name, Stream, Medium, Passing Year, Result | Optional |
| Achievement | Title, Year, Details | Optional; repeatable |
| Satsang | BAPS connection | Required Yes/No selection |
| Satsang | Weekly Sabha, Specific Remark, Mandal, Shetra, Karyakar Name, Karyakar Number, Mandir | Required only when BAPS connection is Yes |
| Government Exam | Exam Name, Year, Post, Exam Status | Optional and repeatable |
| Documents | Passport-size photo | Required PDF, JPG, or JPEG; maximum 800 KB |

### Business Rules & Conditions

- **BR-C01:** Required-field rules apply only to fields that are currently enabled and applicable.
- **BR-C02:** Optional education sections may be left blank; the approved form does not enforce all-or-none completion within them.
- **BR-C03:** Empty achievement entries must not be stored. Any achievement containing a title, year, or details must be stored.
- **BR-C04:** Government Exam status, when provided, must be one of Appeared In Prelims, Appeared In Mains, Appeared In Interview, or Finally Passed The Exam.
- **BR-C05:** Passing-year and exam-year choices must cover the current year and the preceding 44 years.
- **BR-C06:** Email matching is case-insensitive. A matching email or primary phone number identifies an existing OTR record for update.
- **BR-C07:** Updating an existing OTR must preserve its record ID, admission number, and original creation timestamp while updating its submitted information and update timestamp.
- **BR-C08:** A successful submission must set the record status to Form Submitted.
- **BR-C09:** A direct OTR student is created with Course Not Assigned, Pending Allocation, Admission Desk ownership, and Review OTR details as the next step.
- **BR-C10:** Date-of-birth age limits and allowable date range are `Needs Business Confirmation`.
- **BR-C11:** The authoritative admission-number format and sequence-generation rules are `Needs Business Confirmation`.
- **BR-C12:** The authoritative production pincode, state, and district master is `Needs Business Confirmation`.

### User Actions

- Open the OTR Form.
- Enter required and optional registration information.
- Expand or collapse education sections.
- Add or delete achievement entries.
- Add, edit, or delete Government Exam entries.
- Select the WhatsApp and BAPS Yes/No responses.
- Enter a supported pincode and select an enabled District; State is populated automatically.
- Upload, review, or remove the passport-size photo document.
- Submit the OTR Form.
- Correct highlighted validation errors.
- Return to the Admission Student List using the Student List action.

### Data Dependencies

- AMS location master for pincode, State, and District mapping.
- Approved lists for gender, religion, education board, medium, stream, passing year, exam year, and government exam status.
- Existing OTR records for duplicate matching and record updates.
- Existing AMS admission candidates for admission-number matching by email address or phone number.
- Persistent storage for form data, document data, record identifiers, timestamps, admission numbers, and Form Submitted status.
- The approved implementation stores OTR records within browser-local AMS storage. The production system of record, retention period, and document-storage mechanism are `Needs Business Confirmation`.

### Validations

- Full Name, Date of Birth, Gender, Religion, Phone No., WhatsApp response, Email ID, Pincode, State, District, BAPS response, all 10th fields, and passport-size photo are mandatory.
- The WhatsApp number must become mandatory only when the WhatsApp same-number response is No.
- BAPS conditional fields must become mandatory only when the BAPS connection response is Yes.
- Phone No., conditional WhatsApp No., and conditional Karyakar Number must contain 10 digits and begin with 6, 7, 8, or 9.
- Email ID must use a valid email format.
- Pincode must contain six digits, must not start with zero, and must exist in the AMS location master.
- The uploaded document must be PDF, JPG, or JPEG and must not exceed 800 KB.
- Unsupported files must be rejected and removed from the pending upload.
- Submission must not continue while any enabled required field or document is invalid.
- Additional content validation for names, addresses, education results, remarks, and exam details is `Needs Business Confirmation`.

### Permissions

- The approved UI presents OTR access to **AMS Admin - Admission Desk**.
- The Admission Desk user can enter, submit, and replace an OTR record when its email address or phone number matches an existing record.
- Production authentication, authorization enforcement, and access for any additional AMS role are `Needs Business Confirmation`.

### Acceptance Criteria

1. The OTR Form opens from the AMS OTR navigation and New Admission action.
2. All approved sections and fields are displayed with the correct required or optional state.
3. The 10th education section is initially open and required; other education sections are optional and expandable.
4. Users can add and delete achievement entries without affecting other form data.
5. Users can add, edit, and delete Government Exam entries, and all populated entries are retained on submission.
6. WhatsApp and BAPS conditional fields appear, hide, and change required state according to the approved selections.
7. A supported pincode populates State and enables valid District choices; an unsupported pincode blocks submission.
8. The document control accepts only PDF, JPG, or JPEG files up to 800 KB and supports removal before submission.
9. Submit OTR highlights invalid fields, displays clear validation messages, and focuses the first error.
10. A valid unmatched submission creates one OTR record with an admission number and Form Submitted status.
11. A submission matching an existing OTR by email or phone updates that record without creating a duplicate.
12. A submission matching an AMS admission candidate retains that candidate's admission number.
13. A successful submission refreshes AMS student data, resets the form, opens the Admission Student List, and displays a success notification.
14. A storage failure does not clear or leave the form and displays the approved error message.
