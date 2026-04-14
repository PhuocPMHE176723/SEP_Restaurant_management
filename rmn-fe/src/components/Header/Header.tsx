"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Chỉ render auth UI sau khi component mounted để tránh hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    router.push("/login");
  }

  const isManager = user?.roles.includes("Manager");
  const isWarehouse = user?.roles.includes("Warehouse");
  const isStaff = user?.roles.includes("Staff");
  const isKitchen = user?.roles.includes("Kitchen");
  const isCashier = user?.roles.includes("Cashier");
  const isCustomer = user?.roles.includes("Customer");

  if (!mounted) {
    return (
      <header className={styles.header} suppressHydrationWarning>
        <div className={styles.topBar}>
          <div className={`container ${styles.topBarInner}`}>
            <div className={styles.branchList}>
              <div className={styles.branchItem}><div style={{ width: 150, height: 14, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} /></div>
              <div className={styles.branchItem}><div style={{ width: 150, height: 14, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} /></div>
              <div className={styles.branchItem}><div style={{ width: 150, height: 14, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} /></div>
            </div>
          </div>
        </div>
        <div className={`container ${styles.inner}`}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>
              Nhà Hàng <strong>Khói Quê</strong>
            </span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              Trang chủ
            </Link>
            <Link href="/menu" className={styles.navLink}>
              Thực đơn
            </Link>
            <Link href="/blog" className={styles.navLink}>
              Tin tức
            </Link>
            <Link href="/about" className={styles.navLink}>
              Giới thiệu
            </Link>
          </nav>
          <div className={styles.actions}>
            <div style={{ width: 200, height: 40 }} />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      {/* Top Bar - Addresses */}
      <div className={styles.topBar}>
        <div className={`container ${styles.topBarInner}`}>
          <div className={styles.branchList}>
            <div className={styles.branchItem}>
              <svg className={styles.branchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span><strong>Hà Nội:</strong> 123 Phố Huế, Hai Bà Trưng</span>
            </div>
            <div className={styles.branchItem}>
              <svg className={styles.branchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span><strong>Đà Nẵng:</strong> 456 Võ Nguyên Giáp</span>
            </div>
            <div className={styles.branchItem}>
              <svg className={styles.branchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span><strong>TP. HCM:</strong> 789 Nguyễn Huệ, Quận 1</span>
            </div>
          </div>
          <div className={styles.contactInfo}>
            <span>Hotline: <strong>1900 6789</strong></span>
          </div>
        </div>
      </div>

      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>
            Nhà Hàng <strong>Khói Quê</strong>
          </span>
        </Link>

        {/* Nav */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            Trang chủ
          </Link>
          <Link href="/menu" className={styles.navLink}>
            Thực đơn
          </Link>
          <Link href="/blog" className={styles.navLink}>
            Tin tức
          </Link>
          <Link href="/about" className={styles.navLink}>
            Giới thiệu
          </Link>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {isLoggedIn && user ? (
            /* ── Đã đăng nhập ── */
            <div className={styles.userWrap} ref={menuRef}>
              {/* Warehouse portal shortcut */}
              {isWarehouse && (
                <Link
                  href="/warehouse"
                  className={`btn btn-ghost ${styles.adminBtn}`}
                >
                  Quản lý kho
                </Link>
              )}

              {/* Staff panel shortcut */}
              {isStaff && (
                <Link
                  href="/staff"
                  className={`btn btn-ghost ${styles.adminBtn}`}
                >
                  Cổng Nhân viên
                </Link>
              )}

              {/* Kitchen portal shortcut */}
              {isKitchen && (
                <Link
                  href="/kitchen"
                  className={`btn btn-ghost ${styles.adminBtn}`}
                >
                  Bếp
                </Link>
              )}

              {/* Cashier portal shortcut */}
              {isCashier && (
                <Link
                  href="/cashier"
                  className={`btn btn-ghost ${styles.adminBtn}`}
                >
                  Thu ngân
                </Link>
              )}

              {/* Manager panel shortcut */}
              {isManager && (
                <Link
                  href="/manager"
                  className={`btn btn-ghost ${styles.adminBtn}`}
                >
                  Cổng Quản lý
                </Link>
              )}

              {/* Avatar trigger */}
              <button
                id="user-menu-trigger"
                className={styles.userTrigger}
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
              >
                <div className={styles.avatar}>
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.fullName}</span>
                  <span className={styles.userRole}>
                    {(() => {
                      const roleMap: Record<string, string> = {
                        MANAGER: "Quản lý",
                        STAFF: "Nhân viên",
                        WAREHOUSE: "Nhân viên kho",
                        CASHIER: "Thu ngân",
                        KITCHEN: "Đầu bếp",
                        CUSTOMER: "Khách hàng",
                        ADMIN: "Quản trị viên",
                      };
                      const role = user.roles[0]?.toUpperCase();
                      return roleMap[role as keyof typeof roleMap] || user.roles[0];
                    })()}
                  </span>
                </div>
                <svg
                  className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ""}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user.fullName}</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link
                    href={isCustomer ? "/profile/customer" : "/profile/staff"}
                    className={styles.dropdownItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    Hồ sơ cá nhân
                  </Link>
                  {isCustomer && (
                    <>
                      <Link
                        href="/loyalty"
                        className={styles.dropdownItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Điểm tích lũy
                      </Link>
                      <Link
                        href="/reservations"
                        className={styles.dropdownItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Lịch sử đặt bàn
                      </Link>
                      <Link
                        href="/current-order"
                        className={styles.dropdownItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 3h18l-2 13H5L3 3z" />
                          <path d="M16 16a2 2 0 1 1-4 0" />
                          <path d="M8 16a2 2 0 1 1-4 0" />
                        </svg>
                        Đơn hiện tại
                      </Link>
                    </>
                  )}
                  {isManager && (
                    <Link
                      href="/manager"
                      className={styles.dropdownItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                      </svg>
                      Cổng Quản lý
                    </Link>
                  )}
                  {isWarehouse && (
                    <Link
                      href="/warehouse"
                      className={styles.dropdownItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                      Quản lý kho
                    </Link>
                  )}
                  {isKitchen && (
                    <Link
                      href="/kitchen"
                      className={styles.dropdownItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                      Cổng Nhà bếp
                    </Link>
                  )}
                  {isCashier && (
                    <Link
                      href="/cashier"
                      className={styles.dropdownItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                        <line x1="7" y1="15" x2="7.01" y2="15" />
                        <line x1="11" y1="15" x2="11.01" y2="15" />
                      </svg>
                      Cổng Thu ngân
                    </Link>
                  )}
                  {isStaff && (
                    <Link
                      href="/staff"
                      className={styles.dropdownItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Cổng Nhân viên
                    </Link>
                  )}
                  <div className={styles.dropdownDivider} />
                  <button
                    id="logout-btn"
                    className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                    onClick={handleLogout}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Chưa đăng nhập ── */
            <>
              <Link href="/login" className={`btn btn-ghost ${styles.authBtn}`}>
                Đăng nhập
              </Link>
              {/* <Link
                href="/register"
                className={`btn btn-ghost ${styles.authBtn}`}
              >
                Đăng ký
              </Link> */}
              <Link
                href="/new-register"
                className={`btn btn-ghost ${styles.authBtn}`}
              >
                Đăng ký
              </Link>
            </>
          )}

          {(!isLoggedIn || isCustomer) && (
            <Link
              href="/booking"
              className={`btn btn-primary ${styles.bookingBtn}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Đặt bàn
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
