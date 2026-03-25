"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMenuItems, getMenuCategories, type MenuItem, type MenuCategory } from "@/lib/api/admin";
import { getToken } from "@/lib/auth";
import styles from "./Order.module.css";
import { ShoppingCart, Send, Plus, Minus, Search, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

interface CartItem {
    menuItemId: number;
    itemName: string;
    quantity: number;
    price: number;
    thumbnail?: string;
    note?: string;
}

export default function GuestOrderPage() {
    const { id: tableId } = useParams();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const [itemsData, catsData] = await Promise.all([
                    getMenuItems(),
                    getMenuCategories()
                ]);
                setItems(itemsData.filter(i => i.isActive));
                setCategories(catsData.filter(c => c.isActive));
            } catch (error) {
                toast.error("Không thể tải thực đơn");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.menuItemId === item.itemId);
            if (existing) {
                return prev.map(i => i.menuItemId === item.itemId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                menuItemId: item.itemId,
                itemName: item.itemName,
                quantity: 1,
                price: item.basePrice,
                thumbnail: item.thumbnail || undefined
            }];
        });
        toast.success(`Đã thêm ${item.itemName} vào giỏ`);
    };

    const updateCartQty = (id: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.menuItemId === id) {
                const newQty = Math.max(1, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }));
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(i => i.menuItemId !== id));
    };

    const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const handleSubmitOrder = async () => {
        if (cart.length === 0) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/api/Order/guest-add-items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tableId: Number(tableId),
                    items: cart.map(i => ({
                        menuItemId: i.menuItemId,
                        quantity: i.quantity,
                        note: i.note
                    }))
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gửi yêu cầu thất bại");
            
            toast.success("Gọi món thành công! Vui lòng đợi nhân viên xác nhận.");
            setCart([]);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = items.filter(i => {
        const matchCat = !selectedCategory || i.categoryId === selectedCategory;
        const matchSearch = i.itemName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCat && matchSearch;
    });

    if (loading) return <div className={styles.loading}>Đang chuẩn bị thực đơn...</div>;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>Gọi món tại bàn {tableId}</h1>
                    <p>Nhà hàng Khói Quê xin chào quý khách!</p>
                </div>
            </header>

            <main className={styles.main}>
                {/* Menu Section */}
                <section className={styles.menuSection}>
                    <div className={styles.searchBar}>
                        <Search size={20} className={styles.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Tìm món ăn..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className={styles.categories}>
                        <button 
                            className={`${styles.catBtn} ${!selectedCategory ? styles.activeCat : ""}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            Tất cả
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat.categoryId} 
                                className={`${styles.catBtn} ${selectedCategory === cat.categoryId ? styles.activeCat : ""}`}
                                onClick={() => setSelectedCategory(cat.categoryId)}
                            >
                                {cat.categoryName}
                            </button>
                        ))}
                    </div>

                    <div className={styles.grid}>
                        {filteredItems.map(item => (
                            <div key={item.itemId} className={styles.card}>
                                <div className={styles.cardImg}>
                                    {item.thumbnail ? (
                                        <img src={item.thumbnail} alt={item.itemName} />
                                    ) : (
                                        <div className={styles.noImg}>Khói Quê</div>
                                    )}
                                </div>
                                <div className={styles.cardInfo}>
                                    <h3>{item.itemName}</h3>
                                    <p className={styles.price}>{item.basePrice.toLocaleString()} đ</p>
                                    <button className={styles.addBtn} onClick={() => addToCart(item)}>
                                        <Plus size={18} /> Thêm vào giỏ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Cart Section */}
                <aside className={styles.cartSection}>
                    <div className={styles.cartHeader}>
                        <ShoppingCart size={24} />
                        <h2>Giỏ hàng của bạn</h2>
                    </div>

                    <div className={styles.cartItems}>
                        {cart.length === 0 ? (
                            <div className={styles.emptyCart}>
                                <p>Giỏ hàng đang trống.</p>
                                <p>Hãy chọn món từ thực đơn bên trái!</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.menuItemId} className={styles.cartItem}>
                                    <div className={styles.cartItemInfo}>
                                        <h4>{item.itemName}</h4>
                                        <p>{item.price.toLocaleString()} đ</p>
                                        <input 
                                            className={styles.noteInput}
                                            placeholder="Ghi chú (cay, ít đá...)"
                                            value={item.note || ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCart(prev => prev.map(i => i.menuItemId === item.menuItemId ? { ...i, note: val } : i));
                                            }}
                                        />
                                    </div>
                                    <div className={styles.cartItemActions}>
                                        <div className={styles.qtyBox}>
                                            <button onClick={() => updateCartQty(item.menuItemId, -1)}><Minus size={16}/></button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateCartQty(item.menuItemId, 1)}><Plus size={16}/></button>
                                        </div>
                                        <button className={styles.removeBtn} onClick={() => removeFromCart(item.menuItemId)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className={styles.cartFooter}>
                            <div className={styles.totalRow}>
                                <span>Tổng cộng:</span>
                                <strong>{totalAmount.toLocaleString()} đ</strong>
                            </div>
                            <button 
                                className={styles.submitBtn} 
                                onClick={handleSubmitOrder}
                                disabled={submitting}
                            >
                                {submitting ? "Đang gửi..." : <><Send size={20} /> Gửi yêu cầu gọi món</>}
                            </button>
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
}
