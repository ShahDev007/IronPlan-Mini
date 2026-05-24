# User Story — Capital Planning Report Export

**ID:** IRON-14  
**Epic:** Capital Planning  
**Priority:** High  
**Status:** Ready for Development  
**Points:** 5  
**Assignee:** —  
**Reporter:** Shah Dev  
**Created:** 2026-05-24  

---

## Story

> **As a** facility administrator at Lincoln County Detention Center,  
> **I want to** view a capital planning summary that shows all equipment with a condition score of 1 or 2, grouped by room with total replacement costs,  
> **so that** I can prepare a budget request for the county commissioners and prioritize which repairs need funding in the next fiscal year.

---

## Background

County jails submit annual capital improvement requests to their county board. The current process requires a facility manager to manually walk each wing, cross-reference a spreadsheet, and produce a Word document. IronPlan Mini already stores condition scores and replacement costs — this story surfaces that data in a structured, actionable format.

The `/facilities/{id}/report` endpoint already returns `critical_count`, `poor_count`, and `critical_replacement_cost` in JSON. This story covers both the frontend display and a CSV export of the filtered list.

---

## Acceptance Criteria

```
Given I am on the Capital Planning dashboard for a facility
  And the facility has equipment records in the database

When the page loads
Then I see a summary card showing the total count of Critical (score=1) items
And I see a summary card showing the total count of Poor (score=2) items
And I see a cost card showing the total replacement cost for all Critical + Poor items
And all three values match the values returned by GET /facilities/{id}/report

When I click "Export CSV"
Then a CSV file downloads to my browser
And the CSV contains one row per equipment item with condition_score <= 2
And the CSV columns are: room_name, equipment_name, type, condition_score, replacement_cost, last_inspected, manufacturer, notes
And the CSV filename is "{facility_name}_capital_plan_{YYYY-MM-DD}.csv"
And the download does not require a round-trip to the server (generated client-side from loaded data)

When no equipment has condition_score <= 2
Then the cost card displays "$0"
And the Export CSV button is disabled with tooltip "No critical or poor items to export"

When the facility data is still loading
Then the Export CSV button is in a loading/disabled state
```

---

## Out of Scope

- PDF export (separate story: IRON-15)
- Email delivery of the report
- Role-based access control on the export
- Multi-facility comparison view

---

## Technical Notes

**Frontend (`Dashboard.jsx`):**  
- Filter `equipment` array already held in `App` state: `equipment.filter(e => e.condition_score <= 2)`  
- Use `URL.createObjectURL(new Blob([csvString], { type: 'text/csv' }))` for client-side download — no new API call needed  
- Disable export button when `loading === true` or `criticalItems.length === 0`

**CSV generation helper** (suggested utility in `src/utils/exportCsv.js`):  
```js
export function toCsvBlob(rows, columns) {
  const header = columns.join(',')
  const body = rows.map(r =>
    columns.map(c => JSON.stringify(r[c] ?? '')).join(',')
  ).join('\n')
  return new Blob([`${header}\n${body}`], { type: 'text/csv' })
}
```

**No backend changes required** for the MVP implementation.  
If server-side PDF generation is added later (IRON-15), the same filtered data can be POSTed to a `/report/export` endpoint.

---

## Definition of Done

- [ ] Summary cards render correct counts and cost from API data
- [ ] Export CSV downloads with correct filename and all required columns
- [ ] Export button disabled state works (loading + empty data)
- [ ] Tested with Lincoln County seed data — verifies 4 critical items, correct total cost
- [ ] Tested with a facility with zero critical items — button disabled, tooltip visible
- [ ] No console errors on load or export
- [ ] Code reviewed and merged to `main`
