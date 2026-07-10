// Mini guías de nutrición: claras, humanas y sin moralismos.
// La comida no es un examen, es combustible y también es placer.

export interface GuiaNutricion {
  id: string;
  emoji: string;
  titulo: string;
  resumen: string;
  consejos: string[];
}

export const GUIAS_NUTRICION: GuiaNutricion[] = [
  {
    id: "proteina-facil",
    emoji: "🍗",
    titulo: "Más proteína sin complicarse",
    resumen: "No necesitas batidos raros ni pesar la comida. Necesitas que cada comida tenga una fuente clara.",
    consejos: [
      "Regla simple: en cada comida, pregúntate dónde está la proteína. Si no la ves, agrégala.",
      "Fuentes fáciles: huevos, atún, pollo, yogur griego, cottage, lentejas, garbanzos, tofu.",
      "El desayuno es donde más se pierde: dos huevos o yogur griego ya suman 15 a 20 g.",
      "Snacks que suman: un puñado de maní, queso, jamón de pavo, un huevo duro.",
      "Si cocinas pollo o legumbres, haz el doble y guarda la mitad: proteína lista para mañana.",
    ],
  },
  {
    id: "azucar-gradual",
    emoji: "🍬",
    titulo: "Menos azúcar, sin sufrir",
    resumen: "El azúcar no se corta de un día para otro, se baja el volumen de a poco hasta que el paladar se recalibra.",
    consejos: [
      "Empieza por lo líquido: bebidas y jugos son el azúcar más fácil de soltar porque no te llena.",
      "No prohíbas, posterga: come el dulce después de una comida real, no con el estómago vacío.",
      "Ten fruta a la vista y el dulce guardado. El 80% de comer es lo que está a mano.",
      "Si bajas el azúcar de a poco (media cucharada menos en el café cada semana), en un mes no la extrañas.",
      "Un antojo dura unos 15 minutos. Un vaso de agua y una caminata corta suelen ganarle.",
    ],
  },
  {
    id: "carbos-energia",
    emoji: "🍞",
    titulo: "Carbohidratos y tu energía",
    resumen: "Los carbohidratos no son el enemigo, son el acelerador. La pregunta es cuáles y cuándo.",
    consejos: [
      "Carbohidrato solo (pan blanco, galletas) sube la energía rápido y la deja caer rápido: el bajón de las 4.",
      "Acompañado de proteína o fibra, la curva se suaviza: pan con huevo en vez de pan con mermelada.",
      "Integrales y legumbres entregan la misma energía pero en cámara lenta: ideal para el foco.",
      "Antes de moverte, los carbohidratos son tu amigo. En noches sedentarias, mejor liviano.",
      "Si despiertas sin energía habiendo dormido bien, mira la cena de anoche.",
    ],
  },
  {
    id: "foco-estable",
    emoji: "🧠",
    titulo: "Comer para sostener el foco",
    resumen: "El cerebro quiere glucosa estable, no picos. Especialmente importante con ADHD.",
    consejos: [
      "Desayuno con proteína y grasa (huevos, palta, yogur) sostiene el foco de la mañana mucho más que solo pan.",
      "Comidas gigantes producen siesta: si necesitas foco en la tarde, almuerza moderado y guarda un snack.",
      "La deshidratación leve se siente como niebla mental antes que como sed. El agua es nootrópico gratis.",
      "Café sí, pero con comida y antes de las 2 de la tarde para no robarle horas al sueño.",
      "Omega 3 (pescados grasos, nueces, chía) es de lo poco con evidencia real para el cerebro.",
    ],
  },
  {
    id: "ideas-desayuno",
    emoji: "🍳",
    titulo: "Desayunos que funcionan",
    resumen: "Tres plantillas para no pensar: proteína + fibra + algo rico.",
    consejos: [
      "Rápido: yogur griego con fruta y granola, listo en un minuto, 20 g de proteína.",
      "Clásico: dos huevos revueltos con tostada integral y palta.",
      "Para llevar: avena remojada la noche anterior con leche, chía y plátano.",
      "Salado y contundente: tostada con cottage o queso ricotta, tomate y aceite de oliva.",
      "Si no te entra comida temprano, no te fuerces: un vaso de agua y adelanta el desayuno a media mañana.",
    ],
  },
  {
    id: "ideas-snack-cena",
    emoji: "🌙",
    titulo: "Snacks y cenas amables",
    resumen: "El snack decide el día y la cena decide la noche.",
    consejos: [
      "Snacks que sostienen: fruta con maní, huevo duro, yogur, zanahoria con hummus, un puñado de nueces.",
      "Cena liviana no significa cena triste: sopa con legumbres, tortilla de verduras, pescado con ensalada.",
      "Cenar muy tarde o muy pesado le cobra la cuenta a tu sueño. Idealmente 2 a 3 horas antes de acostarte.",
      "Si llegas con hambre feroz a la cena, el problema fue la tarde: agrega un snack a las 5.",
      "Un carbohidrato suave en la cena (papa, arroz, quinoa) ayuda a algunas personas a dormir mejor.",
    ],
  },
];
