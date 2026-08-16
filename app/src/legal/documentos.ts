// Los términos y la política de privacidad de NucleoOS.
//
// Escritos para que se entiendan, no para protegerse escondiendo cosas. Si un
// documento sobre los datos de alguien necesita un abogado para leerse, no
// está cumpliendo su función.
//
// Reglas que se siguieron al escribirlos:
//   - Se dice quién puede ver qué, incluida la parte incómoda: quien opera el
//     servicio tiene acceso técnico a los datos alojados.
//   - Se nombran los terceros de verdad, uno por uno, y para qué se usa cada
//     uno. Un "podemos compartir con proveedores" no le sirve a nadie.
//   - Se dice que esto NO es asesoría financiera ni tributaria, porque la app
//     suma gastos por líneas de impuestos y eso puede leerse como consejo.
//
// La versión se guarda cuando la persona acepta. Si cambia el contenido, sube
// la versión y se vuelve a pedir la aceptación.

export const VERSION_LEGAL = "2026-08-15";

export interface Seccion {
  titulo: string;
  parrafos: string[];
}

export interface Documento {
  titulo: string;
  intro: string;
  secciones: Seccion[];
}

// ---------- Español ----------

const TERMINOS_ES: Documento = {
  titulo: "Términos de servicio",
  intro:
    "Estos términos explican qué es NucleoOS, qué puedes esperar de él y qué se espera de ti. Están escritos en lenguaje corriente a propósito. Última actualización: 15 de agosto de 2026.",
  secciones: [
    {
      titulo: "Qué es NucleoOS",
      parrafos: [
        "NucleoOS es una aplicación para organizar tu vida: tus gastos, tus hábitos, tu energía, tus metas y tu tiempo. Incluye un módulo de finanzas que registra movimientos, guarda comprobantes y arma resúmenes.",
        "El servicio lo opera Empirogy, con domicilio en Columbia Británica, Canadá. Para cualquier cosa relacionada con estos términos o con tus datos, escribe a hola@nucleoos.app.",
      ],
    },
    {
      titulo: "Esto no es asesoría financiera ni tributaria",
      parrafos: [
        "NucleoOS suma, ordena y muestra tus propios datos. Nada de lo que ves aquí es una recomendación profesional.",
        "El módulo de impuestos agrupa tus gastos según las líneas de formulario que TÚ asignas a cada categoría. La app no decide a qué línea corresponde un gasto, no verifica si algo es deducible y no reemplaza a un contador. Revisa siempre los resultados antes de usarlos en una declaración, y consulta a un profesional cuando la decisión importe.",
        "Tampoco somos un asesor de inversiones. No recomendamos productos financieros ni damos consejos sobre qué hacer con tu dinero.",
      ],
    },
    {
      titulo: "Tu cuenta",
      parrafos: [
        "Necesitas una cuenta para usar NucleoOS. Eres responsable de tu contraseña y de lo que ocurra en tu cuenta. Si crees que alguien más entró, cámbiala y avísanos.",
        "Debes tener al menos 16 años para crear una cuenta.",
        "Puedes cerrar tu cuenta cuando quieras. Al hacerlo se borran tus datos, incluidos tus comprobantes, según se explica en la política de privacidad.",
      ],
    },
    {
      titulo: "Tus datos son tuyos",
      parrafos: [
        "Lo que escribes y subes a NucleoOS te pertenece. No lo vendemos, no lo cedemos a terceros para publicidad y no lo usamos para entrenar modelos de inteligencia artificial.",
        "Puedes descargar todo lo tuyo en cualquier momento desde Ajustes.",
      ],
    },
    {
      titulo: "Planes y pagos",
      parrafos: [
        "NucleoOS tiene un plan gratuito y planes de pago. Las funciones de cada plan y sus precios se muestran antes de contratar.",
        "Las suscripciones se cobran por adelantado y se renuevan solas hasta que las canceles. Puedes cancelar cuando quieras y seguirás usando el plan hasta que termine el período ya pagado.",
        "Si subimos los precios, te avisaremos con al menos 30 días de anticipación y podrás cancelar antes de que aplique.",
      ],
    },
    {
      titulo: "Lo que no puedes hacer",
      parrafos: [
        "Usar NucleoOS para actividades ilegales, subir contenido que no te pertenece, intentar acceder a datos de otras personas, o sobrecargar el servicio a propósito.",
        "Si algo de eso ocurre, podemos suspender la cuenta. Cuando sea razonable, avisaremos antes.",
      ],
    },
    {
      titulo: "Disponibilidad y límites de responsabilidad",
      parrafos: [
        "Hacemos lo posible por mantener NucleoOS funcionando, pero no garantizamos que esté disponible sin interrupciones ni que esté libre de errores. Es una aplicación en desarrollo activo.",
        "No respondemos por decisiones que tomes basándote en lo que muestra la app, ni por pérdidas derivadas de datos incorrectos, de una interrupción del servicio o de un error de un proveedor externo. Guarda copias de lo que sea importante para ti.",
        "Nada de lo anterior limita responsabilidades que la ley no permita limitar.",
      ],
    },
    {
      titulo: "Cambios a estos términos",
      parrafos: [
        "Si cambiamos algo importante, te lo mostraremos dentro de la app y te pediremos aceptarlo de nuevo. Los cambios menores se publican aquí con su fecha.",
      ],
    },
    {
      titulo: "Ley aplicable",
      parrafos: [
        "Estos términos se rigen por las leyes de Columbia Británica y de Canadá. Si vives en otro país, conservas los derechos que te dé la ley de tu lugar de residencia.",
      ],
    },
  ],
};

const PRIVACIDAD_ES: Documento = {
  titulo: "Política de privacidad",
  intro:
    "Esto explica qué datos guarda NucleoOS, dónde viven, quién puede verlos y cómo sacarlos o borrarlos. Sin rodeos, porque aquí hay información sensible: tus gastos y tus comprobantes bancarios. Última actualización: 15 de agosto de 2026.",
  secciones: [
    {
      titulo: "Qué guardamos",
      parrafos: [
        "De tu cuenta: tu correo electrónico y la fecha en que aceptaste estos documentos. La contraseña no la guardamos nosotros, la maneja cifrada nuestro proveedor de autenticación.",
        "Lo que registras: gastos, ingresos, categorías, etiquetas, cuentas, tarjetas, deudas, metas, hábitos, notas, prácticas y todo lo demás que escribes en la app.",
        "Lo que subes: fotos de boletas, cartolas bancarias y cualquier archivo que adjuntes. Estos son los datos más sensibles del servicio y se tratan como tales.",
        "Si conectas tu banco: los movimientos y saldos que entrega tu banco a través de Plaid. NucleoOS nunca ve ni guarda las credenciales de tu banco: esas se escriben dentro de la ventana de Plaid y no pasan por nosotros.",
        "Datos técnicos mínimos para que el servicio funcione y para detectar abusos: registros de errores y de uso de las funciones con inteligencia artificial.",
      ],
    },
    {
      titulo: "Dónde viven tus datos",
      parrafos: [
        "En Supabase, que aloja la base de datos y los archivos en servidores en Estados Unidos. La aplicación se sirve desde Vercel.",
        "Si vives fuera de Estados Unidos, esto significa que tus datos se transfieren y se procesan allí. Al usar NucleoOS aceptas esa transferencia.",
        "Los archivos que subes están en un almacenamiento privado: no son accesibles con un enlace público y cada usuario solo puede llegar a los suyos.",
      ],
    },
    {
      titulo: "Quién puede ver tus datos",
      parrafos: [
        "Tú, siempre. Otros usuarios, nunca: la base de datos aplica reglas por fila que hacen imposible que una persona vea lo de otra, aunque lo intente.",
        "Y aquí va la parte que casi nadie escribe: quien opera NucleoOS tiene acceso técnico a la base de datos y al almacenamiento, porque es quien administra la infraestructura. Ese acceso existe para mantener el servicio, para respaldarlo y para resolver un problema puntual que tú reportes. No se usa para mirar tus datos por curiosidad, no se comparte con nadie y no se usa con fines comerciales.",
        "Si alguna vez necesitamos entrar a tu cuenta para resolver algo que reportaste, te lo pediremos antes.",
      ],
    },
    {
      titulo: "Los terceros que usamos, y para qué",
      parrafos: [
        "Supabase: base de datos, cuentas y almacenamiento de tus archivos.",
        "Vercel: entrega de la aplicación en tu navegador.",
        "Plaid: conexión con tu banco, solo si tú la activas. Plaid tiene su propia política de privacidad y su propia relación contigo.",
        "Google (Gemini): lee las fotos de tus boletas, tus cartolas en PDF y tus platos de comida para extraer los datos. Lo que se envía es la imagen o el archivo y nada más. Google no usa ese contenido para entrenar sus modelos bajo el tipo de acceso que usamos.",
        "Telegram: solo si conectas el coach conversacional. Los mensajes que le escribas pasan por Telegram.",
        "Resend: envío de correos del servicio, como confirmaciones y avisos.",
        "Ninguno de estos recibe tus datos para venderlos ni para hacer publicidad.",
      ],
    },
    {
      titulo: "Por cuánto tiempo",
      parrafos: [
        "Mientras tengas la cuenta abierta. Cuando la cierras, borramos tus datos y tus archivos dentro de 30 días.",
        "Los respaldos automáticos de la base de datos pueden conservar copias por hasta 30 días adicionales antes de rotarse. Después de eso no queda nada.",
      ],
    },
    {
      titulo: "Tus derechos",
      parrafos: [
        "Acceso: ver y descargar todo lo tuyo, en cualquier momento y sin pedir permiso, desde Ajustes.",
        "Rectificación: corregir lo que esté mal. Puedes editar cualquier registro desde la propia app.",
        "Supresión: borrar un dato suelto, o tu cuenta entera con todo adentro, desde Ajustes.",
        "Portabilidad: llevarte tus datos en un archivo estándar que puedas abrir o cargar en otra parte. Es el mismo botón de descarga.",
        "Oposición: pedirnos que dejemos de tratar tus datos para algo puntual. Escríbenos y lo hacemos.",
        "Preguntar qué tenemos sobre ti y por qué. Escríbenos a hola@nucleoos.app y respondemos dentro de 30 días.",
        "Si vives en Canadá y no quedas conforme con nuestra respuesta, puedes reclamar ante la Oficina del Comisionado de Privacidad de Canadá. Si vives en Chile, puedes reclamar ante la Agencia de Protección de Datos Personales, creada por la Ley 21.719. Si vives en la Unión Europea, conservas los derechos que te dé tu propia ley.",
      ],
    },
    {
      titulo: "Quién responde por tus datos",
      parrafos: [
        "Empirogy es la responsable del tratamiento de tus datos personales, y decide para qué y cómo se usan.",
        "Para ejercer cualquiera de tus derechos, para hacer una consulta o para presentar un reclamo, escribe a hola@nucleoos.app. Toda solicitud se responde dentro de 30 días.",
      ],
    },
    {
      titulo: "Cómo protegemos esto",
      parrafos: [
        "Todo viaja cifrado. Las llaves de los servicios externos viven en el servidor y nunca en tu navegador. Las reglas por fila de la base de datos son la última línea: aunque alguien obtuviera la llave pública de la aplicación, no podría leer los datos de nadie.",
        "Ninguna medida es perfecta. Si alguna vez ocurre una filtración que afecte tus datos, te avisaremos a ti y a la autoridad que corresponda dentro de las 72 horas siguientes a que la detectemos, y te diremos qué pasó, qué datos se vieron afectados y qué estamos haciendo.",
        "El aviso se manda aunque no estemos seguros del alcance todavía. Esperar a tener el cuadro completo antes de avisar es esperar demasiado.",
      ],
    },
    {
      titulo: "Menores de edad",
      parrafos: [
        "NucleoOS no está dirigido a menores de 16 años y no recogemos datos de ellos a sabiendas.",
      ],
    },
    {
      titulo: "Cambios",
      parrafos: [
        "Si cambiamos algo importante, te lo mostraremos dentro de la app antes de que siga aplicando.",
      ],
    },
  ],
};

// ---------- English ----------

const TERMINOS_EN: Documento = {
  titulo: "Terms of service",
  intro:
    "These terms explain what NucleoOS is, what you can expect from it, and what is expected from you. They are written in plain language on purpose. Last updated: 15 August 2026.",
  secciones: [
    {
      titulo: "What NucleoOS is",
      parrafos: [
        "NucleoOS is an app for organising your life: your spending, habits, energy, goals and time. It includes a finance module that records transactions, stores receipts and builds summaries.",
        "The service is operated by Empirogy, based in British Columbia, Canada. For anything about these terms or your data, write to hola@nucleoos.app.",
      ],
    },
    {
      titulo: "This is not financial or tax advice",
      parrafos: [
        "NucleoOS adds up, organises and displays your own data. Nothing you see here is professional advice.",
        "The tax module groups your expenses by the form lines that YOU assign to each category. The app does not decide which line an expense belongs to, does not verify whether something is deductible, and does not replace an accountant. Always review the results before using them in a tax return, and consult a professional when the decision matters.",
        "We are not investment advisors either. We do not recommend financial products or advise on what to do with your money.",
      ],
    },
    {
      titulo: "Your account",
      parrafos: [
        "You need an account to use NucleoOS. You are responsible for your password and for what happens in your account. If you think someone else got in, change it and let us know.",
        "You must be at least 16 to create an account.",
        "You can close your account whenever you want. When you do, your data is deleted, including your receipts, as explained in the privacy policy.",
      ],
    },
    {
      titulo: "Your data is yours",
      parrafos: [
        "What you write and upload to NucleoOS belongs to you. We do not sell it, we do not hand it to third parties for advertising, and we do not use it to train artificial intelligence models.",
        "You can download everything of yours at any time from Settings.",
      ],
    },
    {
      titulo: "Plans and payments",
      parrafos: [
        "NucleoOS has a free plan and paid plans. What each plan includes and its price are shown before you subscribe.",
        "Subscriptions are billed in advance and renew automatically until you cancel. You can cancel at any time and keep using the plan until the period you already paid for ends.",
        "If we raise prices, we will tell you at least 30 days in advance and you can cancel before it applies.",
      ],
    },
    {
      titulo: "What you cannot do",
      parrafos: [
        "Use NucleoOS for illegal activity, upload content that is not yours, try to reach other people's data, or deliberately overload the service.",
        "If any of that happens we may suspend the account. Where reasonable, we will warn you first.",
      ],
    },
    {
      titulo: "Availability and limits of liability",
      parrafos: [
        "We do our best to keep NucleoOS running, but we do not guarantee uninterrupted or error free availability. This is an app under active development.",
        "We are not liable for decisions you make based on what the app shows, or for losses caused by incorrect data, a service interruption, or a third party provider's failure. Keep copies of anything that matters to you.",
        "None of the above limits liabilities that the law does not allow to be limited.",
      ],
    },
    {
      titulo: "Changes to these terms",
      parrafos: [
        "If we change something important, we will show it inside the app and ask you to accept it again. Minor changes are published here with their date.",
      ],
    },
    {
      titulo: "Governing law",
      parrafos: [
        "These terms are governed by the laws of British Columbia and Canada. If you live elsewhere, you keep the rights your local law gives you.",
      ],
    },
  ],
};

const PRIVACIDAD_EN: Documento = {
  titulo: "Privacy policy",
  intro:
    "This explains what data NucleoOS stores, where it lives, who can see it, and how to take it out or delete it. Plainly, because there is sensitive information here: your spending and your bank documents. Last updated: 15 August 2026.",
  secciones: [
    {
      titulo: "What we store",
      parrafos: [
        "About your account: your email address and the date you accepted these documents. We do not store your password ourselves; our authentication provider handles it encrypted.",
        "What you record: expenses, income, categories, tags, accounts, cards, debts, goals, habits, notes, practices and everything else you write in the app.",
        "What you upload: photos of receipts, bank statements and any file you attach. These are the most sensitive data in the service and are treated as such.",
        "If you connect your bank: the transactions and balances your bank provides through Plaid. NucleoOS never sees or stores your bank credentials: those are typed inside Plaid's own window and never pass through us.",
        "Minimal technical data so the service works and to detect abuse: error logs and usage counters for the AI features.",
      ],
    },
    {
      titulo: "Where your data lives",
      parrafos: [
        "On Supabase, which hosts the database and files on servers in the United States. The application is served from Vercel.",
        "If you live outside the United States, this means your data is transferred and processed there. By using NucleoOS you accept that transfer.",
        "Files you upload sit in private storage: they are not reachable through a public link and each user can only reach their own.",
      ],
    },
    {
      titulo: "Who can see your data",
      parrafos: [
        "You, always. Other users, never: the database applies row level rules that make it impossible for one person to see another's data, even if they try.",
        "And here is the part almost nobody writes down: whoever operates NucleoOS has technical access to the database and the storage, because they administer the infrastructure. That access exists to keep the service running, to back it up, and to solve a specific problem you report. It is not used to look at your data out of curiosity, it is not shared with anyone, and it is not used for commercial purposes.",
        "If we ever need to enter your account to solve something you reported, we will ask you first.",
      ],
    },
    {
      titulo: "The third parties we use, and what for",
      parrafos: [
        "Supabase: database, accounts and storage of your files.",
        "Vercel: delivery of the application to your browser.",
        "Plaid: connection to your bank, only if you turn it on. Plaid has its own privacy policy and its own relationship with you.",
        "Google (Gemini): reads your receipt photos, your PDF statements and your meal photos to extract the data. What is sent is the image or the file and nothing else. Google does not use that content to train its models under the access tier we use.",
        "Telegram: only if you connect the conversational coach. Messages you write to it pass through Telegram.",
        "Resend: sending service emails, such as confirmations and notices.",
        "None of them receive your data to sell it or to advertise.",
      ],
    },
    {
      titulo: "For how long",
      parrafos: [
        "While your account is open. When you close it, we delete your data and your files within 30 days.",
        "Automatic database backups may keep copies for up to 30 additional days before they rotate out. After that nothing remains.",
      ],
    },
    {
      titulo: "Your rights",
      parrafos: [
        "Access: see and download everything of yours, at any time and without asking, from Settings.",
        "Rectification: correct what is wrong. You can edit any record from within the app.",
        "Erasure: delete a single record, or your whole account with everything in it, from Settings.",
        "Portability: take your data in a standard file you can open or load elsewhere. It is the same download button.",
        "Objection: ask us to stop processing your data for something specific. Write to us and we will.",
        "Ask what we hold about you and why. Write to hola@nucleoos.app and we answer within 30 days.",
        "If you live in Canada and are not satisfied with our answer, you can complain to the Office of the Privacy Commissioner of Canada. If you live in Chile, you can complain to the Personal Data Protection Agency created by Law 21.719. If you live in the European Union, you keep the rights your own law gives you.",
      ],
    },
    {
      titulo: "Who is accountable for your data",
      parrafos: [
        "Empirogy is the controller of your personal data and decides what it is used for and how.",
        "To exercise any of your rights, to ask a question or to file a complaint, write to hola@nucleoos.app. Every request is answered within 30 days.",
      ],
    },
    {
      titulo: "How we protect this",
      parrafos: [
        "Everything travels encrypted. External service keys live on the server and never in your browser. The database's row level rules are the last line: even if someone obtained the app's public key, they could not read anyone's data.",
        "No measure is perfect. If a breach ever affects your data, we will notify you and the relevant authority within 72 hours of detecting it, and tell you what happened, which data was affected and what we are doing about it.",
        "The notice goes out even if we are not sure of the full scope yet. Waiting for the complete picture before telling you is waiting too long.",
      ],
    },
    {
      titulo: "Minors",
      parrafos: [
        "NucleoOS is not aimed at people under 16 and we do not knowingly collect their data.",
      ],
    },
    {
      titulo: "Changes",
      parrafos: [
        "If we change something important, we will show it inside the app before it keeps applying.",
      ],
    },
  ],
};

// ---------- Los documentos por idioma ----------
//
// El portugués todavía no está traducido. En vez de mostrar el español como si
// fuera portugués, se muestra el inglés con un aviso: en un documento legal,
// hacer pasar un idioma por otro sería peor que decir la verdad.

export const DOCUMENTOS: Record<string, { terminos: Documento; privacidad: Documento }> = {
  es: { terminos: TERMINOS_ES, privacidad: PRIVACIDAD_ES },
  en: { terminos: TERMINOS_EN, privacidad: PRIVACIDAD_EN },
  pt: { terminos: TERMINOS_EN, privacidad: PRIVACIDAD_EN },
};

export const IDIOMAS_TRADUCIDOS = ["es", "en"];
