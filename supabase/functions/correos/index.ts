// Edge Function "correos": el cartero de NucleoOS. La llama un cron una
// vez al día (con la service role key) y decide qué corresponde enviar:
// 1) Recorditos del lazo (los jueves): a cada persona que ACEPTÓ recibirlos,
//    una idea chiquita para cuidar el vínculo, en nombre de la usuaria.
// 2) Aviso del ciclo (cuando empieza una fase): a la pareja registrada,
//    qué fase comienza y cómo acompañar. Solo si hay partner_email.
// Todo queda anotado en correos_enviados (migración 0046): nada se repite.

import { createClient } from "npm:@supabase/supabase-js@2";

const DESDE = "NucleoOS <hola@nucleoos.app>";
const ZONA = "America/Vancouver"; // el día se mide donde vive la usuaria

interface Fase {
  key: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  apoyo: string;
}

const FASES: Record<string, Omit<Fase, "key">> = {
  menstrual: {
    nombre: "Menstrual", emoji: "🌑",
    descripcion: "Estrógeno y progesterona en el piso: la energía baja y el cuerpo pide descanso de verdad. No es flojera, es fisiología.",
    apoyo: "Calor (guatero, té), comida rica en hierro, planes suaves y cero exigencia. Es el momento de bajar el ritmo sin culpa.",
  },
  folicular: {
    nombre: "Folicular", emoji: "🌒",
    descripcion: "El estrógeno sube y con él la energía, el ánimo y la claridad mental. Suele ser la mejor fase para empezar cosas.",
    apoyo: "Acompañar el impulso: buen momento para planes, proyectos y entrenamientos más exigentes.",
  },
  ovulatoria: {
    nombre: "Ovulatoria", emoji: "🌕",
    descripcion: "El punto más alto de energía y sociabilidad del ciclo. El estrógeno llega a su cima.",
    apoyo: "Aprovechar la energía juntos: conversaciones importantes, panoramas, movimiento. Todo fluye más fácil.",
  },
  lutea: {
    nombre: "Lútea", emoji: "🌗",
    descripcion: "La progesterona domina y hacia el final puede venir el SPM: más sensibilidad, menos paciencia, antojo de calma.",
    apoyo: "Paciencia extra, validar sin arreglar, menos planes sociales y más comodidad. Un 'te tengo algo rico' vale oro.",
  },
};

// Ideas de recorditos por tipo de vínculo, rotan según la semana del año.
const IDEAS: Record<string, string[]> = {
  pareja: [
    "una cita sorpresa esta semana, aunque sea caminar juntos con algo rico",
    "contarle algo que admiras de ella o él, así de la nada",
    "cocinar juntos algo nuevo este fin de semana",
    "un mensaje a mitad del día solo para decir que pensaste en su risa",
  ],
  familia: [
    "una llamada de esas largas, con té en mano",
    "mandarle una foto antigua que les traiga un buen recuerdo",
    "preguntarle por eso que te contó la última vez, se acordará de que la escuchas",
    "planear una visita o una comida juntas pronto",
  ],
  hijos: [
    "un rato de juego sin celular, de esos que se acuerdan para siempre",
    "preguntarle qué fue lo mejor de su semana",
    "preparar su comida favorita sin que lo pida",
    "contarle una historia tuya de cuando tenías su edad",
  ],
  amistad: [
    "mandarle el meme o la canción que te acordó a ella",
    "agendar un café o una llamada esta semana, corta pero real",
    "recordarle ese plan pendiente que siempre postergan",
    "decirle sin motivo lo importante que es para ti",
  ],
  colega: [
    "agradecerle algo concreto de trabajar juntos",
    "invitarle un café y hablar de cualquier cosa menos trabajo",
    "compartirle un recurso o idea que le pueda servir",
    "celebrarle un logro reciente, dicho en simple",
  ],
  otro: [
    "un mensaje corto de me acordé de ti, sin más agenda",
    "una llamada breve para saber cómo va de verdad",
    "proponer un plan simple esta semana",
    "agradecerle algo que hizo por ti alguna vez",
  ],
};

function tipoDeVinculo(relation: string | null): string {
  const r = (relation ?? "").toLowerCase();
  if (/pareja|novi|espos|polol/.test(r)) return "pareja";
  if (/mam|pap|herman|abuel|prim|tí|tia|tio|famil/.test(r)) return "familia";
  if (/hij/.test(r)) return "hijos";
  if (/amig|amist/.test(r)) return "amistad";
  if (/colega|trabajo|jef|socia|socio/.test(r)) return "colega";
  return "otro";
}

function hoyEn(zona: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona }).format(new Date()); // YYYY-MM-DD
}

function diaSemanaEn(zona: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: zona, weekday: "long" }).format(new Date());
}

function semanaDelAnio(fecha: string): number {
  const d = new Date(`${fecha}T00:00:00`);
  const inicio = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d.getTime() - inicio.getTime()) / (7 * 86400000));
}

async function enviarCorreo(apiKey: string, para: string, asunto: string, cuerpo: string, responderA?: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: DESDE,
      to: [para],
      subject: asunto,
      text: cuerpo,
      ...(responderA ? { reply_to: responderA } : {}),
    }),
  });
  return res.ok;
}

Deno.serve(async (req: Request) => {
  const headers = { "Content-Type": "application/json" };
  // Solo el cron (con la service role key) puede despachar el correo.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Solo el cartero puede entrar aquí." }), { status: 401, headers });
  }
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "Falta el secreto RESEND_API_KEY en Supabase." }), { status: 500, headers });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const hoy = hoyEn(ZONA);
  const resumen = { lazo: 0, ciclo: 0, errores: [] as string[] };

  const yaEnviado = async (user_id: string, tipo: string, ref: string): Promise<boolean> => {
    const { data } = await admin.from("correos_enviados").select("ref").eq("user_id", user_id).eq("tipo", tipo).eq("ref", ref).maybeSingle();
    return Boolean(data);
  };
  const anotar = async (user_id: string, tipo: string, ref: string) => {
    await admin.from("correos_enviados").insert({ user_id, tipo, ref, dia: hoy });
  };
  const correoDe = async (user_id: string): Promise<string | undefined> => {
    const { data } = await admin.auth.admin.getUserById(user_id);
    return data?.user?.email ?? undefined;
  };
  const nombreDe = async (user_id: string): Promise<string> => {
    const { data } = await admin.from("profiles").select("display_name").eq("user_id", user_id).maybeSingle();
    return (data?.display_name ?? "").trim() || "alguien que te quiere";
  };

  // ---------- 1. Recorditos del lazo (los jueves) ----------
  try {
    if (diaSemanaEn(ZONA) === "Thursday") {
      const { data: lazos } = await admin
        .from("relationships")
        .select("id,user_id,name,relation,email,reminders_status")
        .eq("reminders_status", "acepta")
        .not("email", "is", null);
      for (const r of lazos ?? []) {
        const ref = `${r.id}:${hoy}`;
        if (await yaEnviado(r.user_id, "lazo", ref)) continue;
        const remitente = await nombreDe(r.user_id);
        const responderA = await correoDe(r.user_id);
        const ideas = IDEAS[tipoDeVinculo(r.relation)] ?? IDEAS.otro;
        const idea = ideas[semanaDelAnio(hoy) % ideas.length];
        const cuerpo =
          `Hola ${r.name}, ${remitente} se acordó de ti. 💌\n\n` +
          `Idea de esta semana para su lazo: ${idea}.\n\n` +
          `Este recordito lo envía NucleoOS en nombre de ${remitente}. ` +
          `Tú aceptaste recibirlos; si ya no los quieres, respóndele a este correo y díselo con confianza.`;
        const ok = await enviarCorreo(resendKey, r.email, "Un recordito de su lazo 💌", cuerpo, responderA);
        if (ok) {
          await anotar(r.user_id, "lazo", ref);
          resumen.lazo += 1;
        } else {
          resumen.errores.push(`lazo ${r.name}`);
        }
      }
    }
  } catch (e) {
    resumen.errores.push(`lazo: ${String(e)}`);
  }

  // ---------- 2. Aviso del ciclo a la pareja (cuando empieza una fase) ----------
  try {
    const { data: perfiles } = await admin
      .from("health_profile")
      .select("user_id,cycle_length,period_length,partner_email")
      .not("partner_email", "is", null);
    for (const p of perfiles ?? []) {
      const { data: ciclos } = await admin
        .from("cycles")
        .select("start_date")
        .eq("user_id", p.user_id)
        .order("start_date", { ascending: false })
        .limit(1);
      const ultimo = ciclos?.[0]?.start_date;
      if (!ultimo) continue;
      const largo = Number(p.cycle_length ?? 28);
      const periodo = Number(p.period_length ?? 5);
      const dia = Math.max(1, Math.round((new Date(`${hoy}T00:00:00`).getTime() - new Date(`${ultimo}T00:00:00`).getTime()) / 86400000) + 1);
      if (dia > largo + 7) continue; // ciclo sin registrar hace rato: sin avisos
      const ovulacion = Math.max(periodo + 2, largo - 14);
      // El primer día de cada fase, y solo ese día, se avisa.
      let faseKey: string | null = null;
      if (dia === 1) faseKey = "menstrual";
      else if (dia === periodo + 1) faseKey = "folicular";
      else if (dia === ovulacion - 1) faseKey = "ovulatoria";
      else if (dia === ovulacion + 2) faseKey = "lutea";
      if (!faseKey) continue;
      const ref = `${ultimo}:${faseKey}`;
      if (await yaEnviado(p.user_id, "ciclo", ref)) continue;
      const fase = FASES[faseKey];
      const responderA = await correoDe(p.user_id);
      const proxima = new Date(`${ultimo}T00:00:00`);
      proxima.setDate(proxima.getDate() + largo);
      const proximaTxt = proxima.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
      const cuerpo =
        `Hola, te cuento en qué va su ciclo para que la entiendas mejor estos días.\n\n` +
        `Hoy empieza la fase ${fase.nombre.toLowerCase()} ${fase.emoji} (día ${dia} del ciclo).\n\n` +
        `Qué le pasa: ${fase.descripcion}\n\n` +
        `Cómo apoyarla: ${fase.apoyo}\n\n` +
        `Su próxima regla se estima alrededor del ${proximaTxt}.\n\n` +
        `Enviado desde NucleoOS, su sistema de vida. Ella configuró este aviso; si tienen dudas, respóndele a este correo.`;
      const ok = await enviarCorreo(resendKey, p.partner_email, `Cómo acompañarla esta semana (fase ${fase.nombre.toLowerCase()} ${fase.emoji})`, cuerpo, responderA);
      if (ok) {
        await anotar(p.user_id, "ciclo", ref);
        resumen.ciclo += 1;
      } else {
        resumen.errores.push(`ciclo ${p.user_id.slice(0, 6)}`);
      }
    }
  } catch (e) {
    resumen.errores.push(`ciclo: ${String(e)}`);
  }

  return new Response(JSON.stringify(resumen), { headers });
});
