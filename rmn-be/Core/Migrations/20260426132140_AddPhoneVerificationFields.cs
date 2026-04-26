using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rmn_be.Core.Migrations
{
    /// <inheritdoc />
    public partial class AddPhoneVerificationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderTables_DiningTables_TableId",
                table: "OrderTables");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderTables_Orders_OrderId",
                table: "OrderTables");

            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_Tables",
                table: "Reservations");

            migrationBuilder.DropForeignKey(
                name: "FK_ReservationTables_DiningTables_TableId",
                table: "ReservationTables");

            migrationBuilder.DropForeignKey(
                name: "FK_ReservationTables_Reservations_ReservationId",
                table: "ReservationTables");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_TableId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "TableId",
                table: "Reservations");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "ReservationTables",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<bool>(
                name: "IsPhoneVerified",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PhoneVerifiedAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderTables_DiningTables_TableId",
                table: "OrderTables",
                column: "TableId",
                principalTable: "DiningTables",
                principalColumn: "TableId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderTables_Orders_OrderId",
                table: "OrderTables",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RT_Reservations",
                table: "ReservationTables",
                column: "ReservationId",
                principalTable: "Reservations",
                principalColumn: "ReservationId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RT_Tables",
                table: "ReservationTables",
                column: "TableId",
                principalTable: "DiningTables",
                principalColumn: "TableId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderTables_DiningTables_TableId",
                table: "OrderTables");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderTables_Orders_OrderId",
                table: "OrderTables");

            migrationBuilder.DropForeignKey(
                name: "FK_RT_Reservations",
                table: "ReservationTables");

            migrationBuilder.DropForeignKey(
                name: "FK_RT_Tables",
                table: "ReservationTables");

            migrationBuilder.DropColumn(
                name: "IsPhoneVerified",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PhoneVerifiedAt",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AssignedAt",
                table: "ReservationTables",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AddColumn<int>(
                name: "TableId",
                table: "Reservations",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_TableId",
                table: "Reservations",
                column: "TableId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderTables_DiningTables_TableId",
                table: "OrderTables",
                column: "TableId",
                principalTable: "DiningTables",
                principalColumn: "TableId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderTables_Orders_OrderId",
                table: "OrderTables",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_Tables",
                table: "Reservations",
                column: "TableId",
                principalTable: "DiningTables",
                principalColumn: "TableId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ReservationTables_DiningTables_TableId",
                table: "ReservationTables",
                column: "TableId",
                principalTable: "DiningTables",
                principalColumn: "TableId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ReservationTables_Reservations_ReservationId",
                table: "ReservationTables",
                column: "ReservationId",
                principalTable: "Reservations",
                principalColumn: "ReservationId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
