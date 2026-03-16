"use client";

import { useState, useEffect } from "react";
import { blogApi } from "@/lib/api/blog";
import type { BlogPost, BlogCategory, CreateBlogPostRequest } from "@/types/models/content";
import styles from "@/app/manager/manager.module.css";
import RichEditor from "@/components/RichEditor/RichEditor";

interface BlogFormProps {
  initialData?: BlogPost;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BlogForm({ initialData, onSuccess, onCancel }: BlogFormProps) {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBlogPostRequest>({
    title: initialData?.title || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    featuredImage: initialData?.featuredImage || "",
    categoryId: initialData?.categoryId || 0,
    status: initialData?.status || "DRAFT",
    tags: initialData?.tags || "",
  });

  useEffect(() => {
    void (async () => {
      try {
        const cats = await blogApi.getCategories();
        setCategories(cats);
        if (!initialData && cats.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: cats[0].categoryId }));
        }
      } catch (error) {
        console.error("Failed to fetch blog categories:", error);
      }
    })();
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData) {
        await blogApi.updatePost(initialData.postId, formData);
      } else {
        await blogApi.createPost(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save blog post:", error);
      alert("Lưu bài viết thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formCard} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className={styles.formGroup}>
        <label>Tiêu đề bài viết</label>
        <input
          type="text"
          className={styles.input}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Nhập tiêu đề bài viết..."
          required
        />
      </div>

      <div className={styles.formGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.formGroup}>
          <label>Danh mục</label>
          <select
            className={styles.select}
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
            required
          >
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Trạng thái</label>
          <select
            className={styles.select}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="DRAFT">Bản nháp</option>
            <option value="PUBLISHED">Xuất bản</option>
            <option value="ARCHIVED">Lưu trữ/Ẩn</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>URL Hình ảnh nổi bật</label>
        <input
          type="text"
          className={styles.input}
          value={formData.featuredImage}
          onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
          placeholder="https://images.unsplash.com/..."
        />
        {formData.featuredImage && (
            <img src={formData.featuredImage} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' }} />
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Mô tả ngắn (Trích dẫn)</label>
        <textarea
          className={styles.textarea}
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="Tóm tắt ngắn gọn nội dung bài viết..."
          rows={3}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Nội dung bài viết</label>
        <RichEditor
          value={formData.content}
          onChange={(content: string) => setFormData({ ...formData, content })}
          placeholder="Nhờ trình soạn thảo để nhập nội dung bài viết chi tiết..."
        />
      </div>

      <div className={styles.formGroup}>
        <label>Thẻ (Tags)</label>
        <input
          type="text"
          className={styles.input}
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="khuyến mãi, sự kiện, món mới..."
        />
      </div>

      <div className={styles.btnRow} style={{ marginTop: '2rem' }}>
        <button type="button" className={styles.btnCancel} onClick={onCancel} disabled={loading}>
          Hủy bỏ
        </button>
        <button type="submit" className={styles.btnAdd} style={{ marginTop: 0 }} disabled={loading}>
          {loading ? "Đang lưu..." : initialData ? "Cập nhật bài viết" : "Đăng bài viết"}
        </button>
      </div>
    </form>
  );
}
