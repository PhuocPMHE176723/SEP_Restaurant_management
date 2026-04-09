import { useRef, useState } from "react";
import styles from "../../app/manager/manager.module.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageUploadProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  onFileChange: (file: File | null) => void;
  label?: string;
  hint?: string;
}

export function ImageUpload({ value, onChange, onFileChange, label, hint = "Chọn ảnh (tối đa 5MB)" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
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
    // Clear the URL since we have a new file
    onChange(null);
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
    onFileChange(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className={styles.imageUpload}>
      {label && <label className={styles.label}>{label}</label>}
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
          <span className={styles.fileHint}>{hint}</span>
        </div>
      )}
      {error && <div className={styles.imageError}>{error}</div>}
    </div>
  );
}
