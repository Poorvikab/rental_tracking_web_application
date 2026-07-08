# PropertyLedger Mobile App (Expo)

A premium, modern mobile translation of the PropertyLedger web-based rental management application. This document outlines the features of the original web application, the design architecture for the Expo mobile application, and the implementation roadmap.

---

## 1. Web Application Analysis

The current web application is a **Property Ledger and Real Estate Portfolio Manager** designed for property owners and managers. It connects to a Supabase backend to perform CRUD operations on properties, units, tenants, transactions, violations, and rent payments.

### Core Features of the Web App
1. **Dashboard**: High-level annual overview of total income, expenses, net operating income (NOI), and property/unit counts. Highlights pending/overdue rent payments and displays tabular breakdowns of income/expenses per property, expenses by category (with visual progress bars), and the 10 most recent transactions.
2. **Properties & Units**: Interface to manage real estate properties (name, address, purchase price, target rent, rent due day, late fee threshold, and amount). Inside each property, managers can add/edit units, assign lease start/end dates, and manage tenants with specific monthly rent shares.
3. **Rent Ledger**: A monthly grid view that tracks payments for each tenant. Managers can record detailed payments (base rent, previous balance, late fees, utilities like gas/electricity/water, and inspection fees) and status (Paid, Partial, Late, Overdue). Posting a payment automatically updates transaction ledgers.
4. **Transactions**: Comprehensive ledger of all manual and automated transactions (income/expenses) with filtering, adding, editing, and deleting capabilities.
5. **Cash Flow**: Annual bar charts of income versus expenses grouped by month with a corresponding tabular data representation.
6. **Violations & Inspections**: Management of municipal code violations, annual inspections, and custom fines. Saving a violation with an associated fee automatically posts it as a property expense.
7. **Tax Report**: Generates a Schedule E summary by property for the selected year. It calculates rents received, maps expenses to specific Schedule E lines (e.g., Line 13 — Mortgage interest, Line 14 — Repairs), estimates straight-line depreciation (3.64% of purchase price per year based on 27.5-year recovery period), and provides net taxable rental income/loss.

---

## 2. Core Requirements & Business Logic

The mobile application strictly implements the following property management rules and ledger operations:

1. **Automatic Monthly Rent Generation**:
   - Uses the tenant's configured `share` (from `tenants` table) and property/unit fixed rent variables to automatically compute monthly rent dues for each unit at the start of a month.

2. **Excel-Style Monthly Rent Ledger**:
   - Grid-based month-wise tracking for each property/unit/tenant.
   - Fields tracked per row: Month, Year, Tenant Rent Share, Previous Balance, Late Fee, Utilities (Gas/Electric/Water), Inspection Fee, Total Due, Amount Received, Remaining Balance, and Payment Mode.

3. **Past Due Balance Carry Forward**:
   - Any remaining balance (Outstanding/Unpaid rent) from a tenant's previous month is dynamically retrieved and automatically carried forward as the `previous_balance` for the next month's ledger row.

4. **Late Fee Automation**:
   - If the current date is past the unit's configured `late_fee_day` (e.g. day 8) and payment has not been fully made, the late fee `late_fee_amt` is calculated and automatically applied to the total due.
   - Applied late fees are posted to the `transactions` ledger as income under the `Late Fee` category.

5. **Allow $0.00 Payment Entries**:
   - Managers can submit payment entries with `$0.00` received.
   - Setting the received payment to `$0.00` ensures that the rent remains outstanding and the entire due amount gets carried forward as past due balance to subsequent months.

6. **Pending Rent Highlight**:
   - Clearly flags unpaid/partially paid balances with prominent visual badges:
     - `Pending`: No payment recorded yet for the current month (before due date).
     - `Overdue`: Due date has passed but no or partial payment has been recorded.
     - `Past Due`: Unpaid balances carried forward from previous billing cycles.

---

## 3. Target Mobile Stack & Tools

To transition this into a premium mobile experience, we will use the following modern Expo ecosystem components:

- **Framework**: **Expo SDK 51/52** with **TypeScript** for type safety and stability.
- **Routing**: **Expo Router** (filesystem-based navigation) to build a smooth, native tab-bar-driven interface.
- **Database Backend**: `@supabase/supabase-js` client connecting to your existing Supabase database.
- **Styling**: Native React Native `StyleSheet` for a highly optimized, high-fidelity dark theme that matches the web app's premium aesthetics (utilizing custom color constants, card elevations, smooth overlays, and responsive layouts).
- **Icons**: `@expo/vector-icons` (Ionicons, FontAwesome, MaterialIcons) to provide high-quality navigation and control indicators.
- **Charts**: Custom, lightweight React Native Flexbox components for the cash flow and expense breakdown bars. This keeps the application performant and ensures pixel-perfect styling matching the desktop theme.
- **Environment Management**: `react-native-dotenv` or Expo's built-in support for `.env` files to securely access Supabase keys.

---

## 3. Database Schema Mapping

The mobile app will interface directly with the existing Supabase database using the same schema:

1. **`properties`**: `id`, `name`, `address`, `city`, `price`, `rent`, `due`, `late_fee_day`, `late_fee`
2. **`units`**: `id`, `prop_id` (ref: properties), `name`, `start_date`, `end_date`, `due`, `late_fee_day`, `late_fee_amt`
3. **`tenants`**: `id`, `unit_id` (ref: units), `name`, `share`
4. **`transactions`**: `id`, `type` ('income'|'expense'), `date`, `amount`, `property` (ref: properties), `unit_id` (ref: units), `category`, `vendor`, `description`, `source`
5. **`violations`**: `id`, `prop_id` (ref: properties), `type`, `date`, `amount`, `code`, `status` ('open'|'resolved'), `notes`
6. **`payments`**: `id`, `unit_id` (ref: units), `tenant_id` (ref: tenants), `year`, `month`, `rent`, `previous_balance`, `late_fee`, `other`, `gas`, `electricity`, `water`, `inspection`, `total`, `received`, `remaining`, `payment_date`, `payment_mode`, `status`, `notes` (with a unique constraint on unit, tenant, year, month).

---

## 4. Mobile App File Structure

We will organize the Expo application inside the `expo_rental_application` directory using a clean, scalable file structure:

```text
expo_rental_application/
├── app/
│   ├── _layout.tsx           # Main root navigation & Supabase provider wrapper
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Bottom tabs navigation config
│   │   ├── index.tsx         # Dashboard screen (NOI, overview, metrics)
│   │   ├── properties.tsx    # Property & Unit manager list
│   │   ├── ledger.tsx        # Rent Ledger payments grid/list
│   │   ├── transactions.tsx  # Transactions ledger list with filters
│   │   └── more/
│   │       ├── index.tsx     # Menu tab for additional features
│   │       ├── cashflow.tsx  # Cash Flow analysis and charts screen
│   │       ├── violations.tsx# Violations & Inspections tracker screen
│   │       └── taxreport.tsx # Schedule E tax report generator screen
│   └── modals/
│       ├── propertyModal.tsx # Add/Edit Property screen
│       ├── unitModal.tsx     # Add/Edit Unit & Tenant shares screen
│       ├── transactionModal.tsx # Add/Edit Transaction screen
│       ├── violationModal.tsx   # Add/Edit Violation screen
│       └── paymentModal.tsx  # Record/Edit Rent Ledger payment details screen
├── components/
│   ├── Card.tsx              # Styled premium surface component
│   ├── CustomButton.tsx      # Standard & loading buttons
│   ├── CustomInput.tsx       # Styled text & numeric inputs with validation
│   ├── CustomSelect.tsx      # Dropdown selector wrapper
│   ├── StatusBadge.tsx       # Colored badges for statuses (Paid, Overdue, etc.)
│   └── Toast.tsx             # Animated alert notifications
├── utils/
│   ├── supabase.ts           # Supabase client initialization
│   ├── format.ts             # Currency, date, and text formatting helpers
│   └── theme.ts              # Global design tokens (fonts, spacing, colors)
├── .env                      # Contains Supabase URL and ANON keys
├── app.json                  # Expo config file
├── package.json              # Project dependencies
└── tsconfig.json             # TypeScript configurations
```

---

## 5. Screen Breakdown & UI Design

### UI Theme (Dark Mode Elegance)
We will carry over the premium web aesthetic into the mobile layout:
- **Background**: Deep Slate Black (`#121214`)
- **Card Surface**: Dark Charcoal (`#1a1a1e`)
- **Accent Colors**:
  - Gold/Bronze: `#c8a96e` (branding, highlights, selections)
  - Emerald Green: `#7eb8a4` (income, paid, totals)
  - Coral/Red: `#e07b6a` (expenses, overdue, delete)
  - Soft Purple: `#8b82c4` (inspections, properties)
- **Typography**: Responsive font sizes utilizing system font scaling with elegant sans-serif weights for high readability on small screens.

### Navigation Hierarchy
- **Bottom Tabs**:
  1. **Dashboard** (Icon: `dashboard`)
  2. **Properties** (Icon: `home` / `business`)
  3. **Ledger** (Icon: `list` / `wallet`)
  4. **Transactions** (Icon: `swap-horiz` / `repeat`)
  5. **More** (Icon: `menu` / `more-horiz`)
- **Modals / Stack Navigation**: Modals will slide up from the bottom when adding/editing data, providing a native iOS and Android feel.

---

## 6. Phase-by-Phase Implementation Plan

### Phase 1: Initialization & Configurations
- Initialize the Expo TypeScript project.
- Configure dependencies: `expo-router`, `@supabase/supabase-js`, `@expo/vector-icons`, and safe-area components.
- Setup global theme variables, custom format helpers, and the Supabase client wrapper.

### Phase 2: Core Layout & Navigation
- Build the root layout file (`_layout.tsx`) and tab navigation (`(tabs)/_layout.tsx`).
- Design the main shell and check responsive layout structures on iOS/Android emulators.

### Phase 3: Screen Implementations & Data Fetching
- **Dashboard**: Implement annual filters, compute totals from transactions/ledger, and build the recent activities feed.
- **Properties & Units**: Implement listing, detailed expansion, and modal CRUD operations (add/edit property, add/edit unit with split tenant shares).
- **Rent Ledger**: Create a scrollable ledger screen to view payments per month/year. Integrate the payment recording modal (with utility calculations, previous balance detection, and auto-applied late fees).
- **Transactions**: Build a filterable transactions ledger with search, paginated loading, and manual add/edit modals.
- **Sub-features (More tab)**:
  - **Cash Flow**: Draw custom bar graphs representing month-over-month income vs. expense performance.
  - **Violations**: Manage inspections and code enforcement logs with automated transaction generation.
  - **Tax Report**: Render the Schedule E summary report with print/share configurations.

### Phase 4: Styling Polish & Offline Resilience
- Integrate micro-animations using React Native's `Animated` library or layout transitions.
- Build clean skeleton screens for initial loading states.
- Perform sanity testing on error states and handle database timeouts gracefully.

---

## 7. Approval & Next Steps

Please review the proposed design. Once you approve, we will initiate Phase 1 by running the Expo initialization script and generating the components.

*To approve this plan, reply with **"Approved"** or let me know if you would like any design adjustments or specific feature additions.*
