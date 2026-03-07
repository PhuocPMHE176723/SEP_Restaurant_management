import { redirect } from "next/navigation";

export default function WarehouseDashboard() {
    redirect("/warehouse/ingredients");
    return null;
}
