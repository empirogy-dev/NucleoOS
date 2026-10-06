import type { Manual } from "./tipos";

export const MANUAL_EN: Manual = {
  titulo: "The NucleoOS manual",
  intro: "Everything the app does, explained in order and in plain words. You do not need to read it all: find the section you care about and read only that one. If you have just arrived, the first three are enough to get going.",
  indice: "Contents",
  secciones: [
    {
      id: "que-es",
      titulo: "What NucleoOS is",
      parrafos: [
        "NucleoOS is a living agenda. Everything you record keeps its date: what you ate, how you slept, what you spent, how you trained, what you practiced, what you moved forward. Then the Review section brings all of it together and hands it back as something you can understand: your day, your week, your month, and the patterns between one area and another.",
        "The underlying idea is simple: record once, in the place it belongs, and let the app do the work of crossing the data. If you log a workout in Movement, your exercise habit gets marked, your minutes for the week go up, and the goal that depended on it advances, without you writing anything three times.",
        "This is not an app that scolds you. If you record nothing for a day, nothing happens: there are no streaks that punish you and no screens that ask you to account for yourself. It is built that way on purpose, because we made it thinking of people who end up getting guilt instead of order out of productivity apps.",
      ],
    },
    {
      id: "empezar",
      titulo: "Getting started",
      parrafos: [
        "When you create your account the app asks four short questions and nothing more. You can change every answer later, in Settings.",
      ],
      pasos: [
        "What your name is, or what you want the app to call you.",
        "What you want to sort out first: everything, your finances, your body or your head. This decides which sections you see at the start, so the menu does not shout fourteen things at you on day one. The rest switch on whenever you want, in Settings and then Modules.",
        "Where you live and which currency you handle your money in. This is only asked if you are going to use Finances. The country matters more than it looks: it decides what the app can offer you, because the automatic bank connection works in some countries and not yet in others.",
        "Where to start: the app suggests two or three concrete things based on what you chose, not a list of thirty.",
      ],
    },
    {
      id: "moverse",
      titulo: "Finding your way around",
      parrafos: [
        "The menu on the left is grouped by what each thing is for, not alphabetically: Overview to see the whole picture, Core for what holds up your body and your head, My life for what you administer, Inspiration for what moves you. If there are sections you do not need, you turn them off in Settings and the menu really does get shorter.",
        "Top right there are four buttons worth knowing on day one:",
      ],
      puntos: [
        "The bell, with your notices: payments coming due, people you have not spoken to in a while, things with a date.",
        "The palette, to choose the color theme you want to live in here.",
        "The question mark, which opens the guided tour. It has two options: get to know the whole app in seven steps, or have it explain the screen you are on.",
        "Settings, where you decide which app you have.",
      ],
    },
    {
      id: "ayuda-dentro",
      titulo: "The help that comes inside the app",
      parrafos: [
        "You do not have to come back to this manual for every question. The app explains itself at three levels, and it is worth knowing they exist:",
      ],
      puntos: [
        "The question mark next to each section's title. Press it and in two sentences it tells you what that section is for, which question about your life it answers. From there you can also ask for that screen's tour, which is three or four little windows pointing at what matters.",
        "The general tour, in the question mark on the top bar. Seven short steps that show you the whole app. You can skip it at any point, and if you skip it, it never comes back on its own.",
        "The bank statement import tour, the only one that walks beside you while you do something. It shows up the first time you open the import window, and you can also ask for it by hand with the link that says first time.",
      ],
    },
    {
      id: "inicio",
      titulo: "Home",
      parrafos: [
        "This is the screen where the day starts. It shows today's tasks, the pulse of your day, which are the numbers coming from Energy, Habits and Movement, and the compass, which is how your Direction goals are advancing.",
        "Nothing you see here is filled in by hand: it all builds itself from what you record in the rest of the app. The cards can be dragged, so put at the top what you actually look at and leave the rest below. The order is saved and follows you between devices.",
        "There is also quick capture, the button for writing something down without losing what you were doing. You write the idea, it gets saved, and you carry on. Later you decide whether it was a task, an expense or nothing.",
      ],
    },
    {
      id: "calendario",
      titulo: "Calendar",
      parrafos: [
        "Everything in your life that has a date, on one screen: your tasks, your payments, your appointments, the birthdays of your people, your work days and the progress on your goals.",
        "You move between months with the arrows next to the title, and the Today button brings you back where you were. Up top it says how many things the month you are looking at holds.",
        "Almost nothing is filled in here: it arrives on its own from the other modules. If the month looks empty it is because you have not recorded anything yet, not because something is left to set up.",
      ],
    },
    {
      id: "revision",
      titulo: "Review",
      parrafos: [
        "This is the section that turns what you recorded into clarity, and probably the reason recording is worth it at all. It has five tabs:",
      ],
      puntos: [
        "Day: the agenda of what actually happened, not of what you planned. What time you ate, when you moved, what you wrote down. It helps you reconstruct a strange day and understand what made it strange.",
        "Week and Month: the same thing zoomed out, to see trends instead of single days.",
        "Patterns: this one crosses modules. How your energy changes with how you sleep, what happens to your mood in the weeks you move, that kind of thing.",
        "Report: you choose a period and which areas go in, and out comes a document with charts and notes that you can print, save as PDF or export as a spreadsheet.",
      ],
    },
    {
      id: "finanzas",
      titulo: "Finances",
      parrafos: [
        "This is the biggest module, so it is explained in parts. What it is for: to know where your money goes and stop guessing.",
        "The tabs are grouped by what they are for. First the day to day, then what you own and what you owe, then what repeats, and at the end, kept separate, the setting up.",
      ],
      puntos: [
        "Overview: the month at a glance, with your income, your spending, your balance across accounts and your net worth.",
        "Transactions: your ledger. Everything that came in and went out, with its date, its category and its account.",
        "Accounts: your bank and cash accounts, with their balance.",
        "Debts and cards: what you owe, to whom, and what you have to pay.",
        "Subscriptions and instalments: the charges that bill themselves month after month.",
        "Goals: your savings goals.",
        "Report: the write-up that explains where the money went.",
        "Categories and tags: how you want to classify what is yours.",
        "Vehicle: if you have a work vehicle, its expenses and mileage kept apart.",
      ],
    },
    {
      id: "registrar-gasto",
      titulo: "Recording an expense or an income",
      parrafos: [
        "The Add button opens the window for writing down a transaction by hand. You write it once and it keeps its date, its category and its account.",
        "If you have the receipt in your hand, you can take a photo of it and let the app fill in the details. Check what it put before saving: automatic reading gets it right almost always, and almost always is not always.",
        "Receipts stay stored next to the transaction, so a year later you can look at the paper again without digging through a box.",
      ],
    },
    {
      id: "cartola",
      titulo: "Importing your bank statement",
      parrafos: [
        "This is the part that saves the most time and confuses people the most at first, so here it is in full.",
        "A bank statement is the file with all of a month's transactions that your bank gives you. It may be called statement, account activity or transaction history. It is not a screenshot of your bank's page and not an email: it is a file you download.",
      ],
      pasos: [
        "Log in to your bank and look for statement, account activity or transaction history. Pick the month you want and download the file.",
        "If your bank lets you choose the format, go for CSV or OFX, because those are read exactly. QFX, Excel and PDF also work. A PDF is read by artificial intelligence and then checked by you, because a PDF does not carry ordered data, it carries a picture of the paper.",
        "In the app, go to Finances and press Import statement.",
        "Tell it which account or card the statement belongs to, and which month. With that, the transactions get filed where they belong and the app can warn you if you upload the same month twice.",
        "Choose the file. You can upload several at once, up to six, for instance the account and the card for the same month.",
        "Check the list that appears. Each line is a transaction with its date, its description and its amount. Nothing is saved yet: this is a preview.",
        "Look at the duplicates. The app compares against what you already have and leaves anything that was already there unchecked, so it does not get counted twice. This happens a lot when you wrote something down by hand and later upload the statement for the same month.",
        "Press the button at the end, which says how many transactions are going in. Only then is anything saved.",
      ],
      puntos: [
        "If something was read wrong, you fix it later in Transactions. There is no need to import again.",
        "The automatic bank connection, which skips this whole process, works for now with banks in Canada and the United States. In the rest of the countries you import the statement, which does the same with one extra step.",
      ],
    },
    {
      id: "clasificar",
      titulo: "Categories and tags",
      parrafos: [
        "The category answers what kind of expense it is: groceries, rent, transport. Every transaction carries one.",
        "The tag answers something else: what it was for. You can tag an expense as business, as personal, as a particular trip, as a project. One transaction can carry several, and that is what lets you answer questions a category alone cannot, for instance what that trip really cost you across fuel, food and lodging.",
        "If you work for yourself, tagging the business side from the start means that at the end of the year your tax summary is already done, instead of spending a weekend reconstructing it.",
      ],
    },
    {
      id: "deudas",
      titulo: "Accounts, debts and cards",
      parrafos: [
        "Accounts are where your money lives, cash included. Each one keeps its own currency: if you have accounts in two countries, NucleoOS never mixes them or adds them up as if they were the same thing.",
        "Debts are what you owe, with their institution, their amount and what you have to pay. Paying a card is not a new expense: it is moving money from an account to the card, and the app treats it that way so your spending for the month does not get counted twice.",
        "The net worth you see in Overview is simply what you have minus what you owe. It is the most honest number on the screen and sometimes the most uncomfortable.",
      ],
    },
    {
      id: "recurrentes",
      titulo: "Subscriptions and instalments",
      parrafos: [
        "The app looks at your transactions and suggests which ones look like charges that repeat on their own every month: streaming, the gym, insurance, instalments.",
        "They are suggestions, not conclusions, and you confirm or discard each one. This matters: an automatic detector that nobody reviews ends up declaring that the supermarket is a subscription, and with that the report's numbers stop being any use. What you confirm is what the report uses.",
        "It is worth doing once, calmly, because this is usually where the money that leaves without anyone looking shows up.",
      ],
    },
    {
      id: "reporte",
      titulo: "The Finances report",
      parrafos: [
        "The Report tab is the financial coach. You choose a period and it shows you, with charts, where the money went:",
      ],
      puntos: [
        "Which categories it went to, sorted by size, with how much each one changed against the previous period.",
        "How much of your spending is charges that bill themselves, from the ones you confirmed in Subscriptions and instalments.",
        "Where there is money you could recover, with a realistic range instead of a promise.",
        "How you are doing month by month, to see whether the trend is going anywhere.",
      ],
    },
    {
      id: "energia",
      titulo: "Energy",
      parrafos: [
        "To understand why some days you feel good and others you do not. Water, food, sleep, your cycle, recovery and your clinical health records all live here.",
        "Recording takes seconds: glasses of water and your energy level are one tap each. Meals can be photographed and the app estimates calories and protein. It is a guide, not a scale: it works for the trend, not for weighing every item.",
        "Fasting only appears if you say you fast. The app asks once and respects the answer, because marking someone as fasting when they simply have not eaten yet does nobody any good.",
        "With two weeks of records, Review can already tell you how your energy relates to how you sleep and how much you move.",
      ],
    },
    {
      id: "mente",
      titulo: "Mind",
      parrafos: [
        "To slow down and get out of your head whatever is spinning in there.",
        "Practices and Sadhana are breathing exercises and meditations that run on their own timer and bell. You pick one, you do it, and it gets recorded with its minutes.",
        "The journal is for writing. If you do not know where to start, the app offers you a question. What you write is yours: it never leaves the app, unless you tick the box when exporting a report, and that box comes switched off.",
        "History keeps every practice with its minutes, and Insights looks for what repeats in what you write. Neither asks anything of you: they fill up on their own.",
      ],
    },
    {
      id: "movimiento",
      titulo: "Movement",
      parrafos: [
        "Three ways to move your body, depending on the day: Gentle practice to loosen up when you are tense, Training for the stuff that really tires you out, and Programs to follow a plan over several weeks without having to invent it every day.",
        "You can follow a routine step by step or simply note what you did and for how many minutes. Both count the same.",
        "Everything you record here lands elsewhere too: it shows up in Energy, it marks your exercise habit, and it feeds the Direction goals that depend on movement.",
      ],
    },
    {
      id: "habitos",
      titulo: "Habits",
      parrafos: [
        "There are three different things here and it is worth not mixing them up. A habit is something you want to keep up for good. A challenge has a start and an end, like thirty days without sugar. A routine is a sequence of steps you go through in one go.",
        "You mark it with one tap and the square fills with the habit's color. The grid starts the day you created it, not before, so the streaks do not lie.",
        "Some mark themselves. If you log a workout in Movement, your exercise habit gets marked without you doing anything else.",
      ],
    },
    {
      id: "relaciones",
      titulo: "Relationships",
      parrafos: [
        "To keep in sight the people who matter to you when life gets heavy.",
        "You note each person and how many days you would like to go between talks. Seven for your mum, ninety for a friend from university. The app has no opinion about the number, it just tells you when it goes over.",
        "You also record the moments: a call, a coffee, something they told you. It helps you remember what matters next time you meet, which is the whole point. Any birthdays you note show up by themselves in the Calendar.",
      ],
    },
    {
      id: "direccion",
      titulo: "Direction",
      parrafos: [
        "To turn what you want into something that actually moves. Active goals is what you are chasing now, Next steps is what this week calls for, Wins is what you already moved, and Achieved is the tab you look at on the days when you feel like nothing is moving.",
        "Every goal breaks into milestones, and the percentage comes from them. That is the difference between learn English and something you can actually start on Tuesday.",
        "A goal can feed itself from what you already record: movement sessions, days of a habit, hours on a project, contributions to savings. It advances while you live, without you going in to update it.",
      ],
    },
    {
      id: "trabajo",
      titulo: "Work",
      parrafos: [
        "To know where your time actually went, not just where you thought it went.",
        "Each project carries its tasks and the progress is calculated from what you tick off. You record your workday and the focus blocks stay tied to the project, so at the end of the month the number exists instead of being an impression.",
        "When you close the workday you can note how it went. After a few weeks of that you can see which days leave you well and which drain you, which are not always the ones you would guess.",
      ],
    },
    {
      id: "aprendizaje",
      titulo: "Learning",
      parrafos: [
        "So that what you learn does not get lost in loose notebooks, and so you do not start from scratch wondering what to read.",
        "Notes live in notebooks by topic, so a note from a course does not end up mixed with a recipe. The search looks inside all your notes at once, so it does not matter which notebook you left it in. That is the difference between saving something and being able to find it a year later.",
        "The library is a different thing, and it is curated: books chosen for what they actually give an ADHD and ADD brain, not for being in fashion. Each one carries why it is there, its main ideas and concrete exercises, so you take away what it has even if you never buy it. You mark what you want to read and what you have read, with no books-per-year target and nothing that scolds you.",
      ],
    },
    {
      id: "vision",
      titulo: "Vision",
      parrafos: [
        "To remind you why you do all the rest. Dreams is the list of what you want to live, Vision board is for seeing it in images, and Ideal life is the text where you describe the day you want to have.",
        "Nothing here has a date or chases you, on purpose. The day a dream stops being a dream, you move it to Direction and only then does it become a goal with steps.",
      ],
    },
    {
      id: "informes",
      titulo: "Taking your data to someone else",
      parrafos: [
        "There are two reports and both are built to be read by someone who does not use the app.",
        "The Finances one, in the Report tab, is what you would take to an accountant or an adviser: charts, categories, recurring charges and where there is money to recover. The Review one, in its Report tab, is what you would take to a psychologist, a doctor or a nutritionist: energy, movement, habits, mind and direction over the period you choose.",
        "Both come out in three formats. The report opens ready to print, and from there your browser saves it as PDF. The spreadsheet comes out as CSV, for anyone who wants to run their own numbers. And the bundle brings everything together in a ZIP.",
      ],
      puntos: [
        "Every average says how many days it was calculated over, and days without records never count as zero. A report claiming you slept zero hours on the nights you wrote nothing down would be worse than having no report.",
        "The crossings between areas publish how many days back them up, and get marked as thin when there are few. That way whoever reads it knows how much weight to give it.",
        "Your journal text never leaves, unless you tick a box that comes switched off.",
      ],
    },
    {
      id: "privacidad",
      titulo: "Your data and your privacy",
      parrafos: [
        "Your data is yours and the app is built so you can take it out whenever you want, in formats anyone can open. That is on purpose: an app where your data gets trapped is not a safe place to keep your life.",
        "There is a private mode in Finances, the eye button, which covers every amount on screen. It is for showing the app to someone, or using it somewhere with people around, without showing your money. What you export carries the real figures: private mode is for the screen, not for the reports.",
        "The terms and the privacy policy can be read in full at nucleoos.app/terms and nucleoos.app/privacy.",
      ],
    },
    {
      id: "ajustes",
      titulo: "Settings",
      parrafos: [
        "This is where you decide which app you have. Your country and your currency, which sections you see, the color theme, the language, and the features that only suit some people, like fasting or the work vehicle.",
        "The country is the one that changes the most: it decides what the app can offer you, so you are not offered something that will not work where you live.",
        "From here you can also see the full guided tour again, as many times as you want.",
      ],
    },
    {
      id: "idiomas",
      titulo: "Languages",
      parrafos: [
        "The app is in Spanish, English and Portuguese, and you switch in Settings. The whole guided tour, the reports and the notices are in all three.",
        "This manual is also in French, for anyone who would rather read it that way, even though the application itself is not translated into that language yet.",
      ],
    },
    {
      id: "problemas",
      titulo: "If something is not working",
      parrafos: [
        "The things people ask most, with what is usually the answer:",
      ],
      puntos: [
        "The guided tour does not come up for me. If you skipped it once, the app respects that and it never appears on its own again. You can ask for it by hand from the question mark on the top bar, or in Settings.",
        "The app offers to connect my bank and I do not live in Canada or the United States. Check your country in Settings: with the country set, the app stops offering it and shows you the statement import instead, which does the same job.",
        "I uploaded my statement and duplicate transactions appeared. The app marks them and leaves them unchecked on its own. If you had already imported that month, check before confirming: duplicates come with a warning.",
        "My bank's PDF was read wrong. A PDF does not carry data, it carries a picture of the paper, so the reading is an estimate. If your bank offers CSV or OFX, use those. Whatever came out wrong is fixed in Transactions without importing again.",
        "It tells me a normal purchase is a subscription. Go into Subscriptions and instalments and discard it. The report uses what you confirmed, not what the app guessed.",
        "My report says I have too little data. That is literal and deliberate: with few days recorded an average means nothing, and we would rather say so than invent a number that looks good.",
      ],
    },
    {
      id: "ayuda",
      titulo: "If you need help",
      parrafos: [
        "If something is not here, or something does not work the way this manual says, write to us at hola@nucleoos.app. Saying which screen it was and what you expected to happen helps enormously.",
      ],
    },
  ],
};
