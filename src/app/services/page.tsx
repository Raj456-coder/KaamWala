"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import {
  Zap,
  Wrench,
  Hammer,
  Snowflake,
  Settings,
  Flame,
  Paintbrush,
  Boxes,
  Car,
  Utensils,
  Sparkle,
  Sparkles,
  Truck,
  Trees,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Languages,
  DollarSign,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  CATEGORIZED_SERVICES,
  CategorizedService,
  ServiceTier,
  parseRegionalLanguageQuery,
  MultilingualParseResult,
} from "@/lib/ai/multilingualParser";
import BookingWizardModal from "@/components/booking/BookingWizardModal";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Wrench,
  Hammer,
  Snowflake,
  Settings,
  Flame,
  Paintbrush,
  Boxes,
  Car,
  Utensils,
  Sparkle,
  Sparkles,
  Truck,
  Trees,
};

export default function ServicesPage() {
  const [selectedTier, setSelectedTier] = useState<"all" | ServiceTier>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [langMode, setLangMode] = useState<"bilingual" | "english" | "hindi">("bilingual");
  const [activeBookingService, setActiveBookingService] = useState<CategorizedService | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const filteredServices = useMemo(() => {
    return CATEGORIZED_SERVICES.filter((service) => {
      const matchesTier = selectedTier === "all" || service.tier === selectedTier;
      if (!matchesTier) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        service.name.toLowerCase().includes(q) ||
        service.hindiName.toLowerCase().includes(q) ||
        service.id.toLowerCase().includes(q) ||
        service.popularTags.some((tag) => tag.toLowerCase().includes(q)) ||
        Object.values(service.regionalNames).some((rn) => rn.toLowerCase().includes(q))
      );
    });
  }, [selectedTier, searchQuery]);

  const skilledServices = useMemo(
    () => filteredServices.filter((s) => s.tier === "skilled"),
    [filteredServices]
  );
  const semiSkilledServices = useMemo(
    () => filteredServices.filter((s) => s.tier === "semi-skilled"),
    [filteredServices]
  );
  const nonSkilledServices = useMemo(
    () => filteredServices.filter((s) => s.tier === "non-skilled"),
    [filteredServices]
  );

  const handleOpenBooking = (service: CategorizedService) => {
    setActiveBookingService(service);
    setIsBookingOpen(true);
  };

  const renderServiceCard = (service: CategorizedService, index: number) => {
    const IconComponent = ICON_MAP[service.icon] || Wrench;
    const isSkilled = service.tier === "skilled";
    const isSemi = service.tier === "semi-skilled";

    return (
      <motion.div
        key={service.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="group relative bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 ${
                isSkilled
                  ? "bg-gradient-to-tr from-primary to-accent"
                  : isSemi
                  ? "bg-gradient-to-tr from-amber-500 to-orange-600"
                  : "bg-gradient-to-tr from-emerald-500 to-teal-600"
              }`}
            >
              <IconComponent className="w-7 h-7" />
            </div>

            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                isSkilled
                  ? "bg-primary/10 text-primary border-primary/20"
                  : isSemi
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              }`}
            >
              {langMode === "hindi"
                ? service.tierLabel.hi
                : langMode === "english"
                ? service.tierLabel.en
                : `${service.tierLabel.en} • ${service.tierLabel.hi}`}
            </span>
          </div>

          {/* Titles & Bilingual Text */}
          <div className="mb-3">
            <h3 className="text-xl font-bold font-heading text-text group-hover:text-primary transition-colors">
              {langMode === "hindi" ? service.hindiName : service.name}
            </h3>
            {langMode === "bilingual" && (
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-300 mt-0.5">
                {service.hindiName}
              </p>
            )}
            <p className="text-xs text-text-secondary mt-2 line-clamp-2">
              {langMode === "hindi" ? service.description.hi : service.description.en}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {service.popularTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-surface-alt text-text-muted border border-slate-200/60 dark:border-slate-700/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & Actions Bottom */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] text-text-muted font-medium">Platform Booking Fee</p>
              <p className="text-lg font-bold text-success flex items-center gap-0.5">
                ₹10 <span className="text-xs font-normal text-text-muted">only</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-text-muted font-medium">Worker Direct Pay</p>
              <p className="text-sm font-semibold text-text">{service.hourlyRange}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="flex-1 font-semibold text-xs py-2.5 shadow-md shadow-primary/20"
              onClick={() => handleOpenBooking(service)}
            >
              Book Instant • तुरंत बुक करें
            </Button>
            <Link href={`/search?category=${service.id}`} className="flex-shrink-0">
              <Button type="button" variant="outline" size="sm" className="px-3 py-2.5 text-xs">
                Workers
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-primary-50/60 dark:from-slate-900 via-surface to-surface border-b border-slate-200/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
              <ShieldCheck className="w-4 h-4 text-primary" />
              On-Demand Aggregator Model • केवल ₹10 बुकिंग शुल्क
            </span>

            <h1 className="text-3xl sm:text-5xl font-black font-heading text-text tracking-tight mb-4 leading-tight">
              Instant Verified Services <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                सत्यापित घरेलू कारीगर व कामगार
              </span>
            </h1>

            <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8">
              Book skilled, semi-skilled, and domestic helpers on-demand within 5km. Pay ₹10 platform fee now, and pay the worker directly in cash/UPI after work.
            </p>

            {/* Multilingual / Search Bar */}
            <div className="max-w-xl mx-auto relative mb-6">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-text-muted absolute left-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="खोजें: प्लंबर, बढ़ई, बिजली वाला, Electrician, Maid..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-text placeholder:text-text-muted/60 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 shadow-sm"
                />
              </div>
            </div>

            {/* Controls: Tier Filter Tabs & Language Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              {/* Tier Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mx-auto sm:mx-0">
                <button
                  type="button"
                  onClick={() => setSelectedTier("all")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                    selectedTier === "all"
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text"
                  }`}
                >
                  All (सभी सेवाएं)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier("skilled")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                    selectedTier === "skilled"
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text"
                  }`}
                >
                  Skilled (कुशल)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier("semi-skilled")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                    selectedTier === "semi-skilled"
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text"
                  }`}
                >
                  Semi-Skilled (अर्ध-कुशल)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier("non-skilled")}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                    selectedTier === "non-skilled"
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text"
                  }`}
                >
                  Non-Skilled (सामान्य मजदूर)
                </button>
              </div>

              {/* Language Mode Toggle */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mx-auto sm:mx-0">
                <Languages className="w-4 h-4 text-primary ml-2" />
                <button
                  type="button"
                  onClick={() => setLangMode("bilingual")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    langMode === "bilingual"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  Bilingual (द्विभाषी)
                </button>
                <button
                  type="button"
                  onClick={() => setLangMode("hindi")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    langMode === "hindi"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => setLangMode("english")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    langMode === "english"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* 1. Skilled Workers Tier */}
          {(selectedTier === "all" || selectedTier === "skilled") && skilledServices.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <h2 className="text-2xl font-bold font-heading text-text">
                      Skilled Workers • कुशल कारीगर
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1">
                    Certified technicians with specialized equipment and technical training
                  </p>
                </div>
                <Badge variant="primary">{skilledServices.length} Services</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {skilledServices.map((service, idx) => renderServiceCard(service, idx))}
              </div>
            </div>
          )}

          {/* 2. Semi-Skilled Workers Tier */}
          {(selectedTier === "all" || selectedTier === "semi-skilled") && semiSkilledServices.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <h2 className="text-2xl font-bold font-heading text-text">
                      Semi-Skilled Workers • अर्ध-कुशल कामगार
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1">
                    Hands-on tradesmen for home renovations, personal driving, cooking and painting
                  </p>
                </div>
                <Badge variant="warning">{semiSkilledServices.length} Services</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {semiSkilledServices.map((service, idx) => renderServiceCard(service, idx))}
              </div>
            </div>
          )}

          {/* 3. Non-Skilled Workers Tier */}
          {(selectedTier === "all" || selectedTier === "non-skilled") && nonSkilledServices.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h2 className="text-2xl font-bold font-heading text-text">
                      Non-Skilled & General Help • सामान्य सहायक / मजदूर
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1">
                    Reliable domestic helpers for daily cleaning, loading/shifting, and gardening
                  </p>
                </div>
                <Badge variant="success">{nonSkilledServices.length} Services</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nonSkilledServices.map((service, idx) => renderServiceCard(service, idx))}
              </div>
            </div>
          )}

          {filteredServices.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <h3 className="text-xl font-bold text-text mb-2">No matching services found</h3>
              <p className="text-sm text-text-secondary mb-6">
                Try searching in Hindi or English (e.g. &ldquo;प्लंबर&rdquo; or &ldquo;Electrician&rdquo;).
              </p>
              <Button type="button" variant="primary" onClick={() => { setSelectedTier("all"); setSearchQuery(""); }}>
                Reset Filters • सभी सेवाएं देखें
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* 4-Step Booking Wizard Modal */}
      {isBookingOpen && activeBookingService && (
        <BookingWizardModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          preselectedService={activeBookingService}
        />
      )}

      <Footer />
    </main>
  );
}
