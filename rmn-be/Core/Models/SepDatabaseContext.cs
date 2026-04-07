using System;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace SEP_Restaurant_management.Core.Models;

public partial class SepDatabaseContext : IdentityDbContext<UserIdentity>
{
    public SepDatabaseContext()
    {
    }

    public SepDatabaseContext(DbContextOptions<SepDatabaseContext> options)
        : base(options)
    {
    }

    // ── Staff ──────────────────────────────────────────────
    public virtual DbSet<Staff> Staffs { get; set; }

    // ── Dining layout ──────────────────────────────────────
    public virtual DbSet<DiningTable> DiningTables { get; set; }

    // ── Customer + Loyalty ─────────────────────────────────
    public virtual DbSet<Customer> Customers { get; set; }
    public virtual DbSet<LoyaltyTier> LoyaltyTiers { get; set; }
    public virtual DbSet<CustomerPointsLedger> CustomerPointsLedgers { get; set; }
    public virtual DbSet<DiscountCode> DiscountCodes { get; set; }
    public virtual DbSet<SystemConfig> SystemConfigs { get; set; }

    // ── Reservation ────────────────────────────────────────
    public virtual DbSet<Reservation> Reservations { get; set; }

    // ── Menu ───────────────────────────────────────────────
    public virtual DbSet<MenuCategory> MenuCategories { get; set; }
    public virtual DbSet<MenuItem> MenuItems { get; set; }
    public virtual DbSet<MenuItemPrice> MenuItemPrices { get; set; }
    public virtual DbSet<MenuItemIngredient> MenuItemIngredients { get; set; }

    // ── Orders ─────────────────────────────────────────────
    public virtual DbSet<Order> Orders { get; set; }
    public virtual DbSet<OrderItem> OrderItems { get; set; }
    public virtual DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }

    // ── Invoice + Payment ──────────────────────────────────
    public virtual DbSet<Invoice> Invoices { get; set; }
    public virtual DbSet<InvoiceLine> InvoiceLines { get; set; }
    public virtual DbSet<Payment> Payments { get; set; }

    // ── Inventory ──────────────────────────────────────────
    public virtual DbSet<Supplier> Suppliers { get; set; }
    public virtual DbSet<Ingredient> Ingredients { get; set; }
    public virtual DbSet<PurchaseReceipt> PurchaseReceipts { get; set; }
    public virtual DbSet<PurchaseReceiptItem> PurchaseReceiptItems { get; set; }
    public virtual DbSet<StockMovement> StockMovements { get; set; }
    public virtual DbSet<InventoryAudit> InventoryAudits { get; set; }
    public virtual DbSet<InventoryAuditItem> InventoryAuditItems { get; set; }
    public virtual DbSet<DailyIngredientAllocation> DailyIngredientAllocations { get; set; }

    // ── Content Management ─────────────────────────────────
    public virtual DbSet<BlogCategory> BlogCategories { get; set; }
    public virtual DbSet<BlogPost> BlogPosts { get; set; }
    public virtual DbSet<Slider> Sliders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Staff ──────────────────────────────────────────
        modelBuilder.Entity<Staff>(entity =>
        {
            entity.ToTable("Staff");
            entity.HasKey(e => e.StaffId);

            entity.Property(e => e.StaffId).UseIdentityColumn();
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.StaffCode).IsUnique();

            entity.Property(e => e.StaffCode).HasMaxLength(30).IsRequired();
            entity.Property(e => e.FullName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.Position).HasMaxLength(50);
            entity.Property(e => e.WorkingStatus).HasMaxLength(20).HasDefaultValue("ACTIVE");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime2");
        });

        // ── DiningTables ───────────────────────────────────
        modelBuilder.Entity<DiningTable>(entity =>
        {
            entity.ToTable("DiningTables");
            entity.HasKey(e => e.TableId);

            entity.HasIndex(e => e.TableCode).IsUnique();

            entity.Property(e => e.TableCode).HasMaxLength(30).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("AVAILABLE");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // ── Customers ──────────────────────────────────────
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("Customers");
            entity.HasKey(e => e.CustomerId);

            entity.Property(e => e.CustomerId).UseIdentityColumn();
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.Phone).IsUnique();

            entity.Property(e => e.FullName).HasMaxLength(150);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.TotalPoints).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasOne(c => c.User)
                  .WithOne()
                  .HasForeignKey<Customer>(c => c.UserId)
                  .HasConstraintName("FK_Customers_AspNetUsers")
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── LoyaltyTiers ───────────────────────────────────
        modelBuilder.Entity<LoyaltyTier>(entity =>
        {
            entity.ToTable("LoyaltyTiers");
            entity.HasKey(e => e.TierId);

            entity.Property(e => e.TierName).HasMaxLength(50).IsRequired();
            entity.Property(e => e.MinPoints).HasDefaultValue(0);
            entity.Property(e => e.DiscountRate).HasColumnType("decimal(5,2)").HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // ── CustomerPointsLedger ───────────────────────────
        modelBuilder.Entity<CustomerPointsLedger>(entity =>
        {
            entity.ToTable("CustomerPointsLedger");
            entity.HasKey(e => e.LedgerId);

            entity.Property(e => e.LedgerId).UseIdentityColumn();
            entity.Property(e => e.RefType).HasMaxLength(30).IsRequired();
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasOne(e => e.Customer)
                  .WithMany(c => c.PointsLedgers)
                  .HasForeignKey(e => e.CustomerId)
                  .HasConstraintName("FK_CPL_Customers")
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CreatedByStaff)
                  .WithMany(s => s.CustomerPointsLedgers)
                  .HasForeignKey(e => e.CreatedByStaffId)
                  .HasConstraintName("FK_CPL_Staff")
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── DiscountCodes ──────────────────────────────────
        modelBuilder.Entity<DiscountCode>(entity =>
        {
            entity.ToTable("DiscountCodes");
            entity.HasKey(e => e.DiscountId);
            entity.Property(e => e.DiscountId).UseIdentityColumn();
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // ── SystemConfigs ──────────────────────────────────
        modelBuilder.Entity<SystemConfig>(entity =>
        {
            entity.ToTable("SystemConfigs");
            entity.HasKey(e => e.ConfigKey);
        });

        // ── Reservations ───────────────────────────────────
        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.ToTable("Reservations");
            entity.HasKey(e => e.ReservationId);

            entity.Property(e => e.ReservationId).UseIdentityColumn();
            entity.Property(e => e.CustomerName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.CustomerPhone).HasMaxLength(20).IsRequired();
            entity.Property(e => e.DurationMinutes).HasDefaultValue(90);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("PENDING");
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.ReservedAt).HasColumnType("datetime2");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");
            
            entity.Property(e => e.DepositAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(e => e.IsDepositPaid).HasDefaultValue(false);
            entity.Property(e => e.DepositPaidAt).HasColumnType("datetime2");

            entity.HasOne(e => e.Customer)
                  .WithMany(c => c.Reservations)
                  .HasForeignKey(e => e.CustomerId)
                  .HasConstraintName("FK_Reservations_Customers")
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Table)
                  .WithMany(t => t.Reservations)
                  .HasForeignKey(e => e.TableId)
                  .HasConstraintName("FK_Reservations_Tables")
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CreatedByStaff)
                  .WithMany(s => s.Reservations)
                  .HasForeignKey(e => e.CreatedByStaffId)
                  .HasConstraintName("FK_Reservations_Staff")
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── MenuCategories ─────────────────────────────────
        modelBuilder.Entity<MenuCategory>(entity =>
        {
            entity.ToTable("MenuCategories");
            entity.HasKey(e => e.CategoryId);

            entity.Property(e => e.CategoryName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // ── MenuItems ──────────────────────────────────────
        modelBuilder.Entity<MenuItem>(entity =>
        {
            entity.ToTable("MenuItems");
            entity.HasKey(e => e.ItemId);

            entity.Property(e => e.ItemId).UseIdentityColumn();
            entity.Property(e => e.ItemName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.BasePrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasOne(e => e.Category)
                  .WithMany(c => c.MenuItems)
                  .HasForeignKey(e => e.CategoryId)
                  .HasConstraintName("FK_MenuItems_Categories")
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── MenuItemPrices ─────────────────────────────────
        modelBuilder.Entity<MenuItemPrice>(entity =>
        {
            entity.ToTable("MenuItemPrices");
            entity.HasKey(e => e.PriceId);

            entity.Property(e => e.PriceId).UseIdentityColumn();
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.EffectiveFrom).HasColumnType("datetime2");
            entity.Property(e => e.EffectiveTo).HasColumnType("datetime2");

            entity.HasOne(e => e.MenuItem)
                  .WithMany(m => m.MenuItemPrices)
                  .HasForeignKey(e => e.ItemId)
                  .HasConstraintName("FK_MenuItemPrices_Items")
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Orders ─────────────────────────────────────────
        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");
            entity.HasKey(e => e.OrderId);

            entity.Property(e => e.OrderId).UseIdentityColumn();
            entity.HasIndex(e => e.OrderCode).IsUnique();

            entity.Property(e => e.OrderCode).HasMaxLength(30).IsRequired();
            entity.Property(e => e.OrderType).HasMaxLength(20).HasDefaultValue("DINE_IN");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("OPEN");
            entity.Property(e => e.OpenedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(e => e.ClosedAt).HasColumnType("datetime2");
            entity.Property(e => e.Note).HasMaxLength(255);

            entity.HasOne(e => e.Table)
                  .WithMany(t => t.Orders)
                  .HasForeignKey(e => e.TableId)
                  .HasConstraintName("FK_Orders_Tables")
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Reservation)
                  .WithOne(r => r.Order)
                  .HasForeignKey<Order>(e => e.ReservationId)
                  .HasConstraintName("FK_Orders_Reservations")
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Customer)
                  .WithMany(c => c.Orders)
                  .HasForeignKey(e => e.CustomerId)
                  .HasConstraintName("FK_Orders_Customers")
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CreatedByStaff)
                  .WithMany(s => s.Orders)
                  .HasForeignKey(e => e.CreatedByStaffId)
                  .HasConstraintName("FK_Orders_Staff")
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── OrderItems ─────────────────────────────────────
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems");
            entity.HasKey(e => e.OrderItemId);

            entity.Property(e => e.OrderItemId).UseIdentityColumn();
            entity.Property(e => e.ItemNameSnapshot).HasMaxLength(150).IsRequired();
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(e => e.LineTotal)
                  .HasColumnType("decimal(18,2)")
                  .HasComputedColumnSql("(([UnitPrice] * [Quantity]) - [DiscountAmount])", stored: true);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("PENDING");
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasOne(e => e.Order)
                  .WithMany(o => o.OrderItems)
                  .HasForeignKey(e => e.OrderId)
                  .HasConstraintName("FK_OrderItems_Orders")
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.MenuItem)
                  .WithMany(m => m.OrderItems)
                  .HasForeignKey(e => e.ItemId)
                  .HasConstraintName("FK_OrderItems_MenuItems")
                  .OnDelete(DeleteBehavior.Restrict);

        });

        // ── OrderStatusHistory ─────────────────────────────
        modelBuilder.Entity<OrderStatusHistory>(entity =>
        {
            entity.ToTable("OrderStatusHistory");
            entity.HasKey(e => e.HistoryId);

            entity.Property(e => e.HistoryId).UseIdentityColumn();
            entity.Property(e => e.OldStatus).HasMaxLength(20);
            entity.Property(e => e.NewStatus).HasMaxLength(20).IsRequired();
            entity.Property(e => e.ChangedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(e => e.Note).HasMaxLength(255);

            entity.HasOne(e => e.Order)
                  .WithMany(o => o.StatusHistories)
                  .HasForeignKey(e => e.OrderId)
                  .HasConstraintName("FK_OSH_Orders")
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ChangedByStaff)
                  .WithMany(s => s.OrderStatusHistories)
                  .HasForeignKey(e => e.ChangedByStaffId)
                  .HasConstraintName("FK_OSH_Staff")
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Invoices ───────────────────────────────────────
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.ToTable("Invoices");
            entity.HasKey(e => e.InvoiceId);

            entity.Property(e => e.InvoiceId).UseIdentityColumn();
            entity.HasIndex(e => e.InvoiceCode).IsUnique();
            entity.HasIndex(e => e.OrderId).IsUnique();

            entity.Property(e => e.InvoiceCode).HasMaxLength(30).IsRequired();
            entity.Property(e => e.Subtotal).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(e => e.VatRate).HasColumnType("decimal(5,2)").HasDefaultValue(8.00m);
            entity.Property(e => e.VatAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(e => e.PaymentStatus).HasMaxLength(20).HasDefaultValue("UNPAID");
            entity.Property(e => e.IssuedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(e => e.Note).HasMaxLength(255);

            entity.HasOne(e => e.Order)
                  .WithOne(o => o.Invoice)
                  .HasForeignKey<Invoice>(e => e.OrderId)
                  .HasConstraintName("FK_Invoices_Orders")
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Customer)
                  .WithMany(c => c.Invoices)
                  .HasForeignKey(e => e.CustomerId)
                  .HasConstraintName("FK_Invoices_Customers")
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.IssuedByStaff)
                  .WithMany(s => s.Invoices)
                  .HasForeignKey(e => e.IssuedByStaffId)
                  .HasConstraintName("FK_Invoices_Staff")
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── InvoiceLines ───────────────────────────────────
        modelBuilder.Entity<InvoiceLine>(entity =>
        {
            entity.ToTable("InvoiceLines");
            entity.HasKey(e => e.InvoiceLineId);

            entity.Property(e => e.InvoiceLineId).UseIdentityColumn();
            entity.Property(e => e.Description).HasMaxLength(200).IsRequired();
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(e => e.LineTotal)
                  .HasColumnType("decimal(18,2)")
                  .HasComputedColumnSql("(([UnitPrice] * [Quantity]) - [DiscountAmount])", stored: true);

            entity.HasOne(e => e.Invoice)
                  .WithMany(i => i.InvoiceLines)
                  .HasForeignKey(e => e.InvoiceId)
                  .HasConstraintName("FK_InvoiceLines_Invoices")
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.MenuItem)
                  .WithMany(m => m.InvoiceLines)
                  .HasForeignKey(e => e.ItemId)
                  .HasConstraintName("FK_InvoiceLines_Items")
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Payments ───────────────────────────────────────
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("Payments");
            entity.HasKey(e => e.PaymentId);

            entity.Property(e => e.PaymentId).UseIdentityColumn();
            entity.Property(e => e.Method).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.PaidAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(e => e.ReferenceNo).HasMaxLength(100);
            entity.Property(e => e.Note).HasMaxLength(255);

            entity.HasOne(e => e.Invoice)
                  .WithMany(i => i.Payments)
                  .HasForeignKey(e => e.InvoiceId)
                  .HasConstraintName("FK_Payments_Invoices")
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ReceivedByStaff)
                  .WithMany(s => s.Payments)
                  .HasForeignKey(e => e.ReceivedByStaffId)
                  .HasConstraintName("FK_Payments_Staff")
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Suppliers ──────────────────────────────────────
        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("Suppliers");
            entity.HasKey(e => e.SupplierId);

            entity.Property(e => e.SupplierName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // ── Ingredients ────────────────────────────────────
        modelBuilder.Entity<Ingredient>(entity =>
        {
            entity.ToTable("Ingredients");
            entity.HasKey(e => e.IngredientId);

            entity.Property(e => e.IngredientId).UseIdentityColumn();
            entity.Property(e => e.IngredientName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Unit).HasMaxLength(20).IsRequired();
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // ── PurchaseReceipts ───────────────────────────────
        modelBuilder.Entity<PurchaseReceipt>(entity =>
        {
            entity.ToTable("PurchaseReceipts");
            entity.HasKey(e => e.ReceiptId);

            entity.Property(e => e.ReceiptId).UseIdentityColumn();
            entity.HasIndex(e => e.ReceiptCode).IsUnique();

            entity.Property(e => e.ReceiptCode).HasMaxLength(30).IsRequired();
            entity.Property(e => e.ReceiptDate).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("RECEIVED");
            entity.Property(e => e.Note).HasMaxLength(255);

            entity.HasOne(e => e.Supplier)
                  .WithMany(s => s.PurchaseReceipts)
                  .HasForeignKey(e => e.SupplierId)
                  .HasConstraintName("FK_PR_Suppliers")
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CreatedByStaff)
                  .WithMany(s => s.PurchaseReceipts)
                  .HasForeignKey(e => e.CreatedByStaffId)
                  .HasConstraintName("FK_PR_Staff")
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── PurchaseReceiptItems ────────────────────────────
        modelBuilder.Entity<PurchaseReceiptItem>(entity =>
        {
            entity.ToTable("PurchaseReceiptItems");
            entity.HasKey(e => e.ReceiptItemId);

            entity.Property(e => e.ReceiptItemId).UseIdentityColumn();
            entity.Property(e => e.Quantity).HasColumnType("decimal(18,3)");
            entity.Property(e => e.UnitCost).HasColumnType("decimal(18,2)");
            entity.Property(e => e.LineTotal)
                  .HasColumnType("decimal(18,2)")
                  .HasComputedColumnSql("([UnitCost] * [Quantity])", stored: true);

            entity.HasOne(e => e.Receipt)
                  .WithMany(r => r.Items)
                  .HasForeignKey(e => e.ReceiptId)
                  .HasConstraintName("FK_PRI_Receipts")
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Ingredient)
                  .WithMany(i => i.PurchaseReceiptItems)
                  .HasForeignKey(e => e.IngredientId)
                  .HasConstraintName("FK_PRI_Ingredients")
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── StockMovements ─────────────────────────────────
        modelBuilder.Entity<StockMovement>(entity =>
        {
            entity.ToTable("StockMovements");
            entity.HasKey(e => e.MovementId);

            entity.Property(e => e.MovementId).UseIdentityColumn();
            entity.Property(e => e.MovementType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Quantity).HasColumnType("decimal(18,3)");
            entity.Property(e => e.RefType).HasMaxLength(30);
            entity.Property(e => e.MovedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(e => e.Note).HasMaxLength(255);

            entity.HasOne(e => e.Ingredient)
                  .WithMany(i => i.StockMovements)
                  .HasForeignKey(e => e.IngredientId)
                  .HasConstraintName("FK_SM_Ingredients")
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.CreatedByStaff)
                  .WithMany(s => s.StockMovements)
                  .HasForeignKey(e => e.CreatedByStaffId)
                  .HasConstraintName("FK_SM_Staff")
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── BlogCategories ─────────────────────────────────
        modelBuilder.Entity<BlogCategory>(entity =>
        {
            entity.ToTable("BlogCategories");
            entity.HasKey(e => e.CategoryId);
            entity.Property(e => e.CategoryName).HasMaxLength(100).IsRequired();
        });

        // ── BlogPosts ──────────────────────────────────────
        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.ToTable("BlogPosts");
            entity.HasKey(e => e.PostId);
            entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("DRAFT");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasOne(e => e.Category)
                  .WithMany(c => c.BlogPosts)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Sliders ────────────────────────────────────────
        modelBuilder.Entity<Slider>(entity =>
        {
            entity.ToTable("Sliders");
            entity.HasKey(e => e.SliderId);
            entity.Property(e => e.ImageUrl).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(150);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");
        });

        // ── MenuItemIngredients ───────────────────────────
        modelBuilder.Entity<MenuItemIngredient>(entity =>
        {
            entity.ToTable("MenuItemIngredients");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).UseIdentityColumn();

            entity.HasOne(e => e.MenuItem)
                  .WithMany(m => m.MenuItemIngredients)
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Ingredient)
                  .WithMany()
                  .HasForeignKey(e => e.IngredientId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── InventoryAudits ───────────────────────────────
        modelBuilder.Entity<InventoryAudit>(entity =>
        {
            entity.ToTable("InventoryAudits");
            entity.HasKey(e => e.AuditId);
            entity.HasIndex(e => e.AuditCode).IsUnique();

            entity.Property(e => e.AuditCode).HasMaxLength(30).IsRequired();
            entity.Property(e => e.AuditDate).HasColumnType("datetime2").HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasOne(e => e.Staff)
                  .WithMany()
                  .HasForeignKey(e => e.StaffId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── InventoryAuditItems ───────────────────────────
        modelBuilder.Entity<InventoryAuditItem>(entity =>
        {
            entity.ToTable("InventoryAuditItems");
            entity.HasKey(e => e.AuditItemId);

            entity.HasOne(e => e.Audit)
                  .WithMany(a => a.AuditItems)
                  .HasForeignKey(e => e.AuditId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Ingredient)
                  .WithMany()
                  .HasForeignKey(e => e.IngredientId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── DailyIngredientAllocation ──────────────────────
        modelBuilder.Entity<DailyIngredientAllocation>(entity =>
        {
            entity.ToTable("DailyIngredientAllocations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).UseIdentityColumn();
            entity.Property(e => e.Date).HasColumnType("datetime2").IsRequired();

            entity.HasOne(e => e.Ingredient)
                  .WithMany()
                  .HasForeignKey(e => e.IngredientId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
