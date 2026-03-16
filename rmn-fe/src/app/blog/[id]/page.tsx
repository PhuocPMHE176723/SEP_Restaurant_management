"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import { blogApi } from "../../../lib/api/blog";
import type { BlogPost } from "../../../types/models/content";
import styles from "../blog.module.css";

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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

  if (loading) return (
    <>
      <Header />
      <main style={{ padding: '10rem 0' }}><div className="spinner" /></main>
      <Footer />
    </>
  );

  if (!post) return (
    <>
      <Header />
      <main style={{ padding: '10rem 0', textAlign: 'center' }}>
        <h2>Không tìm thấy bài viết</h2>
        <Link href="/blog" className="btn btn-primary" style={{ marginTop: '1rem' }}>Quay lại tin tức</Link>
      </main>
      <Footer />
    </>
  );

  return (
    <>
      <Header />
      <main className={styles.blogContainer}>
        <div className="container">
          <article>
            <div className={styles.postHeader}>
              <div className={styles.postMeta}>
                <span>{post.categoryName}</span>
                <span>•</span>
                <span>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
                <span>•</span>
                <span>{post.authorName || "Quản trị viên"}</span>
              </div>
              <h1 className={styles.postTitle}>{post.title}</h1>
            </div>

            {post.featuredImage && (
              <img src={post.featuredImage} alt={post.title} className={styles.featuredImage} />
            )}

            <div 
              className={styles.postContent}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                <Link href="/blog" className="btn btn-outline">
                    &larr; Quay lại danh sách tin tức
                </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
