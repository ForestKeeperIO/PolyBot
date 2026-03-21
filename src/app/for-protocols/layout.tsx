import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Protocols | Mobil3",
  description: "Stop buying audiences in LATAM. Start building pipeline. Mobil3 connects protocols with qualified builders across Latin America.",
  openGraph: {
    title: "For Protocols | Mobil3",
    description: "Stop buying audiences in LATAM. Start building pipeline. Mobil3 delivers qualified builders, not just impressions.",
    url: "https://mobil3.xyz/for-protocols",
    siteName: "Mobil3",
    type: "website",
    locale: "es_MX",
  },
};

export default function ForProtocolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
