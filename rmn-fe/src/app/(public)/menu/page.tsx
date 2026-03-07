"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import MenuCard from "../../../components/MenuCard/MenuCard";
import CategoryFilter from "../../../components/CategoryFilter/CategoryFilter";
import { getMenuItems, getCategories } from "../../../lib/api/client";
import type { MenuItem, Category } from "../../../types/models";
import styles from "./page.module.css";

function MenuContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async (catId: string) => {
    setLoading(true);
    const [data, cats] = await Promise.all([
      getMenuItems(catId),
      categories.length ? Promise.resolve(categories) : getCategories(),
    ]);
    setItems(data);
    if (!categories.length) setCategories(cats);
    setLoading(false);
  }, [categories]);

  useEffect(() => {
    void loadItems(activeCategory);
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = items.filter((i) =>
    search.trim() === "" ||
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <div className={styles.hero}>
          <div className="container">
            <h1 className={styles.heroTitle}>Thực đơn nhà hàng</h1>
            <p className={styles.heroSub}>Khám phá tinh hoa ẩm thực, mở cửa Trưa 11:00–14:00 · Tối 17:00–21:30</p>
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="search"
                placeholder="Tìm kiếm món ăn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className={styles.filterBar}>
          <CategoryFilter
            categories={categories}
            activeId={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        {/* Grid */}
        <section className={styles.grid}>
          <div className="container">
            {!loading && (
              <p className={styles.resultCount}>
                {filtered.length} món {search ? `cho "${search}"` : ""}
              </p>
            )}
            {loading ? (
              <div className="spinner" />
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                <p>🍽️</p>
                <p className={styles.emptyText}>Không tìm thấy món phù hợp</p>
                <button onClick={() => { setSearch(""); setActiveCategory("all"); }} className="btn btn-primary">
                  Xem tất cả
                </button>
              </div>
            ) : (
              <div className="grid-dishes">
                {filtered.map((item) => <MenuCard key={item.id} item={item} />)}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating booking button */}
      <Link href="/booking" className={styles.floatingBooking}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Đặt bàn
      </Link>

      <Footer />
    </>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="spinner" style={{ marginTop: "8rem" }} />}>
      <MenuContent />
    </Suspense>
  );
}
