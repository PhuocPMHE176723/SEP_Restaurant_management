using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rmn_be.Migrations
{
    /// <inheritdoc />
    public partial class AddStockToMenuItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Stock",
                table: "MenuItems",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Stock",
                table: "MenuItems");
        }
    }
}
