"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { createReservation, getPublicMenuItems, type MenuItem, type OrderItemRequest } from "../../lib/api/reservation";
import Modal from "../Modal/Modal";
import styles from "./BookingForm.module.css";

// Generate time slots every 15 minutes from 10:00 to 22:00
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 10; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 22 && m > 0) break; // Stop at 22:00
      const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

export default function BookingForm() {
  const { user, isLoggedIn } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Calculate min and max dates
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const maxDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: "",
    timeSlot: "",
    partySize: 2,
    note: "",
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(new Map()); // itemId -> quantity
  const [loading, setLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Check mounted state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load menu items on mount
  useEffect(() => {
    async function loadMenu() {
      try {
        const items = await getPublicMenuItems();
        setMenuItems(items.filter(item => item.isActive));
      } catch (error) {
        console.error("Failed to load menu:", error);
      } finally {
        setLoadingMenu(false);
      }
    }
    loadMenu();
  }, []);

  function set(field: keyof typeof form, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function addMenuItem(itemId: number) {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const currentQty = newMap.get(itemId) || 0;
      newMap.set(itemId, Math.min(currentQty + 1, 50));
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
      setSelectedItems((prev) => new Map(prev).set(itemId, Math.min(quantity, 50)));
    }
  }

  function validate() {
    const e: { [key: string]: string } = {};
    
    if (!isLoggedIn) {
      e.auth = "Vui lòng đăng nhập để đặt bàn";
    }
    
    if (!form.date) {
      e.date = "Vui lòng chọn ngày";
    } else {
      const selectedDate = new Date(form.date);
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const maxDateEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      if (selectedDate < todayStart) {
        e.date = "Không thể đặt bàn trong quá khứ";
      } else if (selectedDate > maxDateEnd) {
        e.date = "Chỉ có thể đặt bàn trong vòng 7 ngày tới";
      }
    }
    
    if (!form.timeSlot) {
      e.timeSlot = "Vui lòng chọn giờ";
    }
    
    if (form.partySize < 1 || form.partySize > 50) {
      e.partySize = "Số khách phải từ 1 đến 50 người";
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({}); // Clear previous errors
    
    try {
      // Combine date and time to create reservedAt ISO string
      const reservedAt = `${form.date}T${form.timeSlot}:00`;

      // Build order items
      const orderItems: OrderItemRequest[] = Array.from(selectedItems.entries()).map(([itemId, quantity]) => ({
        itemId,
        quantity,
      }));

      const result = await createReservation({
        reservedAt,
        partySize: form.partySize,
        durationMinutes: 90,
        note: form.note || undefined,
        menuItems: orderItems,
      });

      // Show success modal
      setModalType("success");
      setModalTitle("Đặt bàn thành công!");
      setModalMessage(
        `Mã đặt bàn: #${result.reservationId}\n` +
        `Chúng tôi sẽ liên hệ xác nhận qua điện thoại sớm nhất.`
      );
      setModalOpen(true);

      // Reset form after successful booking
      setForm({
        date: "",
        timeSlot: "",
        partySize: 2,
        note: "",
      });
      setSelectedItems(new Map());
    } catch (error: any) {
      console.error("Booking error:", error);
      const errorMessage = error.message || "Đặt bàn thất bại. Vui lòng thử lại.";
      setErrors({ submit: errorMessage });
      
      // Show error modal
      setModalType("error");
      setModalTitle("Lỗi đặt bàn");
      setModalMessage(errorMessage);
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  }

  // Show loading placeholder during SSR and initial mount
  if (!mounted) {
    return (
      <div className={styles.form}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.form}>
        <div className={styles.authPrompt}>
          <h3>Vui lòng đăng nhập</h3>
          <p>Bạn cần đăng nhập để đặt bàn trực tuyến.</p>
          <a href="/login" className="btn btn-primary">
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {errors.submit && (
        <div className={styles.errorBanner}>{errors.submit}</div>
      )}

      {/* Guest info - Auto-filled from token */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.step}>1</span>Thông tin khách
        </h3>
        <div className={styles.infoDisplay}>
          <div className={styles.infoItem}>
            <strong>Họ tên:</strong> {user?.fullName}
          </div>
          <div className={styles.infoItem}>
            <strong>Email:</strong> {user?.email}
          </div>
          {user?.phoneNumber && (
            <div className={styles.infoItem}>
              <strong>Số điện thoại:</strong> {user.phoneNumber}
            </div>
          )}
        </div>
      </div>

      {/* Reservation details */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.step}>2</span>Chi tiết đặt bàn
        </h3>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Ngày đến *</label>
            <input
              id="date"
              type="date"
              className={`${styles.input} ${errors.date ? styles.inputError : ""}`}
              min={minDate}
              max={maxDate}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
            {errors.date && <p className={styles.error}>{errors.date}</p>}
            <p className={styles.hint}>Chỉ có thể đặt trong vòng 7 ngày tới</p>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Giờ đến *</label>
            <select
              id="timeSlot"
              className={`${styles.input} ${styles.select} ${errors.timeSlot ? styles.inputError : ""}`}
              value={form.timeSlot}
              onChange={(e) => set("timeSlot", e.target.value)}
              required
            >
              <option value="">-- Chọn giờ --</option>
              <optgroup label="Buổi sáng/trưa (10:00 – 14:00)">
                {TIME_SLOTS.filter(t => t >= "10:00" && t < "14:00").map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </optgroup>
              <optgroup label="Buổi chiều (14:00 – 17:00)">
                {TIME_SLOTS.filter(t => t >= "14:00" && t < "17:00").map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </optgroup>
              <optgroup label="Buổi tối (17:00 – 22:00)">
                {TIME_SLOTS.filter(t => t >= "17:00").map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </optgroup>
            </select>
            {errors.timeSlot && <p className={styles.error}>{errors.timeSlot}</p>}
            <p className={styles.hint}>Khung giờ cách nhau 15 phút, bắt đầu 10:00 sáng</p>
          </div>
        </div>

        {/* Party size */}
        <div className={styles.field}>
          <label className={styles.label}>
            Số khách: <strong>{form.partySize} người</strong> (Tối đa 50)
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={form.partySize}
            onChange={(e) => set("partySize", parseInt(e.target.value) || 1)}
            className={styles.input}
          />
          {errors.partySize && <p className={styles.error}>{errors.partySize}</p>}
        </div>
      </div>

      {/* Menu Selection */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.step}>3</span>Chọn món ăn trước (tuỳ chọn)
        </h3>
        <p className={styles.sectionDesc}>
          Bạn có thể chọn trước các món ăn yêu thích. Đơn hàng sẽ được chuẩn bị sẵn khi bạn đến.
        </p>

        {loadingMenu ? (
          <p className={styles.loadingText}>Đang tải thực đơn...</p>
        ) : (
          <>
            <div className={styles.menuList}>
              {menuItems.map((item) => (
                <div key={item.itemId} className={styles.menuRow}>
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt={item.itemName} className={styles.menuThumb} />
                  )}
                  <div className={styles.menuDetails}>
                    <h4 className={styles.menuItemName}>{item.itemName}</h4>
                    <p className={styles.menuItemPrice}>
                      {item.basePrice.toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMenuItem(item.itemId)}
                    className={styles.addMenuBtn}
                  >
                    + Thêm
                  </button>
                </div>
              ))}
            </div>

            {selectedItems.size > 0 && (
              <div className={styles.selectedList}>
                <h4 className={styles.selectedTitle}>Món đã chọn ({selectedItems.size})</h4>
                <div className={styles.selectedItems}>
                  {Array.from(selectedItems.entries()).map(([itemId, quantity]) => {
                    const item = menuItems.find(m => m.itemId === itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className={styles.selectedRow}>
                        {item.thumbnail && (
                          <img src={item.thumbnail} alt={item.itemName} className={styles.selectedThumb} />
                        )}
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
              </div>
            )}
          </>
        )}
      </div>

      {/* Special requests */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.step}>4</span>Yêu cầu đặc biệt
        </h3>
        <div className={styles.field}>
          <label className={styles.label}>Ghi chú cho nhà hàng</label>
          <textarea
            id="note"
            className={`${styles.input} ${styles.textarea}`}
            placeholder="Ví dụ: bàn gần cửa sổ, dị ứng hải sản, tổ chức sinh nhật..."
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        id="booking-submit"
        type="submit"
        disabled={loading}
        className={`btn btn-primary ${styles.submitBtn}`}
      >
        {loading ? (
          <>
            <span className={styles.spinner} />
            Đang xử lý...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Xác nhận đặt bàn
          </>
        )}
      </button>

      {/* Success/Error Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
      />
    </form>
  );
}
