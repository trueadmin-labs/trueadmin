# Golden CRUD Example

This directory is a copy-ready backend CRUD reference for AI agents and framework users.

It is intentionally kept outside `backend/app`, so it does not participate in Hyperf autoloading, route registration, migrations, or tests.

When generating a real module:

- Copy `Module/Example` into `backend/app/Module/<ModuleName>`.
- Replace the namespace `App\Module\Example` with the real module namespace.
- Rename `ExampleDict` to the real aggregate/resource name.
- Replace table names, permission codes, menu metadata, and operation log actions.
- Add or update tests for the generated endpoints.

The example demonstrates the TrueAdmin standard CRUD shape:

- Controller: route attributes, menu metadata, permission metadata, operation logs, response wrapping.
- Request: validation and normalization.
- Service: business workflow and invariants.
- Repository: persistence, pagination, search, filters, sorting, model mapping.
- Model: table and fillable fields only.
- Migration: module-owned schema.
