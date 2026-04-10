# Kiểm toán Logic dự án & Giải pháp dọn dẹp bàn hàng ngày

Tài liệu này tóm tắt các lỗ hổng logic đã phát hiện và kế hoạch khắc phục cho hệ thống quản lý nhà hàng.

## 1. Vấn đề chính: Bàn bị kẹt trạng thái "Bận" (Occupied)
Hiện tại, bảng `DiningTable` chỉ được chuyển về trạng thái `AVAILABLE` khi đơn hàng (`Order`) được nhân viên chủ động đóng hoặc hủy. Nếu nhân viên quên, bàn sẽ bị kẹt trạng thái có khách qua ngày hôm sau.

### Giải pháp:
Xây dựng một **Background Service** (`DailyTableCleanupService`) chạy tự động vào lúc 4:00 sáng định kỳ để:
- Hủy các đơn hàng chưa hoàn thành từ hôm trước.
- Giải phóng các bàn đang bận.

## 2. Các lỗ hổng logic khác
Dưới đây là các điểm cần cải thiện để hệ thống hoạt động ổn định hơn:

| STT | Lỗ hổng | Hệ quả | Giải pháp |
| :--- | :--- | :--- | :--- |
| 1 | Bàn bị kẹt trạng thái "Bận" | Bàn vẫn hiện có khách qua ngày hôm sau | Xây dựng background service dọn dẹp lúc 4h sáng. |
| 2 | Đặt chỗ quá hạn (No-show) | Bàn bị giữ chỗ ảo, ảnh hưởng đến việc xếp bàn | Tự động chuyển trạng thái `CONFIRMED` quá hạn sang `NO_SHOW`. |
| 3 | Thiếu trạng thái `RESERVED` | Bàn đã đặt chỗ vẫn hiện là `AVAILABLE` cho khách vãng lai | Khi đặt chỗ ở trạng thái `CONFIRMED`, tự động cập nhật trạng thái bàn thành `RESERVED`. |
| 4 | Xác thực thanh toán ở FE | Tiềm ẩn rủi ro lách luật thanh toán | Chuyển logic cập nhật trạng thái đơn hàng vào API xử lý tập trung ở Backend. |
| 5 | Giao dịch kho trùng lặp | Thất thoát kho khi hủy đơn hoặc thực hiện thao tác SERVED nhiều lần | Thêm mã kiểm tra ID tham chiếu (RefId) trong bảng StockMovements. |
| 6 | Đặt bàn trùng lặp | Một bàn có thể bị đặt 2 lần cùng 1 khung giờ | Thêm logic kiểm tra xung đột thời gian (Time-slot Conflict) khi tạo Reservation. |
| 7 | Định lượng theo món cứng | Khó quản lý cốt liệu thực tế (Actual vs Theoretical) | Chuyển sang mô hình **Định lượng theo ngày**, cho phép bếp Prep sẵn và trừ vào quỹ Prep. |

## 3. Kế hoạch triển khai (Backend)
- **Tạo file**: `Core/ProgramConfig/DailyTableCleanupService.cs`
- **Đăng ký**: Tại `Program.cs`
- **Cập nhật**: `ReservationService.cs` để quản lý trạng thái `RESERVED`.

---
*Tài liệu này được tạo bởi Antigravity AI để hỗ trợ quản lý dự án.*
