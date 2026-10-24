import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Scale,
  Sparkles,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Handshake,
  Ban,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "Terms & Conditions - KaamWala | Har Kaam Ka Sahi Wala",
  description:
    "Terms and conditions for KaamWala - India's trusted hyperlocal blue-collar marketplace. Learn about our 0% commission model, user & worker responsibilities, direct payment terms, and liability limits.",
};

const tableOfContents = [
  { id: "acceptance", title: "1. Acceptance of Terms & Eligibility" },
  { id: "zero-commission", title: "2. Zero-Commission Model & Scope" },
  { id: "independent-contractor", title: "3. Independent Contractor Status" },
  { id: "customer-responsibilities", title: "4. Customer Responsibilities" },
  { id: "worker-responsibilities", title: "5. Worker & Partner Responsibilities" },
  { id: "direct-contact", title: "6. Direct Contact & Communication" },
  { id: "payments-razorpay", title: "7. Direct Payments & Razorpay Gateway" },
  { id: "disclaimers-liability", title: "8. Limitation of Liability & Warranties" },
  { id: "prohibited-activities", title: "9. Prohibited Activities & Termination" },
  { id: "intellectual-property", title: "10. Intellectual Property Rights" },
  { id: "governing-law", title: "11. Governing Law & Jurisdiction" },
  { id: "grievance-contact", title: "12. Grievance Redressal & Contact" },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero Header */}
      <div className="pt-28 pb-12 sm:pt-32 sm:pb-16 bg-gradient-to-b from-blue-50/50 via-white to-surface dark:from-slate-900 dark:via-slate-900/80 dark:to-surface border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-text-secondary mb-6">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-text font-medium">Terms & Conditions</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-5">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal Agreement & User Contract</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-text tracking-tight mb-4">
            KaamWala Terms &amp; Conditions
          </h1>

          <p className="text-base sm:text-lg text-text-secondary max-w-3xl leading-relaxed mb-8">
            Please read these Terms of Service carefully before accessing or using the KaamWala platform.
            By connecting with workers or booking services through KaamWala, you agree to comply with and be
            bound by the terms outlined below.
          </p>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-text-secondary pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Effective Date: <strong>October 2026</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Jurisdiction: <strong>Mathura, Uttar Pradesh, India</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Model: <strong>100% Zero Commission on Worker Wages</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Key Principles Callout Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-text text-base mb-1">0% Commission</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Workers keep 100% of the money paid by customers for home &amp; business labor.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <Handshake className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-text text-base mb-1">Direct Settlement</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Customers pay workers directly via Cash or UPI upon job completion. No middleman hold.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-text text-base mb-1">Secure Razorpay</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Platform worker memberships and ad packages are processed through RBI-approved Razorpay.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-text text-base mb-1">Independent Pros</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Service providers are independent local contractors, not employees of KaamWala.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Table of Contents - Sticky Sidebar */}
            <aside className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-28 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-text text-sm uppercase tracking-wider">Table of Contents</h2>
                </div>
                <nav className="space-y-1">
                  {tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-xs font-medium text-text-secondary hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/60 py-2 px-3 rounded-xl transition-all"
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-text-secondary space-y-2">
                  <p className="font-medium text-text">Questions about terms?</p>
                  <a
                    href="mailto:growwithrajat456@gmail.com"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>growwithrajat456@gmail.com</span>
                  </a>
                  <a
                    href="tel:+916396661099"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+91 6396661099</span>
                  </a>
                </div>
              </div>
            </aside>

            {/* Legal Document Content */}
            <article className="lg:col-span-8 space-y-8">
              {/* Section 1 */}
              <section
                id="acceptance"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/70 text-primary flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Acceptance of Terms &amp; Eligibility
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <p>
                    These Terms and Conditions (&quot;Terms&quot;, &quot;Agreement&quot;) constitute a legally binding
                    contract between you (&quot;User&quot;, &quot;Customer&quot;, &quot;Worker&quot;, &quot;Service Provider&quot;,
                    or &quot;You&quot;) and <strong>KaamWala</strong> (&quot;Platform&quot;, &quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;),
                    headquartered in Mathura, Uttar Pradesh, India.
                  </p>
                  <p>
                    By downloading, browsing, registering on, or utilizing any feature of the KaamWala website,
                    progressive web application (PWA), or associated services, you unconditionally accept and
                    agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms,
                    you must immediately discontinue using KaamWala.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm">
                    <p className="font-semibold text-text mb-1">Contractual Capacity &amp; Age of Majority:</p>
                    <p>
                      You must be at least 18 years of age and fully competent to enter into binding legal contracts
                      under the Indian Contract Act, 1872. By creating an account or hiring a service provider, you
                      warrant that you meet these eligibility criteria.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section
                id="zero-commission"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Zero-Commission Model &amp; Marketplace Scope
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <p>
                    KaamWala functions strictly as a hyperlocal discovery and matchmaking technology platform
                    designed to bridge the gap between verified blue-collar professionals (including but not
                    limited to electricians, plumbers, carpenters, painters, daily wagers, appliance repairers)
                    and prospective households and businesses in need of their trade skills.
                  </p>
                  
                  {/* Zero Commission Highlight Callout */}
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm sm:text-base mb-1">
                          Our Zero-Commission Guarantee
                        </h3>
                        <p className="text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm leading-relaxed">
                          Unlike traditional corporate service aggregators that take 20% to 40% cuts from worker wages,
                          <strong> KaamWala charges 0% commission on service booking charges and labor earnings</strong>.
                          Every single rupee paid by the customer for job work belongs directly and entirely to the worker.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p>
                    <strong>How KaamWala Sustains Operations:</strong> The platform sustains and scales its technology
                    infrastructure transparently through optional value-added services, including:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                    <li>Worker membership subscriptions providing profile badges and priority listing reach.</li>
                    <li>Featured local spotlight placements and targeted advertisement banners for local businesses.</li>
                    <li>Optional convenience tools, verified partner upgrades, and priority customer support.</li>
                  </ul>
                </div>
              </section>

              {/* Section 3 */}
              <section
                id="independent-contractor"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Independent Contractor Status (No Employment Relationship)
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <p>
                    All service professionals registered on KaamWala are <strong>independent freelance contractors</strong> and
                    autonomous small business operators. Nothing in these Terms or on the Platform shall be construed to create
                    any employer-employee, master-servant, principal-agent, partnership, or joint venture relationship between
                    KaamWala and any service professional.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Workers set their own availability, working hours, and operational locations.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Workers provide their own tools, safety equipment, transport, and equipment necessary to complete jobs.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Workers determine their own labor quotes and negotiate directly with customers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>KaamWala does not supervise, inspect, direct, or exercise day-to-day managerial control over the physical execution of work.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section
                id="customer-responsibilities"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Customer &amp; User Responsibilities
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <p>As a customer or user hiring through KaamWala, you expressly agree and covenant to:</p>
                  <div className="grid gap-3 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-text mb-0.5">Accurate Scope &amp; Information:</p>
                      <p>Provide genuine, accurate descriptions of the task, repair needed, physical location, and contact information.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-text mb-0.5">Safe Premises &amp; Respectful Environment:</p>
                      <p>Ensure that your home, premises, or work site is reasonably safe, free of hazardous conditions, and respectful. Discrimination or harassment against workers of any form is strictly forbidden.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-text mb-0.5">Direct Price Agreement &amp; Pre-Work Confirmation:</p>
                      <p>Directly inspect the worker&apos;s proposed quote and confirm material costs before commencement. KaamWala does not set fixed prices on third-party behalf.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-text mb-0.5">Inspection &amp; Prompt Settlement:</p>
                      <p>Inspect the completed service on-site with the worker and disburse agreed wages promptly upon satisfactory completion.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section
                id="worker-responsibilities"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Worker &amp; Service Provider Responsibilities
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <p>
                    Every worker and artisan registering a service profile on KaamWala certifies and warrants:
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Genuine Identity:</strong> You provide authentic government identification (Aadhaar / Voter ID) and accurate profile pictures. Impersonation will result in immediate blacklisting and potential reporting under the IT Act.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Skill Competency &amp; Tools:</strong> You possess the necessary skill, training, experience, and tools to perform the services listed in your profile in a safe, workmanlike manner.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Punctuality &amp; Integrity:</strong> You commit to agreed customer appointments or inform them in advance of any scheduling conflicts. No unauthorized substitution of personnel.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Fair Pricing:</strong> Transparent quotes must be provided before work begins. Demanding extortionate or surprise charges after dismantling appliances or work is strictly prohibited.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section
                id="direct-contact"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-sm">
                    6
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Direct Contact &amp; Communication Protocol
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <p>
                    KaamWala believes in hyper-local autonomy. Unlike closed platforms that mask phone numbers
                    or prohibit off-platform communication, KaamWala facilitates <strong>direct, unmasked contact via
                    phone calls and WhatsApp</strong> between customers and local workers.
                  </p>
                  <p>
                    By publishing your contact number as a service provider or submitting a call request as a
                    customer, you consent to receive direct telephonic and electronic communications regarding
                    service inquiries, quotes, and task coordination.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm">
                    <p className="font-semibold text-text mb-1">Safety &amp; Caution Advisory:</p>
                    <p>
                      Users are advised to conduct initial phone discussions to clarify task requirements, verify
                      pricing expectations, and confirm timelines before sharing sensitive residential directions.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 7 */}
              <section
                id="payments-razorpay"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                    7
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Direct Labor Payments &amp; Razorpay Gateway Disclaimers
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  {/* Two payment types cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2 font-bold text-text">
                        <Handshake className="w-4 h-4 text-emerald-600" />
                        <span>A. Service Labor Charges</span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Settled directly between customer and worker upon service delivery. Payment methods include
                        direct Cash, worker&apos;s personal UPI QR code (Google Pay, PhonePe, Paytm), or direct bank transfer.
                        <strong> KaamWala does NOT hold escrow, collect labor charges, or process worker wages.</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-2 font-bold text-text">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span>B. Platform Fees (Razorpay)</span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Purchases of worker subscriptions (Pro/Featured plans), platform profile promotions, lead tokens,
                        or business ad banners are processed through our authorized payment partner: <strong>Razorpay Software Private Limited</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Razorpay specific terms */}
                  <div className="space-y-3 pt-2">
                    <h3 className="font-bold text-text text-base">Razorpay Payment Gateway Terms:</h3>
                    <ul className="space-y-2 text-xs sm:text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Security &amp; Compliance:</strong> Razorpay is an RBI-authorized Payment Aggregator complying with PCI-DSS Level 1 standards. KaamWala never stores your card CVV, banking passwords, or UPI PINs.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Currency:</strong> All platform subscription transactions are processed in Indian Rupees (INR / ₹) including applicable GST taxes where mandated.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Refunds &amp; Cancellations:</strong> Paid worker memberships and featured advertisement packages are non-refundable once activated. In the event of a verified double deduction or technical gateway failure, the amount is automatically refunded back to the source account within 5 to 7 business days in accordance with banking norms.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 8 */}
              <section
                id="disclaimers-liability"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm">
                    8
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Limitation of Liability &amp; Disclaimers
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/60">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-amber-950 dark:text-amber-200 text-sm sm:text-base mb-1">
                          Crucial Disclaimer of Warranties (&quot;AS-IS&quot; Platform)
                        </h3>
                        <p className="text-amber-900 dark:text-amber-300 text-xs sm:text-sm leading-relaxed">
                          KaamWala provides an online intermediary platform on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;
                          basis. While KaamWala conducts baseline identity reviews where indicated, KaamWala DOES NOT warrant,
                          guarantee, or insure the specific skill, punctuality, background, trustworthiness, or craftsmanship
                          of any independent worker or the conduct of any customer.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p>
                    <strong>Comprehensive Liability Cap:</strong> Under no circumstances—including negligence, breach of
                    contract, or tort—shall KaamWala, its founders, operators, employees, licensors, or agents be liable to
                    you or any third party for:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                    <li>Any property damage, breakage, loss of belongings, or substandard workmanship caused during on-site services.</li>
                    <li>Any personal injury, physical harm, accidents, or criminal acts committed by or against users or workers.</li>
                    <li>Any indirect, punitive, special, incidental, or consequential damages whatsoever (including lost wages, revenue, or business stoppage).</li>
                    <li>Any dispute, non-payment, or disagreement regarding labor charges or cost of spare parts between customers and service providers.</li>
                  </ul>
                  <p className="text-xs sm:text-sm pt-2">
                    In all circumstances, the total aggregate liability of KaamWala for any claim arising out of or related to
                    these Terms shall be strictly limited to the amount paid by you directly to KaamWala for platform services
                    (excluding payments made to third-party workers) in the three (3) months preceding the incident, or <strong>INR ₹1,000</strong> (One Thousand Indian Rupees), whichever is lower.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section
                id="prohibited-activities"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm">
                    9
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Prohibited Activities &amp; Termination
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <p>Users shall not engage in any of the following prohibited behaviors:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <Ban className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Posting forged identity documents or fabricated work experiences.</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <Ban className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Harassment, stalking, abusive language, or physical intimidation.</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <Ban className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Scraping, automated data harvesting, or reverse engineering the app.</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <Ban className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Publishing fake, defamatory, or competitor-targeted reviews or ratings.</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm">
                    KaamWala reserves the right to suspend, disable, or permanently delete any worker or customer
                    account without prior notice in the event of reported safety threats, fraud, or violations of these Terms.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section
                id="intellectual-property"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
                    10
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Intellectual Property Rights
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <p>
                    All brand elements, the name &quot;KaamWala&quot;, the slogan &quot;Har Kaam Ka Sahi Wala&quot;,
                    logos, brand marks, interface designs, visual layouts, animations, and source code are the
                    exclusive intellectual property of KaamWala and its creators.
                  </p>
                  <p>
                    No person or entity may copy, reproduce, modify, redistribute, or create derivative works from
                    any part of the KaamWala platform without prior written consent.
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section
                id="governing-law"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    11
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Governing Law &amp; Jurisdiction
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <p>
                    These Terms, and any disputes or claims arising out of or in connection with their subject matter,
                    shall be governed by and construed in accordance with the substantive <strong>laws of the Republic of India</strong>,
                    including the Information Technology Act, 2000, and rules promulgated thereunder.
                  </p>
                  <p>
                    You agree that any legal action, suit, or proceeding arising out of or related to these Terms or
                    the use of KaamWala shall be submitted to the exclusive jurisdiction of the competent courts
                    located in <strong>Mathura, Uttar Pradesh, India</strong>.
                  </p>
                </div>
              </section>

              {/* Section 12 */}
              <section
                id="grievance-contact"
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-28"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/70 text-primary flex items-center justify-center font-bold text-sm">
                    12
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    Grievance Redressal &amp; Contact Information
                  </h2>
                </div>
                <div className="space-y-4 text-text-secondary leading-relaxed text-sm sm:text-base">
                  <p>
                    In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code)
                    Rules, 2021, the contact details for grievance redressal and regulatory queries are provided below:
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-text text-base">Grievance Officer / Administrator</h3>
                        <p className="text-xs text-text-secondary">KaamWala Platform Operations</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <a
                        href="tel:+916396661099"
                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary transition-colors group"
                        id="terms-contact-phone"
                      >
                        <Phone className="w-4 h-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                        <div>
                          <p className="text-xs text-text-secondary">Phone Support</p>
                          <p className="text-xs sm:text-sm font-semibold text-text">+91 6396661099</p>
                        </div>
                      </a>

                      <a
                        href="mailto:growwithrajat456@gmail.com"
                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary transition-colors group"
                        id="terms-contact-email"
                      >
                        <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                        <div>
                          <p className="text-xs text-text-secondary">Email Inquiries</p>
                          <p className="text-xs sm:text-sm font-semibold text-text break-all">growwithrajat456@gmail.com</p>
                        </div>
                      </a>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs text-text-secondary">Headquarters</p>
                          <p className="text-xs sm:text-sm font-semibold text-text">Mathura, UP, India</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary">
                    Grievances will typically be acknowledged within 24 hours and addressed within fifteen (15) working
                    days in accordance with the IT Rules.
                  </p>
                </div>
              </section>

              {/* Bottom Support Banner */}
              <div className="bg-gradient-to-r from-primary to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold font-heading mb-1">Need help or have questions?</h3>
                  <p className="text-blue-100 text-sm max-w-lg">
                    Our team is here to assist customers, workers, and partners with any questions regarding safety,
                    direct payments, or account verification.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    href="/contact"
                    className="px-5 py-2.5 rounded-xl bg-white text-primary font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm"
                    id="terms-contact-btn"
                  >
                    Contact Us
                  </Link>
                  <Link
                    href="/privacy"
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors"
                    id="terms-privacy-btn"
                  >
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
