"use client";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

type Lang = "es" | "en" | "pt";
const t = (lang: Lang, es: string, en: string, pt?: string) =>
  lang === "es" ? es : lang === "pt" ? pt || en : en;

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return { ref, isInView };
}

export default function ForBuildersPage() {
  const [lang, setLang] = useState<Lang>("es");

  const cards = [
    {
      icon: "⚡",
      titleEs: "Hackathons",
      titleEn: "Hackathons",
      titlePt: "Hackathons",
      descEs: "Compite en 13+ workshops. Construye en 48 horas, obtén reconocimiento, conoce protocolos e inversores.",
      descEn: "Compete in 13+ workshops. Build in 48 hours, get recognized, meet protocols and investors.",
      descPt: "Compete em 13+ workshops. Construa em 48 horas, ganhe reconhecimento, conheça protocolos e investidores.",
    },
    {
      icon: "🏠",
      titleEs: "Residencias",
      titleEn: "Residencies",
      titlePt: "Residências",
      descEs: "Programas de 6-12 semanas construyendo con mentores y compañeros. Gradúate con un producto lanzado y conexiones para toda la vida.",
      descEn: "6-12 week programs building with mentors and peers. Graduate with a shipped product and connections for life.",
      descPt: "Programas de 6-12 semanas construindo com mentores e colegas. Formados com um produto lançado e conexões para a vida.",
    },
    {
      icon: "💰",
      titleEs: "Bounties",
      titleEn: "Bounties",
      titlePt: "Bounties",
      descEs: "Encuentra trabajo pagado en desafíos de protocolos y necesidades de startups. Gana mientras construyes tu portafolio.",
      descEn: "Find paid work on protocol challenges and startup needs. Earn while you build your portfolio.",
      descPt: "Encontre trabalho remunerado em desafios de protocolos e necessidades de startups. Ganhe enquanto constrói seu portfólio.",
    },
    {
      icon: "👥",
      titleEs: "Mentoría",
      titleEn: "Mentorship",
      titlePt: "Mentoria",
      descEs: "Obtén orientación de builders experimentados. Retroalimentación 1-a-1 en código, producto y decisiones de carrera.",
      descEn: "Get guidance from shipped builders. 1-on-1 feedback on code, product, and career decisions.",
      descPt: "Obtenha orientação de construtores experientes. Feedback 1-a-1 em código, produto e decisões de carreira.",
    },
    {
      icon: "💼",
      titleEs: "Conexiones Laborales",
      titleEn: "Job Connections",
      titlePt: "Conexões de Trabalho",
      descEs: "Protocolos y startups buscan talento. Tu desempeño habla por sí solo.",
      descEn: "Protocols and startups looking for talent. Your performance speaks for itself.",
      descPt: "Protocolos e startups procuram por talento. Seu desempenho fala por si só.",
    },
    {
      icon: "🌍",
      titleEs: "Red de Builders",
      titleEn: "Builder Network",
      titlePt: "Rede de Builders",
      descEs: "Construye relaciones con 644+ desarrolladores en 12 países. Tu red es tu valor neto.",
      descEn: "Build relationships with 644+ developers across 12 countries. Your network is your net worth.",
      descPt: "Construa relacionamentos com 644+ desenvolvedores em 12 países. Sua rede é seu valor líquido.",
    },
  ];

  const stats = [
    { label: "Builders", value: "644" },
    { label: "Countries", value: "12" },
    { label: "Cities", value: "56" },
    { label: "Prize Pool", value: "$75K" },
    { label: "Teams Building", value: "7" },
    { label: "Already Raising", value: "3" },
  ];

  const testimonials = [
    {
      name: "Maria Chen",
      role: "Smart Contract Developer",
      quote: "My first hackathon here changed everything. I shipped my first protocol integration and met the founders who became my mentors.",
    },
    {
      name: "Diego Mendez",
      role: "Full-stack Engineer",
      quote: "The residency program gave me the structure and support I needed to build properly. Six weeks later, we had a product ready for launch.",
    },
    {
      name: "Sofia Rodriguez",
      role: "UI/UX Designer",
      quote: "Mentorship from real builders taught me what the market actually needs. My portfolio went from zero to multiple shipped projects.",
    },
  ];

  const events = [
    {
      date: "April 2026",
      dateEs: "Abril 2026",
      datePt: "Abril 2026",
      titleEs: "Serie de Hackathons LATAM",
      titleEn: "LATAM Hackathon Series",
      titlePt: "Série de Hackathons LATAM",
      descEs: "Sprint de 48 horas en 8 ciudades. $50K en premios.",
      descEn: "48-hour sprint across 8 cities. $50K in prizes.",
      descPt: "Sprint de 48 horas em 8 cidades. $50K em prêmios.",
      tagEs: "Hackathon",
      tagEn: "Hackathon",
      tagPt: "Hackathon",
    },
    {
      date: "May 2026",
      dateEs: "Mayo 2026",
      datePt: "Maio 2026",
      titleEs: "Residencia Tokyo",
      titleEn: "Tokyo Residency",
      titlePt: "Residência Tokyo",
      descEs: "Programa intensivo de 6 semanas. Construye con fundadores experimentados.",
      descEn: "6-week intensive program. Build with experienced founders.",
      descPt: "Programa intensivo de 6 semanas. Construa com fundadores experientes.",
      tagEs: "Residencia",
      tagEn: "Residency",
      tagPt: "Residência",
    },
    {
      date: "Ongoing",
      dateEs: "Continuo",
      datePt: "Contínuo",
      titleEs: "Tablero de Bounties",
      titleEn: "Bounty Board",
      titlePt: "Quadro de Bounties",
      descEs: "Bounties semanales de protocolos y startups. Cobra en días, no semanas.",
      descEn: "Weekly bounties from protocols and startups. Get paid in days, not weeks.",
      descPt: "Bounties semanais de protocolos e startups. Receba em dias, não semanas.",
      tagEs: "Bounties",
      tagEn: "Bounties",
      tagPt: "Bounties",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white noise-overlay">
      {/* Nav */}
      <nav className="border-b border-white/10 sticky top-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/?lang=${lang}`} className="text-xl font-bold">
            Mobil3
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang("es")}
              className={`px-3 py-1 rounded text-sm transition ${
                lang === "es"
                  ? "bg-[var(--purple)]/30 text-[var(--purple)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded text-sm transition ${
                lang === "en"
                  ? "bg-[var(--purple)]/30 text-[var(--purple)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("pt")}
              className={`px-3 py-1 rounded text-sm transition ${
                lang === "pt"
                  ? "bg-[var(--purple)]/30 text-[var(--purple)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              PT
            </button>
          </div>
        </div>
      </nav>

      {/* Section 1: Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, rgba(78, 224, 137, 0.1) 0%, transparent 60%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {t(lang, "Construye. Lanza. Cobra. Repite.", "Build. Ship. Get paid. Repeat.", "Construa. Lance. Receba. Repita.")}
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            {t(
              lang,
              "Mobil3 es la plataforma para desarrolladores y diseñadores en LATAM que quieren crecer. Compite en hackathons, únete a residencias, gana bounties y lanza tu carrera en Web3.",
              "Mobil3 is the platform for developers and designers in LATAM to level up. Compete in hackathons, join residencies, earn bounties, and launch your career in Web3.",
              "Mobil3 é a plataforma para desenvolvedores e designers da LATAM que querem crescer. Participe de hackathons, junte-se a residências, ganhe bounties e lance sua carreira em Web3."
            )}
          </p>
        </motion.div>
      </section>

      {/* Section 2: What Mobil3 Offers */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            {t(lang, "Qué Ofrece Mobil3", "What Mobil3 Offers", "O Que a Mobil3 Oferece")}
          </motion.h2>
          <div className="mobil3-grid">
            {cards.map((card, idx) => {
              const { ref, isInView } = useReveal();
              const title =
                lang === "es" ? card.titleEs : lang === "pt" ? card.titlePt : card.titleEn;
              const desc =
                lang === "es" ? card.descEs : lang === "pt" ? card.descPt : card.descEn;
              return (
                <motion.div
                  key={idx}
                  ref={ref}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="glass-card p-8 rounded-2xl border border-white/10 hover:border-[var(--green)]/50 hover:bg-white/[0.05] transition-all duration-300 group"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{title}</h3>
                  <p className="text-white/60 leading-relaxed">{desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: By The Numbers */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            {t(lang, "Los Números Hablan", "By The Numbers", "Os Números Falam")}
          </motion.h2>
          <div className="mobil3-grid">
            {stats.map((stat, idx) => {
              const { ref, isInView } = useReveal();
              return (
                <motion.div
                  key={idx}
                  ref={ref}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="text-center py-8"
                >
                  <div className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[var(--green)] to-[var(--periwinkle)] bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className="text-white/60 text-lg">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Builder Stories */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            {t(lang, "Historias de Builders", "Builder Stories", "Histórias de Builders")}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => {
              const { ref, isInView } = useReveal();
              return (
                <motion.div
                  key={idx}
                  ref={ref}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="glass-card p-8 rounded-2xl border border-white/10 border-l-4 border-l-[var(--green)] hover:bg-white/[0.05] transition-all duration-300 relative"
                >
                  <div className="absolute top-4 right-4 px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded">
                    Placeholder
                  </div>
                  <p className="text-white/70 leading-relaxed mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 5: Upcoming Events */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            {t(lang, "Próximos Eventos", "Upcoming Events", "Próximos Eventos")}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.map((event, idx) => {
              const { ref, isInView } = useReveal();
              const title =
                lang === "es" ? event.titleEs : lang === "pt" ? event.titlePt : event.titleEn;
              const desc =
                lang === "es" ? event.descEs : lang === "pt" ? event.descPt : event.descEn;
              const tag =
                lang === "es" ? event.tagEs : lang === "pt" ? event.tagPt : event.tagEn;
              const date =
                lang === "es" ? event.dateEs : lang === "pt" ? event.datePt : event.date;
              return (
                <motion.div
                  key={idx}
                  ref={ref}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="glass-card p-8 rounded-2xl border border-white/10 hover:border-[var(--orange)]/50 hover:bg-white/[0.05] transition-all duration-300"
                >
                  <p className="text-[var(--orange)] font-semibold text-sm mb-4">{date}</p>
                  <h3 className="text-xl font-bold mb-3">{title}</h3>
                  <p className="text-white/60 leading-relaxed mb-6">{desc}</p>
                  <div className="inline-block px-3 py-1 rounded-full bg-[var(--purple)]/20 text-[var(--periwinkle)] text-xs font-semibold">
                    {tag}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 6: CTA with Form */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
              {t(lang, "Aplica ahora.", "Apply now.", "Inscreva-se agora.")}
            </h2>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  {t(lang, "Tu Nombre", "Your Name", "Seu Nome")}
                </label>
                <input
                  type="text"
                  placeholder={t(lang, "Nombre completo", "Full name", "Nome completo")}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 focus:border-[var(--green)]/50 focus:outline-none transition text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  {t(lang, "Email", "Email", "Email")}
                </label>
                <input
                  type="email"
                  placeholder="hello@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 focus:border-[var(--green)]/50 focus:outline-none transition text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  {t(lang, "URL de GitHub", "GitHub URL", "URL do GitHub")}
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 focus:border-[var(--green)]/50 focus:outline-none transition text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  {t(lang, "En Qué Estás Construyendo", "What You're Building", "No Que Você Está Construindo")}
                </label>
                <textarea
                  placeholder={t(lang, "Cuéntanos sobre tu proyecto...", "Tell us about your project...", "Conte-nos sobre seu projeto...")}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 focus:border-[var(--green)]/50 focus:outline-none transition text-white placeholder:text-white/40 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  {t(lang, "Nivel de Experiencia", "Experience Level", "Nível de Experiência")}
                </label>
                <select className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 focus:border-[var(--green)]/50 focus:outline-none transition text-white">
                  <option value="" className="bg-black text-white">
                    {t(lang, "Selecciona...", "Select...", "Selecione...")}
                  </option>
                  <option value="beginner" className="bg-black text-white">
                    {t(lang, "Principiante", "Beginner", "Iniciante")}
                  </option>
                  <option value="intermediate" className="bg-black text-white">
                    {t(lang, "Intermedio", "Intermediate", "Intermediário")}
                  </option>
                  <option value="advanced" className="bg-black text-white">
                    {t(lang, "Avanzado", "Advanced", "Avançado")}
                  </option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[var(--green)] to-[var(--periwinkle)] text-black font-bold hover:shadow-lg hover:shadow-[var(--green)]/50 transition-all duration-300"
              >
                {t(lang, "Únete al Movimiento", "Join the Movement", "Junte-se ao Movimento")}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-4 text-white/60">
          <p>
            <a href="mailto:hello@mobil3.xyz" className="hover:text-white transition">
              hello@mobil3.xyz
            </a>
          </p>
          <p>mobil3.xyz</p>
          <p>© 2026 Mobil3</p>
        </div>
      </footer>
    </div>
  );
}
