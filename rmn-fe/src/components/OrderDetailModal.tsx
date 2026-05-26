"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { orderApi, OrderResponse } from "../lib/api/order";
import { getMenuItems, getCategories } from "../lib/api/client";
import type { MenuItem } from "../types/models";
import styles from "../app/manager/manager.module.css";
import { showSuccess, showError } from "../lib/ui/alerts";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onOrderUpdate?: () => void;
  filterStatus?: string;
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  orderId,
  onOrderUpdate,
  filterStatus = "ALL",
}: OrderDetailModalProps) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchMenu, setSearchMenu] = useState("");
  const [addingItem, setAddingItem] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number>("all");

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
      fetchMenu();
      fetchCategoriesList();
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

  const fetchCategoriesList = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
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

  const filteredMenu = menuItems.filter((item) => {
    const matchSearch = (item.itemName || "").toLowerCase().includes(searchMenu.toLowerCase());
    const matchCategory = selectedCategoryId === "all" || String(item.categoryId) === String(selectedCategoryId);
    return matchSearch && matchCategory;
  });

  const displayItems = order?.orderItems.filter(item => {
    const s = item.status?.toUpperCase();
    if (filterStatus === "SENT_TO_KITCHEN") {
      return s === "PENDING" || s === "COOKING" || s === "WAIT_CONFIRM";
    }
    if (filterStatus === "SERVED") {
      return s === "SERVED";
    }
    return true;
  }) || [];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: showAddMenu ? "1100px" : "560px",
          width: "95%",
          minWidth: showAddMenu ? "900px" : "450px",
          borderRadius: "28px",
          overflow: "hidden",
          transition: "all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
        }}
      >
        <div
          className={styles.modalHeader}
          style={{
            background: "linear-gradient(to right, #f8fafc, #ffffff)",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div>
            <h2
              className={styles.modalTitle}
              style={{
                color: "#0f172a",
                fontWeight: 800,
                fontSize: "1.1rem",
                marginBottom: "2px",
              }}
            >
              Chi tiết đơn hàng
            </h2>
            <div
              style={{ color: "#f97316", fontWeight: 700, fontSize: "0.85rem" }}
            >
              {order?.orderCode}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {order?.status !== "CLOSED" && order?.status !== "CANCELLED" && (
              <button
                className={styles.btnAdd}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.85rem",
                  height: "auto",
                }}
                onClick={() => setShowAddMenu(!showAddMenu)}
              >
                {showAddMenu ? "← Quay lại" : "+ Gọi thêm món"}
              </button>
            )}
            <button
              className={styles.closeBtn}
              onClick={onClose}
              style={{ fontSize: "1.5rem" }}
            >
              ×
            </button>
          </div>
        </div>

        <div className={styles.modalBody} style={{ padding: "1.25rem" }}>
          {loading && !order ? (
            <div className={styles.spinner} />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: showAddMenu ? "1fr 1.5fr" : "1fr",
                gap: "2rem",
              }}
            >
              {/* Order Items List */}
              <div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      color: "#475569",
                      fontWeight: 700,
                    }}
                  >
                    Món đã gọi
                  </h3>
                </div>

                <div
                  className={styles.tableWrap}
                  style={{
                    marginBottom: 0,
                    overflow: "hidden",
                    borderRadius: "20px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <table
                    className={styles.table}
                    style={{
                      fontSize: "0.9rem",
                      minWidth: "auto",
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={{ width: "45%" }}>Tên món</th>
                        <th
                          className={styles.colNarrow}
                          style={{ width: "50px", textAlign: "center" }}
                        >
                          SL
                        </th>
                        <th
                          className={styles.colNarrow}
                          style={{ width: "90px", textAlign: "center" }}
                        >
                          Trạng thái
                        </th>
                        <th style={{ width: "110px", textAlign: "right" }}>
                          Thành tiền
                        </th>
                        {/* {order?.status !== "CLOSED" &&
                          order?.status !== "CANCELLED" &&
                          order?.orderItems.some(
                            (i) => i.status === "WAIT_CONFIRM",
                          ) && (
                            <th style={{ textAlign: "center", width: "80px" }}>
                              Duyệt
                            </th>
                          )} */}
                        {order?.status !== "CLOSED" &&
                          order?.status !== "CANCELLED" && (
                            <th style={{ textAlign: "center", width: "80px" }}>
                              Xoá
                            </th>
                          )}
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.map((item) => (
                        <tr key={item.orderItemId}>
                          <td>
                            <div>
                              {item.itemNameSnapshot || "Món không tên"}
                            </div>
                            {item.note && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#f97316",
                                }}
                              >
                                {item.note}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {item.quantity}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span
                              className={`${styles.statusBadge} ${
                                item.status === "SERVED"
                                  ? styles.statusPublished
                                  : item.status === "COOKING"
                                    ? styles.statusPending
                                    : item.status === "WAIT_CONFIRM"
                                      ? styles.statusCancelled
                                      : styles.statusDefault
                              }`}
                              style={{
                                padding: "0.25rem 0.6rem",
                                fontSize: "0.65rem",
                              }}
                            >
                              {item.status === "SERVED"
                                ? "Đã lên món"
                                : item.status === "COOKING"
                                  ? "Đang nấu"
                                  : item.status === "WAIT_CONFIRM"
                                    ? "Chờ duyệt"
                                    : "Chờ"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {(item.quantity * item.unitPrice).toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </td>
                          {/* {order?.status !== "CLOSED" &&
                            order?.status !== "CANCELLED" &&
                            order?.orderItems.some(
                              (i) => i.status === "WAIT_CONFIRM",
                            ) && (
                              <td style={{ textAlign: "center" }}>
                                {item.status === "WAIT_CONFIRM" && (
                                  <button
                                    className="btn btn-success btn-sm"
                                    style={{
                                      padding: "2px 8px",
                                      fontSize: "0.75rem",
                                    }}
                                    onClick={async () => {
                                      if (!orderId) return;
                                      try {
                                        await orderApi.confirmItems(orderId, [
                                          item.orderItemId,
                                        ]);
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
                            )} */}
                          {order?.status !== "CLOSED" &&
                            order?.status !== "CANCELLED" && (
                              <td style={{ textAlign: "center" }}>
                                {(item.status === "PENDING" ||
                                  item.status === "COOKING" ||
                                  (item.status === "SERVED" &&
                                    item.itemType === "READY")) && (
                                    <button
                                      className="btn btn-danger btn-sm"
                                      style={{
                                        padding: "2px 8px",
                                        fontSize: "0.75rem",
                                      }}
                                      onClick={async () => {
                                        if (!orderId) return;
                                        const confirmed = await Swal.fire({
                                          title: "Xoá món này?",
                                          text: "Món chưa hoàn thành sẽ bị loại khỏi tổng tiền.",
                                          icon: "warning",
                                          showCancelButton: true,
                                          confirmButtonColor: "#ef4444",
                                          cancelButtonColor: "#64748b",
                                          confirmButtonText: "Xoá",
                                          cancelButtonText: "Huỷ",
                                        });
                                        if (!confirmed.isConfirmed) return;
                                        try {
                                          await orderApi.removeOrderItem(
                                            item.orderItemId,
                                          );
                                          showSuccess("Đã xoá món");
                                          fetchOrderDetails();
                                          if (onOrderUpdate) onOrderUpdate();
                                        } catch (e) {
                                          showError("Xoá món thất bại");
                                        }
                                      }}
                                    >
                                      Xoá
                                    </button>
                                  )}
                              </td>
                            )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ background: "#f8fafc" }}>
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            fontWeight: 800,
                            textAlign: "right",
                            padding: "0.65rem 0.85rem",
                            color: "#64748b",
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          TỔNG CỘNG:
                        </td>
                        <td
                          style={{
                            fontWeight: 800,
                            textAlign: "right",
                            color: "#ea580c",
                            fontSize: "1.1rem",
                            padding: "0.65rem 0.85rem",
                          }}
                        >
                          {order?.totalAmount.toLocaleString("vi-VN")}đ
                        </td>
                        {order?.status !== "CLOSED" &&
                          order?.status !== "CANCELLED" &&
                          order?.orderItems.some(
                            (i) => i.status === "WAIT_CONFIRM",
                          ) && <td></td>}
                        {order?.status !== "CLOSED" &&
                          order?.status !== "CANCELLED" && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* {order?.orderItems.some((i) => i.status === "WAIT_CONFIRM") &&
                  order?.status !== "CLOSED" &&
                  order?.status !== "CANCELLED" && (
                    <div style={{ marginTop: "1rem", textAlign: "right" }}>
                      <button
                        className="btn btn-success"
                        onClick={async () => {
                          if (!orderId || !order) return;
                          const ids = order.orderItems
                            .filter((i) => i.status === "WAIT_CONFIRM")
                            .map((i) => i.orderItemId);
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
                  )} */}
              </div>

              {/* Menu Selection Side Panel */}
              {showAddMenu && (
                <div
                  style={{
                    borderLeft: "1px solid #e2e8f0",
                    paddingLeft: "1.5rem",
                    animation: "fadeIn 0.3s",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.1rem",
                      marginBottom: "1rem",
                    }}
                  >
                    Thực đơn
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      marginBottom: "1.25rem",
                      alignItems: "center"
                    }}
                  >
                    <div className={styles.searchBox} style={{ flex: 2, marginBottom: 0 }}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Tìm món..."
                        value={searchMenu}
                        onChange={(e) => setSearchMenu(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <select
                        className={styles.input}
                        style={{
                          width: "100%",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          color: "#475569"
                        }}
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                      >
                        <option value="all">Tất cả danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>
                            {cat.categoryName || cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                    <div
                      style={{
                        maxHeight: "500px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        paddingRight: "0.5rem",
                      }}
                    >
                      {filteredMenu.map((item, index) => (
                        <div
                          key={item.itemId || index}
                          style={{
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                            padding: "1rem",
                            backgroundColor: "#ffffff",
                            borderRadius: "20px",
                            border: "1px solid #f1f5f9",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        >
                          <div
                            style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "14px",
                              backgroundColor: "#f8fafc",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {(item.image || item.thumbnail) ? (
                              <img
                                src={item.image || item.thumbnail}
                                alt={item.itemName}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '0.7rem' }}>
                                No image
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: "0.95rem",
                                color: "#1e293b",
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              {item.itemName || item.name}
                              {item.itemType === "READY" ? (
                                <span style={{ fontSize: '0.65rem', color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Có sẵn</span>
                              ) : (
                                <span style={{ fontSize: '0.65rem', color: '#d97706', background: '#fffbeb', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Chế biến</span>
                              )}
                            </div>
                            <div
                              style={{
                                color: "#ea580c",
                                fontSize: "0.85rem",
                                fontWeight: 800,
                                marginTop: "2px",
                              }}
                            >
                              {(item.basePrice || 0).toLocaleString("vi-VN")}đ
                            </div>
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{
                              padding: "6px 16px",
                              borderRadius: "10px",
                              background:
                                "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                              border: "none",
                              boxShadow: "0 2px 6px rgba(249, 115, 22, 0.2)",
                            }}
                            disabled={
                              item.itemId
                                ? addingItem === item.itemId ||
                                  order?.status === "CLOSED" ||
                                  order?.status === "CANCELLED"
                                : true
                            }
                            onClick={() => handleAddItem(item)}
                          >
                            {order?.status === "CLOSED" ||
                            order?.status === "CANCELLED"
                              ? "×"
                              : item.itemId && addingItem === item.itemId
                                ? "..."
                                : "Thêm"}
                          </button>
                        </div>
                      ))}
                    </div>

                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={styles.modalFoot}
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "1rem",
            background: "#f8fafc",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{
              borderRadius: "12px",
              padding: "0.5rem 2rem",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "#64748b",
              border: "1.5px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
