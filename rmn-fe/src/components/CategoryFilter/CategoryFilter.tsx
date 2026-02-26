"use client";

import type { Category } from "../../types/generated";
import styles from "./CategoryFilter.module.css";

interface Props {
  categories: Category[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function CategoryFilter({ categories, activeId, onChange }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`${styles.pill} ${activeId === cat.id ? styles.active : ""}`}
          >
            <span className={styles.icon}>{cat.icon}</span>
            <span className={styles.label}>{cat.name}</span>
            {cat.itemCount !== undefined && (
              <span className={styles.count}>{cat.itemCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
