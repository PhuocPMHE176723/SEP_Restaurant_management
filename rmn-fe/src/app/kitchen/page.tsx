"use client";

import { useState, useEffect } from "react";
import { orderApi, OrderResponse } from "../../lib/api/order";
import styles from "../manager/manager.module.css";

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Tự động làm mới mỗi 30 giây
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderApi.getAllOrders();
      // Chỉ lấy các order có món cần nấu (SENT_TO_KITCHEN)
      setOrders(data.filter(o => o.status === "SENT_TO_KITCHEN" || o.status === "OPEN"));
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await orderApi.updateOrderStatus(orderId, { status });
      await fetchOrders();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Cập nhật trạng thái thất bại");
    }
  };

  if (loading) return <div className={styles.spinner} />;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Hàng chờ chế biến</h1>
          <p className={styles.pageSubtitle}>Danh sách các đơn hàng cần chuẩn bị món</p>
        </div>
        <button className="btn btn-primary" onClick={fetchOrders}>Làm mới</button>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))" }}>
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Hiện không có yêu cầu nào</h3>
            <p>Khi nhân viên gửi thông tin món ăn xuống bếp, chúng sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.orderId} className={styles.card} style={{ borderLeft: "5px solid #f59e0b" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>Bàn: {order.tableName || "N/A"}</h3>
                <span className={styles.badgeActive} style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>{order.status}</span>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Mã đơn: {order.orderCode}</p>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Giờ mở: {new Date(order.openedAt).toLocaleTimeString()}</p>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>Thông tin món:</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {order.orderItems.map((item) => (
                    <li key={item.orderItemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #f1f5f9' }}>
                      <span>
                        <strong>{item.quantity}x</strong> {item.menuItemName}
                        {item.note && <div style={{ fontSize: '0.75rem', color: '#f97316', marginTop: '0.2rem' }}>📝 {item.note}</div>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => handleUpdateStatus(order.orderId, "SERVED")}
                >
                  Hoàn tất & Trả món
                </button>
                <button 
                  className="btn btn-ghost" 
                  style={{ border: '1px solid #e2e8f0' }}
                  onClick={() => handleUpdateStatus(order.orderId, "CANCELLED")}
                >
                  Hủy đơn
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
