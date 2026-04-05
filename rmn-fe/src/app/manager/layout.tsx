"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./manager.module.css";

const NAV_ITEMS = [
    { href: "/manager/dining-tables", label: "Quản lý bàn ăn" },
    { href: "/manager/menu-categories", label: "Danh mục món" },
    { href: "/manager/menu-items", label: "Quản lý món ăn" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoggedIn, logout } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Đánh dấu đã hydrate xong
    useEffect(() => { setMounted(true); }, []);

    // Chỉ redirect sau khi đã mount (tránh SSR null → redirect sai)
    useEffect(() => {
        if (!mounted) return;
        if (!isLoggedIn) { router.replace("/login?redirect=/manager"); return; }
        if (!user?.roles.includes("Manager") && !user?.roles.includes("Admin")) { router.replace("/"); }
    }, [mounted, isLoggedIn, user, router]);

    // Chờ hydration hoặc đang chờ auth state
    if (!mounted || !isLoggedIn || (!user?.roles.includes("Manager") && !user?.roles.includes("Admin"))) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100svh", color: "#94a3b8", fontSize: "0.9rem" }}>
                Đang kiểm tra quyền truy cập...
            </div>
        );
    }

    return (
        <div className={styles.shell}>
            {/* ── SIDEBAR ──────────────────────────────── */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTop}>
                    <Link href="/manager" className={styles.brand}>
                        <span className={styles.brandLabel}>Manager Panel</span>
                    </Link>
                </div>

                <nav className={styles.sideNav}>
                    <p className={styles.navGroup}>Quản lý</p>
                    {NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href} className={styles.navItem}>
                            {item.label}
                        </Link>
                    ))}

                    <p className={styles.navGroup} style={{ marginTop: '1.5rem' }}>Khuyến mãi & Cấu hình</p>
                    <Link href="/manager/system-config" className={styles.navItem}>Cấu hình Thuế (VAT)</Link>
                    <Link href="/manager/discount-codes" className={styles.navItem}>Quản lý Mã giảm giá</Link>
                    <Link href="/manager/loyalty-config" className={styles.navItem}>Cấu hình Tích điểm</Link>
                    <Link href="/manager/loyalty-history" className={styles.navItem}>Lịch sử Điểm</Link>

                    <p className={styles.navGroup} style={{ marginTop: '1.5rem' }}>Quản lý Đặt bàn & Order</p>
                    <Link href="/manager/reservations" className={styles.navItem}>Lịch sử Đặt bàn</Link>

                </nav>

                <div className={styles.sidebarFoot}>
                    <div className={styles.userChip}>
                        <div className={styles.userAvatar}>{user.fullName.charAt(0).toUpperCase()}</div>
                        <div className={styles.userMeta}>
                            <span className={styles.userName}>{user.fullName}</span>
                            <span className={styles.userRole}>Manager</span>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={() => { logout(); router.push("/login"); }}>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* ── MAIN ─────────────────────────────────── */}
            <div className={styles.main}>
                {/* Header */}
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <Link href="/" className={styles.backHome}>← Về trang chủ</Link>
                    </div>
                    <div className={styles.topbarRight}>
                        <span className={styles.topbarUser}>{user.fullName}</span>
                    </div>
                </header>

                {/* Page content */}
                <div className={styles.content}>{children}</div>
            </div>
        </div>
    );
}
