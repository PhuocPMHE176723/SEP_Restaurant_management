# Nghiệp Vụ Hệ Thống Thông Báo (Notification Business Rules)

Tài liệu này mô tả chi tiết các nghiệp vụ thực tế và thiết kế hệ thống thông báo cho nhà hàng G26, bao gồm các đối tượng nhận tin, điều kiện kích hoạt (triggers), nội dung thông báo và giao diện người dùng.

---

## 1. Các Luồng Nghiệp Vụ & Kích Hoạt (Triggers)

Hệ thống hỗ trợ 4 luồng thông báo chính tương ứng với các hoạt động vận hành của nhà hàng:

### 1.1. Nhận Bàn / Check-in (CHECKIN)
*   **Mục đích**: Thông báo cho nhân viên phục vụ, thủ quỹ và quản lý biết khi bàn ăn bắt đầu có khách sử dụng.
*   **Thời điểm kích hoạt**:
    1.  Khi khách hàng có lịch đặt trước đến nhà hàng và nhân viên thực hiện thao tác **Check-in đơn đặt bàn** (trong màn hình quản lý đặt bàn).
    2.  Khi có khách vãng lai (walk-in) vào quán và nhân viên tạo hóa đơn trực tiếp cho bàn trống (thao tác **Mở bàn vãng lai**).
*   **Đối tượng nhận**:
    *   **Staff** (Nhân viên phục vụ): Để chuẩn bị menu, phục vụ nước uống và chuẩn bị lên món.
    *   **Cashier** (Thủ quỹ / Thu ngân): Để theo dõi trạng thái bàn trống/bận trên sơ đồ bàn.
    *   **Manager** (Quản lý): Giám sát hoạt động chung.
*   **Nội dung hiển thị**:
    *   *Tiêu đề*: Khách check-in bàn {Mã bàn}
    *   *Nội dung*: Khách hàng {Tên khách} đã nhận bàn {Mã bàn} lúc {Thời gian}. Trạng thái bàn chuyển sang ĐANG SỬ DỤNG.

### 1.2. Thanh Toán / Checkout (PAYMENT)
*   **Mục đích**: Báo cáo doanh thu tức thời và thông báo bàn đã được giải phóng để nhân viên dọn dẹp chuẩn bị đón lượt khách tiếp theo.
*   **Thời điểm kích hoạt**:
    *   Thủ quỹ hoặc nhân viên thực hiện thanh toán thành công đơn hàng (trên cổng Cashier/Staff qua tiền mặt hoặc quét mã chuyển khoản QR Sepay).
    *   Trạng thái đơn hàng chuyển sang `CLOSED` (Đã thanh toán) và hóa đơn được tạo thành công.
*   **Đối tượng nhận**:
    *   **Staff** (Nhân viên phục vụ): Biết bàn đã thanh toán để tiến hành dọn dẹp và set up lại bàn ăn.
    *   **Cashier** (Thu ngân): Xác nhận giao dịch thành công.
    *   **Manager** (Quản lý): Giám sát dòng tiền doanh thu thời gian thực.
*   **Nội dung hiển thị**:
    *   *Tiêu đề*: Thanh toán hóa đơn {Mã hóa đơn}
    *   *Nội dung*: Bàn {Mã bàn} đã thanh toán thành công {Số tiền} VNĐ. Trạng thái bàn chuyển sang ĐÃ GIẢI PHÓNG.

### 1.3. Đặt Bàn / Booking (RESERVATION)
*   **Mục đích**: Quản lý lịch hẹn, chuẩn bị bàn trước và gửi xác nhận trạng thái cho khách hàng.
*   **Thời điểm kích hoạt**:
    1.  **Khách hàng đặt bàn trực tuyến**: Tạo mới một đơn đặt bàn (trạng thái `PENDING`).
    2.  **Quản lý/Thủ quỹ xác nhận bàn**: Duyệt và gán bàn cụ thể (trạng thái chuyển sang `CONFIRMED`).
    3.  **Hủy đặt bàn**: Khách chủ động hủy hoặc hệ thống tự động hủy do hết hạn thanh toán cọc (trạng thái chuyển sang `CANCELLED`).
*   **Đối tượng nhận**:
    *   **Staff/Cashier/Manager**: Nhận thông báo khi có *đơn đặt bàn mới* hoặc *đơn bị khách hủy* để sắp xếp sơ đồ bàn hợp lý.
    *   **Customer** (Khách hàng cụ thể): Nhận thông báo khi trạng thái đơn đặt của họ được cập nhật (`CONFIRMED`, `CANCELLED`, `NO_SHOW`).
*   **Nội dung hiển thị**:
    *   *Dành cho Nhân viên*: "Khách hàng {Tên khách} đã đặt bàn {Mã bàn} vào lúc {Thời gian} cho {Số khách} người."
    *   *Dành cho Khách hàng*: "Đơn đặt bàn {Mã đơn} của bạn lúc {Thời gian} đã được XÁC NHẬN. Hẹn gặp lại bạn tại nhà hàng!"

### 1.4. Dọn Dẹp / Cleanup (CLEANUP)
*   **Mục đích**: Báo cáo kết quả của tiến trình dọn dẹp tự động hàng ngày (Daily System Cleanup Service) để giải phóng các tài nguyên bàn ăn bị kẹt từ ngày hôm trước.
*   **Thời điểm kích hoạt**:
    *   Khi dịch vụ chạy ngầm (Background Service) dọn dẹp chạy định kỳ vào cuối ngày (hoặc lúc khởi động hệ thống). Dịch vụ này tự động hủy các hóa đơn/đơn đặt bàn quá hạn chưa đóng và chuyển trạng thái các bàn trống về `AVAILABLE`.
*   **Đối tượng nhận**:
    *   **Manager** (Quản lý) & **Staff**: Theo dõi tính chính xác của hệ thống và nắm bắt các bàn ăn đã được dọn dẹp giải phóng sạch sẽ.
*   **Nội dung hiển thị**:
    *   *Tiêu đề*: Dọn dẹp hệ thống định kỳ hoàn tất
    *   *Nội dung*: Đã tự động hủy {Số hóa đơn} đơn hàng tồn đọng, hủy {Số đặt bàn} đơn quá hạn và giải phóng {Số bàn} bàn ăn về trạng thái sẵn sàng.

---

## 2. Thiết Kế Cơ Sở Dữ Liệu (`Notifications` Table)

Mỗi thông báo được lưu trữ trong cơ sở dữ liệu với các trường thông tin sau:

| Tên cột | Kiểu dữ liệu | Cho phép Null | Mô tả |
| :--- | :--- | :--- | :--- |
| **NotificationId** | bigint (Identity) | Không | Khóa chính tự tăng |
| **UserId** | nvarchar(450) | Có | Liên kết tới tài khoản khách hàng nhận tin (nếu là thông báo riêng) |
| **Role** | nvarchar(50) | Có | Vai trò nhận tin (Staff, Cashier, Manager...). Nếu có giá trị, tất cả nhân viên thuộc Role này sẽ nhìn thấy thông báo. |
| **Title** | nvarchar(150) | Không | Tiêu đề thông báo ngắn gọn |
| **Message** | nvarchar(500) | Không | Nội dung chi tiết thông báo |
| **Type** | nvarchar(50) | Không | Phân loại: `CHECKIN`, `PAYMENT`, `RESERVATION`, `CLEANUP`, `SYSTEM` |
| **IsRead** | bit | Không | Trạng thái đã đọc (mặc định: `0` - chưa đọc) |
| **CreatedAt** | datetime2 | Không | Thời gian tạo thông báo (UTC/Local) |
| **RelatedId** | nvarchar(100) | Có | ID liên kết hỗ trợ điều hướng (Mã hóa đơn, ID đặt bàn...) |

---

## 3. Cơ Chế Nhận Thông Báo Thời Gian Thực (Real-time & Polling)

Để đảm bảo hiệu năng tối ưu và sự ổn định cao:
1.  **Cơ chế Polling**: Cứ mỗi **10 giây**, ứng dụng Frontend Next.js sẽ tự động gọi API `GET /api/notifications` để lấy danh sách các thông báo mới nhất.
2.  **Bộ lọc phân quyền thông minh**:
    *   Nếu là tài khoản **Khách hàng** (Customer): Chỉ hiển thị các thông báo có `UserId` trùng với tài khoản đang đăng nhập.
    *   Nếu là tài khoản **Nhân viên** (Staff, Cashier, Manager): Hệ thống sẽ lấy các thông báo có trường `Role` tương ứng với vai trò của nhân viên đó để hiển thị trên màn hình quản lý tương ứng.
3.  **UI/UX Bell Dropdown**:
    *   Biểu tượng chuông thông báo sẽ xuất hiện trên thanh Topbar của tất cả các Cổng quản lý (Cashier Portal, Staff Portal, Manager Portal) và Header của trang chủ Khách hàng.
    *   Khi có thông báo mới chưa đọc, chuông sẽ hiển thị số lượng màu đỏ cùng hiệu ứng rung động nhẹ.
    *   Nhấp vào chuông sẽ hiển thị danh sách 5-10 thông báo mới nhất kèm theo nút "Đánh dấu đã đọc tất cả".
