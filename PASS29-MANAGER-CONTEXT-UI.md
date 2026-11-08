# Pass 29: Business context manager UI

Route: `/admin/business-context` via admin navigation. Authenticated admin can select a member organisation; the backend independently enforces OWNER/MANAGER membership for every configuration operation. Read the registry, inspect approved/draft/retired values, edit a draft, approve or retire. Editing an approved value revokes approval until explicitly reapproved.

**Not completed:** automatic Field Services synchronisation, live browser test, dependency-enabled TypeScript build, PostgreSQL runtime migration tests. This release is not production-certified. The Field Services contract and ownership mapping must be agreed before adding automated import; blindly copying external records into approved training would be unsafe.
