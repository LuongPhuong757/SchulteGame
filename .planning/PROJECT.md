# Schulte Game (game.quanbalun.site)

## What This Is

Game bảng Schulte chạy trên điện thoại tại `game.quanbalun.site`: người chơi chạm lần lượt các số 1..N trên bảng 4×4 / 5×5 / 6×6 và tính thời gian. Có 3 chế độ: Chơi 1 mình (bảng xếp hạng), Đua thời gian (phòng 2-4 người) và Giành số (phòng 2-4 người). Game độc lập, KHÔNG gắn với hệ thống quán và không dùng dữ liệu quán.

## Core Value

Chơi mượt trên điện thoại cả 3 chế độ với kết quả công bằng do server xác minh, mà không bao giờ ảnh hưởng đến POS của quán trên cùng VPS.

## Requirements

### Validated

- ✓ Bảng Schulte 4×4/5×5/6×6, phạt +2s khi chạm sai, UI tiếng Việt mobile-first, chơi 1 mình local, biệt danh có lọc + lưu trên máy — Phase 1 (UAT trên điện thoại thật đạt)

### Active

Xem `.planning/REQUIREMENTS.md` (derive từ SPEC.md §1-6). Tóm tắt:

- [ ] Nộp điểm có kiểm (seed server + nhật ký chạm) + Top 10 theo cỡ bảng (hôm nay / mọi thời đại)
- [ ] Phòng 2-4 người (mã 4 số) với Đua thời gian (cùng bảng / bảng riêng) và Giành số
- [ ] Rớt mạng vào lại trong 15s, giới hạn tần suất theo IP
- [ ] Đóng gói 1 container (256MB/0.5CPU), Caddy + DNS, công tắc tắt nhanh

### Out of Scope

- Đăng nhập / tài khoản — chỉ dùng biệt danh lưu trên máy
- Bảng xếp hạng cho chế độ phòng — chỉ Chơi 1 mình có leaderboard
- Dùng MySQL hoặc bất kỳ dữ liệu nào của quán — SQLite riêng trong volume
- Nằm trong monorepo OrderQuanBaLun — repo riêng
- Hover/tooltip, giao diện desktop-first — ưu tiên điện thoại

## Context

- VPS dùng chung với hệ thống quán: 4 vCPU, 3.8 GB RAM, đang dùng swap ~1 GB. Game sập/quá tải không được kéo POS sập theo.
- Điểm chạm duy nhất với hạ tầng quán: 1 khối `game.quanbalun.site` trong Caddy (reverse proxy hỗ trợ WebSocket) + 1 bản ghi DNS.
- Nguồn đầu vào duy nhất: `SPEC.md` (tiếng Việt). Intel: `.planning/intel/SYNTHESIS.md`. Không có ADR/PRD.
- Khoảng trống trong SPEC (sẽ chốt khi plan phase): ngưỡng rate limit, schema bảng SQLite, tiêu chí "khoảng cách giữa 2 lần chạm phi lý" (`replayStrict` hiện mặc định 0ms / tối đa 1 giờ — Phase 2 phải chốt).
- Sau Phase 1: `shared/` (board seed, reducer, `replay`/`replayStrict`, `validateNickname`) dùng chung cho server Phase 2. Seed hiện do client tạo + hash 32-bit (WR-07) — Phase 2 phải chuyển sang seed do server cấp.
- Toolchain: Node 24.20.0 bắt buộc (`.node-version`); Node 20 mặc định của fnm quá cũ cho Vite 8/Vitest 5.

## Constraints

- **Runtime**: 1 container Docker — Node + Socket.IO (server), React + Vite (client, server phát file tĩnh)
- **Datastore**: SQLite trong volume của container, không dùng MySQL của quán
- **Resources**: 256 MB RAM, 0.5 CPU, `restart: unless-stopped`
- **Isolation**: Game sập/quá tải không được ảnh hưởng POS quán
- **Ingress**: Chỉ thêm 1 khối Caddy + 1 DNS record vào hạ tầng quán
- **Ops**: Có công tắc tắt nhanh (env var / dừng container) không cần deploy lại
- **UI**: Tiếng Việt, mobile-first (ô to, chữ to, không hover)
- **Anti-cheat**: Server là trọng tài ở chế độ phòng; chế độ solo server phát lại nhật ký chạm trước khi ghi điểm

## Key Decisions

<decisions>
Không có quyết định bị khoá (locked) từ ADR — nguồn chỉ có SPEC. Các ràng buộc SPEC là mặc định không khoá; có thể đổi nếu có lý do.

Mặc định chỉnh được (SPEC §8) — đưa vào 1 file cấu hình duy nhất:
- Phạt chạm sai: +2s
- Khoá tay ở Giành số: 2s
- Mã phòng: 4 số
- Phòng hết hạn: 10 phút không hoạt động
- Vào lại sau rớt mạng: 15s
- Tối đa 4 người/phòng
</decisions>

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Game độc lập, repo riêng, SQLite riêng | Cô lập khỏi POS quán | — Pending |
| 1 container Node + Socket.IO phát luôn static React | Ít thành phần, vừa 256MB/0.5CPU | — Pending |
| Server là trọng tài (phòng) + phát lại nhật ký (solo) | Chống gian lận không cần đăng nhập | — Pending |
| Thứ tự build theo SPEC §7 (6 phase) | Solo local trước, hạ tầng deploy cuối | ✓ Phase 1 xong theo đúng thứ tự |
| Số tìm được biến mất; đồng hồ chạy khi hiện bảng; biệt danh 2–16 ký tự (Phase 1 D-01..D-03) | Chốt luật chơi chưa có trong SPEC | ✓ Đã triển khai + UAT đạt |
| Blocklist từ tục do Claude soạn, user duyệt (giữ `dm`), khớp theo token + gập dấu/confusables | Tránh chặn nhầm tên Việt, chống lách | ✓ Phase 1 |
| Làm Phase 1 trên nhánh `gsd/phase-1-khung-repo` | `main` là nhánh bảo vệ; user merge | — Chờ merge |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-28 after Phase 1*
