"use client";

import { useState, useEffect } from "react";
import { orderApi, OrderResponse, OrderItemResponse } from "../../lib/api/order";
import { getIngredients, createManualAdjustment } from "../../lib/api/warehouse";
import styles from "./Kitchen.module.css";
import { showSuccess, showError, showWarning } from "../../lib/ui/alerts";

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<OrderItemResponse | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<{ ingredientId: number, quantity: number }[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  useEffect(() => {
    fetchOrders();
    fetchIngredients();
    const interval = setInterval(fetchOrders, 10000); // Làm mới mỗi 10 giây cho nhà bếp
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderApi.getAllOrders();
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const data = await getIngredients();
      setIngredients(data.filter((i: any) => i.isActive));
    } catch (error) {
      console.error("Failed to fetch ingredients:", error);
    }
  };

  // Lọc các đơn hàng đang chờ cho tab "Đang chế biến"
  const activeOrders = orders.filter(o => 
    (o.status === "SENT_TO_KITCHEN" || o.status === "OPEN") && 
    o.orderItems.some(i => i.status !== "SERVED" && i.status !== "CANCELLED")
  );

  // Lấy tất cả các món đã xong cho tab "Lịch sử"
  const historyItems: { item: OrderItemResponse, tableName: string, orderId: number }[] = [];
  orders.forEach(o => {
    o.orderItems.forEach(i => {
      if (i.status === "SERVED") {
        historyItems.push({ item: i, tableName: o.tableName || "Mang về", orderId: o.orderId });
      }
    });
  });
  // Sắp xếp lịch sử (giả định món sau cùng trong mảng là món mới nhất)
  const sortedHistory = [...historyItems].reverse().slice(0, 50);

  const handleUpdateItemStatus = async (orderItemId: number, status: string, item?: OrderItemResponse) => {
    try {
      await orderApi.updateOrderItemStatus(orderItemId, status);
      
      // Nếu là hoàn tất món (SERVED), mở modal trừ nguyên liệu
      if (status === "SERVED" && item) {
        setCurrentItem(item);
        setShowIngredientModal(true);
        setSelectedIngredients([]); // Reset
      }
      
      await fetchOrders();
    } catch (error) {
      showError("Cập nhật trạng thái thất bại");
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await orderApi.updateOrderStatus(orderId, { status });
      await fetchOrders();
      showSuccess("Đã cập nhật trạng thái đơn hàng");
    } catch (error) {
      showError("Cập nhật thất bại");
    }
  };

  const handleDeductIngredients = async () => {
    try {
      if (selectedIngredients.length === 0) {
        setShowIngredientModal(false);
        return;
      }

      for (const item of selectedIngredients) {
        await createManualAdjustment({
          ingredientId: item.ingredientId,
          movementType: "OUT",
          quantity: item.quantity,
          note: `Sử dụng cho món: ${currentItem?.menuItemName} (Tự động trừ từ bếp)`
        });
      }
      
      showSuccess("Đã trừ nguyên liệu vào kho");
      setShowIngredientModal(false);
    } catch (error) {
      showError("Trừ nguyên liệu thất bại");
    }
  };

  const toggleIngredient = (id: number) => {
    if (selectedIngredients.find(i => i.ingredientId === id)) {
      setSelectedIngredients(selectedIngredients.filter(i => i.ingredientId !== id));
    } else {
      setSelectedIngredients([...selectedIngredients, { ingredientId: id, quantity: 1 }]);
    }
  };

  const updateQty = (id: number, qty: number) => {
    setSelectedIngredients(selectedIngredients.map(i => 
      i.ingredientId === id ? { ...i, quantity: qty } : i
    ));
  };

  if (loading) return <div className={styles.spinner} />;

  return (
    <div className={styles.pageContainer}>
      <div style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
        <h1 className={styles.tableName} style={{ fontSize: '2rem' }}>Thanh điều hành nhà bếp</h1>
        <p style={{ color: '#64748b' }}>Quản lý danh sách món ăn cần chuẩn bị và xem lại lịch sử chế biến</p>
      </div>

      <div className={styles.tabContainer}>
        <div 
          className={`${styles.tabItem} ${activeTab === 'active' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Đang chế biến ({activeOrders.length})
        </div>
        <div 
          className={`${styles.tabItem} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Lịch sử món đã xong
        </div>
      </div>

      {activeTab === 'active' ? (
        <div className={styles.kitchenGrid}>
          {activeOrders.length === 0 ? (
            <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🍳</div>
              <h3>Hiện không có yêu cầu nào</h3>
              <p>Khi nhân viên gửi thông tin món ăn xuống bếp, chúng sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <div key={order.orderId} className={styles.orderCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.tableInfo}>
                    <h3 className={styles.tableName}>Bàn: {order.tableName || "Mang về"}</h3>
                    <span className={styles.orderTime}>🕒 Nhận lúc: {new Date(order.openedAt).toLocaleTimeString()}</span>
                  </div>
                  <span className={`${styles.statusBadge} ${order.status === "OPEN" ? styles.statusOpen : styles.statusKitchen}`}>
                    {order.status === "OPEN" ? "ĐANG CHỜ" : "ĐÃ GỬI BẾP"}
                  </span>
                </div>
                
                <div className={styles.cardBody}>
                  <ul className={styles.itemList}>
                    {order.orderItems.map((item) => {
                      const status = item.status || "PENDING";
                      if (status === "SERVED" || status === "CANCELLED") return null;
                      
                      return (
                        <li key={item.orderItemId} className={`${styles.itemRow} ${status === "COOKING" ? styles.itemRowCooking : status === "SERVED" ? styles.itemRowServed : styles.itemRowPending}`}>
                          <div className={styles.itemQty}>{item.quantity}</div>
                          <div className={styles.itemMain}>
                            <div className={styles.itemName}>
                              {item.menuItemName}
                              {status === "COOKING" && <span style={{ fontSize: '0.8rem', color: '#0ea5e9' }}>⚡ Đang nấu...</span>}
                              {status === "SERVED" && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>✅ Đã xong</span>}
                            </div>
                            {item.note && <div className={styles.itemNote}>📝 {item.note}</div>}
                          </div>
                          
                          <div className={styles.itemActions}>
                            {status === "PENDING" && (
                              <button 
                                className={`${styles.actionBtn} ${styles.btnCook}`} 
                                title="Bắt đầu nấu"
                                onClick={() => handleUpdateItemStatus(item.orderItemId, "COOKING")}
                              >
                                🔥
                              </button>
                            )}
                            {(status === "PENDING" || status === "COOKING") && (
                              <button 
                                className={`${styles.actionBtn} ${styles.btnDone}`} 
                                title="Hoàn thành"
                                onClick={() => handleUpdateItemStatus(item.orderItemId, "SERVED", item)}
                              >
                                ✔️
                              </button>
                            )}
                            {status !== "SERVED" && (
                              <button 
                                className={`${styles.actionBtn} ${styles.btnCancel}`} 
                                title="Hủy món"
                                onClick={() => handleUpdateItemStatus(item.orderItemId, "CANCELLED")}
                              >
                                ✖️
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className={styles.cardFooter}>
                  <button 
                    className={`${styles.footerBtn} ${styles.btnPrimary}`}
                    onClick={() => handleUpdateOrderStatus(order.orderId, "SERVED")}
                  >
                    Hoàn tất cả bàn
                  </button>
                  <button 
                    className={`${styles.footerBtn} ${styles.btnOutline}`}
                    onClick={() => handleUpdateOrderStatus(order.orderId, "CANCELLED")}
                  >
                    Hủy đơn
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className={styles.historyContainer}>
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
                            <div className={styles.historyName}>{h.item.menuItemName}</div>
                            {h.item.note && <div className={styles.itemNote}>📝 {h.item.note}</div>}
                        </div>
                        <div><span className={styles.historyTable}>{h.tableName}</span></div>
                        <div className={styles.historyTime}>✅ Đã hoàn tất</div>
                    </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Ingredient Deduction Modal */}
      {showIngredientModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Xuất nguyên liệu cho món</h2>
              <button style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowIngredientModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Món: <span style={{ color: '#f97316' }}>{currentItem?.menuItemName}</span></p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Chọn nguyên liệu đã sử dụng để trừ kho chính xác:</p>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {ingredients.map(ing => {
                  const selected = selectedIngredients.find(si => si.ingredientId === ing.ingredientId);
                  return (
                    <div key={ing.ingredientId} className={styles.ingredientItem} style={{ border: selected ? '1px solid #f97316' : '1px solid transparent' }}>
                      <input 
                        type="checkbox" 
                        checked={!!selected} 
                        onChange={() => toggleIngredient(ing.ingredientId)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div className={styles.ingredientName}>{ing.ingredientName} ({ing.unit})</div>
                      {selected && (
                        <input 
                          type="number" 
                          className={styles.ingredientInput}
                          value={selected.quantity}
                          min={0.1}
                          step={0.1}
                          onChange={(e) => updateQty(ing.ingredientId, parseFloat(e.target.value))}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.footerBtn} ${styles.btnOutline}`} onClick={() => setShowIngredientModal(false)}>Bỏ qua</button>
              <button className={`${styles.footerBtn} ${styles.btnPrimary}`} onClick={handleDeductIngredients}>Xác nhận & Trừ kho</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
