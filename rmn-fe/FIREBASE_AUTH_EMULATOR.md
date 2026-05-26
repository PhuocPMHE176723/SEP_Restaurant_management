# Firebase Auth Emulator (Dev/Local)

Tài liệu này hướng dẫn chạy Firebase Auth Emulator cho dự án frontend và dùng OTP trong môi trường dev/local.

## 1) Yêu cầu

- Node.js + npm
- Dự án frontend: `rmn-fe`

## 2) Cấu hình môi trường

Đảm bảo file `.env.local` có các biến sau:

```bash
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT=9099
```

## 3) Tạo cấu hình emulator (nếu chưa có)

Đảm bảo file `firebase.json` nằm trong thư mục `rmn-fe` có nội dung:

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

## 4) Cài Firebase CLI (chạy 1 lần)

Nếu máy có quyền cài global:

```bash
npm i -g firebase-tools
```

Nếu máy không có quyền cài global, dùng npx:

```bash
npx firebase-tools --version
```

## 5) Chạy Auth Emulator

Trong thư mục `rmn-fe`:

```bash
firebase emulators:start --only auth
```

Nếu không có Firebase CLI global, dùng:

```bash
npx firebase-tools emulators:start --only auth
```

Sau khi chạy xong, UI emulator có tại:

- http://127.0.0.1:4000

## 6) Chạy frontend

Trong thư mục `rmn-fe`:

```bash
npm run dev
```

Mở trang:

- http://localhost:3000/profile/customer

Nhấn **Xác thực ngay** để gửi OTP (emulator). Mã OTP sẽ hiện trong Emulator UI.

## 7) Lưu ý

- Emulator chỉ dùng cho dev/local, không deploy production.
- Nếu lỗi port bận (9099/4000), hãy tắt process đang chiếm port hoặc đổi port trong `firebase.json`.
