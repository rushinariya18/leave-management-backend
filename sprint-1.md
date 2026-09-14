# POC: Leave and Absence Management

**Track:** Scheduling · **Status:** Required · **Path:** React to Full Stack — 101 (2-week solo POC)
**Stack:** Express · PostgreSQL · Prisma

## 1. Background

Teams lose track of who is off and when. Leave requests sit in inboxes, balances get argued
over at year end, and two people on the same team book the same week without anyone noticing
until it's too late.

You're building the system that fixes this: employees request leave against a real balance,
managers approve or reject it, and the team can see who's away without asking around.

This is a real-world HR workflow — treat it the way you would a client engagement, not a CRUD
exercise. The interesting parts are what happens at the edges: two approvals landing at once,
a balance that must never go negative, and an approved request someone tries to quietly edit.

## 2. Actors

| Role                                 | Can do                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Employee**                         | Submit leave requests, view their own balance and history, view the team calendar           |
| **Manager**                          | Approve/reject requests for their team, see team overlaps, cannot approve their own request |
| **HR / Admin** _(optional, stretch)_ | Configure leave types and allowances, view across all teams                                 |

## 3. Functional requirements

### 3.1 Leave balances

- Every employee has an annual balance per leave type (e.g. Annual, Sick, Unpaid).
- Balances are seeded per employee per year; how you model the "start of year" reset is your
  design decision — document it.
- A request that would take the balance below zero must be rejected before it reaches an
  approver.

### 3.2 Leave types

- At least three leave types, each with its own rules: does it draw from a balance at all
  (Unpaid typically doesn't), does it require manager approval, what's the default allowance.
- Leave type rules must live in data, not in scattered `if` statements — a new leave type
  should not require a code change to the approval logic.

### 3.3 Submitting a request

- Employee selects leave type, start date, end date, optional note.
- System computes the number of days requested (decide how you handle weekends/public
  holidays — state your assumption).
- Request enters a `pending` state and is visible to the employee's manager.

### 3.4 Approval

- Manager sees a queue of pending requests for their direct reports only.
- Manager approves or rejects with a reason (reason is required on rejection).
- **Approving a request must deduct from the balance correctly, every time** — this is the
  core hard case of this POC. Two managers (or the same manager double-clicking) approving the
  same request, or two requests for the same employee being approved at almost the same
  moment such that their combined total would exceed the balance, must not both succeed.
  How you guarantee that is entirely your design decision.
- Once approved, a request is locked: the employee cannot silently edit its dates. An edit
  after approval must go through cancel-and-resubmit, or an explicit amendment flow you design
  and justify.

### 3.5 Team overlap

- Before or during approval, the manager should see whether the request overlaps with other
  approved/pending leave in the same team.
- Overlap detection should be a real query, not an eyeballed calendar — you'll be asked to show
  it and explain its cost as the team grows.

### 3.6 Team calendar

- A shared view (by team, by month) showing who is away and for what leave type.
- Should be usable at "one whole company," not just one team of five — think about how this
  query scales before you write it.

## 4. Data to think through

You choose the exact schema. At minimum, your model needs to represent: employees and their
manager, the leave types and their rules, each employee's balance per leave type per year, and
the requests themselves with their status and decision history.

The question worth sitting with before you write any code: is a person's remaining balance
something you calculate whenever it's needed, or something you keep a running total of and
update as requests are approved? Both are legitimate designs. Pick one, and be ready to defend
it — including what happens to it under the concurrent-approval case in §3.4.

## 5. How it's exposed

Design the API surface — routes, methods, request/response shapes — however fits the workflow
above. There's no prescribed structure here; the requirements in §3 are the spec, not a
particular set of endpoints.

## 6. Things this POC will specifically be checked for

- Bad input — an invalid date range, a leave type that doesn't exist, a request with no
  employee — should be rejected before it reaches your business logic, with a response a
  frontend could actually use.
- There's no anonymous path through this system; every action is tied to a real, authenticated
  user.
- A manager should only ever be able to see and act on requests from their own reports —
  including if they try to reach someone else's request directly by its ID. Prove this with a
  test, not a review of the UI.
- The approve-and-deduct step (§3.4) needs to hold up when two approvals happen at almost the
  same instant. This is the single most important thing this POC is testing — have a test that
  actually exercises it concurrently, not one that just checks the sequential case.
- The team calendar and any list of requests need to stay usable as the company grows — don't
  load everything into memory and filter in code.
- Every approval and rejection should leave a trace of who did it and when — this is your
  audit trail if a decision is ever disputed.
- The whole thing should come up with `docker compose up` and no manual setup beyond a
  documented `.env`.

## 7. Walkthrough questions to expect

NOTE: These are indicative questions only. Expect to be asked further questions in a similar
spirit during the walkthrough.

1. Where is the balance stored, and what happens if I edit it directly in the database?
2. A request is approved, then the employee edits the dates. What does your system do?
3. Leave types have different rules. Where does that logic live, and why there?

## 8. If you finish early (optional)

Don't add new features — deepen what's here:

- Add a leave type with a genuinely different rule (e.g. one that requires two-step approval
  above a threshold of days) and show the rule-driven design handles it without new `if`
  branches in the approval controller.
- Add an audit view showing the full history of decisions on a request, not just the final
  state.
- Load-test the team calendar query at a simulated 5,000 employees and show the query plan.

Leave Types:

Planned Leave (10)
must be applied before 5 working days.
max 5 days can be applied in a single request.

Sick Leave (5)
can be apply anytime. even employee can apply for running day off.
only 1 day can be applied in a single request.

Unpaid Leave (30)
must be applied before 5 working days.
max 5 days can be applied in a single request.

floater leave (2)
must be applied before 5 working days.
only 1 day can be applied in a single request.
employee can apply 1 leave per on 1st half of the year, 2nd leave per 2nd half of the year. 2 leaves in a single half year can't be applied at the same time.

HR/Admin can approve leaves for any user.

Audit logs:
users can see audit logs on their leave request.
manager can see audit logs on their team's leave request/cancel request.

consider Team Calendar & Team overlap detection.
