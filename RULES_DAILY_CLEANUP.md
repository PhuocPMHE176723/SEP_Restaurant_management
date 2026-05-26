# Quy tắc nghiệp vụ: Khung giờ dọn dẹp quán & nhắc khéo khách

Mục tiêu: Xác định các khung giờ dọn dẹp quán (trưa/đêm), dựa trên dữ liệu đặt bàn (booking) để thông báo cho staff biết bàn nào cần nhắc khách kết thúc bữa ăn lịch sự.

## 1) Nguyên tắc chung

- Dọn dẹp quán cần **2 khung giờ cố định** mỗi ngày: trưa và đêm.
- Không cắt ngang khách đang ăn nếu chưa vượt quá thời lượng phục vụ hợp lý.
- Ưu tiên **nhắc khéo** trước giờ dọn dẹp 15–30 phút.
- Dựa vào **lịch booking** để tránh trùng các khung giờ cao điểm.

## 2) Input dữ liệu

- Danh sách booking trong ngày (giờ bắt đầu, giờ kết thúc dự kiến, số lượng khách).
- Trạng thái bàn hiện tại (occupied/reserved/available).
- Thời lượng trung bình một bữa ăn theo buổi:
  - Trưa: 60–90 phút
  - Tối: 90–120 phút

## 3) Quy tắc chọn khung giờ dọn dẹp

### 3.1 Khung dọn dẹp buổi trưa

- Mặc định: 14:00–15:00
- Điều chỉnh theo booking:
  - Nếu có booking sau 14:00, đẩy khung dọn dẹp sớm hơn 30–60 phút.
  - Nếu không có booking sau 14:00, giữ nguyên.

### 3.2 Khung dọn dẹp buổi đêm

- Mặc định: 21:30–23:00
- Điều chỉnh theo booking:
  - Nếu còn booking sau 21:30, lùi khung dọn dẹp 30–60 phút.
  - Nếu không có booking sau 21:30, giữ nguyên.

## 4) Quy tắc xác định bàn cần nhắc khách

- Một bàn cần nhắc khi:
  - Đang OCCUPIED
  - Vượt thời lượng phục vụ hợp lý (theo buổi)
  - Cách khung dọn dẹp ≤ 30 phút
- Ưu tiên nhắc theo mức:
  - Mức 1: Sắp tới khung dọn dẹp (≤30 phút)
  - Mức 2: Đã quá khung dọn dẹp

## 5) Thông báo cho staff

- Hiển thị danh sách bàn cần nhắc theo 2 mức ưu tiên.
- Mẫu nhắc khéo gợi ý:
  - “Dạ em xin phép thông báo sắp đến giờ dọn dẹp quán, anh/chị vui lòng dùng xong giúp em nhé ạ.”
  - “Dạ em xin phép hỗ trợ thanh toán khi anh/chị tiện ạ.”

## 6) Gợi ý triển khai hệ thống

- Tạo cron/daily job tính toán khung giờ dọn dẹp.
- Trên giao diện staff:
  - Badge cảnh báo trên danh sách bàn.
  - Modal “Nhắc khách” hiển thị mẫu câu gợi ý.

---

Nếu bạn muốn, mình có thể chuyển các rule này thành logic code và UI thông báo trong trang staff/manager.
