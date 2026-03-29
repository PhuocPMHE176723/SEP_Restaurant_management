"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import styles from "../manager/manager.module.css";

const CASHIER_NAV = [
  { href: "/cashier/reservations", label: "Danh sách đặt bàn" },
  { href: "/cashier/checkin", label: "Check-in & Gán bàn" },
  { href: "/cashier/walkin", label: "Khách vãng lai" },
  { href: "/cashier/orders", label: "Quản lý Order" },
  { href: "/cashier/dining-tables", label: "Sơ đồ bàn" },
  { href: "/cashier/table-transfer", label: "Chuyển bàn" },
];

export default function ReceptionistLayout({
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
      router.replace("/login?redirect=/cashier");
      return;
    }
    const allowed =
      user?.roles.includes("Cashier") ||
      user?.roles.includes("Receptionist") ||
      user?.roles.includes("Manager") ||
      user?.roles.includes("Admin");
    if (!allowed) {
      router.replace("/");
    }
  }, [mounted, isLoggedIn, user, router]);

  const allowed =
    user?.roles.includes("Cashier") ||
    user?.roles.includes("Receptionist") ||
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
          <Link href="/cashier" className={styles.brand}>
            <span className={styles.brandLabel}>Cashier Portal</span>
          </Link>
        </div>

        <nav className={styles.sideNav}>
          <div className={styles.navSection}>
            <p className={styles.navGroup}>Nghiệp vụ thu ngân</p>
            {CASHIER_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navItem}>
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
              <span className={styles.userRole}>Cổng thu ngân</span>
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
