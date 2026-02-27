"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import MenuCard from "../components/MenuCard/MenuCard";
import { getFeaturedItems, getCategories } from "../lib/api/client";
import type { MenuItem, Category } from "../types/generated";
import styles from "./page.module.css";

export default function Home() {
  const [featured, setFeatured] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [items, cats] = await Promise.all([getFeaturedItems(), getCategories()]);
      setFeatured(items);
      setCategories(cats.filter((c) => c.id !== "all"));
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Header />
      <main>
        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroBg}>
            <div className={`${styles.blob} ${styles.blob1}`} />
            <div className={`${styles.blob} ${styles.blob2}`} />
            <div className={`${styles.blob} ${styles.blob3}`} />
          </div>
          <div className={`container ${styles.heroContent}`}>
            <div className={styles.heroText}>
              <span className={styles.heroEyebrow}>Nhà Hàng Khói Quê — Tân Cổ Điển</span>
              <h1 className={styles.heroHeadline}>
                Trải nghiệm ẩm thực<br />
                <span className={styles.heroHighlight}>đẳng cấp</span> thật sự
              </h1>
              <p className={styles.heroSub}>
                Không gian sang trọng, món ăn tinh tế, phục vụ tận tâm.
                Đặt bàn ngay để có chỗ ngồi đẹp nhất cho bữa tối của bạn.
              </p>
              <div className={styles.heroActions}>
                <Link href="/booking" className={`btn btn-primary ${styles.ctaPrimary}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Đặt bàn ngay
                </Link>
                <Link href="/menu" className={`btn btn-outline ${styles.ctaSecondary}`}>
                  Xem thực đơn
                </Link>
              </div>
              {/* Stats */}
              <div className={styles.stats}>
                {[
                  { num: "10+", label: "Năm kinh nghiệm" },
                  { num: "4.9★", label: "Đánh giá" },
                  { num: "50k+", label: "Lượt khách" },
                ].map((s, i) => (
                  <div key={i} className={styles.stat}>
                    {i > 0 && <div className={styles.statDiv} />}
                    <span className={styles.statNum}>{s.num}</span>
                    <span className={styles.statLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.dishGrid}>
                {[
                  "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80",
                  "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400&q=80",
                  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80",
                  "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80",
                ].map((src, i) => (
                  <img key={i} src={src} alt="" className={`${styles.dish} ${styles[`dish${i+1}` as keyof typeof styles]}`} />
                ))}
              </div>
              <div className={styles.floatingCard}>
                <div>
                  <p className={styles.fcTitle}>Đặt bàn dễ dàng</p>
                  <p className={styles.fcSub}>Xác nhận trong 30 phút</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CATEGORY ── */}
        <section className={styles.catSection}>
          <div className="container">
            <div className={styles.sectionHead}>
              <h2 className="section-title">Danh mục món ăn</h2>
              <p className="section-subtitle">Khám phá thực đơn phong phú của chúng tôi</p>
            </div>
            <div className={styles.catGrid}>
              {categories.map((cat) => (
                <Link key={cat.id} href={`/menu?category=${cat.id}`} className={styles.catCard}>
                  <span className={styles.catIcon}>{cat.icon}</span>
                  <span className={styles.catName}>{cat.name}</span>
                  {cat.itemCount !== undefined && (
                    <span className={styles.catCount}>{cat.itemCount} món</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURED ── */}
        <section className={styles.featuredSection}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <h2 className="section-title">Món nổi bật</h2>
                <p className="section-subtitle">Tinh hoa ẩm thực được lòng thực khách</p>
              </div>
              <Link href="/menu" className={`btn btn-outline ${styles.viewAllBtn}`}>
                Xem tất cả
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            </div>
            {loading ? <div className="spinner" /> : (
              <div className="grid-dishes">
                {featured.map((item) => <MenuCard key={item.id} item={item} />)}
              </div>
            )}
          </div>
        </section>

        {/* ── WHY US ── */}
        <section className={styles.whySection}>
          <div className="container">
            <div className={styles.sectionHead}>
              <h2 className="section-title">Tại sao chọn chúng tôi?</h2>
            </div>
            <div className={styles.whyGrid}>
              {[
                { title: "Ẩm thực đẳng cấp", desc: "Đầu bếp 5 sao, nguyên liệu nhập khẩu hàng đầu, công thức độc quyền." },
                { title: "Nguyên liệu tươi sạch", desc: "Chọn lọc kỹ từ các nguồn cung ứng uy tín, cam kết an toàn thực phẩm." },
                { title: "Không gian sang trọng", desc: "Nội thất tân cổ điển, ánh sáng ấm áp, phù hợp mọi dịp đặc biệt." },
                { title: "Sự kiện đặc biệt", desc: "Tổ chức sinh nhật, kỷ niệm, tiệc doanh nghiệp với menu và decor riêng." },
              ].map((w) => (
                <div key={w.title} className={styles.whyCard}>
                  <h3 className={styles.whyTitle}>{w.title}</h3>
                  <p className={styles.whyDesc}>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.ctaBanner}>
          <div className="container">
            <div className={styles.ctaInner}>
              <div>
                <h2 className={styles.ctaTitle}>Đặt bàn ngay hôm nay!</h2>
                <p className={styles.ctaSub}>Chỗ ngồi có hạn — hãy đặt trước để không bỏ lỡ.</p>
              </div>
              <Link href="/booking" className={`btn ${styles.ctaBtn}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Đặt bàn miễn phí
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
