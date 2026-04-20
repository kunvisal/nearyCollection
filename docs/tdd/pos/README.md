# Technical Design Document
## Neary Collection — Point of Sale (POS) System

| Field | Value |
|-------|-------|
| **Document Version** | v1.0 |
| **Status** | Draft |
| **Date** | 2026-04-20 |
| **Author** | [PLACEHOLDER — Author Name] |
| **Reviewed By** | [PLACEHOLDER — Reviewer Name] |
| **Approved By** | [PLACEHOLDER — Approver Name] |

---

## Purpose

This Technical Design Document describes the architecture, functional requirements, security model, integrations, deployment strategy, and test plan for the **Point of Sale (POS)** module of the Neary Collection internal business application.

This document serves as the authoritative technical reference for anyone building, testing, operating, or extending the POS system. It is derived directly from the implemented codebase and reflects the current state of the system as of the document date above.

---

## Intended Audience

| Audience | How to Use This Document |
|----------|--------------------------|
| **Business Owner / Management** | Read sections 01 (Business Overview) and 02 (Functional Requirements) to verify the system meets business needs |
| **Software Developers** | Read sections 03 (Technical Design), 04 (Security), and 05 (Integrations) for implementation guidance |
| **QA / Testers** | Read section 07 (Testing) for test cases and section 08 (Known Gaps) for known limitations |
| **Infrastructure / DevOps** | Read section 06 (Deployment & Operations) for hosting, environment variables, and operational procedures |
| **Architecture Team** | Read sections 03, 04, and 08 for architectural decisions and outstanding technical debt |
| **Support Team** | Read sections 01, 05, and 06 for integration context and operational awareness |

---

## Document Navigation

| # | Section | Description |
|---|---------|-------------|
| 01 | [Business Overview](./01-business-overview.md) | System purpose, stakeholders, scope, and out-of-scope items |
| 02 | [Functional Requirements](./02-functional-requirements.md) | Full FR list with acceptance criteria and priority |
| 03 | [Technical Design](./03-technical-design.md) | Architecture, data models, API contracts, business rules |
| 04 | [Security](./04-security.md) | Authentication, authorization, RBAC, known vulnerabilities |
| 05 | [Integrations](./05-integrations.md) | Telegram, Messenger, Supabase, Settings API |
| 06 | [Deployment & Operations](./06-deployment-operations.md) | Environments, hosting, env vars, migrations, monitoring |
| 07 | [Testing](./07-testing.md) | Manual QA test cases, regression checklist, sign-off |
| 08 | [Known Gaps & Technical Debt](./08-known-gaps.md) | Missing features, open issues, recommended improvements |

---

## Keeping This Document Current

When code changes affect the POS system, the developer responsible for the change **must**:

1. Edit the relevant section file (e.g., if a new API route is added, update [03-technical-design.md](./03-technical-design.md))
2. Add a row to the **Change Log** table below with the date, author, section changed, and a brief summary
3. Commit the documentation update in the **same pull request** as the code change

> Outdated documentation is worse than no documentation. Treat doc updates as a required part of every POS-related PR.

---

## Change Log

| Version | Date | Author | Section(s) Changed | Summary |
|---------|------|--------|--------------------|---------|
| v1.0 | 2026-04-20 | [PLACEHOLDER] | All | Initial document — derived from codebase exploration |
