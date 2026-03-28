# Consolidate Design Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge 4 `docs/phase-*/design.pen` files into a single `docs/design.pen` with labeled section layout, then clean up old files and references.

**Architecture:** Create new `docs/design.pen` → add 4 labeled section containers → for each phase, open source file, read full node tree (batch_get), switch to target file, recreate the content using batch_design → verify visually with get_screenshot → update AGENTS.md and SPEC.md references → delete old phase design files → commit.

**Tech Stack:** Pencil MCP tools (`open_document`, `batch_get`, `batch_design`, `snapshot_layout`, `get_screenshot`), git

**Important constraint:** Pencil MCP cannot copy nodes across files. Content must be read from source files and recreated in the target file using batch_design operations.

---

## File Map

| Action | File                                                       |
| ------ | ---------------------------------------------------------- |
| Create | `docs/design.pen`                                          |
| Modify | `AGENTS.md` — update design file path reference            |
| Modify | `docs/phase-1/SPEC.md` — update design file path reference |
| Modify | `docs/phase-2/SPEC.md` — update design file path reference |
| Modify | `docs/phase-3/SPEC.md` — update design file path reference |
| Modify | `docs/phase-4/SPEC.md` — update design file path reference |
| Delete | `docs/phase-1/design.pen`                                  |
| Delete | `docs/phase-2/design.pen`                                  |
| Delete | `docs/phase-3/design.pen`                                  |
| Delete | `docs/phase-4/design.pen`                                  |

---

## Source files inventory

| Phase | File                      | Top-level frame ID | Frame name      | Reusable components |
| ----- | ------------------------- | ------------------ | --------------- | ------------------- |
| 1     | `docs/phase-1/design.pen` | `sVWcS`            | Design System   | `eQvQD` Tab Bar     |
| 2     | `docs/phase-2/design.pen` | `bi8Au`            | Login Screen    | —                   |
| 3     | `docs/phase-3/design.pen` | `08FXG`            | App Shell       | —                   |
| 4     | `docs/phase-4/design.pen` | `3MgKT`            | Settings Screen | —                   |

---

## Task 1: Create docs/design.pen with 4 section containers

**Files:**

- Create: `docs/design.pen`

- [ ] **Step 1: Open a new blank document**

  Use Pencil MCP:

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "new" })
  ```

  Then call `get_editor_state()` to confirm file is open.

  > Note: The new file will be created at a default path. If it opens as an untitled file, save it immediately to `docs/design.pen` by opening the file at that path explicitly. If `open_document("new")` creates in-memory only, instead call:

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "/Users/mac/Desktop/family-finance-tracker/docs/design.pen" })
  ```

  (This opens or creates the file at that path.)

- [ ] **Step 2: Create 4 section label + placeholder containers**

  Sections are arranged left-to-right with 120px gap between them. Each section starts with a `note` node (label) followed by a placeholder frame for content.

  Canvas X positions (assuming each section is ~560px wide + 120px gap):
  - Section 1 (Phase 1): x=0
  - Section 2 (Phase 2): x=680
  - Section 3 (Phase 3): x=1360
  - Section 4 (Phase 4): x=2040

  ```javascript
  // Section labels (note nodes)
  I(document, {
    type: "note",
    id: "lbl1",
    name: "Label Phase 1",
    content: "Phase 1 — Design System",
    x: 0,
    y: 0,
    width: 520,
    height: 36,
    fontSize: 18,
    fontWeight: "700",
  });
  I(document, {
    type: "note",
    id: "lbl2",
    name: "Label Phase 2",
    content: "Phase 2 — Auth",
    x: 680,
    y: 0,
    width: 390,
    height: 36,
    fontSize: 18,
    fontWeight: "700",
  });
  I(document, {
    type: "note",
    id: "lbl3",
    name: "Label Phase 3",
    content: "Phase 3 — App Shell",
    x: 1360,
    y: 0,
    width: 390,
    height: 36,
    fontSize: 18,
    fontWeight: "700",
  });
  I(document, {
    type: "note",
    id: "lbl4",
    name: "Label Phase 4",
    content: "Phase 4 — Settings",
    x: 2040,
    y: 0,
    width: 390,
    height: 36,
    fontSize: 18,
    fontWeight: "700",
  });
  ```

- [ ] **Step 3: Verify labels are on canvas**

  ```
  mcp__pencil__get_editor_state()
  ```

  Expected: 4 note nodes visible in top-level node list.

- [ ] **Step 4: Commit empty scaffold**

  ```bash
  git add docs/design.pen
  git commit -m "design: create docs/design.pen with section scaffold"
  ```

---

## Task 2: Copy Phase 1 — Design System

**Files:**

- Read: `docs/phase-1/design.pen`
- Modify: `docs/design.pen`

- [ ] **Step 1: Open phase-1 and read top-level structure**

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "/Users/mac/Desktop/family-finance-tracker/docs/phase-1/design.pen" })
  mcp__pencil__get_editor_state()
  ```

  Expected top-level nodes: `sVWcS` (Design System), reusable component `eQvQD` (Tab Bar).

- [ ] **Step 2: Read Design System frame structure (depth 2)**

  ```
  mcp__pencil__batch_get({ nodeIds: ["sVWcS"], readDepth: 2 })
  ```

  Note the width, height, layout, children structure. If result is too large, reduce to `readDepth: 1`.

- [ ] **Step 3: Read Tab Bar reusable component structure (depth 3)**

  ```
  mcp__pencil__batch_get({ nodeIds: ["eQvQD"], readDepth: 3 })
  ```

  Note all child node IDs, properties, fills, sizes.

- [ ] **Step 4: Read Design System children in batches as needed**

  The Design System frame (`sVWcS`) contains sub-sections (colors, typography, components). Read each child of `sVWcS` individually with `readDepth: 2` to understand the full structure before recreating.

  Use `snapshot_layout("sVWcS", 3)` for a fast overview of positions and sizes without full node data.

- [ ] **Step 5: Open docs/design.pen and recreate Design System frame**

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "/Users/mac/Desktop/family-finance-tracker/docs/design.pen" })
  ```

  Use `batch_design` to recreate the Design System frame at section 1 position (x=0, y=56 — below label):

  ```javascript
  // Create the root Design System frame matching source dimensions
  ds=I(document, {type:"frame", id:"DS1", name:"Design System", x:0, y:56, placeholder:true,
    width:<width from step 2>, height:<height from step 2>,
    layout:<layout from step 2>})
  ```

  Then recreate all children from the data read in Steps 2–4, keeping the same IDs where possible. Use at most 25 operations per batch_design call — split into multiple calls by logical sub-sections.

- [ ] **Step 6: Recreate Tab Bar reusable component**

  The Tab Bar component must be marked `reusable: true` to function as a component in the new file.

  ```javascript
  tabBar=I(document, {type:"frame", id:"TabBarComp", name:"Tab Bar", reusable:true,
    x:0, y:<DS1_bottom + 40>,
    width:<width from step 3>, height:<height from step 3>,
    ... <all children from step 3>
  })
  ```

- [ ] **Step 7: Screenshot and verify**

  ```
  mcp__pencil__get_screenshot({ nodeId: "DS1" })
  ```

  Visual check: Design System sections (colors, typography, components) visible. Compare with original phase-1 screenshot.

- [ ] **Step 8: Remove placeholder flag from Design System frame**

  ```javascript
  U("DS1", { placeholder: false });
  ```

- [ ] **Step 9: Commit**

  ```bash
  git add docs/design.pen
  git commit -m "design: add Phase 1 Design System to consolidated design.pen"
  ```

---

## Task 3: Copy Phase 2 — Login Screen

**Files:**

- Read: `docs/phase-2/design.pen`
- Modify: `docs/design.pen`

- [ ] **Step 1: Open phase-2 and read Login Screen structure**

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "/Users/mac/Desktop/family-finance-tracker/docs/phase-2/design.pen" })
  mcp__pencil__get_editor_state()
  ```

  Expected: `bi8Au` (Login Screen).

- [ ] **Step 2: Read full Login Screen frame**

  ```
  mcp__pencil__snapshot_layout("bi8Au", 3)
  mcp__pencil__batch_get({ nodeIds: ["bi8Au"], readDepth: 2 })
  ```

  Note width, height, all children. For large responses, read children individually with `readDepth: 2`.

- [ ] **Step 3: Open docs/design.pen and recreate Login Screen**

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "/Users/mac/Desktop/family-finance-tracker/docs/design.pen" })
  ```

  ```javascript
  login=I(document, {type:"frame", id:"LoginScreen", name:"Login Screen",
    x:680, y:56, placeholder:true,
    width:<width from step 2>, height:<height from step 2>,
    layout:<layout from step 2>})
  ```

  Recreate all children matching the source structure. Use multiple `batch_design` calls (max 25 ops each) split by logical sections (header, form fields, button, footer).

- [ ] **Step 4: Screenshot and verify**

  ```
  mcp__pencil__get_screenshot({ nodeId: "LoginScreen" })
  ```

  Check: Login form visible with email/password fields, submit button, layout matching original.

- [ ] **Step 5: Remove placeholder flag**

  ```javascript
  U("LoginScreen", { placeholder: false });
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add docs/design.pen
  git commit -m "design: add Phase 2 Login Screen to consolidated design.pen"
  ```

---

## Task 4: Copy Phase 3 — App Shell

**Files:**

- Read: `docs/phase-3/design.pen`
- Modify: `docs/design.pen`

- [ ] **Step 1: Open phase-3 and read App Shell structure**

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "/Users/mac/Desktop/family-finance-tracker/docs/phase-3/design.pen" })
  mcp__pencil__get_editor_state()
  ```

  Expected: `08FXG` (App Shell).

- [ ] **Step 2: Read full App Shell frame**

  ```
  mcp__pencil__snapshot_layout("08FXG", 3)
  mcp__pencil__batch_get({ nodeIds: ["08FXG"], readDepth: 2 })
  ```

  Note width, height, all children (header, content area, bottom tab bar).

- [ ] **Step 3: Open docs/design.pen and recreate App Shell**

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "/Users/mac/Desktop/family-finance-tracker/docs/design.pen" })
  ```

  ```javascript
  shell=I(document, {type:"frame", id:"AppShell", name:"App Shell",
    x:1360, y:56, placeholder:true,
    width:<width from step 2>, height:<height from step 2>,
    layout:<layout from step 2>})
  ```

  Recreate children in batches: header row first, then content area, then bottom tab bar. Max 25 ops per call.

- [ ] **Step 4: Screenshot and verify**

  ```
  mcp__pencil__get_screenshot({ nodeId: "AppShell" })
  ```

  Check: Header (trophy + logout buttons), content area, bottom tab bar with 4 tabs.

- [ ] **Step 5: Remove placeholder flag**

  ```javascript
  U("AppShell", { placeholder: false });
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add docs/design.pen
  git commit -m "design: add Phase 3 App Shell to consolidated design.pen"
  ```

---

## Task 5: Copy Phase 4 — Settings Screen

**Files:**

- Read: `docs/phase-4/design.pen`
- Modify: `docs/design.pen`

- [ ] **Step 1: Open phase-4 and read Settings Screen structure**

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "/Users/mac/Desktop/family-finance-tracker/docs/phase-4/design.pen" })
  mcp__pencil__get_editor_state()
  ```

  Expected: `3MgKT` (Settings Screen).

- [ ] **Step 2: Read full Settings Screen frame**

  ```
  mcp__pencil__snapshot_layout("3MgKT", 3)
  mcp__pencil__batch_get({ nodeIds: ["3MgKT"], readDepth: 2 })
  ```

  Note width, height, all children (header, form sections, save button).

- [ ] **Step 3: Open docs/design.pen and recreate Settings Screen**

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "/Users/mac/Desktop/family-finance-tracker/docs/design.pen" })
  ```

  ```javascript
  settings=I(document, {type:"frame", id:"SettingsScreen", name:"Settings Screen",
    x:2040, y:56, placeholder:true,
    width:<width from step 2>, height:<height from step 2>,
    layout:<layout from step 2>})
  ```

  Recreate children in batches by logical section. Max 25 ops per call.

- [ ] **Step 4: Screenshot and verify**

  ```
  mcp__pencil__get_screenshot({ nodeId: "SettingsScreen" })
  ```

  Check: Settings form visible with display name field, initial cash balance field, save button.

- [ ] **Step 5: Remove placeholder flag**

  ```javascript
  U("SettingsScreen", { placeholder: false });
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add docs/design.pen
  git commit -m "design: add Phase 4 Settings Screen to consolidated design.pen"
  ```

---

## Task 6: Full canvas screenshot + final verification

**Files:**

- Read: `docs/design.pen`

- [ ] **Step 1: Open docs/design.pen and take full canvas screenshot**

  ```
  mcp__pencil__open_document({ filePathOrTemplate: "/Users/mac/Desktop/family-finance-tracker/docs/design.pen" })
  mcp__pencil__get_screenshot({})
  ```

  Visual check: All 4 sections visible side by side with labels. No overlapping frames.

- [ ] **Step 2: Verify all section labels are present**

  ```
  mcp__pencil__get_editor_state()
  ```

  Expected top-level nodes: 4 label notes + 4 screen frames + Tab Bar component = 9 nodes minimum.

- [ ] **Step 3: Verify Tab Bar is reusable**

  Confirm `eQvQD` or `TabBarComp` appears in Reusable Components list in `get_editor_state()` response.

---

## Task 7: Delete old phase design files + update references

**Files:**

- Delete: `docs/phase-1/design.pen`
- Delete: `docs/phase-2/design.pen`
- Delete: `docs/phase-3/design.pen`
- Delete: `docs/phase-4/design.pen`
- Modify: `AGENTS.md`
- Modify: `docs/phase-1/SPEC.md`
- Modify: `docs/phase-2/SPEC.md`
- Modify: `docs/phase-3/SPEC.md`
- Modify: `docs/phase-4/SPEC.md`

- [ ] **Step 1: Delete old design files**

  Use Pencil MCP's `open_document` to open each file, then delete all top-level frames. Or simply delete at OS level since .pen files no longer needed:

  ```bash
  rm docs/phase-1/design.pen docs/phase-2/design.pen docs/phase-3/design.pen docs/phase-4/design.pen
  ```

- [ ] **Step 2: Update AGENTS.md — design file reference**

  In `AGENTS.md`, update the UI Implementation section. Change:

  ```
  Before coding any UI component or page, open and read the corresponding `.pen` design file using the `mcp__pencil__open_document` and `mcp__pencil__batch_get` tools.
  ```

  To:

  ```
  Before coding any UI component or page, open and read the design file `docs/design.pen` using the `mcp__pencil__open_document` and `mcp__pencil__batch_get` tools. All screens are consolidated in this single file — navigate to the relevant section (Phase 1–4) for the screen you need.
  ```

- [ ] **Step 3: Update docs/phase-1/SPEC.md**

  Find any reference to `docs/phase-1/design.pen` and replace with `docs/design.pen`. Check the intro and any design file callouts.

- [ ] **Step 4: Update docs/phase-2/SPEC.md**

  Find any reference to `docs/phase-2/design.pen` and replace with `docs/design.pen`.

- [ ] **Step 5: Update docs/phase-3/SPEC.md**

  Find any reference to `docs/phase-3/design.pen` and replace with `docs/design.pen`.

- [ ] **Step 6: Update docs/phase-4/SPEC.md**

  Find any reference to `docs/phase-4/design.pen` and replace with `docs/design.pen`.

- [ ] **Step 7: Commit all changes**

  ```bash
  git add -A
  git commit -m "design: consolidate phase design files into docs/design.pen; remove old phase files; update references"
  ```

---

## Self-Review Against Spec

| Spec requirement                     | Covered by                           |
| ------------------------------------ | ------------------------------------ |
| Create `docs/design.pen`             | Task 1                               |
| 4 labeled section layout             | Task 1 (labels), Tasks 2–5 (content) |
| Design System in Section 1           | Task 2                               |
| Tab Bar reusable component preserved | Task 2 step 6                        |
| Login Screen in Section 2            | Task 3                               |
| App Shell in Section 3               | Task 4                               |
| Settings Screen in Section 4         | Task 5                               |
| 120px gap between sections           | Task 1 step 2 (x coordinates)        |
| Delete old design.pen files          | Task 7 step 1                        |
| Update AGENTS.md reference           | Task 7 step 2                        |
| Update SPEC.md references            | Task 7 steps 3–6                     |
