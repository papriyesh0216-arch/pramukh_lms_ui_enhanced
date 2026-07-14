# Phase 1 - Primary Requirements

## Screen 1: Segment Screen

### Screen Purpose

Create and manage reusable groups of inquiries so that matching inquiries can be assigned through the Assignment Screen.

### Users/Roles

| Role | Access |
|---|---|
| Admin | View, create, edit, duplicate, archive, restore, assign, remove assignments, and export segments. |
| Head of Department (HOD) | View, create, edit, duplicate, archive, restore, assign, remove assignments, and export segments. |
| Counselor | View segments only. Export access is `Needs Business Confirmation` because the permission definition and visible screen behavior conflict. |

### Primary Business Requirements

1. The screen must keep Segment management separate from Assignment management through the **Segments** and **Assignments** tabs.
2. Users with create permission must be able to create either a **Static Segment** or a **Dynamic Segment**.
3. The screen must show active and archived segments separately.
4. Each segment must retain its name, type, criteria, matched inquiry membership, assigned users, creation date, and archive state.
5. Only active segments may be offered for assignment.

### Functional Requirements

#### Segment summary

The screen must display:

| Summary | Required meaning |
|---|---|
| Active Segments | Number of active segments. The current displayed calculation conflicts with the label; the final calculation is `Needs Business Confirmation`. |
| Total Inquiries | Total inquiry memberships across active segments. An inquiry appearing in more than one segment is counted more than once. |
| Unassigned Segments | Active segments with no assigned user or team. |
| Top Segment | Active segment with the highest inquiry count, including that count. Tie handling is `Needs Business Confirmation`. |

#### Create a segment

1. The user must enter a segment name and criteria.
2. **Static Segment** must be selected by default.
3. Selecting **Static Segment** must show **Generated inquiry** and hide dynamic rule fields.
4. Selecting **Dynamic Segment** must hide **Generated inquiry** and show dynamic rule fields.
5. Saving must evaluate the entered criteria against available inquiry data and store the matching inquiry IDs in the segment.
6. A new segment must start as active and unassigned.
7. After a successful save, the screen must clear the entered values, refresh segment information, show a success message, and open the Assignment Screen.
8. The business effect of **Generated inquiry** on static segment membership is `Needs Business Confirmation` because the field is displayed but is not applied by the current behavior.

#### Criteria behavior

1. Criteria joined with **AND** must match all entered conditions.
2. Criteria joined with **OR** must match at least one entered condition.
3. Matching must use the inquiry properties available on this screen: name, course, source, city, pincode, mode, academic status, lead status, lead age, assigned counselor, lead owner, and owner team.
4. The approved structure, operator list, and case-sensitivity rules for manually entered criteria are `Needs Business Confirmation`.

#### Manage segments

1. **Clear** must reset the create form.
2. **Edit** must load the selected active segment into the form. Saving currently creates a new updated segment rather than replacing the original; whether this remains the production rule is `Needs Business Confirmation`.
3. **Duplicate** must create a new active segment with the same details and a distinct ID, a new creation date, and "Copy" added to its name.
4. **Archive** must move an active segment to the archived list and remove it from the assignment queue.
5. **Restore** must return an archived segment to the active list and assignment queue.
6. **View Details** must show the segment name, inquiry count, and criteria.
7. **Rename** must change the segment name. How the replacement name is captured is `Needs Business Confirmation`.
8. **Export** must download all active and archived segments as CSV with Name, Type, Criteria, Leads, Assigned, and Archived columns.
9. Empty active and archived lists must show clear empty-state messages.

### Field Requirements

| Field | Type | Requirement |
|---|---|---|
| Segment name | Text | Required; leading and trailing spaces removed. Maximum length and uniqueness are `Needs Business Confirmation`. |
| Generated inquiry | Select | Static segments only: Today, This Week, This Month, or All Time. Its filtering behavior is `Needs Business Confirmation`. |
| Criteria | Multiline text | Required; leading and trailing spaces removed. |
| Segment type | Two-option selector | Required: Static Segment or Dynamic Segment. Defaults to Static Segment. |
| Source | Select | Dynamic segments only: Instagram Ad, Website, Walk-in, or Google Ads. |
| Course | Select | Dynamic segments only: UPSC Foundation, GPSC Class 1-2, Sankalp Programme, or IAS/IPS Coaching. |
| Mode | Select | Dynamic segments only: Classroom, Online, or Residential. |
| Date | Date | Dynamic segments only; optional. Meaning of the date is `Needs Business Confirmation`. |
| Academic status | Select | Dynamic segments only: Graduation Running, Graduation Completed, HSC Completed, or Post Graduation. |
| City | Text | Dynamic segments only; optional. |
| Pincode | Text | Dynamic segments only; optional; maximum six characters with numeric input expected. Exact numeric validation is `Needs Business Confirmation`. |
| Lead status | Select | Dynamic segments only; Any Status, New Inquiry, Contacted, Interested, Follow-up, Counselling, Converted, or Lost. |
| Lead age | Select | Dynamic segments only; Any Age, Same Day, 1 Day, 2 Days, or 3+ Days. |
| Assigned counselor | Select | Dynamic segments only; Any Counselor or an available counselor. |
| Lead owner | Select | Dynamic segments only; Any Owner, UPSC Team, GPSC Team, Sankalp Team, or Admin. |

### Business Rules & Conditions

1. A segment is either active or archived.
2. Archived segments must not appear in the active assignment queue.
3. One segment may be assigned to multiple users or teams.
4. One inquiry may belong to multiple segments.
5. Dynamic segments are described as automatically updating when inquiry properties match. The refresh trigger, timing, removal of non-matching inquiries, and reassignment effect are `Needs Business Confirmation`.
6. Segment records currently reset to approved seed data when the page reloads. The production persistence method is `Needs Business Confirmation`.
7. Department or ownership-based record visibility is not applied on this screen. Required production data scope is `Needs Business Confirmation`.

### User Actions

- Switch between Segments and Assignments.
- Focus the create form through **Create Segment**.
- Select Static or Dynamic segment type.
- Clear or save the segment form.
- Select, edit, duplicate, rename, view, archive, or restore a segment.
- Export segment data.
- Open the Assignment Screen through **Assign Leads**.

### Data Dependencies

- Inquiry records and their matching properties.
- Segment records, including inquiry IDs, assigned users, and archive state.
- Counselor records.
- Role and permission data.
- A production data store for segments and assignments: `Needs Business Confirmation`.

### Validations

1. Segment name is required.
2. Criteria is required.
3. A dynamic segment must contain at least one dynamic rule.
4. Save must be blocked with an error message when required values are missing.
5. Actions requiring a selected segment must show an error when no segment is available.
6. Pincode format, duplicate segment names, date constraints, and criteria syntax errors are `Needs Business Confirmation`.

### Permissions

1. Admin and HOD may create, edit, duplicate, archive, restore, assign, remove assignments, and export.
2. Counselors must have read-only segment and assignment views; form controls and drag-and-drop changes must be unavailable.
3. All roles may switch tabs, filter assignment groups, and view segment details.
4. Counselor export access is `Needs Business Confirmation`.
5. Production record scope by role or department is `Needs Business Confirmation`.

### Acceptance Criteria

1. The Segments tab opens with Static Segment selected and active and archived lists displayed separately.
2. A permitted user cannot save without both a segment name and criteria.
3. Switching segment type displays only the fields relevant to that type.
4. Saving valid data creates an active, unassigned segment with matched inquiry IDs and opens the Assignment Screen.
5. Duplicate creates a separate active segment without changing the source segment.
6. Archiving removes a segment from the active list and assignment queue; restoring returns it.
7. A counselor can view segment information but cannot change segment or assignment data.
8. Export produces a CSV containing all displayed segment states and assignment values.

---

## Screen 2: Assignment Screen

### Screen Purpose

Assign active segments to counselors or operational teams, review current segment ownership, and remove existing assignments.

### Users/Roles

| Role | Access |
|---|---|
| Admin | View assignment information, assign active segments, and remove assignments. |
| Head of Department (HOD) | View assignment information, assign active segments, and remove assignments. |
| Counselor | View assignment information only. |

### Primary Business Requirements

1. The screen must list assignable users under four distinct groups: Counselors, Admission Team, Tally Caller, and Staff.
2. The screen must show all active segments in an assignment queue.
3. A permitted user must be able to assign a segment by dragging it onto a user or team member.
4. The screen must show each user's current active segment assignments and each segment's current assignees.
5. A permitted user must be able to remove an existing segment assignment.

### Functional Requirements

#### Assignment summary

The screen must display:

| Summary | Required meaning |
|---|---|
| Assigned Leads | Inquiries with a current assigned owner. |
| Unassigned Leads | Inquiries without a current assigned owner. |
| Reassigned Leads | Inquiries whose communication history contains an assignment event. The authoritative event rule is `Needs Business Confirmation`. |
| Average Leads / Counselor | Rounded average of inquiries owned by the available counselors. |

#### User and segment lists

1. Counselors must be selected by default.
2. Selecting a group must show only members of that group.
3. Each member must show name, role, and active segment assignments.
4. The active segment queue must show segment name, current assignees or **Unassigned**, and segment criteria.
5. If a group has no members, the screen must show **No members in this group**.
6. If no active segments exist, the queue must show an empty-state message directing the user to create a segment.

#### Assign and remove

1. Dragging an active segment onto a member must assign that segment to the member.
2. Assigning a segment to a member who already has it must not create a duplicate assignment.
3. A segment may remain assigned to multiple members.
4. Removing an assignment must affect only the selected member-segment relationship.
5. After assignment or removal, the user list, segment queue, segment library, and assignment summary must refresh and a confirmation message must be shown.

#### Assignment history

1. The screen must show an Assignment History area containing inquiry number, assignee, assigned by, assignment date, assignment type, and current owner.
2. The current rows are presentation records rather than a confirmed audit source. The production history source, ordering, retention, and definitions of Manual and Reassignment are `Needs Business Confirmation`.

### Field Requirements

| Displayed data | Requirement |
|---|---|
| Group | Counselors, Admission Team, Tally Caller, or Staff. |
| Member name | Name of the assignable user or team member. |
| Member role | Role or team shown for the member. |
| Assigned segments | Active segments currently assigned to the member. |
| Segment name | Name of the active segment available for assignment. |
| Current assignees | Assigned member names, or Unassigned. |
| Segment criteria | Criteria used to define the segment. |
| Assignment history values | Inquiry number, assignee, assigned by, date, assignment type, and current owner. |

### Business Rules & Conditions

1. Only active segments may be assigned.
2. An assignment is unique for each segment-member pair.
3. The same segment may be assigned to more than one member.
4. Removing one assignment must not remove other assignees from that segment.
5. Archiving a segment removes it from the queue and from members' active assignment displays; whether archived assignments are retained for reporting is `Needs Business Confirmation`.
6. Assigning a segment currently updates the segment-to-member relationship but does not update the owner of each inquiry in that segment. The required production ownership handoff is `Needs Business Confirmation`.
7. Assignment persistence after page reload is `Needs Business Confirmation`.

### User Actions

- Switch among Counselors, Admission Team, Tally Caller, and Staff.
- Review assignment summary values and history.
- Drag an active segment onto a member to assign it.
- Remove a segment from a member.
- Return to the Segments tab.

### Data Dependencies

- Active segment records and their inquiry memberships.
- Counselor directory.
- Admission Team, Tally Caller, and Staff directories.
- Inquiry ownership and communication history.
- Current segment-to-member assignments.
- Authenticated user role and permissions.
- Authoritative assignment audit records: `Needs Business Confirmation`.

### Validations

1. The segment must exist and be active before assignment.
2. The target member must exist in one of the available groups.
3. The same segment-member assignment must not be duplicated.
4. Removal must be ignored when the segment or assignment no longer exists.
5. Assignment and removal must be blocked for users without assign permission.

### Permissions

1. Admin and HOD may assign segments and remove assignments.
2. Counselors may view groups, members, segments, summaries, and history but may not drag segments or remove assignments.
3. Required department-based visibility of members, segments, and inquiries is `Needs Business Confirmation`.

### Acceptance Criteria

1. Opening the Assignments tab displays summary information, Counselors, and the active segment queue.
2. Switching a group displays only that group's members and their active segment assignments.
3. A permitted user can drag an active segment onto a member and see the assignment reflected immediately in both member and segment views.
4. Repeating the same assignment does not create a duplicate.
5. A permitted user can remove one assignment without affecting the segment's other assignees.
6. Archived segments do not appear in the assignment queue or active member assignment lists.
7. A counselor can review assignment information but cannot assign or remove segments.
8. Empty member groups and an empty segment queue display their approved empty-state messages.
