"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import styles from "../manager/manager.module.css";

const NAV_ITEMS = [
  // Đặt bàn & Check-in
  { href: "/staff/reservations", label: "Đặt bàn" },
  { href: "/staff/checkin", label: "Check-in & Gán bàn" },
  { href: "/staff/walkin", label: "Khách vãng lai" },

  // Order & Bàn
  { href: "/staff/orders", label: "Order tại bàn" },
  { href: "/staff/dining-tables", label: "Danh sách bàn" },
  { href: "/staff/table-transfer", label: "Chuyển bàn" },
  // Phục vụ tại bàn
  { href: "/staff/serving_list", label: "Danh sách phục vụ" },

  // Content Management
  { href: "/staff/blog", label: "Quản lý Blog" },
  { href: "/staff/sliders", label: "Quản lý Sliders" },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn) {
      router.replace("/login?redirect=/staff");
      return;
    }
    const allowed =
      user?.roles.includes("Staff") ||
      user?.roles.includes("Manager") ||
      user?.roles.includes("Admin");
    if (!allowed) {
      router.replace("/");
    }
  }, [mounted, isLoggedIn, user, router]);

  const allowed =
    user?.roles.includes("Staff") ||
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
          <Link href="/staff" className={styles.brand}>
            <span className={styles.brandLabel}>Staff Portal</span>
          </Link>
        </div>

        <nav className={styles.sideNav}>
          <div className={styles.navSection}>
            <p className={styles.navGroup}>Nghiệp vụ chính</p>
            {NAV_ITEMS.slice(0, 3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navItem}
                data-active={router === (item.href as any)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className={styles.navSection}>
            <p className={styles.navGroup}>Phục vụ tại bàn</p>
            {NAV_ITEMS.slice(3, 6).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navItem}
                data-active={router === (item.href as any)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className={styles.navSection}>
            <p className={styles.navGroup}>Nội dung Website</p>
            {NAV_ITEMS.slice(6).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navItem}
                data-active={router === (item.href as any)}
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
              <span className={styles.userRole}>Cổng nhân viên</span>
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
              <span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>
                ←
              </span>
              Về trang chủ
            </Link>
          </div>
        </header>

        <div
          className={styles.content}
          style={{ animation: "fadeIn 0.4s ease-out" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
