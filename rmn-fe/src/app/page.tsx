"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import MenuCard from "../components/MenuCard/MenuCard";
import { getFeaturedItems, getCategories } from "../lib/api/client";
import { sliderApi } from "../lib/api/slider";
import type { MenuItem, Category } from "../types/models";
import type { Slider } from "../types/models/content";
import styles from "./page.module.css";

export default function Home() {
  const [featured, setFeatured] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [items, cats, sliderList] = await Promise.all([
        getFeaturedItems(),
        getCategories(),
        sliderApi.getAllSliders().catch(() => []),
      ]);
      setFeatured(items);
      // Accent-insensitive dedupe by name
      const seen = new Set<string>();
      const filteredCats = cats.filter((c) => {
        const key = (c.name || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return c.id !== "all";
      });
      setCategories(filteredCats);
      setSliders(sliderList.filter(s => s.isActive));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliders]);

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
              <span className={styles.heroEyebrow}>
                Nhà Hàng Khói Quê — Tân Cổ Điển
              </span>
              <h1 className={styles.heroHeadline}>
                Trải nghiệm ẩm thực
                <br />
                <span className={styles.heroHighlight}>đẳng cấp</span> thật sự
              </h1>
              <p className={styles.heroSub}>
                Không gian sang trọng, món ăn tinh tế, phục vụ tận tâm. Đặt bàn
                ngay để có chỗ ngồi đẹp nhất cho bữa tối của bạn.
              </p>
              <div className={styles.heroActions}>
                <Link
                  href="/booking"
                  className={`btn btn-primary ${styles.ctaPrimary}`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Đặt bàn ngay
                </Link>
                <Link
                  href="/menu"
                  className={`btn btn-outline ${styles.ctaSecondary}`}
                >
                  Xem thực đơn
                </Link>
              </div>
            </div>

            <div className={styles.heroVisual}>
              {sliders.length > 0 ? (
                <div className={styles.slider}>
                  {sliders.map((slider, idx) => (
                    <div 
                      key={slider.sliderId} 
                      className={`${styles.slide} ${idx === activeSlide ? styles.slideActive : ""}`}
                    >
                      <img src={slider.imageUrl} alt={slider.title || ""} className={styles.slideImage} />
                      {(slider.title || slider.link) && (
                        <div className={styles.slideOverlay}>
                          {slider.title && <h3 className={styles.slideTitle}>{slider.title}</h3>}
                          {slider.link && (
                            <Link href={slider.link} className="btn-link" style={{ color: '#fff', fontSize: '0.9rem', marginTop: '4px', display: 'inline-block' }}>
                              Xem chi tiết &rarr;
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {sliders.length > 1 && (
                    <div className={styles.sliderDots}>
                      {sliders.map((_, idx) => (
                        <button 
                          key={idx} 
                          className={`${styles.dot} ${idx === activeSlide ? styles.dotActive : ""}`}
                          onClick={() => setActiveSlide(idx)}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.floatingCard}>
                  <div>
                    <p className={styles.fcTitle}>Hình ảnh đang cập nhật</p>
                    <p className={styles.fcSub}>Sẽ sớm có bộ ảnh thực tế</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── CATEGORY ── */}
        <section className={styles.catSection}>
          <div className="container">
            <div className={styles.sectionHead}>
              <h2 className="section-title">Danh mục món ăn</h2>
              <p className="section-subtitle">
                Khám phá thực đơn phong phú của chúng tôi
              </p>
            </div>
            <div className={styles.catGrid}>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/menu?category=${cat.id}`}
                  className={styles.catCard}
                >
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
                <p className="section-subtitle">
                  Tinh hoa ẩm thực được lòng thực khách
                </p>
              </div>
              <Link
                href="/menu"
                className={`btn btn-outline ${styles.viewAllBtn}`}
              >
                Xem tất cả
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
            {loading ? (
              <div className="spinner" />
            ) : (
              <div className="grid-dishes">
                {featured.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── WHY US ── */}
        {/* Why section removed per request to drop sample content */}

        {/* ── CTA ── */}
        <section className={styles.ctaBanner}>
          <div className="container">
            <div className={styles.ctaInner}>
              <div>
                <h2 className={styles.ctaTitle}>Đặt bàn ngay hôm nay!</h2>
                <p className={styles.ctaSub}>
                  Chỗ ngồi có hạn — hãy đặt trước để không bỏ lỡ.
                </p>
              </div>
              <Link href="/booking" className={`btn ${styles.ctaBtn}`}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
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
