# 02 Innovation Lab — WhatsApp Financial Accounting System & Web Admin
### Comprehensive System Architecture, Chatbot Specifications & WebApp PRD

---

## 1. Executive Summary & Product Vision

**02 Innovation Lab** requires an agile, friction-free financial accounting workflow that allows founders, managers, and operational staff to record transactions, upload receipts, query balances, and receive critical debt/liability alerts directly via **WhatsApp**, while maintaining a secure, tamper-proof, and audit-ready **Web Administration Portal** (`chatadmin.02innovationslab.com`).

```
                          ┌────────────────────────┐
                          │   WhatsApp User / Staff │
                          └───────────┬────────────┘
                                      │ (Messages, Voice, Receipts)
                                      ▼
                          ┌────────────────────────┐
                          │ WhatsApp Meta Cloud API│
                          └───────────┬────────────┘
                                      │ (Webhook HTTPS POST)
                                      ▼
                   ┌──────────────────────────────────────┐
                   │    02 Bot API Gateway & Middleware   │
                   │  - Authentication & Phone Whitelist  │
                   │  - Idempotency & Rate Limiting       │
                   └───────────────┬──────────────────────┘
                                   │
             ┌─────────────────────┴─────────────────────┐
             ▼                                           ▼
┌─────────────────────────┐                 ┌─────────────────────────┐
│  AI / NLP Entity Parser  │                 │  Vision OCR Engine      │
│  - Multi-intent parsing │                 │  - Receipt text parsing │
│  - Currency & dates     │                 │  - Merchant, Date, Sum  │
│  - Debt terms detection │                 │  - Confidence scoring   │
└────────────┬────────────┘                 └────────────┬────────────┘
             │                                           │
             └─────────────────────┬─────────────────────┘
                                   │ (Structured Ledger JSON)
                                   ▼
                   ┌──────────────────────────────────────┐
                   │       Core Financial Engine          │
                   │  - Double-Entry General Ledger       │
                   │  - Duplicate Entry Guard             │
                   │  - Receivables & Debt Tracker        │
                   │  - Scheduled Cron Reminders          │
                   └───────────────┬──────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌───────────────────────────────┐           ┌───────────────────────────────┐
│     MySQL / PostgreSQL DB     │           │   Web Admin Portal (SaaS)     │
│ - transactions (ledger)       │           │ chatadmin.02innovationslab.com│
│ - debts_receivables           │◄─────────►│ - Live KPI Financial Reports  │
│ - recurring_payables          │           │ - Reconciliation & Approval   │
│ - receipt_attachments         │           │ - PDF Statement Exporter      │
│ - audit_logs (immutable)      │           │ - Role-Based Access (RBAC)    │
└───────────────────────────────┘           └───────────────────────────────┘
```

---

## 2. WhatsApp Chatbot Specifications (What to Build on WhatsApp)

The WhatsApp bot serves as the **fast capture and notification interface**. It must be fast, conversational, forgiving of natural language variations, and proactive.

### A. Core Conversational Capabilities

| Feature Area | User Input Examples | Chatbot Behavior & Processing |
| :--- | :--- | :--- |
| **1. Multi-Transaction Expense & Income Logging** | `"Payment for starlink on 11th Aug 2026: 56,000"`<br>`"Received payment for data analysis from Mr. Amos: 50,000 (balance 40,000 on 20th Aug)"` | • Splits compound inputs into individual transaction records.<br>• Classifies category (Utilities, Training Fees, Ops).<br>• Detects partial payments and automatically registers an unpaid receivable/debt with a target due date.<br>• Responds with structured breakdown and deep-link. |
| **2. Document & Image Receipt OCR** | Image/PDF receipt uploaded with/without caption. | • Ingests image via Meta Media API.<br>• Passes image to OCR / Vision LLM.<br>• Extracts Amount, Payer/Beneficiary, Date, and Description.<br>• Returns verification card with quick-action reply buttons: `[Confirm & Post]` and `[Edit]`. |
| **3. Financial Status & Balance On-Demand** | `"Hey, I want to know our current financial status"`, `"How much did we make this month?"` | • Aggregates MTD (Month-to-Date) Income, Expenses, Outstanding Receivables, and Net Profit.<br>• Dynamically creates a downloadable PDF statement (`summary.pdf`).<br>• Provides single-sign-on (SSO) magic link to web dashboard. |
| **4. Proactive Daily Accounting Check-In** | Triggered at 5:00 PM (WAT) daily via Cron daemon. | • Asks: *"Hello, did you have any financial accounting to report today?"*<br>• Awaits informal responses and batch-logs expenses. |
| **5. Smart Duplicate Detection Guard** | User logs ₦29,000 twice in the same day. | • Identifies same-amount expense within last 24h window.<br>• Issues interactive warning: *"I see 29,000 twice today, please confirm if duplicate."*<br>• Offers interactive buttons: `[Keep Both]` or `[Delete Duplicate]`. |
| **6. Debt & Receivables Reminder** | Triggered 24 hours prior to scheduled balance due date. | • Alerts staff: *"You have debt reminder to reach out to Mr. Amos by 12pm tomorrow (₦40,000 due)."*<br>• Provides 1-click status update or snooze actions. |
| **7. Scheduled Liabilities / Payables Alert** | Triggered 3–5 days prior to recurring bills. | • Alerts management on upcoming obligations (Salaries: ₦123,999, Tax clearance: ₦390,000).<br>• Highlights runway and cash reserves coverage. |

### B. Chatbot Non-Functional & Security Requirements
1. **Phone Number Whitelisting**: The bot must ONLY respond to authorized staff phone numbers (configured in the Admin RBAC table).
2. **Idempotency**: Every Meta Cloud API webhook delivery includes a `wamid` (WhatsApp Message ID). Cache `wamid` in Redis for 48 hours to prevent duplicate postings from network retries.
3. **Interactive Components**: Use WhatsApp Interactive Buttons and Interactive Lists (where supported by Meta API) rather than plain text for confirmation prompts.
4. **Fallback Handling**: If natural language text cannot be parsed with >85% confidence, bot must ask clarifying questions or provide a web link rather than guessing numbers.

---

## 3. Web Administration Portal Specifications (`chatadmin.02innovationslab.com`)

The Web App serves as the **centralized source of truth, reconciliation cockpit, and financial management system**.

### Key Modules Required on WebApp:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 chatadmin.02innovationslab.com Dashboard                    │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ 1. Dashboard  │ Real-time KPIs: Cash on Hand, MTD Revenue, Expenses, Net,   │
│               │ Uncollected Receivables, Burn Rate, and Runway graph.       │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 2. General    │ Searchable, filterable table of all transactions. Filter by │
│    Ledger     │ date, category, source (WhatsApp Bot vs Web Manual), status.│
│               │ Supports inline editing, category tagging, & receipt proof. │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 3. Debt &     │ Dedicated credit ledger for student fees, client consulting,│
│    Receivables│ and unpaid invoices. Track debtor contact info, due dates,  │
│               │ payment histories, automated reminder schedules & snoozes.  │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 4. Payables & │ Recurring bills calendar (Staff Payroll, FIRS/State Taxes,   │
│    Liabilities│ Starlink, Rent, Power). Configure alert frequency and days. │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 5. Audit &    │ Immutable log recording who posted, edited, or deleted any  │
│    Compliance │ entry, timestamp, IP address, and previous values.          │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 6. User & Bot │ Manage authorized WhatsApp phone numbers, staff roles       │
│    Management │ (Admin, Accountant, Staff Recorder, Read-Only Auditor).     │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 7. Reports    │ PDF / Excel / CSV export engine for P&L, Balance Sheet,     │
│    & Exports  │ Tax remittances (WHT/VAT), and bank reconciliation reports. │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema Design (MySQL / PostgreSQL)

```sql
-- 1. Organizations / Companies
CREATE TABLE companies (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  default_currency VARCHAR(10) DEFAULT 'NGN',
  timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Authorized WhatsApp Users & Roles
CREATE TABLE app_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone_number VARCHAR(30) UNIQUE NOT NULL, -- Format: 2348012345678
  email VARCHAR(150),
  role ENUM('SUPER_ADMIN', 'ACCOUNTANT', 'RECORDER', 'AUDITOR') DEFAULT 'RECORDER',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 3. General Ledger Transactions
CREATE TABLE transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  type ENUM('INCOME', 'EXPENSE', 'TRANSFER') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NGN',
  category VARCHAR(100) NOT NULL,
  customer_or_vendor VARCHAR(150),
  description TEXT,
  transaction_date DATE NOT NULL,
  source ENUM('WHATSAPP_TEXT', 'WHATSAPP_OCR', 'WEB_MANUAL', 'BANK_FEED') NOT NULL,
  raw_whatsapp_text TEXT,
  receipt_attachment_url VARCHAR(500),
  ocr_confidence_score DECIMAL(5,2),
  status ENUM('PENDING_REVIEW', 'CONFIRMED', 'VOID') DEFAULT 'CONFIRMED',
  created_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by_user_id) REFERENCES app_users(id),
  INDEX idx_tx_date (company_id, transaction_date),
  INDEX idx_amount_date (company_id, amount, transaction_date)
);

-- 4. Debts & Receivables Tracker
CREATE TABLE debts_receivables (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(30),
  service_or_item VARCHAR(255) NOT NULL,
  total_contract_amount DECIMAL(15,2) NOT NULL,
  amount_paid DECIMAL(15,2) DEFAULT 0.00,
  balance_due DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  reminder_scheduled_at DATETIME,
  status ENUM('UNPAID', 'PARTIAL', 'SETTLED', 'OVERDUE', 'WRITTEN_OFF') DEFAULT 'UNPAID',
  related_transaction_id BIGINT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (related_transaction_id) REFERENCES transactions(id)
);

-- 5. Recurring Liabilities & Payables (Salaries, Tax, Bills)
CREATE TABLE recurring_payables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  frequency ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY') DEFAULT 'MONTHLY',
  next_due_date DATE NOT NULL,
  alert_days_before INT DEFAULT 5,
  beneficiary_or_dept VARCHAR(150),
  status ENUM('ACTIVE', 'PAUSED', 'COMPLETED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 6. Immutable Audit Trail
CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  user_id INT,
  action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'EXPORT'),
  table_affected VARCHAR(50) NOT NULL,
  record_id BIGINT NOT NULL,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Standalone Prototype Screen Guide

The prototype suite is hosted locally in this directory:

- 🏠 **[`index.html`](file:///c:/xampp/htdocs/chatadmin/index.html)**: Interactive Master Hub with scenario switcher, live phone simulation, system architecture, and API documentation.
- ⚡ **[`scenario1.html`](file:///c:/xampp/htdocs/chatadmin/scenario1.html)**: Compound transaction extraction (Expense + Partial Income + Automatic Debt schedule) and Image Receipt OCR scanner.
- 📊 **[`scenario2.html`](file:///c:/xampp/htdocs/chatadmin/scenario2.html)**: Financial Status query, instant MTD figures (Debts, Expenses, Income, Net Profit), downloadable `summary.pdf` card, and web dashboard deep link.
- ⚠️ **[`scenario3.html`](file:///c:/xampp/htdocs/chatadmin/scenario3.html)**: Proactive 5:00 PM daily check-in prompt, informal expense logging, and fuzzy duplicate entry alert.
- ⏰ **[`scenario4.html`](file:///c:/xampp/htdocs/chatadmin/scenario4.html)**: Proactive customer debt follow-up notification (12:00 PM tomorrow), settlement link, and acknowledgement reply.
- 🔔 **[`scenario5.html`](file:///c:/xampp/htdocs/chatadmin/scenario5.html)**: Upcoming scheduled liabilities alert (Salaries ₦123k, Tax clearance ₦390k) and reminder manager.
