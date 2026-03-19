"use client";

import { useEffect, useState } from "react";
import { SystemConfig, UpdateSystemConfig } from "../../../types/models/promotion";
import { getSystemConfigs, updateSystemConfigs } from "../../../lib/api/promotion";
import styles from "../manager.module.css";
import { showSuccess, showError } from "../../../lib/ui/alerts";

export default function SystemConfigPage() {
    const [configs, setConfigs] = useState<SystemConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [vatEnabled, setVatEnabled] = useState("false");
    const [vatRate, setVatRate] = useState("0");

    useEffect(() => {
        fetchConfigs();
    }, []);

    async function fetchConfigs() {
        try {
            setLoading(true);
            const data = await getSystemConfigs();
            setConfigs(data);

            const vatE = data.find(c => c.configKey === "VAT_ENABLED");
            if (vatE) setVatEnabled(vatE.configValue);

            const vatR = data.find(c => c.configKey === "VAT_RATE");
            if (vatR) setVatRate(vatR.configValue);
        } catch (error) {
            console.error("Failed to fetch configs", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const updates: UpdateSystemConfig[] = [
                { configKey: "VAT_ENABLED", configValue: vatEnabled },
                { configKey: "VAT_RATE", configValue: vatRate }
            ];

            await updateSystemConfigs(updates);
            showSuccess("Thành công", "Lưu cấu hình VAT thành công");
            fetchConfigs();
        } catch (err: any) {
            showError("Lỗi", err.response?.data?.message || err.message || "Lỗi cập nhật cấu hình");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Cấu hình Thuế (VAT)</h1>
            </header>

            <div className={styles.contentCard} style={{ maxWidth: '600px' }}>
                <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                    Sử dụng mục này để bật tắt và thiết lập tỷ lệ thuế Giá trị gia tăng (VAT) cho toàn hệ thống.
                </p>

                <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
                    <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Trạng thái VAT Hệ thống
                    </label>
                    <select
                        className={styles.select}
                        value={vatEnabled}
                        onChange={(e) => setVatEnabled(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    >
                        <option value="true">Bật (Áp dụng VAT)</option>
                        <option value="false">Tắt (Không áp dụng VAT)</option>
                    </select>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '2rem' }}>
                    <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Tỷ lệ thuế VAT (%)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className={styles.input}
                        value={vatRate}
                        onChange={(e) => setVatRate(e.target.value)}
                        disabled={vatEnabled === "false"}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: vatEnabled === "false" ? '#f1f5f9' : '#fff' }}
                    />
                    <small style={{ color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>
                        Ví dụ: 8 cho 8%, 10 cho 10%. % VAT sẽ được cộng thêm vào hoá đơn nếu Trạng thái báo Bật.
                    </small>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className={styles.btnPrimary}
                        onClick={handleSave}
                        disabled={saving}
                        style={{ padding: '0.75rem 2rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
                    </button>
                </div>
            </div>
        </div>
    );
}
