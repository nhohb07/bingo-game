# Bingo Vui

Web game Bingo realtime cho lớp học/nhóm nhỏ. Chủ game tạo phòng, nhập danh sách mục gọi; người chơi tham gia bằng mã phòng, nhận bảng Bingo 5x5 riêng, đánh dấu các mục đã được gọi và bấm Bingo khi đủ hàng/cột/chéo.

## Features

- Không cần đăng nhập/đăng ký.
- Realtime bằng Socket.IO.
- Hỗ trợ nhiều phòng bằng mã phòng hoặc link `?code=XXXXX`.
- Host tạo danh sách mục gọi, tối thiểu 24 mục khác nhau.
- Server sinh bảng 5x5 riêng cho từng người chơi, có ô giữa tự do.
- Người chơi chỉ đánh dấu được ô đã được host gọi.
- Server kiểm tra Bingo theo hàng, cột và hai đường chéo.
- Chủ game có thể random 36 mục từ kho khoảng 1000 cụm 2 từ có nghĩa.
- Có popup luật chơi.
- UI tiếng Việt, pastel, mobile-first.
- Browser `localStorage` lưu tên người chơi và session host/player.

## Development

```bash
npm install
npm run dev
```

Frontend dev server chạy ở Vite port `5173`. Backend dev server chạy ở port `6680`.

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
client/src/App.tsx          # socket/session orchestration
client/src/components/      # reusable UI components
client/src/screens/         # screen-level UI
client/src/data/            # sample items and word bank
server/index.js             # thin HTTP/Socket.IO bootstrap
server/socketHandlers.js    # realtime event flow
server/lib/                 # store, serializers, factories, crypto helpers
shared/                     # pure game rules and constants
tests/                      # domain tests
docs/                       # architecture and socket event contract
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Socket events](docs/EVENTS.md)
- [Requirements](requirements.md)

## Before Push

```bash
npm run typecheck
npm test
npm run build
```
