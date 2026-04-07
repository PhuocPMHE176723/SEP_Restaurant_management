"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import styles from "../manager/manager.module.css"; // Reusing admin styles

const NAV_ITEMS = [
    { href: "/warehouse/ingredients", label: "Danh sách nguyên liệu" },
    { href: "/warehouse/daily-estimation", label: "Định lượng theo ngày" },
    { href: "/warehouse/stock-in", label: "Phiếu nhập kho" },
    { href: "/warehouse/inventory", label: "Tồn kho & Cảnh báo" },
    { href: "/warehouse/transactions", label: "Lịch sử kho" },
];

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoggedIn, logout } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!mounted) return;
        if (!isLoggedIn) { router.replace("/login?redirect=/warehouse"); return; }
        // Note: Staff might have multiple roles. Admin should also be allowed.
        const canAccess = user?.roles.includes("Warehouse") || user?.roles.includes("Admin");
        if (!canAccess) { router.replace("/"); }
    }, [mounted, isLoggedIn, user, router]);

    if (!mounted || !isLoggedIn || (!user?.roles.includes("Warehouse") && !user?.roles.includes("Admin"))) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100svh", color: "#94a3b8", fontSize: "0.9rem" }}>
                Đang kiểm tra quyền truy cập kho...
            </div>
        );
    }

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTop}>
                    <Link href="/warehouse" className={styles.brand}>
                        <span className={styles.brandLabel}>Quản lý Kho</span>
                    </Link>
                </div>

                <nav className={styles.sideNav}>
                    <p className={styles.navGroup}>Tính năng</p>
                    {NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href} className={styles.navItem}>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFoot}>
                    <div className={styles.userChip}>
                        <div className={styles.userAvatar}>{user.fullName.charAt(0).toUpperCase()}</div>
                        <div className={styles.userMeta}>
                            <span className={styles.userName}>{user.fullName}</span>
                            <span className={styles.userRole}>Thủ kho</span>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={() => { logout(); router.push("/login"); }}>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <div className={styles.main}>
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <Link href="/" className={styles.backHome}>← Về trang chủ</Link>
                    </div>
                    <div className={styles.topbarRight}>
                        <span className={styles.topbarUser}>{user.fullName}</span>
                    </div>
                </header>

                <div className={styles.content}>{children}</div>
            </div>
        </div>
    );
}
