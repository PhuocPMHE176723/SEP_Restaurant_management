using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SEP_Restaurant_management.Core.Models;

#nullable disable

namespace rmn_be.Core.Migrations
{
    [DbContext(typeof(SepDatabaseContext))]
    [Migration("20260419130000_AddOrderTables")]
    public partial class AddOrderTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrderTables",
                columns: table => new
                {
                    OrderTableId = table
                        .Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<long>(type: "bigint", nullable: false),
                    TableId = table.Column<int>(type: "int", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderTables", x => x.OrderTableId);
                    table.ForeignKey(
                        name: "FK_OrderTables_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "FK_OrderTables_DiningTables_TableId",
                        column: x => x.TableId,
                        principalTable: "DiningTables",
                        principalColumn: "TableId",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_OrderTables_OrderId",
                table: "OrderTables",
                column: "OrderId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_OrderTables_TableId",
                table: "OrderTables",
                column: "TableId"
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "OrderTables");
        }
    }
}
