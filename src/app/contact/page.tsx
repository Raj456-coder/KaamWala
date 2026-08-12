import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { Mail } from "lucide-react";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact Us - KaamWala",
  description: "Get in touch with KaamWala support.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-4">Contact Us</h1>
            <p className="text-lg text-text-secondary">Have a question or need support? Reach out to us.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center text-primary">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-text">Email Support</p>
                <p className="text-sm text-text-secondary">We typically respond within 24 hours.</p>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
