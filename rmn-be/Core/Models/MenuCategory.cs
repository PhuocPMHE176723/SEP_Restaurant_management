using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.Models;

public partial class MenuCategory
{
    [Key]
    public int CategoryId { get; set; }

    [Required]
    [MaxLength(100)]
    public string CategoryName { get; set; } = default!;

    [MaxLength(255)]
    public string? Description { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public virtual ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
}
