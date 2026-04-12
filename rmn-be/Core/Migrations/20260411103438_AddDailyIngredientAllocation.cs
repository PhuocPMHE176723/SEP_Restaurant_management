using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rmn_be.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyIngredientAllocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DailyIngredientAllocations",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IngredientId = table.Column<long>(type: "bigint", nullable: false),
                    AllocatedQuantity = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    ActuallyUsedQuantity = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    AdjustedQuantity = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyIngredientAllocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DailyIngredientAllocations_Ingredients_IngredientId",
                        column: x => x.IngredientId,
                        principalTable: "Ingredients",
                        principalColumn: "IngredientId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyIngredientAllocations_IngredientId",
                table: "DailyIngredientAllocations",
                column: "IngredientId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DailyIngredientAllocations");
        }
    }
}
