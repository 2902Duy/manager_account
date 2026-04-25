---
name: github-deploy
description: Tự động hoá quy trình commit và push code lên GitHub khi dự án đã có sẵn thư mục .git và remote.
---

# Kỹ năng Triển khai lên GitHub (GitHub Auto Deploy)

## Ngữ cảnh
Sử dụng kỹ năng này khi người dùng yêu cầu "deploy lên github", "push code", "lưu code lên github", hoặc các yêu cầu tương tự. Kỹ năng này giúp AI tự động hoá việc kiểm tra, thêm mới, tạo thông điệp (commit message) và đẩy mã nguồn lên kho lưu trữ từ xa (remote repository).

## Yêu cầu đầu vào (Prerequisites)
1. Thư mục làm việc hiện tại phải là một Git repository (đã có thư mục `.git`).
2. Đã được cấu hình remote repository (thường là `origin`).
3. Máy tính của người dùng đã được thiết lập sẵn quyền truy cập (Authentication/SSH) với GitHub.

## Các bước thực hiện

### Bước 1: Kiểm tra trạng thái Git
- Chạy lệnh `git status` để xem danh sách các file đã bị thay đổi, thêm mới hoặc xoá.
- Nếu thông báo trả về là "nothing to commit, working tree clean", hãy báo cho người dùng biết rằng không có thay đổi nào cần push và dừng quy trình.

### Bước 2: Stage các thay đổi
- Chạy lệnh `git add .` để đưa tất cả các thay đổi vào vùng chuẩn bị (staging area).

### Bước 3: Đánh giá và tạo Commit
- Dựa trên những công việc (tasks) vừa thực hiện trong cuộc trò chuyện hiện tại, hãy tự động tóm tắt và tạo một thông điệp commit (commit message) ngắn gọn, ý nghĩa.
- Chạy lệnh `git commit -m "Tóm tắt các thay đổi vừa làm"` 
- *(Khuyến khích sử dụng Conventional Commits như: feat: ..., fix: ..., chore: ...)*.

### Bước 4: Đẩy lên GitHub (Push)
- Chạy lệnh `git push`.
- Trong trường hợp branch hiện tại chưa được liên kết với remote (no upstream branch), Git sẽ báo lỗi kèm theo lệnh gợi ý. Hãy bắt lỗi đó và chạy lệnh gợi ý (ví dụ: `git push --set-upstream origin main`).

### Bước 5: Xử lý lỗi (Error Handling)
- **Lỗi chưa có remote:** Nếu lỗi báo `fatal: No configured push destination.`, hãy hỏi người dùng cung cấp link repo GitHub để bạn có thể chạy lệnh `git remote add origin <URL>`.
- **Lỗi Conflict/Cần Pull:** Nếu lỗi báo `non-fast-forward` (do code trên GitHub mới hơn code dưới máy), thông báo cho người dùng và xin phép chạy lệnh `git pull` trước khi push lại.

## Lưu ý quan trọng cho AI (Quy tắc bắt buộc)
- Phải sử dụng công cụ `run_command` để thực thi các lệnh Git ở trên.
- **TUYỆT ĐỐI KHÔNG** đặt tham số `SafeToAutoRun` là `true` cho các lệnh `git commit` và `git push`. Những lệnh này **BẮT BUỘC** phải để người dùng bấm nút Approve để xác nhận trước khi thực sự thay đổi mã nguồn trên hệ thống.
