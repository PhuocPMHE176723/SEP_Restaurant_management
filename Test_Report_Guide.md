# Hướng dẫn tạo file báo cáo test (CSV) từ cấu trúc test code

## 1. Mục tiêu

Tạo các file CSV theo đúng mẫu báo cáo test (Report5.1) dựa trên danh sách FUNC và nội dung test trong project.

## 2. Đầu vào cần có

- File danh sách FUNC (Functions list):
  - Chứa các cột: Module, Class, Function, Function Code (FUNCxx), mô tả, pre-condition.
- Các file test trong thư mục `rmn-be.Tests/Tests/`.
- File mẫu CSV đã chuẩn (ví dụ: `Report5.1_Unit Test.xlsx - FUNC_01 (1).csv`).

## 3. Quy ước ánh xạ FUNC

Từ danh sách FUNC:

- `Function Code` → tên file CSV theo format: `Report5.1_Unit Test.xlsx - FUNC_XX.csv`.
- `Function Name` → điền vào cột `Method` của CSV.
- `Description` → điền vào dòng `Test requirement`.

## 4. Cấu trúc CSV chuẩn

Các vùng chính (đúng vị trí căn trái như mẫu):

- Header: Code Module, FUNC, Method.
- Metadata: Created By, Executed By (tuỳ điền).
- Test requirement.
- Passed/Failed/Untested + N/A/B + Total Test Cases.
- Table chính:
  - `UTCID01..UTCID05`
  - `Condition/Precondition`
  - `Input`
  - `Confirm/Return`
  - `Exception`
  - `Database changes`
  - `Result` + `Passed/Failed`

Lưu ý: các tiêu đề `Confirm`, `Exception`, `Database changes` phải ở cột đầu (dịch trái như file mẫu).

## 5. Cách đọc code test để điền CSV

### 5.1. Xác định test cases

Trong mỗi file test:

- Mỗi test `[Fact]` tương ứng 1 UTCID (UTCID01..UTCID05).
- `Trait("Method", "...")` xác định function.
- `Trait("Type", "N/A/B")` xác định loại.

### 5.2. Điền Condition/Precondition

Tóm tắt điều kiện tiền đề từ phần Arrange của test:

- Ví dụ: tạo dữ liệu seed, trạng thái entity, tồn tại/không tồn tại.
- Đánh dấu O theo từng UTCID.

### 5.3. Điền Input

Từ phần gọi method:

- Bắt buộc ghi rõ dữ liệu đầu vào (giá trị cụ thể) giống mẫu CSV.
- Không ghi chung chung kiểu "Email" hay "DTO".
- Tách theo từng field và từng giá trị test (ví dụ: Email, UserName, Password...).
- Ví dụ đúng:
  - Email: test@example.com / existing@example.com
  - UserName: testuser / existinguser
  - Password: Test123!@#
  - PhoneNumber: 123456789

### 5.4. Điền Confirm/Return

Từ Assert kết quả:

- Giá trị trả về (`true/false`, DTO không null, status...).
- Trạng thái entity hoặc thuộc tính.

### 5.5. Điền Exception

Từ `Assert.ThrowsAsync`:

- Ghi rõ loại exception hoặc message nếu có.

### 5.6. Điền Database changes

Từ Assert kiểm tra DB (count, status, insert/delete...):

- Thêm/xoá/cập nhật record.
- Không thay đổi khi fail.

## 6. Quy trình tạo file CSV (chuẩn hoá)

1. Đọc file Functions list để lấy FUNC + Description.
2. Tạo file CSV cho từng FUNC theo mẫu chuẩn.
3. Điền phần header (Method, Test requirement).
4. Đọc file test tương ứng để map UTCID.
5. Điền Condition/Input/Confirm/Exception/DB changes.
6. Kiểm tra căn cột theo mẫu (đặc biệt Confirm/Exception/DB changes phải dịch trái).

## 7. Ví dụ ánh xạ nhanh (rút gọn)

- `LoginAsync` → FUNC_01 → file CSV `Report5.1_Unit Test.xlsx - FUNC_01.csv`
- `RegisterAsync` → FUNC_02 → file CSV `Report5.1_Unit Test.xlsx - FUNC_02.csv`
- `DoDailyCleanupAsync` → FUNC_06 → file CSV `Report5.1_Unit Test.xlsx - FUNC_06.csv`

## 8. Ghi chú sử dụng lại lần sau

- Luôn dùng mẫu CSV gốc làm chuẩn layout.
- Không đổi vị trí dấu phẩy ngoài các ô cần điền.
- Duy trì 5 testcases/func (UTCID01..UTCID05) theo thống nhất hiện tại.
