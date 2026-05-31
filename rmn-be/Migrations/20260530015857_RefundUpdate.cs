using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rmn_be.Migrations
{
    /// <inheritdoc />
    public partial class RefundUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRefund",
                table: "Reservations",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "RefundAmount",
                table: "Reservations",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<long>(
                name: "RefundByStaffId",
                table: "Reservations",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Refund_note",
                table: "Reservations",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Refund_proof_url",
                table: "Reservations",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_RefundByStaffId",
                table: "Reservations",
                column: "RefundByStaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_Staff_RefundByStaffId",
                table: "Reservations",
                column: "RefundByStaffId",
                principalTable: "Staff",
                principalColumn: "StaffId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_Staff_RefundByStaffId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_RefundByStaffId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "IsRefund",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "RefundAmount",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "RefundByStaffId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "Refund_note",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "Refund_proof_url",
                table: "Reservations");
        }
    }
}
