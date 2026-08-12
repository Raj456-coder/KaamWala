import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Button from "@/components/ui/Button";
import Link from "next/link";

export const metadata = {
  title: "Profile - KaamWala",
  description: "Your KaamWala profile.",
};

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <h1 className="text-3xl font-bold font-heading text-text mb-4">Profile</h1>
            <p className="text-text-secondary mb-8">View and edit your profile details. This feature is coming soon.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/settings"><Button>Settings</Button></Link>
              <Link href="/customer-dashboard"><Button variant="outline">Dashboard</Button></Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
