/* VEREDA — app language layer.
   Language comes from (in order): ?lang=xx in the URL, the member's purchase (saved by app.js after login),
   a manual choice in Settings, or the device language. English is the source; Spanish is applied by
   translating text nodes and attributes as the app renders (dictionary + patterns). */
(function () {
  "use strict";
  var KEY = "vereda_app_v1";
  var st = {}; try { st = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  var q = (location.search.match(/[?&]lang=(en|es)\b/) || [])[1];
  if (q) { st.lang = q; st.langSet = true; try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  var dev = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
  var LANG = st.lang || (/^es\b/i.test(dev) ? "es" : "en");
  window.VLANG = LANG;
  window.VLOCALE = LANG === "es" ? "es-ES" : "en-US";
  document.documentElement.lang = LANG;
  if (LANG !== "es") { window.T = function (s) { return s; }; return; }

  /* ---------- exact strings ---------- */
  var D = {
    "Your daily path closer to God": "Tu camino diario más cerca de Dios",
    "Your lamp is waiting": "Tu lámpara te espera",
    "Renew to continue your journey — your progress is saved.": "Renueva para continuar tu camino: tu progreso está guardado.",
    "Renew my access": "Renovar mi acceso", "Contact support": "Contactar a soporte", "Sign out": "Cerrar sesión",
    "Add VEREDA to your home screen": "Agrega VEREDA a tu pantalla de inicio",
    "Open the app with one tap, full screen — just like an app from the store.": "Abre la app con un toque y a pantalla completa, como una app de la tienda.",
    "On iPhone, open this page in": "En iPhone, abre esta página en", "first.": "primero.",
    "Got it": "Entendido", "Got it!": "¡Entendido!", "Skip": "Omitir",
    "Where do I find my purchase code?": "¿Dónde encuentro mi código de compra?",
    "Forgot your password?": "¿Olvidaste tu contraseña?",
    "First time here? Create your access": "¿Primera vez aquí? Crea tu acceso",
    "I already have a password": "Ya tengo contraseña",
    "By continuing you agree to our": "Al continuar, aceptas nuestros", "Terms": "Términos", "and": "y", "Privacy Policy": "Política de privacidad",
    "Your purchase code": "Tu código de compra",
    "After buying, Hotmart sent you an email with your purchase details. Look for the": "Después de comprar, Hotmart te envió un correo con los datos de tu compra. Busca el",
    "transaction code": "código de transacción", "— it starts with": "; empieza con", "(for example HP1234567890).": "(por ejemplo HP1234567890).",
    "You can also find it at": "También lo encuentras en", "→ My purchases.": "→ Mis compras.",
    "Find daily peace and grow closer to God": "Encuentra paz cada día y acércate a Dios",
    "4.8 rating": "Calificación 4.8", "Join 950K believers": "Únete a 950K creyentes",
    "Start my journey": "Comenzar mi camino", "I already have an account": "Ya tengo una cuenta",
    "Devotional": "Devocional", "Unlocks tomorrow": "Se desbloquea mañana", "New lesson coming soon": "Nueva lección muy pronto",
    "Read": "Leer", "Listen": "Escuchar", "Chapter": "Capítulo", "UP NEXT": "LO QUE SIGUE",
    "The next modules unlock after you finish the current one": "Los próximos módulos se desbloquean cuando termines el actual",
    "The content for this day hasn’t been written yet.": "El contenido de este día todavía no está listo.",
    "Come back tomorrow": "Vuelve mañana",
    "New activities unlock tomorrow if you complete today’s devotional.": "Mañana se desbloquean nuevas actividades si completas el devocional de hoy.",
    "Locked": "Bloqueado", "Your progress": "Tu progreso", "days completed": "días completados",
    "Daily reminder": "Recordatorio diario",
    "Allow notifications so VEREDA can remind you when your next day unlocks.": "Permite las notificaciones para que VEREDA te avise cuando se desbloquee tu próximo día.",
    "Allow": "Permitir", "Not now": "Ahora no", "sec remaining": "s restantes", "Copy": "Copiar",
    "Share the wisdom": "Comparte la sabiduría", "Remind me later": "Recordarme más tarde",
    "You made space for God": "Hiciste espacio para Dios", "Let’s make it stick": "Hagamos que quede", "Good job!": "¡Buen trabajo!",
    "This is taking root in you": "Esto está echando raíces en ti", "Question": "Pregunta", "Continue": "Continuar",
    "Choose a narrator": "Elige un narrador", "Next": "Siguiente", "Want to come back later?": "¿Quieres volver más tarde?",
    "Pick a time that works for you — we’ll remind you to come back and complete this step when you’re ready.": "Elige un horario que te funcione: te recordaremos volver y completar este paso cuando estés listo.",
    "Delight yourself also in Yahweh, and he will give you the desires of your heart.": "Deléitate asimismo en Jehová, y él te dará las peticiones de tu corazón.",
    "Psalm 37:4": "Salmo 37:4", "Set reminder": "Programar recordatorio", "You did great today!": "¡Lo hiciste muy bien hoy!",
    "Before you finish, pause and reflect": "Antes de terminar, detente y reflexiona", "in a row": "seguidos",
    "Write my reflection": "Escribir mi reflexión", "Finish for today": "Terminar por hoy",
    "How would you rate this devotional?": "¿Cómo calificarías este devocional?", "Send feedback": "Enviar opinión",
    "New activities unlock tomorrow if you complete your devotional for the day.": "Mañana se desbloquean nuevas actividades si completas tu devocional del día.",
    "Read or Listen": "Leer o escuchar", "Today’s goal": "Meta de hoy", "Best streak": "Mejor racha",
    "Total days with God": "Total de días con Dios", "Total light": "Luz total", "Milestones": "Logros",
    "How to earn light": "Cómo ganar luz", "Weekly leagues — coming soon": "Ligas semanales: muy pronto",
    "Climb from Seed to Lighthouse with believers around the world.": "Sube de Semilla a Faro junto a creyentes de todo el mundo.",
    "days in a row": "días seguidos", "Share": "Compartir", "Edit profile ✎": "Editar perfil ✎", "Admin panel": "Panel de administración",
    "Test tools for the app": "Herramientas de prueba de la app", "My journal": "Mi diario", "Settings": "Configuración",
    "Manage subscription": "Administrar suscripción", "FAQ": "Preguntas frecuentes", "Support": "Soporte", "Edit profile": "Editar perfil",
    "Save": "Guardar", "Email": "Correo", "Bible text size": "Tamaño del texto bíblico", "Narrator speed": "Velocidad del narrador",
    "Replay the app tour": "Ver de nuevo el recorrido", "Delete my data": "Borrar mis datos", "Delete all data?": "¿Borrar todos los datos?",
    "This removes your progress, journal and highlights from this device.": "Esto elimina tu progreso, tu diario y tus resaltados de este dispositivo.",
    "Delete": "Eliminar", "Cancel": "Cancelar", "Progress:": "Progreso:", "unlock-all mode": "modo desbloquear todo",
    "Complete the current day": "Completar el día actual", "Marks today’s devotional as done": "Marca el devocional de hoy como hecho",
    "Simulate a new day": "Simular un nuevo día", "Moves your progress one day back so the next day unlocks": "Retrocede tu progreso un día para que se desbloquee el siguiente",
    "Show onboarding & tips again": "Mostrar de nuevo la introducción y los consejos", "Replay the opening animation": "Ver de nuevo la animación inicial",
    "Reset Journey progress": "Reiniciar el progreso del camino", "Clear prayer requests": "Borrar pedidos de oración", "Clear journal": "Borrar diario",
    "Devotional ratings (this device)": "Calificaciones de devocionales (este dispositivo)", "No ratings yet.": "Todavía no hay calificaciones.",
    "Demo admin access. Data lives on this device until the backend is connected.": "Acceso de administrador de demostración. Los datos quedan en este dispositivo.",
    "No highlights yet": "Todavía no hay resaltados", "Tap any verse in the Bible to highlight it. It will appear here.": "Toca cualquier versículo en la Biblia para resaltarlo. Aparecerá aquí.",
    "Completed ✓": "Completado ✓", "Audio podcasts": "Podcasts de audio", "See all": "Ver todo", "Episodes": "Episodios", "× speed": "× velocidad",
    "Spiritual Assistant": "Asistente espiritual", "Spiritual assistant": "Asistente espiritual",
    "Not a substitute for pastoral or professional care.": "No reemplaza la atención pastoral ni profesional.",
    "Try again": "Intentar de nuevo", "Start a new chat?": "¿Empezar un chat nuevo?",
    "Restarting will clear all previous messages in this conversation.": "Al reiniciar se borrarán todos los mensajes anteriores de esta conversación.",
    "Not yet": "Todavía no", "Restart chat": "Reiniciar chat", "Explore": "Explorar", "Verses of the day": "Versículos del día",
    "Get guidance, daily inspiration and go deeper into God’s Word — anytime you need it.": "Recibe guía, inspiración diaria y profundiza en la Palabra de Dios cuando lo necesites.",
    "Coming soon": "Muy pronto", "Articles": "Artículos", "Soon": "Pronto",
    "Quick reads on faith, prayer and everyday life": "Lecturas breves sobre la fe, la oración y la vida diaria",
    "Bible stories": "Historias bíblicas", "The great stories of Scripture, told simply": "Las grandes historias de las Escrituras, contadas con sencillez",
    "Copy verse": "Copiar versículo", "Your reflections will appear here": "Tus reflexiones aparecerán aquí",
    "Write a few lines each day and see how far God has brought you.": "Escribe unas líneas cada día y mira cuánto te ha hecho avanzar Dios.",
    "Journal": "Diario", "Edit": "Editar", "Done": "Listo", "More questions": "Más preguntas",
    "Choose the one that speaks to you today.": "Elige la que te hable hoy.",
    "This space is waiting for prayer": "Este espacio espera tus oraciones",
    "When a prayer request is shared, it will appear here. Share what is on your heart and let others lift you up.": "Cuando alguien comparta un pedido de oración, aparecerá aquí. Comparte lo que hay en tu corazón y deja que otros oren por ti.",
    "Your prayer requests will appear here": "Tus pedidos de oración aparecerán aquí",
    "When something is on your heart, you can share it. The VEREDA community will be with you in prayer.": "Cuando algo esté en tu corazón, puedes compartirlo. La comunidad VEREDA te acompañará en oración.",
    "Community": "Comunidad", "All": "Todos", "Your requests": "Tus pedidos", "Pray for all": "Orar por todos",
    "Introducing prayer requests!": "¡Llegaron los pedidos de oración!",
    "Share what’s on your heart and pray for others. Faith grows stronger when we carry each other.": "Comparte lo que hay en tu corazón y ora por otros. La fe se fortalece cuando nos sostenemos unos a otros.",
    "Explore community": "Explorar la comunidad", "How can we pray for you today?": "¿Cómo podemos orar por ti hoy?",
    "0/400 characters": "0/400 caracteres", "Post anonymously": "Publicar de forma anónima", "Publish": "Publicar",
    "About prayer requests": "Sobre los pedidos de oración",
    "Share only what you’re comfortable sharing. Requests stay visible for 7 days, and you can delete yours at any time.": "Comparte solo lo que te sientas cómodo compartiendo. Los pedidos se ven durante 7 días y puedes borrar los tuyos cuando quieras.",
    "Your request": "Tu pedido", "Ask loved ones to pray for you": "Pide a tus seres queridos que oren por ti",
    "Delete this request?": "¿Borrar este pedido?", "It will be removed from the community.": "Se quitará de la comunidad.",
    "You don’t have to carry the weight alone": "No tienes que cargar el peso solo", "Prayer requests": "Pedidos de oración",
    "Soft music for prayer": "Música suave para orar", "How to pray for this request": "Cómo orar por este pedido",
    "Take a quiet moment to read the request. Then ask God to meet their need. When you’ve prayed, tap “Amen” as a quiet sign of intercession.": "Tómate un momento de calma para leer el pedido. Luego pídele a Dios que supla esa necesidad. Cuando hayas orado, toca «Amén» como señal silenciosa de intercesión.",
    "Loading…": "Cargando…", "Bible settings": "Ajustes de la Biblia", "Version": "Versión", "Book": "Libro", "Text size": "Tamaño del texto",
    "Reading mode": "Modo de lectura", "Daily Prayer": "Oración diaria", "Scripture & today’s word": "Escritura y palabra de hoy",
    "Quiz": "Quiz", "One action": "Una acción", "Copied": "Copiado", "Audio isn’t supported on this browser": "Este navegador no admite audio",
    "Journey": "Camino", "Bible": "Biblia", "Something went wrong. Please try again.": "Algo salió mal. Inténtalo de nuevo.",
    "Please sign in again": "Vuelve a iniciar sesión",
    "We couldn’t find an active subscription for this email.": "No encontramos una suscripción activa para este correo.",
    "This purchase was refunded.": "Esta compra fue reembolsada.", "This purchase was disputed.": "Esta compra fue disputada.",
    "Your subscription was canceled.": "Tu suscripción fue cancelada.", "We couldn’t process your last payment.": "No pudimos procesar tu último pago.",
    "Your subscription has expired.": "Tu suscripción venció.", "This purchase was canceled.": "Esta compra fue cancelada.",
    "Your access is not active.": "Tu acceso no está activo.", "VEREDA was added to your home screen": "VEREDA se agregó a tu pantalla de inicio",
    "Installing VEREDA…": "Instalando VEREDA…", "at the bottom of Safari (or at the top on iPad).": "en la parte inferior de Safari (o arriba en iPad).",
    "Scroll down and tap “Add to Home Screen”": "Desplázate y toca «Agregar a pantalla de inicio»",
    "You may need to tap “More” to find it.": "Puede que tengas que tocar «Más» para encontrarlo.", "Tap “Add”": "Toca «Agregar»",
    "VEREDA will appear on your home screen like any other app.": "VEREDA aparecerá en tu pantalla de inicio como cualquier otra app.",
    "Open your browser menu": "Abre el menú del navegador", "Tap the ⋮ (three dots) in the top-right corner.": "Toca ⋮ (tres puntos) en la esquina superior derecha.",
    "Tap “Add to Home screen” or “Install app”": "Toca «Agregar a la pantalla principal» o «Instalar app»",
    "VEREDA will appear on your home screen.": "VEREDA aparecerá en tu pantalla de inicio.",
    "Welcome to VEREDA": "Bienvenido a VEREDA",
    "Your daily path closer to God. Here’s a quick tour of everything inside — it takes less than a minute.": "Tu camino diario más cerca de Dios. Aquí tienes un recorrido rápido por todo lo que incluye: toma menos de un minuto.",
    "Your Journey": "Tu camino",
    "One devotional unlocks every day. Each one has a prayer, today’s word, a short quiz and one action. Finish today’s to unlock tomorrow’s.": "Cada día se desbloquea un devocional. Cada uno tiene una oración, la palabra de hoy, un quiz corto y una acción. Termina el de hoy para desbloquear el de mañana.",
    "Read or listen": "Lee o escucha",
    "Every prayer and devotional can be read or listened to. Switch anytime with the Read / Listen button at the top.": "Cada oración y devocional se puede leer o escuchar. Cambia cuando quieras con el botón Leer / Escuchar de arriba.",
    "Keep your lamp burning": "Mantén tu lámpara encendida",
    "Each day you complete a devotional, your lamp lights up and your streak grows. Tap the lamp to see your goal, your points and your faith tree.": "Cada día que completas un devocional, tu lámpara se enciende y tu racha crece. Toca la lámpara para ver tu meta, tus puntos y tu árbol de fe.",
    "Daily verses and audio podcasts with Bible teaching and stories — perfect for your commute or a quiet moment.": "Versículos diarios y un asistente espiritual para cuando necesites ánimo, un versículo o una oración.",
    "Write a short reflection after each devotional and look back on how far God has brought you.": "Escribe una reflexión corta después de cada devocional y mira cuánto te ha hecho avanzar Dios.",
    "Share a prayer request and pray for believers around the world. Tap “Amen” when you’ve prayed.": "Comparte un pedido de oración y ora por creyentes de todo el mundo. Toca «Amén» cuando hayas orado.",
    "The Bible": "La Biblia",
    "The whole Bible in two versions, with highlights, sharing, light and dark reading modes and audio.": "La Biblia completa en español (Reina-Valera 1909) y en inglés, con resaltados, opción de compartir, modo claro y oscuro, y audio.",
    "Welcome back": "Bienvenido de nuevo", "Create your access": "Crea tu acceso", "Reset your password": "Restablece tu contraseña",
    "Sign in with the email you used to purchase.": "Inicia sesión con el correo que usaste en la compra.",
    "Use the email from your purchase and the purchase code we sent you.": "Usa el correo de tu compra y el código de compra que te enviamos.",
    "Confirm your purchase to choose a new password.": "Confirma tu compra para elegir una nueva contraseña.",
    "Sign in": "Iniciar sesión", "Create my access": "Crear mi acceso", "Save new password": "Guardar nueva contraseña",
    "Please enter a valid email.": "Ingresa un correo válido.", "Incorrect password.": "Contraseña incorrecta.",
    "Signed in as admin — all days unlocked": "Sesión de administrador: todos los días desbloqueados",
    "Can’t connect right now. Check your internet and try again.": "No hay conexión ahora. Revisa tu internet e inténtalo de nuevo.",
    "Please enter your password.": "Ingresa tu contraseña.", "Your password needs at least 6 characters.": "Tu contraseña necesita al menos 6 caracteres.",
    "Please enter your purchase code.": "Ingresa tu código de compra.",
    "This is your first time — create your access with your purchase code.": "Es tu primera vez: crea tu acceso con tu código de compra.",
    "Email or password is incorrect.": "El correo o la contraseña son incorrectos.", "Your access is ready. Welcome!": "Tu acceso está listo. ¡Bienvenido!",
    "This lesson is being prepared": "Esta lección se está preparando", "Notification": "Notificación", "Today’s Word": "La palabra de hoy",
    "Default": "Predeterminado", "Tap to complete": "Toca para completar", "Great job!": "¡Excelente!",
    "No extra voices on this device": "No hay otras voces en este dispositivo", "Hello, I’ll be reading with you today.": "Hola, hoy leeré contigo.",
    "That’s right!": "¡Correcto!", "Exactly!": "¡Exacto!", "Great answer!": "¡Gran respuesta!", "Almost there!": "¡Casi!",
    "Your thoughts (optional)": "Tus comentarios (opcional)", "Thank you for your feedback!": "¡Gracias por tu opinión!",
    "Three days in a row. A habit is being born.": "Tres días seguidos. Está naciendo un hábito.",
    "A full week walking with God!": "¡Una semana completa caminando con Dios!",
    "21 days — a new rhythm has taken root.": "21 días: un nuevo ritmo echó raíces.",
    "40 days — like Jesus in the wilderness. Remarkable faithfulness.": "40 días, como Jesús en el desierto. Una fidelidad admirable.",
    "100 days! Your lamp has been burning for over three months.": "¡100 días! Tu lámpara lleva más de tres meses encendida.",
    "One whole year with God, day by day.": "Un año entero con Dios, día a día.",
    "Seed": "Semilla", "Sprout": "Brote", "Sapling": "Arbolito", "Young tree": "Árbol joven", "Tree": "Árbol", "Fruitful tree": "Árbol con fruto",
    "Your walk": "Tu caminar", "Lamp lit today": "Lámpara encendida hoy",
    "Beautiful. Come back tomorrow to keep it burning.": "Hermoso. Vuelve mañana para mantenerla encendida.",
    "Complete today’s devotional to keep your lamp burning.": "Completa el devocional de hoy para mantener tu lámpara encendida.",
    "Light your lamp today and start a new streak.": "Enciende tu lámpara hoy y empieza una nueva racha.",
    "Goal reached — you did it!": "Meta alcanzada: ¡lo lograste!", "You can do it — start with today’s devotional": "Tú puedes: empieza con el devocional de hoy",
    "1 available this week — if you miss a day, your streak is protected.": "1 disponible esta semana: si te saltas un día, tu racha está protegida.",
    "used this week.": "usado esta semana.", "Next milestone": "Próximo logro", "All done!": "¡Todo listo!",
    "Complete today’s devotional": "Completa el devocional de hoy", "Answer a quiz question right on the first try": "Responde bien una pregunta del quiz al primer intento",
    "Write in your journal": "Escribe en tu diario", "Pray for a request (up to 5 a day)": "Ora por un pedido (hasta 5 al día)",
    "Finish a podcast episode": "Termina un episodio de podcast", "Read a Bible chapter": "Lee un capítulo de la Biblia",
    "Streak bonus — every full week in a row": "Bono de racha: por cada semana completa seguida", "A new milestone!": "¡Un nuevo logro!",
    "How does the Journey work?": "¿Cómo funciona el camino?",
    "A new devotional unlocks every day. Complete today’s prayer, word, quiz and action to unlock tomorrow’s day.": "Cada día se desbloquea un nuevo devocional. Completa la oración, la palabra, el quiz y la acción de hoy para desbloquear el día de mañana.",
    "Can I skip ahead?": "¿Puedo adelantarme?", "No — the Journey is designed to build a daily habit, one step at a time.": "No: el camino está pensado para crear un hábito diario, paso a paso.",
    "Which Bible version is used?": "¿Qué versión de la Biblia se usa?",
    "The World English Bible (WEB), a modern English translation in the public domain.": "En español, la Reina-Valera 1909, de dominio público. En inglés, la World English Bible (WEB).",
    "How do I listen instead of reading?": "¿Cómo escucho en lugar de leer?",
    "Tap “Listen” on any prayer or devotional. You can change the narrator and speed.": "Toca «Escuchar» en cualquier oración o devocional. Puedes cambiar el narrador y la velocidad.",
    "How do I cancel?": "¿Cómo cancelo?", "Tap Manage subscription in your profile, or contact support.": "Toca Administrar suscripción en tu perfil, o contacta a soporte.",
    "ON": "SÍ", "OFF": "NO", "Turn off": "Desactivar", "Turn on": "Activar",
    "Days follow the real daily schedule when off": "Si está desactivado, los días siguen el calendario real",
    "Open every available day without waiting": "Abre todos los días disponibles sin esperar", "All days unlocked": "Todos los días desbloqueados",
    "Daily schedule restored": "Calendario diario restablecido", "Simulated a new day — the next devotional is open": "Se simuló un nuevo día: el próximo devocional está abierto",
    "Tips will show again": "Los consejos se mostrarán de nuevo", "Journey progress reset": "Progreso del camino reiniciado",
    "Prayer requests cleared": "Pedidos de oración borrados", "Journal cleared": "Diario borrado", "Highlights & notes": "Resaltados y notas",
    "Podcasts": "Podcasts", "Play next episode": "Reproducir el siguiente episodio", "Play first episode": "Reproducir el primer episodio",
    "Hi there! I’m here to walk with you — to encourage you, pray with you and help you grow in God’s Word. Need a verse, a prayer, or just someone to listen? Just ask 🙏✨": "¡Hola! Estoy aquí para acompañarte: para animarte, orar contigo y ayudarte a crecer en la Palabra de Dios. ¿Necesitas un versículo, una oración o simplemente que alguien te escuche? Solo pregunta 🙏✨",
    "How can I stay faithful when life is hard?": "¿Cómo puedo mantenerme fiel cuando la vida es difícil?",
    "I’m struggling to find peace in my heart": "Me cuesta encontrar paz en mi corazón",
    "Can you pray for me?": "¿Puedes orar por mí?", "New chat": "Chat nuevo", "Today": "Hoy",
    "AI assistant · it can make mistakes.": "Asistente con IA · puede cometer errores.",
    "Prepared answers based on Scripture.": "Respuestas preparadas basadas en las Escrituras.",
    "Please sign out and sign in again to use the assistant.": "Cierra sesión y vuelve a entrar para usar el asistente.",
    "Sorry — I couldn’t answer right now. Please check your connection and try again.": "Lo siento, no pude responder ahora. Revisa tu conexión e inténtalo de nuevo.",
    "Continue chat": "Continuar el chat", "You've seen all of today's verses!": "¡Viste todos los versículos de hoy!", "Tomorrow brings a new verse — or go back to the one that touched you.": "Mañana llega un nuevo versículo, o vuelve al que más te tocó.", "Available in an upcoming update": "Disponible en una próxima actualización", "The assistant will be available in an upcoming update.": "El asistente estará disponible en una próxima actualización.", "Start a chat": "Iniciar un chat", "Write your message": "Escribe tu mensaje",
    "Which verse is hard for you to live out — and why?": "¿Qué versículo te cuesta vivir, y por qué?",
    "What does an ‘abundant life’ mean to you beyond your circumstances?": "¿Qué significa para ti una «vida abundante» más allá de tus circunstancias?",
    "Where did you see God’s faithfulness this week?": "¿Dónde viste la fidelidad de Dios esta semana?",
    "What would change today if you truly believed you are fully known by God?": "¿Qué cambiaría hoy si de verdad creyeras que Dios te conoce por completo?",
    "What is one thing you want to surrender to God tonight?": "¿Qué quieres entregarle a Dios esta noche?",
    "Who has God placed in your life to love better?": "¿A quién puso Dios en tu vida para amarlo mejor?",
    "What promise of God do you need to hold on to this week?": "¿A qué promesa de Dios necesitas aferrarte esta semana?",
    "When did you feel closest to God recently?": "¿Cuándo te sentiste más cerca de Dios últimamente?",
    "What habit is helping your faith grow — and which one is getting in the way?": "¿Qué hábito está ayudando a crecer tu fe, y cuál la está estorbando?",
    "What would you say to God right now if no one else could hear?": "¿Qué le dirías a Dios ahora mismo si nadie más pudiera oír?",
    "View": "Ver", "Your journal entry was deleted": "Tu entrada del diario fue eliminada", "Record your walk with God": "Registra tu caminar con Dios",
    "Where did I notice God’s presence today?": "¿Dónde noté la presencia de Dios hoy?",
    "What does an abundant life in Christ look like for me?": "¿Cómo se ve para mí una vida abundante en Cristo?",
    "Find peace through reflection": "Encuentra paz a través de la reflexión",
    "Each day, release your worries, notice your blessings and grow in trust.": "Cada día, suelta tus preocupaciones, nota tus bendiciones y crece en confianza.",
    "What worry do you need to lay down today?": "¿Qué preocupación necesitas soltar hoy?",
    "And see how far God has brought you": "Y mira cuánto te ha hecho avanzar Dios",
    "What small step can you take toward your calling?": "¿Qué pequeño paso puedes dar hacia tu llamado?",
    "How can you glorify God with your plans for tomorrow?": "¿Cómo puedes glorificar a Dios con tus planes para mañana?",
    "Start journaling": "Empezar a escribir", "A question to help you grow": "Una pregunta para ayudarte a crecer",
    "Feel free to go into detail…": "Siéntete libre de escribir con detalle…", "Your journal was updated": "Tu diario se actualizó",
    "Anonymous": "Anónimo", "Your request is live for 7 days": "Tu pedido estará visible 7 días", "Your prayer request is active": "Tu pedido de oración está activo",
    "Your request was deleted": "Tu pedido fue eliminado", "Please pray with me": "Por favor, ora conmigo",
    "Lord, we place all of these prayer requests in your hands. Bring peace, healing and guidance to every heart. May each person feel your presence and care today. Amen.": "Señor, ponemos todos estos pedidos de oración en tus manos. Trae paz, sanidad y dirección a cada corazón. Que cada persona sienta hoy tu presencia y tu cuidado. Amén.",
    "Amen": "Amén", "Versions": "Versiones", "Books": "Libros", "Dark": "Oscuro", "Light": "Claro",
    "Remove": "Quitar", "Highlight": "Resaltar", "Highlight removed": "Resaltado quitado", "Saved to Highlights & notes": "Guardado en Resaltados y notas",
    "Your first name": "Tu nombre", "Email from your purchase": "Correo de tu compra", "Purchase code (starts with HP)": "Código de compra (empieza con HP)",
    "Password": "Contraseña", "Choose a password (6+ characters)": "Elige una contraseña (6+ caracteres)", "Admin": "Administrador",
    "Tap here to choose how you want to experience today’s word": "Toca aquí para elegir cómo quieres vivir la palabra de hoy",
    "Tap here to explore a list of suggestions and pick the one that inspires you today.": "Toca aquí para ver una lista de sugerencias y elegir la que te inspire hoy.",
    "Turn on notifications in your settings to get reminders": "Activa las notificaciones en tu configuración para recibir recordatorios",
    "Confirm with “Add” or “Install”": "Confirma con «Agregar» o «Instalar»",
    "Terms & Conditions": "Términos y condiciones", "days": "días", "light": "luz", "Privacy": "Privacidad",
    "Ask loved ones to pray for you": "Pide a tus seres queridos que oren por ti",
    "Prepared answers based on Scripture. Not a substitute for pastoral or professional care.": "Respuestas preparadas basadas en las Escrituras. No reemplaza la atención pastoral ni profesional.",
    "AI assistant · it can make mistakes. Not a substitute for pastoral or professional care.": "Asistente con IA · puede cometer errores. No reemplaza la atención pastoral ni profesional.",
    "Write a reflection": "Escribir una reflexión", "Turn off unlock-all mode": "Desactivar el modo desbloquear todo", "Turn on unlock-all mode": "Activar el modo desbloquear todo",
    "Report": "Denunciar", "Report this request?": "¿Denunciar este pedido?",
    "If it’s offensive, spam or not a prayer request, let us know. Requests reported by several people are hidden.": "Si es ofensivo, spam o no es un pedido de oración, avísanos. Los pedidos denunciados por varias personas se ocultan.",
    "Thank you. We’ll take a look.": "Gracias. Lo revisaremos.", "You prayed ✓": "Oraste ✓",
    "You’ve shared a lot of requests today. Try again tomorrow.": "Hoy compartiste muchos pedidos. Inténtalo de nuevo mañana.",
    "Your request will expire in 7 days": "Tu pedido vencerá en 7 días",
    "Language": "Idioma", "English": "English", "Español": "Español",
    "World English Bible": "World English Bible (inglés)", "King James Version": "King James Version (inglés)",
    "A modern, readable English translation, freely available in the public domain.": "Una traducción moderna al inglés, de dominio público.",
    "The classic English translation first published in 1611 (1769 edition), in the public domain.": "La traducción clásica al inglés de 1611 (edición de 1769), de dominio público."
  };

  /* ---------- patterns (text with numbers / names inside) ---------- */
  var M = {January:"enero",February:"febrero",March:"marzo",April:"abril",May:"mayo",June:"junio",July:"julio",August:"agosto",September:"septiembre",October:"octubre",November:"noviembre",December:"diciembre",Jan:"ene",Feb:"feb",Mar:"mar",Apr:"abr",Jun:"jun",Jul:"jul",Aug:"ago",Sep:"sep",Oct:"oct",Nov:"nov",Dec:"dic"};
  var P = [
    [/^Devotional (\d+)$/, "Devocional $1"],
    [/^Question (\d+) of (\d+)$/, "Pregunta $1 de $2"],
    [/^(\d+) of (\d+) days completed(.*)$/, function (m, a, b, c) { return a + " de " + b + " días completados" + c.replace(" · Unlock mode:", " · Modo de desbloqueo:"); }],
    [/^\+(\d+) light$/, "+$1 de luz"], [/^(\d+) light$/, "$1 de luz"], [/^(\d+) \/ (\d+) light$/, "$1 / $2 de luz"],
    [/^Keep going — (\d+) to go$/, "Sigue así: faltan $1"],
    [/^Sabbath rest: (.*)$/, function (m, a) { return "Descanso sabático: " + (D[a] || a); }],
    [/^It grows a little more every month you keep walking with God\.(?: Next stage in (\d+) days\.)?$/, function (m, a) { return "Crece un poco más cada mes que sigues caminando con Dios." + (a ? " Próxima etapa en " + a + " días." : ""); }],
    [/^(Prayed|Praying) for (\d+) (heart|hearts)$/, function (m, a, b) { return (a === "Prayed" ? "Oraste por " : "Orando por ") + b + (b === "1" ? " corazón" : " corazones"); }],
    [/^(\d+) (person|people) prayed$/, function (m, a) { return a + (a === "1" ? " persona oró" : " personas oraron"); }],
    [/^(\d+) (person has|people have) prayed for you$/, function (m, a) { return a + (a === "1" ? " persona oró por ti" : " personas oraron por ti"); }],
    [/^We’ll remind you at (\d+:\d+)$/, "Te lo recordaremos a las $1"],
    [/^Want to keep listening\? Go back to (.+)$/, "¿Quieres seguir escuchando? Vuelve a $1"],
    [/^Ep\. (\d+) • (.*?)( left)?$/, function (m, a, b, c) { return "Ep. " + a + " • " + b + (c ? " restantes" : ""); }],
    [/^(\d+) in a row$/, "$1 seguidos"],
    [/^Tap the Share button$/, "Toca el botón Compartir"],
    [/^Day (\d+) of (\d+)$/, "Día $1 de $2"],
    [/^Day (\d+)$/, "Día $1"],
    [/^Day (\d+) · Chapter (\d+)(.*)$/, function (m, a, b, c) { return "Día " + a + " · Capítulo " + b + c; }],
    [/^Chapter (\d+)(.*)$/, function (m, a, b) { return "Capítulo " + a + b; }],
    [/^Module (\d+)(:?)(.*)$/, function (m, a, b, c) { return "Módulo " + a + b + c; }],
    [/^Week (\d+)$/, "Semana $1"],
    [/^(\d+) days?$/, function (m, a) { return a + (a === "1" ? " día" : " días"); }],
    [/^(\d+) days completed(.*)$/, function (m, a, b) { return a + " días completados" + b.replace(" · Unlock mode:", " · Modo de desbloqueo:"); }],
    [/^(\d+) episodes?$/, function (m, a) { return a + (a === "1" ? " episodio" : " episodios"); }],
    [/^Episode (\d+)(.*)$/, "Episodio $1$2"],
    [/^Welcome back, (.+)$/, "Bienvenido de nuevo, $1"],
    [/^Now reading the (.+)$/, function (m, a) { return "Ahora estás leyendo la " + (D[a] || a); }],
    [/^Scripture: (.+) \((\w+)\), public domain\.$/, function (m, a, b) { return "Escritura: " + (D[a] || a) + " (" + b + "), dominio público."; }],
    [/^New activities in (.+)$/, "Nuevas actividades en $1"],
    [/^Complete the previous days to unlock “(.+)”\. A new day opens every day\.$/, "Completa los días anteriores para desbloquear «$1». Cada día se abre uno nuevo."],
    [/^Lamp lit · (\d+) days? in a row$/, function (m, a) { return "Lámpara encendida · " + a + (a === "1" ? " día seguido" : " días seguidos"); }],
    [/^(\d+) days in a row$/, "$1 días seguidos"],
    [/^(\d+) (person has|people have) prayed(.*)$/, function (m, a, b, c) { return a + (a === "1" ? " persona oró" : " personas oraron") + c; }],
    [/^(\d+)\/400 characters$/, "$1/400 caracteres"],
    [/^Your faith tree · (.+)$/, function (m, a) { return "Tu árbol de fe · " + (D[a] || a); }],
    [/^(\d+) min$/, "$1 min"],
    [/^(\d+) sec remaining$/, "$1 s restantes"],
    [/^Hi, (.+)$/, "Hola, $1"],
    [/^Good morning, (.+)$/, "Buenos días, $1"], [/^Good afternoon, (.+)$/, "Buenas tardes, $1"], [/^Good evening, (.+)$/, "Buenas noches, $1"],
    [/^Good morning$/, "Buenos días"], [/^Good afternoon$/, "Buenas tardes"], [/^Good evening$/, "Buenas noches"],
    [/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/, function (m, a) { return {Mon:"Lun",Tue:"Mar",Wed:"Mié",Thu:"Jue",Fri:"Vie",Sat:"Sáb",Sun:"Dom"}[a]; }],
    [/^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})$/, function (m, a, b, c) { return b + " de " + M[a] + " de " + c; }]
  ];
  /* fragments safe to replace inside longer UI strings (never applied inside user/Bible content) */
  var F = [
    ["Day ", "Día "], [" · Chapter ", " · Capítulo "], [" days completed", " días completados"], ["Unlock mode:", "Modo de desbloqueo:"],
    [" in a row", " seguidos"], [" days", " días"], ["Module ", "Módulo "], ["Unlocks in ", "Se desbloquea en "]
  ];
  var SKIP = ".bub,.bible-txt,.jtext,.j-entry,.req-text,.rq-t,[data-noi18n],textarea,input,script,style,svg";

  function trim(s) { return s.replace(/^\s+|\s+$/g, ""); }
  function tr(s) {
    if (s == null) return s; var t = trim(String(s)); if (!t) return s;
    if (D[t] !== undefined) return String(s).replace(t, D[t]);
    for (var i = 0; i < P.length; i++) { if (P[i][0].test(t)) return String(s).replace(t, t.replace(P[i][0], P[i][1])); }
    return null;
  }
  window.T = function (s) { var r = tr(s); return r == null ? s : r; };
  function frag(s) { var o = s; for (var i = 0; i < F.length; i++) o = o.split(F[i][0]).join(F[i][1]); return o; }

  function node(n) {
    if (n.nodeType === 3) {
      var p = n.parentElement; if (!p || p.closest(SKIP)) return;
      var v = n.nodeValue; if (!/[A-Za-z]/.test(v)) return;
      var r = tr(v); if (r == null && /[A-Za-z]{3}/.test(v)) { var f = frag(v); if (f !== v) r = f; }
      if (r != null && r !== v) n.nodeValue = r;
    } else if (n.nodeType === 1) {
      if (n.matches && n.matches("script,style,svg")) return;
      ["placeholder", "aria-label", "title"].forEach(function (a) { var v = n.getAttribute && n.getAttribute(a); if (v) { var r = tr(v); if (r != null && r !== v) n.setAttribute(a, r); } });
      if (n.closest && n.closest(".bub,.bible-txt,[data-noi18n]")) return;
      var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), c;
      while ((c = w.nextNode())) {
        if (c.nodeType === 1) { ["placeholder", "aria-label", "title"].forEach(function (a) { var v = c.getAttribute(a); if (v) { var r = tr(v); if (r != null && r !== v) c.setAttribute(a, r); } }); }
        else node(c);
      }
    }
  }
  var busy = false;
  var mo = new MutationObserver(function (list) {
    if (busy) return; busy = true;
    try {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === "characterData") node(m.target);
        else if (m.type === "attributes") node(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) node(m.addedNodes[j]);
      }
    } finally { busy = false; }
  });
  function start() { node(document.body); mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title"] }); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
