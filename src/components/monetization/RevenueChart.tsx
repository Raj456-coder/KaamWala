"use client";

import { MonthlyRevenue } from "@/types/monetization";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: MonthlyRevenue[];
  height?: number;
}

export default function RevenueChart({ data, height = 200 }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary">
        No revenue data available yet.
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * height : 0;
          return (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-primary/10 rounded-t-lg relative" style={{ height }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary-400 rounded-t-lg"
                />
              </div>
              <span className="text-xs text-text-muted whitespace-nowrap">
                {new Date(item.month + "-01").toLocaleDateString("en-IN", { month: "short" })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
        <span>Total Revenue: {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}</span>
        <span>{data.reduce((sum, d) => sum + d.count, 0)} transactions</span>
      </div>
    </div>
  );
}
