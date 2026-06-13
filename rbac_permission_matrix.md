# RBAC Permission Matrix: Multi-Tenant CRM SaaS

> **Scope:** Enterprise Role-Based Access Control (RBAC) Architecture
> **Objective:** Zero Privilege Escalation, Strict Data Scoping, and Least Privilege Enforcement.

---

## 1. Role Definitions

- **Super Admin (Platform):** Has global visibility across all tenants. Manages subscriptions, platform health, and can suspend companies. Cannot directly interact with lead sales workflows to preserve tenant data privacy, but can view data for support/auditing.
- **Company Admin (Tenant):** The workspace owner. Has full administrative access to all tenant data, branding, and billing. Cannot access other companies' data.
- **BDM (Business Development Manager):** Sales team leader. Has full visibility over all leads, tasks, and team performance within the company. Can assign work and approve proposals. Cannot access billing or company settings.
- **BDE (Business Development Executive):** Individual contributor. Can only view, update, and manage Leads, Tasks, and Meetings that are explicitly assigned to them. Cannot export bulk data or approve proposals.

---

## 2. Permission Matrix by Module

*Legend:*
* **Global:** Access across the entire platform (all companies).
* **All:** Access across all records within their specific Company/Tenant.
* **Own:** Access restricted to records directly assigned to the user or created by the user.
* **None:** No access permitted.
* **N/A:** Not Applicable.

### 2.1 Platform Administration (Super Admin Only)
| Module | Create | Read | Update | Delete (Soft) | Export | Assign | Approve |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Companies** | Global | Global | Global | Global | Global | N/A | N/A |
| **Platform Users** | Global | Global | Global | Global | Global | N/A | N/A |
| **Subscriptions** | Global | Global | Global | Global | Global | N/A | N/A |

### 2.2 Tenant Settings & Team Management
| Role | Create | Read | Update | Delete | Export | Assign (Roles) | Approve |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | None | Global | None | None | None | None | N/A |
| **Company Admin**| All | All | All | All | All | All | N/A |
| **BDM** | None | All | None | None | None | None | N/A |
| **BDE** | None | Own Profile | Own Profile| None | None | None | N/A |

### 2.3 Leads & Pipeline
| Role | Create | Read | Update | Delete | Export | Assign | Approve |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | None | Global | None | None | None | None | N/A |
| **Company Admin**| All | All | All | All | All | All | N/A |
| **BDM** | All | All | All | All | All | All | N/A |
| **BDE** | All | Own | Own | None | None | None | N/A |
*(Note: BDEs can create leads, which are automatically assigned to them. They cannot reassign leads to others.)*

### 2.4 Follow-ups & Meetings
| Role | Create | Read | Update | Delete | Export | Assign | Approve |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | None | Global | None | None | None | None | N/A |
| **Company Admin**| All | All | All | All | All | All | N/A |
| **BDM** | All | All | All | All | All | All | N/A |
| **BDE** | Own | Own | Own | Own | None | None | N/A |

### 2.5 Tasks
| Role | Create | Read | Update | Delete | Export | Assign | Approve |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | None | Global | None | None | None | None | N/A |
| **Company Admin**| All | All | All | All | All | All | N/A |
| **BDM** | All | All | All | All | All | All | N/A |
| **BDE** | Own | Own | Own | Own | None | Own | N/A |

### 2.6 Proposals
| Role | Create | Read | Update | Delete | Export | Assign | Approve |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | None | Global | None | None | None | None | None |
| **Company Admin**| All | All | All | All | All | N/A | All |
| **BDM** | All | All | All | All | All | N/A | All |
| **BDE** | Own | Own | Own | None | Own (PDF) | N/A | None |
*(Note: BDEs can generate a Draft proposal, but its status must be transitioned to "Sent/Approved" by a BDM or Company Admin.)*

### 2.7 Clients & Projects
| Role | Create | Read | Update | Delete | Export | Assign | Approve |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | None | Global | None | None | None | None | N/A |
| **Company Admin**| All | All | All | All | All | All | N/A |
| **BDM** | All | All | All | All | All | All | N/A |
| **BDE** | None | Own | Own Tasks | None | None | None | N/A |
*(Note: Only BDM or Admin can convert a Closed Won Lead into a Client/Project. BDEs only see Projects if they have Tasks assigned within them.)*

### 2.8 Reports & Analytics
| Role | Create | Read | Update | Delete | Export | Assign | Approve |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | N/A | Global Stats| N/A | N/A | Global | N/A | N/A |
| **Company Admin**| N/A | All Data | N/A | N/A | All | N/A | N/A |
| **BDM** | N/A | All Data | N/A | N/A | All | N/A | N/A |
| **BDE** | N/A | Own Stats | N/A | N/A | None | N/A | N/A |

### 2.9 Audit Logs
| Role | Create | Read | Update | Delete | Export | Assign | Approve |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | Auto | Global | None | None | Global | N/A | N/A |
| **Company Admin**| Auto | All | None | None | All | N/A | N/A |
| **BDM** | Auto | None | None | None | None | N/A | N/A |
| **BDE** | Auto | None | None | None | None | N/A | N/A |
*(Note: Audit Logs are generated automatically by the system. No user can manually Create, Update, or Delete an audit log. BDMs and BDEs cannot read Audit Logs to prevent internal surveillance concerns; this is an Admin-only feature.)*

---

## 3. Privilege Escalation Prevention Mechanisms

1.  **Middleware Guardrails:** Middleware intercepts all requests and inspects the JWT payload. The `companyId` and `role` are injected into server-side headers (`x-user-role`, `x-company-id`). Client-side payload modifications of roles are ignored.
2.  **API Service Layer Validation:** 
    - When a BDE calls `PATCH /api/leads/123`, the Service Layer verifies `where: { id: 123, companyId: x-company-id, assignedBdeId: current_user_id }`. If the lead belongs to someone else, the database returns `0 records updated`, preventing IDOR (Insecure Direct Object Reference) vulnerabilities.
3.  **Proposal Approval Enforcement:** The `status` field on `Proposal` transitions to `APPROVED` only if the `x-user-role` is `COMPANY_ADMIN` or `BDM`. BDEs calling the endpoint receive a `403 Forbidden`.
4.  **No BDE Exports:** Export functionalities are guarded at the API layer. A BDE attempting to hit `/api/reports/export` will be blocked, preventing malicious mass-data exfiltration by rogue employees.
