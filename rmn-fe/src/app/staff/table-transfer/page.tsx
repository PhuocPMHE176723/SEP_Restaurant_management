"use client";

import { useState, useEffect } from "react";
import { diningTableApi } from "../../../lib/api/dining-table";
import { orderApi, OrderResponse } from "../../../lib/api/order";
import type { DiningTableResponse } from "../../../types/models";
import styles from "../../manager/manager.module.css";

interface TableWithOrder extends DiningTableResponse {
  currentOrder?: OrderResponse;
}

export default function TableTransferPage() {
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedFromTable, setSelectedFromTable] =
    useState<TableWithOrder | null>(null);
  const [selectedToTable, setSelectedToTable] = useState<TableWithOrder | null>(
    null,
  );
  const [transferReason, setTransferReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tablesData, ordersData] = await Promise.all([
        diningTableApi.getAllTables(),
        orderApi.getAllOrders(),
      ]);

      // Combine tables with their current orders
      const tablesWithOrders: TableWithOrder[] = (tablesData || []).map(
        (table) => {
          const currentOrder = Array.isArray(ordersData)
            ? ordersData.find(
                (order) =>
                  order.tableName === table.tableCode &&
                  (order.status === "OPEN" ||
                    order.status === "SENT_TO_KITCHEN"),
              )
            : undefined;
          return {
            ...table,
            currentOrder,
          };
        },
      );

      setTables(tablesWithOrders);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Trống";
      case "OCCUPIED":
        return "Có khách";
      case "RESERVED":
        return "Đã đặt";
      case "MAINTENANCE":
        return "Bảo trì";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return styles.statusAvailable;
      case "OCCUPIED":
        return styles.statusOccupied;
      case "RESERVED":
        return styles.statusReserved;
      case "MAINTENANCE":
        return styles.statusMaintenance;
      default:
        return "";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const canTransferFrom = (table: TableWithOrder) => {
    return table.currentOrder && table.status === "OCCUPIED";
  };

  const canTransferTo = (table: TableWithOrder) => {
    return (
      !table.currentOrder && table.status === "AVAILABLE" && table.isActive
    );
  };

  const handleSelectFromTable = (table: TableWithOrder) => {
    if (canTransferFrom(table)) {
      setSelectedFromTable(table);
      setSelectedToTable(null); // Reset to table selection
    }
  };

  const handleSelectToTable = (table: TableWithOrder) => {
    if (canTransferTo(table)) {
      setSelectedToTable(table);
    }
  };

  const handleTransfer = async () => {
    if (!selectedFromTable || !selectedToTable || !transferReason.trim()) {
      alert("Vui lòng chọn bàn nguồn, bàn đích và nhập lý do chuyển bàn");
      return;
    }

    try {
      // For now, we'll simulate the transfer by updating table statuses
      // In a real implementation, you'd call a specific API endpoint for table transfer

      // Update the source table to AVAILABLE
      await diningTableApi.updateTable(selectedFromTable.tableId, {
        status: "AVAILABLE",
      });

      // Update the destination table to OCCUPIED
      await diningTableApi.updateTable(selectedToTable.tableId, {
        status: "OCCUPIED",
      });

      alert("Chuyển bàn thành công!");

      // Reset form and refresh data
      setSelectedFromTable(null);
      setSelectedToTable(null);
      setTransferReason("");
      fetchData();
    } catch (error) {
      console.error("Transfer failed:", error);
      alert("Có lỗi khi chuyển bàn. Vui lòng thử lại.");
    }
  };

  const resetSelection = () => {
    setSelectedFromTable(null);
    setSelectedToTable(null);
    setTransferReason("");
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Chuyển bàn</h1>
          <p className={styles.pageSubtitle}>
            Di chuyển khách từ bàn này sang bàn khác
          </p>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          {/* Transfer Form */}
          {(selectedFromTable || selectedToTable) && (
            <div className={styles.card}>
              <h3>Thông tin chuyển bàn</h3>

              <div
                style={{ display: "grid", gap: "1rem", marginBottom: "1rem" }}
              >
                <div>
                  <h4>1. Bàn nguồn</h4>
                  {selectedFromTable ? (
                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "#f0f8ff",
                        borderRadius: "4px",
                      }}
                    >
                      <p>
                        <strong>
                          {selectedFromTable.tableName ||
                            selectedFromTable.tableCode}
                        </strong>
                      </p>
                      <p>
                        Khách:{" "}
                        {selectedFromTable.currentOrder?.customerName ||
                          "Khách lẻ"}
                      </p>
                      <p>
                        Tổng tiền:{" "}
                        {formatCurrency(
                          selectedFromTable.currentOrder?.totalAmount || 0,
                        )}
                      </p>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => setSelectedFromTable(null)}
                      >
                        Đổi bàn
                      </button>
                    </div>
                  ) : (
                    <p>Chọn bàn có khách từ danh sách bên dưới</p>
                  )}
                </div>

                <div>
                  <h4>2. Bàn đích</h4>
                  {selectedToTable ? (
                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "#f0fff0",
                        borderRadius: "4px",
                      }}
                    >
                      <p>
                        <strong>
                          {selectedToTable.tableName ||
                            selectedToTable.tableCode}
                        </strong>
                      </p>
                      <p>Sức chứa: {selectedToTable.capacity} người</p>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => setSelectedToTable(null)}
                      >
                        Đổi bàn
                      </button>
                    </div>
                  ) : (
                    <p>Chọn bàn trống từ danh sách bên dưới</p>
                  )}
                </div>

                <div>
                  <h4>3. Lý do chuyển bàn</h4>
                  <textarea
                    className={styles.textarea}
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Nhập lý do chuyển bàn..."
                    rows={3}
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleTransfer}
                    disabled={
                      !selectedFromTable ||
                      !selectedToTable ||
                      !transferReason.trim()
                    }
                  >
                    Xác nhận chuyển bàn
                  </button>
                  <button
                    className={styles.btnSecondary}
                    onClick={resetSelection}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tables Grid */}
          <div className={styles.card}>
            <h3>Danh sách bàn ({tables.length} bàn)</h3>

            <div className={styles.tableGrid}>
              {tables.map((table) => (
                <div
                  key={table.tableId}
                  className={`${styles.tableCard} ${styles[table.status.toLowerCase()]}`}
                  style={{
                    cursor:
                      (!selectedFromTable && canTransferFrom(table)) ||
                      (selectedFromTable &&
                        !selectedToTable &&
                        canTransferTo(table))
                        ? "pointer"
                        : "default",
                    opacity:
                      (!selectedFromTable && canTransferFrom(table)) ||
                      (selectedFromTable &&
                        !selectedToTable &&
                        canTransferTo(table))
                        ? 1
                        : selectedFromTable || selectedToTable
                          ? 0.7
                          : 1,
                    border:
                      selectedFromTable?.tableId === table.tableId
                        ? "2px solid #007bff"
                        : selectedToTable?.tableId === table.tableId
                          ? "2px solid #28a745"
                          : "1px solid #ddd",
                  }}
                  onClick={() => {
                    if (!selectedFromTable && canTransferFrom(table)) {
                      handleSelectFromTable(table);
                    } else if (
                      selectedFromTable &&
                      !selectedToTable &&
                      canTransferTo(table)
                    ) {
                      handleSelectToTable(table);
                    }
                  }}
                >
                  <h4>{table.tableName || table.tableCode}</h4>
                  <p>{table.capacity} chỗ</p>
                  <span
                    className={`${styles.status} ${getStatusClass(table.status)}`}
                  >
                    {getStatusText(table.status)}
                  </span>

                  {table.currentOrder && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
                      <p>
                        <strong>Khách:</strong>{" "}
                        {table.currentOrder.customerName || "Khách lẻ"}
                      </p>
                      <p>
                        <strong>Tổng:</strong>{" "}
                        {formatCurrency(table.currentOrder.totalAmount)}
                      </p>
                    </div>
                  )}

                  {!selectedFromTable && canTransferFrom(table) && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        color: "#007bff",
                        fontSize: "0.8em",
                      }}
                    >
                      Nhấn để chọn bàn nguồn
                    </div>
                  )}

                  {selectedFromTable &&
                    !selectedToTable &&
                    canTransferTo(table) && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          color: "#28a745",
                          fontSize: "0.8em",
                        }}
                      >
                        Nhấn để chọn bàn đích
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
