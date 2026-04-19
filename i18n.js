/* ============================================================
   i18n.js — EN/PT language runtime for Mota Gomes portfolio
   ============================================================
   - Dictionary-keyed strings for nav / menu / section chrome
   - Value-lookup tables for dynamically-rendered project labels,
     categories, services tokens, research titles
   - Language persists in localStorage.mg_lang ('en' or 'pt')
   - Dispatches 'i18n:languagechange' on <document> so page
     renderers can refresh their templates.
   - Project descriptions, challenge, solution, and image captions
     are intentionally NOT translated here — they stay in EN.
   ============================================================ */
(function (global) {
    'use strict';

    var STORAGE_KEY = 'mg_lang';
    var DEFAULT_LANG = 'en';

    // ---------- Dictionary (keyed chrome strings) ----------
    var DICT = {
        en: {
            // Page titles
            'meta.title.portfolio': 'Mota Gomes — Portfolio',
            'meta.title.project':   'Project — Mota Gomes',
            'meta.title.research':  'Research — Pedro Gomes',
            'meta.title.notfound':  'Project Not Found — Mota Gomes',

            // Site banner
            'banner.text': 'Portfolio in refinement. New case studies and refreshed layouts are rolling out over the coming days — a few sections may shift as the edit continues.',
            'banner.textEm': 'Portfolio in refinement.',
            'banner.textRest': ' New case studies and refreshed layouts are rolling out over the coming days — a few sections may shift as the edit continues.',
            'banner.dismiss': 'Dismiss notice',
            'banner.aria': 'Site notice',

            // Menu overlay
            'menu.close': 'Close menu',
            'menu.work': 'Work',
            'menu.research': 'Research',
            'menu.about': 'About',
            'menu.dashboard': 'Dashboard',
            'menu.letstalk': "Let's Talk",
            'menu.cv': 'Curriculum',
            'menu.lang': 'Language',
            'menu.gen': 'Gen Studio',
            'gen.eyebrow': 'Gen Studio',
            'gen.subtitle': 'AI-assisted visual explorations',
            'gen.hint': 'Scroll or drag',
            'menu.motion': 'Motion Design',
            'motion.scrollPrompt': 'Scroll to Expand',
            'motion.h1': 'Motion is where timing becomes voice.',
            'motion.p1': 'A selection of short-form motion work — campaign films, living posters, product reveals, and sound-reactive experiments. Each piece is a study in pacing: when to hold a frame, when to cut, when to let a transition breathe.',
            'motion.p2': 'Below: a sampling. Full reels and raw files available on request.',
            'motion.exploreReel': 'Explore the reel',

            // Hero
            'hero.p1': 'Hybrid Designer',
            'hero.p2': 'focused on elevating brands',
            'hero.p2b': 'experiences',
            'hero.p3': 'that balance aesthetics with purpose and results.',
            'hero.viewWork': 'View Work',
            'hero.scrollDown': 'Scroll Down ↓',

            // Selected Projects
            'work.title': 'Selected Projects',
            'card.viewCase': 'View Case',
            'card.viewProject': 'VIEW',
            'card.projectWord': 'PROJECT',
            'card.comingSoon': 'Coming Soon',

            // Research landing
            'research.landingTitle': 'Research & Experiments',
            'philosophy.l1': 'Design is research made visible —',
            'philosophy.l2': 'every pixel carries intent,',
            'philosophy.l3': 'every interaction tells a story.',

            // About
            'about.p1': "I'm a research-led visual designer building thoughtful, contemporary work for brands and digital products. With over a decade of experience spanning startups, enterprise, and deep tech, I bring a strong conceptual foundation to every project before moving into execution.",
            'about.p2': 'My work sits at the intersection of design systems, brand identity, and product thinking. I care deeply about composition, typography, and detail — the invisible scaffolding that makes design feel intentional rather than decorative.',
            'about.p3': "I've led design across full product lifecycles: from early-stage identity and positioning, through interface design and prototyping, to production-ready systems that scale. Every engagement starts with research and ends with something that ships.",
            'about.role': 'Multidisciplinary Designer — London, UK  ·  Available for immediate start',
            'about.signatureAria': 'Pedro Mota Gomes signature',
            'about.emailAria': 'Email',
            'about.linkedinAria': 'LinkedIn',

            // Footer
            'footer.cta': 'Thanks for',
            'footer.ctaRest': 'taking the time',
            'footer.ctaRest2': 'to look through my work.',
            'footer.sayHi': 'Say Hi',
            'footer.copyright': 'DESIGNED BY MOTAGOMES © 2026',
            'footer.backTop': 'Back to top',

            // Password modal
            'pw.title': 'Password Required',
            'pw.placeholder': 'Enter password',
            'pw.wrong': 'Incorrect password',

            // Project page
            'project.label.client': 'Client',
            'project.label.industry': 'Industry',
            'project.label.year': 'Year',
            'project.label.services': 'Services',
            'project.label.challenge': 'Challenge',
            'project.label.solution': 'Solution',
            'project.cta.back': 'Back',
            'project.cta.mainMenu': 'Main Menu',
            'project.cta.viewMore': 'View More Work',
            'project.nav.back': 'Back to Portfolio',
            'project.notFound.code': '404 — Project not found',
            'project.notFound.title': "This project doesn't exist.",
            'project.doc.watch': 'Watch documentary',
            'project.doc.thanks': 'Thanks for watching.',
            'project.doc.end': 'End',
            'project.doc.playAria': 'Play video',
            'project.doc.pauseAria': 'Pause',
            'project.doc.unmuteAria': 'Unmute',
            'project.doc.muteAria': 'Mute',
            'project.doc.backAria': 'Back to portfolio',
            'project.ph.kicker': 'Conceptual illustration',
            'project.ph.eyebrow': 'For the campaign',
            'project.ph.cta': 'See more of my personal work',
            'project.ph.igAria': 'Instagram',
            'project.sb.findings': 'Findings',
            'project.award.gold': 'Gold',

            // Research page
            'research.eyebrow': 'Research / Experiment',
            'research.label.tech': 'Tech Stack',
            'research.label.year': 'Year',
            'research.label.tools': 'Tools',
            'research.approach': 'Approach & Methodology',
            'research.builtWith': 'Built with:',
            'research.vizSoon': 'Experiment visualization coming soon',
            'research.csTag': 'Coming Soon',
            'research.csSub': 'This experiment is being documented. Check back soon.',
            'research.nfCode': '404',
            'research.nfText': 'Research not found',
            'research.nfBack': 'Back to research',
            'research.allResearch': 'All Research',
            'research.prev': 'Previous',
            'research.next': 'Next'
        },
        pt: {
            // Page titles
            'meta.title.portfolio': 'Mota Gomes — Portefólio',
            'meta.title.project':   'Projeto — Mota Gomes',
            'meta.title.research':  'Investigação — Pedro Gomes',
            'meta.title.notfound':  'Projeto não encontrado — Mota Gomes',

            // Site banner
            'banner.text': 'Portefólio em aperfeiçoamento. Novos casos de estudo e layouts renovados serão publicados nos próximos dias — algumas secções poderão sofrer alterações.',
            'banner.textEm': 'Portefólio em aperfeiçoamento.',
            'banner.textRest': ' Novos casos de estudo e layouts renovados serão publicados nos próximos dias — algumas secções poderão sofrer alterações.',
            'banner.dismiss': 'Ignorar aviso',
            'banner.aria': 'Aviso do site',

            // Menu overlay
            'menu.close': 'Fechar menu',
            'menu.work': 'Trabalho',
            'menu.research': 'Investigação',
            'menu.about': 'Sobre',
            'menu.dashboard': 'Painel',
            'menu.letstalk': 'Vamos Falar',
            'menu.cv': 'Currículo',
            'menu.lang': 'Idioma',
            'menu.gen': 'Gen Studio',
            'gen.eyebrow': 'Gen Studio',
            'gen.subtitle': 'Explorações visuais assistidas por IA',
            'gen.hint': 'Roda ou arrasta',
            'menu.motion': 'Motion Design',
            'motion.scrollPrompt': 'Roda para expandir',
            'motion.h1': 'Motion é onde o ritmo se torna voz.',
            'motion.p1': 'Uma seleção de trabalho em motion — filmes de campanha, posters vivos, lançamentos de produto e experiências reativas a som. Cada peça é um estudo de ritmo: quando segurar um plano, quando cortar, quando deixar uma transição respirar.',
            'motion.p2': 'Em baixo: uma amostra. Reels completos e ficheiros em bruto disponíveis mediante pedido.',
            'motion.exploreReel': 'Ver o reel',

            // Hero
            'hero.p1': 'Designer Híbrido',
            'hero.p2': 'focado em elevar marcas',
            'hero.p2b': 'experiências',
            'hero.p3': 'que equilibram estética, propósito e resultados.',
            'hero.viewWork': 'Ver Trabalho',
            'hero.scrollDown': 'Descer ↓',

            // Selected Projects
            'work.title': 'Projetos Selecionados',
            'card.viewCase': 'Ver Caso',
            'card.viewProject': 'VER',
            'card.projectWord': 'PROJETO',
            'card.comingSoon': 'Em Breve',

            // Research landing
            'research.landingTitle': 'Investigação & Experiências',
            'philosophy.l1': 'Design é investigação tornada visível —',
            'philosophy.l2': 'cada pixel tem intenção,',
            'philosophy.l3': 'cada interação conta uma história.',

            // About
            'about.p1': 'Sou um designer visual orientado por investigação, a criar trabalho cuidado e contemporâneo para marcas e produtos digitais. Com mais de uma década de experiência em startups, grandes empresas e deep tech, trago uma base conceptual forte a cada projeto antes de passar à execução.',
            'about.p2': 'O meu trabalho situa-se no cruzamento entre design systems, identidade de marca e pensamento de produto. Preocupo-me profundamente com composição, tipografia e detalhe — o andaime invisível que faz o design parecer intencional em vez de decorativo.',
            'about.p3': 'Liderei design em ciclos completos de produto: desde identidade e posicionamento iniciais, passando pelo design de interface e prototipagem, até sistemas prontos para produção que escalam. Cada projeto começa com investigação e termina com algo que é lançado.',
            'about.role': 'Designer Multidisciplinar — Londres, Reino Unido  ·  Disponível para início imediato',
            'about.signatureAria': 'Assinatura de Pedro Mota Gomes',
            'about.emailAria': 'E-mail',
            'about.linkedinAria': 'LinkedIn',

            // Footer
            'footer.cta': 'Obrigado por',
            'footer.ctaRest': 'reservar algum tempo',
            'footer.ctaRest2': 'para ver o meu trabalho.',
            'footer.sayHi': 'Diga Olá',
            'footer.copyright': 'DESENHADO POR MOTAGOMES © 2026',
            'footer.backTop': 'Voltar ao topo',

            // Password modal
            'pw.title': 'Palavra-passe necessária',
            'pw.placeholder': 'Introduza a palavra-passe',
            'pw.wrong': 'Palavra-passe incorreta',

            // Project page
            'project.label.client': 'Cliente',
            'project.label.industry': 'Setor',
            'project.label.year': 'Ano',
            'project.label.services': 'Serviços',
            'project.label.challenge': 'Desafio',
            'project.label.solution': 'Solução',
            'project.cta.back': 'Voltar',
            'project.cta.mainMenu': 'Menu Principal',
            'project.cta.viewMore': 'Ver Mais Trabalho',
            'project.nav.back': 'Voltar ao Portefólio',
            'project.notFound.code': '404 — Projeto não encontrado',
            'project.notFound.title': 'Este projeto não existe.',
            'project.doc.watch': 'Ver documentário',
            'project.doc.thanks': 'Obrigado por ver.',
            'project.doc.end': 'Fim',
            'project.doc.playAria': 'Reproduzir vídeo',
            'project.doc.pauseAria': 'Pausar',
            'project.doc.unmuteAria': 'Reativar som',
            'project.doc.muteAria': 'Silenciar',
            'project.doc.backAria': 'Voltar ao portefólio',
            'project.ph.kicker': 'Ilustração conceptual',
            'project.ph.eyebrow': 'Para a campanha',
            'project.ph.cta': 'Ver mais do meu trabalho pessoal',
            'project.ph.igAria': 'Instagram',
            'project.sb.findings': 'Descobertas',
            'project.award.gold': 'Ouro',

            // Research page
            'research.eyebrow': 'Investigação / Experiência',
            'research.label.tech': 'Stack Técnica',
            'research.label.year': 'Ano',
            'research.label.tools': 'Ferramentas',
            'research.approach': 'Abordagem & Metodologia',
            'research.builtWith': 'Construído com:',
            'research.vizSoon': 'Visualização da experiência em breve',
            'research.csTag': 'Em Breve',
            'research.csSub': 'Esta experiência está a ser documentada. Volte em breve.',
            'research.nfCode': '404',
            'research.nfText': 'Investigação não encontrada',
            'research.nfBack': 'Voltar à investigação',
            'research.allResearch': 'Toda a Investigação',
            'research.prev': 'Anterior',
            'research.next': 'Seguinte'
        }
    };

    // ---------- Value-lookup maps (dynamic strings) ----------
    // For values written into template literals by renderers. We look up
    // the English source string; if a PT mapping exists, we swap.

    // Project category (the `category:` field on each PROJECTS entry)
    var CATEGORY_PT = {
        'Rebrand': 'Rebranding',
        'Brand & Ecommerce Design': 'Branding & E-commerce',
        '360° Festive Campaign': 'Campanha Festiva 360°',
        'Scholarship Initiative': 'Iniciativa de Bolsas',
        'UX Design': 'Design de UX',
        'Retail Campaign': 'Campanha de Retalho',
        'Personal Project': 'Projeto Pessoal',
        'Digital Art / NFT': 'Arte Digital / NFT',
        'Brand & Web': 'Marca & Web',
        'Illustration': 'Ilustração',
        'Real Estate Branding': 'Branding Imobiliário',
        'Christmas Campaign': 'Campanha de Natal',
        '360 Campaign': 'Campanha 360',
        'Geo-Targeted Campaign': 'Campanha Geolocalizada',
        'Brand Campaign': 'Campanha de Marca',
        'Digital Presence': 'Presença Digital'
    };

    // Services tokens — applied after splitting on ','
    var SERVICES_PT = {
        'Art Direction': 'Direção de Arte',
        'Graphic Design': 'Design Gráfico',
        'Illustration': 'Ilustração',
        'Copywriting': 'Copywriting',
        'Campaign Development': 'Desenvolvimento de Campanha',
        'Strategy': 'Estratégia',
        'Brand Identity': 'Identidade de Marca',
        'Brand Design': 'Design de Marca',
        'Visual System': 'Sistema Visual',
        'Visual Design': 'Design Visual',
        'Photo Retouching': 'Retoque Fotográfico',
        'Video Editing': 'Edição de Vídeo',
        'Motion Graphics': 'Motion Graphics',
        'Research': 'Investigação',
        'Interaction Design': 'Design de Interação',
        'UX Design': 'Design de UX',
        'UI Design': 'Design de UI',
        'Web Design': 'Design Web',
        'Brand Strategy': 'Estratégia de Marca',
        'Campaign Design': 'Design de Campanha',
        'Identity': 'Identidade',
        'Digital Design': 'Design Digital',
        'Editorial Design': 'Design Editorial',
        'Packaging': 'Packaging',
        'Print Design': 'Design para Impressão',
        'OOH Design': 'Design OOH',
        'Art & Illustration': 'Arte & Ilustração',
        'Animation': 'Animação'
    };

    // Generic UI microcopy — lookup by exact EN textContent via [data-i18n-ui]
    // (for things like card category labels, nav tags, "Coming Soon", etc.)
    var UI_PT = {
        // Card labels
        'The Voice of Experience · 360 Campaign': 'The Voice of Experience · Campanha 360',
        'Christmas Campaign': 'Campanha de Natal',
        'Geo-Targeted Campaign': 'Campanha Geolocalizada',
        'Real Estate Branding': 'Branding Imobiliário',
        'Illustration': 'Ilustração',
        'Rebrand': 'Rebranding',
        'UX Design': 'Design de UX',
        'Retail Campaign': 'Campanha de Retalho',
        'Brand & Web': 'Marca & Web',
        'Scholarship Initiative': 'Iniciativa de Bolsas',
        // Card nav triples
        'Documentary': 'Documentário',
        'Campaign': 'Campanha',
        'Christmas': 'Natal',
        'Beer': 'Cerveja',
        'OOH': 'Exterior',
        'Brand': 'Marca',
        'Real Estate': 'Imobiliário',
        'Identity': 'Identidade',
        'Digital': 'Digital',
        'Strategy': 'Estratégia',
        'Product': 'Produto',
        'Experience': 'Experiência',
        'About': 'Sobre',
        'World Cup': 'Mundial',
        'Retail': 'Retalho',
        'Motion': 'Motion',
        'Studio': 'Estúdio',
        'Work': 'Trabalho',
        'Contact': 'Contacto',
        'Scholarship': 'Bolsa',
        'Branding': 'Branding',
        // Misc
        'Coming Soon': 'Em Breve',
        'Gold': 'Ouro'
    };

    // Metric labels — lookup by exact EN string
    var METRIC_LABEL_PT = {
        'Brand refresh': 'Renovação de marca',
        'Assets delivered': 'Recursos entregues',
        'Assets Delivered': 'Recursos Entregues',
        'Brand tiers': 'Níveis de marca',
        'Touchpoints': 'Pontos de contacto',
        'Touchpoints covered': 'Pontos de contacto cobertos',
        'Conversion uplift': 'Aumento de conversão',
        'Bounce rate reduced': 'Taxa de rejeição reduzida',
        'Bounce rate decrease': 'Diminuição da taxa de rejeição',
        'Pages designed': 'Páginas desenhadas',
        'Brand consistency score': 'Consistência de marca',
        'Seasonal Sales Increase': 'Aumento de Vendas Sazonal',
        'OOH Brand Recall': 'Memorização em Exterior',
        'Markets (PT & ES)': 'Mercados (PT & ES)',
        'International markets reached': 'Mercados internacionais alcançados',
        'Delivery timeline': 'Prazo de entrega',
        'Social engagement': 'Envolvimento em redes sociais',
        'Human rights prestige boost': 'Prestígio em direitos humanos',
        'Retention improvement': 'Melhoria de retenção',
        'Task completion speed': 'Rapidez de conclusão de tarefas',
        'Usability score': 'Pontuação de usabilidade',
        'Core journeys redesigned': 'Jornadas principais redesenhadas',
        'Social Engagement vs. Previous Campaign': 'Envolvimento social vs. campanha anterior',
        'Increase in Repeat Purchases': 'Aumento em compras repetidas',
        'Geo-Billboards Driving Local Reach': 'Outdoors geolocalizados com alcance local',
        'Social impressions': 'Impressões em redes sociais',
        '40" TV purchase surge': 'Aumento na venda de TVs 40"',
        'More customers during FIFA games': 'Mais clientes durante jogos FIFA',
        'Pieces of ultra-concise copy': 'Peças de copy ultra-conciso',
        'Word reduction through editing': 'Redução de palavras por edição',
        'Faster ideation-to-final draft': 'Ideação → versão final mais rápida',
        'Chapters designed': 'Capítulos desenhados',
        'Traffic driven to NFT portfolio': 'Tráfego para portefólio NFT',
        'Platform spotlight feature': 'Destaque na plataforma',
        'Creation timeline': 'Prazo de criação',
        'Creative exploration value': 'Valor de exploração criativa',
        'Inquiry increase': 'Aumento de contactos',
        'Avg. session time': 'Tempo médio de sessão',
        'Portfolio engagement': 'Envolvimento com portefólio',
        'Custom illustrations delivered': 'Ilustrações personalizadas entregues',
        'Production timeline': 'Prazo de produção',
        'Client satisfaction': 'Satisfação do cliente'
    };

    // ---------- Runtime ----------
    function getLang() {
        try {
            var l = localStorage.getItem(STORAGE_KEY);
            if (l === 'pt' || l === 'en') return l;
        } catch (e) {}
        return DEFAULT_LANG;
    }

    function setLang(lang) {
        if (lang !== 'en' && lang !== 'pt') lang = DEFAULT_LANG;
        state.lang = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
        document.documentElement.lang = (lang === 'pt') ? 'pt-PT' : 'en';
        applyI18n(document);
        updateToggleButtons();
        document.dispatchEvent(new CustomEvent('i18n:languagechange', { detail: { lang: lang } }));
    }

    function t(key) {
        var d = DICT[state.lang] || DICT[DEFAULT_LANG];
        if (d[key] != null) return d[key];
        var fallback = DICT[DEFAULT_LANG][key];
        return fallback != null ? fallback : key;
    }

    // Translate an arbitrary value via lookup map; returns original if no mapping
    function tVal(value, map) {
        if (!value) return value;
        if (state.lang !== 'pt') return value;
        if (map[value] != null) return map[value];
        return value;
    }

    function tCategory(v) { return tVal(v, CATEGORY_PT); }
    function tMetric(v)   { return tVal(v, METRIC_LABEL_PT); }

    // Services strings are comma-separated — tokenize + translate tokens + rejoin
    function tServices(csv) {
        if (!csv || state.lang !== 'pt') return csv;
        return String(csv).split(',').map(function (tok) {
            var t = tok.trim();
            var translated = SERVICES_PT[t] || t;
            // Preserve leading whitespace relative to the original for spacing consistency
            return (tok.match(/^\s*/)[0]) + translated;
        }).join(',');
    }

    // Walk the DOM and apply data-i18n / data-i18n-attr / data-i18n-html / data-i18n-ui
    function applyI18n(root) {
        root = root || document;
        // textContent
        root.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
        // innerHTML (use carefully — only when string contains markup)
        root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-html');
            el.innerHTML = t(key);
        });
        // attribute form: "attr1:key1;attr2:key2"
        root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
            var spec = el.getAttribute('data-i18n-attr');
            spec.split(';').forEach(function (pair) {
                var m = pair.split(':');
                if (m.length === 2) {
                    var attr = m[0].trim();
                    var key = m[1].trim();
                    if (attr && key) el.setAttribute(attr, t(key));
                }
            });
        });
        // Value-lookup: keep the original EN text, swap it for PT via UI_PT map
        var uiEls = root.querySelectorAll('[data-i18n-ui]');
        // Auto-apply to known card-microcopy selectors so we don't have to
        // annotate every span individually.
        var AUTO_UI_SELECTORS = [
            '.gallery-stacked-nav span',
            '.gallery-stacked-label',
            '.card-coming-soon'
        ];
        var autoEls = root.querySelectorAll(AUTO_UI_SELECTORS.join(','));
        [uiEls, autoEls].forEach(function (list) {
            list.forEach(function (el) {
                var original = el.getAttribute('data-i18n-ui-original');
                if (!original) {
                    // Skip elements that hold nested markup — only plain text
                    if (el.children.length > 0) return;
                    original = el.textContent;
                    if (!original || !original.trim()) return;
                    el.setAttribute('data-i18n-ui-original', original);
                }
                if (state.lang === 'pt' && UI_PT[original] != null) {
                    el.textContent = UI_PT[original];
                } else {
                    el.textContent = original;
                }
            });
        });
    }

    function updateToggleButtons() {
        document.querySelectorAll('[data-i18n-toggle]').forEach(function (btn) {
            var target = btn.getAttribute('data-i18n-toggle');
            btn.setAttribute('aria-pressed', target === state.lang ? 'true' : 'false');
            btn.classList.toggle('is-active', target === state.lang);
        });
    }

    function wireToggles() {
        document.querySelectorAll('[data-i18n-toggle]').forEach(function (btn) {
            if (btn.dataset.i18nBound === '1') return;
            btn.dataset.i18nBound = '1';
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var target = btn.getAttribute('data-i18n-toggle');
                if (target && target !== state.lang) setLang(target);
            });
        });
    }

    var state = { lang: getLang() };

    // Expose
    global.MGI18n = {
        get lang() { return state.lang; },
        t: t,
        tCategory: tCategory,
        tServices: tServices,
        tMetric: tMetric,
        setLang: setLang,
        apply: applyI18n
    };

    // Initial application
    function init() {
        document.documentElement.lang = (state.lang === 'pt') ? 'pt-PT' : 'en';
        applyI18n(document);
        wireToggles();
        updateToggleButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-wire toggles after dynamic render (some pages add the overlay via JS)
    document.addEventListener('i18n:languagechange', function () {
        // Toggles may have been re-rendered by a page; re-wire + re-highlight
        wireToggles();
        updateToggleButtons();
    });
})(window);
