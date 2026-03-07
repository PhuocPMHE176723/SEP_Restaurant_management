import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Polyfill: add addFont/setFont fallback for Vietnamese text (use built-in Helvetica)
function setupDoc() {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    return doc;
}

export function exportInventoryPDF(
    items: { ingredientName: string; currentStock: number; maxStock?: number; unit: string; status: string }[]
) {
    const doc = setupDoc();
    const now = new Date().toLocaleString("vi-VN");

    doc.setFontSize(16);
    doc.text("BAO CAO TON KHO NGUYEN LIEU", 14, 18);
    doc.setFontSize(10);
    doc.text(`Ngay xuat: ${now}`, 14, 26);

    autoTable(doc, {
        startY: 32,
        head: [["#", "Ten nguyen lieu", "DVT", "So luong ton", "So max", "Trang thai"]],
        body: items.map((r, i) => [
            i + 1,
            r.ingredientName,
            r.unit,
            r.currentStock.toLocaleString("vi-VN"),
            r.maxStock ? r.maxStock.toLocaleString("vi-VN") : "-",
            r.status,
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [234, 88, 12] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    doc.save(`bao-cao-ton-kho-${Date.now()}.pdf`);
}

export function exportTransactionsPDF(
    items: { movedAt: string; movementType: string; ingredientName: string; quantity: number; unit: string; refType: string | null; createdByStaffName: string | null; note: string | null }[]
) {
    const doc = setupDoc();
    const now = new Date().toLocaleString("vi-VN");

    doc.setFontSize(16);
    doc.text("LICH SU XUAT NHAP KHO", 14, 18);
    doc.setFontSize(10);
    doc.text(`Ngay xuat: ${now}`, 14, 26);

    autoTable(doc, {
        startY: 32,
        head: [["#", "Thoi gian", "Loai", "Nguyen lieu", "So luong", "Loai TK", "Nguoi tao", "Ghi chu"]],
        body: items.map((r, i) => [
            i + 1,
            new Date(r.movedAt).toLocaleString("vi-VN"),
            r.movementType === "IN" ? "Nhap" : "Xuat",
            r.ingredientName,
            `${r.quantity} ${r.unit}`,
            r.refType || "",
            r.createdByStaffName || "He thong",
            r.note || "",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [234, 88, 12] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: { 7: { cellWidth: 40 } },
    });

    doc.save(`lich-su-xuat-nhap-${Date.now()}.pdf`);
}

export function exportReceiptsPDF(
    items: { receiptCode: string; receiptDate: string; status: string; totalAmount: number; createdByStaffName?: string | null; note?: string | null }[]
) {
    const doc = setupDoc();
    const now = new Date().toLocaleString("vi-VN");

    doc.setFontSize(16);
    doc.text("DANH SACH PHIEU NHAP KHO", 14, 18);
    doc.setFontSize(10);
    doc.text(`Ngay xuat: ${now}`, 14, 26);

    autoTable(doc, {
        startY: 32,
        head: [["#", "Ma phieu", "Ngay nhap", "Trang thai", "Tong tien (VND)", "Nguoi tao", "Ghi chu"]],
        body: items.map((r, i) => [
            i + 1,
            r.receiptCode,
            new Date(r.receiptDate).toLocaleDateString("vi-VN"),
            r.status,
            r.totalAmount.toLocaleString("vi-VN"),
            r.createdByStaffName || "-",
            r.note || "",
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [234, 88, 12] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    doc.save(`phieu-nhap-kho-${Date.now()}.pdf`);
}
