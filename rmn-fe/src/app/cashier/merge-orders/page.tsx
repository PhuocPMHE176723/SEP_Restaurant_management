"use client";

import { useState, useEffect } from "react";
import { diningTableApi } from "../../../lib/api/dining-table";
import { orderApi, OrderResponse } from "../../../lib/api/order";
import { showSuccess, showError, showWarning } from "../../../lib/ui/alerts";
import type { DiningTableResponse } from "../../../types/models";
import styles from "../../manager/manager.module.css";
import { Layers } from "lucide-react";

interface TableWithOrder extends DiningTableResponse {
  currentOrder?: OrderResponse;
}

export default function CashierMergeOrdersPage() {
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [primaryTable, setPrimaryTable] = useState<TableWithOrder | null>(null);
  const [secondaryTables, setSecondaryTables] = useState<TableWithOrder[]>([]);
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

      const tablesWithOrders: TableWithOrder[] = (tablesData || []).map((table) => {
        const currentOrder = Array.isArray(ordersData)
          ? ordersData.find(
              (order) =>
                (order.tableId === table.tableId || order.tableName === (table.tableName || table.tableCode)) &&
                (order.status === "OPEN" || order.status === "SENT_TO_KITCHEN" || order.status === "SERVED"),
            )
          : undefined;
        return {
          ...table,
          currentOrder,
        };
      });

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

  const canBeMerged = (table: TableWithOrder) => {
    return table.status === "OCCUPIED" && table.currentOrder;
  };

  const handleSelectTable = (table: TableWithOrder) => {
    if (!canBeMerged(table)) {
      showWarning("Không hợp lệ", "Chỉ có thể chọn bàn đang có order (có khách).");
      return;
    }

    if (!primaryTable) {
      setPrimaryTable(table);
    } else if (primaryTable.tableId === table.tableId) {
      // Deselect primary table => reset everything
      setPrimaryTable(null);
      setSecondaryTables([]);
    } else {
      // Toggle secondary table
      const isAlreadySecondary = secondaryTables.some(t => t.tableId === table.tableId);
      if (isAlreadySecondary) {
        setSecondaryTables(secondaryTables.filter(t => t.tableId !== table.tableId));
      } else {
        setSecondaryTables([...secondaryTables, table]);
      }
    }
  };

  const handleMerge = async () => {
    if (!primaryTable) {
      showError("Chưa chọn bàn chính", "Vui lòng chọn bàn chính (bàn gộp vào).");
      return;
    }
    if (secondaryTables.length === 0) {
      showError("Chưa chọn bàn gộp", "Vui lòng chọn ít nhất một bàn để gộp vào bàn chính.");
      return;
    }

    try {
      await orderApi.mergeOrders({
        primaryOrderId: primaryTable.currentOrder!.orderId,
        secondaryOrderIds: secondaryTables.map(t => t.currentOrder!.orderId)
      });

      showSuccess("Thành công", `Đã gộp ${secondaryTables.length} bàn vào bàn ${primaryTable.tableName || primaryTable.tableCode}`);

      setPrimaryTable(null);
      setSecondaryTables([]);
      fetchData();
    } catch (error: any) {
      console.error("Merge failed:", error);
      showError("Lỗi gộp bàn", error.message || "Có lỗi xảy ra khi gộp bàn.");
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
          <h1 className={styles.pageTitle}>Gộp hóa đơn / Gộp bàn</h1>
          <p className={styles.pageSubtitle}>
            Gộp nhiều bàn đang dùng chung thành một hóa đơn duy nhất
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
                const isPrimary = primaryTable?.tableId === table.tableId;
                const isSecondary = secondaryTables.some(t => t.tableId === table.tableId);
                
                let opacity = 1;
                let border = '1px solid #e2e8f0';
                let bg = 'white';
                
                if (!canBeMerged(table)) {
                  opacity = 0.4;
                } else if (isPrimary) {
                  border = '3px solid #3b82f6';
                  bg = '#eff6ff';
                } else if (isSecondary) {
                  border = '3px solid #f97316';
                  bg = '#fff7ed';
                }

                return (
                  <div
                    key={table.tableId}
                    className={styles.tableCard}
                    style={{
                      cursor: canBeMerged(table) ? "pointer" : "not-allowed",
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

                    {isPrimary && <div style={{ background: '#3b82f6', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>BÀN CHÍNH</div>}
                    {isSecondary && <div style={{ background: '#f97316', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>BÀN GỘP (+1)</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <div className={styles.card} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <Layers size={18} color="#3b82f6" />
                <h3 style={{ margin: 0 }}>Tiến hành gộp hóa đơn</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  backgroundColor: primaryTable ? '#eff6ff' : '#f8fafc',
                  border: primaryTable ? '2px solid #3b82f6' : '2px dashed #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>BÀN CHÍNH (Sẽ giữ lại hóa đơn)</div>
                  {primaryTable ? (
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e40af' }}>{primaryTable.tableName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>{primaryTable.currentOrder?.customerName || 'Khách lẻ'}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Chạm vào 1 bàn đang có khách làm bàn chính</div>
                  )}
                </div>

                <div style={{ textAlign: 'center', fontSize: '1.5rem', color: '#cbd5e1' }}>+</div>

                <div style={{ 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  backgroundColor: secondaryTables.length > 0 ? '#fff7ed' : '#f8fafc',
                  border: secondaryTables.length > 0 ? '2px solid #f97316' : '2px dashed #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>CÁC BÀN GỘP (Sẽ dồn món sang bàn chính)</div>
                  {secondaryTables.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {secondaryTables.map(t => (
                        <div key={t.tableId} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c2410c', background: '#ffe4e6', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          {t.tableName}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Chạm vào các bàn khác để gộp vào bàn chính</div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  <button 
                    className={styles.btnPrimary} 
                    style={{ padding: '0.85rem', fontSize: '0.9rem', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', border: 'none' }}
                    onClick={handleMerge}
                  >
                    Xác nhận gộp hóa đơn
                  </button>
                  <button 
                    className={styles.btnSecondary}
                    onClick={() => { setPrimaryTable(null); setSecondaryTables([]); }}
                  >
                    Làm mới lựa chọn
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
