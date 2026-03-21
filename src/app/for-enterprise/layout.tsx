import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Enterprise | Mobil3",
  description: "The institutional bridge to Web3 innovation in Latin America. Verified blockchain talent, university pipelines, and government-backed ecosystems.",
  openGraph: {
    title: "For Enterprise | Mobil3",
    description: "Enterprise access to verified blockchain talent, university pipelines, and government-backed innovation ecosystems across LATAM.",
    url: "https://mobil3.xyz/for-enterprise",
    siteName: "Mobil3",
    type: "website",
    locale: "es_MX",
  },
};

export default function ForEnterpriseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
