using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rmn_be.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingPhoneNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PendingPhoneNumber",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PendingPhoneNumber",
                table: "AspNetUsers");
        }
    }
}
