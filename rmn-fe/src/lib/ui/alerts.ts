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
