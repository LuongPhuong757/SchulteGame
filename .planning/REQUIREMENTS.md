# Requirements: Schulte Game

**Defined:** 2026-10-28
**Core Value:** Chơi mượt trên điện thoại cả 3 chế độ với kết quả do server xác minh, không ảnh hưởng POS quán.
**Source:** SPEC.md §1-8 (acceptance criteria suy ra từ các quy tắc trong SPEC; ngưỡng cụ thể ghi "chốt khi plan").

## v1 Requirements

### Bảng & luật chơi (BOARD)

- [ ] **BOARD-01**: Người chơi chọn cỡ bảng 4×4 / 5×5 / 6×6; bảng chứa các số 1..N (16/25/36) xếp ngẫu nhiên, mỗi số đúng một lần.
- [ ] **BOARD-02**: Người chơi chạm lần lượt 1 → N; đồng hồ chạy từ lúc bắt đầu đến khi chạm đúng số N; hiển thị thời gian cuối.
- [ ] **BOARD-03**: Chạm sai số cộng +2 giây phạt vào thời gian, ô nhá đỏ và điện thoại rung; không tiến số kế tiếp.

### Giao diện (UI)

- [ ] **UI-01**: Giao diện ưu tiên điện thoại: ô to, chữ to, thao tác chạm, không phụ thuộc hover/tooltip; dùng được ở màn hình hẹp.
- [ ] **UI-02**: Toàn bộ giao diện bằng tiếng Việt.

### Danh tính (ID)

- [ ] **ID-01**: Người chơi nhập biệt danh, không cần đăng nhập; biệt danh bị lọc theo độ dài, ký tự cho phép, từ tục cơ bản (quy tắc cụ thể chốt khi plan); cùng một bộ lọc dùng ở client và server.
- [ ] **ID-02**: Biệt danh được lưu trên máy và điền sẵn ở lần vào sau.

### Chơi 1 mình & xếp hạng (SOLO)

- [ ] **SOLO-01**: Người chơi nhập biệt danh, chọn cỡ bảng và chơi 1 mình (chạy được local khi chưa có server).
- [ ] **SOLO-02**: Server cấp seed bảng cho mỗi ván solo; client dựng bảng từ seed đó.
- [ ] **SOLO-03**: Client nộp nhật ký chạm (số + mốc thời gian) kèm seed; server phát lại và chỉ ghi điểm khi hợp lệ (đúng thứ tự, khoảng cách giữa 2 lần chạm không phi lý, seed do server cấp và dùng một lần); điểm sai bị từ chối.
- [ ] **SOLO-04**: Bảng xếp hạng Top 10 theo từng cỡ bảng cho **hôm nay**.
- [ ] **SOLO-05**: Bảng xếp hạng Top 10 theo từng cỡ bảng cho **mọi thời đại**.
- [ ] **SOLO-06**: Bảng xếp hạng chỉ áp dụng cho Chơi 1 mình; chế độ phòng không ghi vào bảng xếp hạng.

### Phòng (ROOM)

- [ ] **ROOM-01**: Chủ phòng tạo phòng, nhận mã 4 số, chọn chế độ (Đua thời gian / Giành số) và cỡ bảng.
- [ ] **ROOM-02**: Người khác nhập mã + biệt danh để vào phòng; tối đa 4 người, người thứ 5 bị từ chối kèm thông báo; mã sai báo lỗi rõ.
- [ ] **ROOM-03**: Chỉ chủ phòng bấm Bắt đầu và chỉ khi có ≥ 2 người.
- [ ] **ROOM-04**: Hết ván hiện bảng kết quả; "Chơi lại" bắt đầu ván mới trong cùng phòng.
- [ ] **ROOM-05**: Phòng tự huỷ sau 10 phút không hoạt động; mã phòng giải phóng.

### Đua thời gian (RACE)

- [ ] **RACE-01**: Chủ phòng chọn **cùng bảng** (mọi người cùng cách xếp số) hoặc **bảng riêng** (mỗi người một cách xếp).
- [ ] **RACE-02**: Server phát đếm ngược 3 giây rồi cùng bắt đầu cho tất cả; server bấm giờ.
- [ ] **RACE-03**: Server kiểm từng lần chạm của mỗi người (đúng thứ tự, phạt chạm sai tính phía server).
- [ ] **RACE-04**: Bảng kết quả liệt kê thời gian từng người (đã cộng phạt); nhanh nhất thắng.

### Giành số (GRAB)

- [ ] **GRAB-01**: Một bảng chung cho cả phòng; ai chạm đúng số kế tiếp trước (theo server) giành số đó; chạm đồng thời chỉ một người giành.
- [ ] **GRAB-02**: Mọi máy thấy ngay số đã bị lấy, hiển thị theo màu của người giành.
- [ ] **GRAB-03**: Chạm sai khoá tay người đó 2 giây (không chạm được trong thời gian khoá, có hiển thị).
- [ ] **GRAB-04**: Người giành nhiều số nhất thắng; hoà thì người giành số cuối cùng thắng.

### Mạng & chống lạm dụng (NET)

- [ ] **NET-01**: Người rớt mạng được vào lại phòng trong 15 giây và tiếp tục ván (đồng hồ vẫn chạy trong lúc rớt).
- [ ] **NET-02**: Quá 15 giây không vào lại thì tính bỏ cuộc; người còn lại chơi tiếp và ván vẫn kết thúc đúng.
- [ ] **NET-03**: Giới hạn tần suất theo IP cho: tạo phòng, nộp điểm, kết nối WebSocket; vượt ngưỡng bị từ chối kèm thông báo (ngưỡng chốt khi plan).

### Vận hành & hạ tầng (OPS)

- [ ] **OPS-01**: Một server Node + Socket.IO phát luôn file tĩnh của client React + Vite (1 tiến trình, 1 container).
- [ ] **OPS-02**: Bảng xếp hạng lưu trong SQLite trên volume của container, giữ nguyên sau khi container khởi động lại; không dùng MySQL của quán.
- [ ] **OPS-03**: Container giới hạn 256 MB RAM, 0.5 CPU, `restart: unless-stopped`; chạy ổn định trong giới hạn khi có phòng đầy người.
- [ ] **OPS-04**: Game sập hoặc quá tải không làm POS quán sập theo (cô lập tài nguyên, kiểm chứng bằng cách dừng/làm nghẽn container).
- [ ] **OPS-05**: Chỉ thêm 1 khối `game.quanbalun.site` vào Caddy (reverse proxy hỗ trợ WebSocket) + 1 bản ghi DNS; không sửa gì khác của hạ tầng quán.
- [ ] **OPS-06**: Có công tắc tắt game nhanh (biến môi trường hoặc dừng container) không cần deploy lại, và POS quán không bị ảnh hưởng khi bật/tắt.
- [ ] **OPS-07**: Repo riêng, không nằm trong monorepo OrderQuanBaLun.
- [ ] **OPS-08**: Các mặc định chỉnh được (phạt 2s, khoá 2s, mã 4 số, phòng hết hạn 10 phút, vào lại 15s, tối đa 4 người) nằm trong một file cấu hình, không rải trong code.

## v2 Requirements

(Chưa có — SPEC không nêu mục hoãn. Ví dụ ứng viên nếu muốn mở rộng: bảng xếp hạng cho chế độ phòng, đăng nhập.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Đăng nhập / tài khoản | SPEC §4: chỉ biệt danh |
| Leaderboard cho chế độ phòng | SPEC §4: chỉ Chơi 1 mình |
| MySQL / dữ liệu của quán | SPEC §6: cô lập, dùng SQLite riêng |
| Monorepo OrderQuanBaLun | SPEC §6: repo riêng |
| Hover/tooltip, desktop-first | SPEC §1: ưu tiên điện thoại |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOARD-01 | Phase 1 | Pending |
| BOARD-02 | Phase 1 | Pending |
| BOARD-03 | Phase 1 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| ID-01 | Phase 1 | Pending |
| ID-02 | Phase 1 | Pending |
| SOLO-01 | Phase 1 | Pending |
| OPS-07 | Phase 1 | Pending |
| OPS-08 | Phase 1 | Pending |
| SOLO-02 | Phase 2 | Pending |
| SOLO-03 | Phase 2 | Pending |
| SOLO-04 | Phase 2 | Pending |
| SOLO-05 | Phase 2 | Pending |
| SOLO-06 | Phase 2 | Pending |
| OPS-01 | Phase 2 | Pending |
| OPS-02 | Phase 2 | Pending |
| ROOM-01 | Phase 3 | Pending |
| ROOM-02 | Phase 3 | Pending |
| ROOM-03 | Phase 3 | Pending |
| ROOM-04 | Phase 3 | Pending |
| ROOM-05 | Phase 3 | Pending |
| RACE-01 | Phase 3 | Pending |
| RACE-02 | Phase 3 | Pending |
| RACE-03 | Phase 3 | Pending |
| RACE-04 | Phase 3 | Pending |
| GRAB-01 | Phase 4 | Pending |
| GRAB-02 | Phase 4 | Pending |
| GRAB-03 | Phase 4 | Pending |
| GRAB-04 | Phase 4 | Pending |
| NET-01 | Phase 5 | Pending |
| NET-02 | Phase 5 | Pending |
| NET-03 | Phase 5 | Pending |
| OPS-03 | Phase 6 | Pending |
| OPS-04 | Phase 6 | Pending |
| OPS-05 | Phase 6 | Pending |
| OPS-06 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-10-28*
*Last updated: 2026-10-28 after roadmap creation*
