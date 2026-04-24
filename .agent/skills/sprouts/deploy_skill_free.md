# Tên Skill: Deploy Hệ Thống Fullstack Miễn Phí (FE, BE, DB)

## Mô tả (Description)
Bộ quy trình (skill) này cung cấp hướng dẫn chi tiết từng bước để triển khai (deploy) hoàn thiện một dự án Web (bao gồm Frontend, Backend và Database) lên môi trường production. Điểm cốt lõi là sử dụng các nền tảng có gói Free Tier tốt nhất hiện nay nhằm đưa dự án lên mạng với "chi phí 0 đồng", hỗ trợ hoàn hảo CI/CD qua GitHub.

## Điều kiện tiên quyết (Prerequisites)
1. **Quản lý mã nguồn:** Source code đã được đẩy (push) lên GitHub. Frontend và Backend phải được tách biệt rõ ràng ở 2 repo khác nhau hoặc 2 thư mục gốc độc lập.
2. **Biến môi trường (Environment Variables):**
   - Tuyệt đối không hardcode link API, mật khẩu Database hay JWT Secret trong source.
   - Frontend: Chỉ lấy URL Backend thông qua process (`process.env.XXX` hoặc `import.meta.env.XXX`).
   - Backend: Mở server lắng nghe tại port động (`process.env.PORT`). Kết nối DB bằng biến ngoài (`process.env.DATABASE_URL`).

---

## Luồng thực thi kỹ năng (Execution Steps)

### Bước 1: Triển khai Database (Phải làm đầu tiên)
Phải có cơ sở dữ liệu trên cloud để thiết lập String Connection cho backend kết nối.
* **Đối với Relational Database (Mặc định gợi ý PostgreSQL):** 
  - Khởi tạo dự án miễn phí tại [Supabase](https://supabase.com/). (Nên chọn server Singapore để tối ưu ping từ VN).
  - Trích xuất: Lấy chuỗi **Connection String (URI)**.
* **Đối với NoSQL (Gợi ý MongoDB):** 
  - Khởi tạo Cluster "M0 Free" tại [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
  - Network: Mở IP `0.0.0.0/0` (Allow Anywhere). Tạo DB user.
  - Trích xuất: Lấy chuỗi **Connect URI**.
* Thực thi các script định nghĩa Schema (nếu có).

### Bước 2: Triển khai Backend
Backend cần phải đứng giữa kết nối Front và cắm rễ vào DB bên trên.
* **Nền tảng:** Sử dụng gói miễn phí của [Render.com](https://render.com/). (Hoặc Koyeb.com nếu dùng Docker).
* **Quy trình áp dụng:**
  1. Tạo `New Web Service` và ủy quyền truy cập repo Backend trên GitHub.
  2. Xác định `Build Command` (vd: `npm install`, `pip install`).
  3. Xác định `Start Command` (vd: `npm run start`, `gunicorn...`).
  4. Cấu hình biến môi trường: Truyền toàn bộ biến `.env` vào, đặc biệt dán `DATABASE_URL` đã lấy ở Bước 1 vào.
* **Đầu ra:** Nhận được 1 domain API như `https://my-api-app.onrender.com`.

> **Lưu ý nghiệp vụ cấp bách:** Render cấu hình cho Backend miễn phí rơi vào trạng thái ngủ đông (Spin-down) sau 15 phút không tiếp nhận Request. Lượt request đánh thức đầu tiên sẽ tốn khoảng 30s-60s.

### Bước 3: Triển khai Frontend
Chạy Frontend cuối cùng vì nó cần nạp đường link chính thức của Backend.
* **Nền tảng:** Lựa chọn hoàn hảo nhất là [Vercel](https://vercel.com/) (hoặc Netlify).
* **Quy trình áp dụng:**
  1. Nhấn `Add New -> Project` và liên kết Repo Frontend.
  2. Vercel sẽ tự động detect Framework (NextJS, React, Vite) và định sẵn Build Command.
  3. Tại thiết lập Environment Variables: Tạo biến cho base URL API (VD: `REACT_APP_API_URL`) và dán link thu được từ Bước 2 vào dạng giá trị.
  4. Bấm `Deploy`.
* **Đầu ra:** Website Frontend live, có sẵn SSL/HTTPS (ổ khóa xanh). Mọi tương tác trên branch `main` GitHub của toàn bộ dự án từ nay sẽ được Build/Deploy tự động (CI/CD).

---

## Đối với trợ lý AI / Dev khi sử dụng Skill này
- Khi lập trình mã lỗi 502/503/Timeout trên frontend, phải nhắc nhở tính đến trường hợp Backend Render bị ngủ đông (Spin-down mode). Thiết kế UI loading layer (Skeleton hoặc Spinner) dài hơi hơn để xử lý gracefully điều này.
- Đảm bảo thiết lập đầy đủ CORS origin từ Vercel UI link truyền ngược vào Backend để tránh triệt để các lỗi liên quan đến Cross-Origin Policy.
