"use client";

import Link from "next/link";
import styles from "../manager/manager.module.css";

export default function StaffHome() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Trang nhân viên</h1>
          <p className={styles.pageSubtitle}>
            Thao tác đặt bàn, gán bàn và order tại bàn.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        <Link
          href="/staff/reservations"
          className={styles.tableWrap}
          style={{ textDecoration: "none", padding: "1.25rem" }}
        >
          <h3 className={styles.pageTitle} style={{ fontSize: "1rem" }}>
            Đặt bàn
          </h3>
          <p className={styles.pageSubtitle}>
            Tạo và xử lý đặt bàn, check-in, chuyển bàn.
          </p>
        </Link>
        <Link
          href="/staff/orders"
          className={styles.tableWrap}
          style={{ textDecoration: "none", padding: "1.25rem" }}
        >
          <h3 className={styles.pageTitle} style={{ fontSize: "1rem" }}>
            Order tại bàn
          </h3>
          <p className={styles.pageSubtitle}>
            Mở order, thêm/sửa món, gửi bếp.
          </p>
        </Link>
        <Link
          href="/staff/dining-tables"
          className={styles.tableWrap}
          style={{ textDecoration: "none", padding: "1.25rem" }}
        >
          <h3 className={styles.pageTitle} style={{ fontSize: "1rem" }}>
            Danh sách bàn
          </h3>
          <p className={styles.pageSubtitle}>
            Xem tình trạng bàn trống/đang dùng/đã đặt.
          </p>
        </Link>
      </div>
    </div>
  );
}
