"use client";

import { useEffect, useState } from "react";
import { SystemConfig, UpdateSystemConfig } from "../../../types/models/promotion";
import { 
    getSystemConfigs, 
    updateSystemConfigs, 
    getLoyaltyTiers, 
    updateLoyaltyTier 
} from "../../../lib/api/promotion";
import styles from "../manager.module.css";
import { showSuccess, showError } from "../../../lib/ui/alerts";
import { LoyaltyTier } from "../../../types/models/promotion";

export default function LoyaltyConfigPage() {
    const [configs, setConfigs] = useState<SystemConfig[]>([]);
    const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingTier, setSavingTier] = useState<number | null>(null);

    const [earnRate, setEarnRate] = useState("100000");
    const [redeemRate, setRedeemRate] = useState("1000");

    useEffect(() => {
        fetchConfigs();
    }, []);

    async function fetchConfigs() {
        try {
            setLoading(true);
            const [configData, tiersData] = await Promise.all([
                getSystemConfigs(),
                getLoyaltyTiers()
            ]);
            
            setConfigs(configData);
            setTiers(tiersData);

            const earnR = configData.find(c => c.configKey === "LOYALTY_EARN_RATE");
            if (earnR) setEarnRate(earnR.configValue);

            const redeemR = configData.find(c => c.configKey === "LOYALTY_REDEEM_RATE");
            if (redeemR) setRedeemRate(redeemR.configValue);
        } catch (error: any) {
            console.error("Failed to fetch configs", error);
            showError("Lỗi", "Không thể tải cấu hình tích điểm");
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
            showSuccess("Thành công", "Lưu cấu hình tỷ lệ quy đổi tích điểm thành công");
            fetchConfigs();
        } catch (err: any) {
            showError("Lỗi", err.response?.data?.message || err.message || "Lỗi cập nhật cấu hình");
        } finally {
            setSaving(false);
        }
    }

    async function handleUpdateTier(id: number, index: number) {
        setSavingTier(id);
        try {
            const tier = tiers[index];
            await updateLoyaltyTier(id, {
                tierName: tier.tierName,
                minPoints: tier.minPoints,
                discountRate: tier.discountRate,
                isActive: tier.isActive
            });
            showSuccess("Thành công", `Đã cập nhật cấp độ ${tier.tierName}`);
        } catch (err: any) {
            showError("Lỗi", err.message || "Không thể cập nhật cấp độ");
        } finally {
            setSavingTier(null);
        }
    }

    const handleTierChange = (index: number, field: keyof LoyaltyTier, value: any) => {
        const newTiers = [...tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setTiers(newTiers);
    };

    if (loading) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.page}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Cấu hình Tích điểm & Quy đổi</h1>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                <div className={styles.contentCard}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Tỷ lệ Quy đổi Điểm</h3>
                    <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                        Thiết lập tỷ lệ nhận điểm và giá trị tiền tệ của điểm khi đổi ưu đãi.
                    </p>

                    <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
                        <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                            Tỷ lệ tích luỹ (Tiêu X VNĐ = 1 Điểm)
                        </label>
                        <input
                            type="number"
                            className={styles.input}
                            value={earnRate}
                            onChange={(e) => setEarnRate(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: '2rem' }}>
                        <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                            Giá trị quy đổi (1 Điểm = Y VNĐ)
                        </label>
                        <input
                            type="number"
                            className={styles.input}
                            value={redeemRate}
                            onChange={(e) => setRedeemRate(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            className={styles.btnPrimary}
                            onClick={handleSave}
                            disabled={saving}
                            style={{ padding: '0.75rem 2rem', backgroundColor: '#eab308', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {saving ? "Đang lưu..." : "Lưu Tỷ Lệ"}
                        </button>
                    </div>
                </div>

                <div className={styles.contentCard}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 700 }}>Cấp độ & Ưu đãi (%)</h3>
                    <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                        Cấu hình các mốc điểm để lên hạng và phần trăm giảm giá tương ứng.
                    </p>

                    <div className={styles.tableResponsive}>
                        <table className={styles.table} style={{ fontSize: '0.9rem' }}>
                            <thead>
                                <tr>
                                    <th>Cấp độ</th>
                                    <th>Điểm tối thiểu</th>
                                    <th>Giảm (%)</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tiers.map((tier, index) => (
                                    <tr key={tier.tierId}>
                                        <td>
                                            <input 
                                                type="text" 
                                                value={tier.tierName}
                                                onChange={(e) => handleTierChange(index, 'tierName', e.target.value)}
                                                className={styles.input}
                                                style={{ padding: '0.4rem', width: '100px' }}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                value={tier.minPoints}
                                                onChange={(e) => handleTierChange(index, 'minPoints', parseInt(e.target.value) || 0)}
                                                className={styles.input}
                                                style={{ padding: '0.4rem', width: '80px' }}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                value={tier.discountRate}
                                                onChange={(e) => handleTierChange(index, 'discountRate', parseInt(e.target.value) || 0)}
                                                className={styles.input}
                                                style={{ padding: '0.4rem', width: '60px' }}
                                            />
                                        </td>
                                        <td>
                                            <button 
                                                className={styles.btnAction} 
                                                onClick={() => handleUpdateTier(tier.tierId, index)}
                                                disabled={savingTier === tier.tierId}
                                                style={{ color: '#eab308', padding: '0.4rem' }}
                                            >
                                                {savingTier === tier.tierId ? "..." : "Lưu"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
