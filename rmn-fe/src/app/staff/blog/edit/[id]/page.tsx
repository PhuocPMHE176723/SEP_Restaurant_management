"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import BlogForm from "../../BlogForm";
import { blogApi } from "@/lib/api/blog";
import type { BlogPost } from "@/types/models/content";
import styles from "@/app/manager/manager.module.css";

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await blogApi.getPostById(parseInt(id));
        setPost(data);
      } catch (error) {
        console.error("Failed to fetch blog post:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSuccess = () => {
    router.push("/staff/blog");
    router.refresh();
  };

  if (loading) return <div className={styles.pageContainer}><div className={styles.spinner}></div></div>;
  if (!post) return <div className={styles.pageContainer}><h2>Không tìm thấy bài viết</h2></div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Chỉnh sửa bài viết</h1>
          <p className={styles.pageSubtitle}>Cập nhật lại thông tin bài viết của bạn</p>
        </div>
      </div>

      <BlogForm 
        initialData={post}
        onSuccess={handleSuccess} 
        onCancel={() => router.push("/staff/blog")} 
      />
    </div>
  );
}
