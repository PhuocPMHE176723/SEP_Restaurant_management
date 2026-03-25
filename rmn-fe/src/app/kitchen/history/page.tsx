"use client";

import { useState, useEffect } from "react";
import { orderApi, OrderResponse, OrderItemResponse } from "../../../lib/api/order";
import styles from "../Kitchen.module.css";

export default function KitchenHistoryPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // 30s refresh for history
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const allOrders = await orderApi.getAllOrders();
      setOrders(allOrders);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setLoading(false);
    }
  };

  // Lấy tất cả các món đã xong cho tab "Lịch sử"
  const historyItems: { item: OrderItemResponse, tableName: string, orderId: number }[] = [];
  orders.forEach(o => {
    o.orderItems.forEach(i => {
      if (i.status === "SERVED") {
        historyItems.push({ item: i, tableName: o.tableName || "Mang về", orderId: o.orderId });
      }
    });
  });
  
  const sortedHistory = [...historyItems].reverse();

  if (loading) return <div className={styles.spinner} />;

  return (
    <div className={styles.pageContainer}>
      <div style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
        <h1 className={styles.tableName} style={{ fontSize: '2rem' }}>Lịch sử chế biến</h1>
        <p style={{ color: '#64748b' }}>Danh sách các món ăn đã hoàn thành phục vụ</p>
      </div>

      <div className={styles.historyContainer} style={{ marginTop: '2rem' }}>
        <div className={styles.historyList}>
          <div className={styles.historyItem} style={{ background: '#f1f5f9', fontWeight: 800 }}>
              <div>SL</div>
              <div>Tên món</div>
              <div>Vị trí</div>
              <div style={{ textAlign: 'right' }}>Trạng thái</div>
          </div>
          {sortedHistory.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Chưa có món nào được hoàn thành</div>
          ) : (
              sortedHistory.map((h, idx) => (
                  <div key={idx} className={styles.historyItem}>
                      <div className={styles.itemQty} style={{ background: '#dcfce7', color: '#166534' }}>{h.item.quantity}</div>
                      <div>
                          <div className={styles.historyName}>{h.item.itemNameSnapshot}</div>
                          {h.item.note && <div className={styles.itemNote}>📝 {h.item.note}</div>}
                      </div>
                      <div><span className={styles.historyTable}>{h.tableName}</span></div>
                      <div className={styles.historyTime}>✅ Đã hoàn tất</div>
                  </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
