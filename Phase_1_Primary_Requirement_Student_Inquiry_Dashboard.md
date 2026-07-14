# Phase 1 - Primary Requirements

## Student Inquiry Dashboard

### Screen Purpose

Provide a role-based overview of student inquiries, lead progress, follow-up workload, counselor performance, and admission conversion activity from one screen.

### Users/Roles

| Role | Dashboard scope |
|---|---|
| Admin | Global inquiry KPIs and all counselor performance rows. |
| Head of Department (HOD) | Department-scoped inquiry KPIs and the counselors available to the HOD view. The exact counselor-to-department mapping is `Needs Business Confirmation`. |
| Counselor | KPIs for inquiries assigned to the logged-in counselor and only that counselor's performance row. |

### Primary Business Requirements

1. The dashboard must summarize inquiry workload and conversion activity for the logged-in user's permitted scope.
2. It must present KPI counts, inquiry distributions, conversion stages, counselor performance, action-required metrics, and scheduled activity.
3. Users must be able to select a course and date period from the dashboard.
4. The dashboard must provide direct access to the Inquiry List, Follow-Up Calendar, AMS, and print action without documenting those destination screens.
5. Dashboard values must come from authoritative inquiry, follow-up, counselor, and admission data. The current date-filtered values are presentation data; their production source is `Needs Business Confirmation`.

### Functional Requirements

#### Dashboard filters

1. The course filter must offer All Courses, UPSC, GPSC-Class1,2, Class-3, Sankalp, and Sampurn.
2. The custom date control must allow From Date and To Date selection.
3. Quick date options must include This Month, This Week, Today, and Quarter.
4. Applying a valid range must display the selected dates on the control and refresh applicable dashboard information.
5. The exact dashboard sections affected by course and date filters are `Needs Business Confirmation` because the current controls do not apply real record filtering.
6. Clearing the custom date must remove the displayed date selection. Whether dashboard values must also reset is `Needs Business Confirmation`.

#### KPI summary

The screen must display six KPI cards for the permitted inquiry scope:

| KPI | Confirmed definition |
|---|---|
| Total Leads | Count of non-archived inquiries within the user's scope. |
| Pending Leads | Inquiries with New or Pending status. |
| Follow-ups Due | Inquiries containing a follow-up date. Whether this means all scheduled or only due follow-ups is `Needs Business Confirmation`. |
| Counselling Scheduled | Inquiries whose stage or status identifies Counselling. |
| Total Admission Form | Inquiries with Admission Confirmed or Converted status. The intended difference between admission forms and converted inquiries is `Needs Business Confirmation`. |
| Close Leads | Inquiries with Lost, Closed, or Admission Rejected status. |

Each KPI must show a count, a period or scope label, and a growth indicator. The comparison period and growth calculation are `Needs Business Confirmation`.

#### Lead Journey Analytics

1. The dashboard must provide a Lead Journey Analytics area described as showing stage-wise counts, bottlenecks, and conversion health.
2. The user must be able to open the Inquiry List from this area.
3. The journey stages, calculations, bottleneck definition, and course-filter behavior are `Needs Business Confirmation` because the current analytics area contains no rendered results.

#### Inquiry charts

1. **Course-wise Inquiry Distribution** must show the percentage distribution for UPSC, GPSC, Sankalp, IAS/IPS, and Others.
2. **Lead Status Overview** must show count and percentage by lead status.
3. **Conversion Funnel** must show Total Leads, Contacted, Interested, Counselled, and Admission with count and percentage at each stage.
4. Chart legends and values must remain readable when the display theme changes.
5. Course and status charts must offer the period options shown on the screen. Their production filtering behavior is `Needs Business Confirmation` because the current selectors do not change the data.
6. The authoritative data source and calculation period for all three charts are `Needs Business Confirmation`.

#### Counselor Performance

1. The table must show Counselor, Leads Assigned, Contacted, Interested, Admissions, and Conversion Percentage.
2. Admin must see all counselor rows.
3. A counselor must see only their own row.
4. HOD must see only counselors permitted within the HOD view. The production department mapping is `Needs Business Confirmation`.
5. The table must provide This Month, Last Month, and This Quarter period options.
6. The effect of the period selector is `Needs Business Confirmation` because it does not currently refresh the table.
7. Conversion percentage must be presented as a number and progress indicator. Its approved formula is `Needs Business Confirmation`.

#### Action-required metrics

1. The dashboard must show Untouched Leads, Overdue Follow-ups, and Hot Leads.
2. Selecting any metric or its **View Leads** action must open the Inquiry List.
3. Untouched Leads are labeled Never Contacted, Overdue Follow-ups are labeled Past Due Date, and Hot Leads are labeled High Priority.
4. The production definitions, role scope, date scope, and count calculations are `Needs Business Confirmation` because the current values are fixed presentation values.

#### Calendar and activities

1. The activity area must rotate between the mini calendar, Today's Activities, and Recent Lead Activities.
2. The user must be able to move to the previous or next activity panel.
3. The panels must also rotate automatically. The approved rotation interval is `Needs Business Confirmation`.
4. The mini calendar must identify dates containing pending, overdue, or follow-up activity.
5. The user must be able to move between calendar months and select a date.
6. Selecting a date must identify it as selected and refresh applicable dashboard information.
7. The calendar grid refresh behavior for month navigation and the real-data behavior for selected dates are `Needs Business Confirmation`.
8. **Go to Follow-Up Calendar** and Today's Activities **View All** must open the Follow-Up Calendar.
9. Each Today's Activity item must show activity name, course, and time.
10. Each Recent Lead Activity item must show activity description, supporting detail, and time.
11. The destination of Recent Lead Activities **View All** is `Needs Business Confirmation` because no functional action is defined.
12. Activity data source, ordering, role scope, and maximum displayed item count are `Needs Business Confirmation`.

#### Lead Score Guide

The dashboard must display the approved score bands:

| Score | Classification |
|---|---|
| 80-100 | High (Hot Lead) |
| 60-79 | Medium (Warm Lead) |
| 0-59 | Low (Cold Lead) |

#### Direct actions

1. **Print** must open the browser print workflow for the current dashboard.
2. **Inquiry List** and Lead Journey **View** must open the Inquiry List.
3. **Open AMS** must open the AMS entry page.

### Field Requirements

| Field or display value | Requirement |
|---|---|
| Course | Select; All Courses, UPSC, GPSC-Class1,2, Class-3, Sankalp, or Sampurn. |
| From Date | Date; required to apply a custom range. |
| To Date | Date; required to apply a custom range. |
| Quick range | This Month, This Week, Today, or Quarter. |
| Chart period | Options displayed by the relevant chart. |
| Counselor period | This Month, Last Month, or This Quarter. |
| KPI count | Non-negative whole number. |
| Growth indicator | Direction and percentage. Calculation is `Needs Business Confirmation`. |
| Counselor conversion | Percentage displayed with a progress indicator. |
| Activity item | Description, supporting course or outcome, and time. |
| Calendar date | Date with pending, overdue, follow-up, today, or selected state where applicable. |

### Business Rules & Conditions

1. Archived inquiries must not be included in role-scoped KPI counts.
2. Admin inquiry scope is global, HOD scope is departmental, and counselor scope is assigned inquiries only.
3. Inquiry and counselor figures must refresh when the active role changes.
4. Role-scoped KPI counts and counselor rows must not include records outside the user's permitted scope.
5. Whether aggregate charts, action-required metrics, calendar activity, and activity feeds follow the same role scope is `Needs Business Confirmation`.
6. A lead score of 80 or more is Hot, 60-79 is Warm, and 0-59 is Cold.
7. Dates with overdue activity must be visually distinguishable from dates containing only pending or follow-up activity.
8. The exact business meaning of Total Leads versus Total Inquiries is `Needs Business Confirmation` because both terms are used on the screen.

### User Actions

- Select a course.
- Open, apply, cancel, or clear a custom date range.
- Select a quick date range.
- Select chart and counselor reporting periods.
- Open the Inquiry List or print the current dashboard from its direct actions.
- Open AMS.
- Review KPI cards, charts, funnel stages, counselor performance, and score bands.
- Open action-required lead groups.
- Move through activity panels.
- Navigate calendar months and select a date.
- Open the Follow-Up Calendar.

### Data Dependencies

- Authenticated user role, department, and assigned-user identity.
- Non-archived inquiry records with status, stage, course, follow-up date, owner team, and assignee.
- Counselor performance records.
- Course distribution data.
- Lead status distribution data.
- Conversion funnel data.
- Follow-up calendar totals.
- Today's activities and recent lead activities.
- Lead score values or classifications.
- Authoritative sources for filtered and historical dashboard data: `Needs Business Confirmation`.

### Validations

1. Both From Date and To Date are required to display an applied custom range. Missing-date handling is `Needs Business Confirmation`.
2. Whether From Date must be on or before To Date is `Needs Business Confirmation` because no current validation is defined.
3. Counts must not be negative.
4. Percentages must use valid numeric values.
5. Missing dashboard datasets must not prevent the rest of the screen from loading. The approved empty-state messages are `Needs Business Confirmation`.
6. Course and period selections must use only the options provided on the screen.

### Permissions

1. Admin, HOD, and Counselor may view the dashboard and use its visible navigation, filtering, and print actions.
2. Admin may view global KPI and counselor performance information.
3. HOD may view department-scoped KPI information and permitted counselor rows.
4. Counselor may view assigned-inquiry KPIs and only their own counselor performance row.
5. Permission differences for opening AMS, printing, and viewing aggregate chart or activity data are `Needs Business Confirmation` because no dashboard-specific restrictions are defined.

### Acceptance Criteria

1. The dashboard opens with six KPI cards calculated from non-archived inquiries within the logged-in user's scope.
2. Switching roles refreshes KPI values and counselor rows according to the approved scope.
3. Admin sees all counselor rows, while a counselor sees only their own row.
4. The dashboard displays course distribution, status overview, conversion funnel, counselor performance, action-required metrics, calendar, activities, and lead score bands.
5. A custom date range displays on the dashboard when both dates are present; missing-date handling is `Needs Business Confirmation`.
6. Applying a valid date range displays the selected dates and refreshes all dashboard sections confirmed as date-dependent.
7. Course and reporting-period controls refresh the sections confirmed as dependent on those controls.
8. Selecting an action-required metric opens the Inquiry List.
9. The activity panel supports automatic and manual movement between Calendar, Today's Activities, and Recent Lead Activities.
10. Calendar and Today's Activities actions open the Follow-Up Calendar.
11. Inquiry List actions open the Inquiry List, Open AMS opens AMS, and Print opens the browser print workflow.
12. KPI counts and counselor rows do not display information outside the logged-in user's approved scope.
