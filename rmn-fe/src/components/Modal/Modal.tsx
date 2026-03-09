"use client";

import { useEffect, useCallback } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: "success" | "error" | "info";
  children?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, type = "success", children }: ModalProps) {
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
        <div className={`${styles.header} ${
          type === "error" ? styles.headerError : 
          type === "info" ? styles.headerInfo : 
          styles.headerSuccess
        }`}>
          <div className={styles.icon}>
            {type === "success" ? "✓" : type === "error" ? "✕" : "i"}
          </div>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.body}>
          {children}
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
