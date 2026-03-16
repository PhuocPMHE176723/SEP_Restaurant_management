"use client";

import { useRouter } from "next/navigation";
import BlogForm from "../BlogForm";
import styles from "@/app/manager/manager.module.css";

export default function CreateBlogPostPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/staff/blog");
    router.refresh();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Tạo bài viết mới</h1>
          <p className={styles.pageSubtitle}>Chia sẻ tin tức, sự kiện hoặc món ăn mới đến khách hàng</p>
        </div>
      </div>

      <BlogForm 
        onSuccess={handleSuccess} 
        onCancel={() => router.push("/staff/blog")} 
      />
    </div>
  );
}
