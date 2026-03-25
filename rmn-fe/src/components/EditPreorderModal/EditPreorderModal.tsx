"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import {
  getPublicMenuItems,
  updateReservationItems,
  type MenuItem,
  type OrderItemRequest,
  type ReservationDTO,
} from "../../lib/api/reservation";
import styles from "./EditPreorderModal.module.css";
import Modal from "../Modal/Modal";

interface EditPreorderModalProps {
  reservation: ReservationDTO;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPreorderModal({
  reservation,
  onClose,
  onSuccess,
}: EditPreorderModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(
    new Map()
  );
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Setup initial selected items
  useEffect(() => {
    async function loadResources() {
      try {
        const items = await getPublicMenuItems();
        const activeItems = items.filter((item: MenuItem) => item.isActive);
        setMenuItems(activeItems);

        // Pre-fill existing items
        const initialMap = new Map<number, number>();
        if (reservation.order && reservation.order.orderItems) {
          reservation.order.orderItems.forEach((orderItem: any) => {
            initialMap.set(orderItem.itemId, orderItem.quantity);
          });
        }
        setSelectedItems(initialMap);
      } catch (error) {
        console.error("Failed to load menu:", error);
      } finally {
        setLoadingMenu(false);
      }
    }
    loadResources();
  }, [reservation]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: { id: string; name: string }[] = [{ id: "all", name: "Tất cả" }];
    menuItems.forEach((item) => {
      if (item.categoryName && !seen.has(item.categoryName)) {
        seen.add(item.categoryName);
        cats.push({ id: item.categoryName, name: item.categoryName });
      }
    });
    return cats;
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    return menuItems.filter((item) => item.categoryName === activeCategory);
  }, [menuItems, activeCategory]);

  function addMenuItem(itemId: number) {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      if (!newMap.has(itemId)) {
        newMap.set(itemId, 1);
      }
      return newMap;
    });
  }

  function updateQuantity(itemId: number, quantity: number) {
    if (quantity <= 0) {
      setSelectedItems((prev) => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    } else {
      setSelectedItems((prev) => new Map(prev).set(itemId, quantity));
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const orderItems: OrderItemRequest[] = Array.from(
        selectedItems.entries()
      ).map(([itemId, quantity]) => ({
        itemId,
        quantity,
      }));

      await updateReservationItems(reservation.reservationId, orderItems);
      onSuccess();
      Swal.fire({
        title: "Thành công",
        text: "Cập nhật món ăn thành công!",
        icon: "success",
        confirmButtonColor: "var(--brand-primary)"
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Lỗi",
        text: "Cập nhật món ăn thất bại!",
        icon: "error",
        confirmButtonColor: "var(--error)"
      });
    } finally {
      setSubmitting(false);
    }
  }

  const totalAmount = useMemo(() => {
    return Array.from(selectedItems.entries()).reduce((sum, [id, qty]) => {
      const item = menuItems.find((m) => m.itemId === id);
      return sum + (item ? item.basePrice * qty : 0);
    }, 0);
  }, [selectedItems, menuItems]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Chỉnh sửa món ăn (Bàn ${reservation.reservationId})`}
      type="success"
    >
      <div className={styles.container}>
        {loadingMenu ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            Đang tải thực đơn...
          </div>
        ) : (
          <div className={styles.layout}>
            <div className={styles.main}>
              <div className={styles.categoryTabs}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.categoryTab} ${
                      activeCategory === cat.id ? styles.categoryTabActive : ""
                    }`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className={styles.menuList}>
                {filteredMenu.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "20px" }}>
                    Không có món nào trong danh mục này.
                  </p>
                ) : (
                  filteredMenu.map((item) => {
                    const isSelected = selectedItems.has(item.itemId);
                    return (
                      <div
                        key={item.itemId}
                        className={`${styles.menuRow} ${
                          isSelected ? styles.menuRowSelected : ""
                        }`}
                      >
                        <div className={styles.menuDetails}>
                          <h4 className={styles.menuItemName}>
                            {item.itemName}
                          </h4>
                          <p className={styles.menuItemPrice}>
                            {item.basePrice.toLocaleString("vi-VN")} đ
                          </p>
                        </div>
                        {isSelected ? (
                          <span className={styles.selectedBadge}>✓ Đã chọn</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addMenuItem(item.itemId)}
                            className={styles.addMenuBtn}
                          >
                            + Thêm
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={styles.sidebar}>
              <h4 className={styles.selectedTitle}>
                Món đã chọn ({selectedItems.size})
              </h4>
              <div className={styles.selectedItems}>
                {selectedItems.size === 0 && (
                  <p style={{ fontSize: "14px", color: "#666" }}>
                    Chưa chọn món nào. Nếu bạn lưu lại, đơn hàng hiện tại sẽ
                    bị trống.
                  </p>
                )}
                {Array.from(selectedItems.entries()).map(([itemId, quantity]) => {
                  const item = menuItems.find((m) => m.itemId === itemId);
                  if (!item) return null;
                  const lineTotal = item.basePrice * quantity;
                  return (
                    <div key={itemId} className={styles.selectedRow}>
                      <div className={styles.selectedInfo}>
                        <p className={styles.selectedName}>{item.itemName}</p>
                        <p className={styles.selectedPrice}>
                          {item.basePrice.toLocaleString("vi-VN")} đ
                        </p>
                      </div>
                      <div className={styles.selectedQty}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemId, quantity - 1)}
                          className={styles.qtyBtn}
                        >
                          −
                        </button>
                        <span className={styles.qtyValue}>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemId, quantity + 1)}
                          className={styles.qtyBtn}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.pricingSummary}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tổng cộng:</span>
                  <strong>{totalAmount.toLocaleString("vi-VN")} đ</strong>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onClose}
                  disabled={submitting}
                  style={{ width: "100%" }}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ width: "100%", marginTop: "10px" }}
                >
                  {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
