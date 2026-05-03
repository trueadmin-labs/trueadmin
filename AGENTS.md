# AGENTS.md

This file is the first stop for AI coding agents working on TrueAdmin.

TrueAdmin is an AI-ready enterprise admin scaffold. The current repository is a first-stage Monorepo foundation, not a completed application.

## Read First

Before changing files, read these documents in order:

1. `docs/project-memory.md`
2. `docs/evolution-path.md`
3. `README.md`
4. `docs/architecture.md`
5. `docs/api/api-conventions.md`
6. `docs/ai/ai-development-guide.md`

## Current Goal

Build TrueAdmin into an open-source enterprise admin scaffold inspired by the functional shape of MineAdmin, but with a refreshed stack and stronger AI collaboration foundations.

Confirmed stack:

- Backend: PHP + Hyperf + PostgreSQL + Redis + JWT + OpenAPI/Swagger.
- Web: React + Vite + TypeScript + Ant Design.
- Mobile: uni-app + Vue 3 + TypeScript + Wot UI.
- Architecture: Monorepo with modular monolith backend.

## Current Repository State

The repository currently contains project structure and documentation only. Backend, Web, and Mobile application code has not been initialized yet.

Initial commit:

```text
ce09fcd chore: initialize TrueAdmin scaffold
```

## Collaboration Rules

- Preserve documented decisions unless the user explicitly changes direction.
- Keep changes small enough to review.
- Update project memory when decisions, scope, stack, or roadmap changes.
- Update API conventions or OpenAPI docs when adding or changing endpoints.
- Update module docs before or alongside new module implementation.
- Do not treat chat history as the only source of truth; write durable decisions into docs.

## Recommended Next Step

Initialize the backend Hyperf application scaffold under `backend/`, then connect environment configuration, PostgreSQL, Redis, JWT, and the first OpenAPI documentation path.

