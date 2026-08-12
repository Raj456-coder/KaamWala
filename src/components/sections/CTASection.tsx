"use client";

import { motion } from "framer-motion";
import { ArrowRight, Phone, Mail } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary-700 to-primary-900 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-primary-100 max-w-3xl mx-auto mb-10 leading-relaxed">
            Join thousands of happy customers who trust KaamWala for all their
            service needs. Download the app or sign up today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register">
              <Button
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Get Started
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="!border-white/30 !text-white hover:!bg-white/10"
                leftIcon={<Phone className="w-5 h-5" />}
              >
                Contact Us
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-primary-100">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm">+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm">hello@kaamwala.com</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
