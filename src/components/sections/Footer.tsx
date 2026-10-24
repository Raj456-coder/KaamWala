"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  ArrowUp,
} from "lucide-react";

const footerLinks = {
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Advertise with Us", href: "/advertise" },
  ],
  Services: [
    { label: "Electrician", href: "/category/electrician" },
    { label: "Plumber", href: "/category/plumber" },
    { label: "Painter", href: "/category/painter" },
    { label: "Carpenter", href: "/category/carpenter" },
    { label: "All Categories", href: "/categories" },
  ],
  Support: [
    { label: "Help Center & FAQ", href: "/faq" },
    { label: "Become a Worker", href: "/become-worker" },
    { label: "Membership Plans", href: "/membership" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

const socialLinks = [
  { href: "#", label: "Facebook" },
  { href: "#", label: "Twitter" },
  { href: "#", label: "Instagram" },
  { href: "#", label: "LinkedIn" },
  { href: "#", label: "YouTube" },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group inline-flex">
              <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center bg-transparent">
                <Image
                  src="/logo.png?v=2"
                  alt="KaamWala Logo"
                  width={40}
                  height={40}
                  className="object-contain w-full h-full bg-transparent"
                  unoptimized={true}
                />
              </div>
              <span className="text-2xl font-bold font-heading text-white tracking-tight">
                Kaam<span className="text-primary">Wala</span>
              </span>
            </Link>
            <p className="text-slate-400 mb-6 max-w-sm leading-relaxed">
              India&apos;s most trusted platform to find verified local workers
              for all your home and business needs. Har Kaam Ka Sahi Wala.
            </p>
            <div className="space-y-3">
              <a
                href="tel:+916396661099"
                className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors group"
                id="footer-phone-link"
              >
                <Phone className="w-4 h-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>+91 6396661099</span>
              </a>
              <a
                href="mailto:growwithrajat456@gmail.com"
                className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors group"
                id="footer-email-link"
              >
                <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="break-all">growwithrajat456@gmail.com</span>
              </a>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Mathura, Uttar Pradesh, India</span>
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} KaamWala. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/terms" className="hover:text-primary transition-colors" id="footer-terms-bottom-link">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors" id="footer-privacy-bottom-link">
              Privacy Policy
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="p-2 rounded-full bg-slate-800 hover:bg-primary text-slate-400 hover:text-white transition-all duration-300 hover:-translate-y-1"
              >
                <Globe className="w-4 h-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-30 p-3 bg-primary text-white rounded-full shadow-xl shadow-primary/30 hover:bg-primary-700 hover:scale-110 transition-all duration-300"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
}
