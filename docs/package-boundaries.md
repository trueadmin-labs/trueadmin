# Package Boundaries

TrueAdmin packages are split by dependency boundary, not by convenience.

## `@trueadmin/web-core`

Framework-neutral web protocol package.

Allowed:

- API envelope and pagination protocol types
- CRUD query parameter protocol and serializers
- plugin/module manifest typing helpers
- error primitives and error event center
- i18n marker helpers
- URL/search-param helpers
- browser-neutral or browser-standard helpers that do not bind to React, Ant Design, Vite, or app config

Not allowed:

- React or React types
- Ant Design or icon components
- Vite/runtime env reads
- endpoint URLs, auth session policy, menu facts, plugin generated facts
- application store/provider wiring

## `@trueadmin/web-react`

React adapter package.

Allowed:

- React render type bindings for `web-core`
- React-only helpers that remain UI-library neutral
- future provider contracts that do not depend on Ant Design or app runtime config

Not allowed:

- Ant Design components
- endpoint URLs, auth session policy, generated config, business workflows

## `@trueadmin/web-antd`

Ant Design integration package.

Allowed:

- Ant Design components with stable, application-neutral APIs
- visual controls that accept all behavior through props
- reusable component types that depend on React and Ant Design

Not allowed:

- project-specific data fetching
- auth/session handling
- menu/module/plugin runtime registries
- generated plugin config
- business pages and workflows

## Template Application

The template keeps project-owned facts and customization points:

- `http/client`
- auth session behavior
- `I18nProvider` and app locale loading
- module registry wiring
- menu runtime data access
- layout, tabs, stores, and route behavior
- CRUD pages and business services until their API surface is stable enough for package extraction
- upload/selector/notification implementations until extension hooks are explicit
