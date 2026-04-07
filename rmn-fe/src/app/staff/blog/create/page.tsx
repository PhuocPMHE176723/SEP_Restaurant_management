"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { blogApi } from "../../../../lib/api/blog";
import { BlogCategory, CreateBlogPostRequest } from "../../../../types/models/content";
import styles from "../../../manager/manager.module.css";
import { ArrowLeft, Save, Image as ImageIcon, Type, FileText, Tag, Layers } from "lucide-react";
import Link from "next/link";

export default function CreateBlogPostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBlogPostRequest>({
    title: "",
    content: "",
    featuredImage: "",
    categoryId: 0,
    status: "DRAFT",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await blogApi.getCategories();
      setCategories(data.filter(c => c.isActive));
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: data[0].categoryId }));
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || formData.categoryId === 0) {
      Swal.fire("Lỗi", "Vui lòng điền đầy đủ thông tin bắt buộc", "error");
      return;
    }

    try {
      setLoading(true);
      await blogApi.createPost(formData);
      setLoading(false);
      await Swal.fire({
        title: "Thành công",
        text: "Bài viết đã được tạo thành công!",
        icon: "success",
        confirmButtonColor: "var(--brand-primary)"
      });
      router.push("/staff/blog");
    } catch (error: any) {
      setLoading(false);
      Swal.fire("Lỗi", error.message || "Tạo bài viết thất bại", "error");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/staff/blog" className={styles.btnFilter} style={{ padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={styles.pageTitle}>Tạo bài viết mới</h1>
            <p className={styles.pageSubtitle}>Điền thông tin và lưu bài viết</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.card} style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className={styles.formGroup}>
            <label style={{ fontWeight: 600, color: '#475569' }}>Tiêu đề *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Nhập tiêu đề bài viết"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label style={{ fontWeight: 600, color: '#475569' }}>Danh mục *</label>
              <select
                className={styles.select}
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                required
              >
                <option value={0}>Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label style={{ fontWeight: 600, color: '#475569' }}>Trạng thái</label>
              <select
                className={styles.select}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLISHED">Xuất bản</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontWeight: 600, color: '#475569' }}>Hình ảnh (URL)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Dán URL hình ảnh minh họa..."
              value={formData.featuredImage}
              onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
            />
            {formData.featuredImage && (
              <div style={{ marginTop: '0.75rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={formData.featuredImage} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label style={{ fontWeight: 600, color: '#475569' }}>Nội dung chi tiết *</label>
            <textarea
              className={styles.textarea}
              placeholder="Nhập nội dung bài viết..."
              style={{ minHeight: '400px' }}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              className={styles.btnAdd}
              style={{ flex: 2, padding: '1rem', fontWeight: 700, margin: 0, height: 'auto' }}
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu bài viết"}
            </button>
            <Link href="/staff/blog" className={styles.btnCancel} style={{ flex: 1, textAlign: 'center', padding: '1rem', fontWeight: 600 }}>
              Hủy bỏ
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
