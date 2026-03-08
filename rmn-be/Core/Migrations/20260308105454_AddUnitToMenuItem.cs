using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rmn_be.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitToMenuItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "MenuItems",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Unit",
                table: "MenuItems");
        }
    }
}
