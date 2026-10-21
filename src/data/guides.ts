export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  /** Nombre del clip .webm en /public/clips (opcional, se muestra en Picture-in-Picture). */
  clip?: string;
}

export interface Guide {
  slug: string;
  title: string;
  category: "Micro" | "Macro" | "Objetos";
  excerpt: string;
  sections: GuideSection[];
  relatedHeroes?: string[];
}

export const guides: Guide[] = [
  {
    slug: "sistema-de-almas-y-deny",
    title: "Sistema de Almas y Deny (Denegación)",
    category: "Micro",
    excerpt: "Cómo funcionan los orbes de almas en cada fase y por qué disparar al orbe enemigo es obligatorio.",
    sections: [
      {
        heading: "Fase 1 (0:00 - 10:00)",
        paragraphs: ["Matar un súbdito otorga el 50% de las almas al instante y un orbe flota con el otro 50%. Disparar al orbe enemigo roba ese 50%."],
        clip: "soul-orb",
      },
      {
        heading: "Fase 2 (10:00+)",
        paragraphs: ["El impacto directo ya no da almas: el 100% reside en el orbe flotante. Disparar al orbe es obligatorio para no perder economía."],
      },
      {
        heading: "Almas no aseguradas (Unsecured Souls)",
        paragraphs: [
          "Los campamentos neutrales y las cajas sueltan almas \"no aseguradas\", marcadas con un icono rojo.",
          "Si mueres con ellas, caen al suelo y el enemigo puede recogerlas. Se aseguran gradualmente con el tiempo: no te arriesgues justo después de farmear la jungla.",
        ],
      },
    ],
  },
  {
    slug: "movimiento-avanzado",
    title: "Movimiento Avanzado: Dash-Jump y Slide",
    category: "Micro",
    excerpt: "Duplica tu distancia de Dash y consigue munición infinita al deslizarte.",
    sections: [
      {
        heading: "Dash-Jump",
        paragraphs: ["Pulsa salto inmediatamente después de usar un Dash (Shift). Conservas el impulso y cubres el doble de distancia por el mismo coste de estamina."],
        clip: "dash-jump",
      },
      {
        heading: "Slide (Deslizamiento)",
        paragraphs: [
          "Agáchate (Ctrl) en una pendiente o justo después de un Dash.",
          "Dato crucial: disparar mientras te deslizas otorga munición infinita temporalmente, ideal para héroes con cargadores pequeños como Lady Geist o Shiv.",
        ],
        clip: "slide",
      },
    ],
  },
  {
    slug: "como-hacer-parry",
    title: "Cómo hacer Parry en Deadlock",
    category: "Micro",
    excerpt: "La tecla F rechaza ataques cuerpo a cuerpo pesados y deja al enemigo aturdido.",
    sections: [
      {
        heading: "Qué es el Parry",
        paragraphs: ["La tecla F rechaza ataques cuerpo a cuerpo pesados. Si el parry es exitoso, el enemigo queda aturdido varios segundos y recibe daño adicional."],
        clip: "parry",
      },
      {
        heading: "Consejos",
        paragraphs: ["El parry tiene una ventana corta: reacciona a la animación de carga del ataque pesado, no al sonido."],
        bullets: [
          "Nunca inicies con ataque pesado contra buenos jugadores: es exactamente lo que esperan.",
          "Usa el ataque ligero para provocar y castiga el pesado del rival con F.",
          "Recuerda que el Rejuvenator se reclama con un ataque pesado: es un buen momento para hacer parry al rival que intenta robarlo.",
        ],
      },
    ],
  },
  {
    slug: "flex-slots",
    title: "Flex Slots: cómo desbloquear los espacios flexibles",
    category: "Macro",
    excerpt: "Cada jugador empieza con 4 espacios por categoría. Los 4 Flex Slots se ganan destruyendo objetivos.",
    sections: [
      {
        heading: "Espacios iniciales",
        paragraphs: ["Cada jugador empieza con 4 espacios por categoría: Arma, Vitalidad y Espíritu."],
      },
      {
        heading: "Desbloqueo de Flex Slots",
        paragraphs: ["En un Flex Slot puedes poner cualquier objeto. Se desbloquean destruyendo objetivos:"],
        bullets: [
          "Primer Caminante (Walker) destruido por el equipo = 1 Slot.",
          "Todos los Caminantes destruidos = 1 Slot.",
          "Primer Guardián de Base destruido = 1 Slot.",
          "Todos los Santuarios (Shrines) destruidos = 1 Slot.",
        ],
      },
    ],
  },
  {
    slug: "urna-de-almas",
    title: "La Urna de Almas (Soul Urn)",
    category: "Macro",
    excerpt: "Aparece en el minuto 10 y da almas y +1 AP permanente a todo el equipo.",
    sections: [
      {
        heading: "Cómo funciona",
        paragraphs: [
          "Aparece en el minuto 10. Recógela y llévala al punto de entrega en el lado opuesto del mapa: da almas a todo el equipo y +1 Punto de Habilidad (AP) permanente a cada jugador.",
          "El portador no puede usar armas ni habilidades y es visible en el mapa: escóltalo con todo el equipo.",
        ],
      },
    ],
  },
  {
    slug: "jefe-central-y-rejuvenator",
    title: "Jefe Central (Mid Boss) y el Rejuvenator",
    category: "Macro",
    excerpt: "El cristal verde que reduce los tiempos de reaparición a la mitad.",
    sections: [
      {
        heading: "El Jefe Central",
        paragraphs: ["Aparece en el minuto 10 con una resistencia al daño masiva al principio."],
      },
      {
        heading: "El Rejuvenator",
        paragraphs: [
          "Al matarlo cae el Rejuvenator, un cristal verde. Debe golpearse con un ataque cuerpo a cuerpo pesado para reclamarlo. Si un enemigo lo golpea, lo roba para su equipo.",
          "Buff: reduce los tiempos de reaparición a la mitad (vital en Late Game) e incrementa drásticamente la vida de los súbditos.",
        ],
        clip: "rejuvenator",
      },
    ],
  },
  {
    slug: "cajas-y-estatuas-doradas",
    title: "Cajas y Estatuas Doradas",
    category: "Macro",
    excerpt: "Pequeñas bonificaciones permanentes que suman una ventaja pasiva enorme.",
    sections: [
      {
        heading: "Por qué importan",
        paragraphs: [
          "Están repartidas por todo el mapa y dentro de los edificios. Romper estatuas doradas otorga bonificaciones permanentes pequeñas (p. ej. +1% Daño de Arma, +10 Salud).",
          "A lo largo de la partida suman una ventaja pasiva enorme. Consulta el mapa interactivo para ver su ubicación aproximada.",
        ],
      },
    ],
  },
  {
    slug: "objetos-counter",
    title: "Itemización adaptativa: objetos para hacer counter",
    category: "Objetos",
    excerpt: "Las builds no son estáticas: compra en función del equipo enemigo.",
    sections: [
      {
        heading: "Contra tanques con curación",
        paragraphs: ["Toxic Bullets reduce la curación recibida por el enemigo en un 65%: counter directo de Abrams, Infernus y Kelvin."],
      },
      {
        heading: "Contra magos",
        paragraphs: ["Silencer impide usar habilidades: obligatorio contra Pocket o Seven. Spirit Armor reduce su daño."],
      },
      {
        heading: "Contra control de masas y debuffs",
        paragraphs: ["Debuff Remover elimina bombas adhesivas, ralentizaciones y sangrados. Unstoppable da inmunidad total al CC durante tu Ultimate."],
      },
      {
        heading: "Contra héroes aéreos",
        paragraphs: ["Knockdown deja caer un yunque que derriba a Vindicta, Grey Talon o Seven cuando se quedan quietos en el aire."],
      },
    ],
  },
  {
    slug: "mejores-objetos-seven",
    title: "Mejores objetos para Seven",
    category: "Objetos",
    excerpt: "Spirit Lifesteal, Boundless Spirit e Improved Reach para una tormenta imparable.",
    relatedHeroes: ["seven"],
    sections: [
      {
        heading: "Core",
        paragraphs: ["La build de Seven gira en torno a sobrevivir dentro de su Storm Cloud el máximo tiempo posible."],
        bullets: [
          "Spirit Lifesteal: te curas masivamente durante la Ultimate.",
          "Boundless Spirit: poder espiritual y salud.",
          "Improved Reach: amplía el radio de la tormenta.",
          "Unstoppable: nadie interrumpe tu canalización.",
        ],
      },
    ],
  },
];

export const guidesBySlug: Record<string, Guide> = Object.assign(Object.create(null), Object.fromEntries(guides.map((g) => [g.slug, g])));
