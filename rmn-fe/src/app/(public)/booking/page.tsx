"use client";

import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import BookingForm from "../../../components/BookingForm/BookingForm";
import styles from "./page.module.css";

export default function BookingPage() {

  return (
    <>
      <Header />
      <main>
        {/* Page hero */}
        <div className={styles.hero}>
          <div className="container">
            <div className={styles.heroInner}>
              <span className={styles.eyebrow}>Đặt bàn trực tuyến</span>
              <h1 className={styles.heroTitle}>
                Đặt bàn tại Nhà Hàng Khói Quê
              </h1>
              <p className={styles.heroSub}>
                Chọn ngày, giờ và số lượng khách — chúng tôi sẽ chuẩn bị bàn tốt nhất cho bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <section className={styles.content}>
          <div className="container">
            <div className={styles.layout}>
              {/* Main: Form */}
              <div className={styles.main}>
                <BookingForm />
              </div>

              {/* Sidebar info */}
              <aside className={styles.sidebar}>
                <div className={styles.infoCard}>
                    <h3 className={styles.infoTitle}>Thông tin nhà hàng</h3>
                    <ul className={styles.infoList}>
                      <li className={styles.infoItem}>
                        <span className={styles.infoIcon}>📍</span>
                        <div>
                          <p className={styles.infoLabel}>Địa chỉ</p>
                          <p className={styles.infoValue}>123 Nguyễn Huệ, Quận 1, TP.HCM</p>
                        </div>
                      </li>
                      <li className={styles.infoItem}>
                        <span className={styles.infoIcon}>⏰</span>
                        <div>
                          <p className={styles.infoLabel}>Giờ mở cửa</p>
                          <p className={styles.infoValue}>Trưa: 11:00 – 14:00</p>
                          <p className={styles.infoValue}>Tối: 17:00 – 21:30</p>
                        </div>
                      </li>
                      <li className={styles.infoItem}>
                        <span className={styles.infoIcon}>📞</span>
                        <div>
                          <p className={styles.infoLabel}>Đặt bàn qua điện thoại</p>
                          <p className={styles.infoValue}>0900 123 456</p>
                        </div>
                      </li>
                      <li className={styles.infoItem}>
                        <span className={styles.infoIcon}>👥</span>
                        <div>
                          <p className={styles.infoLabel}>Sức chứa</p>
                          <p className={styles.infoValue}>Tối đa 200 khách</p>
                          <p className={styles.infoValue}>Phòng riêng từ 10 người</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className={styles.policyCard}>
                    <h3 className={styles.infoTitle}>Chính sách đặt bàn</h3>
                    <ul className={styles.policyList}>
                      <li>Đặt bàn miễn phí, không thu phí giữ chỗ</li>
                      <li>Bàn được giữ 15 phút sau giờ hẹn</li>
                      <li>Xác nhận qua điện thoại trong vòng 30 phút</li>
                      <li>Hỗ trợ tổ chức sinh nhật, sự kiện đặc biệt</li>
                      <li>Bãi giữ xe miễn phí cho khách đặt bàn</li>
                    </ul>
                  </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
