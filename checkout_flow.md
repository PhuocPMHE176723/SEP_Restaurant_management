# Quy trình Nghiệp vụ: Từ Đặt cọc đến Thanh toán & In Hóa đơn

Tài liệu này mô tả luồng xử lý khép kín dành cho khách hàng và nhân viên nhà hàng.

## 1. Giai đoạn: Đặt bàn & Đặt cọc (Pre-arrival)
- **Khách hàng** đặt bàn qua Website và thanh toán cọc (50% giá trị dự kiến).
- **Hệ thống** chuyển trạng thái Reservation sang `CONFIRMED`.
- **Dữ liệu**: Tiền cọc được ghi nhận vào hệ thống để trừ vào hóa đơn cuối cùng.

## 2. Giai đoạn: Phục vụ tại bàn (Service)
- **Check-in**: Khi khách đến, nhân viên xác nhận mã đặt bàn.
    - Trạng thái **Bàn ăn** chuyển sang `OCCUPIED` (Đang dùng).
    - Trạng thái **Đơn hàng** (Order) được kích hoạt.
- **Gọi món**: 
    - **Nhân viên (Staff)**: Gọi món trực tiếp cho khách tại quầy/bàn.
    - **Khách hàng (Self-Ordering)**: Khách quét mã QR tại bàn để tự chọn món thông qua trang gọi món riêng. Đơn hàng từ khách sẽ chờ nhân viên xác nhận.
- **Xác nhận & Chế biến & Trừ kho**:
    - Nhân viên **Xác nhận** món khách tự gọi để đẩy xuống Bếp.
    - Bếp thực hiện món và cập nhật trạng thái đã phục vụ (`Served`).
    - **Hệ thống tự động**: Truy xuất định mức nguyên liệu (Công thức) và thực hiện lệnh **Xuất kho tự động** để trừ tồn kho thực tế ngay khi món hoàn thành.

## 3. Giai đoạn: Tính toán & Áp dụng Khuyến mãi (Pre-checkout)
Khi khách yêu cầu thanh toán, hệ thống thực hiện các bước sau:
1. **Tính Tổng tiền (Subtotal)**: Tổng giá trị các món đã phục vụ.
2. **Áp dụng Mã giảm giá**: 
    - Nhân viên nhập mã (VD: `SUMMER20`).
    - Hệ thống kiểm tra điều kiện (Hạn dùng, Đơn tối thiểu, Loại giảm % hay Tiền mặt).
    - Giảm trừ vào Tổng tiền.
3. **Tính Thuế VAT**:
    - Thuế suất mặc định: **8%**.
    - Cách tính: `VAT = (Tổng tiền - Giảm giá) * 8%`.
4. **Trừ Tiền cọc (Deposit)**:
    - Hệ thống tự động truy xuất số tiền khách đã trả lúc đặt bàn.
    - `Tiền cần thu = (Tổng tiền + VAT - Giảm giá) - Tiền cọc`.

## 4. Giai đoạn: Thanh toán & Kết thúc (Checkout)
- **Thực hiện**: Nhân viên (Staff) hoặc Thu ngân (Cashier) nhấn xác nhận "Thanh toán".
- **Hành động hệ thống**:
    - Tạo bản ghi **Invoice** (Hóa đơn) chính thức.
    - Trạng thái **Đơn hàng** -> `CLOSED`.
    - Trạng thái **Bàn ăn** -> `AVAILABLE` (Sẵn sàng đón khách mới).
    - Trạng thái **Đặt bàn** -> `COMPLETED`.
    - **Tích điểm**: Hệ thống tự động cộng điểm tích lũy cho khách hàng (nếu có tài khoản).

## 5. Giai đoạn: Xuất Hóa đơn PDF (Printing)
- **In Hóa đơn**: Sau khi thanh toán, hệ thống cung cấp nút "In hóa đơn PDF".
- **Nội dung PDF**:
    - Thông tin nhà hàng, Mã hóa đơn, Tên bàn.
    - Danh sách chi tiết món ăn (Số lượng, Đơn giá).
    - Các dòng chi tiết: Tạm tính, Giảm giá, VAT (8%), Đã đặt cọc, Tổng cộng cần trả.
- **Vai trò**: Nhân viên (Staff) có thể hỗ trợ in tại bàn hoặc Thu ngân in tại quầy.

## 6. Giai đoạn: Kiểm kê & Đối soát Kho (Inventory Audit)
- **Kiểm kho hàng ngày**: Nhân viên kho (Warehouse) thực hiện kiểm đếm thực tế vào cuối ngày hoặc định kỳ.
- **Phiếu kiểm kho**:
    - Hệ thống liệt kê số tồn khả dụng (đã trừ tự động từ các món bán ra).
    - Nhân viên nhập **Số lượng thực tế**.
    - Hệ thống tự động tính toán **Hao tổn/Chênh lệch**.
- **Cân bằng kho**: Sau khi chốt phiếu kiểm, hệ thống cập nhật lại tồn kho theo số thực tế và ghi nhận lý do hao tổn vào báo cáo.

---
> [!NOTE]
> Hệ thống phân quyền cho phép cả **Staff** (Nhân viên) và **Cashier** (Thu ngân) thực hiện việc xem trước hóa đơn và xác nhận thanh toán để tối ưu tốc độ phục vụ.
