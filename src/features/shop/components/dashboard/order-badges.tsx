import type { OrderPaymentStatus, OrderStatus } from "@/generated/prisma/enums";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  PENDING: "warning",
  CONFIRMED: "primary",
  PROCESSING: "primary",
  SHIPPED: "primary",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "danger",
};
const PAY_TONE: Record<OrderPaymentStatus, BadgeTone> = {
  UNPAID: "default",
  PENDING_VERIFICATION: "warning",
  PAID: "success",
  FAILED: "danger",
  REFUNDED: "dark",
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => <Badge tone={STATUS_TONE[status]}>{status.toLowerCase()}</Badge>;
export const PaymentStatusBadge = ({ status }: { status: OrderPaymentStatus }) => (
  <Badge tone={PAY_TONE[status]}>{status.toLowerCase().replace("_", " ")}</Badge>
);
