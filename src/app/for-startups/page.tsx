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

export default function ForStartupsPage() {
  const [lang, setLang] = useState<Lang>("en");

  const heroSection = useReveal();
  const whyLatamSection = useReveal();
  const howMobil3Section = useReveal();
  const statsSection = useReveal();
  const storiesSection = useReveal();
  const ctaSection = useReveal();

  return (
    <main className="relative w-full bg-black text-white overflow-hidden">
      <div className="noise-overlay" />
      <div className="mobil3-grid" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-black/[0.8] backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Mobil3
          </Link>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/[0.05] rounded-lg p-1 border border-white/[0.06]">
              {(["es", "en", "pt"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded transition-all ${
                    lang === l
                      ? "bg-[var(--purple)] text-white"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <Link
              href="/"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {t(lang, "Volver al inicio", "Back to home", "Voltar ao início")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Section 1: Hero */}
      <motion.section
        ref={heroSection.ref}
        className="relative min-h-[70vh] flex items-center justify-center px-6 pt-32 pb-16 md:pt-40"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(131, 110, 249, 0.1) 0%, transparent 70%)",
        }}
      >
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={heroSection.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {t(
              lang,
              "Tus próximos 10 ingenieros están en una universidad de LATAM. Sabemos en cuál.",
              "Your next 10 engineers are in a LATAM university. We know which one.",
              "Seus próximos 10 engenheiros estão em uma universidade da LATAM. Sabemos qual."
            )}
          </h1>

          <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed">
            {t(
              lang,
              "Mobil3 conecta startups Web3 con builders verificados en toda LATAM. Contratación más rápida, costos menores, mejor retención.",
              "Mobil3 connects Web3 startups with vetted builders across LATAM. Faster hiring, lower costs, better retention.",
              "Mobil3 conecta startups Web3 com builders verificados em toda a LATAM. Contratação mais rápida, custos menores, melhor retenção."
            )}
          </p>

          <button className="btn-primary">
            {t(lang, "Conectar con Talento", "Connect with Talent", "Conectar com Talentos")}
          </button>
        </motion.div>
      </motion.section>

      {/* Section 2: Why LATAM Talent */}
      <motion.section
        ref={whyLatamSection.ref}
        className="relative py-20 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-16 text-center text-[var(--periwinkle)]"
            initial={{ opacity: 0 }}
            animate={whyLatamSection.isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t(lang, "Por Qué Talento LATAM", "Why LATAM Talent", "Por Que Talento LATAM")}
          </motion.h2>

          <div className="mobil3-grid grid md:grid-cols-2 gap-6">
            {[
              {
                titleEs: "Costo 3-5x Menor",
                titleEn: "3-5x Lower Cost",
                titlePt: "Custo 3-5x Menor",
                descEs:
                  "Ingenieros de clase mundial a 30-40% de las tasas del mercado estadounidense, sin comprometer la calidad ni la dedicación.",
                descEn:
                  "Top-tier engineers at 30-40% of US market rates, without compromising on quality or dedication.",
                descPt:
                  "Engenheiros de classe mundial a 30-40% das taxas do mercado americano, sem comprometer qualidade ou dedicação.",
              },
              {
                titleEs: "Zonas Horarias Superpuestas",
                titleEn: "Overlapping Timezones",
                titlePt: "Fusos Horários Sobrepostos",
                descEs:
                  "Trabaja dentro de 1-3 horas de la hora de EE.UU./Canadá. Ventanas de colaboración incorporadas, cero dolores de cabeza de zona horaria.",
                descEn:
                  "Work within 1-3 hours of US/Canada time. Built-in collaboration windows, zero timezone headaches.",
                descPt:
                  "Trabalhe dentro de 1-3 horas do horário de EUA/Canadá. Janelas de colaboração integradas, zero problemas de fuso horário.",
              },
              {
                titleEs: "Pipeline de Talento Universitario",
                titleEn: "University Talent Pipeline",
                titlePt: "Pipeline de Talento Universitário",
                descEs:
                  "Accede a graduados de ciencias de la computación ansiosos por construir en Web3. Perspectivas frescas, mentalidad de startup.",
                descEn:
                  "Access computer science graduates hungry to build on Web3. Fresh perspectives, startup mentality.",
                descPt:
                  "Acesse graduados em ciência da computação ansiosos para construir em Web3. Perspectivas novas, mentalidade de startup.",
              },
              {
                titleEs: "Impulsado por Motivación",
                titleEn: "Driven by Motivation",
                titlePt: "Impulsado pela Motivação",
                descEs:
                  "Construir en crypto en LATAM está impulsado por oportunidad. Los ingenieros quieren equity, impacto y reputación.",
                descEn:
                  "Building in LATAM crypto is opportunity-driven. Engineers want equity, impact, and reputation.",
                descPt:
                  "Construir em crypto na LATAM é orientado por oportunidade. Engenheiros querem equity, impacto e reputação.",
              },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                className="glass-card group"
                initial={{ opacity: 0, y: 20 }}
                animate={whyLatamSection.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <h3 className="text-xl font-bold mb-4 text-white group-hover:text-[var(--purple)] transition-colors">
                  {t(lang, card.titleEs, card.titleEn, card.titlePt)}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {t(lang, card.descEs, card.descEn, card.descPt)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Section 3: How Mobil3 Connects You */}
      <motion.section
        ref={howMobil3Section.ref}
        className="relative py-20 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-16 text-center text-[var(--periwinkle)]"
            initial={{ opacity: 0 }}
            animate={howMobil3Section.isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t(
              lang,
              "Cómo Mobil3 Te Conecta",
              "How Mobil3 Connects You",
              "Como Mobil3 Te Conecta"
            )}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                titleEs: "Pipeline de Hackathones",
                titleEn: "Hackathon Pipeline",
                titlePt: "Pipeline de Hackathones",
                descEs:
                  "Conoce a builders en nuestros 13+ workshops en LATAM. Identifica talento superior compitiendo en tiempo real.",
                descEn:
                  "Meet builders at our 13+ workshops across LATAM. Identify top talent competing in real time.",
                descPt:
                  "Conheça builders em nossos 13+ workshops na LATAM. Identifique talentos superiores competindo em tempo real.",
              },
              {
                titleEs: "Graduados de Residencia",
                titleEn: "Residency Graduates",
                titlePt: "Graduados de Residência",
                descEs:
                  "Accede a nuestra red post-residencia. 7 equipos aún construyendo, 3 ya recaudando capital.",
                descEn:
                  "Tap into our post-residency network. 7 teams still building, 3 already raising capital.",
                descPt:
                  "Aproveite nossa rede pós-residência. 7 equipes ainda construindo, 3 já captando capital.",
              },
              {
                titleEs: "Builders Verificados",
                titleEn: "Vetted Builders",
                titlePt: "Builders Verificados",
                descEs:
                  "Accede a nuestra base de datos de desarrolladores, diseñadores y fundadores calificados con trayectorias comprobadas.",
                descEn:
                  "Access our database of qualified developers, designers, and founders with proven track records.",
                descPt:
                  "Acesse nossa base de dados de desenvolvedores, designers e fundadores qualificados com históricos comprovados.",
              },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                className="glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={howMobil3Section.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <h3 className="text-xl font-bold mb-4 text-white">
                  {t(lang, card.titleEs, card.titleEn, card.titlePt)}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {t(lang, card.descEs, card.descEn, card.descPt)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Section 4: Stats That Matter */}
      <motion.section
        ref={statsSection.ref}
        className="relative py-20 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-16 text-center text-[var(--periwinkle)]"
            initial={{ opacity: 0 }}
            animate={statsSection.isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t(lang, "Estadísticas Que Importan", "Stats That Matter", "Estatísticas Que Importam")}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                labelEs: "Tiempo para Contratar",
                labelEn: "Time to Hire",
                labelPt: "Tempo para Contratar",
                value: "50%",
                descEs: "Más rápido que la contratación tradicional",
                descEn: "Faster than traditional recruiting",
                descPt: "Mais rápido que recrutamento tradicional",
              },
              {
                labelEs: "Ahorros de Costo",
                labelEn: "Cost Savings",
                labelPt: "Economia de Custo",
                value: "60%",
                descEs: "vs. Tarifa del mercado estadounidense",
                descEn: "vs. US market rate",
                descPt: "vs. taxa do mercado americano",
              },
              {
                labelEs: "Tasa de Retención",
                labelEn: "Retention Rate",
                labelPt: "Taxa de Retenção",
                value: "89%",
                descEs: "Los ingenieros se mantienen comprometidos",
                descEn: "Engineers stay engaged",
                descPt: "Engenheiros permanecem engajados",
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className="glass-card text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={statsSection.isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <div className="mb-4">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300 mb-4">
                    [PLACEHOLDER]
                  </span>
                </div>
                <p className="text-sm text-white/60 mb-3">
                  {t(lang, stat.labelEs, stat.labelEn, stat.labelPt)}
                </p>
                <p className="text-5xl font-bold text-[var(--orange)] mb-3">
                  {stat.value}
                </p>
                <p className="text-white/70 text-sm">
                  {t(lang, stat.descEs, stat.descEn, stat.descPt)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Section 5: Success Stories */}
      <motion.section
        ref={storiesSection.ref}
        className="relative py-20 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-16 text-center text-[var(--periwinkle)]"
            initial={{ opacity: 0 }}
            animate={storiesSection.isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t(lang, "Historias de Éxito", "Startup Success Stories", "Histórias de Sucesso")}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                company: "Protocol Finance",
                subtitle: "Hired 3 Engineers via Mobil3",
                quote:
                  "We found world-class engineers in 2 weeks. The quality and cultural fit exceeded our expectations.",
              },
              {
                company: "DeFi Labs",
                subtitle: "Built Full Team through Hackathons",
                quote:
                  "Our founding engineer came from a Mobil3 hackathon. We knew within hours this was the right fit.",
              },
              {
                company: "Cross Chain Collective",
                subtitle: "Scaled from 2 to 8 Engineers",
                quote:
                  "We cut hiring costs by 60% while building a stronger team. LATAM talent is the competitive advantage.",
              },
            ].map((story, idx) => (
              <motion.div
                key={idx}
                className="glass-card relative group"
                initial={{ opacity: 0, y: 20 }}
                animate={storiesSection.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <span className="absolute top-4 right-4 inline-block px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300">
                  Placeholder
                </span>
                <h3 className="text-xl font-bold mb-2 text-white">{story.company}</h3>
                <p className="text-sm text-[var(--orange)] mb-4">{story.subtitle}</p>
                <p className="text-white/70 italic">{`"${story.quote}"`}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Section 6: CTA with Form */}
      <motion.section
        ref={ctaSection.ref}
        className="relative py-20 px-6"
      >
        <div className="max-w-2xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-12 text-center text-[var(--periwinkle)]"
            initial={{ opacity: 0 }}
            animate={ctaSection.isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t(
              lang,
              "Accede al pipeline de talento.",
              "Access the talent pipeline.",
              "Acesse o pipeline de talentos."
            )}
          </motion.h2>

          <motion.form
            className="glass-card p-8 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={ctaSection.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {t(lang, "Nombre de la Startup", "Startup Name", "Nome da Startup")}
              </label>
              <input
                type="text"
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--purple)] transition-colors"
                placeholder={t(
                  lang,
                  "Tu startup...",
                  "Your startup...",
                  "Sua startup..."
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {t(
                  lang,
                  "Qué estás construyendo",
                  "What You're Building",
                  "O Que Você Está Construindo"
                )}
              </label>
              <input
                type="text"
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--purple)] transition-colors"
                placeholder={t(
                  lang,
                  "Describe tu proyecto...",
                  "Describe your project...",
                  "Descreva seu projeto..."
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {t(
                  lang,
                  "Necesidades de Contratación",
                  "Hiring Needs",
                  "Necessidades de Contratação"
                )}
              </label>
              <textarea
                rows={4}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--purple)] transition-colors resize-none"
                placeholder={t(
                  lang,
                  "¿Qué roles necesitas? ¿Nivel de experiencia?",
                  "What roles do you need? Experience level?",
                  "Que cargos você precisa? Nível de experiência?"
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--purple)] transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
            >
              {t(
                lang,
                "Conectar con Talento",
                "Connect with Talent",
                "Conectar com Talentos"
              )}
            </button>
          </motion.form>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-white/60 space-y-4">
          <p>hello@mobil3.xyz</p>
          <p>mobil3.xyz</p>
          <p>&copy; 2026 Mobil3</p>
        </div>
      </footer>
    </main>
  );
}
