# Bingo Vui

Web game Bingo realtime cho lớp học/nhóm nhỏ. Chủ game tạo phòng, nhập danh sách mục gọi; người chơi tham gia bằng mã phòng, nhận bảng Bingo 5x5 riêng, đánh dấu các mục đã được gọi và bấm Bingo khi đủ hàng/cột/chéo.

## Features

- Không cần đăng nhập/đăng ký.
- Realtime bằng Socket.IO.
- Hỗ trợ nhiều phòng bằng mã phòng.
- Người chơi có thể chọn phòng đang mở hoặc vào bằng link `?code=XXXXX`.
- Host tạo danh sách mục gọi, tối thiểu 24 mục khác nhau.
- Server sinh bảng 5x5 riêng cho từng người chơi, có ô giữa tự do.
- Người chơi chỉ đánh dấu được ô đã được host gọi.
- Server kiểm tra Bingo theo hàng, cột và hai đường chéo.
- Chủ game có thể random 36 mục từ kho 1000 cụm 2 từ có nghĩa.
- Kho random gồm các chủ đề: con vật, đồ vật, tên người, lớp học, tiếng Anh, nhà cửa, cảnh vật.
- Có popup luật chơi.
- UI tiếng Việt, pastel, mobile-first, cùng format với các game hiện có.
- Tên người chơi và session tạm thời lưu bằng `localStorage`.

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, Socket.IO
- Process manager: PM2
- Tests: Vitest

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Frontend dev server chạy ở Vite port `5173`. Backend dev server chạy ở port `6680`.

Mở:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

Build output nằm ở `dist/`.

## Run Production Locally

```bash
HOST=0.0.0.0 PORT=6680 npm start
```

Mở:

```text
http://localhost:6680
```

Trong LAN:

```text
http://<LAN_IP>:6680
```

## PM2

Start:

```bash
npm run pm2:start
```

Restart sau khi sửa code:

```bash
npm run pm2:restart
```

Logs:

```bash
npm run pm2:logs
```

Save process list:

```bash
npm run pm2:save
```

Stop/delete:

```bash
npm run pm2:stop
npm run pm2:delete
```

## Scripts

```bash
npm run dev          # chạy frontend + backend dev
npm run build        # build frontend production
npm start            # chạy Express server phục vụ dist/
npm test             # chạy unit tests
npm run typecheck    # kiểm tra TypeScript
npm run pm2:start    # build và start bằng PM2
npm run pm2:restart  # build và restart PM2
npm run pm2:logs     # xem logs PM2
```

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Network interface để Express bind. |
| `PORT` | `6680` | HTTP port cho Express và Socket.IO. |
| `VITE_SOCKET_URL` | current origin | Socket.IO URL khi chạy frontend dev hoặc frontend tách riêng. |

## Project Structure

```text
client/
  src/
    App.tsx
    main.tsx
    styles.css
    wordBank.ts
server/
  index.js
shared/
  gameLogic.js
tests/
  gameLogic.test.js
ecosystem.config.cjs
vite.config.ts
vitest.config.ts
requirements.md
```

## Storage Model

- Server state nằm trong memory.
- Restart server sẽ mất phòng đang mở.
- Browser `localStorage` lưu tên người chơi và session host/player để reload lại phòng nếu server chưa restart.

## Before Push

```bash
npm run typecheck
npm test
npm run build
```

Repo nên commit các file source và lockfile, không commit `node_modules/` hoặc `dist/`.
