"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createReservation,
  getPublicMenuItems,
  type MenuItem,
  type OrderItemRequest,
} from "../../lib/api/reservation";
import Modal from "../Modal/Modal";
import styles from "./BookingForm.module.css";

// Generate time slots every 15 minutes from 10:00 to 22:00
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 10; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 22 && m > 0) break;
      const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();
const MAX_PARTY_SIZE = 100;

type SeatingPlan = {
  totalTables: number;
  totalSeats: number;
  unusedSeats: number;
  counts: { 4: number; 6: number; 8: number };
};

function buildSeatingPlan(partySize: number): SeatingPlan {
  const target = Math.max(0, Math.floor(partySize));
  let best: SeatingPlan = {
    totalTables: target === 0 ? 1 : Number.POSITIVE_INFINITY,
    totalSeats: target === 0 ? 4 : Number.POSITIVE_INFINITY,
    unusedSeats: target === 0 ? 4 : Number.POSITIVE_INFINITY,
    counts: { 4: target === 0 ? 1 : 0, 6: 0, 8: 0 },
  };

  // Brute force small search space to minimize tables, then unused seats.
  const maxTables = Math.ceil(target / 4) + 2;
  for (let c8 = 0; c8 <= maxTables; c8++) {
    for (let c6 = 0; c6 <= maxTables; c6++) {
      const seatsUsed = c8 * 8 + c6 * 6;
      if (seatsUsed > target + 8) continue; // small pruning
      const remaining = Math.max(0, target - seatsUsed);
      const c4 = Math.ceil(remaining / 4);
      const totalSeats = seatsUsed + c4 * 4;
      const totalTables = c8 + c6 + c4;
      if (totalTables === 0) continue;
      const unusedSeats = totalSeats - target;

      const betterTables = totalTables < best.totalTables;
      const betterUnused =
        totalTables === best.totalTables && unusedSeats < best.unusedSeats;
      if (betterTables || betterUnused) {
        best = {
          totalTables,
          totalSeats,
          unusedSeats,
          counts: { 4: c4, 6: c6, 8: c8 },
        };
      }
    }
  }

  return best;
}

export default function BookingForm() {
  const { user, isLoggedIn } = useAuth();
  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const maxDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [form, setForm] = useState({
    date: "",
    timeSlot: "",
    partySize: 8,
    phone: "",
    note: "",
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(
    new Map(),
  );
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadMenu() {
      try {
        const items = await getPublicMenuItems();
        setMenuItems(items.filter((item) => item.isActive));
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

  const seatingPlan = useMemo(
    () => buildSeatingPlan(form.partySize || 0),
    [form.partySize],
  );
  const numberOfTables = Math.max(1, seatingPlan.totalTables || 1);

  // Build list of unique categories from menu items
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: { id: string; name: string }[] = [
      { id: "all", name: "Tất cả" },
    ];
    menuItems.forEach((item) => {
      if (item.categoryName && !seen.has(item.categoryName)) {
        seen.add(item.categoryName);
        cats.push({ id: item.categoryName, name: item.categoryName });
      }
    });
    return cats;
  }, [menuItems]);

  // Filter menu items by active category
  const filteredMenu = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    return menuItems.filter((item) => item.categoryName === activeCategory);
  }, [menuItems, activeCategory]);

  function addMenuItem(itemId: number) {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      if (!newMap.has(itemId)) {
        newMap.set(itemId, numberOfTables); // Default: 1 per table
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

  function validate() {
    const e: { [key: string]: string } = {};
    if (!isLoggedIn) {
      e.auth = "Vui lòng đăng nhập để đặt bàn";
    }
    if (!form.date) {
      e.date = "Vui lòng chọn ngày";
    } else {
      const selectedDate = new Date(form.date);
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
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
    if (
      !form.phone ||
      !/^((\+?84|0)\d{8,10})$/.test(form.phone.replace(/\D/g, ""))
    ) {
      e.phone = "Vui lòng nhập số điện thoại hợp lệ (09xxxxxxxx hoặc +84)";
    }
    if (form.partySize < 1) {
      e.partySize = "Số khách phải từ 1 trở lên";
    } else if (form.partySize > MAX_PARTY_SIZE) {
      e.partySize = `Tối đa ${MAX_PARTY_SIZE} khách mỗi lần đặt`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const reservedAt = `${form.date}T${form.timeSlot}:00`;
      const orderItems: OrderItemRequest[] = Array.from(
        selectedItems.entries(),
      ).map(([itemId, quantity]) => ({
        itemId,
        quantity,
      }));
      const phoneLine = form.phone ? `SĐT liên hệ: ${form.phone}` : "";
      const noteCombined = [phoneLine, form.note].filter(Boolean).join("\n");

      const result = await createReservation({
        reservedAt,
        partySize: form.partySize,
        durationMinutes: 90,
        note: noteCombined || undefined,
        menuItems: orderItems,
      });
      setModalType("success");
      setModalTitle("Đặt bàn thành công!");
      setModalMessage(
        `Mã đặt bàn: #${result.reservationId}\n` +
          `Chúng tôi sẽ liên hệ xác nhận qua điện thoại sớm nhất.`,
      );
      setModalOpen(true);
      setForm({ date: "", timeSlot: "", partySize: 8, phone: "", note: "" });
      setSelectedItems(new Map());
    } catch (error: any) {
      const errorMessage =
        error.message || "Đặt bàn thất bại. Vui lòng thử lại.";
      setErrors({ submit: errorMessage });
      setModalType("error");
      setModalTitle("Lỗi đặt bàn");
      setModalMessage(errorMessage);
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const totalAmount = useMemo(() => {
    return Array.from(selectedItems.entries()).reduce((sum, [id, qty]) => {
      const item = menuItems.find((m) => m.itemId === id);
      return sum + (item ? item.basePrice * qty : 0);
    }, 0);
  }, [selectedItems, menuItems]);

  const tableBreakdown = useMemo(() => {
    const parts: string[] = [];
    if (seatingPlan.counts[8]) parts.push(`${seatingPlan.counts[8]} bàn 8 chỗ`);
    if (seatingPlan.counts[6]) parts.push(`${seatingPlan.counts[6]} bàn 6 chỗ`);
    if (seatingPlan.counts[4]) parts.push(`${seatingPlan.counts[4]} bàn 4 chỗ`);
    return {
      text: parts.length ? parts.join(" · ") : "",
      unused:
        seatingPlan.unusedSeats > 0
          ? `(+${seatingPlan.unusedSeats} ghế trống)`
          : "",
    };
  }, [seatingPlan]);

  const amountPerTable =
    numberOfTables > 0 ? Math.round(totalAmount / numberOfTables) : 0;

  if (!mounted) {
    return (
      <div className={styles.form}>
        <div style={{ padding: "2rem", textAlign: "center" }}>
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

      {/* Step 1 – Guest info */}
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

      {/* Step 2 – Reservation details */}
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
                {TIME_SLOTS.filter((t) => t >= "10:00" && t < "14:00").map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ),
                )}
              </optgroup>
              <optgroup label="Buổi chiều (14:00 – 17:00)">
                {TIME_SLOTS.filter((t) => t >= "14:00" && t < "17:00").map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ),
                )}
              </optgroup>
              <optgroup label="Buổi tối (17:00 – 22:00)">
                {TIME_SLOTS.filter((t) => t >= "17:00").map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </optgroup>
            </select>
            {errors.timeSlot && (
              <p className={styles.error}>{errors.timeSlot}</p>
            )}
            <p className={styles.hint}>
              Khung giờ cách nhau 15 phút, bắt đầu 10:00 sáng
            </p>
          </div>
        </div>

        {/* Phone for contact */}
        <div className={`${styles.field} ${styles.fieldNarrow}`}>
          <label className={styles.label}>Số điện thoại liên hệ *</label>
          <input
            type="tel"
            inputMode="tel"
            placeholder="Ví dụ: 0912345678"
            className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            required
          />
          {errors.phone && <p className={styles.error}>{errors.phone}</p>}
          <p className={styles.hint}>Lễ tân sẽ liên hệ xác nhận</p>
        </div>

        {/* Party size */}
        <div className={styles.field}>
          <label className={styles.label}>Số khách *</label>
          <input
            type="number"
            min="1"
            max={MAX_PARTY_SIZE}
            value={form.partySize === 0 ? "" : form.partySize}
            onChange={(e) => {
              const rawValue = e.target.value;
              if (rawValue === "") {
                set("partySize", 0); // allow clearing the field before retyping
                return;
              }
              const raw = parseInt(rawValue, 10);
              const safe = Number.isFinite(raw) ? raw : 0;
              const clamped = Math.min(Math.max(safe, 1), MAX_PARTY_SIZE);
              set("partySize", clamped);
            }}
            className={styles.input}
            style={{ maxWidth: 160 }}
          />
          {errors.partySize && (
            <p className={styles.error}>{errors.partySize}</p>
          )}
          {/* Table auto-calculation badge with 4/6/8-seat mix */}
          <div className={styles.tableBadge}>
            <span className={styles.tableBadgeIcon}></span>
            <span>
              <strong>{form.partySize}</strong> người →{" "}
              <strong className={styles.tableBadgeNum}>
                {numberOfTables} bàn
              </strong>
              <span className={styles.tableBadgeSub}>
                {tableBreakdown.text ? ` · ${tableBreakdown.text}` : ""}{" "}
                {tableBreakdown.unused}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Step 3 – Menu */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.step}>3</span>Chọn món ăn trước{" "}
          <span className={styles.optionalTag}>(tuỳ chọn)</span>
        </h3>
        <p className={styles.sectionDesc}>
          Chọn trước các món yêu thích — đơn hàng sẽ được chuẩn bị khi bạn đến.
          Mỗi món được tự động nhân x{numberOfTables} bàn, bạn có thể điều chỉnh
          lại.
        </p>

        {loadingMenu ? (
          <p className={styles.loadingText}>Đang tải thực đơn...</p>
        ) : (
          <>
            {/* Category tabs */}
            <div className={styles.categoryTabs}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.categoryTab} ${activeCategory === cat.id ? styles.categoryTabActive : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu list */}
            <div className={styles.menuList}>
              {filteredMenu.length === 0 ? (
                <p className={styles.loadingText}>
                  Không có món nào trong danh mục này.
                </p>
              ) : (
                filteredMenu.map((item) => {
                  const isSelected = selectedItems.has(item.itemId);
                  return (
                    <div
                      key={item.itemId}
                      className={`${styles.menuRow} ${isSelected ? styles.menuRowSelected : ""}`}
                    >
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.itemName}
                          className={styles.menuThumb}
                        />
                      ) : (
                        <div className={styles.menuThumbPlaceholder}>🍽️</div>
                      )}
                      <div className={styles.menuDetails}>
                        <h4 className={styles.menuItemName}>
                          {item.itemName}
                          {item.unit && (
                            <span className={styles.menuItemUnit}>
                              {" "}
                              ({item.unit})
                            </span>
                          )}
                        </h4>
                        <p className={styles.menuItemPrice}>
                          {item.basePrice.toLocaleString("vi-VN")} đ
                        </p>
                        {item.categoryName && (
                          <p className={styles.menuItemCategory}>
                            {item.categoryName}
                          </p>
                        )}
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

            {/* Selected items summary */}
            {selectedItems.size > 0 && (
              <div className={styles.selectedList}>
                <h4 className={styles.selectedTitle}>
                  Món đã chọn ({selectedItems.size})
                </h4>
                <div className={styles.selectedItems}>
                  {Array.from(selectedItems.entries()).map(
                    ([itemId, quantity]) => {
                      const item = menuItems.find((m) => m.itemId === itemId);
                      if (!item) return null;
                      const lineTotal = item.basePrice * quantity;
                      return (
                        <div key={itemId} className={styles.selectedRow}>
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.itemName}
                              className={styles.selectedThumb}
                            />
                          ) : (
                            <div className={styles.selectedThumbPlaceholder}>
                              🍽️
                            </div>
                          )}
                          <div className={styles.selectedInfo}>
                            <p className={styles.selectedName}>
                              {item.itemName}
                              {item.unit && (
                                <span
                                  style={{ fontSize: "0.8em", color: "#888" }}
                                >
                                  {" "}
                                  ({item.unit})
                                </span>
                              )}
                            </p>
                            <p className={styles.selectedPrice}>
                              {item.basePrice.toLocaleString("vi-VN")} đ ×{" "}
                              {quantity} ={" "}
                              <strong>
                                {lineTotal.toLocaleString("vi-VN")} đ
                              </strong>
                            </p>
                          </div>
                          <div className={styles.selectedQty}>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(itemId, quantity - 1)
                              }
                              className={styles.qtyBtn}
                            >
                              −
                            </button>
                            <span className={styles.qtyValue}>{quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(itemId, quantity + 1)
                              }
                              className={styles.qtyBtn}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                {/* Pricing summary */}
                <div className={styles.pricingSummary}>
                  <div className={styles.pricingRow}>
                    <span>Tổng tạm tính:</span>
                    <span className={styles.pricingTotal}>
                      {totalAmount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div
                    className={styles.pricingRow}
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>Chia đều {numberOfTables} bàn:</span>
                    <span>
                      ≈ {amountPerTable.toLocaleString("vi-VN")} đ / bàn
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Step 4 – Special requests */}
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
      {user?.roles?.includes("Customer") ? (
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
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Xác nhận đặt bàn
            </>
          )}
        </button>
      ) : (
        <div
          className={styles.submitBtn}
          style={{
            background: "#f5f5f5",
            color: "#666",
            textAlign: "center",
            cursor: "not-allowed",
            border: "1px solid #ddd",
          }}
        >
          <i>Chỉ khách hàng mới có thể thực hiện đặt bàn.</i>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        type={modalType}
      >
        <p className={styles.message}>{modalMessage}</p>
      </Modal>
    </form>
  );
}
