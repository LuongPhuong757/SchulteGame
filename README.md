# Bảng Schulte

Game luyện tập Schulte: chạm các số từ 1 đến N*N theo đúng thứ tự trên bảng 4×4, 5×5 hoặc 6×6, chơi mượt trên điện thoại. Chạm sai bị phạt thời gian. Giai đoạn 1 chỉ có chế độ chơi một mình, mọi thứ chạy trên máy (không gửi dữ liệu đi đâu).

Repo này độc lập, không thuộc monorepo OrderQuanBaLun (OPS-07): có git root riêng, các workspace `shared`, `client`, `server`, mọi dependency ghim phiên bản chính xác và không trỏ ra ngoài repo.

## Yêu cầu

Node 24.20.0 (Vite 8 không chạy trên Node 20.11 mặc định của fnm). Dùng fnm:

```bash
fnm use          # đọc .node-version (24.20.0)
npm ci
```

Nếu chưa dùng `fnm use`, có thể thêm tiền tố cho từng lệnh: `fnm exec --using=24.20.0 -- npm test`.

## Lệnh

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Chạy client ở máy này (Vite dev server) |
| `npm run dev:phone` | Chạy client và mở cho điện thoại cùng Wi-Fi truy cập |
| `npm run build` | Build client vào `client/dist` |
| `npm test` | Chạy toàn bộ test (3 project: shared, client, server) |
| `npm test -- --project shared` | Chỉ test một project (`shared`, `client` hoặc `server`) |
| `npm run typecheck` | Kiểm tra kiểu TypeScript cho cả 3 workspace |
| `npm run start -w @schulte/server` | Chạy server skeleton: in cấu hình chung rồi thoát |

## Thử trên điện thoại

1. Máy tính và điện thoại dùng chung một Wi-Fi.
2. Chạy `npm run dev:phone`.
3. Mở địa chỉ `Network` mà Vite in ra (dạng `http://192.168.x.x:5173`) trên Chrome (Android) hoặc Safari (iPhone).
4. Kiểm tra: ô số đủ lớn để chạm ở 6×6, không zoom khi chạm đúp, chạm sai nháy đỏ ô đó (Android có rung), thời gian kết quả khớp đồng hồ, tải lại trang vẫn nhớ biệt danh.

## Cấu trúc

- `shared/`: logic thuần dùng chung cho client và server (tạo bảng từ seed, luật chơi, định dạng thời gian, kiểm tra biệt danh, cấu hình mặc định).
- `client/`: giao diện React + Vite, toàn bộ chữ hiển thị nằm trong `client/src/i18n/vi.ts`.
- `server/`: skeleton, mới chỉ chứng minh import được `@schulte/shared`. Không mở cổng nào.

## Cấu hình chỉnh được

Mọi giá trị mặc định có thể chỉnh (phạt chạm sai, khoá, độ dài mã phòng, hạn phòng, thời gian vào lại, số người tối đa, cỡ bảng, giới hạn biệt danh...) nằm ở một chỗ duy nhất: `shared/src/config.ts` (OPS-08). Test `server/src/repo-guards.test.ts` chặn việc viết lại các con số này ở file khác.

Lưu ý cho Giai đoạn 2: nếu server cho ghi đè cấu hình bằng biến môi trường, server phải trả cấu hình đang áp dụng cho client (ví dụ `GET /api/config`), nếu không client có thể hiển thị mức phạt khác với mức server thực thi.

## Biệt danh

Quy tắc (D-03): 2 đến 16 ký tự sau khi chuẩn hoá NFC, chỉ gồm chữ (kể cả tiếng Việt có dấu), số, khoảng trắng và các dấu `_` `.` `-`. Khoảng trắng thừa được gộp lại. Biệt danh được lưu trong `localStorage` của trình duyệt và điền sẵn ở lần sau.

Danh sách từ bị chặn (tiếng Việt và tiếng Anh) nằm ở `shared/src/nickname-blocklist.ts`, đã được chủ dự án duyệt (D-04). Khi bị chặn, game chỉ hiện một thông báo trung tính, không nhắc lại tên đã nhập.

## Việc mở cho Giai đoạn 2

- Cách build server cho production: chạy bằng `tsx` hay gói bằng esbuild (gói `shared` hiện phát hành file `.ts` thô).
- Chọn driver SQLite: `better-sqlite3` hay `node:sqlite` có sẵn, và kiểm tra lại độ tin cậy của gói trước khi cài.
- Thêm Socket.IO, phục vụ file tĩnh của client, lưu bảng xếp hạng.
