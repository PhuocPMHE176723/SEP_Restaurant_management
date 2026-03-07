"use client";

import { useEffect, useState } from "react";
import { SystemConfig, UpdateSystemConfig } from "../../../types/models/promotion";
import { getSystemConfigs, updateSystemConfigs } from "../../../lib/api/promotion";
import styles from "../manager.module.css";
import Swal from "sweetalert2";

export default function LoyaltyConfigPage() {
    const [configs, setConfigs] = useState<SystemConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [earnRate, setEarnRate] = useState("100000");
    const [redeemRate, setRedeemRate] = useState("1000");

    useEffect(() => {
        fetchConfigs();
    }, []);

    async function fetchConfigs() {
        try {
            setLoading(true);
            const data = await getSystemConfigs();
            setConfigs(data);

            const earnR = data.find(c => c.configKey === "LOYALTY_EARN_RATE");
            if (earnR) setEarnRate(earnR.configValue);

            const redeemR = data.find(c => c.configKey === "LOYALTY_REDEEM_RATE");
            if (redeemR) setRedeemRate(redeemR.configValue);
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
                { configKey: "LOYALTY_EARN_RATE", configValue: earnRate },
                { configKey: "LOYALTY_REDEEM_RATE", configValue: redeemRate }
            ];

            await updateSystemConfigs(updates);
            Swal.fire({
                title: "Thành công",
                text: "Lưu cấu hình tỷ lệ quy đổi tích điểm thành công",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });
            fetchConfigs();
        } catch (err: any) {
            Swal.fire({
                title: "Lỗi",
                text: err.response?.data?.message || err.message || "Lỗi cập nhật cấu hình",
                icon: "error"
            });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Cấu hình Tích điểm & Quy đổi</h1>
            </header>

            <div className={styles.contentCard} style={{ maxWidth: '600px' }}>
                <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                    Thiết lập tỷ lệ nhận điểm khi khách hàng thanh toán và giá trị tiền tệ của 1 điểm khi sử dụng (Redeem) để giảm giá.
                </p>

                <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
                    <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Tỷ lệ tích luỹ (Cứ tiêu X VNĐ sẽ được 1 Điểm)
                    </label>
                    <input
                        type="number"
                        min="1"
                        className={styles.input}
                        value={earnRate}
                        onChange={(e) => setEarnRate(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <small style={{ color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>
                        Ví dụ: Nhập 100000 nghĩa là hoá đơn 1.000.000 VNĐ sẽ nhận được 10 Điểm.
                    </small>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '2rem' }}>
                    <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Giá trị quy đổi (1 Điểm tương đương Y VNĐ)
                    </label>
                    <input
                        type="number"
                        min="1"
                        className={styles.input}
                        value={redeemRate}
                        onChange={(e) => setRedeemRate(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <small style={{ color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>
                        Ví dụ: Nhập 1000 nghĩa là khách hàng cần 50 điểm để giảm giá 50.000 VNĐ.
                    </small>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className={styles.btnPrimary}
                        onClick={handleSave}
                        disabled={saving}
                        style={{ padding: '0.75rem 2rem', backgroundColor: '#eab308', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
                    </button>
                </div>
            </div>
        </div>
    );
}
