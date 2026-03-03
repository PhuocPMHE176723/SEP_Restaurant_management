using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rmn_be.Core.Migrations
{
    /// <inheritdoc />
    public partial class NewSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Customer_AspNetUsers_UserId",
                table: "Customer");

            migrationBuilder.DropForeignKey(
                name: "FK_Order_Customer",
                table: "Order");

            migrationBuilder.DropForeignKey(
                name: "FK_Order_Shift",
                table: "Order");

            migrationBuilder.DropForeignKey(
                name: "FK_Staff_AspNetUsers_UserId",
                table: "Staff");

            migrationBuilder.DropTable(
                name: "CustomDishIngredient");

            migrationBuilder.DropTable(
                name: "DishIngredient");

            migrationBuilder.DropTable(
                name: "ImportBillDetail");

            migrationBuilder.DropTable(
                name: "OrderDetail");

            migrationBuilder.DropTable(
                name: "OrderDiscount");

            migrationBuilder.DropTable(
                name: "OrderStaff");

            migrationBuilder.DropTable(
                name: "OrderTable");

            migrationBuilder.DropTable(
                name: "Shift");

            migrationBuilder.DropTable(
                name: "CustomDishes");

            migrationBuilder.DropTable(
                name: "ImportBill");

            migrationBuilder.DropTable(
                name: "DishSize");

            migrationBuilder.DropTable(
                name: "Discount");

            migrationBuilder.DropTable(
                name: "Table");

            migrationBuilder.DropTable(
                name: "Dishes");

            migrationBuilder.DropTable(
                name: "Price");

            migrationBuilder.DropTable(
                name: "Category");

            migrationBuilder.DropPrimaryKey(
                name: "PK__Staff__96D4AB17C0B5976D",
                table: "Staff");

            migrationBuilder.DropPrimaryKey(
                name: "PK__Supplier__4BE666B4859ACF1F",
                table: "Supplier");

            migrationBuilder.DropPrimaryKey(
                name: "PK__Order__C3905BCFBEB86ACF",
                table: "Order");

            migrationBuilder.DropPrimaryKey(
                name: "PK__Ingredie__BEAEB25A7557D19F",
                table: "Ingredient");

            migrationBuilder.DropPrimaryKey(
                name: "PK__Customer__A4AE64D83AEFDF51",
                table: "Customer");

            migrationBuilder.DropIndex(
                name: "IX_Customer_UserId",
                table: "Customer");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Supplier");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "DiscountPrice",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "OrderDate",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "OrderStatus",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "TotalPrice",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Ingredient");

            migrationBuilder.DropColumn(
                name: "CurrentStock",
                table: "Ingredient");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Ingredient");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Customer");

            migrationBuilder.DropColumn(
                name: "Dob",
                table: "Customer");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Customer");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Customer");

            migrationBuilder.RenameTable(
                name: "Supplier",
                newName: "Suppliers");

            migrationBuilder.RenameTable(
                name: "Order",
                newName: "Orders");

            migrationBuilder.RenameTable(
                name: "Ingredient",
                newName: "Ingredients");

            migrationBuilder.RenameTable(
                name: "Customer",
                newName: "Customers");

            migrationBuilder.RenameColumn(
                name: "Fullname",
                table: "Staff",
                newName: "FullName");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "Staff",
                newName: "Phone");

            migrationBuilder.RenameColumn(
                name: "Dob",
                table: "Staff",
                newName: "HireDate");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "Suppliers",
                newName: "Phone");

            migrationBuilder.RenameColumn(
                name: "ShiftId",
                table: "Orders",
                newName: "TableId");

            migrationBuilder.RenameIndex(
                name: "IX_Order_ShiftId",
                table: "Orders",
                newName: "IX_Orders_TableId");

            migrationBuilder.RenameIndex(
                name: "IX_Order_CustomerId",
                table: "Orders",
                newName: "IX_Orders_CustomerId");

            migrationBuilder.RenameColumn(
                name: "Fullname",
                table: "Customers",
                newName: "FullName");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "Customers",
                newName: "Phone");

            migrationBuilder.AlterColumn<string>(
                name: "StaffCode",
                table: "Staff",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "Staff",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Staff",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()",
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "StaffId",
                table: "Staff",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Staff",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Staff",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkingStatus",
                table: "Staff",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "ACTIVE");

            migrationBuilder.AlterColumn<string>(
                name: "SupplierName",
                table: "Suppliers",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "Suppliers",
                type: "bit",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Suppliers",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Orders",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "OPEN",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "OrderCode",
                table: "Orders",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(15)",
                oldMaxLength: 15,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Note",
                table: "Orders",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "CustomerId",
                table: "Orders",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<long>(
                name: "OrderId",
                table: "Orders",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<DateTime>(
                name: "ClosedAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "CreatedByStaffId",
                table: "Orders",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<DateTime>(
                name: "OpenedAt",
                table: "Orders",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AddColumn<string>(
                name: "OrderType",
                table: "Orders",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "DINE_IN");

            migrationBuilder.AddColumn<long>(
                name: "ReservationId",
                table: "Orders",
                type: "bigint",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Unit",
                table: "Ingredients",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "Ingredients",
                type: "bit",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "IngredientName",
                table: "Ingredients",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<long>(
                name: "IngredientId",
                table: "Ingredients",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "Customers",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "Customers",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Customers",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()",
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "CustomerId",
                table: "Customers",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Customers",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalPoints",
                table: "Customers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Staff",
                table: "Staff",
                column: "StaffId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Suppliers",
                table: "Suppliers",
                column: "SupplierId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                table: "Orders",
                column: "OrderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Ingredients",
                table: "Ingredients",
                column: "IngredientId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Customers",
                table: "Customers",
                column: "CustomerId");

            migrationBuilder.CreateTable(
                name: "CustomerPointsLedger",
                columns: table => new
                {
                    LedgerId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<long>(type: "bigint", nullable: false),
                    RefType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    RefId = table.Column<long>(type: "bigint", nullable: true),
                    PointsChange = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedByStaffId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerPointsLedger", x => x.LedgerId);
                    table.ForeignKey(
                        name: "FK_CPL_Customers",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CPL_Staff",
                        column: x => x.CreatedByStaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DiningTables",
                columns: table => new
                {
                    TableId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TableCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "AVAILABLE"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiningTables", x => x.TableId);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    InvoiceId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InvoiceCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    OrderId = table.Column<long>(type: "bigint", nullable: false),
                    CustomerId = table.Column<long>(type: "bigint", nullable: true),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    VatRate = table.Column<decimal>(type: "decimal(5,2)", nullable: false, defaultValue: 8.00m),
                    VatAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    PaymentStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "UNPAID"),
                    IssuedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    IssuedByStaffId = table.Column<long>(type: "bigint", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.InvoiceId);
                    table.ForeignKey(
                        name: "FK_Invoices_Customers",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Invoices_Orders",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Invoices_Staff",
                        column: x => x.IssuedByStaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyTiers",
                columns: table => new
                {
                    TierId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TierName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MinPoints = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    DiscountRate = table.Column<decimal>(type: "decimal(5,2)", nullable: false, defaultValue: 0m),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyTiers", x => x.TierId);
                });

            migrationBuilder.CreateTable(
                name: "MenuCategories",
                columns: table => new
                {
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuCategories", x => x.CategoryId);
                });

            migrationBuilder.CreateTable(
                name: "OrderStatusHistory",
                columns: table => new
                {
                    HistoryId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<long>(type: "bigint", nullable: false),
                    OldStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    NewStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    ChangedByStaffId = table.Column<long>(type: "bigint", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatusHistory", x => x.HistoryId);
                    table.ForeignKey(
                        name: "FK_OSH_Orders",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OSH_Staff",
                        column: x => x.ChangedByStaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseReceipts",
                columns: table => new
                {
                    ReceiptId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReceiptCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    SupplierId = table.Column<int>(type: "int", nullable: true),
                    ReceiptDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "RECEIVED"),
                    CreatedByStaffId = table.Column<long>(type: "bigint", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseReceipts", x => x.ReceiptId);
                    table.ForeignKey(
                        name: "FK_PR_Staff",
                        column: x => x.CreatedByStaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PR_Suppliers",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "SupplierId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "StockMovements",
                columns: table => new
                {
                    MovementId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IngredientId = table.Column<long>(type: "bigint", nullable: false),
                    MovementType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    RefType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    RefId = table.Column<long>(type: "bigint", nullable: true),
                    MovedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedByStaffId = table.Column<long>(type: "bigint", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockMovements", x => x.MovementId);
                    table.ForeignKey(
                        name: "FK_SM_Ingredients",
                        column: x => x.IngredientId,
                        principalTable: "Ingredients",
                        principalColumn: "IngredientId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SM_Staff",
                        column: x => x.CreatedByStaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Reservations",
                columns: table => new
                {
                    ReservationId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<long>(type: "bigint", nullable: true),
                    TableId = table.Column<int>(type: "int", nullable: true),
                    CustomerName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    CustomerPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PartySize = table.Column<int>(type: "int", nullable: false),
                    ReservedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false, defaultValue: 90),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PENDING"),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedByStaffId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reservations", x => x.ReservationId);
                    table.ForeignKey(
                        name: "FK_Reservations_Customers",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Reservations_Staff",
                        column: x => x.CreatedByStaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Reservations_Tables",
                        column: x => x.TableId,
                        principalTable: "DiningTables",
                        principalColumn: "TableId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    PaymentId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InvoiceId = table.Column<long>(type: "bigint", nullable: false),
                    Method = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    ReferenceNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ReceivedByStaffId = table.Column<long>(type: "bigint", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.PaymentId);
                    table.ForeignKey(
                        name: "FK_Payments_Invoices",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "InvoiceId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payments_Staff",
                        column: x => x.ReceivedByStaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "MenuItems",
                columns: table => new
                {
                    ItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    ItemName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    BasePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItems", x => x.ItemId);
                    table.ForeignKey(
                        name: "FK_MenuItems_Categories",
                        column: x => x.CategoryId,
                        principalTable: "MenuCategories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseReceiptItems",
                columns: table => new
                {
                    ReceiptItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReceiptId = table.Column<long>(type: "bigint", nullable: false),
                    IngredientId = table.Column<long>(type: "bigint", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    UnitCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LineTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "([UnitCost] * [Quantity])", stored: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseReceiptItems", x => x.ReceiptItemId);
                    table.ForeignKey(
                        name: "FK_PRI_Ingredients",
                        column: x => x.IngredientId,
                        principalTable: "Ingredients",
                        principalColumn: "IngredientId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PRI_Receipts",
                        column: x => x.ReceiptId,
                        principalTable: "PurchaseReceipts",
                        principalColumn: "ReceiptId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InvoiceLines",
                columns: table => new
                {
                    InvoiceLineId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InvoiceId = table.Column<long>(type: "bigint", nullable: false),
                    ItemId = table.Column<long>(type: "bigint", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    LineTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "(([UnitPrice] * [Quantity]) - [DiscountAmount])", stored: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoiceLines", x => x.InvoiceLineId);
                    table.ForeignKey(
                        name: "FK_InvoiceLines_Invoices",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "InvoiceId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InvoiceLines_Items",
                        column: x => x.ItemId,
                        principalTable: "MenuItems",
                        principalColumn: "ItemId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "MenuItemPrices",
                columns: table => new
                {
                    PriceId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemId = table.Column<long>(type: "bigint", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItemPrices", x => x.PriceId);
                    table.ForeignKey(
                        name: "FK_MenuItemPrices_Items",
                        column: x => x.ItemId,
                        principalTable: "MenuItems",
                        principalColumn: "ItemId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderItems",
                columns: table => new
                {
                    OrderItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<long>(type: "bigint", nullable: false),
                    ItemId = table.Column<long>(type: "bigint", nullable: false),
                    ItemNameSnapshot = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    LineTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "(([UnitPrice] * [Quantity]) - [DiscountAmount])", stored: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PENDING"),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderItems", x => x.OrderItemId);
                    table.ForeignKey(
                        name: "FK_OrderItems_MenuItems",
                        column: x => x.ItemId,
                        principalTable: "MenuItems",
                        principalColumn: "ItemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderItems_Orders",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Staff_StaffCode",
                table: "Staff",
                column: "StaffCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CreatedByStaffId",
                table: "Orders",
                column: "CreatedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderCode",
                table: "Orders",
                column: "OrderCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ReservationId",
                table: "Orders",
                column: "ReservationId",
                unique: true,
                filter: "[ReservationId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Phone",
                table: "Customers",
                column: "Phone",
                unique: true,
                filter: "[Phone] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_UserId",
                table: "Customers",
                column: "UserId",
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPointsLedger_CreatedByStaffId",
                table: "CustomerPointsLedger",
                column: "CreatedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPointsLedger_CustomerId",
                table: "CustomerPointsLedger",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_DiningTables_TableCode",
                table: "DiningTables",
                column: "TableCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceLines_InvoiceId",
                table: "InvoiceLines",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceLines_ItemId",
                table: "InvoiceLines",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CustomerId",
                table: "Invoices",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_InvoiceCode",
                table: "Invoices",
                column: "InvoiceCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_IssuedByStaffId",
                table: "Invoices",
                column: "IssuedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_OrderId",
                table: "Invoices",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemPrices_ItemId",
                table: "MenuItemPrices",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_CategoryId",
                table: "MenuItems",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ItemId",
                table: "OrderItems",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistory_ChangedByStaffId",
                table: "OrderStatusHistory",
                column: "ChangedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistory_OrderId",
                table: "OrderStatusHistory",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_InvoiceId",
                table: "Payments",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ReceivedByStaffId",
                table: "Payments",
                column: "ReceivedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseReceiptItems_IngredientId",
                table: "PurchaseReceiptItems",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseReceiptItems_ReceiptId",
                table: "PurchaseReceiptItems",
                column: "ReceiptId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseReceipts_CreatedByStaffId",
                table: "PurchaseReceipts",
                column: "CreatedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseReceipts_ReceiptCode",
                table: "PurchaseReceipts",
                column: "ReceiptCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseReceipts_SupplierId",
                table: "PurchaseReceipts",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_CreatedByStaffId",
                table: "Reservations",
                column: "CreatedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_CustomerId",
                table: "Reservations",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_TableId",
                table: "Reservations",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_CreatedByStaffId",
                table: "StockMovements",
                column: "CreatedByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_IngredientId",
                table: "StockMovements",
                column: "IngredientId");

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_AspNetUsers",
                table: "Customers",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Customers",
                table: "Orders",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "CustomerId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Reservations",
                table: "Orders",
                column: "ReservationId",
                principalTable: "Reservations",
                principalColumn: "ReservationId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Staff",
                table: "Orders",
                column: "CreatedByStaffId",
                principalTable: "Staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Tables",
                table: "Orders",
                column: "TableId",
                principalTable: "DiningTables",
                principalColumn: "TableId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Staff_AspNetUsers",
                table: "Staff",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Customers_AspNetUsers",
                table: "Customers");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Customers",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Reservations",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Staff",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Tables",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Staff_AspNetUsers",
                table: "Staff");

            migrationBuilder.DropTable(
                name: "CustomerPointsLedger");

            migrationBuilder.DropTable(
                name: "InvoiceLines");

            migrationBuilder.DropTable(
                name: "LoyaltyTiers");

            migrationBuilder.DropTable(
                name: "MenuItemPrices");

            migrationBuilder.DropTable(
                name: "OrderItems");

            migrationBuilder.DropTable(
                name: "OrderStatusHistory");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "PurchaseReceiptItems");

            migrationBuilder.DropTable(
                name: "Reservations");

            migrationBuilder.DropTable(
                name: "StockMovements");

            migrationBuilder.DropTable(
                name: "MenuItems");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "PurchaseReceipts");

            migrationBuilder.DropTable(
                name: "DiningTables");

            migrationBuilder.DropTable(
                name: "MenuCategories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Staff",
                table: "Staff");

            migrationBuilder.DropIndex(
                name: "IX_Staff_StaffCode",
                table: "Staff");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Suppliers",
                table: "Suppliers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Orders",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_CreatedByStaffId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_OrderCode",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_ReservationId",
                table: "Orders");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Ingredients",
                table: "Ingredients");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Customers",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_Phone",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_UserId",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "WorkingStatus",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "ClosedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CreatedByStaffId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OpenedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OrderType",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ReservationId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "TotalPoints",
                table: "Customers");

            migrationBuilder.RenameTable(
                name: "Suppliers",
                newName: "Supplier");

            migrationBuilder.RenameTable(
                name: "Orders",
                newName: "Order");

            migrationBuilder.RenameTable(
                name: "Ingredients",
                newName: "Ingredient");

            migrationBuilder.RenameTable(
                name: "Customers",
                newName: "Customer");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "Staff",
                newName: "Fullname");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "Staff",
                newName: "PhoneNumber");

            migrationBuilder.RenameColumn(
                name: "HireDate",
                table: "Staff",
                newName: "Dob");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "Supplier",
                newName: "PhoneNumber");

            migrationBuilder.RenameColumn(
                name: "TableId",
                table: "Order",
                newName: "ShiftId");

            migrationBuilder.RenameIndex(
                name: "IX_Orders_TableId",
                table: "Order",
                newName: "IX_Order_ShiftId");

            migrationBuilder.RenameIndex(
                name: "IX_Orders_CustomerId",
                table: "Order",
                newName: "IX_Order_CustomerId");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "Customer",
                newName: "Fullname");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "Customer",
                newName: "PhoneNumber");

            migrationBuilder.AlterColumn<string>(
                name: "StaffCode",
                table: "Staff",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);

            migrationBuilder.AlterColumn<string>(
                name: "Fullname",
                table: "Staff",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Staff",
                type: "datetime",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AlterColumn<int>(
                name: "StaffId",
                table: "Staff",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<bool>(
                name: "Gender",
                table: "Staff",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Staff",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "SupplierName",
                table: "Supplier",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "Supplier",
                type: "bit",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Supplier",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150,
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Supplier",
                type: "datetime",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Order",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "OPEN");

            migrationBuilder.AlterColumn<string>(
                name: "OrderCode",
                table: "Order",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);

            migrationBuilder.AlterColumn<string>(
                name: "Note",
                table: "Order",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "CustomerId",
                table: "Order",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "Order",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Order",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountPrice",
                table: "Order",
                type: "decimal(12,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OrderDate",
                table: "Order",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderStatus",
                table: "Order",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                table: "Order",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Order",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "Order",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalPrice",
                table: "Order",
                type: "decimal(12,2)",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Unit",
                table: "Ingredient",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "Ingredient",
                type: "bit",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "IngredientName",
                table: "Ingredient",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<int>(
                name: "IngredientId",
                table: "Ingredient",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Ingredient",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CurrentStock",
                table: "Ingredient",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Ingredient",
                type: "datetime",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "Customer",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldMaxLength: 450,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Fullname",
                table: "Customer",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Customer",
                type: "datetime",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AlterColumn<int>(
                name: "CustomerId",
                table: "Customer",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Customer",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Dob",
                table: "Customer",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Gender",
                table: "Customer",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Customer",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddPrimaryKey(
                name: "PK__Staff__96D4AB17C0B5976D",
                table: "Staff",
                column: "StaffId");

            migrationBuilder.AddPrimaryKey(
                name: "PK__Supplier__4BE666B4859ACF1F",
                table: "Supplier",
                column: "SupplierId");

            migrationBuilder.AddPrimaryKey(
                name: "PK__Order__C3905BCFBEB86ACF",
                table: "Order",
                column: "OrderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK__Ingredie__BEAEB25A7557D19F",
                table: "Ingredient",
                column: "IngredientId");

            migrationBuilder.AddPrimaryKey(
                name: "PK__Customer__A4AE64D83AEFDF51",
                table: "Customer",
                column: "CustomerId");

            migrationBuilder.CreateTable(
                name: "Category",
                columns: table => new
                {
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Category__19093A0BCC4099F6", x => x.CategoryId);
                });

            migrationBuilder.CreateTable(
                name: "CustomDishes",
                columns: table => new
                {
                    CustomDishId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DishName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__CustomDi__0983331F2E548FBB", x => x.CustomDishId);
                    table.ForeignKey(
                        name: "FK_CustomDishes_Order",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "OrderId");
                });

            migrationBuilder.CreateTable(
                name: "Discount",
                columns: table => new
                {
                    DiscountId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    DiscountAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    DiscountName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    StartTime = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Discount__E43F6D968FA501D9", x => x.DiscountId);
                });

            migrationBuilder.CreateTable(
                name: "ImportBill",
                columns: table => new
                {
                    ImportBillId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreateStaffId = table.Column<int>(type: "int", nullable: true),
                    SupplierId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    ImportDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(12,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ImportBi__03D1F91021EDD24A", x => x.ImportBillId);
                    table.ForeignKey(
                        name: "FK_ImportBill_Staff",
                        column: x => x.CreateStaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId");
                    table.ForeignKey(
                        name: "FK_ImportBill_Supplier",
                        column: x => x.SupplierId,
                        principalTable: "Supplier",
                        principalColumn: "SupplierId");
                });

            migrationBuilder.CreateTable(
                name: "OrderStaff",
                columns: table => new
                {
                    OrderStaffId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__OrderSta__1E54AA57009598D1", x => x.OrderStaffId);
                    table.ForeignKey(
                        name: "FK_OrderStaff_Order",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "OrderId");
                    table.ForeignKey(
                        name: "FK_OrderStaff_Staff",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId");
                });

            migrationBuilder.CreateTable(
                name: "Price",
                columns: table => new
                {
                    PriceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EndDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    PriceValue = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Price__49575BAFBF1E71D8", x => x.PriceId);
                });

            migrationBuilder.CreateTable(
                name: "Shift",
                columns: table => new
                {
                    ShiftId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    EndTime = table.Column<DateTime>(type: "datetime", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ShiftName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Shift__C0A838812DF4ED16", x => x.ShiftId);
                });

            migrationBuilder.CreateTable(
                name: "Table",
                columns: table => new
                {
                    TableId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Capacity = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Position = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    TableName = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TableType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Table__7D5F01EE8C9F873C", x => x.TableId);
                });

            migrationBuilder.CreateTable(
                name: "Dishes",
                columns: table => new
                {
                    DishId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DishName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Image = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Dishes__18834F509F4100E2", x => x.DishId);
                    table.ForeignKey(
                        name: "FK_Dishes_Category",
                        column: x => x.CategoryId,
                        principalTable: "Category",
                        principalColumn: "CategoryId");
                });

            migrationBuilder.CreateTable(
                name: "CustomDishIngredient",
                columns: table => new
                {
                    CustomDishIngredientId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomDishId = table.Column<int>(type: "int", nullable: false),
                    IngredientId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__CustomDi__766C71F4DB64C062", x => x.CustomDishIngredientId);
                    table.ForeignKey(
                        name: "FK_CustomDishIngredient_CustomDishes",
                        column: x => x.CustomDishId,
                        principalTable: "CustomDishes",
                        principalColumn: "CustomDishId");
                    table.ForeignKey(
                        name: "FK_CustomDishIngredient_Ingredient",
                        column: x => x.IngredientId,
                        principalTable: "Ingredient",
                        principalColumn: "IngredientId");
                });

            migrationBuilder.CreateTable(
                name: "OrderDiscount",
                columns: table => new
                {
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    DiscountId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderDiscount", x => new { x.OrderId, x.DiscountId });
                    table.ForeignKey(
                        name: "FK_OrderDiscount_Discount",
                        column: x => x.DiscountId,
                        principalTable: "Discount",
                        principalColumn: "DiscountId");
                    table.ForeignKey(
                        name: "FK_OrderDiscount_Order",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "OrderId");
                });

            migrationBuilder.CreateTable(
                name: "ImportBillDetail",
                columns: table => new
                {
                    ImportBillDetailId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ImportBillId = table.Column<int>(type: "int", nullable: false),
                    IngredientId = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    QuantityImport = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    StockQuantity = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    UnitPrice = table.Column<decimal>(type: "decimal(12,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ImportBi__6BE0A8EEE793E94F", x => x.ImportBillDetailId);
                    table.ForeignKey(
                        name: "FK_ImportBillDetail_ImportBill",
                        column: x => x.ImportBillId,
                        principalTable: "ImportBill",
                        principalColumn: "ImportBillId");
                    table.ForeignKey(
                        name: "FK_ImportBillDetail_Ingredient",
                        column: x => x.IngredientId,
                        principalTable: "Ingredient",
                        principalColumn: "IngredientId");
                });

            migrationBuilder.CreateTable(
                name: "OrderTable",
                columns: table => new
                {
                    TableId = table.Column<int>(type: "int", nullable: false),
                    OrderId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderTable", x => new { x.TableId, x.OrderId });
                    table.ForeignKey(
                        name: "FK_OrderTable_Order",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "OrderId");
                    table.ForeignKey(
                        name: "FK_OrderTable_Table",
                        column: x => x.TableId,
                        principalTable: "Table",
                        principalColumn: "TableId");
                });

            migrationBuilder.CreateTable(
                name: "DishIngredient",
                columns: table => new
                {
                    DishIngredientId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DishId = table.Column<int>(type: "int", nullable: false),
                    IngredientId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DishIngr__DBEF30235550CBB8", x => x.DishIngredientId);
                    table.ForeignKey(
                        name: "FK_DishIngredient_Dishes",
                        column: x => x.DishId,
                        principalTable: "Dishes",
                        principalColumn: "DishId");
                    table.ForeignKey(
                        name: "FK_DishIngredient_Ingredient",
                        column: x => x.IngredientId,
                        principalTable: "Ingredient",
                        principalColumn: "IngredientId");
                });

            migrationBuilder.CreateTable(
                name: "DishSize",
                columns: table => new
                {
                    DishSizeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DishId = table.Column<int>(type: "int", nullable: false),
                    PriceId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    DishSizeName = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DishSize__08A9777A3F3B4F9B", x => x.DishSizeId);
                    table.ForeignKey(
                        name: "FK_DishSize_Dishes",
                        column: x => x.DishId,
                        principalTable: "Dishes",
                        principalColumn: "DishId");
                    table.ForeignKey(
                        name: "FK_DishSize_Price",
                        column: x => x.PriceId,
                        principalTable: "Price",
                        principalColumn: "PriceId");
                });

            migrationBuilder.CreateTable(
                name: "OrderDetail",
                columns: table => new
                {
                    OrderDetailId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DishSizeId = table.Column<int>(type: "int", nullable: false),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    UnitPrice = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__OrderDet__D3B9D36CE1FF7020", x => x.OrderDetailId);
                    table.ForeignKey(
                        name: "FK_OrderDetail_DishSize",
                        column: x => x.DishSizeId,
                        principalTable: "DishSize",
                        principalColumn: "DishSizeId");
                    table.ForeignKey(
                        name: "FK_OrderDetail_Order",
                        column: x => x.OrderId,
                        principalTable: "Order",
                        principalColumn: "OrderId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Customer_UserId",
                table: "Customer",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomDishes_OrderId",
                table: "CustomDishes",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomDishIngredient_CustomDishId",
                table: "CustomDishIngredient",
                column: "CustomDishId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomDishIngredient_IngredientId",
                table: "CustomDishIngredient",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_Dishes_CategoryId",
                table: "Dishes",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_DishIngredient_DishId",
                table: "DishIngredient",
                column: "DishId");

            migrationBuilder.CreateIndex(
                name: "IX_DishIngredient_IngredientId",
                table: "DishIngredient",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_DishSize_DishId",
                table: "DishSize",
                column: "DishId");

            migrationBuilder.CreateIndex(
                name: "IX_DishSize_PriceId",
                table: "DishSize",
                column: "PriceId");

            migrationBuilder.CreateIndex(
                name: "IX_ImportBill_CreateStaffId",
                table: "ImportBill",
                column: "CreateStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_ImportBill_SupplierId",
                table: "ImportBill",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_ImportBillDetail_ImportBillId",
                table: "ImportBillDetail",
                column: "ImportBillId");

            migrationBuilder.CreateIndex(
                name: "IX_ImportBillDetail_IngredientId",
                table: "ImportBillDetail",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderDetail_DishSizeId",
                table: "OrderDetail",
                column: "DishSizeId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderDetail_OrderId",
                table: "OrderDetail",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderDiscount_DiscountId",
                table: "OrderDiscount",
                column: "DiscountId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStaff_OrderId",
                table: "OrderStaff",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStaff_StaffId",
                table: "OrderStaff",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderTable_OrderId",
                table: "OrderTable",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Customer_AspNetUsers_UserId",
                table: "Customer",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Order_Customer",
                table: "Order",
                column: "CustomerId",
                principalTable: "Customer",
                principalColumn: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Order_Shift",
                table: "Order",
                column: "ShiftId",
                principalTable: "Shift",
                principalColumn: "ShiftId");

            migrationBuilder.AddForeignKey(
                name: "FK_Staff_AspNetUsers_UserId",
                table: "Staff",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
