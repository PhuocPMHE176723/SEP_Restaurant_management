"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type NotificationItem,
} from "../../lib/api/notification";
import {
  Bell,
  Check,
  CreditCard,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import styles from "./NotificationBell.module.css";

export default function NotificationBell() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [jiggle, setJiggle] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await getNotifications();
      // Sort: unread first, then newest first
      const sorted = [...data].sort((a, b) => {
        if (a.isRead !== b.isRead) {
          return a.isRead ? 1 : -1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setNotifications(sorted);
      const unread = sorted.filter((n) => !n.isRead).length;
      setUnreadCount(unread);

      // Trigger jiggle animation if new unread notifications arrive
      if (unread > prevCountRef.current) {
        setJiggle(true);
        setTimeout(() => setJiggle(false), 500);
      }
      prevCountRef.current = unread;
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Poll notifications every 10 seconds
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoggedIn) return null;

  const handleMarkAllRead = async () => {
    try {
      const ok = await markAllAsRead();
      if (ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
        prevCountRef.current = 0;
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    // 1. Mark as read immediately on UI & API
    if (!item.isRead) {
      try {
        await markAsRead(item.notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === item.notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        prevCountRef.current = Math.max(0, prevCountRef.current - 1);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    setIsOpen(false);

    const hasRole = (roleName: string) =>
      user?.roles?.some((r) => r.trim().toLowerCase() === roleName.toLowerCase()) ?? false;

    const isCustomer = hasRole("Customer");
    const isStaff = user?.roles?.some((r) =>
      ["staff", "cashier", "manager", "kitchen", "warehouse", "admin"].includes(r.trim().toLowerCase())
    ) ?? false;

    if (item.type === "RESERVATION") {
      if (isCustomer) {
        router.push("/reservations");
      } else if (isStaff) {
        if (hasRole("Cashier")) {
          router.push("/cashier/reservations");
        } else if (hasRole("Manager") || hasRole("Admin")) {
          router.push("/manager/reservations");
        } else {
          router.push("/staff/reservations");
        }
      }
    } else if (item.type === "CHECKIN") {
      if (isStaff) {
        if (hasRole("Cashier")) {
          router.push("/cashier/dining-tables");
        } else {
          router.push("/staff/dining-tables");
        }
      }
    } else if (item.type === "PAYMENT") {
      if (isCustomer) {
        router.push("/profile/customer");
      } else if (isStaff) {
        if (hasRole("Cashier")) {
          router.push("/cashier/orders");
        } else if (hasRole("Manager") || hasRole("Admin")) {
          router.push("/manager/loyalty-history");
        } else {
          router.push("/staff/orders");
        }
      }
    } else if (item.type === "CLEANUP") {
      if (hasRole("Manager") || hasRole("Admin")) {
        router.push("/manager/dining-tables?action=cleanup");
      } else if (hasRole("Staff")) {
        router.push("/staff/dining-tables");
      }
    }
  };

  const getIconAndClass = (type: string) => {
    switch (type.toUpperCase()) {
      case "CHECKIN":
        return {
          icon: <CheckSquare size={16} />,
          className: styles.type_checkin,
        };
      case "PAYMENT":
        return {
          icon: <CreditCard size={16} />,
          className: styles.type_payment,
        };
      case "RESERVATION":
        return {
          icon: <Calendar size={16} />,
          className: styles.type_reservation,
        };
      case "CLEANUP":
        return {
          icon: <RefreshCw size={16} />,
          className: styles.type_cleanup,
        };
      default:
        return {
          icon: <Bell size={16} />,
          className: styles.type_default,
        };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMs / 3600000);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHrs < 24) return `${diffHrs} giờ trước`;

      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.bellButton} ${jiggle ? styles.bellJiggle : ""}`}
        aria-label="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3 className={styles.title}>
              <Bell size={18} style={{ color: "#f97316" }} />
              Thông báo
            </h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className={styles.markAllBtn}>
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <AlertCircle size={28} />
                <span className={styles.emptyText}>Không có thông báo mới</span>
              </div>
            ) : (
              notifications.map((item) => {
                const { icon, className } = getIconAndClass(item.type);
                return (
                  <div
                    key={item.notificationId}
                    onClick={() => handleItemClick(item)}
                    className={`${styles.item} ${
                      !item.isRead ? styles.itemUnread : ""
                    }`}
                  >
                    <div className={`${styles.iconWrapper} ${className}`}>
                      {icon}
                    </div>
                    <div className={styles.content}>
                      <h4 className={styles.itemTitle}>{item.title}</h4>
                      <p className={styles.itemMessage}>{item.message}</p>
                      <p className={styles.itemTime}>
                        {formatTimeAgo(item.createdAt)}
                      </p>
                    </div>
                    {!item.isRead && <span className={styles.unreadDot} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
