"use client";

import { useState, useEffect } from "react";
import { orderApi, OrderResponse, OrderItemResponse } from "../../../lib/api/order";
import styles from "../Kitchen.module.css";
import { Search, RotateCcw } from "lucide-react";

export default function KitchenHistoryPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
  const historyItems: { item: OrderItemResponse, tableName: string, orderId: number, orderTime: string }[] = [];
  orders.forEach(o => {
    o.orderItems.forEach(i => {
      if (i.status === "SERVED") {
        historyItems.push({ 
          item: i, 
          tableName: o.tableName || "Mang về", 
          orderId: o.orderId,
          orderTime: o.openedAt 
        });
      }
    });
  });
  
  const filteredHistory = historyItems
    .filter(h => {
      const matchesSearch = 
        h.item.itemNameSnapshot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.tableName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const itemDate = new Date(h.orderTime).toISOString().split('T')[0];
      const matchesStart = !startDate || itemDate >= startDate;
      const matchesEnd = !endDate || itemDate <= endDate;
      
      return matchesSearch && matchesStart && matchesEnd;
    })
    .reverse();

  if (loading) return <div className={styles.spinner} />;

  return (
    <div className={styles.pageContainer}>
      <div style={{ padding: '0 1.5rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ fontSize: '2rem' }}>Lịch sử chế biến</h1>
          <p className={styles.pageSubtitle}>Danh sách các món ăn đã hoàn thành phục vụ</p>
        </div>
      </div>

      <div style={{ padding: '0 1.5rem', marginTop: '1.5rem' }}>
        <div className={styles.card}>
          <div className={styles.controlBar}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label className={styles.label}>Tìm kiếm món ăn / bàn</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className={styles.input} 
                  style={{ paddingLeft: '40px' }}
                  placeholder="Nhập tên món hoặc số bàn..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div style={{ width: '180px' }}>
              <label className={styles.label}>Từ ngày</label>
              <input 
                type="date" 
                className={styles.input} 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ width: '180px' }}>
              <label className={styles.label}>Đến ngày</label>
              <input 
                type="date" 
                className={styles.input} 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button 
              className={styles.btnPrimary} 
              onClick={() => {
                setSearchTerm("");
                setStartDate("");
                setEndDate("");
              }}
              style={{ background: '#f1f5f9', color: '#475569', boxShadow: 'none' }}
            >
              <RotateCcw size={16} /> Đặt lại
            </button>
          </div>
        </div>
      </div>

      <div className={styles.historyContainer} style={{ marginTop: '2rem' }}>
        <div className={styles.historyList}>
          <div className={`${styles.historyItem} ${styles.historyHeader}`} style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontWeight: 700 }}>
              <div>SL</div>
              <div>Tên món</div>
              <div>Bàn / Vị trí</div>
              <div style={{ textAlign: 'right' }}>Trạng thái</div>
          </div>
          {filteredHistory.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                Không tìm thấy món nào phù hợp
              </div>
          ) : (
              filteredHistory.map((h, idx) => (
                  <div key={idx} className={styles.historyItem}>
                      <div><div className={styles.itemQty}>{h.item.quantity}</div></div>
                      <div>
                          <div className={styles.historyName}>{h.item.itemNameSnapshot}</div>
                          {h.item.note && <div className={styles.itemNote}>📝 {h.item.note}</div>}
                      </div>
                      <div><span className={styles.historyTable}>{h.tableName}</span></div>
                      <div className={styles.historyTime}>
                        <span className={`${styles.statusBadge} ${styles.statusOpen}`}>
                          <span style={{ marginRight: '4px' }}>✓</span> Đã hoàn tất
                        </span>
                      </div>
                  </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
