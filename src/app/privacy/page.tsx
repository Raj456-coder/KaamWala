import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";

export const metadata = {
  title: "Privacy Policy - KaamWala",
  description: "Privacy policy for KaamWala platform.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-8">Privacy Policy</h1>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 text-text-secondary leading-relaxed">
            <p>At KaamWala, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
            <h2 className="text-xl font-bold text-text">Information We Collect</h2>
            <p>We collect information you provide directly, such as name, phone number, email address, and service preferences when you register or use our platform.</p>
            <h2 className="text-xl font-bold text-text">How We Use Your Information</h2>
            <p>Your data helps us connect you with verified workers, improve our services, and ensure a safe experience. We do not sell your personal data to third parties.</p>
            <h2 className="text-xl font-bold text-text">Data Security</h2>
            <p>We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure.</p>
            <h2 className="text-xl font-bold text-text">Contact Us</h2>
            <p>If you have questions about this policy, please contact us through the contact form on our website.</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
