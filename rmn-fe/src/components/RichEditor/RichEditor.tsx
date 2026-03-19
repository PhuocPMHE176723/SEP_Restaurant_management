"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import styles from "./RichEditor.module.css";

// Dynamic import to avoid SSR issues with Quill
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className={styles.editorPlaceholder}>Đang tải trình soạn thảo...</div>,
});

interface RichEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    ["link", "image", "video"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "indent",
  "link",
  "image",
  "video",
];

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  return (
    <div className={styles.editorWrapper}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className={styles.editor}
      />
    </div>
  );
}
