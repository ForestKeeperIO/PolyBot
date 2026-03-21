import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Startups | Mobil3",
  description: "Your next 10 engineers are in a LATAM university. We know which one. Mobil3 connects Web3 startups with vetted builders across LATAM.",
  openGraph: {
    title: "For Startups | Mobil3",
    description: "Access vetted Web3 builders across LATAM. Faster hiring, lower costs, better retention.",
    url: "https://mobil3.xyz/for-startups",
    siteName: "Mobil3",
    type: "website",
    locale: "es_MX",
  },
};

export default function ForStartupsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
