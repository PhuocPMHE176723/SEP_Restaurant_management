"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import styles from "../manager/manager.module.css";

const KITCHEN_NAV = [
  { href: "/kitchen", label: "Bảng điều hành" },
  { href: "/kitchen/history", label: "Lịch sử thực hiện" },
  { href: "/kitchen/stock-history", label: "Biến động kho" },
  { href: "/kitchen/reports/ingredient-usage", label: "Tiêu hao NL" },
];

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn) {
      router.replace("/login?redirect=/kitchen");
      return;
    }
    const allowed =
      user?.roles.includes("Kitchen") ||
      user?.roles.includes("Manager") ||
      user?.roles.includes("Admin");
    if (!allowed) {
      router.replace("/");
    }
  }, [mounted, isLoggedIn, user, router]);

  const allowed =
    user?.roles.includes("Kitchen") ||
    user?.roles.includes("Manager") ||
    user?.roles.includes("Admin");

  if (!mounted || !isLoggedIn || !allowed) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100svh",
          color: "#94a3b8",
          fontSize: "0.9rem",
        }}
      >
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/kitchen" className={styles.brand}>
            <span className={styles.brandLabel}>Kitchen Portal</span>
          </Link>
        </div>

        <nav className={styles.sideNav}>
          <div className={styles.navSection}>
            <p className={styles.navGroup}>Nghiệp vụ bếp</p>
            {KITCHEN_NAV.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className={styles.sidebarFoot}>
          <div className={styles.userChip}>
            <div className={styles.userAvatar}>
              {user?.fullName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user?.fullName}</span>
              <span className={styles.userRole}>Cổng nhà bếp</span>
            </div>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <Link href="/" className={styles.backHome}>
              <span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>←</span> 
              Về trang chủ
            </Link>
          </div>
        </header>

        <div className={styles.content} style={{ animation: "fadeIn 0.4s ease-out" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
