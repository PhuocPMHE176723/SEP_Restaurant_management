using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class Price
{
    public int PriceId { get; set; }

    public decimal PriceValue { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<DishSize> DishSizes { get; set; } = new List<DishSize>();
}
