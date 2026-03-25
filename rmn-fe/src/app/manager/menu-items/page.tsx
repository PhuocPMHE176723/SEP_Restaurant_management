"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  getMenuItems,
  getMenuCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuImage,
  getMenuItemIngredients,
  updateMenuItemIngredients,
  type MenuItem,
  type MenuCategory,
  type CreateMenuItemRequest,
  type UpdateMenuItemRequest,
} from "../../../lib/api/admin";
import { getIngredients } from "../../../lib/api/warehouse";
import styles from "../manager.module.css";
import { toast } from "react-hot-toast";
import { BookOpen } from "lucide-react";

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
          <button
            type="button"
            className={styles.imageRemove}
            onClick={handleRemove}
          >
            ✕
          </button>
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
function CreateModal({
  categories,
  onClose,
  onSaved,
}: {
  categories: MenuCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CreateMenuItemRequest>({
    categoryId: 0,
    itemName: "",
    unit: "",
    description: "",
    basePrice: 0,
    thumbnail: undefined,
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!form.itemName.trim()) {
      setError("Tên món không được để trống");
      return;
    }
    if (form.categoryId === 0) {
      setError("Vui lòng chọn danh mục");
      return;
    }
    if (form.basePrice <= 0) {
      setError("Giá phải lớn hơn 0");
      return;
    }

    setSaving(true);
    setError(null);
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
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>Thêm món ăn</span>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
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
            <label className={styles.label}>
              Đơn vị / Định lượng (Sz, Phần, Con...)
            </label>
            <input
              className={styles.input}
              list="unit-options-create"
              placeholder="VD: Phần, Sz L, Con, Kg..."
              value={form.unit ?? ""}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
            <datalist id="unit-options-create">
              <option value="Phần" />
              <option value="Suất" />
              <option value="Con" />
              <option value="Kg" />
              <option value="100g" />
              <option value="Sz S" />
              <option value="Sz M" />
              <option value="Sz L" />
              <option value="Sz XL" />
              <option value="Lon" />
              <option value="Chai" />
              <option value="Ly" />
              <option value="Túi" />
            </datalist>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Danh mục *</label>
            <select
              className={styles.input}
              value={form.categoryId}
              onChange={(e) =>
                setForm({ ...form, categoryId: Number(e.target.value) })
              }
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
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
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
              onChange={(e) =>
                setForm({ ...form, basePrice: Number(e.target.value) })
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Ảnh món ăn</label>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              onFileChange={setImageFile}
            />
          </div>
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnCancel} onClick={onClose}>
            Huỷ
          </button>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? imageFile && !imageUrl
                ? "Đang tải ảnh..."
                : "Đang lưu..."
              : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────
function EditModal({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: MenuItem;
  categories: MenuCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<UpdateMenuItemRequest>({
    itemName: item.itemName,
    unit: item.unit ?? "",
    categoryId: item.categoryId,
    description: item.description ?? "",
    basePrice: item.basePrice,
    thumbnail: item.thumbnail ? item.thumbnail : undefined,
    isActive: item.isActive,
  });
  const [imageUrl, setImageUrl] = useState<string | null>(
    item.thumbnail ?? null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let thumbnailUrl = imageUrl;

      // Upload image if there's a new file
      if (imageFile) {
        const result = await uploadMenuImage(imageFile);
        thumbnailUrl = result.url;
      }

      await updateMenuItem(item.itemId, {
        ...form,
        thumbnail: thumbnailUrl || undefined,
      });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>Sửa — {item.itemName}</span>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
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
            <label className={styles.label}>Đơn vị / Định lượng</label>
            <input
              className={styles.input}
              list="unit-options-edit"
              placeholder="VD: Phần, Sz L, Con, Kg..."
              value={form.unit ?? ""}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
            <datalist id="unit-options-edit">
              <option value="Phần" />
              <option value="Suất" />
              <option value="Con" />
              <option value="Kg" />
              <option value="100g" />
              <option value="Sz S" />
              <option value="Sz M" />
              <option value="Sz L" />
              <option value="Sz XL" />
              <option value="Lon" />
              <option value="Chai" />
              <option value="Ly" />
              <option value="Túi" />
            </datalist>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Danh mục</label>
            <select
              className={styles.input}
              value={form.categoryId ?? item.categoryId}
              onChange={(e) =>
                setForm({ ...form, categoryId: Number(e.target.value) })
              }
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
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
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
              onChange={(e) =>
                setForm({ ...form, basePrice: Number(e.target.value) })
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Ảnh món ăn</label>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              onFileChange={setImageFile}
            />
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
          <button className={styles.btnCancel} onClick={onClose}>
            Huỷ
          </button>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (imageFile ? "Đang tải ảnh..." : "Đang lưu...") : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Recipe (MenuItemIngredient) Modal ───────────────────────────
function RecipeModal({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose: () => void;
}) {
  const [recipe, setRecipe] = useState<{ ingredientId: number; quantity: number; ingredientName: string; unit: string }[]>([]);
  const [allIngredients, setAllIngredients] = useState<{ ingredientId: number; ingredientName: string; unit: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<number>(0);
  const [qty, setQty] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [recipeData, ingredientsData] = await Promise.all([
          getMenuItemIngredients(item.itemId),
          getIngredients(),
        ]);
        setRecipe(recipeData);
        setAllIngredients(ingredientsData);
      } catch (e: any) {
        toast.error("Lỗi khi tải dữ liệu công thức");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [item.itemId]);

  function handleAdd() {
    if (selectedIngredient === 0 || qty <= 0) return;
    const ing = allIngredients.find(i => i.ingredientId === selectedIngredient);
    if (!ing) return;

    if (recipe.some(r => r.ingredientId === selectedIngredient)) {
      toast.error("Nguyên liệu này đã có trong danh sách");
      return;
    }

    setRecipe([...recipe, { ingredientId: selectedIngredient, quantity: qty, ingredientName: ing.ingredientName, unit: ing.unit }]);
    setSelectedIngredient(0);
    setQty(0);
  }

  function handleRemove(id: number) {
    setRecipe(recipe.filter(r => r.ingredientId !== id));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateMenuItemIngredients(item.itemId, recipe.map(r => ({ ingredientId: r.ingredientId, quantity: r.quantity })));
      toast.success("Cập nhật định mức nguyên liệu thành công!");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi lưu công thức");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>Định mức nguyên liệu — {item.itemName}</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {loading ? <p>Đang tải...</p> : (
            <>
              <div className={styles.field} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Chọn nguyên liệu</label>
                  <select className={styles.input} value={selectedIngredient} onChange={(e) => setSelectedIngredient(Number(e.target.value))}>
                    <option value={0}>-- Chọn --</option>
                    {allIngredients.map(i => (
                      <option key={i.ingredientId} value={i.ingredientId}>{i.ingredientName} ({i.unit})</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '120px' }}>
                  <label className={styles.label}>Số lượng</label>
                  <input type="number" step="0.001" className={styles.input} value={qty} onChange={(e) => setQty(parseFloat(e.target.value))} />
                </div>
                <button type="button" className={styles.btnAdd} onClick={handleAdd} style={{ marginBottom: '5px' }}>Thêm</button>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nguyên liệu</th>
                      <th>Định mức</th>
                      <th>Đơn vị</th>
                      <th>Xoá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>Chưa có định mức nào</td></tr>
                    ) : (
                      recipe.map(r => (
                        <tr key={r.ingredientId}>
                          <td>{r.ingredientName}</td>
                          <td>{r.quantity}</td>
                          <td>{r.unit}</td>
                          <td>
                            <button className={styles.btnDelete} onClick={() => handleRemove(r.ingredientId)}>Xoá</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnCancel} onClick={onClose}>Thoát</button>
          <button className={styles.btnSave} onClick={handleSave} disabled={saving || loading}>
            {saving ? "Đang lưu..." : "Lưu định mức"}
          </button>
        </div>
      </div>
    </div>
  );
}
function DeleteModal({
  item,
  onClose,
  onSaved,
}: {
  item: MenuItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  async function handleDelete() {
    setSaving(true);
    try {
      await deleteMenuItem(item.itemId);
      onSaved();
      onClose();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>Xác nhận vô hiệu hoá</span>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.deleteBody}>
          <p className={styles.deleteMsg}>
            Bạn chắc muốn vô hiệu hoá món <strong>{item.itemName}</strong>?
          </p>
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnCancel} onClick={onClose}>
            Huỷ
          </button>
          <button
            className={styles.btnDanger}
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? "Đang xử lý..." : "Vô hiệu hoá"}
          </button>
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
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(
    undefined,
  );
  const [modal, setModal] = useState<{
    type: "create" | "edit" | "delete" | "recipe";
    item?: MenuItem;
  } | null>(null);

  // Filter & Pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  useEffect(() => {
    void load();
  }, [load]);

  // Derived state
  const filteredItems = items.filter((c) => {
    const matchSearch =
      c.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && c.isActive) ||
      (filterStatus === "INACTIVE" && !c.isActive);
    const matchCategory =
      !filterCategoryId || c.categoryId === filterCategoryId;
    return matchSearch && matchStatus && matchCategory;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý món ăn</h1>
          <p className={styles.pageSubtitle}>
            Danh sách món ăn — {items.length} món
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button
            className={styles.btnAdd}
            onClick={() => setModal({ type: "create" })}
          >
            + Thêm món
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.filterBar}>
          <div className={styles.searchGroup}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm theo tên món, mô tả..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              className={styles.selectFilter}
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
            <select
              className={styles.selectFilter}
              value={filterCategoryId ?? ""}
              onChange={(e) => {
                setFilterCategoryId(
                  e.target.value ? Number(e.target.value) : undefined,
                );
                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName}
                </option>
              ))}
            </select>

            {(searchTerm || filterStatus !== "ALL" || filterCategoryId) && (
              <button 
                className={styles.btnSecondary}
                style={{ padding: '0.625rem 1rem', fontSize: '0.85rem' }}
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("ALL");
                  setFilterCategoryId(undefined);
                }}
              >
                Xoá lọc
              </button>
            )}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Ảnh</th>
                <th>Tên món</th>
                <th>ĐVT</th>
                <th>Danh mục</th>
                <th>Mô tả</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={styles.loading}>
                    Đang tải...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.empty}>
                    Chưa có món nào phù hợp
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, i) => (
                  <tr key={item.itemId}>
                    <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    <td>
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.itemName}
                          className={styles.thumbnail}
                        />
                      ) : (
                        <div className={styles.noImage}>Sửa ảnh</div>
                      )}
                    </td>
                    <td>
                      <strong>{item.itemName}</strong>
                    </td>
                    <td>{item.unit ?? "—"}</td>
                    <td>{item.categoryName}</td>
                    <td>{item.description ?? "—"}</td>
                    <td>{formatPrice(item.basePrice)}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${item.isActive ? styles.statusPublished : styles.statusClosed}`}
                      >
                        {item.isActive ? "Hoạt động" : "Ngừng"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.btnRow}>
                        <button
                          className={styles.btnSecondary}
                          style={{ color: '#6366f1', borderColor: '#6366f1' }}
                          onClick={() => setModal({ type: "recipe", item })}
                        >
                          Công thức
                        </button>
                        <button
                          className={styles.btnEdit}
                          onClick={() => setModal({ type: "edit", item })}
                        >
                          Sửa
                        </button>
                        <button
                          className={styles.btnDelete}
                          onClick={() => setModal({ type: "delete", item })}
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Hiển thị <b>{Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredItems.length, currentPage * itemsPerPage)}</b> trên tổng số <b>{filteredItems.length}</b> món
            </div>
            
            <button
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              &laquo;
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              className={styles.pageBtn}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              &raquo;
            </button>
          </div>
        )}
      </div>

      {modal?.type === "create" && (
        <CreateModal
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {modal?.type === "edit" && modal.item && (
        <EditModal
          item={modal.item}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {modal?.type === "delete" && modal.item && (
        <DeleteModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {modal?.type === "recipe" && modal.item && (
        <RecipeModal
          item={modal.item}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
