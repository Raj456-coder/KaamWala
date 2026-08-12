import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { STATISTICS } from "@/constants";
import Button from "@/components/ui/Button";
import Link from "next/link";

export const metadata = {
  title: "About Us - KaamWala",
  description: "Learn about KaamWala's mission to connect India with trusted local workers.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-4">About KaamWala</h1>
            <p className="text-lg text-text-secondary max-w-3xl mx-auto">Har Kaam Ka Sahi Wala — India&apos;s most trusted platform to find verified local workers for every need.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {STATISTICS.map((stat) => (
              <div key={stat.id} className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                <div className="text-4xl font-bold font-heading text-primary mb-2">{stat.value}</div>
                <p className="text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700 shadow-sm mb-12">
            <h2 className="text-2xl font-bold font-heading text-text mb-4">Our Mission</h2>
            <p className="text-text-secondary leading-relaxed mb-6">To empower every Indian household and business with instant access to trustworthy, verified local professionals. We believe everyone deserves reliable help at their doorstep.</p>
            <h2 className="text-2xl font-bold font-heading text-text mb-4">Our Vision</h2>
            <p className="text-text-secondary leading-relaxed mb-6">To build India&apos;s largest and most trusted local services network, where skilled workers get fair opportunities and customers get peace of mind.</p>
            <h2 className="text-2xl font-bold font-heading text-text mb-4">Why KaamWala?</h2>
            <p className="text-text-secondary leading-relaxed">We combine rigorous worker verification, transparent pricing, and modern technology to make hiring local workers safe, fast, and effortless.</p>
          </div>

          <div className="text-center">
            <Link href="/search"><Button size="lg">Find a Worker Now</Button></Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
