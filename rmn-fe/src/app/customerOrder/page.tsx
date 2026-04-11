"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../contexts/AuthContext";
import {
  customerApi,
  type CustomerContextDTO,
  type OrderDTO,
  type ReservationDTO,
} from "../../lib/api/customer";
import styles from "./page.module.css";

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatServingTime(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm} - Hôm nay`;
}

function formatReservationTime(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const MM = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${hh}:${mm} - Ngày ${dd}/${MM}`;
}

function ServingView({ order }: { order: OrderDTO }) {
  return (
    <div className={styles.screenWrap}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.pageModeTitle}>
            {order.tableName ? `Chi tiết ${order.tableName}` : "Chi tiết bàn"}
          </h2>
          <p className={`${styles.pageModeSub} ${styles.servingSub}`}>
            Phục vụ tại chỗ
          </p>
        </div>

        {/* <button className={styles.addButton}>
          <span className={styles.plus}>+</span>
          Thêm món
        </button> */}
      </div>

      <div className={styles.orderCard}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.metaLabel}>Giờ vào bàn</p>
            <p className={styles.metaValue}>{formatServingTime(order.openedAt)}</p>
          </div>

          <div className={styles.metaRight}>
            <p className={styles.metaLabel}>Mã hóa đơn</p>
            <p className={styles.metaValue}>{order.orderCode}</p>
          </div>
        </div>

        <div className={styles.itemsSection}>
          {order.orderItems?.length ? (
            order.orderItems.map((item, index) => (
              <div key={item.orderItemId} className={styles.itemRow}>
                <div className={styles.itemThumb}>
                  <div className={styles.fakeThumb}>{index + 1}</div>
                </div>

                <div className={styles.itemInfo}>
                  <h4 className={styles.itemName}>
                    {item.menuItemName}
                    <span className={styles.itemQty}>x{item.quantity}</span>
                  </h4>
                  <p className={styles.itemSubtle}>
                    {item.note || "Đang chuẩn bị..."}
                  </p>
                </div>

                <div className={styles.itemPrice}>
                  {formatCurrency(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))
          ) : (
            <p className={styles.emptyText}>Chưa có món nào trong đơn.</p>
          )}
        </div>

        <div className={styles.bottomSection}>
          <div className={styles.bottomTop}>
            <div>
              <p className={styles.noteText}>
                * Vui lòng kiểm tra lại món trước khi thanh toán
              </p>
            </div>

            <div className={styles.totalBox}>
              <p className={styles.totalLabel}>Tổng cộng</p>
              <p className={styles.totalValue}>{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button className={styles.primaryButton}>Thanh toán</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreorderView({ reservation }: { reservation: ReservationDTO }) {
  const preorder = reservation.order;

  return (
    <div className={styles.screenWrap}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.pageModeTitle}>Đơn hẹn sắp tới</h2>
          <p className={`${styles.pageModeSub} ${styles.preorderSub}`}>
            #{preorder?.orderCode || `KQ-PRE-${reservation.reservationId}`}
          </p>
        </div>

      </div>

      <div className={styles.orderCard}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.metaLabel}>Thời gian đặt hẹn</p>
            <p className={`${styles.metaValue} ${styles.highlightValue}`}>
              {formatReservationTime(reservation.reservedAt)}
            </p>
          </div>

          <div className={styles.metaRight}>
            <p className={styles.metaLabel}>Mã hóa đơn</p>
            <p className={styles.metaValue}>{preorder?.orderCode || "--"}</p>
          </div>
        </div>

        <div className={styles.itemsSection}>
          {preorder?.orderItems?.length ? (
            preorder.orderItems.map((item, index) => (
              <div key={item.orderItemId} className={styles.itemRow}>
                <div className={styles.itemThumb}>
                  <div className={styles.fakeThumb}>{index + 1}</div>
                </div>

                <div className={styles.itemInfo}>
                  <h4 className={styles.itemName}>
                    {item.menuItemName}
                    <span className={styles.itemQty}>x{item.quantity}</span>
                  </h4>
                  <p className={styles.itemSubtle}>
                    {item.note || "Đã xác nhận"}
                  </p>
                </div>

                <div className={styles.itemPrice}>
                  {formatCurrency(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))
          ) : (
            <p className={styles.emptyText}>Chưa có món đặt trước.</p>
          )}
        </div>

        <div className={styles.bottomSection}>
          <div className={styles.bottomTop}>
            <div>
              {/* <p className={styles.depositText}>Đã đặt cọc: 200.000đ</p> */}
            </div>

            <div className={styles.totalBox}>
              <p className={styles.totalLabel}>Tổng cộng</p>
              <p className={styles.totalValue}>
                {formatCurrency(preorder?.totalAmount ?? 0)}
              </p>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button className={styles.primaryButton}>Hủy đơn</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyView() {
  return (
    <div className={styles.emptyState}>
      <h3>Chưa có đơn hiện tại</h3>
      <p>Bạn chưa có đơn đang phục vụ hoặc đơn đặt trước.</p>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<CustomerContextDTO | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isLoggedIn) {
      router.push("/login?redirect=/orders");
      return;
    }

    if (user && !user.roles.includes("Customer")) {
      router.push("/");
      return;
    }

    void loadContext();
  }, [mounted, isLoggedIn, user, router]);

  async function loadContext() {
    try {
      setLoading(true);
      setError(null);
      const data = await customerApi.getMyContext();
      setContext(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải đơn hiện tại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          {!mounted || loading ? (
            <EmptyView />
          ) : error ? (
            <div className={styles.emptyState}>
              <h3>Không thể tải dữ liệu</h3>
              <p>{error}</p>
            </div>
          ) : context?.displayMode === "SERVING" && context.activeOrder ? (
            <ServingView order={context.activeOrder} />
          ) : context?.displayMode === "PREORDER" && context.activeReservation ? (
            <PreorderView reservation={context.activeReservation} />
          ) : (
            <EmptyView />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}