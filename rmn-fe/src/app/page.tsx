"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { getHealth, getRmnItems } from "../lib/api/client";
import { apiBaseUrl } from "../lib/config";
import { showError, showInfo, showSuccess } from "../lib/ui/alerts";
import type { RmnItem } from "../types/generated";

export default function Home() {
  const [items, setItems] = useState<RmnItem[]>([]);
  const [health, setHealth] = useState<string>("unknown");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    void hydrate();
  }, []);

  async function hydrate() {
    try {
      setLoading(true);
      const [h, list] = await Promise.all([getHealth(), getRmnItems()]);
      setHealth(h);
      setItems(list);
    } catch (err) {
      showError(
        "API error",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePing() {
    try {
      const status = await getHealth();
      setHealth(status);
      showInfo("Health", `Status: ${status}`);
    } catch (err) {
      showError(
        "Health check failed",
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  }

  function handleTemplateAction() {
    showSuccess("Template action", "Hook up your real workflow here.");
  }

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Restaurant Management FE</p>
            <h1 className={styles.title}>
              Starter dashboard wired to .NET API
            </h1>
            <p className={styles.subhead}>API base: {apiBaseUrl}</p>
          </div>
          <div className={styles.badge}>App Router • TypeScript</div>
        </header>

        <section className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.kicker}>Health</p>
                <h2>Service status</h2>
              </div>
              <span className={styles.pill}>{health}</span>
            </div>
            <div className={styles.cardActions}>
              <button onClick={handlePing} className={styles.buttonPrimary}>
                Ping API
              </button>
              <button onClick={hydrate} className={styles.buttonGhost}>
                Reload data
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.kicker}>Records</p>
                <h2>RMN items</h2>
              </div>
              <span className={styles.pill}>{items.length} items</span>
            </div>

            {loading ? (
              <p className={styles.muted}>Loading...</p>
            ) : items.length === 0 ? (
              <p className={styles.muted}>
                No data yet. Connect to the backend.
              </p>
            ) : (
              <ul className={styles.list}>
                {items.map((item) => (
                  <li key={item.id ?? item.title} className={styles.listItem}>
                    <div>
                      <h3>{item.title}</h3>
                      <p className={styles.muted}>{item.description}</p>
                    </div>
                    <code className={styles.code}>{item.id ?? "no-id"}</code>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.cardActions}>
              <button
                onClick={handleTemplateAction}
                className={styles.buttonPrimary}
              >
                Show success toast
              </button>
              <button onClick={handlePing} className={styles.buttonGhost}>
                Quick health check
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
