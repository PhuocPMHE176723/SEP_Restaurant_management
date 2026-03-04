
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SEP_Restaurant_management.Core.Models;

#nullable disable

namespace rmn_be.Core.Migrations
{
    [DbContext(typeof(SepDatabaseContext))]
    partial class SepDatabaseContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.24")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityRole", b =>
                {
                    b.Property<string>("Id")
                        .HasColumnType("nvarchar(450)");

                    b.Property<string>("ConcurrencyStamp")
                        .IsConcurrencyToken()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Name")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<string>("NormalizedName")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.HasKey("Id");

                    b.HasIndex("NormalizedName")
                        .IsUnique()
                        .HasDatabaseName("RoleNameIndex")
                        .HasFilter("[NormalizedName] IS NOT NULL");

                    b.ToTable("AspNetRoles", (string)null);
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityRoleClaim<string>", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<string>("ClaimType")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("ClaimValue")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("RoleId")
                        .IsRequired()
                        .HasColumnType("nvarchar(450)");

                    b.HasKey("Id");

                    b.HasIndex("RoleId");

                    b.ToTable("AspNetRoleClaims", (string)null);
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserClaim<string>", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<string>("ClaimType")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("ClaimValue")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("UserId")
                        .IsRequired()
                        .HasColumnType("nvarchar(450)");

                    b.HasKey("Id");

                    b.HasIndex("UserId");

                    b.ToTable("AspNetUserClaims", (string)null);
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserLogin<string>", b =>
                {
                    b.Property<string>("LoginProvider")
                        .HasColumnType("nvarchar(450)");

                    b.Property<string>("ProviderKey")
                        .HasColumnType("nvarchar(450)");

                    b.Property<string>("ProviderDisplayName")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("UserId")
                        .IsRequired()
                        .HasColumnType("nvarchar(450)");

                    b.HasKey("LoginProvider", "ProviderKey");

                    b.HasIndex("UserId");

                    b.ToTable("AspNetUserLogins", (string)null);
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserRole<string>", b =>
                {
                    b.Property<string>("UserId")
                        .HasColumnType("nvarchar(450)");

                    b.Property<string>("RoleId")
                        .HasColumnType("nvarchar(450)");

                    b.HasKey("UserId", "RoleId");

                    b.HasIndex("RoleId");

                    b.ToTable("AspNetUserRoles", (string)null);
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserToken<string>", b =>
                {
                    b.Property<string>("UserId")
                        .HasColumnType("nvarchar(450)");

                    b.Property<string>("LoginProvider")
                        .HasColumnType("nvarchar(450)");

                    b.Property<string>("Name")
                        .HasColumnType("nvarchar(450)");

                    b.Property<string>("Value")
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("UserId", "LoginProvider", "Name");

                    b.ToTable("AspNetUserTokens", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Customer", b =>
                {
                    b.Property<long>("CustomerId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("CustomerId"));

                    b.Property<DateTime>("CreatedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<string>("Email")
                        .HasMaxLength(150)
                        .HasColumnType("nvarchar(150)");

                    b.Property<string>("FullName")
                        .HasMaxLength(150)
                        .HasColumnType("nvarchar(150)");

                    b.Property<string>("Phone")
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)");

                    b.Property<int>("TotalPoints")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasDefaultValue(0);

                    b.Property<string>("UserId")
                        .HasMaxLength(450)
                        .HasColumnType("nvarchar(450)");

                    b.HasKey("CustomerId");

                    b.HasIndex("UserId")
                        .IsUnique()
                        .HasFilter("[UserId] IS NOT NULL");

                    b.ToTable("Customers", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.CustomerPointsLedger", b =>
                {
                    b.Property<long>("LedgerId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("LedgerId"));

                    b.Property<DateTime>("CreatedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<long?>("CreatedByStaffId")
                        .HasColumnType("bigint");

                    b.Property<long>("CustomerId")
                        .HasColumnType("bigint");

                    b.Property<string>("Note")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<int>("PointsChange")
                        .HasColumnType("int");

                    b.Property<long?>("RefId")
                        .HasColumnType("bigint");

                    b.Property<string>("RefType")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("nvarchar(30)");

                    b.HasKey("LedgerId");

                    b.HasIndex("CreatedByStaffId");

                    b.HasIndex("CustomerId");

                    b.ToTable("CustomerPointsLedger", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.DiningTable", b =>
                {
                    b.Property<int>("TableId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("TableId"));

                    b.Property<int>("Capacity")
                        .HasColumnType("int");

                    b.Property<bool>("IsActive")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bit")
                        .HasDefaultValue(true);

                    b.Property<string>("Status")
                        .IsRequired()
                        .ValueGeneratedOnAdd()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)")
                        .HasDefaultValue("AVAILABLE");

                    b.Property<string>("TableCode")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("nvarchar(30)");

                    b.HasKey("TableId");

                    b.HasIndex("TableCode")
                        .IsUnique();

                    b.ToTable("DiningTables", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Ingredient", b =>
                {
                    b.Property<long>("IngredientId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("IngredientId"));

                    b.Property<string>("IngredientName")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("nvarchar(150)");

                    b.Property<bool>("IsActive")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bit")
                        .HasDefaultValue(true);

                    b.Property<string>("Unit")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)");

                    b.HasKey("IngredientId");

                    b.ToTable("Ingredients", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Invoice", b =>
                {
                    b.Property<long>("InvoiceId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("InvoiceId"));

                    b.Property<long?>("CustomerId")
                        .HasColumnType("bigint");

                    b.Property<decimal>("DiscountAmount")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("decimal(18,2)")
                        .HasDefaultValue(0m);

                    b.Property<string>("InvoiceCode")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("nvarchar(30)");

                    b.Property<DateTime>("IssuedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<long>("IssuedByStaffId")
                        .HasColumnType("bigint");

                    b.Property<string>("Note")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<long>("OrderId")
                        .HasColumnType("bigint");

                    b.Property<decimal>("PaidAmount")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("decimal(18,2)")
                        .HasDefaultValue(0m);

                    b.Property<string>("PaymentStatus")
                        .IsRequired()
                        .ValueGeneratedOnAdd()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)")
                        .HasDefaultValue("UNPAID");

                    b.Property<decimal>("Subtotal")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("decimal(18,2)")
                        .HasDefaultValue(0m);

                    b.Property<decimal>("TotalAmount")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("decimal(18,2)")
                        .HasDefaultValue(0m);

                    b.Property<decimal>("VatAmount")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("decimal(18,2)")
                        .HasDefaultValue(0m);

                    b.Property<decimal>("VatRate")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("decimal(5,2)")
                        .HasDefaultValue(8.00m);

                    b.HasKey("InvoiceId");

                    b.HasIndex("CustomerId");

                    b.HasIndex("InvoiceCode")
                        .IsUnique();

                    b.HasIndex("IssuedByStaffId");

                    b.HasIndex("OrderId")
                        .IsUnique();

                    b.ToTable("Invoices", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.InvoiceLine", b =>
                {
                    b.Property<long>("InvoiceLineId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("InvoiceLineId"));

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("nvarchar(200)");

                    b.Property<decimal>("DiscountAmount")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("decimal(18,2)")
                        .HasDefaultValue(0m);

                    b.Property<long>("InvoiceId")
                        .HasColumnType("bigint");

                    b.Property<long?>("ItemId")
                        .HasColumnType("bigint");

                    b.Property<decimal>("LineTotal")
                        .ValueGeneratedOnAddOrUpdate()
                        .HasColumnType("decimal(18,2)")
                        .HasComputedColumnSql("(([UnitPrice] * [Quantity]) - [DiscountAmount])", true);

                    b.Property<int>("Quantity")
                        .HasColumnType("int");

                    b.Property<decimal>("UnitPrice")
                        .HasColumnType("decimal(18,2)");

                    b.HasKey("InvoiceLineId");

                    b.HasIndex("InvoiceId");

                    b.HasIndex("ItemId");

                    b.ToTable("InvoiceLines", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.LoyaltyTier", b =>
                {
                    b.Property<int>("TierId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("TierId"));

                    b.Property<decimal>("DiscountRate")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("decimal(5,2)")
                        .HasDefaultValue(0m);

                    b.Property<bool>("IsActive")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bit")
                        .HasDefaultValue(true);

                    b.Property<int>("MinPoints")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasDefaultValue(0);

                    b.Property<string>("TierName")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("nvarchar(50)");

                    b.HasKey("TierId");

                    b.ToTable("LoyaltyTiers", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.MenuCategory", b =>
                {
                    b.Property<int>("CategoryId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("CategoryId"));

                    b.Property<string>("CategoryName")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("nvarchar(100)");

                    b.Property<string>("Description")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<int>("DisplayOrder")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasDefaultValue(0);

                    b.Property<bool>("IsActive")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bit")
                        .HasDefaultValue(true);

                    b.HasKey("CategoryId");

                    b.ToTable("MenuCategories", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.MenuItem", b =>
                {
                    b.Property<long>("ItemId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("ItemId"));

                    b.Property<decimal>("BasePrice")
                        .HasColumnType("decimal(18,2)");

                    b.Property<int>("CategoryId")
                        .HasColumnType("int");

                    b.Property<DateTime>("CreatedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<string>("Description")
                        .HasMaxLength(500)
                        .HasColumnType("nvarchar(500)");

                    b.Property<bool>("IsActive")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bit")
                        .HasDefaultValue(true);

                    b.Property<string>("ItemName")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("nvarchar(150)");

                    b.HasKey("ItemId");

                    b.HasIndex("CategoryId");

                    b.ToTable("MenuItems", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.MenuItemPrice", b =>
                {
                    b.Property<long>("PriceId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("PriceId"));

                    b.Property<DateTime>("EffectiveFrom")
                        .HasColumnType("datetime2");

                    b.Property<DateTime?>("EffectiveTo")
                        .HasColumnType("datetime2");

                    b.Property<long>("ItemId")
                        .HasColumnType("bigint");

                    b.Property<decimal>("Price")
                        .HasColumnType("decimal(18,2)");

                    b.HasKey("PriceId");

                    b.HasIndex("ItemId");

                    b.ToTable("MenuItemPrices", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Order", b =>
                {
                    b.Property<long>("OrderId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("OrderId"));

                    b.Property<DateTime?>("ClosedAt")
                        .HasColumnType("datetime2");

                    b.Property<DateTime?>("CreatedAt")
                        .HasColumnType("datetime2");

                    b.Property<long?>("CreatedByStaffId")
                        .HasColumnType("bigint");

                    b.Property<long?>("CustomerId")
                        .HasColumnType("bigint");

                    b.Property<decimal?>("DiscountPrice")
                        .HasColumnType("decimal(18,2)");

                    b.Property<string>("Note")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<DateTime>("OpenedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<string>("OrderCode")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("nvarchar(30)");

                    b.Property<string>("OrderType")
                        .IsRequired()
                        .ValueGeneratedOnAdd()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)")
                        .HasDefaultValue("DINE_IN");

                    b.Property<long?>("ReservationId")
                        .HasColumnType("bigint");

                    b.Property<string>("Status")
                        .IsRequired()
                        .ValueGeneratedOnAdd()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)")
                        .HasDefaultValue("OPEN");

                    b.Property<int?>("TableId")
                        .HasColumnType("int");

                    b.HasKey("OrderId");

                    b.HasIndex("CreatedByStaffId");

                    b.HasIndex("CustomerId");

                    b.HasIndex("OrderCode")
                        .IsUnique();

                    b.HasIndex("ReservationId")
                        .IsUnique()
                        .HasFilter("[ReservationId] IS NOT NULL");

                    b.HasIndex("TableId");

                    b.ToTable("Orders", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.OrderItem", b =>
                {
                    b.Property<long>("OrderItemId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("OrderItemId"));

                    b.Property<DateTime>("CreatedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<decimal>("DiscountAmount")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("decimal(18,2)")
                        .HasDefaultValue(0m);

                    b.Property<long>("ItemId")
                        .HasColumnType("bigint");

                    b.Property<string>("ItemNameSnapshot")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("nvarchar(150)");

                    b.Property<decimal>("LineTotal")
                        .ValueGeneratedOnAddOrUpdate()
                        .HasColumnType("decimal(18,2)")
                        .HasComputedColumnSql("(([UnitPrice] * [Quantity]) - [DiscountAmount])", true);

                    b.Property<string>("Note")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<long>("OrderId")
                        .HasColumnType("bigint");

                    b.Property<int>("Quantity")
                        .HasColumnType("int");

                    b.Property<string>("Status")
                        .IsRequired()
                        .ValueGeneratedOnAdd()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)")
                        .HasDefaultValue("PENDING");

                    b.Property<decimal>("UnitPrice")
                        .HasColumnType("decimal(18,2)");

                    b.HasKey("OrderItemId");

                    b.HasIndex("ItemId");

                    b.HasIndex("OrderId");

                    b.ToTable("OrderItems", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.OrderStatusHistory", b =>
                {
                    b.Property<long>("HistoryId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("HistoryId"));

                    b.Property<DateTime>("ChangedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<long?>("ChangedByStaffId")
                        .HasColumnType("bigint");

                    b.Property<string>("NewStatus")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)");

                    b.Property<string>("Note")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<string>("OldStatus")
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)");

                    b.Property<long>("OrderId")
                        .HasColumnType("bigint");

                    b.HasKey("HistoryId");

                    b.HasIndex("ChangedByStaffId");

                    b.HasIndex("OrderId");

                    b.ToTable("OrderStatusHistory", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Payment", b =>
                {
                    b.Property<long>("PaymentId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("PaymentId"));

                    b.Property<decimal>("Amount")
                        .HasColumnType("decimal(18,2)");

                    b.Property<long>("InvoiceId")
                        .HasColumnType("bigint");

                    b.Property<string>("Method")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)");

                    b.Property<string>("Note")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<DateTime>("PaidAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<long?>("ReceivedByStaffId")
                        .HasColumnType("bigint");

                    b.Property<string>("ReferenceNo")
                        .HasMaxLength(100)
                        .HasColumnType("nvarchar(100)");

                    b.HasKey("PaymentId");

                    b.HasIndex("InvoiceId");

                    b.HasIndex("ReceivedByStaffId");

                    b.ToTable("Payments", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.PurchaseReceipt", b =>
                {
                    b.Property<long>("ReceiptId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("ReceiptId"));

                    b.Property<long>("CreatedByStaffId")
                        .HasColumnType("bigint");

                    b.Property<string>("Note")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<string>("ReceiptCode")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("nvarchar(30)");

                    b.Property<DateTime>("ReceiptDate")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<string>("Status")
                        .IsRequired()
                        .ValueGeneratedOnAdd()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)")
                        .HasDefaultValue("RECEIVED");

                    b.Property<int?>("SupplierId")
                        .HasColumnType("int");

                    b.Property<decimal>("TotalAmount")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("decimal(18,2)")
                        .HasDefaultValue(0m);

                    b.HasKey("ReceiptId");

                    b.HasIndex("CreatedByStaffId");

                    b.HasIndex("ReceiptCode")
                        .IsUnique();

                    b.HasIndex("SupplierId");

                    b.ToTable("PurchaseReceipts", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.PurchaseReceiptItem", b =>
                {
                    b.Property<long>("ReceiptItemId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("ReceiptItemId"));

                    b.Property<long>("IngredientId")
                        .HasColumnType("bigint");

                    b.Property<decimal>("LineTotal")
                        .ValueGeneratedOnAddOrUpdate()
                        .HasColumnType("decimal(18,2)")
                        .HasComputedColumnSql("([UnitCost] * [Quantity])", true);

                    b.Property<decimal>("Quantity")
                        .HasColumnType("decimal(18,3)");

                    b.Property<long>("ReceiptId")
                        .HasColumnType("bigint");

                    b.Property<decimal>("UnitCost")
                        .HasColumnType("decimal(18,2)");

                    b.HasKey("ReceiptItemId");

                    b.HasIndex("IngredientId");

                    b.HasIndex("ReceiptId");

                    b.ToTable("PurchaseReceiptItems", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Reservation", b =>
                {
                    b.Property<long>("ReservationId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("ReservationId"));

                    b.Property<DateTime>("CreatedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<long?>("CreatedByStaffId")
                        .HasColumnType("bigint");

                    b.Property<long?>("CustomerId")
                        .HasColumnType("bigint");

                    b.Property<string>("CustomerName")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("nvarchar(150)");

                    b.Property<string>("CustomerPhone")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)");

                    b.Property<int>("DurationMinutes")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasDefaultValue(90);

                    b.Property<string>("Note")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<int>("PartySize")
                        .HasColumnType("int");

                    b.Property<DateTime>("ReservedAt")
                        .HasColumnType("datetime2");

                    b.Property<string>("Status")
                        .IsRequired()
                        .ValueGeneratedOnAdd()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)")
                        .HasDefaultValue("PENDING");

                    b.Property<int?>("TableId")
                        .HasColumnType("int");

                    b.HasKey("ReservationId");

                    b.HasIndex("CreatedByStaffId");

                    b.HasIndex("CustomerId");

                    b.HasIndex("TableId");

                    b.ToTable("Reservations", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Staff", b =>
                {
                    b.Property<long>("StaffId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("StaffId"));

                    b.Property<DateTime>("CreatedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<string>("Email")
                        .HasMaxLength(150)
                        .HasColumnType("nvarchar(150)");

                    b.Property<string>("FullName")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("nvarchar(150)");

                    b.Property<DateOnly?>("HireDate")
                        .HasColumnType("date");

                    b.Property<string>("Phone")
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)");

                    b.Property<string>("Position")
                        .HasMaxLength(50)
                        .HasColumnType("nvarchar(50)");

                    b.Property<string>("StaffCode")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("nvarchar(30)");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("datetime2");

                    b.Property<string>("UserId")
                        .IsRequired()
                        .HasMaxLength(450)
                        .HasColumnType("nvarchar(450)");

                    b.Property<string>("WorkingStatus")
                        .IsRequired()
                        .ValueGeneratedOnAdd()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)")
                        .HasDefaultValue("ACTIVE");

                    b.HasKey("StaffId");

                    b.HasIndex("StaffCode")
                        .IsUnique();

                    b.HasIndex("UserId")
                        .IsUnique();

                    b.ToTable("Staff", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.StockMovement", b =>
                {
                    b.Property<long>("MovementId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<long>("MovementId"));

                    b.Property<long?>("CreatedByStaffId")
                        .HasColumnType("bigint");

                    b.Property<long>("IngredientId")
                        .HasColumnType("bigint");

                    b.Property<DateTime>("MovedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("SYSUTCDATETIME()");

                    b.Property<string>("MovementType")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)");

                    b.Property<string>("Note")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<decimal>("Quantity")
                        .HasColumnType("decimal(18,3)");

                    b.Property<long?>("RefId")
                        .HasColumnType("bigint");

                    b.Property<string>("RefType")
                        .HasMaxLength(30)
                        .HasColumnType("nvarchar(30)");

                    b.HasKey("MovementId");

                    b.HasIndex("CreatedByStaffId");

                    b.HasIndex("IngredientId");

                    b.ToTable("StockMovements", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Supplier", b =>
                {
                    b.Property<int>("SupplierId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("SupplierId"));

                    b.Property<string>("Address")
                        .HasMaxLength(255)
                        .HasColumnType("nvarchar(255)");

                    b.Property<string>("Email")
                        .HasMaxLength(150)
                        .HasColumnType("nvarchar(150)");

                    b.Property<bool>("IsActive")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bit")
                        .HasDefaultValue(true);

                    b.Property<string>("Phone")
                        .HasMaxLength(20)
                        .HasColumnType("nvarchar(20)");

                    b.Property<string>("SupplierName")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("nvarchar(150)");

                    b.HasKey("SupplierId");

                    b.ToTable("Suppliers", (string)null);
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.UserIdentity", b =>
                {
                    b.Property<string>("Id")
                        .HasColumnType("nvarchar(450)");

                    b.Property<int>("AccessFailedCount")
                        .HasColumnType("int");

                    b.Property<string>("ConcurrencyStamp")
                        .IsConcurrencyToken()
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Email")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<bool>("EmailConfirmed")
                        .HasColumnType("bit");

                    b.Property<string>("FullName")
                        .HasColumnType("nvarchar(max)");

                    b.Property<bool>("LockoutEnabled")
                        .HasColumnType("bit");

                    b.Property<DateTimeOffset?>("LockoutEnd")
                        .HasColumnType("datetimeoffset");

                    b.Property<string>("NormalizedEmail")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<string>("NormalizedUserName")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<string>("PasswordHash")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("PhoneNumber")
                        .HasColumnType("nvarchar(max)");

                    b.Property<bool>("PhoneNumberConfirmed")
                        .HasColumnType("bit");

                    b.Property<string>("SecurityStamp")
                        .HasColumnType("nvarchar(max)");

                    b.Property<bool>("TwoFactorEnabled")
                        .HasColumnType("bit");

                    b.Property<string>("UserName")
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.HasKey("Id");

                    b.HasIndex("NormalizedEmail")
                        .HasDatabaseName("EmailIndex");

                    b.HasIndex("NormalizedUserName")
                        .IsUnique()
                        .HasDatabaseName("UserNameIndex")
                        .HasFilter("[NormalizedUserName] IS NOT NULL");

                    b.ToTable("AspNetUsers", (string)null);
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityRoleClaim<string>", b =>
                {
                    b.HasOne("Microsoft.AspNetCore.Identity.IdentityRole", null)
                        .WithMany()
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserClaim<string>", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.UserIdentity", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserLogin<string>", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.UserIdentity", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserRole<string>", b =>
                {
                    b.HasOne("Microsoft.AspNetCore.Identity.IdentityRole", null)
                        .WithMany()
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("SEP_Restaurant_management.Core.Models.UserIdentity", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Microsoft.AspNetCore.Identity.IdentityUserToken<string>", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.UserIdentity", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Customer", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.UserIdentity", "User")
                        .WithOne()
                        .HasForeignKey("SEP_Restaurant_management.Core.Models.Customer", "UserId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_Customers_AspNetUsers");

                    b.Navigation("User");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.CustomerPointsLedger", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Staff", "CreatedByStaff")
                        .WithMany("CustomerPointsLedgers")
                        .HasForeignKey("CreatedByStaffId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_CPL_Staff");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Customer", "Customer")
                        .WithMany("PointsLedgers")
                        .HasForeignKey("CustomerId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_CPL_Customers");

                    b.Navigation("CreatedByStaff");

                    b.Navigation("Customer");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Invoice", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Customer", "Customer")
                        .WithMany("Invoices")
                        .HasForeignKey("CustomerId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_Invoices_Customers");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Staff", "IssuedByStaff")
                        .WithMany("Invoices")
                        .HasForeignKey("IssuedByStaffId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_Invoices_Staff");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Order", "Order")
                        .WithOne("Invoice")
                        .HasForeignKey("SEP_Restaurant_management.Core.Models.Invoice", "OrderId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_Invoices_Orders");

                    b.Navigation("Customer");

                    b.Navigation("IssuedByStaff");

                    b.Navigation("Order");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.InvoiceLine", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Invoice", "Invoice")
                        .WithMany("InvoiceLines")
                        .HasForeignKey("InvoiceId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_InvoiceLines_Invoices");

                    b.HasOne("SEP_Restaurant_management.Core.Models.MenuItem", "MenuItem")
                        .WithMany("InvoiceLines")
                        .HasForeignKey("ItemId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_InvoiceLines_Items");

                    b.Navigation("Invoice");

                    b.Navigation("MenuItem");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.MenuItem", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.MenuCategory", "Category")
                        .WithMany("MenuItems")
                        .HasForeignKey("CategoryId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_MenuItems_Categories");

                    b.Navigation("Category");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.MenuItemPrice", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.MenuItem", "MenuItem")
                        .WithMany("MenuItemPrices")
                        .HasForeignKey("ItemId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_MenuItemPrices_Items");

                    b.Navigation("MenuItem");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Order", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Staff", "CreatedByStaff")
                        .WithMany("Orders")
                        .HasForeignKey("CreatedByStaffId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_Orders_Staff");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Customer", "Customer")
                        .WithMany("Orders")
                        .HasForeignKey("CustomerId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_Orders_Customers");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Reservation", "Reservation")
                        .WithOne("Order")
                        .HasForeignKey("SEP_Restaurant_management.Core.Models.Order", "ReservationId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_Orders_Reservations");

                    b.HasOne("SEP_Restaurant_management.Core.Models.DiningTable", "Table")
                        .WithMany("Orders")
                        .HasForeignKey("TableId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_Orders_Tables");

                    b.Navigation("CreatedByStaff");

                    b.Navigation("Customer");

                    b.Navigation("Reservation");

                    b.Navigation("Table");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.OrderItem", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Staff", "CreatedByStaff")
                        .WithMany("Orders")
                        .HasForeignKey("CreatedByStaffId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("FK_Orders_Staff");
                    b.HasOne("SEP_Restaurant_management.Core.Models.MenuItem", "MenuItem")
                        .WithMany("OrderItems")
                        .HasForeignKey("ItemId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_OrderItems_MenuItems");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Order", "Order")
                        .WithMany("OrderItems")
                        .HasForeignKey("OrderId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_OrderItems_Orders");

                    b.Navigation("MenuItem");

                    b.Navigation("Order");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.OrderStatusHistory", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Staff", "ChangedByStaff")
                        .WithMany("OrderStatusHistories")
                        .HasForeignKey("ChangedByStaffId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_OSH_Staff");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Order", "Order")
                        .WithMany("StatusHistories")
                        .HasForeignKey("OrderId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_OSH_Orders");

                    b.Navigation("ChangedByStaff");

                    b.Navigation("Order");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Payment", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Invoice", "Invoice")
                        .WithMany("Payments")
                        .HasForeignKey("InvoiceId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_Payments_Invoices");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Staff", "ReceivedByStaff")
                        .WithMany("Payments")
                        .HasForeignKey("ReceivedByStaffId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_Payments_Staff");

                    b.Navigation("Invoice");

                    b.Navigation("ReceivedByStaff");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.PurchaseReceipt", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Staff", "CreatedByStaff")
                        .WithMany("PurchaseReceipts")
                        .HasForeignKey("CreatedByStaffId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_PR_Staff");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Supplier", "Supplier")
                        .WithMany("PurchaseReceipts")
                        .HasForeignKey("SupplierId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_PR_Suppliers");

                    b.Navigation("CreatedByStaff");

                    b.Navigation("Supplier");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.PurchaseReceiptItem", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Ingredient", "Ingredient")
                        .WithMany("PurchaseReceiptItems")
                        .HasForeignKey("IngredientId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_PRI_Ingredients");

                    b.HasOne("SEP_Restaurant_management.Core.Models.PurchaseReceipt", "Receipt")
                        .WithMany("Items")
                        .HasForeignKey("ReceiptId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_PRI_Receipts");

                    b.Navigation("Ingredient");

                    b.Navigation("Receipt");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Reservation", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Staff", "CreatedByStaff")
                        .WithMany("Reservations")
                        .HasForeignKey("CreatedByStaffId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_Reservations_Staff");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Customer", "Customer")
                        .WithMany("Reservations")
                        .HasForeignKey("CustomerId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_Reservations_Customers");

                    b.HasOne("SEP_Restaurant_management.Core.Models.DiningTable", "Table")
                        .WithMany("Reservations")
                        .HasForeignKey("TableId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_Reservations_Tables");

                    b.Navigation("CreatedByStaff");

                    b.Navigation("Customer");

                    b.Navigation("Table");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Staff", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.UserIdentity", "User")
                        .WithOne()
                        .HasForeignKey("SEP_Restaurant_management.Core.Models.Staff", "UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_Staff_AspNetUsers");

                    b.Navigation("User");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.StockMovement", b =>
                {
                    b.HasOne("SEP_Restaurant_management.Core.Models.Staff", "CreatedByStaff")
                        .WithMany("StockMovements")
                        .HasForeignKey("CreatedByStaffId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_SM_Staff");

                    b.HasOne("SEP_Restaurant_management.Core.Models.Ingredient", "Ingredient")
                        .WithMany("StockMovements")
                        .HasForeignKey("IngredientId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_SM_Ingredients");

                    b.Navigation("CreatedByStaff");

                    b.Navigation("Ingredient");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Customer", b =>
                {
                    b.Navigation("Invoices");

                    b.Navigation("Orders");

                    b.Navigation("PointsLedgers");

                    b.Navigation("Reservations");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.DiningTable", b =>
                {
                    b.Navigation("Orders");

                    b.Navigation("Reservations");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Ingredient", b =>
                {
                    b.Navigation("PurchaseReceiptItems");

                    b.Navigation("StockMovements");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Invoice", b =>
                {
                    b.Navigation("InvoiceLines");

                    b.Navigation("Payments");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.MenuCategory", b =>
                {
                    b.Navigation("MenuItems");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.MenuItem", b =>
                {
                    b.Navigation("InvoiceLines");

                    b.Navigation("MenuItemPrices");

                    b.Navigation("OrderItems");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Order", b =>
                {
                    b.Navigation("Invoice");

                    b.Navigation("OrderItems");

                    b.Navigation("StatusHistories");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.PurchaseReceipt", b =>
                {
                    b.Navigation("Items");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Reservation", b =>
                {
                    b.Navigation("Order");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Staff", b =>
                {
                    b.Navigation("CustomerPointsLedgers");

                    b.Navigation("Invoices");

                    b.Navigation("OrderStatusHistories");

                    b.Navigation("Orders");

                    b.Navigation("Payments");

                    b.Navigation("PurchaseReceipts");

                    b.Navigation("Reservations");

                    b.Navigation("StockMovements");
                });

            modelBuilder.Entity("SEP_Restaurant_management.Core.Models.Supplier", b =>
                {
                    b.Navigation("PurchaseReceipts");
                });
        }
    }
}
