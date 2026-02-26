using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class ImportBillDetail
{
    public int ImportBillDetailId { get; set; }

    public int ImportBillId { get; set; }

    public int IngredientId { get; set; }

    public decimal QuantityImport { get; set; }

    public string? Unit { get; set; }

    public decimal? StockQuantity { get; set; }

    public string? Note { get; set; }

    public decimal? UnitPrice { get; set; }

    public virtual ImportBill ImportBill { get; set; } = null!;

    public virtual Ingredient Ingredient { get; set; } = null!;
}
