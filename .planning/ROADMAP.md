# Roadmap: Schulte Game (game.quanbalun.site)

## Overview

Đi từ trong ra ngoài theo SPEC §7: trước hết có game Chơi 1 mình chạy được trên điện thoại (local, chưa cần server), rồi thêm server để chấm điểm có kiểm + bảng xếp hạng, sau đó thêm phòng nhiều người (Đua thời gian, rồi Giành số), gia cố rớt mạng + giới hạn tần suất, và cuối cùng đóng gói 1 container giới hạn tài nguyên, đặt sau Caddy trên VPS dùng chung mà không làm ảnh hưởng POS quán.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Khung repo + Chơi 1 mình (local)** - Repo riêng, bảng Schulte chơi được trên điện thoại, tiếng Việt, chưa cần server
- [ ] **Phase 2: Server + nộp điểm có kiểm + bảng xếp hạng** - Server Node/Socket.IO + SQLite, xác minh điểm solo, Top 10 hôm nay / mọi thời đại
- [ ] **Phase 3: Phòng + Đua thời gian** - Phòng 2-4 người mã 4 số, đua thời gian cùng bảng / bảng riêng do server làm trọng tài
- [ ] **Phase 4: Giành số** - Một bảng chung, ai chạm đúng trước giành số, khoá tay khi chạm sai
- [ ] **Phase 5: Rớt mạng/vào lại + giới hạn tần suất** - Vào lại trong 15s, bỏ cuộc sau đó, rate limit theo IP
- [ ] **Phase 6: Docker + Caddy + deploy VPS** - 1 container 256MB/0.5CPU, Caddy + DNS, công tắc tắt, cô lập khỏi POS

## Phase Details

### Phase 1: Khung repo + Chơi 1 mình (local)

**Goal**: Người chơi chơi được một ván Schulte hoàn chỉnh trên điện thoại ngay trên máy local, không cần server.
**Depends on**: Nothing (first phase)
**Requirements**: BOARD-01, BOARD-02, BOARD-03, UI-01, UI-02, ID-01, ID-02, SOLO-01, OPS-07, OPS-08
**Success Criteria** (what must be TRUE):

  1. Người chơi mở app trên điện thoại (màn hình hẹp), nhập biệt danh hợp lệ, chọn 4×4 / 5×5 / 6×6 và thấy bảng số 1..N xếp ngẫu nhiên, ô và chữ đủ to để chạm, giao diện tiếng Việt, không cần hover.
  2. Người chơi chạm 1 → N đúng thứ tự và thấy thời gian hoàn thành cuối ván.
  3. Chạm sai số làm ô nhá đỏ, điện thoại rung và thời gian cuối cộng thêm 2 giây; số kế tiếp không đổi.
  4. Biệt danh quá dài / ký tự lạ / từ tục bị từ chối kèm thông báo; biệt danh hợp lệ được điền sẵn khi mở lại app.
  5. Repo riêng khởi tạo được (client + server khung), mọi mặc định chỉnh được (phạt, khoá, mã phòng, hết hạn, vào lại, số người) nằm trong một file cấu hình.

**Plans**: 5 plans

Plans:
**Wave 1**

- [ ] 01-01-PLAN.md — Pin Node 24 + workspace manifests/config + lockfile resolved without install + blocking human lockfile review (OPS-07)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-02-PLAN.md — Tracer: npm ci → shared core → React screen, play 4×4 end to end; TDD game rules, seeded board, GAME_DEFAULTS (SOLO-01, BOARD-01..03, OPS-08)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-03-PLAN.md — Mobile game screen: touch board with emptied found cells, red flash + vibrate, live timer + "Tiếp theo" (UI-01, UI-02, BOARD-02, BOARD-03)
- [ ] 01-04-PLAN.md — Shared nickname filter (D-03) + blocklist (D-04) + on-device storage + blocking blocklist review (ID-01, ID-02)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 01-05-PLAN.md — Menu (nickname + size), result/replay, server skeleton, repo/i18n guard tests, README, phone UAT (SOLO-01, ID-01/02, UI-01/02, OPS-07/08)

**UI hint**: yes

### Phase 2: Server + nộp điểm có kiểm + bảng xếp hạng

**Goal**: Điểm Chơi 1 mình được server xác minh và hiện trên bảng xếp hạng Top 10 theo cỡ bảng.
**Depends on**: Phase 1
**Requirements**: SOLO-02, SOLO-03, SOLO-04, SOLO-05, SOLO-06, OPS-01, OPS-02
**Success Criteria** (what must be TRUE):

  1. Một server Node phát luôn file tĩnh của client; người chơi mở app qua server và chơi solo với bảng dựng từ seed do server cấp.
  2. Hoàn thành ván hợp lệ thì điểm xuất hiện trên bảng xếp hạng đúng cỡ bảng.
  3. Nộp nhật ký giả (sai thứ tự, khoảng cách chạm phi lý, seed lạ hoặc dùng lại) bị server từ chối và không xuất hiện trên bảng.
  4. Người chơi xem được Top 10 theo từng cỡ bảng ở hai tab "Hôm nay" và "Mọi thời đại"; điểm hôm qua không nằm trong "Hôm nay".
  5. Bảng xếp hạng còn nguyên sau khi khởi động lại server (SQLite trên volume); chế độ phòng không ghi vào bảng này.

**Plans**: TBD
**UI hint**: yes

### Phase 3: Phòng + Đua thời gian

**Goal**: 2-4 người cùng vào một phòng, đua thời gian trên cùng bảng hoặc bảng riêng, kết quả do server quyết định.
**Depends on**: Phase 2
**Requirements**: ROOM-01, ROOM-02, ROOM-03, ROOM-04, ROOM-05, RACE-01, RACE-02, RACE-03, RACE-04
**Success Criteria** (what must be TRUE):

  1. Chủ phòng tạo phòng, nhận mã 4 số, chọn Đua thời gian + cỡ bảng + cùng/riêng bảng; người khác nhập mã + biệt danh vào được, người thứ 5 và mã sai bị từ chối kèm thông báo.
  2. Chỉ chủ phòng bấm được Bắt đầu và chỉ khi có ≥ 2 người; mọi máy thấy đếm ngược 3s rồi cùng bắt đầu.
  3. "Cùng bảng": mọi người thấy cùng cách xếp số; "bảng riêng": mỗi người một cách xếp khác nhau.
  4. Hết ván mọi người thấy bảng kết quả liệt kê thời gian từng người (đã cộng phạt), nhanh nhất thắng; "Chơi lại" bắt đầu ván mới trong cùng phòng.
  5. Phòng không hoạt động 10 phút thì biến mất và mã không còn vào được.

**Plans**: TBD
**UI hint**: yes

### Phase 4: Giành số

**Goal**: Cả phòng đua trên một bảng chung, ai chạm đúng trước giành số đó, và mọi máy thấy ngay.
**Depends on**: Phase 3
**Requirements**: GRAB-01, GRAB-02, GRAB-03, GRAB-04
**Success Criteria** (what must be TRUE):

  1. Trong phòng Giành số, mọi người thấy cùng một bảng; khi một người chạm đúng số kế tiếp, mọi máy thấy số đó đổi sang màu người giành gần như tức thì.
  2. Hai người chạm cùng số gần đồng thời chỉ một người giành (theo thứ tự server nhận).
  3. Chạm sai thì người đó bị khoá tay 2 giây (thấy trạng thái khoá, chạm không có tác dụng) trong khi người khác chơi tiếp.
  4. Hết số, bảng kết quả cho thấy số lượng giành của từng người; nhiều nhất thắng, hoà thì người giành số cuối thắng; có "Chơi lại".

**Plans**: TBD
**UI hint**: yes

### Phase 5: Rớt mạng/vào lại + giới hạn tần suất

**Goal**: Ván nhiều người chịu được rớt mạng ngắn và hệ thống chống bị lạm dụng theo IP.
**Depends on**: Phase 4
**Requirements**: NET-01, NET-02, NET-03
**Success Criteria** (what must be TRUE):

  1. Người chơi tắt/bật lại mạng trong vòng 15 giây vào lại đúng phòng, đúng ván, đồng hồ của họ vẫn chạy trong lúc rớt (cả Đua thời gian và Giành số).
  2. Quá 15 giây không vào lại thì người đó bị tính bỏ cuộc, những người còn lại chơi tiếp và ván vẫn kết thúc bình thường với kết quả đúng.
  3. Tạo phòng, nộp điểm và mở kết nối WebSocket liên tục từ một IP vượt ngưỡng thì bị từ chối kèm thông báo, người dùng bình thường không bị ảnh hưởng.

**Plans**: TBD

### Phase 6: Docker + Caddy + deploy VPS

**Goal**: Cả 3 chế độ chơi được trên điện thoại qua `game.quanbalun.site`, trong container bị giới hạn, không làm ảnh hưởng POS quán.
**Depends on**: Phase 5
**Requirements**: OPS-03, OPS-04, OPS-05, OPS-06
**Success Criteria** (what must be TRUE):

  1. Mở `game.quanbalun.site` trên điện thoại, chơi được Chơi 1 mình (điểm lên bảng xếp hạng), Đua thời gian và Giành số (WebSocket qua Caddy).
  2. Container chạy với 256 MB RAM / 0.5 CPU / `restart: unless-stopped`, vẫn ổn định khi phòng đầy người; tự lên lại sau khi bị kill; bảng xếp hạng còn sau khi lên lại.
  3. Dừng container hoặc làm nghẽn nó (tải thử) thì POS quán vẫn hoạt động bình thường.
  4. Bật công tắc tắt (biến môi trường hoặc dừng container) thì game ngừng phục vụ mà không cần deploy lại, và bật lại được; hạ tầng quán chỉ thay đổi đúng 1 khối Caddy + 1 bản ghi DNS.

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Khung repo + Chơi 1 mình (local) | 0/TBD | Not started | - |
| 2. Server + nộp điểm có kiểm + bảng xếp hạng | 0/TBD | Not started | - |
| 3. Phòng + Đua thời gian | 0/TBD | Not started | - |
| 4. Giành số | 0/TBD | Not started | - |
| 5. Rớt mạng/vào lại + giới hạn tần suất | 0/TBD | Not started | - |
| 6. Docker + Caddy + deploy VPS | 0/TBD | Not started | - |
