// VEREDA — prepared-answer knowledge base for the Spiritual Assistant.
// Used when no AI key is configured in app_config (anthropic_api_key / openai_api_key).
// Each topic: keywords (lowercase, accents removed; phrases score higher), 1+ answers, and an optional
// prayer used when the person asks for prayer about that topic. Lesson names match the app's Journey.
// Scripture quotations: NIV.

export type Topic = { id: string; kw: string[]; answers: string[]; prayer?: string; priority?: number };

const CLOSE_PRAY = "\n\nWould you like me to pray with you about this?";

export const TOPICS: Topic[] = [
  // ---------- safety first ----------
  {
    id: "crisis", priority: 100,
    kw: ["kill myself", "suicide", "suicidal", "end my life", "want to die", "dont want to live", "don't want to live", "hurt myself", "self harm", "self-harm", "cutting myself", "no reason to live", "better off dead", "abused", "abusing me", "he hits me", "she hits me", "in danger", "not safe at home", "matar", "me matar", "suicidio", "quero morrer"],
    answers: [
      "I’m really glad you told me, and I want you to know you are not alone. What you’re carrying matters, and you matter.\n\n**Please reach out to someone right now.** In the US, call or text **988** (Suicide & Crisis Lifeline), any time, day or night. If you are in immediate danger, call **911** or your local emergency number. If you’re outside the US, please contact your local emergency line.\n\n“The LORD is close to the brokenhearted and saves those who are crushed in spirit.” (Psalm 34:18)\n\nIf you can, also tell someone you trust — a friend, a family member or a pastor — so they can be with you today. You don’t have to walk through this by yourself.",
    ],
  },

  // ---------- feelings ----------
  {
    id: "anxiety",
    kw: ["anxious", "anxiety", "worry", "worried", "worrying", "overthinking", "panic", "nervous", "stressed", "stress", "restless", "uneasy", "can't stop thinking", "cant stop thinking", "find peace", "no peace", "peace in my heart", "ansiedade", "ansioso", "ansiosa", "preocupado", "preocupada"],
    answers: [
      "That restless, heavy feeling is real — and you don’t have to pretend it isn’t there. God invites you to bring it to Him exactly as it is.\n\n“Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.” (Philippians 4:6)\n\n**One small step:** write down the one thing worrying you most right now, and next to it, one thing you’re thankful for today. Then hand the first one to God in a single sentence.\n\nThe Journey lesson **“Cast Your Cares”** (Freedom From Worry) walks through this slowly." + CLOSE_PRAY,
      "Worry often tries to carry tomorrow with today’s strength. Jesus speaks gently to that: “Do not worry about tomorrow, for tomorrow will worry about itself.” (Matthew 6:34)\n\n**Try this today:** take three slow breaths and pray, “Lord, this is Yours. Give me what I need for today.” Then do just the next small thing in front of you.\n\nYou may like the lessons **“Tomorrow Belongs to God”** and **“Enough for Today”** in Freedom From Worry." + CLOSE_PRAY,
    ],
    prayer: "Father, You see every worry I’m carrying, even the ones I can’t put into words. I place them in Your hands now. Quiet my racing thoughts, calm my heart, and give me Your peace that is greater than my understanding. Help me trust You with tomorrow and give me strength for today. In Jesus’ name, Amen.",
  },
  {
    id: "fear",
    kw: ["afraid", "scared", "fear", "fearful", "terrified", "frightened", "medo", "assustado"],
    answers: [
      "Fear can feel so loud. But you are not facing this alone — God goes ahead of you.\n\n“So do not fear, for I am with you; do not be dismayed, for I am your God.” (Isaiah 41:10)\n\n**One small step:** name the fear out loud to God, then read Isaiah 41:10 one more time slowly, putting your own name in it.\n\nThe lesson **“Faith Over Fear”** (Rooted in Faith) is a good companion for this." + CLOSE_PRAY,
    ],
    prayer: "Lord, You know what I’m afraid of. Thank You that I am never alone and that You go before me. Replace my fear with trust, strengthen me where I feel weak, and help me take the next step with courage. In Jesus’ name, Amen.",
  },
  {
    id: "lonely",
    kw: ["lonely", "loneliness", "alone", "no friends", "nobody cares", "no one cares", "isolated", "left out", "abandoned", "sozinho", "sozinha", "solidao"],
    answers: [
      "Feeling alone is one of the heaviest feelings there is. I’m sorry you’re carrying it. God’s promise to you is personal: “Never will I leave you; never will I forsake you.” (Hebrews 13:5)\n\n**One small step:** send a short message today to one person you trust — even just “thinking of you.” God often answers loneliness through people.\n\nThe lesson **“Called by Name”** (Rooted in Faith) is a beautiful reminder that you are known." + CLOSE_PRAY,
    ],
    prayer: "Father, thank You that I am never truly alone, because You are with me. Fill the empty places in my heart with Your presence, and bring good, caring people into my life. Help me also to be a friend to someone else today. In Jesus’ name, Amen.",
  },
  {
    id: "sad",
    kw: ["sad", "sadness", "depressed", "depression", "feeling down", "feel down", "hopeless", "empty", "crying", "cry", "broken", "heartbroken", "tired of everything", "triste", "tristeza", "depressao"],
    answers: [
      "Thank you for being honest about how you feel. God doesn’t ask you to hide your sadness — He comes close to it.\n\n“The LORD is close to the brokenhearted and saves those who are crushed in spirit.” (Psalm 34:18)\n\n**One small step:** read Psalm 34 today and underline one line that speaks to you. And if this heaviness has lasted a long time, please also talk with a doctor or counselor — caring for your mind is part of caring for the life God gave you.\n\nThe lesson **“When Heaven Feels Silent”** (The Power of Prayer) may help." + CLOSE_PRAY,
    ],
    prayer: "Lord, You are close to the brokenhearted, and that includes me today. Hold me in this heaviness. Bring light into the dark places, lift my head, and remind me that I am deeply loved. Lead me to the help and people I need. In Jesus’ name, Amen.",
  },
  {
    id: "grief",
    kw: ["died", "death", "passed away", "lost my", "grief", "grieving", "mourning", "funeral", "miss my mom", "miss my dad", "miss my husband", "miss my wife", "luto", "morreu", "faleceu"],
    answers: [
      "I’m so sorry for your loss. Grief is love that has nowhere to go, and it’s okay to feel it fully.\n\nJesus said: “Blessed are those who mourn, for they will be comforted.” (Matthew 5:4) And He wept at His friend’s grave — He understands.\n\n**One small step:** today, write down one memory you’re grateful for and tell God about it. Let yourself be held, and let others care for you too.\n\nI’m here whenever you want to talk." + CLOSE_PRAY,
    ],
    prayer: "Father, my heart hurts. Thank You for the life of the one I miss and for every good memory. Comfort me in this grief, carry me on the hard days, and fill me with the hope we have in Jesus, who is the resurrection and the life. In Jesus’ name, Amen.",
  },
  {
    id: "anger",
    kw: ["angry", "anger", "mad at", "furious", "rage", "hate him", "hate her", "frustrated", "irritated", "raiva", "irritado"],
    answers: [
      "Anger is a real emotion — even Jesus felt it. The question is what we do with it next.\n\n“Everyone should be quick to listen, slow to speak and slow to become angry.” (James 1:19)\n\n**One small step:** before you respond to the person or situation, pause for one minute, breathe, and pray: “Lord, help me answer the way You would.”\n\nThe lessons in **Freedom From Worry** and **“Washing Feet”** (Walking With Jesus) speak to responding with grace." + CLOSE_PRAY,
    ],
    prayer: "Lord, You see the anger in my heart. Help me not to sin in it. Slow me down, guard my words, and show me what is really hurting underneath. Give me wisdom and a gentle answer. In Jesus’ name, Amen.",
  },
  {
    id: "forgive",
    kw: ["forgive", "forgiveness", "forgiving", "hurt me", "betrayed", "betrayal", "cheated on me", "resentment", "grudge", "can't let go", "perdoar", "perdao", "magoado", "magoada"],
    answers: [
      "Being hurt by someone is painful, and forgiving can feel impossible. Forgiveness doesn’t mean what happened was okay — it means you hand the debt to God so it no longer controls you.\n\n“Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.” (Ephesians 4:32)\n\n**One small step:** pray honestly, “Lord, I’m not ready, but I’m willing to be made willing.” Forgiveness is often a process, not a single moment.\n\nIf you are in danger or being harmed, forgiveness does not mean staying unsafe — please reach out for help." + CLOSE_PRAY,
    ],
    prayer: "Father, You know how much this hurt. I don’t want bitterness to grow in me. Help me release this person into Your hands, heal the wound they left, and give me the strength to forgive as You have forgiven me. In Jesus’ name, Amen.",
  },
  {
    id: "guilt",
    kw: ["guilt", "guilty", "ashamed", "shame", "i sinned", "my sin", "my sins", "messed up", "failed god", "god forgive me", "can god forgive", "unforgivable", "culpa", "pecado", "pequei"],
    answers: [
      "If you feel the weight of something you’ve done, you’re in the right place: bringing it to God. His grace is bigger than your worst moment.\n\n“If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.” (1 John 1:9)\n\nAnd: “Therefore, there is now no condemnation for those who are in Christ Jesus.” (Romans 8:1)\n\n**One small step:** tell God honestly what happened, receive His forgiveness, and if you can, make one thing right today.\n\nThe lessons **“Loved Before You Earned It”** and **“Honest Confession”** go deeper." + CLOSE_PRAY,
    ],
    prayer: "Father, I confess what I’ve done and I’m sorry. Thank You that Jesus paid for my sin and that You forgive me completely. Wash away my shame, renew my heart, and help me walk in Your ways from today. In Jesus’ name, Amen.",
  },
  {
    id: "temptation",
    kw: ["tempted", "temptation", "addiction", "addicted", "can't stop", "cant stop", "porn", "pornography", "lust", "drinking too much", "relapse", "tentacao", "vicio"],
    answers: [
      "Thank you for your honesty — naming a struggle is already a step toward freedom. You are not the only one, and you are not beyond God’s help.\n\n“God is faithful; he will not let you be tempted beyond what you can bear. But when you are tempted, he will also provide a way out so that you can endure it.” (1 Corinthians 10:13)\n\n**One small step:** identify the moment the temptation usually starts and plan one “way out” for it today. And tell one trusted person — struggles lose power in the light. If this is an addiction, a support group or counselor can make a real difference." + CLOSE_PRAY,
    ],
    prayer: "Lord, You know my weakness. I need Your strength. When temptation comes, show me the way out and give me the courage to take it. Surround me with people who can help, and make me free in You. In Jesus’ name, Amen.",
  },
  {
    id: "doubt",
    kw: ["doubt", "doubts", "doubting", "is god real", "does god exist", "don't believe", "dont believe", "losing my faith", "lost my faith", "weak faith", "faith is weak", "where is god", "god is silent", "god feels distant", "far from god", "duvida", "longe de deus"],
    answers: [
      "Doubts and seasons when God feels distant happen to sincere believers — you’re in good company. A father once said to Jesus: “I do believe; help me overcome my unbelief!” (Mark 9:24) — and Jesus helped him.\n\n**One small step:** bring your questions to God honestly instead of hiding them. Read one Gospel story this week (Mark is short) and ask, “Who is Jesus here?”\n\nThe lessons **“When Heaven Feels Silent”** and **“The Still Small Voice”** were made for seasons like this." + CLOSE_PRAY,
    ],
    prayer: "Lord, I believe — help my unbelief. Meet me in my questions. Make Yourself real to me through Your Word, and draw me close even when I can’t feel You. In Jesus’ name, Amen.",
  },
  {
    id: "faithful_hard",
    kw: ["stay faithful", "life is hard", "hard times", "difficult time", "going through a lot", "struggling", "everything is going wrong", "give up", "want to give up", "trials", "suffering", "dificil", "desistir"],
    answers: [
      "When life is hard, faithfulness doesn’t mean feeling strong — it means staying close to God one day at a time.\n\nJesus said: “In this world you will have trouble. But take heart! I have overcome the world.” (John 16:33)\n\n**One small step:** keep your daily time with God small but steady — even 10 minutes. Small, faithful steps add up.\n\n“Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.” (Galatians 6:9)\n\nThe lessons **“Seasons of Waiting”** and **“Peace in the Storm”** may encourage you." + CLOSE_PRAY,
    ],
    prayer: "Father, this season is hard, and I’m tired. Hold me up when I can’t stand on my own. Give me strength for today, peace in the storm, and the faith to keep walking with You. In Jesus’ name, Amen.",
  },
  {
    id: "tired",
    kw: ["tired", "exhausted", "burnout", "burned out", "burnt out", "weary", "no energy", "drained", "cansado", "cansada", "esgotado"],
    answers: [
      "You sound worn out. Jesus speaks directly to that: “Come to me, all you who are weary and burdened, and I will give you rest.” (Matthew 11:28)\n\n**One small step:** choose one thing to set down today, and give yourself permission to rest without guilt. Rest is a gift from God, not a reward for being productive.\n\nThe lessons **“Rest for the Weary”** and **“Sabbath Rest”** are a good place to pause." + CLOSE_PRAY,
    ],
    prayer: "Lord, I’m tired. Thank You that You invite me to rest in You. Refresh my body, mind and soul, show me what to let go of, and renew my strength like the eagle’s. In Jesus’ name, Amen.",
  },
  {
    id: "sleep",
    kw: ["can't sleep", "cant sleep", "insomnia", "sleepless", "awake at night", "trouble sleeping", "nao consigo dormir", "insonia"],
    answers: [
      "Lying awake with a busy mind is hard. Here’s a verse to rest on tonight: “In peace I will lie down and sleep, for you alone, LORD, make me dwell in safety.” (Psalm 4:8)\n\n**Try this tonight:** put your phone away, breathe slowly, and pray through your day — one thanks, one worry handed to God, one person to bless. You can also use **Listen** mode in the app to hear a short passage as you wind down.\n\nIf sleeplessness continues, it’s worth talking with a doctor too." + CLOSE_PRAY,
    ],
    prayer: "Father, quiet my mind tonight. I give You every thought that keeps me awake. Let me lie down in peace and sleep, knowing You watch over me. In Jesus’ name, Amen.",
  },
  {
    id: "health",
    kw: ["sick", "illness", "cancer", "diagnosis", "hospital", "surgery", "disease", "pain", "health", "doctor", "healing", "heal me", "doente", "doenca", "cirurgia", "cura"],
    answers: [
      "I’m sorry you’re facing this. Health struggles touch every part of life, and it’s okay to bring all of it to God.\n\n“He heals the brokenhearted and binds up their wounds.” (Psalm 147:3) And He promises, “My grace is sufficient for you, for my power is made perfect in weakness.” (2 Corinthians 12:9)\n\n**One small step:** keep following your doctor’s care, and invite one or two people to pray with you this week. You don’t have to carry this alone.\n\nI can’t give medical advice, but I can pray with you." + CLOSE_PRAY,
    ],
    prayer: "Lord, You are the Great Physician. I bring this illness to You. Bring healing, give wisdom to the doctors, ease the pain, and fill me with Your peace and courage in every appointment and every waiting moment. In Jesus’ name, Amen.",
  },
  {
    id: "money",
    kw: ["money", "bills", "debt", "rent", "financial", "finances", "broke", "lost my job", "unemployed", "jobless", "can't pay", "provision", "dinheiro", "divida", "desempregado"],
    answers: [
      "Financial pressure can keep you up at night. God cares about your daily needs — Jesus taught us to pray for “our daily bread.”\n\n“And my God will meet all your needs according to the riches of his glory in Christ Jesus.” (Philippians 4:19)\n\n**One small step:** write down your three most urgent needs and pray over each one specifically. Then take one practical action today — one call, one application, one budget line. Faith and wise steps go together.\n\nThe lesson **“Bread for the Hungry”** (Walking With Jesus) speaks to God’s provision." + CLOSE_PRAY,
    ],
    prayer: "Father, You know every bill and every need. I trust You as my Provider. Open doors of work and provision, give me wisdom with what I have, and free me from fear about tomorrow. In Jesus’ name, Amen.",
  },
  {
    id: "work",
    kw: ["work", "job", "boss", "coworker", "career", "office", "workplace", "promotion", "trabalho", "chefe", "emprego"],
    answers: [
      "Work takes so much of our time and energy — and God cares about it too.\n\n“Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.” (Colossians 3:23)\n\n**One small step:** before you start tomorrow, pray one sentence over your work: “Lord, help me do this well and treat people the way You would.” If there’s a difficult person, pray for them by name.\n\nThe lesson **“Worship in Ordinary Days”** (Habits of the Heart) is a nice fit." + CLOSE_PRAY,
    ],
    prayer: "Lord, I bring my work to You. Give me wisdom, patience and integrity. Help me serve well, handle pressure with peace, and be a light to the people around me. In Jesus’ name, Amen.",
  },
  {
    id: "marriage",
    kw: ["marriage", "married", "husband", "wife", "spouse", "divorce", "fighting with my", "relationship", "boyfriend", "girlfriend", "dating", "casamento", "marido", "esposa", "namorado", "namorada"],
    answers: [
      "Relationships are one of God’s greatest gifts — and they can also be where we feel the most pain. God sees both.\n\n“Love is patient, love is kind.” (1 Corinthians 13:4)\n\n**One small step:** today, choose one small act of kindness toward this person without expecting anything back, and pray for them by name. If there’s ongoing conflict, a pastor or Christian counselor can really help.\n\nIf you ever feel unsafe in a relationship, please reach out for help right away." + CLOSE_PRAY,
    ],
    prayer: "Father, I lift up this relationship to You. Heal what is hurt, soften what is hard, and teach us to love with patience and kindness. Give us wisdom, humility and grace for each other. In Jesus’ name, Amen.",
  },
  {
    id: "family",
    kw: ["my son", "my daughter", "my kids", "my children", "my child", "parenting", "my mom", "my mother", "my dad", "my father", "family", "my parents", "teenager", "filho", "filha", "familia", "mae", "pai"],
    answers: [
      "Family is close to God’s heart — and carrying worries for the people we love can be heavy.\n\n“Start children off on the way they should go, and even when they are old they will not turn from it.” (Proverbs 22:6)\n\n**One small step:** pray for each family member by name today, and send or say one encouraging word to one of them.\n\nThe lesson **“Standing in the Gap”** (The Power of Prayer) is all about praying for others." + CLOSE_PRAY,
    ],
    prayer: "Lord, I lift up my family to You. Protect them, draw each one closer to You, and bring peace and love into our home. Give me wisdom, patience and grace for every conversation. In Jesus’ name, Amen.",
  },
  {
    id: "purpose",
    kw: ["purpose", "calling", "god's will", "gods will", "what should i do", "direction", "decision", "decide", "which way", "plan for my life", "meaning of life", "lost in life", "proposito", "vontade de deus", "decisao"],
    answers: [
      "Wanting to know God’s direction is a beautiful prayer. He promises to guide those who seek Him.\n\n“Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.” (Proverbs 3:5–6)\n\nAnd: “If any of you lacks wisdom, you should ask God, who gives generously to all.” (James 1:5)\n\n**One small step:** write down the decision, pray over it daily this week, ask one wise person for counsel, and notice where God gives you peace.\n\nThe chapter **Hearing God Every Day** — especially **“Open and Closed Doors”** and **“Peace as a Guide”** — is made for this." + CLOSE_PRAY,
    ],
    prayer: "Father, I want to walk in Your will. Give me wisdom for this decision, open the right doors and close the wrong ones, and guide me with Your peace. Help me trust You even before I see the whole path. In Jesus’ name, Amen.",
  },
  {
    id: "selfworth",
    kw: ["not good enough", "worthless", "hate myself", "ugly", "no value", "insecure", "insecurity", "nobody loves me", "unlovable", "self esteem", "self-esteem", "nao sou suficiente"],
    answers: [
      "I’m sorry you feel this way about yourself. Please hear what God says about you: “I praise you because I am fearfully and wonderfully made.” (Psalm 139:14) You were loved before you ever did anything to earn it.\n\n**One small step:** read Psalm 139 today and write down one sentence from it about who you are in God’s eyes. Put it where you’ll see it.\n\nThe lessons **“Loved Before You Earned It”** and **“Called by Name”** were written for moments like this." + CLOSE_PRAY,
    ],
    prayer: "Father, help me see myself the way You see me. Silence the voices that tell me I’m not enough. Fill me with Your love, and remind me that I am Your child, fearfully and wonderfully made. In Jesus’ name, Amen.",
  },
  {
    id: "gratitude",
    kw: ["thankful", "grateful", "gratitude", "blessed", "good news", "answered prayer", "praise god", "thank god", "grato", "grata", "gratidao"],
    answers: [
      "That’s wonderful — thank you for sharing it! Gratitude turns our eyes back to the Giver.\n\n“Give thanks in all circumstances; for this is God’s will for you in Christ Jesus.” (1 Thessalonians 5:18)\n\n**One small step:** tell someone else what God did — your story might be exactly the encouragement they need today.\n\nThe lesson **“Gratitude That Changes You”** (The Power of Prayer) is a lovely next read.",
    ],
    prayer: "Father, thank You! Thank You for Your goodness and for this blessing. Help me never forget what You’ve done, and let my life be full of gratitude and praise. In Jesus’ name, Amen.",
  },
  {
    id: "waiting",
    kw: ["waiting", "how long", "unanswered prayer", "god isn't answering", "god not answering", "nothing changes", "impatient", "patience", "esperando", "paciencia"],
    answers: [
      "Waiting can be one of the hardest parts of faith. But waiting on God is never wasted time.\n\n“But those who hope in the LORD will renew their strength. They will soar on wings like eagles.” (Isaiah 40:31)\n\n**One small step:** keep a short list of what you’re praying for, with today’s date. One day you’ll look back and see how God was working, even in the silence.\n\nThe lessons **“Seasons of Waiting”** and **“Ask, Seek, Knock”** may encourage you." + CLOSE_PRAY,
    ],
    prayer: "Lord, waiting is hard. Give me patience and hope while I wait. Strengthen my faith, keep my heart soft, and help me trust Your timing and Your goodness. In Jesus’ name, Amen.",
  },

  // ---------- faith practice ----------
  {
    id: "how_pray",
    kw: ["how to pray", "how do i pray", "teach me to pray", "don't know how to pray", "dont know how to pray", "learn to pray", "prayer life", "como orar"],
    answers: [
      "Prayer is simply talking with God — honestly, like a child with a loving Father. There’s no perfect formula.\n\nJesus gave us a pattern in the Lord’s Prayer (Matthew 6:9–13). A simple way to use it:\n• **Praise** — “Father, You are good…”\n• **Surrender** — “Your will be done in my life…”\n• **Ask** — share your needs, big and small\n• **Forgive** — receive and give forgiveness\n• **Trust** — “Lead me and protect me.”\n\n**One small step:** pray for 3 minutes today using these five words.\n\nThe chapter **The Power of Prayer** starts with **“Our Father”** and walks you through it.",
    ],
  },
  {
    id: "read_bible",
    kw: ["read the bible", "reading the bible", "where to start", "where do i start", "where should i start", "understand the bible", "don't understand", "dont understand", "bible is hard", "bible confusing", "study the bible", "how to study", "which book", "ler a biblia", "por onde comecar", "entender a biblia"],
    answers: [
      "Great question! Many people feel lost in the Bible at first — that’s normal.\n\n**A simple way to start:**\n1. Begin with the **Gospel of Mark** — it’s short and shows who Jesus is.\n2. Read a small portion each day, not a whole chapter if it feels like too much.\n3. Ask three questions: *What does this say about God? About me? What can I do today?*\n\n“Your word is a lamp for my feet, a light on my path.” (Psalm 119:105)\n\nThat’s exactly what your daily **Journey** in VEREDA does: one short passage, explained in plain words, with one action. Start with **“A Lamp for Your Path”**.",
    ],
  },
  {
    id: "consistency",
    kw: ["consistent", "consistency", "keep forgetting", "forget to read", "no time", "too busy", "can't keep up", "cant keep up", "stay consistent", "habit", "discipline", "skipped", "missed days", "sem tempo", "constancia", "habito"],
    answers: [
      "You’re not alone — most people struggle with consistency. The secret isn’t more discipline, it’s smaller steps.\n\n**Try this:**\n• Pick one fixed moment — like your morning coffee.\n• Keep it to **10 minutes**: one passage, one prayer, one action.\n• If you miss a day, don’t start over with guilt — just continue.\n\n“His compassions never fail. They are new every morning.” (Lamentations 3:22–23)\n\nIn the app, your **lamp** lights up each day you complete a devotional, and your streak grows. The lesson **“Morning With God”** (Habits of the Heart) can help you build the habit.",
    ],
  },
  {
    id: "salvation",
    kw: ["how to be saved", "be saved", "salvation", "accept jesus", "become a christian", "born again", "follow jesus", "give my life to", "go to heaven", "salvacao", "aceitar jesus"],
    answers: [
      "That’s the most important question there is — and the answer is good news.\n\n“For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.” (John 3:16)\n\n“If you declare with your mouth, ‘Jesus is Lord,’ and believe in your heart that God raised him from the dead, you will be saved.” (Romans 10:9)\n\nYou can talk to God right now, in your own words: tell Him you need Him, that you believe Jesus died and rose for you, and that you want to follow Him.\n\nI’d also encourage you to share this with a local church or a Christian friend — they can walk with you. The lesson **“The Invitation to Follow”** is a great next step.",
    ],
  },
  {
    id: "church",
    kw: ["church", "find a church", "congregation", "pastor", "community", "small group", "igreja"],
    answers: [
      "Faith grows best together. “Two are better than one… If either of them falls down, one can help the other up.” (Ecclesiastes 4:9–10)\n\n**One small step:** look for a Bible-teaching church near you and visit once this month — many have small groups during the week where it’s easier to connect.\n\nVEREDA is a daily companion, but it’s not meant to replace a church family or your pastor.",
    ],
  },
  {
    id: "verse",
    kw: ["verse", "scripture", "encouraging word", "word for today", "give me a verse", "bible verse", "versiculo", "palavra"],
    answers: [
      "Here’s a word for you today:\n\n“Because of the LORD’s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.” (Lamentations 3:22–23)\n\nWhatever yesterday looked like, today is a fresh start with God. Is there something specific you’d like a verse for — peace, strength, guidance, family?",
      "Here’s a verse to carry with you today:\n\n“Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.” (Proverbs 3:5–6)\n\nIs there something specific you’d like a verse for — peace, strength, guidance, family?",
      "Here’s a promise for today:\n\n“Peace I leave with you; my peace I give you… Do not let your hearts be troubled and do not be afraid.” (John 14:27)\n\nIs there something specific you’d like a verse for — peace, strength, guidance, family?",
    ],
  },

  // ---------- about the app ----------
  {
    id: "app_how",
    kw: ["how does the app work", "how does vereda work", "how to use", "journey", "devotional", "lesson", "today's lesson", "todays lesson", "unlock", "module", "trilha", "devocional"],
    answers: [
      "Here’s how VEREDA works:\n\n• **Journey** — one devotional unlocks each day. Each one has a prayer, today’s word, a short quiz and one practical action. Finish today’s to unlock tomorrow’s.\n• **Read or Listen** — you can read the passage or switch to Listen mode.\n• **Your lamp** — it lights up each day you complete a devotional, and your streak grows.\n• **Explore** — extra content and this assistant, whenever you need encouragement or a prayer.\n\nThe first module is **Rooted & Unshakable** — it starts with **“A Lamp for Your Path”**.",
    ],
  },
  {
    id: "app_lamp",
    kw: ["lamp", "streak", "points", "faith tree", "lampada", "sequencia"],
    answers: [
      "Your **lamp** is your daily streak 🪔. Each day you complete a devotional, it lights up and your streak grows. Tap the lamp at the top of the Journey to see your goal, your points and your faith tree.\n\nMissed a day? No guilt — just pick up where you left off. “His compassions never fail. They are new every morning.” (Lamentations 3:22–23)",
    ],
  },
  {
    id: "app_account",
    kw: ["cancel", "subscription", "refund", "charge", "charged", "billing", "payment", "login", "log in", "password", "account", "access", "cancelar", "assinatura", "reembolso", "senha"],
    answers: [
      "For subscription, billing, refunds or login questions, our support team will help you directly — I can’t see or change account details here.\n\nYou can reach them from the menu in the app (**Contact us**) or by email. You can also manage or cancel your purchase from the Hotmart purchase email you received.",
    ],
  },
  {
    id: "who_are_you", priority: 5,
    kw: ["who are you", "are you human", "are you real", "real person", "a real person", "talking to a person", "talking to a bot", "are you a bot", "are you ai", "are you a robot", "your name", "what are you", "quem e voce", "voce e humano"],
    answers: [
      "I’m VEREDA’s Spiritual Assistant — not a person. I share prepared answers grounded in Scripture to encourage you, pray with you and point you to the right part of your Journey. I’m not a pastor or counselor, so for big decisions or hard seasons, please also talk with someone you trust.",
    ],
  },
  {
    id: "greeting", priority: 1,
    kw: ["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "ola", "oi", "bom dia", "boa noite", "boa tarde", "hola"],
    answers: [
      "Hi! It’s good to have you here 😊 How is your heart today? You can ask me for a verse, a prayer, or share what’s on your mind — worry, family, work, faith… I’m here to walk with you.",
    ],
  },
  {
    id: "thanks", priority: 1,
    kw: ["thank you", "thanks", "thx", "amen", "obrigado", "obrigada", "gracias"],
    answers: [
      "Amen 🙏 I’m glad to walk with you. Come back anytime — and don’t forget today’s devotional in your Journey.",
      "You’re welcome! May God’s peace be with you today. I’m here whenever you need a verse or a prayer 🙏",
    ],
  },
];

export const PRAY_KW = ["pray for me", "pray with me", "can you pray", "please pray", "a prayer", "prayer for", "pray about", "pray", "ore por mim", "oracao", "orar"];
export const YES_KW = ["yes", "yes please", "please", "sure", "ok", "okay", "yeah", "yep", "sim", "pode", "claro"];

export const GENERIC_PRAYER = "Father, thank You for this moment. You know exactly what is on my heart, even what I can’t put into words. Draw near to me, give me Your peace, Your wisdom and Your strength for today, and help me trust You in every step. In Jesus’ name, Amen.";

export const FALLBACK = [
  "Thank you for sharing that with me. I want to make sure I understand — could you tell me a little more about what you’re going through?\n\nYou can also ask me for:\n• a **verse** for today\n• a **prayer** (for peace, family, work, health…)\n• help with **worry, fear, loneliness or forgiveness**\n• how to **read the Bible** or **pray**",
  "I hear you. While you tell me more, here’s a promise to hold on to: “The LORD himself goes before you and will be with you; he will never leave you nor forsake you.” (Deuteronomy 31:8)\n\nIs this about worry, family, work, faith, or something else? I’d also be glad to pray with you.",
];
