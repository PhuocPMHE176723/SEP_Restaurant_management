using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;


namespace SEP_Restaurant_management.Models;

public partial class SepDatabaseContext : IdentityDbContext<UserIdentity>
{
    public SepDatabaseContext()
    {
    }

    public SepDatabaseContext(DbContextOptions<SepDatabaseContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<CustomDish> CustomDishes { get; set; }

    public virtual DbSet<CustomDishIngredient> CustomDishIngredients { get; set; }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<Discount> Discounts { get; set; }

    public virtual DbSet<Dish> Dishes { get; set; }

    public virtual DbSet<DishIngredient> DishIngredients { get; set; }

    public virtual DbSet<DishSize> DishSizes { get; set; }

    public virtual DbSet<ImportBill> ImportBills { get; set; }

    public virtual DbSet<ImportBillDetail> ImportBillDetails { get; set; }

    public virtual DbSet<Ingredient> Ingredients { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderDetail> OrderDetails { get; set; }

    public virtual DbSet<OrderStaff> OrderStaffs { get; set; }

    public virtual DbSet<Price> Prices { get; set; }

    public virtual DbSet<Shift> Shifts { get; set; }

    public virtual DbSet<Staff> Staffs { get; set; }

    public virtual DbSet<Supplier> Suppliers { get; set; }

    public virtual DbSet<Table> Tables { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            var connectionString = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .Build()
                .GetConnectionString("MyCnn");

            optionsBuilder.UseSqlServer(connectionString);
        }
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__Category__19093A0BCC4099F6");

            entity.ToTable("Category");

            entity.Property(e => e.CategoryName).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<CustomDish>(entity =>
        {
            entity.HasKey(e => e.CustomDishId).HasName("PK__CustomDi__0983331F2E548FBB");

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.DishName).HasMaxLength(100);
            entity.Property(e => e.Price).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Order).WithMany(p => p.CustomDishes)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK_CustomDishes_Order");
        });

        modelBuilder.Entity<CustomDishIngredient>(entity =>
        {
            entity.HasKey(e => e.CustomDishIngredientId).HasName("PK__CustomDi__766C71F4DB64C062");

            entity.ToTable("CustomDishIngredient");

            entity.Property(e => e.Quantity).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Unit).HasMaxLength(10);

            entity.HasOne(d => d.CustomDish).WithMany(p => p.CustomDishIngredients)
                .HasForeignKey(d => d.CustomDishId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CustomDishIngredient_CustomDishes");

            entity.HasOne(d => d.Ingredient).WithMany(p => p.CustomDishIngredients)
                .HasForeignKey(d => d.IngredientId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CustomDishIngredient_Ingredient");
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("Customer");
            entity.HasKey(e => e.CustomerId).HasName("PK__Customer__A4AE64D83AEFDF51");

            entity.Property(e => e.Fullname).HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(255);

            entity.Property(e => e.Gender).HasColumnType("bit");
            entity.Property(e => e.Dob).HasColumnType("date");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");

            entity.HasOne(c => c.User)
                  .WithOne()
                  .HasForeignKey<Customer>(c => c.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(c => c.UserId).IsUnique();
        });

        modelBuilder.Entity<Discount>(entity =>
        {
            entity.HasKey(e => e.DiscountId).HasName("PK__Discount__E43F6D968FA501D9");

            entity.ToTable("Discount");

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.DiscountName).HasMaxLength(100);
            entity.Property(e => e.EndTime).HasColumnType("datetime");
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.StartTime).HasColumnType("datetime");
        });

        modelBuilder.Entity<Dish>(entity =>
        {
            entity.HasKey(e => e.DishId).HasName("PK__Dishes__18834F509F4100E2");

            entity.HasIndex(e => e.CategoryId, "IX_Dishes_CategoryId");

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.DishName).HasMaxLength(100);
            entity.Property(e => e.Image).HasMaxLength(100);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Category).WithMany(p => p.Dishes)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Dishes_Category");
        });

        modelBuilder.Entity<DishIngredient>(entity =>
        {
            entity.HasKey(e => e.DishIngredientId).HasName("PK__DishIngr__DBEF30235550CBB8");

            entity.ToTable("DishIngredient");

            entity.HasIndex(e => e.DishId, "IX_DishIngredient_DishId");

            entity.HasIndex(e => e.IngredientId, "IX_DishIngredient_IngredientId");

            entity.Property(e => e.Quantity).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Unit).HasMaxLength(10);

            entity.HasOne(d => d.Dish).WithMany(p => p.DishIngredients)
                .HasForeignKey(d => d.DishId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DishIngredient_Dishes");

            entity.HasOne(d => d.Ingredient).WithMany(p => p.DishIngredients)
                .HasForeignKey(d => d.IngredientId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DishIngredient_Ingredient");
        });

        modelBuilder.Entity<DishSize>(entity =>
        {
            entity.HasKey(e => e.DishSizeId).HasName("PK__DishSize__08A9777A3F3B4F9B");

            entity.ToTable("DishSize");

            entity.HasIndex(e => e.DishId, "IX_DishSize_DishId");

            entity.HasIndex(e => e.PriceId, "IX_DishSize_PriceId");

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.DishSizeName).HasMaxLength(10);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Dish).WithMany(p => p.DishSizes)
                .HasForeignKey(d => d.DishId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DishSize_Dishes");

            entity.HasOne(d => d.Price).WithMany(p => p.DishSizes)
                .HasForeignKey(d => d.PriceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DishSize_Price");
        });

        modelBuilder.Entity<ImportBill>(entity =>
        {
            entity.HasKey(e => e.ImportBillId).HasName("PK__ImportBi__03D1F91021EDD24A");

            entity.ToTable("ImportBill");

            entity.HasIndex(e => e.SupplierId, "IX_ImportBill_SupplierId");

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.ImportDate).HasColumnType("datetime");
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.CreateStaff).WithMany(p => p.ImportBills)
                .HasForeignKey(d => d.CreateStaffId)
                .HasConstraintName("FK_ImportBill_Staff");

            entity.HasOne(d => d.Supplier).WithMany(p => p.ImportBills)
                .HasForeignKey(d => d.SupplierId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ImportBill_Supplier");
        });

        modelBuilder.Entity<ImportBillDetail>(entity =>
        {
            entity.HasKey(e => e.ImportBillDetailId).HasName("PK__ImportBi__6BE0A8EEE793E94F");

            entity.ToTable("ImportBillDetail");

            entity.HasIndex(e => e.ImportBillId, "IX_ImportBillDetail_ImportBillId");

            entity.Property(e => e.Note).HasMaxLength(255);
            entity.Property(e => e.QuantityImport).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.StockQuantity).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Unit).HasMaxLength(10);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.ImportBill).WithMany(p => p.ImportBillDetails)
                .HasForeignKey(d => d.ImportBillId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ImportBillDetail_ImportBill");

            entity.HasOne(d => d.Ingredient).WithMany(p => p.ImportBillDetails)
                .HasForeignKey(d => d.IngredientId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ImportBillDetail_Ingredient");
        });

        modelBuilder.Entity<Ingredient>(entity =>
        {
            entity.HasKey(e => e.IngredientId).HasName("PK__Ingredie__BEAEB25A7557D19F");

            entity.ToTable("Ingredient");

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CurrentStock).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.IngredientName).HasMaxLength(100);
            entity.Property(e => e.Unit).HasMaxLength(10);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.OrderId).HasName("PK__Order__C3905BCFBEB86ACF");

            entity.ToTable("Order");

            entity.HasIndex(e => e.CustomerId, "IX_Order_CustomerId");

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.DiscountPrice).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.Note).HasMaxLength(200);
            entity.Property(e => e.OrderCode).HasMaxLength(15);
            entity.Property(e => e.OrderDate).HasColumnType("datetime");
            entity.Property(e => e.OrderStatus).HasMaxLength(20);
            entity.Property(e => e.PaidAt).HasColumnType("datetime");
            entity.Property(e => e.PaymentMethod).HasMaxLength(20);
            entity.Property(e => e.PaymentStatus).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.Customer).WithMany(p => p.Orders)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Order_Customer");

            entity.HasOne(d => d.Shift).WithMany(p => p.Orders)
                .HasForeignKey(d => d.ShiftId)
                .HasConstraintName("FK_Order_Shift");

            entity.HasMany(d => d.Discounts).WithMany(p => p.Orders)
                .UsingEntity<Dictionary<string, object>>(
                    "OrderDiscount",
                    r => r.HasOne<Discount>().WithMany()
                        .HasForeignKey("DiscountId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_OrderDiscount_Discount"),
                    l => l.HasOne<Order>().WithMany()
                        .HasForeignKey("OrderId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_OrderDiscount_Order"),
                    j =>
                    {
                        j.HasKey("OrderId", "DiscountId");
                        j.ToTable("OrderDiscount");
                    });
        });

        modelBuilder.Entity<OrderDetail>(entity =>
        {
            entity.HasKey(e => e.OrderDetailId).HasName("PK__OrderDet__D3B9D36CE1FF7020");

            entity.ToTable("OrderDetail");

            entity.HasIndex(e => e.DishSizeId, "IX_OrderDetail_DishSizeId");

            entity.HasIndex(e => e.OrderId, "IX_OrderDetail_OrderId");

            entity.Property(e => e.Note).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.DishSize).WithMany(p => p.OrderDetails)
                .HasForeignKey(d => d.DishSizeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderDetail_DishSize");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderDetails)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderDetail_Order");
        });

        modelBuilder.Entity<OrderStaff>(entity =>
        {
            entity.HasKey(e => e.OrderStaffId).HasName("PK__OrderSta__1E54AA57009598D1");

            entity.ToTable("OrderStaff");

            entity.Property(e => e.Role).HasMaxLength(20);

            entity.HasOne(d => d.Order).WithMany(p => p.OrderStaffs)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderStaff_Order");

            entity.HasOne(d => d.Staff).WithMany(p => p.OrderStaffs)
                .HasForeignKey(d => d.StaffId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderStaff_Staff");
        });

        modelBuilder.Entity<Price>(entity =>
        {
            entity.HasKey(e => e.PriceId).HasName("PK__Price__49575BAFBF1E71D8");

            entity.ToTable("Price");

            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.PriceValue).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.StartDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<Shift>(entity =>
        {
            entity.HasKey(e => e.ShiftId).HasName("PK__Shift__C0A838812DF4ED16");

            entity.ToTable("Shift");

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.EndTime).HasColumnType("datetime");
            entity.Property(e => e.Note).HasMaxLength(200);
            entity.Property(e => e.ShiftName).HasMaxLength(100);
            entity.Property(e => e.StartTime).HasColumnType("datetime");
        });

        modelBuilder.Entity<Staff>(entity =>
        {
            entity.ToTable("Staff");
            entity.HasKey(e => e.StaffId).HasName("PK__Staff__96D4AB17C0B5976D");

            entity.Property(e => e.Fullname).HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.StaffCode).HasMaxLength(50);
            entity.Property(e => e.Position).HasMaxLength(50);

            entity.Property(e => e.Gender).HasColumnType("bit");
            entity.Property(e => e.Dob).HasColumnType("date");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");

            entity.HasOne(s => s.User)
                  .WithOne()
                  .HasForeignKey<Staff>(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(s => s.UserId).IsUnique();
        });


        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.SupplierId).HasName("PK__Supplier__4BE666B4859ACF1F");

            entity.ToTable("Supplier");

            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(50);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.SupplierName).HasMaxLength(100);
        });

        modelBuilder.Entity<Table>(entity =>
        {
            entity.HasKey(e => e.TableId).HasName("PK__Table__7D5F01EE8C9F873C");

            entity.ToTable("Table");

            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.Note).HasMaxLength(200);
            entity.Property(e => e.Position).HasMaxLength(200);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.TableName).HasMaxLength(20);
            entity.Property(e => e.TableType).HasMaxLength(20);

            entity.HasMany(d => d.Orders).WithMany(p => p.Tables)
                .UsingEntity<Dictionary<string, object>>(
                    "OrderTable",
                    r => r.HasOne<Order>().WithMany()
                        .HasForeignKey("OrderId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_OrderTable_Order"),
                    l => l.HasOne<Table>().WithMany()
                        .HasForeignKey("TableId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_OrderTable_Table"),
                    j =>
                    {
                        j.HasKey("TableId", "OrderId");
                        j.ToTable("OrderTable");
                    });
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
