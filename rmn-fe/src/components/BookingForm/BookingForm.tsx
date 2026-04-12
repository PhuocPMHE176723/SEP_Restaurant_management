"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import {
  createReservation,
  getPublicMenuItems,
  type MenuItem,
  type OrderItemRequest,
} from "../../lib/api/reservation";
import { getSepayConfig, checkSepayTransaction, cancelSepayTimeout } from "../../lib/api/payment";
import { isValidVNPhone } from "../../lib/validation";
import Modal from "../Modal/Modal";
import styles from "./BookingForm.module.css";

// Generate time slots every 15 minutes from 11:00 to 21:30
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  // Lunch: 11:00 - 14:00
  for (let h = 11; h <= 14; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 14 && m > 0) break;
      slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  // Dinner: 17:00 - 21:30
  for (let h = 17; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 21 && m > 30) break;
      slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return Array.from(new Set(slots)).sort();
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
    email: "",
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
  const [searchTerm, setSearchTerm] = useState("");

  const [sepayConfig, setSepayConfig] = useState<{ account: string; bank: string } | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrAmount, setQrAmount] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [transferCode, setTransferCode] = useState(""); // display in QR modal
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [currentReservationId, setCurrentReservationId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes polling
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    getSepayConfig()
      .then((cfg) => {
        setSepayConfig(cfg);
        // Check for existing session right after getting config
        const sessionStr = localStorage.getItem("sepay_session");
        if (sessionStr && cfg) {
          try {
            const session = JSON.parse(sessionStr);
            const remaining = Math.floor((session.expireAt - Date.now()) / 1000);
            
            if (remaining > 0) {
              setQrAmount(session.depositAmt);
              setCurrentReservationId(session.resId);
              const transferContent = session.paymentCode ? `RMNRES${session.paymentCode}` : `RMNRES${session.resId}`;
              setTransferCode(transferContent);
              setQrCodeUrl(
                `https://qr.sepay.vn/img?acc=${cfg.account}&bank=${cfg.bank}&amount=${session.depositAmt}&des=${encodeURIComponent(`Thanh toan don hang ${transferContent} ${session.depositAmt}`)}`
              );
              setQrModalOpen(true);
              startPaymentCheck(session.resId, session.depositAmt, session.paymentCode || String(session.resId), session.expireAt);
            } else {
              // Expired session found on load -> clean up and cancel
              localStorage.removeItem("sepay_session");
              cancelSepayTimeout(session.resId).catch(console.error);
            }
          } catch (e) {
            localStorage.removeItem("sepay_session");
          }
        }
      })
      .catch((err) => console.error("Could not load SePay config", err));
    
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
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

  useEffect(() => {
    if (user?.email && !form.email) {
      set("email", user.email);
    }
  }, [user, form.email]);

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

  // Filter menu items by active category and search term
  const filteredMenu = useMemo(() => {
    let filtered = menuItems;
    if (activeCategory !== "all") {
      filtered = filtered.filter((item) => item.categoryName === activeCategory);
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.itemName.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term),
      );
    }
    return filtered;
  }, [menuItems, activeCategory, searchTerm]);

  function addMenuItem(itemId: number) {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      if (!newMap.has(itemId)) {
        // Clamp quantity to something reasonable (max tables for 100 people is ~25)
        const initialQty = Math.min(numberOfTables, 50); 
        console.log(`[BookingForm] Adding MenuItem ${itemId} with quantity ${initialQty} (numberOfTables: ${numberOfTables})`);
        newMap.set(itemId, initialQty); 
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
    if (!form.phone || !isValidVNPhone(form.phone)) {
      e.phone = "Vui lòng nhập số điện thoại hợp lệ (ví dụ: 0912345678)";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Email không hợp lệ";
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
        contactEmail: form.email || undefined,
        menuItems: orderItems,
      });

      // SePay Deposit Logic
      const _totalAmount = Array.from(selectedItems.entries()).reduce((sum, [id, qty]) => {
        const item = menuItems.find((m) => m.itemId === id);
        // Defensive clamp: quantity should not exceed 50 for a single item in a reservation
        const safeQty = Math.min(qty, 50); 
        console.log(`[BookingForm] Item ID: ${id}, Qty: ${qty} (safe: ${safeQty}), BasePrice: ${item?.basePrice}`);
        return sum + (item ? item.basePrice * safeQty : 0);
      }, 0);

      console.log(`[BookingForm] Calculated _totalAmount: ${_totalAmount}`);

      if (sepayConfig?.account) {
        const depositAmount = Math.max(200000, Math.round(_totalAmount * 0.5)); // Min 200k or 50%
        console.log(`[BookingForm] Calculated depositAmount: ${depositAmount}`);
        setQrAmount(depositAmount);
        setCurrentReservationId(result.reservationId);
        const paymentCode = String(Math.floor(100000 + Math.random() * 900000));
        const transferContent = `RMNRES${paymentCode}`;
        setTransferCode(transferContent);

        const qrUrl = `https://qr.sepay.vn/img?acc=${sepayConfig.account}&bank=${sepayConfig.bank}&amount=${depositAmount}&des=${encodeURIComponent(`Thanh toan don hang ${transferContent} ${depositAmount}`)}`;
        console.log(`[BookingForm] Generated QR URL: ${qrUrl}`);
        setQrCodeUrl(qrUrl);
        setQrModalOpen(true);
        setTimeLeft(300); // 5 minutes
        startPaymentCheck(result.reservationId, depositAmount, paymentCode);
      } else {
        Swal.fire({
          title: "Đặt bàn thành công!",
          text: `Mã đặt bàn: #${result.reservationId}\nChúng tôi sẽ liên hệ xác nhận qua điện thoại sớm nhất.`,
          icon: "success",
          confirmButtonColor: "var(--brand-primary)"
        });
        setForm({ date: "", timeSlot: "", partySize: 8, phone: "", email: "", note: "" });
        setSelectedItems(new Map());
      }
    } catch (error: any) {
      const errorMessage =
        error.message || "Đặt bàn thất bại. Vui lòng thử lại.";
      setErrors({ submit: errorMessage });
      Swal.fire({
        title: "Lỗi đặt bàn",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "var(--error)"
      });
    } finally {
      setLoading(false);
    }
  }

  function startPaymentCheck(resId: number, depositAmt: number, paymentCode: string, existingExpireAt?: number) {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCheckingPayment(true);

    const expireAt = existingExpireAt || (Date.now() + 300 * 1000);
    if (!existingExpireAt) {
      localStorage.setItem("sepay_session", JSON.stringify({ resId, depositAmt, paymentCode, expireAt }));
    }
    
    setTimeLeft(Math.max(0, Math.floor((expireAt - Date.now()) / 1000)));

    countdownIntervalRef.current = setInterval(() => {
      const remaining = Math.floor((expireAt - Date.now()) / 1000);
      if (remaining <= 0) {
        // Time is up -> cancel reservation and clear
        localStorage.removeItem("sepay_session");
        if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        
        cancelSepayTimeout(resId)
          .then(() => stopPaymentCheck(false, "Đã hết thời gian thanh toán cọc. Đơn đặt bàn của bạn đã bị huỷ tự động."))
          .catch(() => stopPaymentCheck(false, "Đã hết thời gian thanh toán cọc. (Không thể huỷ đơn, vui lòng liên hệ nhà hàng)"));
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    checkIntervalRef.current = setInterval(async () => {
      try {
        const checkRes = await checkSepayTransaction(resId, paymentCode || String(resId));
        if (checkRes.success) {
          localStorage.removeItem("sepay_session");
          stopPaymentCheck(true, "Thanh toán cọc thành công! Email xác nhận chi tiết đã được gửi đến bạn.");
          setForm({ date: "", timeSlot: "", partySize: 8, phone: "", email: "", note: "" });
          setSelectedItems(new Map());
        }
      } catch (err: any) {
        console.error("Lỗi kiểm tra thanh toán", err);
        // If it's a configuration error (401/500), we might want to stop or alert the user
        if (err.message?.includes("Token") || err.message?.includes("401")) {
          clearInterval(checkIntervalRef.current!);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi cấu hình thanh toán',
            text: 'Không thể kết nối với hệ thống SePay. Vui lòng liên hệ nhà hàng để được hỗ trợ.',
          });
        }
      }
    }, 5000); // Poll every 5s
  }

  function stopPaymentCheck(isSuccess: boolean, message: string) {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCheckingPayment(false);
    setQrModalOpen(false);
    
    Swal.fire({
      title: isSuccess ? "Hoàn tất đặt bàn" : "Lưu ý",
      text: message,
      icon: isSuccess ? "success" : "error",
      confirmButtonColor: isSuccess ? "var(--brand-primary)" : "var(--error)"
    });
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
          <span className={styles.step}>2</span>Thông tin đặt bàn
        </h3>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>
              Ngày đến (trong 7 ngày tới) *
            </label>
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
            <p className={styles.hint}>Chỉ cho phép đặt tối đa trước 7 ngày</p>
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
              <optgroup label="Khung giờ Trưa (11:00 – 14:00)">
                {TIME_SLOTS.filter((t) => t >= "11:00" && t <= "14:00").map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ),
                )}
              </optgroup>
              <optgroup label="Khung giờ Tối (17:00 – 21:30)">
                {TIME_SLOTS.filter((t) => t >= "17:00" && t <= "21:30").map((t) => (
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
              Khung giờ cách nhau 15 phút · Trưa (11:00-14:00) · Tối (17:00-21:30)
            </p>
          </div>
        </div>

        {/* Phone for contact */}
        <div className={`${styles.field} ${styles.fieldNarrow}`}>
          <label className={styles.label}>
            Số điện thoại để gọi xác nhận *
          </label>
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
          <p className={styles.hint}>
            Nhân viên sẽ gọi lại để xác nhận/nhắc lịch
          </p>
        </div>

        {/* Email for confirmation */}
        <div className={`${styles.field} ${styles.fieldNarrow}`}>
          <label className={styles.label}>
            Email để nhận thông báo cọc (tuỳ chọn)
          </label>
          <input
            type="email"
            placeholder="Ví dụ: name@example.com"
            className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
          {errors.email && <p className={styles.error}>{errors.email}</p>}
          <p className={styles.hint}>
            Hệ thống sẽ gửi email xác nhận đặt bàn thành công về địa chỉ này
          </p>
        </div>

        {/* Party size */}
        <div className={styles.field}>
          <label className={styles.label}>Tổng số khách *</label>
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
          <p className={styles.hint}>
            Bạn chỉ cần nhập tổng khách, hệ thống tự gợi ý bàn 4/6/8 chỗ.
          </p>
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
        <div className={styles.depositNote}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div>
            <strong>Quy tắc đặt trước:</strong> Để đảm bảo giữ chỗ và chuẩn bị món ăn chu đáo, 
            quý khách vui lòng <strong>thanh toán cọc tối thiểu 200.000đ</strong> (hoặc 50% tổng giá trị món ăn). 
            Tiền cọc sẽ được trừ trực tiếp vào hoá đơn khi quý khách thanh toán tại nhà hàng.
          </div>
        </div>

        {loadingMenu ? (
          <p className={styles.loadingText}>Đang tải thực đơn...</p>
        ) : (
          <>
            {/* Search box and Category tabs */}
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Tìm kiếm tên món ăn hoặc mô tả..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

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
                    <span>Số món đã chọn:</span>
                    <span>
                      {Array.from(selectedItems.values()).reduce((a, b) => a + b, 0)} món
                    </span>
                  </div>
                  <div className={styles.pricingRow}>
                    <span>Tổng tạm tính:</span>
                    <span className={styles.pricingTotal}>
                      {totalAmount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className={styles.pricingRow}>
                    <span className={styles.depositLabel}>
                      Tiền cọc (50%):
                      {totalAmount < 400000 && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          (Áp dụng mức cọc tối thiểu 200.000đ)
                        </div>
                      )}
                    </span>
                    <span
                      className={styles.pricingDeposit}
                      style={{ color: "var(--brand-primary)", fontWeight: "bold" }}
                    >
                      {Math.max(200000, Math.round(totalAmount * 0.5)).toLocaleString("vi-VN")} đ
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

      {/* QR Payment Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => {
          Swal.fire({
            title: "Hủy thanh toán?",
            text: "Bạn có chắc chắn muốn thoát khi chưa hoàn tất thanh toán cọc? Đơn đặt bàn của bạn sẽ bị huỷ!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Đồng ý, hủy đặt bàn",
            cancelButtonText: "Tiếp tục thanh toán",
          }).then((result) => {
            if (result.isConfirmed) {
              localStorage.removeItem("sepay_session");
              if (currentReservationId) {
                cancelSepayTimeout(currentReservationId).catch(console.error);
              }
              stopPaymentCheck(false, "Bạn đã huỷ giao dịch nạp cọc. Đơn đặt bàn đã bị huỷ.");
            }
          });
        }}
        title="Thanh toán cọc (50%)"
        showFooter={false}
      >
        <div className={styles.qrContainer}>
          <p className={styles.qrTitle}>
            Vui lòng thanh toán số tiền cọc để xác nhận đặt bàn của bạn.
          </p>
          
          <div className={styles.qrTimer}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Thời gian còn lại: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
          
          <div className={styles.qrCodeWrapper}>
            <div className={styles.qrScannerLine} />
            <img 
              src={qrCodeUrl} 
              alt="QR Code SePay" 
              className={styles.qrCode}
            />
          </div>

          <div className={styles.qrAmountWrapper}>
            <span className={styles.qrAmountLabel}>Số tiền cần thanh toán</span>
            <strong className={styles.qrAmountValue}>{qrAmount.toLocaleString("vi-VN")} đ</strong>
          </div>

          {transferCode && (
            <div className={styles.qrAmountWrapper} style={{ marginTop: 8, flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
              <span className={styles.qrAmountLabel}>Nội dung chuyển khoản</span>
              <strong className={styles.qrAmountValue} style={{ fontSize: "1rem", letterSpacing: 1, color: "var(--brand-primary)" }}>
                Thanh toan don hang {transferCode} {qrAmount}
              </strong>
              <small style={{ color: "var(--text-muted, #888)", fontSize: "0.75rem" }}> </small>
            </div>
          )}
          
          <div className={styles.qrStatus}>
            {checkingPayment ? (
              <>
                <span className={styles.spinner} style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
                Đang chờ thanh toán tự động...
              </>
            ) : "Đã dừng kiểm tra."}
          </div>
          
          <p className={styles.qrNote}>
            
          </p>

          <button 
            type="button"
            className={styles.qrCancelBtn}
            onClick={() => {
              Swal.fire({
                title: "Hủy thanh toán?",
                text: "Bạn có chắc chắn muốn thoát khi chưa hoàn tất thanh toán cọc? Đơn đặt bàn của bạn sẽ bị huỷ!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Đồng ý, hủy đặt bàn",
                cancelButtonText: "Tiếp tục thanh toán",
              }).then((result) => {
                if (result.isConfirmed) {
                  localStorage.removeItem("sepay_session");
                  if (currentReservationId) {
                    cancelSepayTimeout(currentReservationId).catch(console.error);
                  }
                  stopPaymentCheck(false, "Bạn đã huỷ giao dịch nạp cọc. Đơn đặt bàn đã bị huỷ.");
                }
              });
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Hủy giao dịch & Huỷ đơn đặt bàn
          </button>
        </div>
      </Modal>
    </form>
  );
}
