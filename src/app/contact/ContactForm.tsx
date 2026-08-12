"use client";

import Button from "@/components/ui/Button";

export default function ContactForm() {
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="grid sm:grid-cols-2 gap-4">
        <input type="text" placeholder="Full Name" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
        <input type="email" placeholder="Email Address" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
      </div>
      <input type="text" placeholder="Subject" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all" />
      <textarea rows={5} placeholder="Your Message" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"></textarea>
      <Button type="submit" size="lg">Send Message</Button>
    </form>
  );
}
