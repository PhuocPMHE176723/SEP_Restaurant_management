"use client";

import {useRouter} from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import styles from "./callin.module.css";
import {
    createCashierReservation,
    getPublicMenuItems,
    getPublicTableAvailability,
    type MenuItem,
    type OrderItemRequest,
    type TableAvailability,
} from "@/lib/api/reservation";

export default function CashierReservationPage() {
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [note, setNote] = useState("");

    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    const [loading, setLoading] = useState(false);

    const [tables, setTables] = useState<TableAvailability[]>([]);
    const [selectedTables, setSelectedTables] = useState<number[]>([]);

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Map<number, number>>(
        new Map()
    );

    const [keyword, setKeyword] = useState("");
    const [selectedCategory, setSelectedCategory] =
        useState("all");

    const router = useRouter();

    const categories = useMemo(() => {
        const set = new Set<string>();

        menuItems.forEach((item) => {
            if (item.categoryName) {
                set.add(item.categoryName);
            }
        });

        return ["all", ...Array.from(set)];
    }, [menuItems]);

    const filteredMenuItems = useMemo(() => {
        return menuItems.filter((item) => {
            const matchKeyword =
                item.itemName
                    .toLowerCase()
                    .includes(keyword.toLowerCase());

            const matchCategory =
                selectedCategory === "all" ||
                item.categoryName === selectedCategory;

            return matchKeyword && matchCategory;
        });
    }, [
        menuItems,
        keyword,
        selectedCategory,
    ]);
    useEffect(() => {
        loadMenu();
    }, []);

    useEffect(() => {
        if (date && time) {
            loadTables();
        }
    }, [date, time]);

    async function loadMenu() {
        try {
            const data = await getPublicMenuItems();
            setMenuItems(data.filter((x) => x.isActive));
        } catch {
            Swal.fire("Lỗi", "Không tải được thực đơn", "error");
        }
    }

    async function loadTables() {
        try {
            const data = await getPublicTableAvailability(date, time);

            setTables(data.filter((x) => x.isAvailable));
        } catch {
            Swal.fire("Lỗi", "Không tải được danh sách bàn", "error");
        }
    }

    function toggleTable(tableId: number) {
        setSelectedTables((prev) => {
            if (prev.includes(tableId)) {
                return prev.filter((x) => x !== tableId);
            }

            return [...prev, tableId];
        });
    }

    function addMenuItem(itemId: number) {
        setSelectedItems((prev) => {
            const clone = new Map(prev);

            if (clone.has(itemId)) {
                clone.set(itemId, (clone.get(itemId) || 0) + 1);
            } else {
                clone.set(itemId, 1);
            }

            return clone;
        });
    }

    function updateQuantity(itemId: number, quantity: number) {
        setSelectedItems((prev) => {
            const clone = new Map(prev);

            if (quantity <= 0) {
                clone.delete(itemId);
            } else {
                clone.set(itemId, quantity);
            }

            return clone;
        });
    }

    function generateTimeSlots(): string[] {
        const slots: string[] = [];
        // Lunch: 11:00 - 14:00
        for (let h = 11; h <= 14; h++) {
            for (let m = 0; m < 60; m += 30) {
                if (h === 14 && m > 0) break;
                slots.push(
                    `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
                );
            }
        }
        // Dinner: 17:00 - 21:30
        for (let h = 17; h <= 21; h++) {
            for (let m = 0; m < 60; m += 30) {
                if (h === 21 && m > 30) break;
                slots.push(
                    `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
                );
            }
        }
        return Array.from(new Set(slots)).sort();
    }

    const TIME_SLOTS = generateTimeSlots();

    const lunchSlots = TIME_SLOTS.filter(
        (x) => x >= "11:00" && x <= "14:00"
    );

    const dinnerSlots = TIME_SLOTS.filter(
        (x) => x >= "17:00" && x <= "21:30"
    );
    const orderItems: OrderItemRequest[] = useMemo(() => {
        return Array.from(selectedItems.entries()).map(
            ([itemId, quantity]) => ({
                itemId,
                quantity,
            })
        );
    }, [selectedItems]);

    const totalFood = useMemo(() => {
        return Array.from(selectedItems.entries()).reduce(
            (sum, [itemId, quantity]) => {
                const item = menuItems.find((x) => x.itemId === itemId);

                if (!item) return sum;

                return sum + item.basePrice * quantity;
            },
            0
        );
    }, [selectedItems, menuItems]);

    const estimatedDeposit = useMemo(() => {
        const byFood = totalFood * 0.2;

        const byTables = selectedTables.length * 200000;

        return Math.max(byFood, byTables);
    }, [selectedTables, totalFood]);

    async function handleSubmit() {
        if (!customerName.trim()) {
            return Swal.fire("Lỗi", "Nhập tên khách hàng", "warning");
        }

        if (!customerPhone.trim()) {
            return Swal.fire("Lỗi", "Nhập số điện thoại", "warning");
        }

        if (!date || !time) {
            return Swal.fire("Lỗi", "Chọn ngày giờ", "warning");
        }

        if (selectedTables.length === 0) {
            return Swal.fire("Lỗi", "Chọn ít nhất 1 bàn", "warning");
        }

        try {
            setLoading(true);

            await createCashierReservation({
                customerName,
                customerPhone,
                contactEmail,
                note,
                reservedAt: `${date}T${time}:00`,
                tableIds: selectedTables,
                menuItems: orderItems,
            });

            Swal.fire(
                "Thành công",
                "Đặt bàn thành công",
                "success"
            );

            setCustomerName("");
            setCustomerPhone("");
            setContactEmail("");
            setNote("");

            setSelectedTables([]);
            setSelectedItems(new Map());
            router.push(`/cashier/reservations`);
        } catch (error: any) {
            Swal.fire(
                "Lỗi",
                error?.message || "Tạo đặt bàn thất bại",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.page}>
            {/* LEFT */}
            <div className={styles.sidebar}>
                <h2 className={styles.sectionTitle}>
                    Thông tin khách hàng
                </h2>

                <label className={styles.label}>
                    Họ và tên
                </label>
                <input
                    className={styles.input}
                    placeholder="Nhập tên khách hàng"
                    value={customerName}
                    onChange={(e) =>
                        setCustomerName(e.target.value)
                    }
                />

                <label className={styles.label}>
                    Số điện thoại
                </label>
                <input
                    className={styles.input}
                    placeholder="Nhập số điện thoại"
                    value={customerPhone}
                    onChange={(e) =>
                        setCustomerPhone(e.target.value)
                    }
                />

                <label className={styles.label}>
                    Email
                </label>
                <input
                    className={styles.input}
                    placeholder="Nhập email"
                    value={contactEmail}
                    onChange={(e) =>
                        setContactEmail(e.target.value)
                    }
                />

                <div className={styles.datetimeGrid}>
                    <div>
                        <label className={styles.label}>
                            Ngày đến
                        </label>
                        <input
                            className={styles.input}
                            type="date"
                            value={date}
                            onChange={(e) =>
                                setDate(e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <label className={styles.label}>
                            Giờ đến
                        </label>

                        <select
                            className={styles.select}
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        >
                            <option value="">
                                --- Chọn giờ ---
                            </option>

                            <optgroup label="Khung giờ Trưa (11:00 - 14:00)">
                                {lunchSlots.map((slot) => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </optgroup>

                            <optgroup label="Khung giờ Tối (17:00 - 21:30)">
                                {dinnerSlots.map((slot) => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                </div>

                <label className={styles.label}>
                    Ghi chú
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Yêu cầu đặc biệt..."
                    value={note}
                    onChange={(e) =>
                        setNote(e.target.value)
                    }
                />

                <div className={styles.summaryCard}>
                    <h3 className={styles.summaryTitle}>
                        Món đã chọn
                    </h3>

                    <div className={styles.selectedList}>
                        {selectedItems.size === 0 && (
                            <p>Chưa chọn món nào</p>
                        )}

                        {Array.from(
                            selectedItems.entries()
                        ).map(([itemId, quantity]) => {
                            const item = menuItems.find(
                                (x) => x.itemId === itemId
                            );

                            if (!item) return null;

                            return (
                                <div
                                    key={itemId}
                                    className={styles.selectedItem}
                                >
                                    <div
                                        className={styles.selectedInfo}
                                    >
                                        <div
                                            className={
                                                styles.selectedName
                                            }
                                        >
                                            {item.itemName}
                                        </div>

                                        <div
                                            className={
                                                styles.selectedPrice
                                            }
                                        >
                                            {item.basePrice.toLocaleString(
                                                "vi-VN"
                                            )}{" "}
                                            đ
                                        </div>
                                    </div>

                                    <div className={styles.qtyBox}>
                                        <button
                                            className={styles.qtyBtn}
                                            onClick={() =>
                                                updateQuantity(
                                                    itemId,
                                                    quantity - 1
                                                )
                                            }
                                        >
                                            -
                                        </button>

                                        <span
                                            className={styles.qtyValue}
                                        >
                                            {quantity}
                                        </span>

                                        <button
                                            className={styles.qtyBtn}
                                            onClick={() =>
                                                updateQuantity(
                                                    itemId,
                                                    quantity + 1
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.stats}>
                        <div className={styles.statRow}>
                            <span>Tổng tiền món</span>
                            <strong>
                                {totalFood.toLocaleString(
                                    "vi-VN"
                                )}{" "}
                                đ
                            </strong>
                        </div>

                        <div className={styles.statRow}>
                            <span>Số bàn</span>
                            <strong>
                                {selectedTables.length}
                            </strong>
                        </div>

                        <div className={styles.statRow}>
                            <span>Tiền cọc dự kiến</span>
                            <strong className={styles.deposit}>
                                {estimatedDeposit.toLocaleString(
                                    "vi-VN"
                                )}{" "}
                                đ
                            </strong>
                        </div>
                    </div>

                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading
                            ? "Đang tạo..."
                            : "Xác nhận đặt bàn"}
                    </button>
                </div>
            </div>

            {/* RIGHT */}
            <div className={styles.content}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        Danh sách bàn khả dụng
                    </h2>

                    {!date || !time ? (
                        <p>
                            Vui lòng chọn ngày và giờ để
                            xem bàn trống
                        </p>
                    ) : (
                        <div className={styles.tableGrid}>
                            {tables.map((table) => (
                                <div
                                    key={table.tableId}
                                    onClick={() =>
                                        toggleTable(table.tableId)
                                    }
                                    className={`${styles.tableCard} ${selectedTables.includes(
                                        table.tableId
                                    )
                                        ? styles.tableSelected
                                        : ""
                                        }`}
                                >
                                    <div
                                        className={styles.tableCode}
                                    >
                                        {table.tableCode}
                                    </div>

                                    <div
                                        className={
                                            styles.tableCapacity
                                        }
                                    >
                                        Sức chứa:{" "}
                                        {table.capacity} khách
                                    </div>

                                    <div
                                        className={
                                            styles.tableStatus
                                        }
                                    >
                                        Trống
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        Thực đơn
                    </h2>
                    <div className={styles.filterBar}>
                        <input
                            className={styles.searchInput}
                            placeholder="Tìm món ăn..."
                            value={keyword}
                            onChange={(e) =>
                                setKeyword(e.target.value)
                            }
                        />

                        <select
                            className={styles.categorySelect}
                            value={selectedCategory}
                            onChange={(e) =>
                                setSelectedCategory(e.target.value)
                            }
                        >
                            <option value="all">
                                Tất cả danh mục
                            </option>

                            {categories
                                .filter((x) => x !== "all")
                                .map((category) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className={styles.menuGrid}>
                        {menuItems.map((item) => (
                            <div
                                key={item.itemId}
                                className={styles.menuCard}
                            >
                                <div
                                    className={styles.menuName}
                                >
                                    {item.itemName}
                                </div>

                                <div
                                    className={styles.menuPrice}
                                >
                                    {item.basePrice.toLocaleString(
                                        "vi-VN"
                                    )}{" "}
                                    đ
                                </div>

                                <button
                                    className={styles.addBtn}
                                    onClick={() =>
                                        addMenuItem(item.itemId)
                                    }
                                >
                                    + Thêm món
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}