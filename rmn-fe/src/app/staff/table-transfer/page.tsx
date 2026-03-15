"use client";

import { useState, useEffect } from "react";
import { diningTableApi } from "../../../lib/api/dining-table";
import { orderApi, OrderResponse } from "../../../lib/api/order";
import { showSuccess, showError } from "../../../lib/ui/alerts";
import type { DiningTableResponse } from "../../../types/models";
import styles from "../../manager/manager.module.css";

interface TableWithOrder extends DiningTableResponse {
  currentOrder?: OrderResponse;
}

export default function TableTransferPage() {
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [selectedFromTable, setSelectedFromTable] = useState<TableWithOrder | null>(null);
  const [selectedToTable, setSelectedToTable] = useState<TableWithOrder | null>(null);
  const [transferReason, setTransferReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tablesData, ordersData] = await Promise.all([
        diningTableApi.getAllTables(),
        orderApi.getAllOrders(),
      ]);

      const tablesWithOrders: TableWithOrder[] = (tablesData || []).map(
        (table) => {
          const currentOrder = Array.isArray(ordersData)
            ? ordersData.find(
                (order) =>
                  order.tableName === (table.tableName || table.tableCode) &&
                  (order.status === "OPEN" || order.status === "SENT_TO_KITCHEN" || order.status === "SERVED"),
              )
            : undefined;
          return {
            ...table,
            currentOrder,
          };
        },
      );

      setTables(tablesWithOrders);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showError("Lỗi", "Không thể tải dữ liệu bàn.");
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "Trống";
      case "OCCUPIED": return "Có khách";
      case "RESERVED": return "Đã đặt";
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "AVAILABLE": return styles.badgeAvailable;
      case "OCCUPIED": return styles.badgeOccupied;
      case "RESERVED": return styles.badgeReserved;
      default: return styles.badgeInactive;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const canTransferFrom = (table: TableWithOrder) => {
    return table.status === "OCCUPIED" && table.currentOrder;
  };

  const canTransferTo = (table: TableWithOrder) => {
    return table.status === "AVAILABLE" && !table.currentOrder && table.isActive;
  };

  const handleSelectTable = (table: TableWithOrder) => {
    if (!selectedFromTable) {
      if (canTransferFrom(table)) {
        setSelectedFromTable(table);
      } else {
        showError("Lỗi chọn bàn", "Chỉ chọn bàn có khách để chuyển đi.");
      }
    } else if (!selectedToTable) {
      if (table.tableId === selectedFromTable.tableId) {
        setSelectedFromTable(null);
      } else if (canTransferTo(table)) {
        setSelectedToTable(table);
      } else {
        showError("Lỗi chọn bàn", "Chỉ chọn bàn trống để chuyển đến.");
      }
    } else {
      if (table.tableId === selectedToTable.tableId) {
        setSelectedToTable(null);
      } else if (table.tableId === selectedFromTable.tableId) {
        setSelectedFromTable(null);
        setSelectedToTable(null);
      }
    }
  };

  const handleTransfer = async () => {
    if (!selectedFromTable || !selectedToTable || !transferReason.trim()) {
      showError("Lỗi", "Vui lòng chọn bàn nguồn, bàn đích và nhập lý do");
      return;
    }

    try {
      await orderApi.transferTable({
        fromTableId: selectedFromTable.tableId,
        toTableId: selectedToTable.tableId,
        reason: transferReason
      });

      showSuccess("Thành công", `Đã chuyển khách từ bàn ${selectedFromTable.tableName || selectedFromTable.tableCode} sang ${selectedToTable.tableName || selectedToTable.tableCode}`);

      setSelectedFromTable(null);
      setSelectedToTable(null);
      setTransferReason("");
      fetchData();
    } catch (error: any) {
      console.error("Transfer failed:", error);
      showError("Lỗi chuyển bàn", error.message || "Có lỗi xảy ra khi chuyển bàn.");
    }
  };

  const filteredTables = tables.filter(t => 
    t.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.tableCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Chuyển bàn</h1>
          <p className={styles.pageSubtitle}>
            Di chuyển thông tin đơn hàng sang bàn trống mới
          </p>
        </div>
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "1.5rem", alignItems: "start" }}>
          <div className={styles.card} style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Sơ đồ bàn</h3>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Tìm mã bàn..." 
                style={{ width: '200px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
              gap: '1rem',
              maxHeight: 'calc(100vh - 300px)',
              overflowY: 'auto',
              padding: '0.5rem'
            }}>
              {filteredTables.map((table) => {
                const isFrom = selectedFromTable?.tableId === table.tableId;
                const isTo = selectedToTable?.tableId === table.tableId;
                
                let opacity = 1;
                let border = '1px solid #e2e8f0';
                let bg = 'white';
                
                if (!selectedFromTable) {
                  // Phase 1: Choosing source
                  if (!canTransferFrom(table)) opacity = 0.4;
                } else if (!selectedToTable) {
                  // Phase 2: Choosing target
                  if (isFrom) {
                    border = '3px solid #3b82f6';
                    bg = '#eff6ff';
                  } else if (!canTransferTo(table)) {
                    opacity = 0.4;
                  }
                } else {
                  // Phase 3: Both selected
                  if (isFrom) {
                    border = '3px solid #3b82f6';
                    bg = '#eff6ff';
                  } else if (isTo) {
                    border = '3px solid #10b981';
                    bg = '#f0fdf4';
                  } else {
                    opacity = 0.4;
                  }
                }

                return (
                  <div
                    key={table.tableId}
                    className={styles.tableCard}
                    style={{
                      cursor: "pointer",
                      opacity,
                      border,
                      background: bg,
                      transition: "all 0.2s",
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                    onClick={() => handleSelectTable(table)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{table.tableName || table.tableCode}</span>
                      <span className={`${styles.badge} ${getStatusClass(table.status)}`} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                        {getStatusText(table.status)}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {table.capacity} chỗ • {table.currentOrder ? `Đơn: ${table.currentOrder.orderCode}` : 'Bàn trống'}
                    </div>

                    {isFrom && <div style={{ background: '#3b82f6', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>NGUỒN</div>}
                    {isTo && <div style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>ĐÍCH</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <div className={styles.card} style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>Thông tin chuyển</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  backgroundColor: selectedFromTable ? '#eff6ff' : '#f8fafc',
                  border: selectedFromTable ? '2px solid #3b82f6' : '2px dashed #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>BÀN NGUỒN (Đang ngồi)</div>
                  {selectedFromTable ? (
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e40af' }}>{selectedFromTable.tableName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>{selectedFromTable.currentOrder?.customerName || 'Khách lẻ'}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Chạm vào bàn có khách</div>
                  )}
                </div>

                <div style={{ textAlign: 'center', fontSize: '1.5rem', color: '#cbd5e1' }}>↓</div>

                <div style={{ 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  backgroundColor: selectedToTable ? '#f0fdf4' : '#f8fafc',
                  border: selectedToTable ? '2px solid #10b981' : '2px dashed #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>BÀN ĐÍCH (Chuyển sang)</div>
                  {selectedToTable ? (
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065f46' }}>{selectedToTable.tableName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#10b981' }}>{selectedToTable.capacity} chỗ ngồi</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Chạm vào bàn trống mới</div>
                  )}
                </div>

                <div>
                  <label className={styles.label} style={{ fontSize: '0.85rem' }}>Lý do chuyển bàn</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Lý do..."
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button 
                    className={styles.btnPrimary} 
                    disabled={!selectedFromTable || !selectedToTable || !transferReason.trim()}
                    style={{ padding: '0.85rem', fontSize: '0.9rem' }}
                    onClick={handleTransfer}
                  >
                    Xác nhận
                  </button>
                  <button 
                    className={styles.btnSecondary}
                    onClick={() => { setSelectedFromTable(null); setSelectedToTable(null); setTransferReason(""); }}
                  >
                    Làm mới
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
