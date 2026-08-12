import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Workers - KaamWala",
  description: "Search and find verified local workers near you. Filter by category, rating, availability, and more.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
