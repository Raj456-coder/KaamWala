import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";

export const metadata = {
  title: "Terms of Service - KaamWala",
  description: "Terms of service for using KaamWala platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-8">Terms of Service</h1>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 text-text-secondary leading-relaxed">
            <p>Welcome to KaamWala. By accessing or using our platform, you agree to be bound by these terms.</p>
            <h2 className="text-xl font-bold text-text">Use of Service</h2>
            <p>KaamWala provides a platform to connect customers with verified local workers. We do not guarantee the quality of services provided by workers.</p>
            <h2 className="text-xl font-bold text-text">User Responsibilities</h2>
            <p>Users must provide accurate information, respect workers, and comply with local laws. Misuse of the platform may result in account suspension.</p>
            <h2 className="text-xl font-bold text-text">Payment Terms</h2>
            <p>Payments are handled securely. Users agree to pay for services as agreed with the worker. KaamWala is not a party to the transaction.</p>
            <h2 className="text-xl font-bold text-text">Limitation of Liability</h2>
            <p>KaamWala shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform.</p>
            <h2 className="text-xl font-bold text-text">Contact Us</h2>
            <p>For questions about these terms, contact us through the contact form on our website.</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
