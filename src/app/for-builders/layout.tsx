import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Builders | Mobil3",
  description: "Build. Ship. Get paid. Repeat. Mobil3 is the platform for developers and designers in LATAM to compete, learn, earn, and launch careers in Web3.",
  openGraph: {
    title: "For Builders | Mobil3",
    description: "Hackathons, residencies, bounties, mentorship. The platform for LATAM builders to level up in Web3.",
    url: "https://mobil3.xyz/for-builders",
    siteName: "Mobil3",
    type: "website",
    locale: "es_MX",
  },
};

export default function ForBuildersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
