"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Store, Tag } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface SponsoredCardProps {
  businessName: string;
  category: string;
  description: string;
  city: string;
  area?: string;
  planId: string;
  href?: string;
  index?: number;
}

export default function SponsoredCard({
  businessName,
  category,
  description,
  city,
  area,
  planId,
  href = "#",
  index = 0,
}: SponsoredCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary-50/50 dark:bg-primary-950/30 p-5 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-text truncate">{businessName}</h3>
            <p className="text-xs text-primary font-medium">{category}</p>
          </div>
        </div>
        <Badge variant="primary" size="sm" className="flex items-center gap-1">
          <Tag className="w-3 h-3" />
          Sponsored
        </Badge>
      </div>

      <p className="text-sm text-text-secondary line-clamp-2 mb-4">{description}</p>

      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="font-medium">{city}</span>
          {area && <span>· {area}</span>}
        </span>
      </div>

      <div className="mt-4">
        <Link href={href}>
          <Button variant="outline" size="sm" className="w-full">
            View Business
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
