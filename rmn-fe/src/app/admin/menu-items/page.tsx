"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
    getMenuItems, getMenuCategories, createMenuItem, updateMenuItem, deleteMenuItem, uploadMenuImage,
    type MenuItem, type MenuCategory, type CreateMenuItemRequest, type UpdateMenuItemRequest,
} from "../../../lib/api/admin";
import styles from "../admin.module.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ── Image Upload Component ────────────────────────────────────────
interface ImageUploadProps {
    value: string | null;
    onChange: (url: string | null) => void;
    onFileChange: (file: File | null) => void;
}

function ImageUpload({ value, onChange, onFileChange }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(value);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setError("Kích thước file vượt quá 5MB");
            onFileChange(null);
            return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Chỉ chấp nhận file ảnh");
            onFileChange(null);
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            setError(null);
        };
        reader.readAsDataURL(file);
        onFileChange(file);
    }

    function handleRemove() {
        setPreview(null);
        onChange(null);
        onFileChange(null);
        if (fileRef.current) fileRef.current.value = "";
    }

    return (
        <div className={styles.imageUpload}>
            {preview && (
                <div className={styles.imagePreview}>
                    <img src={preview} alt="Preview" />
                    <button type="button" className={styles.imageRemove} onClick={handleRemove}>✕</button>
                </div>
            )}
            {!preview && (
                <div className={styles.imageSelect}>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className={styles.fileInput}
                    />
                    <span className={styles.fileHint}>Chọn ảnh (tối đa 5MB)</span>
                </div>
            )}
            {error && <div className={styles.imageError}>{error}</div>}
        </div>
    );
}

// ── Create Modal ──────────────────────────────────────────────────
function CreateModal({ categories, onClose, onSaved }: { categories: MenuCategory[]; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState<CreateMenuItemRequest>({ categoryId: 0, itemName: "", description: "", basePrice: 0, thumbnail: undefined });
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        if (!form.itemName.trim()) { setError("Tên món không được để trống"); return; }
        if (form.categoryId === 0) { setError("Vui lòng chọn danh mục"); return; }
        if (form.basePrice <= 0) { setError("Giá phải lớn hơn 0"); return; }

        setSaving(true); setError(null);
        try {
            let thumbnailUrl = imageUrl;
            
            // Upload image if there's a new file
            if (imageFile && !imageUrl) {
                const result = await uploadMenuImage(imageFile);
                thumbnailUrl = result.url;
            }

            await createMenuItem({ ...form, thumbnail: thumbnailUrl || undefined });
            onSaved();
            onClose();
        } catch (e: unknown) {
            setError((e as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Thêm món ăn</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    {error && <div className={styles.modalError}>{error}</div>}
                    
                    <div className={styles.field}>
                        <label className={styles.label}>Tên món *</label>
                        <input
                            className={styles.input}
                            placeholder="VD: Phở bò"
                            value={form.itemName}
                            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Danh mục *</label>
                        <select
                            className={styles.input}
                            value={form.categoryId}
                            onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                        >
                            <option value={0}>-- Chọn danh mục --</option>
                            {categories.map((cat) => (
                                <option key={cat.categoryId} value={cat.categoryId}>
                                    {cat.categoryName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Mô tả</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Mô tả ngắn về món ăn..."
                            value={form.description ?? ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Giá (VNĐ) *</label>
                        <input
                            className={styles.input}
                            type="number"
                            min={0}
                            step={1000}
                            value={form.basePrice}
                            onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Ảnh món ăn</label>
                        <ImageUpload value={imageUrl} onChange={setImageUrl} onFileChange={setImageFile} />
                    </div>
                </div>
                <div className={styles.modalFoot}>
                    <button className={styles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
                        {saving ? (imageFile && !imageUrl ? "Đang tải ảnh..." : "Đang lưu...") : "Lưu"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Edit Modal ────────────────────────────────────────────────────
function EditModal({ item, categories, onClose, onSaved }: { item: MenuItem; categories: MenuCategory[]; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState<UpdateMenuItemRequest>({
        itemName: item.itemName,
        categoryId: item.categoryId,
        description: item.description ?? "",
        basePrice: item.basePrice,
        thumbnail: item.thumbnail ? item.thumbnail : undefined,
        isActive: item.isActive,
    });
    const [imageUrl, setImageUrl] = useState<string | null>(item.thumbnail ?? null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSave() {
        setSaving(true); setError(null);
        try {
            let thumbnailUrl = imageUrl;
            
            // Upload image if there's a new file
            if (imageFile) {
                const result = await uploadMenuImage(imageFile);
                thumbnailUrl = result.url;
            }

            await updateMenuItem(item.itemId, { ...form, thumbnail: thumbnailUrl || undefined });
            onSaved();
            onClose();
        } catch (e: unknown) {
            setError((e as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Sửa — {item.itemName}</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    {error && <div className={styles.modalError}>{error}</div>}

                    <div className={styles.field}>
                        <label className={styles.label}>Tên món</label>
                        <input
                            className={styles.input}
                            value={form.itemName ?? ""}
                            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Danh mục</label>
                        <select
                            className={styles.input}
                            value={form.categoryId ?? item.categoryId}
                            onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                        >
                            {categories.map((cat) => (
                                <option key={cat.categoryId} value={cat.categoryId}>
                                    {cat.categoryName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Mô tả</label>
                        <textarea
                            className={styles.textarea}
                            value={form.description ?? ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Giá (VNĐ)</label>
                        <input
                            className={styles.input}
                            type="number"
                            min={0}
                            step={1000}
                            value={form.basePrice ?? item.basePrice}
                            onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Ảnh món ăn</label>
                        <ImageUpload value={imageUrl} onChange={setImageUrl} onFileChange={setImageFile} />
                    </div>

                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={form.isActive ?? item.isActive}
                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        />
                        Còn hoạt động
                    </label>
                </div>
                <div className={styles.modalFoot}>
                    <button className={styles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
                        {saving ? (imageFile ? "Đang tải ảnh..." : "Đang lưu...") : "Lưu"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Delete Modal ──────────────────────────────────────────────────
function DeleteModal({ item, onClose, onSaved }: { item: MenuItem; onClose: () => void; onSaved: () => void }) {
    const [saving, setSaving] = useState(false);
    async function handleDelete() {
        setSaving(true);
        try { await deleteMenuItem(item.itemId); onSaved(); onClose(); }
        catch { /* ignore */ }
        finally { setSaving(false); }
    }
    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Xác nhận vô hiệu hoá</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.deleteBody}>
                    <div className={styles.deleteIcon}>🗑️</div>
                    <p className={styles.deleteMsg}>Bạn chắc muốn vô hiệu hoá món <strong>{item.itemName}</strong>?</p>
                </div>
                <div className={styles.modalFoot}>
                    <button className={styles.btnCancel} onClick={onClose}>Huỷ</button>
                    <button className={styles.btnDanger} onClick={handleDelete} disabled={saving}>{saving ? "Đang xử lý..." : "Vô hiệu hoá"}</button>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────
export default function MenuItemsPage() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(undefined);
    const [modal, setModal] = useState<{ type: "create" | "edit" | "delete"; item?: MenuItem } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [itemsData, catsData] = await Promise.all([
                getMenuItems(filterCategoryId),
                getMenuCategories(),
            ]);
            setItems(itemsData);
            setCategories(catsData);
        } catch {
            setItems([]);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, [filterCategoryId]);

    useEffect(() => { void load(); }, [load]);

    function formatPrice(price: number) {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    }

    return (
        <>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Quản lý món ăn</h1>
                    <p className={styles.pageSubtitle}>Danh sách món ăn — {items.length} món</p>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <select
                        className={styles.filterSelect}
                        value={filterCategoryId ?? ""}
                        onChange={(e) => setFilterCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((cat) => (
                            <option key={cat.categoryId} value={cat.categoryId}>
                                {cat.categoryName}
                            </option>
                        ))}
                    </select>
                    <button className={styles.btnAdd} onClick={() => setModal({ type: "create" })}>
                        + Thêm món
                    </button>
                </div>
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Ảnh</th>
                            <th>Tên món</th>
                            <th>Danh mục</th>
                            <th>Mô tả</th>
                            <th>Giá</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className={styles.loading}>Đang tải...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={8} className={styles.empty}>Chưa có món nào</td></tr>
                        ) : items.map((item, i) => (
                            <tr key={item.itemId}>
                                <td>{i + 1}</td>
                                <td>
                                    {item.thumbnail ? (
                                        <img src={item.thumbnail} alt={item.itemName} className={styles.thumbnail} />
                                    ) : (
                                        <div className={styles.noImage}>🍽️</div>
                                    )}
                                </td>
                                <td><strong>{item.itemName}</strong></td>
                                <td>{item.categoryName}</td>
                                <td>{item.description ?? "—"}</td>
                                <td>{formatPrice(item.basePrice)}</td>
                                <td>
                                    <span className={`${styles.badge} ${item.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                                        {item.isActive ? "Hoạt động" : "Ngừng"}
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.btnRow}>
                                        <button className={styles.btnEdit} onClick={() => setModal({ type: "edit", item })}>Sửa</button>
                                        <button className={styles.btnDelete} onClick={() => setModal({ type: "delete", item })}>Xoá</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal?.type === "create" && <CreateModal categories={categories} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === "edit" && modal.item && <EditModal item={modal.item} categories={categories} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === "delete" && modal.item && <DeleteModal item={modal.item} onClose={() => setModal(null)} onSaved={load} />}
        </>
    );
}
