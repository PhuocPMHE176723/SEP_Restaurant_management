"use client";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const Alert = withReactContent(Swal);

export function showSuccess(title: string, text?: string) {
  return Alert.fire({ icon: "success", title, text });
}

export function showError(title: string, text?: string) {
  return Alert.fire({ icon: "error", title, text });
}

export function showInfo(title: string, text?: string) {
  return Alert.fire({ icon: "info", title, text });
}

export function showWarning(title: string, text?: string) {
  return Alert.fire({ icon: "warning", title, text });
}

export async function showConfirm(title: string, text?: string) {
  const result = await Alert.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Đồng ý",
    cancelButtonText: "Hủy",
  });
  return result.isConfirmed;
}
