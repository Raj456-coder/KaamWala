"use client";

import { TransactionWithId } from "@/types/monetization";
import { formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

interface TransactionTableProps {
  transactions: TransactionWithId[];
  loading?: boolean;
}

const typeLabels: Record<string, string> = {
  worker_subscription: "Worker Subscription",
  customer_membership: "Customer Membership",
  contact_unlock: "Contact Unlock",
  advertising: "Advertising",
};

const statusVariants: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  success: "success",
  pending: "warning",
  failed: "danger",
  refunded: "neutral",
};

export default function TransactionTable({ transactions, loading = false }: TransactionTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">ID</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Amount</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
              <td className="py-3 px-4 text-sm text-text-secondary font-mono">
                #{tx.id.slice(0, 8)}
              </td>
              <td className="py-3 px-4 text-sm text-text">
                {typeLabels[tx.type] || tx.type}
              </td>
              <td className="py-3 px-4 text-sm font-medium text-text">
                {formatCurrency(tx.amount)}
              </td>
              <td className="py-3 px-4">
                <Badge variant={statusVariants[tx.status] || "neutral"} size="sm">
                  {tx.status}
                </Badge>
              </td>
              <td className="py-3 px-4 text-sm text-text-secondary">
                {new Date(tx.createdAt).toLocaleDateString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
