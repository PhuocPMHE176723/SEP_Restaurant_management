"use client";

import { useState, useEffect } from "react";
import { orderApi, OrderResponse, OrderItemResponse } from "../../lib/api/order";
import { kitchenApi } from "../../lib/api/kitchen";
import { getIngredients, createManualAdjustment } from "../../lib/api/warehouse";
import styles from "./Kitchen.module.css";
import { showSuccess, showError } from "../../lib/ui/alerts";

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<OrderItemResponse | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<{ ingredientId: number, quantity: number }[]>([]);

  useEffect(() => {
    fetchQueue();
    fetchIngredients();
    const interval = setInterval(fetchQueue, 5000); // 5s refresh
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const allOrders = await orderApi.getAllOrders();
      setOrders(allOrders);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch kitchen queue:", error);
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

  // Lọc các đơn hàng đang chờ hoặc đang chế biến
  const activeOrders = orders.filter(o => 
    (o.status === "SENT_TO_KITCHEN" || o.status === "OPEN") && 
    o.orderItems.some(i => i.status !== "SERVED" && i.status !== "CANCELLED")
  );

  const handleUpdateItemStatus = async (orderItemId: number, status: string, item?: OrderItemResponse) => {
    try {
      if (status === "COOKING") {
        await kitchenApi.startCooking(orderItemId);
      } else if (status === "SERVED") {
        await kitchenApi.serveItem(orderItemId);
      } else {
        await orderApi.updateOrderItemStatus(orderItemId, status);
      }
      
      if (status === "SERVED" && item) {
        showSuccess(`Đã hoàn thành: ${item.itemNameSnapshot}`);
        // Only show modal if needed manually, or just refresh
      }
      
      await fetchQueue();
    } catch (error) {
      showError("Cập nhật trạng thái thất bại");
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await orderApi.updateOrderStatus(orderId, { status });
      await fetchQueue();
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
          note: `Sử dụng cho món: ${currentItem?.itemNameSnapshot} (Tự động trừ từ bếp)`
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
        <h1 className={styles.tableName} style={{ fontSize: '2rem' }}>Bảng điều hành nhà bếp</h1>
        <p style={{ color: '#64748b' }}>Quản lý danh sách các món ăn đang được yêu cầu chế biến</p>
      </div>

      <div className={styles.kitchenGrid} style={{ marginTop: '2rem' }}>
        {activeOrders.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍🍳</div>
            <h3>Hiện không có yêu cầu nào</h3>
            <p>Khi có yêu cầu mới từ nhân viên hoặc khách hàng, chúng sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          activeOrders.map((order) => (
            <div key={order.orderId} className={styles.orderCard}>
              <div className={styles.cardHeader}>
                <div className={styles.tableInfo}>
                  <h3 className={styles.tableName}>
                    {order.orderType === "TAKEAWAY" ? (
                      <span style={{ color: '#f59e0b' }}>🛍️ Mang về</span>
                    ) : (
                      `Bàn: ${order.tableName || "Tại quán"}`
                    )}
                  </h3>
                  <span className={styles.orderTime}>🕒 {new Date(order.openedAt).toLocaleTimeString()}</span>
                </div>
                <span className={`${styles.statusBadge} ${order.status === "OPEN" ? styles.statusOpen : styles.statusKitchen}`}>
                  <span style={{ marginRight: '4px' }}>{order.status === "OPEN" ? "●" : "⚡"}</span>
                  {order.status === "OPEN" ? "MỚI" : "ĐANG CHẾ BIẾN"}
                </span>
              </div>
              
              <div className={styles.cardBody}>
                <ul className={styles.itemList}>
                  {order.orderItems.map((item) => {
                    const status = item.status || "PENDING";
                    if (status === "SERVED" || status === "CANCELLED") return null;
                    
                    return (
                      <li key={item.orderItemId} className={`${styles.itemRow} ${status === "COOKING" ? styles.itemRowCooking : styles.itemRowPending}`}>
                        <div className={styles.itemQty}>{item.quantity}</div>
                        <div className={styles.itemMain}>
                          <div className={styles.itemName}>
                            {item.itemNameSnapshot}
                            {status === "COOKING" && <span style={{ fontSize: '0.8rem', color: '#0ea5e9', marginLeft: '8px' }}>⚡ Đang nấu...</span>}
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
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                className={`${styles.actionBtn} ${styles.btnDone}`} 
                                title="Hoàn thành"
                                onClick={() => handleUpdateItemStatus(item.orderItemId, "SERVED", item)}
                              >
                                ✓
                              </button>
                              <button 
                                className={`${styles.actionBtn} ${styles.btnOutline}`} 
                                style={{ width: '36px', height: '36px', fontSize: '0.9rem', padding: 0 }}
                                title="Điều chỉnh nguyên liệu"
                                onClick={() => {
                                  setCurrentItem(item);
                                  setShowIngredientModal(true);
                                  setSelectedIngredients([]);
                                }}
                              >
                                ⚙️
                              </button>
                            </div>
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
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ingredient Deduction Modal */}
      {showIngredientModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Điều chỉnh nguyên liệu tiêu hao</h2>
              <button style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowIngredientModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                Sử dụng để ghi nhận các nguyên liệu dùng thêm hoặc thay thế cho món ăn này.
              </p>
              <p style={{ marginBottom: '1rem', fontWeight: 700 }}>Món: <span style={{ color: '#f97316' }}>{currentItem?.itemNameSnapshot}</span></p>
              
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
                          min={0}
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
