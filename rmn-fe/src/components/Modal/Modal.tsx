"use client";

import { useEffect, useCallback } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error";
}

export default function Modal({ isOpen, onClose, title, message, type = "success" }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
      
      return () => {
        window.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.header} ${type === "error" ? styles.headerError : styles.headerSuccess}`}>
          <div className={styles.icon}>
            {type === "success" ? "✓" : "✕"}
          </div>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.button}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
