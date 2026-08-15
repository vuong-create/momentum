# Momentum — Finance Pillar

**Status:** 🟢 Finance 3 Goals, Rollover, and Monthly Close Implemented
**Next Step:** Momentum Data Safety — Versioned Backup and Restore

---

# 1. Purpose

The Finance pillar is a detailed financial command center designed to answer:

> **How am I doing financially?**

It should preserve the depth and data visibility of a spreadsheet while being significantly more enjoyable and easier to use.

The desired balance is approximately:

* 50% data/spreadsheet
* 50% polished modern application

The system should be detailed without feeling complicated.

---

# 2. Core Principles

## Transactions First

Transactions are the primary source of financial data.

One transaction should automatically update:

* Account balances
* Monthly spending
* Budgets
* Progress bars
* Reports
* Income
* Investments
* Savings
* Net worth where applicable

Data should never need to be entered twice.

## Low Friction

Manual financial tracking only works if entering data is extremely fast.

Common actions should require as few clicks as possible.

## Reward Progress, Don't Punish Spending

Finance should encourage good financial behavior without creating guilt.

Going over budget should be clearly visible, but should not result in punishment.

## Detailed but Approachable

Finance can contain substantial data, reports, and numbers.

The everyday pages should remain easy to understand, while deeper analytics are available when wanted.

---

# 3. Finance Navigation

The Finance pillar contains:

1. Dashboard
2. Transactions
3. Budget
4. Accounts
5. Goals
6. Investments
7. Reports
8. Monthly Review / Close Month

---

# 4. Transaction System

## Quick Entry

The Transactions page has an always-visible Quick Add form at the top.

No popup is required for normal transaction entry.

The goal is extremely fast entry.

Fields:

* Date
* Amount
* Type
* Category
* Merchant
* Account
* Notes
* Tags

Notes and Tags are optional.

Keyboard/tab navigation should allow rapid entry.

## Transaction Types

Four primary types:

* Expense
* Income
* Transfer
* Investment

Transfers do not count as spending or income.

## Merchant Memory

Momentum should remember frequently used merchants.

Typing:

`Ald...`

could suggest:

`Aldi`

and remember commonly associated information such as:

* Category: Groceries

This reduces repetitive entry.

## Transaction Table

Below Quick Add is a spreadsheet-style transaction table.

It should support:

* Search
* Sort
* Filters
* Inline editing
* Date filtering
* Category filtering
* Merchant filtering
* Account filtering
* Tag filtering
* Transaction type filtering

This section should intentionally feel more spreadsheet-like because detailed financial analysis is desirable.

---

# 5. Category System

Categories are fully customizable.

Users can:

* Add
* Rename
* Delete
* Reorder

The current structure intentionally uses one visible category level. Transaction
type provides the higher-level financial flow, avoiding redundant category and
subcategory decisions during entry.

## Default Categories

### Expense

Rent, Groceries, Dining, Household, Personal Care, Clothing, Fitness,
Volleyball, Language Learning, Entertainment, Gifts, Travel, Transportation,
Chump, Gas, Subscriptions, and Miscellaneous.

### Investment

Vanguard Brokerage, Crypto, and Individual Stocks.

### Income

NEO and SJVBC.

### Long-term Saving

HYSA.

These are defaults and remain fully customizable.

---

# 6. Tags

Transactions can optionally contain tags.

Tags allow expenses across different categories to be grouped around a common purpose.

Example:

`Taiwan 2027`

could contain:

* Dining
* Hotels
* Transportation
* Shopping

Reports can later calculate total spending for that tag regardless of category.

Tags are fully customizable.

---

# 7. Accounts

Accounts are fully customizable.

Each account contains:

* Name
* Type
* Current Balance

Supported account types include:

* Checking
* Savings
* Credit Card
* Investment
* Retirement
* Cash

Transactions automatically update the appropriate account balance.

Transfers move money between accounts without being counted as spending or income.

---

# 8. Budget System

Budgets are monthly.

Plan amounts are set directly on the single visible category level.

Example:

* Groceries — $500
* Dining — $250
* HYSA — $600
* Vanguard Brokerage — $400

## Monthly Setup

Each month has its own budget.

A **Copy Last Month** button creates the next month's budget using the previous month's base amounts.

The user then adjusts only what changed.

The goal is for normal monthly budget setup to take less than a minute.

---

# 9. Budget Progress Bars

Each planned category displays:

* Base budget
* Rollover
* Total available
* Amount spent
* Amount remaining
* Percentage used

Example:

Groceries

`$312 / $500 — 62%`

with an animated progress bar.

## Over-Budget State

Going over budget should be clearly noticeable.

When a transaction causes a category to exceed its budget:

* Progress bar changes to a strong warning state
* Subtle pulse animation occurs
* Amount over budget is displayed
* Optional subtle warning sound may play

Example:

Dining

`$347 / $300 — 116%`

`⚠ $47 over budget`

There is no XP penalty or financial punishment.

---

# 10. Positive Rollover System

Unused budget money is rewarded.

If a category finishes under budget, the unused amount rolls into the next month.

Example:

July Groceries

* Base Budget: $500
* Spent: $400
* Rollover Earned: $100

August Groceries

* Base Budget: $500
* Saved Rollover: +$100
* Total Available: $600

## No Negative Rollover

Overspending never carries forward.

Example:

July:

* Budget: $500
* Spent: $550

August simply begins again at the normal $500 base budget.

No $50 penalty is carried forward.

## Accumulating Rollover

Positive rollover can continue accumulating across multiple months.

## Cashing Out Rollover

Accumulated rollover can be manually cashed out.

Example:

Dining

* Base Budget: $250
* Saved Rollover: $180

Options:

* Keep Rollover
* Move to Savings

When moving rollover, the user chooses the destination account.

Examples:

* HYSA
* Vacation
* Another savings account

This turns staying under budget into a visible reward.

---

# 11. Income Planning

The monthly budget includes:

* Expected Income
* Actual Income
* Difference

Actual income is calculated from Income transactions.

Example:

* Expected Income: $6,000
* Actual Income: $6,430
* Difference: +$430

## Extra Income

If actual income exceeds expected income, Momentum can prompt:

> You earned $430 more than expected.

Options:

* Savings
* Investments
* Spending
* Split

Split allows the surplus to be divided between multiple destinations.

This prompt is optional and can be dismissed for later.

Momentum should encourage intentional decisions without forcing them.

---

# 12. Budget Summary

The top of the Budget page contains a monthly summary.

Example:

## August 2026

* Expected Income
* Actual Income
* Total Budgeted
* Total Spent
* Remaining
* Saved / Invested
* Rollover

Detailed category progress bars appear below.

---

# 13. Budget Page Graphs

The Budget page contains two primary graphs:

## Income vs. Spending

Shows month-to-month income and spending trends.

## Spending by Category

Shows where money went during the selected month.

More advanced graphs belong in Reports.

---

# 14. Goals

Finance supports two primary goal types.

## Contribution Goal

Example:

> Invest $8,000 this year.

## Balance Goal

Example:

> Reach $25,000 in HYSA.

Goals can use:

* Monthly timeframe
* Yearly timeframe
* Custom deadline

Goals display progress bars.

---

# 15. Investments

Momentum is not intended to become a stock portfolio tracker.

The primary focus is:

* Investment account balances
* Contributions
* Contribution progress

Example:

* Vanguard — $18,200
* 401(k) — $32,450
* Crypto — $1,150

Finance can display:

* Total invested balance
* Contributions this month
* Contributions this year

## Investment Holding Field

Investment transactions can optionally record the ticker/fund being purchased.

Example:

* Type: Investment
* Account: Vanguard
* Amount: $500
* Holding: VOO
* Date: July 31

Momentum does not need to track the live market value of individual holdings.

The Holding field exists for contribution analytics.

Reports can later answer questions such as:

> How much VOO did I purchase this year?

Example:

### 2026 Contributions by Holding

* VOO — $3,200
* VTSAX — $4,800
* VGT — $1,100

---

# 16. Investment Goals

Individual investment accounts can optionally have:

* Contribution goals
* Balance goals

Example:

401(k) Contributions

`$14,200 / annual goal`

with a progress bar.

Accounts without goals simply display their balances.

---

# 17. Net Worth

Net Worth is a major Finance metric.

Formula:

**Assets − Liabilities = Net Worth**

The dashboard displays current Net Worth prominently.

No separate Liquid Net Worth metric is required.

## Monthly Snapshots

Momentum automatically saves monthly net worth snapshots.

Example:

July 2026 → $42,500
July 2027 → $56,800

Growth:

`+$14,300 (+33.6%)`

Manual snapshots can also be created when desired.

Historical Net Worth analysis lives primarily in Reports.

---

# 18. Reports

Reports is intentionally the most data-heavy Finance page.

It is where deeper financial exploration happens without cluttering everyday pages.

Reports include:

* Income history
* Spending history
* Savings rate over time
* Spending by category
* Net worth over time
* Monthly surplus / deficit
* Merchant spending
* Tag spending
* Investment contributions
* Contributions by holding

## Report Timeframes

Reports support:

* 1 Month
* 3 Months
* 6 Months
* YTD
* 1 Year
* All Time
* Custom Date Range

Reports should support filtering and comparison wherever useful.

---

# 19. Monthly Review

At the end of each month, Momentum automatically generates a financial summary.

It includes:

* Income
* Spending
* Savings rate
* Amount invested
* Biggest spending category
* Categories over budget
* Categories under budget
* Net worth change
* Rollover earned

The user then receives three optional reflection prompts:

1. What went well financially this month?
2. What would you change next month?
3. Any purchase or decision worth remembering?

The review should be useful without feeling like homework.

---

# 20. Close Month

A dedicated **Close Month** action finalizes the financial month.

Before completion, Momentum shows a confirmation screen to prevent accidental closure.

Closing the month:

* Saves the monthly financial snapshot
* Saves the Monthly Review
* Calculates positive rollover
* Carries positive rollover forward
* Resets over-budget categories without penalty
* Creates next month's budget using previous base amounts
* Preserves accumulated rollover
* Updates financial history
* Updates net worth history

---

# 21. Finance Dashboard

The Dashboard answers:

> **How am I doing financially?**

within approximately five seconds.

It should combine polished visual design with meaningful numerical detail.

## Dashboard Hierarchy

### 1. Net Worth

Current Net Worth is displayed prominently.

Also show useful change information such as:

* Change this month
* Change this year

No artificial Financial Health score is needed.

Actual financial numbers are more useful.

### 2. This Month

Show:

* Income
* Expenses
* Saved / Invested
* Savings Rate

### 3. Budget Health

Show overall monthly budget status.

Also highlight important categories and categories requiring attention.

Budget progress bars should be visually prominent.

### 4. Accounts

Accounts use a compact table instead of individual cards.

Example:

| Account     | Type       | Balance |
| ----------- | ---------- | ------: |
| Checking    | Checking   |  $4,250 |
| HYSA        | Savings    | $18,500 |
| Vanguard    | Investment | $24,800 |
| 401(k)      | Retirement | $31,200 |
| Credit Card | Credit     |   -$620 |

The table should feel clean but data-rich.

### 5. Goals

Dashboard shows the **top 3 active financial goals**.

Goals use visual progress bars.

A **View All** action opens the complete Goals section.

### 6. Recent Transactions

Dashboard displays the **10 most recent transactions**.

Suggested columns:

* Date
* Merchant
* Category
* Amount

A **View All** action opens Transactions.

### 7. Dashboard Visualizations

Three primary visual sections:

#### Budget by Category

Shows budget vs. actual spending for categories.

Over-budget categories receive strong visual warnings.

#### Spending by Category

Shows the current month's spending distribution.

#### Income vs. Spending

Shows approximately the previous six months.

Net Worth history remains in Reports because current Net Worth is already prominent on the Dashboard.

---

# 22. Quick Actions

Finance Dashboard includes easily accessible Quick Actions:

* * Transaction
* Budget
* Close Month
* Reports

Selecting **+ Transaction** opens Transactions and immediately focuses the Quick Add form.

The purpose is minimizing navigation friction.

---

# 23. Visual Experience

Finance should not look like a traditional spreadsheet even though it contains spreadsheet-level detail.

It should remain part of the overall Momentum visual world.

Desired feeling:

* Calm
* Warm
* Polished
* Data-rich
* Responsive
* Satisfying

The cozy Taiwanese/Japanese café aesthetic should influence the surrounding interface without interfering with readability.

Financial data itself should remain extremely clear.

---

# 24. Micro-Rewards

Interactions should feel satisfying.

Examples:

## Logging Income

Possible effects:

* Soft cash-register sound
* Income number smoothly counts upward
* Relevant graphs animate
* Account balance updates
* Budget calculations update

## Logging Expense

Possible effects:

* Progress bar smoothly updates
* Account balance updates
* Spending graph adjusts

## Reaching a Goal

Possible effects:

* Gentle success animation
* Soft sound
* Progress bar completion effect

## Going Over Budget

Possible effects:

* Strong warning state
* Brief pulse
* Optional subtle warning sound

Effects should be tasteful rather than excessive.

---

# 25. Sound

Sounds are optional and can be disabled.

Potential sounds:

* Income → soft money/cash sound
* Transaction saved → subtle confirmation
* Goal reached → gentle chime
* Over budget → subtle warning
* Month closed → satisfying completion sound

Momentum should feel polished, not like a casino.

---

# 26. XP

Finance does **not** define its own XP system.

XP is handled globally by:

`02 XP System.md`

Finance simply generates meaningful events.

Possible XP-eligible events include:

* Monthly financial review completed
* Significant finance task completed
* Other planned financial actions

Routine maintenance such as entering transactions should generally **not** generate meaningful XP.

---

# 27. Integration With Core / Weekly Planner

Finance tasks can appear in the global Weekly Planner.

Examples:

* Review Budget
* Close Month
* Update Account Balance if needed
* Financial admin task

A Finance task appearing on Home and Finance refers to the same underlying planned activity.

Principle:

> **One task, multiple views.**

---

# 28. Data Architecture

Finance follows the shared architecture defined in:

`08 Data Architecture.md`

Primary Finance records include:

* Transactions
* Categories
* Subcategories
* Accounts
* Monthly budgets
* Budget allocations
* Goals
* Net worth snapshots
* Monthly reviews

Transactions remain the source of truth for most financial calculations.

---

# 29. Design Rules

## Five-Second Rule

The Finance Dashboard should answer:

> **How am I doing financially?**

within five seconds.

## Dashboard Is for Reading

The Dashboard summarizes financial status.

Detailed data entry happens elsewhere.

## Transactions Are for Writing

Transactions is the primary financial data-entry workspace.

## Deep, Not Complicated

Momentum can contain substantial financial detail.

That complexity should be organized so the experience still feels simple.

## One Entry, Many Updates

Financial information should be entered once and propagate throughout the system.

## No Financial Guilt

Momentum informs and encourages.

It does not punish the user for spending money or going over budget.

---

# 30. Version 1 Priorities

Version 1 should prioritize:

1. Transactions
2. Accounts
3. Budget setup
4. Budget progress
5. Finance Dashboard
6. Basic Reports
7. Goals
8. Monthly Close

More advanced polish can follow once the core financial engine is reliable.

---

# 31. Future Ideas

Potential future additions include:

* Transaction import
* CSV import/export
* Better merchant rules
* More report comparisons
* More advanced financial forecasting
* Automatic recurring transactions
* Custom report dashboards
* Improved investment analytics
* More sophisticated backup/export

These are not required for Version 1.

---

# 32. North Star

The Finance pillar succeeds when opening it answers:

> **How am I doing financially?**

without requiring the user to dig through spreadsheets.

It should preserve the analytical power and satisfying graphs of detailed financial tracking while making the experience significantly more enjoyable.

Managing money should feel:

> **Clear. Detailed. Rewarding. Low-friction.**

---

# 33. Design Status

* [x] Vision
* [x] Transactions
* [x] Transaction Types
* [x] Categories / Subcategories
* [x] Tags
* [x] Accounts
* [x] Budget
* [x] Positive Rollover
* [x] Income Planning
* [x] Extra Income
* [x] Budget Progress
* [x] Goals
* [x] Investments
* [x] Net Worth
* [x] Reports
* [x] Monthly Review
* [x] Close Month
* [x] Dashboard
* [x] Quick Actions
* [x] Sounds / Animations Direction
* [x] XP separated from Finance
* [x] Weekly Planner integration
* [x] Data Architecture integration
* [x] Ready for Implementation

**Finance Pillar Design: COMPLETE**

---

# 34. Current Implementation — Finance 1

Finance 1 establishes the transaction-driven source of truth before budgeting and reporting depend on it.

Implemented:

* Account onboarding for checking, savings, credit, investment, retirement, and cash
* Opening balances with clear credit-liability guidance
* Derived account balances and net worth
* Fast expense, income, transfer, and investment entry
* One logical transfer with separate From and To accounts
* Transaction editing, soft deletion, recovery, search, and type filtering
* Merchant suggestions with remembered account and category context
* Monthly income, spending, investment, remaining-cash, and savings-rate summaries
* Six-month income-versus-spending visualization
* Spending-by-category and recent-transaction summaries
* Account deletion protection when transaction history still exists
* Finance-specific restrained sound and motion feedback

The default category catalog remains product configuration in Finance 1. Category customization moves to Finance 2 alongside monthly budget allocations, preventing unstable category identifiers from being introduced before their budget relationships exist.

Finance 1 intentionally does not include budgets, goals, monthly close, rollover, or deep reports.

**Finance 1 Foundation: IMPLEMENTED**

---

# 35. Current Implementation — Finance 2.4

Finance 2 turns the transaction foundation into a practical monthly planning
and financial-history system.

Implemented:

* Stable one-level flow categories with one-time migration of Finance 1 and Finance 2 labels
* Category creation, renaming, ordering, archiving, and restoration within each financial flow
* Safe category changes: historical transactions keep their identity when labels or organization change
* Category-level monthly plans with a hybrid slider and exact dollar input
* Spending and progress derived directly from the transaction ledger
* Unbudgeted and over-budget visibility without punitive language or effects
* Copy-last-month behavior for fast recurring setup
* Automatic monthly net-worth snapshots containing the balance of every active account
* Manual point-in-time snapshots with recoverable deletion
* Net-worth and individual-account history across 3 months, 6 months, year to date, 1 year, or all time
* Month in Review with planned, actual, utilization, three-month average, and remaining values
* Budget-versus-actual, savings-rate, account-balance, income-versus-spending, category-spending, and net-worth charts
* Net worth contained within Reports rather than repeated in Overview or the Finance header
* Graphic Month in Review with collapsible financial-flow and category detail
* Editorial report cards and visual spending, saving, cash-flow, budget, and net-worth treatments
* Searchable keyboard-friendly category selection in transaction quick entry
* Always-visible transaction date and notes for faster complete entry
* Ledger filtering by month, merchant, category, account, type, and keyword with contextual result totals
* Condensed ledger rows for quicker scanning without shrinking action targets
* Account reconciliation through explicit positive or negative balance-adjustment events
* Paid-in-full credit cards treated as spending sources and excluded from balances, net worth, and the Overview account list
* Persistent privacy mode that blurs account and net-worth figures throughout Finance
* Investment contributions route from a cash source into an investment or retirement account, remain negative cash allocation in the ledger, and preserve net worth
* Existing single-account investment records migrate without guessing a destination and surface clearly for review
* Monthly and annual investment contribution reports group activity by destination account and optional holding
* Ledger visibility controls hide balance corrections by default and allow any transaction to be hidden or restored without changing calculations
* Overview spending bars use the same monthly budget rows as Budget, including explicit over-plan states
* Month and full-year report scopes with annual plan, activity, cash-flow, and category aggregation
* Local CSV transaction preview with year confirmation, account/category mapping, row-level repair, duplicate protection, skipped-row reporting, and immediate reversible import undo without a persistent receipt

Finance 2 intentionally stores snapshots of historical balances while keeping
the live account balance transaction-derived.

**Finance 2.4 Investment Routing and Ledger Visibility: IMPLEMENTED**

---

# 36. Current Implementation — Finance 3

Finance 3 completes the planned Version 1 financial workflow.

Implemented:

* Dedicated Goals view with balance and contribution targets
* Monthly, yearly, and custom-deadline goal timeframes
* Balance-goal progress derived from the linked account balance
* Contribution-goal progress derived from transfers and investment contributions into the linked account
* Pace projection for active contribution goals without a second manual progress ledger
* Four-step centered Monthly Close covering review checks, rollover choices, optional reflections, and confirmation
* Close readiness surfaces uncategorized expenses, unplanned categories, and planned categories beyond budget without blocking closure
* Deliberate positive rollover selection for expense categories
* Accumulated positive rollover preserved independently from the next month’s base plan
* Overspending resets without negative rollover
* Closing creates the next month’s base plan, saves a monthly review, and preserves a month-end net-worth snapshot
* Closed-month reflections and rollover totals appear in Reports
* Safe reopening clears generated rollover and is blocked when the following month has already been closed
* Editing closed-month transactions, reconciliation, or budget plans reopens the month first so saved review metrics never become stale
* Transaction ledger displays Notes between Category and Account for faster scanning
* Opening Finance is idempotent: the current monthly snapshot is only rewritten when its calculated account position actually changes

Rollover cash-out remains a later enhancement because it creates a real account
transfer and should be designed together with the backup and audit contract.

**Finance 3 Version 1 Workflow: IMPLEMENTED**
