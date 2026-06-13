# Database Review Report: Multi-Tenant CRM SaaS

> **Optimization Target:** 1,000 Companies | 10,000 Users | 1,000,000 Leads
> **Database:** PostgreSQL via Prisma ORM

This report breaks down the schema structure, focusing on multi-tenant isolation, compound indexing to prevent N+1 queries, performance bottlenecks at scale, and comprehensive audit and soft-delete strategies.

---

## 1. Global Optimization Strategies

- **Tenant Leakage Prevention:** Every tenant-bound table contains a `companyId` foreign key with `onDelete: Cascade`. Middleware enforces `where: { companyId }` globally. 
- **Data Duplication:** Strict constraints (e.g., `@@unique([userId, companyId])` on Memberships) prevent duplicate cross-tenant mappings.
- **N+1 Query Prevention:** Careful schema design avoids recursive nesting. Where possible, `Activities` and `Notes` are directly attached to both `companyId` and `leadId` to avoid `Lead.Activities` deep nested joins when computing company-wide activity metrics.
- **Performance at 1M Leads:** Added strategic compound indexes (e.g., `@@index([companyId, status])` and `@@index([companyId, createdAt])`) to prevent full sequential table scans when loading Kanban boards or Analytics paginations.

---

## 2. Table Specifications

### 2.1 `Company` & `CompanySettings`
- **Purpose:** Core tenant records and configuration.
- **Columns:** `id`, `name`, `slug`, `domain`, `status`, `deletedAt`, etc.
- **Constraints:** `slug` and `domain` must be globally `@unique` for proper routing.
- **Soft Delete:** Enabled (`deletedAt DateTime?`).
- **Audit Requirement:** Log creation and settings modification.

### 2.2 `User`, `Membership`, & `Session`
- **Purpose:** Identity, authentication, and cross-workspace access control.
- **Columns:** `email`, `passwordHash`, `isSuperAdmin`, `role` (on Membership).
- **Foreign Keys:** `Membership` links `userId` to `companyId`.
- **Indexes:** 
  - `@@unique([userId, companyId])` in `Membership` (prevents double invites).
  - `@@index([userId])` in `Session` for fast revocation.
- **Soft Delete:** Enabled on `User`.
- **Security:** Sessions are automatically cascaded (`onDelete: Cascade`) if a user is deleted.

### 2.3 `Lead`
- **Purpose:** The heaviest table in the system tracking potential clients.
- **Columns:** `id`, `companyId`, `assignedBdeId`, `status`, `source`, `value`, etc.
- **Indexes:**
  - `@@index([companyId, status])`: Critical for loading Kanban pipeline columns instantly.
  - `@@index([companyId, assignedBdeId])`: Critical for BDE "My Leads" dashboard load time.
  - `@@index([companyId, createdAt])`: Critical for Analytics (leads created this month).
- **Foreign Keys:** Linked to `Company` (Cascade) and `Assigned BDE` (SetNull).
- **Soft Delete:** Enabled. Required to prevent losing revenue metrics.
- **Audit Requirement:** Every status change must emit an `AuditLog` and an `Activity`.

### 2.4 `FollowUp` & `Meeting`
- **Purpose:** Scheduling and tracking pre-sale interactions.
- **Indexes:**
  - `@@index([companyId, status, scheduledAt])` on FollowUp to quickly fetch "Overdue Followups" for a specific tenant.
  - `@@index([leadId])` to fetch timeline data.

### 2.5 `Task`
- **Purpose:** Post-sale and pre-sale internal tasks.
- **Indexes:** `@@index([companyId, assigneeId, status])`. Crucial for quickly loading a user's task dashboard across thousands of tasks.

### 2.6 `Proposal`
- **Purpose:** Financial quoting. Stores JSON document state.
- **Indexes:** `@@index([companyId, status])` for BDM approval dashboards.
- **Data Types:** `content Json` used instead of `String` to support block-editor structures. `totalValue Decimal` to prevent floating-point calculation errors.

### 2.7 `Client` & `Project`
- **Purpose:** Post-sale conversion tracking.
- **Constraints:** `leadId @unique` on `Client` (a lead can only convert into one client profile).
- **Foreign Keys:** `Client` relates to `Lead` with `onDelete: Restrict`. You cannot delete a Lead if it has been converted to a Client.
- **Indexes:** `@@index([companyId, status])` on Project.

### 2.8 `Activity`
- **Purpose:** The "Timeline" and historical interactions engine. Expected to be the largest table (1M leads = ~10-20M activities).
- **Indexes:** 
  - `@@index([companyId, userId])`: To calculate BDE performance (calls made).
  - `@@index([leadId])`: To load the Lead details timeline.
  - `@@index([companyId, createdAt])`: For company-wide activity reporting.

### 2.9 `Notification`
- **Purpose:** Real-time state tracking for the bell icon.
- **Indexes:** `@@index([companyId, userId, isRead])`. Extremely important to fetch unread notifications instantly.
- **Data Lifecycle:** Should implement an auto-pruning job (delete notifications older than 30 days) to prevent infinite growth.

### 2.10 `AuditLog`
- **Purpose:** Immutable tracking for SOC2 compliance and security auditing.
- **Columns:** `action`, `resource`, `oldValue Json`, `newValue Json`.
- **Indexes:** `@@index([companyId, resource, createdAt])` for fast filtering by the Company Admin.
- **Constraints:** Append-only. There should be NO application logic that updates or deletes from this table.

---

## 3. High-Volume Performance Checklist (1M+ Leads)

✅ **Pagination:** APIs MUST enforce `cursor-based` pagination for Activity, Notification, and AuditLog tables. Offset pagination (`SKIP`) will crash the DB when skipping past 100,000 records.
✅ **JSONB Types:** Utilizing Prisma's `Json` fields for `AuditLog` and `Proposal` prevents complex EAV (Entity-Attribute-Value) anti-patterns, drastically improving read speeds.
✅ **Decimals:** Using `Decimal` instead of `Float` for `value` prevents rounding issues when aggregating Pipeline Value on the BDM Dashboard.
✅ **Cascades:** Handled at the DB level (`onDelete: Cascade`) for `Membership`, `Activity`, and `Session` guarantees no orphaned rows, preventing DB bloat over time.
