import Image from "next/image";
import Link from "next/link";
import { formatVND } from "../../lib/api/client";
import type { MenuItem } from "../../types/generated";
import styles from "./MenuCard.module.css";

interface Props {
  item: MenuItem;
}

export default function MenuCard({ item }: Props) {
  return (
    <article className={`card ${styles.card}`}>
      <div className={styles.imageWrap}>
        <Image
          src={item.image}
          alt={item.name}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 50vw, 280px"
        />
        <span className={styles.categoryTag}>{item.categoryName}</span>
        {item.isFeatured && <span className={styles.featuredBadge}>Nổi bật</span>}
        {!item.isAvailable && <div className={styles.unavailable}>Tạm hết</div>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{item.name}</h3>
        <p className={styles.description}>{item.description}</p>

        <div className={styles.meta}>
          {item.rating && (
            <div className={styles.rating}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>{item.rating.toFixed(1)}</span>
              <span className={styles.ratingCount}>({item.reviewCount})</span>
            </div>
          )}
          {item.prepTimeMinutes && (
            <div className={styles.prepTime}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {item.prepTimeMinutes} phút
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.price}>{formatVND(item.price)}</span>
          <Link href="/booking" className={`btn btn-primary ${styles.bookBtn}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Đặt bàn
          </Link>
        </div>
      </div>
    </article>
  );
}
