# Spec — Consolidate Design Files into Single `docs/design.pen`

## Mục tiêu

Gộp 4 file `docs/phase-*/design.pen` thành một file duy nhất `docs/design.pen` để đồng nhất thiết kế và đơn giản hoá workflow.

---

## Canvas Layout — Option B: Labeled Sections

File đích: `docs/design.pen`

Canvas tổ chức theo 4 section ngang (left → right), mỗi section gồm:

- Label text node (tên phase)
- Nội dung frame từ file gốc

```
[Phase 1 — Design System] [Phase 2 — Auth] [Phase 3 — App Shell] [Phase 4 — Settings]
      ↓                          ↓                  ↓                     ↓
  Design System frame        Login Screen       App Shell frame     Settings Screen
  Tab Bar component
```

**Thông số layout:**

- Khoảng cách giữa các section: 120px
- Label font: bold, kích thước vừa, đặt phía trên frame tương ứng
- Thứ tự từ trái sang phải theo phase number

---

## Nguồn nội dung

| Section                 | Nguồn file                | Top-level frame           | Reusable components |
| ----------------------- | ------------------------- | ------------------------- | ------------------- |
| Phase 1 — Design System | `docs/phase-1/design.pen` | `sVWcS` (Design System)   | `eQvQD` (Tab Bar)   |
| Phase 2 — Auth          | `docs/phase-2/design.pen` | `bi8Au` (Login Screen)    | —                   |
| Phase 3 — App Shell     | `docs/phase-3/design.pen` | `08FXG` (App Shell)       | —                   |
| Phase 4 — Settings      | `docs/phase-4/design.pen` | `3MgKT` (Settings Screen) | —                   |

---

## Các bước thực hiện

1. **Tạo file mới** `docs/design.pen` (blank canvas)
2. **Copy từng phase** vào file mới:
   - Mở phase file → đọc cấu trúc đầy đủ (batch_get)
   - Chuyển sang file mới → tái tạo section label + frame bằng batch_design
   - Thực hiện tuần tự cho cả 4 phases
3. **Xoá file cũ**: `docs/phase-*/design.pen`
4. **Cập nhật SPEC.md** trong từng phase folder: đổi reference từ `docs/phase-X/design.pen` → `docs/design.pen`
5. **Cập nhật AGENTS.md**: đổi hướng dẫn mở design file sang `docs/design.pen`

---

## Kết quả mong đợi

- Một file `docs/design.pen` duy nhất chứa toàn bộ design
- 4 file `docs/phase-*/design.pen` bị xoá
- Tất cả SPEC.md và AGENTS.md trỏ về `docs/design.pen`
- Reusable component Tab Bar được preserve trong section Phase 1
