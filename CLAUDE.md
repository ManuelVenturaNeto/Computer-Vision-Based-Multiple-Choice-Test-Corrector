# Project Guide

A mobile-first answer-sheet reader: a React + TypeScript (Vite) front-end and a
Node/TypeScript API. The front-end captures the sheet, the API extracts the
student data (OpenAI Vision) and the marked answers (Jimp + classical CV).

This document defines **how the codebase is organized and the patterns we
follow**. Read it before adding code. The single most important rule is:
**a new file must look like it belongs next to the existing ones.**

---

## 1. Top-level layout

```
.
├── src/                  Front-end (React + Vite)
│   ├── app/              Application shell: App.tsx, panels, modals, top-level wiring
│   ├── views/            Page-level components (HomeView, CorrigirView)
│   ├── features/         Self-contained domains (camera, student-table)
│   ├── components/       Shared, presentational, no business logic
│   ├── hooks/            App-wide state (reducer + actions + selectors)
│   ├── utils/            Pure helpers (no React, no I/O)
│   └── styles/           CSS / Tailwind layers / theme tokens
│
├── server/               Back-end (Node + TypeScript)
│   ├── index.ts          HTTP entry point
│   ├── config.ts         Environment loading and validation
│   ├── routes/           HTTP route registration only
│   ├── services/         Cross-cutting infra (logging, http client, …)
│   └── modules/<name>/   One module per business capability (hexagonal)
│       ├── domain/       Pure types, rules, parsers, sanitizers
│       ├── application/  Use cases (orchestration, no I/O details)
│       ├── ports/        Interfaces the use case depends on
│       ├── adapters/     Concrete implementations of ports (openai/, jimp/, …)
│       └── controller/   HTTP boundary for the module
│
└── tests/                Unit/integration tests, mirrored by feature
```

If a file does not have an obvious home above, the structure is wrong —
**propose a new folder rather than dropping the file in a generic bucket.**

---

## 2. Architectural principles

### 2.1 Hexagonal architecture on the server (Ports & Adapters)

Every server module is split into the four classic rings. The dependency
direction is **always inward**: `controller → application → domain`, and
`adapter → port (interface defined inside the module)`.

| Ring         | May depend on              | Must NOT depend on              |
|--------------|----------------------------|---------------------------------|
| `domain/`    | nothing                    | application, adapters, framework|
| `application/` | domain, ports            | adapters, http, fs, sdks        |
| `ports/`     | domain                     | adapters, framework             |
| `adapters/`  | port it implements, domain | other adapters, controller      |
| `controller/`| application, domain        | adapters directly (inject them) |

Concrete adapters (`openai/`, `jimp/`, …) are interchangeable. A use case
**never imports an SDK directly** — it depends on a port defined in
`ports/`. The controller wires the chosen adapter at request time.

### 2.2 Feature-first organization on the front-end

A feature folder (e.g. `src/features/camera/`) owns everything it needs:
its `view/`, `hooks/`, `services/`, `forms/`, `ports/`, `adapters/` and
`controller/`. Cross-feature reuse goes through `src/components/`,
`src/utils/`, or `src/hooks/` — **never** through deep imports into
another feature's internals.

A feature is allowed to mirror the hexagonal split (camera does this for the
OpenCV adapter). When the indirection earns its keep, do it; otherwise keep
the feature flat.

### 2.3 Centralized state via reducer + actions

Application state lives in `src/hooks/`:

- `appStateReducer.ts` — pure reducer, no side effects
- `appStateTransitions.ts` — named transitions used by the reducer
- `appStateHelpers.ts` / `appStateTypes.ts` — pure helpers and types
- `useAppState.ts` / `useAppStateStore.ts` — store hook
- `useAppStateViewActions.ts` / `useAppStateStudentActions.ts` — action hooks

Components read state through these hooks and dispatch via the action
hooks. **No component reaches into the reducer directly** and the reducer
contains **no I/O**.

### 2.4 Pure core, impure edges

Side effects (HTTP, camera, OpenAI, Jimp, file system, randomness, time)
live at the edges: adapters, hooks, controllers. Everything reachable from
`domain/` or `utils/` must be **pure and deterministic**, so it can be
unit-tested without mocks.

### 2.5 Validation at the boundary

Inputs from the network, the camera, or the user are validated **once, at
the boundary** (controller, adapter, form). Once data crosses into the
application/domain layer, it is trusted. Don't re-validate the same field
three layers deep.

---

## 3. Design patterns we adopt

These patterns already exist in the codebase. New code should reuse them
before introducing a new abstraction.

| Pattern                  | Where it lives                          | Why we use it                                         |
|--------------------------|-----------------------------------------|-------------------------------------------------------|
| **Ports & Adapters**     | `server/modules/*/ports`, `*/adapters`  | Swap OpenAI/Jimp without touching use cases           |
| **Use Case (Interactor)**| `server/modules/*/application/*UseCase` | One file = one business operation, named as a verb    |
| **Repository / Gateway** | `*Port.ts` interfaces                   | Hide vendor SDKs behind the module's vocabulary       |
| **Reducer + Actions**    | `src/hooks/appState*`                   | Predictable state, time-travel debuggable, testable   |
| **Custom Hooks**         | `src/hooks/`, `src/features/*/hooks/`   | Encapsulate stateful logic without leaking React APIs |
| **Strategy**             | Multiple adapters per port              | Pick the implementation by config / feature flag      |
| **Adapter wrapper**      | `Jimp*Adapter`, `OpenAi*Adapter`        | Translate vendor errors into our domain errors        |
| **Result/Error types**   | `*Errors.ts`, `*Error.ts` per module    | Typed failure modes, no `throw any`                   |
| **Parser / Sanitizer**   | `parse*.ts`, `*Sanitizers.ts`           | Untrusted JSON → typed domain object, in one place    |
| **Pure helpers**         | `src/utils/`, `*/domain/`               | Anything testable in isolation goes here              |
| **Presentational comps** | `src/components/`, feature `view/`      | UI without state; props in, JSX out                   |
| **Container/View split** | feature `controller/` + `view/`         | Decisions live in the controller; view stays dumb     |

**When to introduce a new pattern.** Only after the third copy of the same
shape. Two similar functions are fine; three is the signal to extract.

---

## 4. File and naming conventions

- One **public concern per file**. If a file exports a use case, that's all
  it exports (plus types it owns).
- File names are **camelCase for modules, PascalCase for React components**:
  - `extractAnswerSheetUseCase.ts`, `studentSanitizers.ts`
  - `CameraModal.tsx`, `StudentTable.tsx`
- Adapter files **lead with their technology**: `JimpImageLoader.ts`,
  `OpenAiStudentDocumentVisionAdapter.ts`. The class/function inside
  matches the file name.
- Tests sit under `tests/`, named after the module under test
  (`extractAnswerSheet.reading.test.ts`, `appStateReducer.test.ts`).
- Folders are **plural for collections** (`adapters/`, `routes/`,
  `components/`) and **singular for a single concern** (`domain/`,
  `application/`, `controller/`).
- No `index.ts` barrels except where Vite/TS resolution requires them —
  imports should reveal where the symbol lives.

---

## 5. Code style

- **TypeScript strict everywhere.** No `any`, no `as` to silence the
  compiler. If a type is wrong, fix the type.
- **Pure functions by default.** Mutate only inside React state setters
  and adapter boundaries.
- **Small functions.** If a function does not fit on the screen, it does
  more than one thing.
- **Names describe outcomes, not steps.** `extractAnswerSheetFromImage`,
  not `processImage`.
- **No abbreviations** unless they are domain terms (`csv`, `ocr`, `ui`).
- **Comments explain *why*, never *what*.** The code already tells you
  what; comments exist for hidden constraints, gotchas, and links to
  external context.
- **No dead code.** Delete commented-out blocks, unused exports, and
  `console.log` before review. Git keeps history; the working tree
  doesn't need to.
- **No magic numbers.** Promote to a named constant in
  `*/domain/*Config.ts` or `constants.ts`.

---

## 6. Error handling

- Each module declares its **own typed errors** in `*Errors.ts` /
  `*Error.ts`. Use cases throw or return these — never raw `Error`.
- Adapters **catch vendor errors and translate** them into the module's
  error type. Vendor types do not leak past the adapter.
- Controllers map domain errors to HTTP responses in **one place** per
  module.
- The front-end surfaces errors through the reducer state, never via
  `alert` or thrown exceptions in render.

---

## 7. Testing

- Tests live in `tests/`, mirroring the source structure.
- **Domain and utils have unit tests** — that's where bugs are cheap to
  catch and fix.
- **Adapters have thin integration tests** at most; they exist to be
  swapped, not exhaustively covered.
- Reducer has dedicated tests (`appStateReducer.test.ts`) that exercise
  transitions as data, not via React.
- Run before opening a PR:
  ```bash
  npm run typecheck
  npm test
  ```

---

## 8. Adding a new server module

1. Create `server/modules/<name>/` with `domain/`, `application/`,
   `ports/`, `adapters/`, `controller/`.
2. Define the **domain types** first. No I/O, no framework.
3. Write the **port interface** in `ports/`. Express it in domain words.
4. Write the **use case** in `application/`. Inject the port.
5. Implement at least one **adapter**. Translate vendor errors.
6. Wire the **controller** and register a route in `server/routes/`.
7. Add tests for the domain logic and the use case (with a fake port).

---

## 9. Adding a new front-end feature

1. Create `src/features/<name>/` with a top-level component and a
   `view/`. Keep it flat until complexity demands more.
2. Local state stays in feature hooks (`features/<name>/hooks/`).
   **Promote to `src/hooks/` only when another feature needs it.**
3. UI primitives come from `src/components/` (or are added there if
   reusable). Don't reinvent buttons inside features.
4. If the feature talks to the API, it does so through a service in
   `features/<name>/services/`, never directly from a component.

---

## 10. Anti-patterns — do not do this

- A use case importing the OpenAI SDK directly.
- A React component calling `fetch` inline.
- A `utils/` file that imports React or Node APIs.
- A new top-level folder ("helpers/", "common/", "lib/") parallel to
  `utils/` or `components/`.
- A file longer than ~300 lines without a strong reason — split it.
- A function that takes a boolean flag to switch behaviors — make two
  functions.
- A type named `Data`, `Info`, `Item`, `Manager`, `Helper`, `Util`.
  These names say nothing.
- Commented-out code "in case we need it later." Delete it.
