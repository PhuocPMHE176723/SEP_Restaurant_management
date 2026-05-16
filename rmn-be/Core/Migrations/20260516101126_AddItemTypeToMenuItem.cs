using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rmn_be.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddItemTypeToMenuItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ItemType",
                table: "MenuItems",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ItemType",
                table: "MenuItems");
        }
    }
}
