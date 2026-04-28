# Bingo Vui - Yêu Cầu Sản Phẩm

## Mục tiêu

Xây dựng game Bingo realtime, không cần tài khoản, dùng tốt trên điện thoại cho lớp học hoặc nhóm nhỏ.

## Vai trò

- Chủ game: tạo phòng, nhập tên phòng và danh sách mục gọi, bấm gọi mục tiếp theo, theo dõi người chơi đã Bingo.
- Người chơi: nhập tên, chọn phòng hoặc nhập mã phòng, nhận bảng 5x5 riêng, đánh dấu ô đã được gọi và bấm Bingo.

## Luật chơi

- Mỗi phòng cần ít nhất 24 mục khác nhau.
- Mỗi người chơi có bảng 5x5 riêng.
- Ô giữa là ô tự do.
- Host gọi từng mục theo thứ tự danh sách.
- Người chơi chỉ đánh dấu được ô tự do hoặc mục đã được gọi.
- Bingo hợp lệ khi có đủ một hàng, một cột hoặc một đường chéo.
- Server là nguồn kiểm tra Bingo chính, không tin trạng thái client.

## UI/UX

- Mobile-first.
- Bảng Bingo là trung tâm màn hình người chơi.
- Màu sắc pastel tươi sáng, cùng cảm giác với `word-guessing`.
- Trạng thái realtime rõ: kết nối, mã phòng, mục mới gọi, số mục đã gọi, người thắng.

## Không có trong MVP

- Database persistent.
- Tài khoản người dùng.
- Chat.
- QR code.
- Nhiều host cùng quản lý.
