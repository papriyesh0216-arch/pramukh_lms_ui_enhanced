# Phase 1 - Primary Requirements

## Inquiry List Calendar View

### Screen Purpose

Provide authorized LMS users with a calendar-based view of active inquiries that require action. The screen allows users to review inquiry workload by period and category, then open the relevant Inquiry Row View without leaving the Calendar screen.

### Users/Roles

| Role | Calendar data scope |
|---|---|
| Admin | All active inquiries |
| Head of Department (HOD) | Active inquiries within the user's department |
| Counselor | Active inquiries assigned to the user |

### Primary Business Requirements

- **BR-01:** The Inquiry List calendar button must open the Inquiry List Calendar View.
- **BR-02:** The screen must show only active, non-archived inquiries within the signed-in user's permitted scope.
- **BR-03:** Users must be able to review calendar items in Month, Week, Day, and Row views.
- **BR-04:** Users must be able to filter the displayed inquiries by All, Overdue, Follow-up Due, or Pending Leads.
- **BR-05:** Selecting a mapped inquiry or applicable date must open the existing Inquiry Row View in a popup and must not redirect to the Inquiry List.
- **BR-06:** Existing row-level actions and permissions must remain available inside the popup and Row View.

### Functional Requirements

#### Opening and Navigation

- **FR-01:** Clicking the calendar button in the Inquiry List must open this Calendar screen.
- **FR-02:** Previous, Today, and Next controls must move the active period according to the selected view: month, week, or day.
- **FR-03:** The screen must show the applicable month, week range, or selected date as its period heading.
- **FR-04:** A mini calendar must allow the user to select a date and identify dates containing Pending, Overdue, Follow-up, or Done activity.

#### Count Cards and Filtering

- **FR-05:** The screen must provide four selectable count cards: All, Overdue, Follow-up Due, and Pending Leads.
- **FR-06:** Selecting a card must visibly identify it as active and refresh the current Month, Week, Day, or Row view using that category.
- **FR-07:** **All** must show all mapped inquiries that require action for the active period.
- **FR-08:** **Overdue** must show only mapped overdue inquiries.
- **FR-09:** **Follow-up Due** must show only mapped inquiries categorized as follow-up due.
- **FR-10:** **Pending Leads** must show only mapped pending leads with no follow-up date.
- **FR-11:** Each count card must show the number of unique mapped inquiries in its category for the active period.

#### Calendar and Row Display

- **FR-12:** Week View must present Monday through Sunday with hourly schedule slots and mapped inquiry activities.
- **FR-13:** Day View must present the selected date, its scheduled-item count, hourly schedule slots, and mapped inquiry activities.
- **FR-14:** Month View must present a Monday-to-Sunday month grid.
- **FR-15:** Each current-month date in Month View must show separate counts for Overdue, Pending Leads, and Follow-up Due. Individual inquiry names must not appear in month cells.
- **FR-16:** Dates outside the active month may be displayed for calendar continuity but must not open inquiry rows.
- **FR-17:** A single dynamic display button must switch between Calendar and Row displays. It must show the Row icon in Calendar display and the Calendar icon in Row display.
- **FR-18:** Row View must show the unique inquiries mapped to the active period and selected category using the existing Inquiry Row View.

#### Inquiry Popup

- **FR-19:** Clicking an inquiry activity in Week or Day View must open the relevant inquiry in a modal popup.
- **FR-20:** Clicking a current-month date in Month View must open all inquiries mapped to that date under the active category filter.
- **FR-21:** The popup must use the existing Inquiry Row View and retain its available actions, buttons, expandable content, and updates.
- **FR-22:** Duplicate calendar activities for the same inquiry must produce only one inquiry row in the popup.
- **FR-23:** The popup must be closable through its close control, the popup backdrop, or the Escape key.
- **FR-24:** If no permitted inquiry is available for the selected item, the user must receive a warning and no empty popup must be opened.

#### Supporting Lists

- **FR-25:** The side panel must show separate lists for Overdue Leads, Follow-up Due Today, and Pending Leads.
- **FR-26:** Selecting an inquiry in a side list must open that inquiry in the same Inquiry Row popup.
- **FR-27:** The call action shown for a side-list inquiry must open the existing dialer for that inquiry.
- **FR-28:** A View All action must expand the selected side list from its initial limited set to all available entries in that category.

### Field Requirements

| Area | Required displayed information |
|---|---|
| Count card | Category name, unique inquiry count, and category description |
| Mini calendar | Month and year, weekday labels, date number, activity indicators, and category legend |
| Week activity | Time, activity type, and inquiry name |
| Day activity | Time, activity type, inquiry name, and course |
| Month date | Date number and separate Overdue, Pending Leads, and Follow-up Due counts |
| Side-list item | Inquiry identity, inquiry name, course, due description or time, category, and call action |
| Popup/Row View | The fields and controls already provided by the approved Inquiry Row View |

### Business Rules & Conditions

- **BR-C01:** Archived inquiries must be excluded from Calendar counts, mappings, lists, Row View, and popup results.
- **BR-C02:** A Pending Lead is an inquiry with status Pending or New and no follow-up date.
- **BR-C03:** An inquiry is treated as follow-up related when it has a follow-up date or has Follow-up, Contacted, or Interested status.
- **BR-C04:** An inquiry is Overdue when its follow-up date is earlier than the business current date.
- **BR-C05:** Category filters must remain applied when the user changes Calendar view or switches between Calendar and Row display.
- **BR-C06:** Counts and displayed results must use the same active period, category filter, and user data scope.
- **BR-C07:** The production source and rules used to create an inquiry's calendar date, time, and activity type are `Needs Business Confirmation`.
- **BR-C08:** The timezone and business-day boundary used for Today, Follow-up Due Today, and Overdue calculations are `Needs Business Confirmation`.
- **BR-C09:** The approved wireframe substitutes other inquiries when a category has no matching records. Whether production must use this fallback or show an empty state is `Needs Business Confirmation`.
- **BR-C10:** The business meaning and handling of Done activity beyond its mini-calendar indicator are `Needs Business Confirmation`.

### User Actions

- Open the Calendar from the Inquiry List calendar button.
- Select All, Overdue, Follow-up Due, or Pending Leads.
- Switch among Month, Week, and Day views.
- Switch between Calendar and Row displays.
- Navigate to the previous period, next period, or Today.
- Select a date from the mini calendar.
- Open mapped inquiries from calendar activities, month dates, or side lists.
- Use permitted Inquiry Row actions inside the popup or Row View.
- Expand a side list, start a call, or close the popup.

### Data Dependencies

- Active inquiry records available to the Inquiry List, including inquiry ID, name, course, status, follow-up date/time, assigned user, department/team, and archived state.
- The signed-in user's role, department, identity, and Inquiry List permissions.
- Calendar activity mapping containing the inquiry reference, mapped date, mapped time, activity type, and category.
- Calendar count data for Pending, Overdue, Follow-up, and Done activity indicators.
- Existing Inquiry Row View and dialer behavior.
- The authoritative production source and persistence method for calendar mappings and count data are `Needs Business Confirmation`.

### Validations

- A mapped calendar item must reference an existing, active inquiry before it can be displayed or opened.
- A date selected for popup display must be a valid current-month date.
- The active category value must be All, Overdue, Follow-up Due, or Pending Leads.
- Popup results must be de-duplicated by inquiry ID and rechecked against the user's current scope.
- Missing or inaccessible inquiry references must not expose inquiry data and must produce the approved warning behavior.
- Required production validation for missing or invalid mapped dates, times, statuses, or categories is `Needs Business Confirmation`.

### Permissions

- Admin may view calendar data for all active inquiries.
- HOD may view calendar data only for inquiries in the HOD's department.
- Counselor may view calendar data only for inquiries assigned to that counselor.
- Popup and Row View actions must follow the existing Inquiry List permissions for the signed-in role.
- Calendar-specific restrictions beyond inquiry scope and existing row-action permissions are `Needs Business Confirmation`.

### Acceptance Criteria

1. Clicking the Inquiry List calendar button opens the Inquiry List Calendar View.
2. Only active, non-archived inquiries within the signed-in user's scope are counted and displayed.
3. All four count cards are selectable and correctly filter Month, Week, Day, and Row views.
4. Previous, Today, Next, mini-calendar selection, and Month/Week/Day switching update the displayed period correctly.
5. Month View shows only separate Overdue, Pending Leads, and Follow-up Due counts in each date cell; no inquiry names are shown.
6. Week and Day activities show the approved schedule details and open the relevant inquiry popup when selected.
7. Clicking a current-month date opens all unique, permitted inquiries mapped to that date under the active filter.
8. Calendar items do not redirect the user to the Inquiry List.
9. The dynamic display button switches between Calendar and Row displays and shows the icon for the destination display.
10. The popup and Row View use the existing Inquiry Row View with all permitted actions still operational.
11. Popup results remain limited to the selected item or date and contain no duplicate inquiry rows.
12. The popup closes through the close control, backdrop, and Escape key.
13. Side-list inquiry selection, View All, and call actions work as displayed.
14. Changing the signed-in role refreshes counts and results to the correct role scope.
