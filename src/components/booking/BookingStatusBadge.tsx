import Badge from "@/components/ui/Badge";
import { BookingDoc } from "@/types/firestore";

interface BookingStatusBadgeProps {
  status: BookingDoc["status"];
}

const STATUS_CONFIG: Record<BookingDoc["status"], { variant: "primary" | "success" | "warning" | "danger" | "neutral"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  accepted: { variant: "primary", label: "Accepted" },
  rejected: { variant: "danger", label: "Rejected" },
  confirmed: { variant: "primary", label: "Confirmed" },
  "in-progress": { variant: "warning", label: "In Progress" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "neutral", label: "Cancelled" },
};

export default function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
