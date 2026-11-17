# Dark Notes

Website ghi chú Dark Mode dùng HTML/CSS/JavaScript thuần. Không cần backend, cơ sở dữ liệu, tài khoản hoặc cài thư viện.

## Tính năng

- Nhiều tab ghi chú; thêm, chọn, đổi tên và xóa tab.
- Vùng soạn thảo hỗ trợ văn bản, xuống dòng, in đậm đoạn chọn, tăng/giảm cỡ chữ riêng mỗi tab.
- Dark Mode, responsive cho điện thoại và desktop.
- Tự lưu dữ liệu bằng `localStorage` trong từng trình duyệt/thiết bị.
- Xuất và nhập tệp sao lưu JSON (chú ý: nhập sẽ **thay thế** dữ liệu hiện tại).
- Không dùng thư viện bên ngoài hoặc server.

## Chạy thử

Mở `index.html` bằng Chrome, Edge hoặc Firefox. Có thể chạy local HTTP server với Python (không bắt buộc):

```bash
python -m http.server 8000
```

Sau đó mở `http://localhost:8000`.

## Deploy GitHub Pages

1. Đăng nhập GitHub và tạo public repository tên `USERNAME.github.io` (thay USERNAME bằng username GitHub của bạn).
2. Upload **3 file** `index.html`, `style.css`, `app.js` vào thư mục gốc của repository, hoặc push các file bằng Git.
3. Vào repository **Settings → Pages → Build and deployment**.
4. Chọn **Deploy from a branch**, branch `main`, thư mục `/(root)`, bấm **Save**.
5. Mở `https://USERNAME.github.io` sau khi workflow deploy thành công.

Nếu dùng repository tên khác, địa chỉ thường là `https://USERNAME.github.io/TEN-REPOSITORY/`.

## Lưu ý quan trọng về dữ liệu

- GitHub Pages host mã website công khai, **không phải** máy chủ lưu ghi chú. Nội dung ghi chú nằm ở bộ nhớ trình duyệt của bạn.
- Dữ liệu ở laptop sẽ **không** tự xuất hiện trên điện thoại. Hãy **Xuất dữ liệu** ra JSON và **Nhập dữ liệu** trên thiết bị khác để chuyển.
- Dữ liệu có thể mất nếu bạn xóa dữ liệu trình duyệt, dùng chế độ ẩn danh hoặc đổi thiết bị. Hãy sao lưu định kỳ.
- Không lưu thông tin quá nhạy cảm: `localStorage` không được mã hóa riêng cho ứng dụng.
- Mã nguồn tĩnh trên GitHub Pages thường chạy 24/7 và không đòi hỏi máy tính của bạn mở. GitHub Pages không cam kết SLA/uptime tuyệt đối.
- Để đồng bộ tự động giữa thiết bị, cần tích hợp một dịch vụ backend hoặc database (ví dụ Firebase/Supabase), và triển khai xác thực, phân quyền phù hợp.

## Cấu trúc

```text
dark-notes/
├── index.html   # Giao diện và cấu trúc HTML
├── style.css    # Dark mode + responsive
├── app.js       # Tab, editor, lưu cục bộ, backup
└── README.md    # Hướng dẫn
```
