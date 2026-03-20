"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { sliderApi } from "../../lib/api/slider";
import type { Slider } from "../../types/models/content";
import styles from "./HomeSlider.module.css";

export default function HomeSlider() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    sliderApi
      .getAllSliders()
      .then((data) => {
        const active = (data || [])
          .filter((s) => s.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        setSliders(active);
      })
      .catch(() => setSliders([]))
      .finally(() => setLoading(false));
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      setCurrent((idx + sliders.length) % sliders.length);
    },
    [sliders.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (sliders.length <= 1) return;
    timerRef.current = setInterval(next, 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sliders.length, next]);

  if (loading) {
    return <div className={styles.skeleton} />;
  }

  if (sliders.length === 0) return null;

  const slide = sliders[current];

  return (
    <section className={styles.sliderSection}>
      <div className={styles.track}>
        {sliders.map((s, i) => (
          <div
            key={s.sliderId}
            className={`${styles.slide} ${i === current ? styles.active : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.imageUrl}
              alt={s.title || `Slide ${i + 1}`}
              className={styles.img}
            />
            <div className={styles.overlay} />
            {s.title && (
              <div className={styles.caption}>
                <h2 className={styles.captionTitle}>{s.title}</h2>
                {s.link && (
                  <Link href={s.link} className={styles.captionBtn}>
                    Xem thêm
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Arrows */}
        {sliders.length > 1 && (
          <>
            <button
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={prev}
              aria-label="Ảnh trước"
            >
              ‹
            </button>
            <button
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={next}
              aria-label="Ảnh tiếp"
            >
              ›
            </button>
          </>
        )}

        {/* Dots */}
        {sliders.length > 1 && (
          <div className={styles.dots}>
            {sliders.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Đến ảnh ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
