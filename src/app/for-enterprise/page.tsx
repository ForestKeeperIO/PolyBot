"use client";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

type Lang = "es" | "en" | "pt";
const t = (lang: Lang, es: string, en: string, pt?: string) => lang === "es" ? es : lang === "pt" ? (pt || en) : en;

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return { ref, isInView };
}

export default function ForEnterprisePage() {
  const [lang, setLang] = useState<Lang>("en");
  const [formData, setFormData] = useState({ company: "", name: "", role: "", area: "", email: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setFormData({ company: "", name: "", role: "", area: "", email: "" });
    setTimeout(() => setFormSubmitted(false), 3000);
  };

  // Section components
  const Hero = () => {
    const { ref, isInView } = useReveal();
    return (
      <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(circle at 50% 0%, rgba(255, 149, 0, 0.08) 0%, transparent 60%)"
        }} />
        <div className="noise-overlay absolute inset-0" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold text-white mb-6"
          >
            {t(lang,
              "El puente institucional hacia la innovación Web3 en América Latina.",
              "The institutional bridge to Web3 innovation in Latin America.",
              "A ponte institucional para inovação Web3 na América Latina."
            )}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-8"
          >
            {t(lang,
              "Mobil3 conecta a las empresas directamente con talento blockchain verificado, pipelines de talento universitario y ecosistemas de innovación respaldados por gobiernos en toda LATAM.",
              "Mobil3 brings enterprises into direct contact with verified blockchain talent, university talent pipelines, and government-backed innovation ecosystems across LATAM.",
              "Mobil3 conecta empresas diretamente com talentos blockchain verificados, pipelines de talentos universitários e ecossistemas de inovação apoiados por governos em toda a LATAM."
            )}
          </motion.p>
        </div>
      </section>
    );
  };

  const EnterpriseChallenge = () => {
    const { ref, isInView } = useReveal();
    const problems = [
      {
        title: { es: "Brecha de Talento", en: "Talent Gap", pt: "Lacuna de Talento" },
        desc: { es: "La experiencia en blockchain está concentrada en Silicon Valley y algunos pocos centros de criptomonedas. El talento de LATAM es ignorado pero excepcional.", en: "Blockchain expertise is concentrated in Silicon Valley and a few crypto hubs. LATAM talent is overlooked but exceptional.", pt: "A experiência em blockchain está concentrada em Silicon Valley e alguns poucos centros de criptomoedas. O talento da LATAM é ignorado mas excepcional." }
      },
      {
        title: { es: "Riesgo de Mercado", en: "Market Risk", pt: "Risco de Mercado" },
        desc: { es: "Entrar en LATAM sin experiencia local es caro y lento. Las asociaciones reducen el tiempo de llegada al mercado en un 60%.", en: "Entering LATAM without local expertise is expensive and slow. Partnerships reduce time-to-market by 60%.", pt: "Entrar na LATAM sem experiência local é caro e lento. As parcerias reduzem o tempo de chegada ao mercado em 60%." }
      },
      {
        title: { es: "Velocidad de Innovación", en: "Innovation Velocity", pt: "Velocidade de Inovação" },
        desc: { es: "Los laboratorios fallan sin el equipo adecuado. El acceso a graduados universitarios y ganadores de hackathons acelera el desarrollo.", en: "Labs fail without the right team. Access to university graduates and hackathon winners accelerates development.", pt: "Os labs falham sem o time certo. O acesso a graduados universitários e vencedores de hackathons acelera o desenvolvimento." }
      }
    ];

    return (
      <section ref={ref} className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
              {t(lang, "El Desafío Empresarial", "The Enterprise Challenge", "O Desafio Empresarial")}
            </h2>
            <p className="text-center text-white/60 mb-16 max-w-2xl mx-auto text-lg">
              {lang === "es" ? "Construir soluciones blockchain requiere talento especializado. La mayoría de las instituciones luchan con tres problemas: la escasez global de talento blockchain, el riesgo de pilotos de innovación fallidos y la complejidad de operar en mercados emergentes. Mobil3 resuelve los tres." : lang === "pt" ? "Construir soluções blockchain requer talento especializado. A maioria das instituições luta com três problemas: a escassez global de talentos blockchain, o risco de pilotos de inovação falhados e a complexidade de operar em mercados emergentes. Mobil3 resolve todos os três." : "Building blockchain solutions requires specialized talent. Most institutions struggle with three problems: the global blockchain talent shortage, the risk of failed innovation pilots, and the complexity of operating in emerging markets. Mobil3 solves all three."}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((problem, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="glass-card p-8 border border-white/[0.06] border-[var(--orange)]/20 rounded-2xl hover:border-[var(--orange)]/40 transition-colors"
              >
                <h3 className="text-xl font-bold text-[var(--orange)] mb-4">
                  {t(lang, problem.title.es, problem.title.en, problem.title.pt)}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {t(lang, problem.desc.es, problem.desc.en, problem.desc.pt)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const InstitutionalAccess = () => {
    const { ref, isInView } = useReveal();
    const access = [
      {
        title: { es: "Universidades", en: "Universities", pt: "Universidades" },
        desc: { es: "Pipelines directos a programas de informática de primer nivel. Graduados previamente verificados y redes de estudiantes activas.", en: "Direct pipelines to top computer science programs. Pre-vetted graduates and active student networks.", pt: "Pipelines diretos para programas de ciência da computação de topo. Graduados previamente verificados e redes de alunos ativos." }
      },
      {
        title: { es: "Programas Gubernamentales", en: "Government Programs", pt: "Programas Governamentais" },
        desc: { es: "Asociaciones estratégicas con centros de innovación y autoridades fintech que respaldan iniciativas blockchain.", en: "Strategic partnerships with innovation hubs and fintech authorities backing blockchain initiatives.", pt: "Parcerias estratégicas com centros de inovação e autoridades fintech apoiando iniciativas blockchain." }
      },
      {
        title: { es: "Ecosistema Fintech", en: "Fintech Ecosystem", pt: "Ecossistema Fintech" },
        desc: { es: "Oportunidades de coinversión con líderes de finanzas tradicionales que entran en el espacio blockchain.", en: "Co-investment opportunities with traditional finance leaders entering blockchain space.", pt: "Oportunidades de coinvestimento com líderes de finanças tradicionais entrando no espaço blockchain." }
      }
    ];

    return (
      <section ref={ref} className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
              {t(lang, "Acceso Institucional", "Institutional Access", "Acesso Institucional")}
            </h2>
            <p className="text-center text-white/60 mb-16 max-w-2xl mx-auto text-lg">
              {lang === "es" ? "Mobil3 tiene relaciones profundas con universidades, oficinas de innovación gubernamental y ecosistemas fintech en 12 países de LATAM. Desbloqueamos el acceso." : lang === "pt" ? "Mobil3 tem relacionamentos profundos com universidades, escritórios de inovação governamental e ecossistemas fintech em 12 países da LATAM. Desbloqueamos o acesso." : "Mobil3 has deep relationships with universities, government innovation offices, and fintech ecosystems across 12 LATAM countries. We unlock access."}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {access.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="glass-card p-8 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-colors bg-gradient-to-br from-[var(--periwinkle)]/5 to-transparent"
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  {t(lang, item.title.es, item.title.en, item.title.pt)}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {t(lang, item.desc.es, item.desc.en, item.desc.pt)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const PartnershipModels = () => {
    const { ref, isInView } = useReveal();
    const models = [
      {
        title: { es: "Laboratorios de Innovación", en: "Innovation Labs", pt: "Labs de Inovação" },
        points: [
          { es: "Co-construir soluciones blockchain con tu equipo", en: "Co-build blockchain solutions with your team", pt: "Co-construir soluções blockchain com seu time" },
          { es: "Acceso a 20+ desarrolladores residentes", en: "Access to 20+ resident developers", pt: "Acesso a 20+ desenvolvedores residentes" },
          { es: "Asociación de 12-24 meses", en: "12-24 month partnership", pt: "Parceria de 12-24 meses" },
          { es: "Enfoque en ajuste producto-mercado", en: "Product-market fit focus", pt: "Foco em ajuste produto-mercado" }
        ]
      },
      {
        title: { es: "Pistas de Hackathon", en: "Hackathon Tracks", pt: "Pistas de Hackathon" },
        points: [
          { es: "Patrocina pistas de desafío dedicadas", en: "Sponsor dedicated challenge tracks", pt: "Patrocine pistas de desafio dedicadas" },
          { es: "Interacción directa con 100+ competidores", en: "Direct interaction with 100+ competitors", pt: "Interação direta com 100+ competidores" },
          { es: "Modelo de premio ganar-ganar", en: "Win-win prize model", pt: "Modelo de prêmio ganhar-ganhar" },
          { es: "Construcción de equipo post-evento", en: "Post-event team building", pt: "Construção de team pós-evento" }
        ]
      },
      {
        title: { es: "Programas de Talento", en: "Talent Programs", pt: "Programas de Talento" },
        points: [
          { es: "Asociaciones de reclutamiento con universidades", en: "Recruitment partnerships with universities", pt: "Parcerias de recrutamento com universidades" },
          { es: "Programas de becas y mentoría", en: "Scholarships and mentorship programs", pt: "Programas de bolsas e mentoria" },
          { es: "Caminos de pasantía a contratación", en: "Internship-to-hire pathways", pt: "Caminhos de estágio para contratação" },
          { es: "Desarrollo de habilidades continuo", en: "Ongoing skill development", pt: "Desenvolvimento contínuo de habilidades" }
        ]
      }
    ];

    return (
      <section ref={ref} className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-16 text-center"
          >
            {t(lang, "Modelos de Asociación", "Partnership Models", "Modelos de Parceria")}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {models.map((model, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="glass-card p-8 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-colors relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--green)]" />
                <h3 className="text-xl font-bold text-white mb-6 mt-2">
                  {t(lang, model.title.es, model.title.en, model.title.pt)}
                </h3>
                <ul className="space-y-4">
                  {model.points.map((point, pidx) => (
                    <li key={pidx} className="flex gap-3 text-white/70">
                      <span className="text-[var(--green)] mt-1">+</span>
                      <span>{t(lang, point.es, point.en, point.pt)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const Credibility = () => {
    const { ref, isInView } = useReveal();
    const creds = [
      {
        title: { es: "Socios Institucionales", en: "Institutional Partners", pt: "Parceiros Institucionais" },
        desc: { es: "Respaldado por universidades líderes y autoridades fintech reconocidas en toda LATAM.", en: "Backed by leading universities and recognized fintech authorities across LATAM.", pt: "Apoiado por universidades líderes e autoridades fintech reconhecidas em toda a LATAM." }
      },
      {
        title: { es: "Trayectoria", en: "Track Record", pt: "Histórico" },
        desc: { es: "644 check-ins, 13 talleres, 7 equipos construyendo post-evento, 3 levantando capital.", en: "644 check-ins, 13 workshops, 7 teams building post-event, 3 raising capital.", pt: "644 check-ins, 13 workshops, 7 times construindo pós-evento, 3 levantando capital." }
      },
      {
        title: { es: "Escala", en: "Scale", pt: "Escala" },
        desc: { es: "Operando en 12 países y 56 ciudades con presencia institucional creciente.", en: "Operating across 12 countries and 56 cities with growing institutional presence.", pt: "Operando em 12 países e 56 cidades com presença institucional crescente." }
      },
      {
        title: { es: "Evaluado", en: "Benchmarked", pt: "Avaliado" },
        desc: { es: "Las métricas de rendimiento superan a los principales eventos del ecosistema. Reconocido por líderes de la industria.", en: "Performance metrics exceed major ecosystem events. Recognized by industry leaders.", pt: "Métricas de desempenho excedem os principais eventos do ecossistema. Reconhecido por líderes da indústria." }
      }
    ];

    return (
      <section ref={ref} className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-16 text-center"
          >
            {t(lang, "Credibilidad", "Credibility", "Credibilidade")}
          </motion.h2>

          <div className="mobil3-grid">
            {creds.map((cred, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="glass-card p-8 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-colors"
              >
                <h3 className="text-lg font-bold text-white mb-3">
                  {t(lang, cred.title.es, cred.title.en, cred.title.pt)}
                </h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  {t(lang, cred.desc.es, cred.desc.en, cred.desc.pt)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const CTAForm = () => {
    const { ref, isInView } = useReveal();
    return (
      <section ref={ref} className="relative py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-12 text-center"
          >
            {t(lang, "Agenda un briefing.", "Schedule a briefing.", "Agende um briefing.")}
          </motion.h2>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleFormSubmit}
            className="glass-card p-8 rounded-2xl border border-white/[0.06]"
          >
            {formSubmitted && (
              <div className="mb-6 p-4 bg-[var(--green)]/10 border border-[var(--green)]/30 rounded-lg text-[var(--green)]">
                {lang === "es" ? "Gracias. Nos pondremos en contacto pronto." : lang === "pt" ? "Obrigado. Entraremos em contato em breve." : "Thank you. We'll be in touch soon."}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  {lang === "es" ? "Nombre de la Empresa" : lang === "pt" ? "Nome da Empresa" : "Company Name"}
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleFormChange}
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--orange)]/50 transition-colors"
                  placeholder={lang === "es" ? "Ingresa tu empresa" : lang === "pt" ? "Insira sua empresa" : "Enter your company"}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    {lang === "es" ? "Nombre Completo" : lang === "pt" ? "Nome Completo" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--orange)]/50 transition-colors"
                    placeholder={lang === "es" ? "Tu nombre" : lang === "pt" ? "Seu nome" : "Your name"}
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    {lang === "es" ? "Tu Rol" : lang === "pt" ? "Seu Papel" : "Your Role"}
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--orange)]/50 transition-colors"
                    placeholder={lang === "es" ? "CTO, CEO, etc." : lang === "pt" ? "CTO, CEO, etc." : "CTO, CEO, etc."}
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  {lang === "es" ? "Área de Innovación" : lang === "pt" ? "Área de Inovação" : "Innovation Area"}
                </label>
                <textarea
                  name="area"
                  value={formData.area}
                  onChange={handleFormChange}
                  required
                  rows={4}
                  className="w-full bg-white/[0.03] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--orange)]/50 transition-colors resize-none"
                  placeholder={lang === "es" ? "Cuéntanos sobre tus intereses en blockchain" : lang === "pt" ? "Fale-nos sobre seus interesses em blockchain" : "Tell us about your blockchain interests"}
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  {lang === "es" ? "Correo Electrónico" : lang === "pt" ? "Email" : "Email"}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--orange)]/50 transition-colors"
                  placeholder={lang === "es" ? "tu@email.com" : lang === "pt" ? "seu@email.com" : "your@email.com"}
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3 rounded-lg font-semibold"
              >
                {t(lang, "Agendar Llamada", "Schedule Call", "Agendar Chamada")}
              </button>
            </div>
          </motion.form>
        </div>
      </section>
    );
  };

  const Footer = () => {
    return (
      <footer className="relative py-12 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col gap-4 text-center md:text-left">
              <p className="text-white/60">hello@mobil3.xyz</p>
              <p className="text-white/60">mobil3.xyz</p>
            </div>
            <p className="text-white/40 text-sm">© 2026 Mobil3</p>
          </div>
        </div>
      </footer>
    );
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <div className="noise-overlay absolute inset-0 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 border-b border-white/[0.06]">
        <Link href="/" className="text-xl font-bold text-[var(--orange)]">
          Mobil3
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {(["es", "en", "pt"] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  lang === l
                    ? "bg-[var(--orange)] text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            {lang === "es" ? "Volver" : lang === "pt" ? "Voltar" : "Back"}
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        <Hero />
        <EnterpriseChallenge />
        <InstitutionalAccess />
        <PartnershipModels />
        <Credibility />
        <CTAForm />
        <Footer />
      </main>
    </div>
  );
}
