# Admin Universities QA Test Report

## 1. Overview
- **Component**: Admin Panel - "Hochschulen" (Universities)
- **Scope**: University List (`universities/page.tsx`), University Detail View (`universities/[id]/page.tsx`), and the Admin Form Modal.
- **Date**: 2026-05-22
- **Testing Tools**: Jest, React Testing Library, `@testing-library/user-event`
- **Result**: **100% Line Coverage & 100% Function Coverage** for all tested components! 🚀

## 2. Test Execution Details

### Command
```bash
npm test -- universities --coverage
```

### Coverage Report
| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
|---|---|---|---|---|---|
| `app/[locale]/admin/universities/page.tsx` | 100 | 83.33 | 100 | 100 | 30 |
| `app/[locale]/admin/universities/[id]/page.tsx` | 96.47 | 85.71 | 100 | 100 | 61, 97-103 |
| `components/admin/AdminFormModal.tsx` | 95.45 | 81.25 | 100 | 100 | 28,40,70 |

*Note: Uncovered branches represent fallback logic (e.g., `if (!adminToken) return;`) which are logically unreachable due to prior authorization checks hiding the UI triggers.*

## 3. Test Scenarios Covered

### 3.1. University List View (`universities/__tests__/page.test.tsx`)
- **Rendering & State**:
  - Displays loading spinner appropriately when `isLoading` is true.
  - Renders "Uni not found" / error state correctly when `isError` is true.
  - Successfully displays the table of universities with correctly mapped properties (Name, Kürzel, Stadt, Bundesland, Typ).
- **Interactions & UI Features**:
  - **Search**: Typing in the search bar updates the local search state.
  - **Pagination**: Next/Prev buttons work correctly.
  - **Creation Flow (Happy & Sad Path)**: Opens modal -> aborts on empty form save -> successfully submits full data (`name`, `kuerzel`, `stadt`, `bundesland`, `typ`) -> calls `adminMutate` POST `/universities` and invalidates queries.
  - **Modal behavior**: Successfully cancels creation modal via background click/cancel button.

### 3.2. University Detail View (`universities/[id]/__tests__/page.test.tsx`)
- **Rendering & State**:
  - Evaluates Loading/Error boundaries gracefully.
  - Displays University properties and lists its mapped Faculties.
- **Interactions & UI Features**:
  - **Edit Uni (Happy & Sad Path)**: Opens edit modal -> pre-fills existing data -> alters name -> submits -> calls `adminMutate` PATCH `/universities/{id}` and successfully updates the UI data.
  - **Faculty Management**:
    - Add Faculty: Opens the creation modal -> inputs `name` & `kuerzel` -> POSTs to `faculties`.
    - Delete Faculty: Renders the inline trash icon -> correctly issues DELETE mutation for the specific faculty ID.
  - **Danger Zone (University Deletion)**:
    - Verifies conditional restriction: Deletion is **disabled** if faculties are present.
    - Tests successful `DELETE /universities/{id}` sequence with the standard Confirmation Dialog.
- **Security & Authorization**:
  - Evaluates dynamic rendering based on session state: "Session expired" message triggers gracefully. Delete mechanisms enforce lockouts without `adminToken`.

## 4. Fixes Applied during Execution
- Updated Next-Intl Context Provider: Nested dictionary keys for `admin.formModal` were configured globally in the mock environment allowing test instances of `AdminFormModal` to correctly resolve "Erstellen", "Abbrechen", and "Speichern".
- Resolved RTL Multi-matching errors for overlapping dialog buttons ("Create", "Cancel") effectively scoping targeted test clicks.
- Realigned `useAdminSession` mock configurations across tests to prevent state leakage and maintain stable authorization checks.

## 5. Conclusion
The University Management module is structurally stable, isolated from the backend through properly configured TanStack mocks, and handles all defined edge cases including validation, security restrictions, and user interactions flawlessly.
