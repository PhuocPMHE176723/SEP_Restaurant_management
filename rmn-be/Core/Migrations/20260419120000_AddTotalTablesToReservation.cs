using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SEP_Restaurant_management.Core.Models;

#nullable disable

namespace rmn_be.Core.Migrations
{
    [DbContext(typeof(SepDatabaseContext))]
    [Migration("20260419120000_AddTotalTablesToReservation")]
    public partial class AddTotalTablesToReservation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TotalTables",
                table: "Reservations",
                type: "int",
                nullable: false,
                defaultValue: 1
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "TotalTables", table: "Reservations");
        }
    }
}
