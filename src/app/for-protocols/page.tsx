"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

type Lang = "es" | "en" | "pt";

const t = (lang: Lang, es: string, en: string, pt?: string) =>
  lang === "es" ? es : lang === "pt" ? (pt || en) : en;

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return { ref, isInView };
}

export default function ForProtocolsPage() {
  const [lang, setLang] = useState<Lang>("en");

  const heroReveal = useReveal();
  const problemReveal = useReveal();
  const solutionReveal = useReveal();
  const stepsReveal = useReveal();
  const socialReveal = useReveal();
  const ctaReveal = useReveal();

  return (
    <div className="min-h-screen bg-black text-white noise-overlay">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/[0.06]">
        <Link href="/" className="text-2xl font-bold text-white hover:text-white/80 transition">
          Mobil3
        </Link>
        <div className="flex gap-3 items-center">
          <div className="flex gap-2 bg-white/[0.05] border border-white/[0.1] rounded-lg p-1">
            {(["es", "en", "pt"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 text-sm font-medium rounded transition ${
                  lang === l
                    ? "bg-white/[0.1] text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition"
          >
            {t(lang, "Volver", "Back to home", "Voltar")}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        ref={heroReveal.ref}
        initial={{ opacity: 0, y: 20 }}
        animate={heroReveal.isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-20 md:px-12 overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: "radial-gradient(circle at center, #836EF9 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 mobil3-grid pointer-events-none" />

        <div className="relative z-10 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t(
              lang,
              "Deja de comprar audiencias en LATAM. Empieza a construir pipeline.",
              "Stop buying audiences in LATAM. Start building pipeline.",
              "Pare de comprar audiências na LATAM. Comece a construir pipeline."
            )}
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            {t(
              lang,
              "Los protocolos gastan miles en eventos y obtienen impresiones. Mobil3 es la capa operativa que los conecta con builders calificados listos para producir.",
              "Protocols spend thousands on events and get impressions. Mobil3 is the operating layer that connects you with qualified builders ready to ship.",
              "Protocolos gastam milhares em eventos e obtêm impressões. Mobil3 é a camada operacional que conecta você com builders qualificados prontos para entregar."
            )}
          </p>
        </div>
      </motion.section>

      {/* Problem Section */}
      <motion.section
        ref={problemReveal.ref}
        initial={{ opacity: 0, y: 20 }}
        animate={problemReveal.isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="px-6 py-20 md:px-12 max-w-4xl mx-auto"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[var(--periwinkle)]">
          {t(lang, "El Problema", "The Problem", "O Problema")}
        </h2>
        <p className="text-lg text-white/70 leading-relaxed">
          {t(
            lang,
            "La mayoría de protocolos ven Web3 en LATAM como oportunidad de crecimiento. Entonces patrocinan conferencias, hacen activaciones, compran stands. El resultado: miles de impresiones, docenas de tarjetas, cero pipelines. Los protocolos no necesitan audiencias. Necesitan builders con convicción, capital y distribución. Eso requiere un approach diferente.",
            "Most protocols see Web3 in LATAM as a growth opportunity. So they sponsor conferences, run activations, buy booths. The result? Thousands of impressions, dozens of business cards, zero pipelines. Protocols don't need audiences. They need builders with conviction, capital, and distribution. That requires a different approach.",
            "A maioria dos protocolos vê Web3 na LATAM como oportunidade de crescimento. Então patrocinam conferências, fazem ativações, compram estandes. O resultado: milhares de impressões, dezenas de cartões, zero pipelines. Protocolos não precisam de audiências. Precisam de builders com convicção, capital e distribuição. Isso requer uma abordagem diferente."
          )}
        </p>
      </motion.section>

      {/* Solution Section with Stats */}
      <motion.section
        ref={solutionReveal.ref}
        initial={{ opacity: 0, y: 20 }}
        animate={solutionReveal.isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="px-6 py-20 md:px-12"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[var(--periwinkle)] text-center">
            {t(lang, "La Solución Mobil3", "The Mobil3 Solution", "A Solução Mobil3")}
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto text-center mb-12">
            {t(
              lang,
              "Llevamos talento tecnológico donde nadie más llega. Operando en 12 países y 56 ciudades, Mobil3 construye el pipeline de builders calificados que los protocolos necesitan.",
              "We bring tech talent where no one else reaches. Operating across 12 countries and 56 cities, Mobil3 builds the qualified builder pipeline that protocols need.",
              "Trazemos talentos tecnológicos onde mais ninguém chega. Operando em 12 países e 56 cidades, Mobil3 constrói o pipeline de builders qualificados que os protocolos precisam."
            )}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { value: "644", label: t(lang, "Check-ins", "Check-ins", "Check-ins") },
              { value: "12", label: t(lang, "Países", "Countries", "Países") },
              { value: "56", label: t(lang, "Ciudades", "Cities", "Cidades") },
              { value: "13", label: t(lang, "Talleres", "Workshops", "Workshops") },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="glass-card p-6 text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-[var(--green)] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Benefit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: t(
                  lang,
                  "Acceso a Builders Calificados",
                  "Qualified Builder Access",
                  "Acesso a Builders Qualificados"
                ),
                desc: t(
                  lang,
                  "Conexión directa con desarrolladores, diseñadores y fundadores verificados construyendo en Web3.",
                  "Direct connection to vetted developers, designers, and founders building in Web3.",
                  "Conexão direta com desenvolvedores, designers e fundadores verificados construindo em Web3."
                ),
              },
              {
                title: t(
                  lang,
                  "Integración de Patrocinio",
                  "Event Sponsorship Integration",
                  "Integração de Patrocínio"
                ),
                desc: t(
                  lang,
                  "Ubicación premium en nuestros hackathons y talleres en ciudades de LATAM.",
                  "Premium placement at our hackathons and workshops across LATAM cities.",
                  "Posicionamento premium em nossos hackathons e workshops em cidades da LATAM."
                ),
              },
              {
                title: t(
                  lang,
                  "Pipeline Post-Evento",
                  "Post-Event Pipeline",
                  "Pipeline Pós-Evento"
                ),
                desc: t(
                  lang,
                  "7 equipos siguen construyendo después del evento. 3 ya han recaudado capital.",
                  "7 teams are still building post-event. 3 have already raised capital.",
                  "7 equipes continuam construindo após o evento. 3 já captaram capital."
                ),
              },
              {
                title: t(
                  lang,
                  "Red Institucional",
                  "Institutional Network",
                  "Rede Institucional"
                ),
                desc: t(
                  lang,
                  "Conexiones con gobierno, universidades e industria que ningún protocolo puede construir solo.",
                  "Government, university, and industry connections that no protocol can build alone.",
                  "Conexões com governo, universidades e indústria que nenhum protocolo pode construir sozinho."
                ),
              },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="glass-card p-8 hover:border-white/[0.12] transition-colors group"
              >
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-[var(--periwinkle)] transition">
                  {card.title}
                </h3>
                <p className="text-white/60 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        ref={stepsReveal.ref}
        initial={{ opacity: 0, y: 20 }}
        animate={stepsReveal.isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="px-6 py-20 md:px-12 bg-white/[0.02]"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-[var(--periwinkle)] text-center">
            {t(lang, "Cómo funciona", "How It Works", "Como Funciona")}
          </h2>
          <div className="space-y-6">
            {[
              {
                step: t(lang, "Asociarse", "Partner", "Parceria"),
                desc: t(
                  lang,
                  "Patrocina un programa Mobil3 o intérate en nuestra red de builders.",
                  "Sponsor a Mobil3 program or integrate into our builder network.",
                  "Patrocine um programa Mobil3 ou se integre à nossa rede de builders."
                ),
              },
              {
                step: t(lang, "Conectar", "Connect", "Conectar"),
                desc: t(
                  lang,
                  "Conoce builders calificados y comunica tu visión directamente.",
                  "Meet qualified builders and communicate your vision directly.",
                  "Conheça builders qualificados e comunique sua visão diretamente."
                ),
              },
              {
                step: t(lang, "Construir", "Build", "Construir"),
                desc: t(
                  lang,
                  "Lanza iniciativas conjuntas, tracks de hackathons o programas piloto.",
                  "Launch joint initiatives, hackathon tracks, or pilot programs.",
                  "Inicie iniciativas conjuntas, trilhas de hackathons ou programas piloto."
                ),
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--green)] text-black flex items-center justify-center font-bold text-lg">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.step}</h3>
                  <p className="text-white/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Social Proof Section */}
      <motion.section
        ref={socialReveal.ref}
        initial={{ opacity: 0, y: 20 }}
        animate={socialReveal.isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="px-6 py-20 md:px-12"
      >
        <div className="max-w-3xl mx-auto text-center glass-card p-12">
          <p className="text-lg md:text-xl text-white/80 italic mb-4">
            {t(
              lang,
              "Comparado por encima de ETH Global México 2022 por participantes",
              "Benchmarked above ETH Global Mexico 2022 by participants",
              "Comparado acima de ETH Global México 2022 por participantes"
            )}
          </p>
        </div>
      </motion.section>

      {/* CTA Section with Form */}
      <motion.section
        ref={ctaReveal.ref}
        initial={{ opacity: 0, y: 20 }}
        animate={ctaReveal.isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="px-6 py-20 md:px-12"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-[var(--periwinkle)] text-center">
            {t(lang, "Hablemos de pipeline.", "Let's talk pipeline.", "Vamos falar de pipeline.")}
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert(
                t(
                  lang,
                  "Gracias! Nos pondremos en contacto pronto.",
                  "Thank you! We'll be in touch soon.",
                  "Obrigado! Entraremos em contato em breve."
                )
              );
            }}
            className="space-y-4 glass-card p-8"
          >
            <div>
              <input
                type="text"
                placeholder={t(lang, "Nombre", "Name", "Nome")}
                required
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/[0.3] transition"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/[0.3] transition"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder={t(lang, "Protocolo/Organización", "Protocol/Organization", "Protocolo/Organização")}
                required
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/[0.3] transition"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder={t(lang, "Tu Rol", "Your Role", "Seu Papel")}
                required
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-white/[0.3] transition"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[var(--purple)] to-[var(--indigo)] text-white font-bold rounded-lg hover:opacity-90 transition"
            >
              {t(lang, "Enviar Consulta", "Send Inquiry", "Enviar Consulta")}
            </button>
          </form>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-12 md:px-12 text-center text-white/50 text-sm">
        <div className="max-w-4xl mx-auto mb-4">
          <a href="mailto:hello@mobil3.xyz" className="hover:text-white/80 transition">
            hello@mobil3.xyz
          </a>
          <span className="mx-3">|</span>
          <a href="https://mobil3.xyz" className="hover:text-white/80 transition">
            mobil3.xyz
          </a>
        </div>
        <p>© 2026 Mobil3</p>
      </footer>
    </div>
  );
}
