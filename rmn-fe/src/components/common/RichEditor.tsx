"use client";

import React, { useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { blogApi } from "@/lib/api/blog";
import styles from "./RichEditor.module.css";

// Dynamic import to avoid SSR issues with Quill
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    return RQ;
  },
  { ssr: false, loading: () => <div className={styles.loadingEditor}>Đang tải trình soạn thảo...</div> }
) as any;

interface RichEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichEditor: React.FC<RichEditorProps> = ({ value, onChange, placeholder }) => {
  const quillRef = useRef<any>(null);

  // Custom Image Handler
  const imageHandler = useMemo(() => {
    return () => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          try {
            const result = await blogApi.uploadImage(file);
            const quill = quillRef.current?.getEditor();
            if (quill) {
              const range = quill.getSelection();
              quill.insertEmbed(range?.index || 0, "image", result.url);
            }
          } catch (error: any) {
            console.error("Image upload failed:", error);
            alert("Tải ảnh lên thất bại: " + error.message);
          }
        }
      };
    };
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          ["link", "image", "video"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    [imageHandler]
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "link",
    "image",
    "video",
    "color",
    "background",
  ];

  return (
    <div className={styles.editorWrapper}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Bắt đầu viết nội dung..."}
      />
    </div>
  );
};

export default RichEditor;
