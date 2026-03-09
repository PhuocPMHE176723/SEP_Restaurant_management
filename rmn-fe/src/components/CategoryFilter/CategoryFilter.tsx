"use client";

import type { Category } from "../../types/models";
import styles from "./CategoryFilter.module.css";

interface Props {
  categories: Category[];
  activeId: string;
  onChange: (id: string) => void;
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function CategoryFilter({
  categories,
  activeId,
  onChange,
}: Props) {
  const handleSelect = (id: string) => {
    onChange(id);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.id)}
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
