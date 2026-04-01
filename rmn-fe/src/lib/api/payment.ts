const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function getSepayConfig() {
  const res = await fetch(`${API_URL}/Payment/sepay-config`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Không thể lấy cấu hình SePay");
  }
  return res.json();
}

export async function checkSepayTransaction(
  reservationId: number,
  paymentCode: string,
) {
  const res = await fetch(
    `${API_URL}/Payment/sepay/check-transaction?reservationId=${reservationId}&paymentCode=${encodeURIComponent(paymentCode)}`,
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Lỗi kiểm tra giao dịch");
  }
  return res.json();
}

export async function cancelSepayTimeout(reservationId: number) {
  const res = await fetch(
    `${API_URL}/Payment/sepay/cancel-timeout?reservationId=${reservationId}`,
    { method: "POST" }
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Lỗi huỷ giao dịch do quá hạn");
  }
  return res.json();
}

export async function checkInvoicePayment(orderId: number, orderCode: string) {
  const res = await fetch(
    `${API_URL}/Payment/sepay/check-invoice?orderId=${orderId}&orderCode=${encodeURIComponent(orderCode)}`,
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Lỗi kiểm tra thanh toán hóa đơn");
  }
  return res.json();
}
