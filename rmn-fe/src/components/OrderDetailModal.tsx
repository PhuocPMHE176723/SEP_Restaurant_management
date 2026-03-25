"use client";

import { useState, useEffect } from "react";
import { orderApi, OrderResponse } from "../lib/api/order";
import { getMenuItems } from "../lib/api/client";
import type { MenuItem } from "../types/models";
import styles from "../app/manager/manager.module.css";
import { showSuccess, showError } from "../lib/ui/alerts";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onOrderUpdate?: () => void;
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  orderId,
  onOrderUpdate,
}: OrderDetailModalProps) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchMenu, setSearchMenu] = useState("");
  const [addingItem, setAddingItem] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
      fetchMenu();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await orderApi.getOrder(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      showError("Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const data = await getMenuItems();
      setMenuItems(data);
    } catch (error) {
      console.error("Failed to fetch menu:", error);
    }
  };

  const handleAddItem = async (menuItem: MenuItem) => {
    if (!orderId || !menuItem.itemId) return;
    try {
      setAddingItem(menuItem.itemId);
      await orderApi.addOrderItem(orderId, {
        menuItemId: menuItem.itemId,
        quantity: 1,
        note: "",
      });
      showSuccess(`Đã thêm ${menuItem.itemName || "món"}`);
      fetchOrderDetails();
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      showError("Thêm món thất bại");
    } finally {
      setAddingItem(null);
    }
  };

  if (!isOpen) return null;

  const filteredMenu = menuItems.filter(item => 
    (item.itemName || "").toLowerCase().includes(searchMenu.toLowerCase())
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Chi tiết đơn hàng: {order?.orderCode}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {loading && !order ? (
            <div className={styles.spinner} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: showAddMenu ? '1fr 1fr' : '1fr', gap: '2rem' }}>
              {/* Order Items List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Món đã gọi</h3>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                  >
                    {showAddMenu ? "← Quay lại" : "+ Gọi thêm món"}
                  </button>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table} style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>Tên món</th>
                        <th className={styles.colNarrow}>SL</th>
                        <th className={styles.colNarrow}>Trạng thái</th>
                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
                        <th style={{ textAlign: 'center' }}>Xác nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order?.orderItems.map((item) => (
                        <tr key={item.orderItemId}>
                          <td>
                            <div>{item.itemNameSnapshot || "Món không tên"}</div>
                            {item.note && <div style={{ fontSize: '0.75rem', color: '#f97316' }}>{item.note}</div>}
                          </td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td>
                            <span style={{ 
                                fontSize: '0.7rem', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                backgroundColor: item.status === 'SERVED' ? '#dcfce7' : item.status === 'COOKING' ? '#e0f2fe' : item.status === 'WAIT_CONFIRM' ? '#ffe4e6' : '#fef3c7',
                                color: item.status === 'SERVED' ? '#166534' : item.status === 'COOKING' ? '#0369a1' : item.status === 'WAIT_CONFIRM' ? '#9f1239' : '#92400e'
                            }}>
                                {item.status === 'SERVED' ? 'Xong' : item.status === 'COOKING' ? 'Đang nấu' : item.status === 'WAIT_CONFIRM' ? 'Khách chọn' : 'Chờ'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.status === 'WAIT_CONFIRM' && (
                              <button 
                                className="btn btn-success btn-sm"
                                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                onClick={async () => {
                                  if (!orderId) return;
                                  try {
                                    await orderApi.confirmItems(orderId, [item.orderItemId]);
                                    showSuccess("Đã xác nhận món");
                                    fetchOrderDetails();
                                    if (onOrderUpdate) onOrderUpdate();
                                  } catch (e) {
                                    showError("Xác nhận thất bại");
                                  }
                                }}
                              >
                                Duyệt
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{ fontWeight: 700, textAlign: 'right', padding: '1rem' }}>Tổng cộng:</td>
                        <td style={{ fontWeight: 700, textAlign: 'right', color: '#f97316', fontSize: '1.1rem' }}>
                          {order?.totalAmount.toLocaleString('vi-VN')}đ
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {order?.orderItems.some(i => i.status === 'WAIT_CONFIRM') && (
                  <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                    <button 
                      className="btn btn-success"
                      onClick={async () => {
                        if (!orderId || !order) return;
                        const ids = order.orderItems.filter(i => i.status === 'WAIT_CONFIRM').map(i => i.orderItemId);
                        try {
                          await orderApi.confirmItems(orderId, ids);
                          showSuccess(`Đã xác nhận ${ids.length} món`);
                          fetchOrderDetails();
                          if (onOrderUpdate) onOrderUpdate();
                        } catch (e) {
                          showError("Xác nhận thất bại");
                        }
                      }}
                    >
                      Duyệt tất cả món khách chọn
                    </button>
                  </div>
                )}
              </div>

              {/* Menu Selection Side Panel */}
              {showAddMenu && (
                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.5rem', animation: 'fadeIn 0.3s' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', marginBottom: '1rem' }}>Thực đơn</h3>
                  <div className={styles.searchBox} style={{ marginBottom: '1rem' }}>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="Tìm món..." 
                      value={searchMenu}
                      onChange={(e) => setSearchMenu(e.target.value)}
                    />
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredMenu.map((item, index) => (
                      <div key={item.itemId || index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.75rem', 
                        backgroundColor: '#f8fafc', 
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.itemName || "Món không tên"}</div>
                          <div style={{ color: '#f97316', fontSize: '0.8rem', fontWeight: 700 }}>{(item.basePrice || 0).toLocaleString('vi-VN')}đ</div>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ padding: '4px 12px' }}
                          disabled={item.itemId ? addingItem === item.itemId : true}
                          onClick={() => handleAddItem(item)}
                        >
                          {item.itemId && addingItem === item.itemId ? "..." : "Thêm"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className="btn btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
