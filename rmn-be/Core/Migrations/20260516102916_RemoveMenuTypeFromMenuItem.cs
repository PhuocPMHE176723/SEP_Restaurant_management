using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rmn_be.Core.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMenuTypeFromMenuItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MenuType",
                table: "MenuItems");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MenuType",
                table: "MenuItems",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }
    }
}
