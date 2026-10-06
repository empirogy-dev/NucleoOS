import type { Manual } from "./tipos";

// El francés es el único idioma donde el manual existe y la app todavía no.
// Por eso cada pantalla se nombra en francés con su nombre real entre
// paréntesis: sin eso, el manual mandaría a buscar botones que no existen.
export const MANUAL_FR: Manual = {
  titulo: "Manuel de NucleoOS",
  intro: "Tout ce que fait l'application, expliqué dans l'ordre et en mots simples. Pas besoin de tout lire : trouvez la section qui vous intéresse et lisez celle-là. Si vous venez d'arriver, les trois premières suffisent pour démarrer.",
  avisoIdioma: "L'application elle-même n'est pas encore traduite en français : elle existe en espagnol, en anglais et en portugais. Ce manuel donne donc le nom de chaque écran en français, suivi entre parenthèses de son libellé anglais, celui que vous verrez à l'écran.",
  indice: "Sommaire",
  secciones: [
    {
      id: "que-es",
      titulo: "Ce qu'est NucleoOS",
      parrafos: [
        "NucleoOS est un agenda vivant. Tout ce que vous notez garde sa date : ce que vous avez mangé, votre sommeil, vos dépenses, vos entraînements, vos pratiques, vos avancées. Ensuite la section Revue (Review) rassemble tout cela et vous le rend sous une forme compréhensible : votre journée, votre semaine, votre mois et les liens entre un domaine et un autre.",
        "L'idée de fond est simple : noter une seule fois, au bon endroit, et laisser l'application croiser les données. Si vous enregistrez une séance dans Mouvement (Movement), votre habitude d'exercice est cochée, vos minutes de la semaine montent et l'objectif qui en dépendait avance, sans que vous ayez rien écrit trois fois.",
        "Ce n'est pas une application qui vous fait la morale. Si un jour vous ne notez rien, il ne se passe rien : aucune série à ne pas briser, aucun écran qui vous demande des comptes. C'est voulu, parce qu'elle a été faite en pensant aux personnes à qui les applications de productivité finissent par donner de la culpabilité plutôt que de l'ordre.",
      ],
    },
    {
      id: "empezar",
      titulo: "Premiers pas",
      parrafos: [
        "À la création de votre compte, l'application pose quatre questions courtes et rien de plus. Toutes les réponses se changent plus tard, dans Réglages (Settings).",
      ],
      pasos: [
        "Votre prénom, ou la façon dont vous voulez que l'application vous appelle.",
        "Ce que vous voulez mettre en ordre d'abord : tout, vos finances, votre corps ou votre tête. Cela décide des sections visibles au départ, pour que le menu ne vous jette pas quatorze choses au visage le premier jour. Les autres s'allument quand vous voulez, dans Réglages puis Modules.",
        "Où vous vivez et dans quelle monnaie vous gérez votre argent. Cette question n'est posée que si vous allez utiliser Finances. Le pays compte plus qu'il n'y paraît : il détermine ce que l'application peut vous proposer, car la connexion automatique à la banque fonctionne dans certains pays et pas encore dans d'autres.",
        "Par où commencer : l'application propose deux ou trois choses concrètes selon votre choix, pas une liste de trente.",
      ],
    },
    {
      id: "moverse",
      titulo: "Se repérer dans l'application",
      parrafos: [
        "Le menu de gauche est regroupé par usage, pas par ordre alphabétique : Panorama (Overview) pour voir l'ensemble, Noyau (Core) pour ce qui soutient votre corps et votre tête, Ma vie (My life) pour ce que vous administrez, Inspiration pour ce qui vous met en mouvement. Les sections qui ne vous servent pas s'éteignent dans Réglages, et le menu raccourcit vraiment.",
        "En haut à droite, quatre boutons valent la peine d'être connus dès le premier jour :",
      ],
      puntos: [
        "La cloche, avec vos alertes : paiements qui arrivent, personnes à qui vous n'avez pas parlé depuis longtemps, choses datées.",
        "La palette, pour choisir le thème de couleurs dans lequel vous voulez vivre ici.",
        "Le point d'interrogation, qui ouvre la visite guidée. Deux options : découvrir toute l'application en sept étapes, ou se faire expliquer l'écran où vous êtes.",
        "Les réglages, où vous décidez quelle application vous avez.",
      ],
    },
    {
      id: "ayuda-dentro",
      titulo: "L'aide intégrée à l'application",
      parrafos: [
        "Pas besoin de revenir à ce manuel pour chaque question. L'application s'explique seule à trois niveaux, et il vaut mieux savoir qu'ils existent :",
      ],
      puntos: [
        "Le point d'interrogation à côté du titre de chaque section. Vous appuyez et il dit en deux phrases à quoi sert cette section, à quelle question de votre vie elle répond. De là vous pouvez aussi demander la visite de cet écran, trois ou quatre petites fenêtres qui pointent l'essentiel.",
        "La visite générale, dans le point d'interrogation de la barre du haut. Sept étapes courtes qui montrent toute l'application. Vous pouvez passer à tout moment, et si vous passez, elle ne revient plus d'elle-même.",
        "La visite de l'import du relevé bancaire, la seule qui vous accompagne pendant que vous faites quelque chose. Elle apparaît la première fois que vous ouvrez la fenêtre d'import, et se redemande à la main avec le lien qui parle de première fois.",
      ],
    },
    {
      id: "inicio",
      titulo: "Accueil (Home)",
      parrafos: [
        "C'est l'écran où la journée commence. Il montre vos tâches du jour, le pouls de la journée, c'est-à-dire les chiffres qui viennent d'Énergie (Energy), Habitudes (Habits) et Mouvement (Movement), et la boussole, qui est l'avancement de vos objectifs de Direction.",
        "Rien ici ne se remplit à la main : tout se construit à partir de ce que vous notez dans le reste de l'application. Les cartes se déplacent, donc mettez en haut ce que vous regardez vraiment et laissez le reste en bas. L'ordre est enregistré et vous suit d'un appareil à l'autre.",
        "Il y a aussi la saisie rapide, le bouton pour noter quelque chose sans perdre ce que vous étiez en train de faire. Vous écrivez l'idée, elle est enregistrée, et vous continuez. Vous déciderez plus tard si c'était une tâche, une dépense ou rien.",
      ],
    },
    {
      id: "calendario",
      titulo: "Calendrier (Calendar)",
      parrafos: [
        "Tout ce qui a une date dans votre vie, sur un seul écran : vos tâches, vos paiements, vos rendez-vous, les anniversaires de vos proches, vos journées de travail et les avancées de vos objectifs.",
        "On passe d'un mois à l'autre avec les flèches du titre, et le bouton Aujourd'hui (Today) vous ramène où vous étiez. En haut s'affiche le nombre de choses que contient le mois affiché.",
        "Presque rien ne se remplit ici : tout arrive seul depuis les autres modules. Si le mois paraît vide, c'est que vous n'avez encore rien noté, pas qu'il reste quelque chose à configurer.",
      ],
    },
    {
      id: "revision",
      titulo: "Revue (Review)",
      parrafos: [
        "C'est la section qui transforme ce que vous notez en quelque chose de clair, et probablement la raison pour laquelle noter vaut la peine. Cinq onglets :",
      ],
      puntos: [
        "Jour (Day) : l'agenda de ce qui s'est passé, pas de ce que vous aviez prévu. À quelle heure vous avez mangé, quand vous avez bougé, ce que vous avez noté. Utile pour reconstituer une journée étrange et comprendre ce qui l'a rendue étrange.",
        "Semaine et Mois (Week, Month) : la même chose avec plus de recul, pour voir des tendances au lieu de journées isolées.",
        "Tendances (Patterns) : celui-ci croise les modules. Comment votre énergie change selon votre sommeil, ce qui arrive à votre humeur les semaines où vous bougez, ce genre de chose.",
        "Rapport (Report) : vous choisissez une période et les domaines concernés, et il en sort un document avec graphiques et observations, à imprimer, enregistrer en PDF ou exporter en tableur.",
      ],
    },
    {
      id: "finanzas",
      titulo: "Finances",
      parrafos: [
        "C'est le plus gros module, donc il est expliqué par morceaux. À quoi il sert : savoir où part votre argent et arrêter de deviner.",
        "Les onglets sont regroupés par usage. D'abord le quotidien, puis ce que vous avez et ce que vous devez, puis ce qui se répète, et à la fin, à part, la configuration.",
      ],
      puntos: [
        "Résumé (Overview) : le mois d'un coup d'œil, avec vos revenus, vos dépenses, votre solde sur les comptes et votre patrimoine net.",
        "Transactions : votre registre. Tout ce qui est entré et sorti, avec sa date, sa catégorie et son compte.",
        "Comptes (Accounts) : vos comptes bancaires et vos espèces, avec leur solde.",
        "Dettes et cartes (Debts and cards) : ce que vous devez, à qui, et ce qu'il faut payer.",
        "Abonnements et mensualités (Subscriptions and instalments) : les prélèvements qui se font tout seuls chaque mois.",
        "Objectifs (Goals) : vos objectifs d'épargne.",
        "Rapport (Report) : le document qui explique où est parti l'argent.",
        "Catégories et étiquettes (Categories and tags) : comment vous voulez classer ce qui est à vous.",
        "Véhicule (Vehicle) : si vous avez un véhicule de travail, ses dépenses et ses kilomètres à part.",
      ],
    },
    {
      id: "registrar-gasto",
      titulo: "Noter une dépense ou un revenu",
      parrafos: [
        "Le bouton Ajouter (Add) ouvre la fenêtre pour saisir une opération à la main. Vous l'écrivez une fois et elle garde sa date, sa catégorie et son compte.",
        "Si vous avez le ticket sous la main, vous pouvez le photographier et laisser l'application remplir les champs. Vérifiez avant d'enregistrer : la lecture automatique tombe juste presque toujours, et presque toujours n'est pas toujours.",
        "Les tickets restent enregistrés à côté de l'opération, donc un an plus tard vous pouvez revoir le papier sans fouiller dans une boîte.",
      ],
    },
    {
      id: "cartola",
      titulo: "Importer le relevé bancaire",
      parrafos: [
        "C'est la partie qui fait gagner le plus de temps et celle qui déroute le plus au début, donc la voici en entier.",
        "Un relevé bancaire est le fichier contenant toutes les opérations d'un mois, que votre banque vous fournit. On l'appelle aussi relevé de compte ou, en anglais, statement. Ce n'est pas une capture d'écran de votre banque ni un courriel : c'est un fichier que l'on télécharge.",
      ],
      pasos: [
        "Connectez-vous à votre banque et cherchez relevé, relevé de compte, opérations ou statement. Choisissez le mois voulu et téléchargez le fichier.",
        "Si votre banque laisse choisir le format, prenez CSV ou OFX : ceux-là sont lus à l'exact. QFX, Excel et PDF fonctionnent aussi. Le PDF est lu par l'intelligence artificielle et vérifié ensuite par vous, parce qu'un PDF ne contient pas des données ordonnées, il contient une image du papier.",
        "Dans l'application, allez dans Finances et appuyez sur Importer le relevé (Import statement).",
        "Indiquez de quel compte ou de quelle carte vient le relevé, et de quel mois. Ainsi les opérations sont classées au bon endroit et l'application peut vous avertir si vous chargez deux fois le même mois.",
        "Choisissez le fichier. Vous pouvez en charger plusieurs à la fois, jusqu'à six, par exemple le compte et la carte du même mois.",
        "Vérifiez la liste qui apparaît. Chaque ligne est une opération avec sa date, son libellé et son montant. Rien n'est encore enregistré : c'est un aperçu.",
        "Regardez les doublons. L'application compare avec ce que vous avez déjà et laisse décoché ce qui y était déjà, pour ne pas compter deux fois. Cela arrive souvent quand vous avez noté quelque chose à la main puis chargé le relevé du même mois.",
        "Appuyez sur le bouton du bas, qui indique combien d'opérations vont entrer. C'est seulement là que tout est enregistré.",
      ],
      puntos: [
        "Si quelque chose a été mal lu, cela se corrige ensuite dans Transactions. Pas besoin de réimporter.",
        "La connexion automatique à la banque, qui évite toute cette démarche, fonctionne pour l'instant avec les banques du Canada et des États-Unis. Dans les autres pays on importe le relevé, ce qui fait la même chose avec une étape de plus.",
      ],
    },
    {
      id: "clasificar",
      titulo: "Catégories et étiquettes",
      parrafos: [
        "La catégorie répond à la question du type de dépense : courses, loyer, transport. Chaque opération en porte une.",
        "L'étiquette répond à autre chose : à quoi cela servait. Vous pouvez étiqueter une dépense comme professionnelle, personnelle, liée à un voyage précis, liée à un projet. Une même opération peut en porter plusieurs, et c'est ce qui permet de répondre à des questions que la catégorie seule ne couvre pas, par exemple ce que ce voyage vous a réellement coûté entre carburant, repas et logement.",
        "Si vous travaillez à votre compte, étiqueter le professionnel dès le début veut dire qu'en fin d'année le récapitulatif fiscal est déjà fait, au lieu de passer un week-end à le reconstituer.",
      ],
    },
    {
      id: "deudas",
      titulo: "Comptes, dettes et cartes",
      parrafos: [
        "Les comptes sont là où vit votre argent, espèces comprises. Chacun garde sa monnaie : si vous avez des comptes dans deux pays, NucleoOS ne les mélange jamais et ne les additionne pas comme s'ils étaient la même chose.",
        "Les dettes sont ce que vous devez, avec l'établissement, le montant et ce qu'il faut payer. Payer une carte n'est pas une nouvelle dépense : c'est déplacer de l'argent d'un compte vers la carte, et l'application le traite ainsi pour que vos dépenses du mois ne soient pas comptées deux fois.",
        "Le patrimoine net affiché dans Résumé est simplement ce que vous avez moins ce que vous devez. C'est le chiffre le plus honnête de l'écran, et parfois le plus inconfortable.",
      ],
    },
    {
      id: "recurrentes",
      titulo: "Abonnements et mensualités",
      parrafos: [
        "L'application regarde vos opérations et propose celles qui ressemblent à des prélèvements qui se répètent seuls chaque mois : streaming, salle de sport, assurances, mensualités.",
        "Ce sont des propositions, pas des conclusions, et vous confirmez ou écartez chacune. C'est important : un détecteur automatique que personne ne relit finit par déclarer que le supermarché est un abonnement, et à partir de là les chiffres du rapport ne servent plus à rien. Ce que vous confirmez est ce que le rapport utilise.",
        "Cela vaut la peine de le faire une fois, calmement, parce que c'est là qu'apparaît d'habitude l'argent qui s'en va sans que personne ne le regarde.",
      ],
    },
    {
      id: "reporte",
      titulo: "Le rapport de Finances",
      parrafos: [
        "L'onglet Rapport (Report) est le coach financier. Vous choisissez une période et il vous montre, avec des graphiques, où est parti l'argent :",
      ],
      puntos: [
        "Dans quelles catégories, classées par taille, avec l'écart de chacune par rapport à la période précédente.",
        "Quelle part de vos dépenses correspond à des prélèvements automatiques, parmi ceux que vous avez confirmés dans Abonnements et mensualités.",
        "Où il y a de l'argent à récupérer, avec une fourchette réaliste plutôt qu'une promesse.",
        "Comment vous évoluez mois par mois, pour voir si la tendance va quelque part.",
      ],
    },
    {
      id: "energia",
      titulo: "Énergie (Energy)",
      parrafos: [
        "Pour comprendre pourquoi certains jours vont bien et d'autres non. L'eau, les repas, le sommeil, le cycle, la récupération et vos données de santé clinique vivent ici.",
        "Noter prend quelques secondes : les verres d'eau et votre niveau d'énergie se marquent d'un geste. Les repas peuvent être photographiés et l'application estime les calories et les protéines. C'est un repère, pas une balance : cela sert à voir la tendance, pas à peser chaque chose.",
        "Le jeûne n'apparaît que si vous dites que vous jeûnez. L'application demande une fois et respecte la réponse, parce que marquer un jeûne chez quelqu'un qui n'a simplement pas encore mangé n'aide personne.",
        "Avec deux semaines de notes, Revue peut déjà vous dire comment votre énergie se relie à votre sommeil et à votre activité.",
      ],
    },
    {
      id: "mente",
      titulo: "Esprit (Mind)",
      parrafos: [
        "Pour baisser le régime et sortir de la tête ce qui y tourne en rond.",
        "Pratiques (Practices) et Sadhana sont des respirations et des méditations qui tournent avec leur propre minuteur et leur cloche. Vous en choisissez une, vous la faites, et elle est enregistrée avec ses minutes.",
        "Le journal (Journal) est pour écrire. Si vous ne savez pas par où commencer, l'application vous propose une question. Ce que vous écrivez est à vous : cela ne quitte jamais l'application, sauf si vous cochez la case en exportant un rapport, et cette case est décochée par défaut.",
        "Historique (History) garde chaque pratique avec ses minutes, et Insights cherche ce qui revient dans ce que vous écrivez. Aucun des deux ne vous demande quoi que ce soit : ils se remplissent seuls.",
      ],
    },
    {
      id: "movimiento",
      titulo: "Mouvement (Movement)",
      parrafos: [
        "Trois façons de bouger, selon le jour : Pratique douce (Gentle practice) pour relâcher quand c'est tendu, Entraînement (Training) pour ce qui fatigue vraiment, et Programmes (Programs) pour suivre un plan sur plusieurs semaines sans avoir à l'inventer chaque jour.",
        "Vous pouvez suivre une séance pas à pas ou simplement noter ce que vous avez fait et combien de minutes. Les deux comptent pareil.",
        "Tout ce que vous notez ici atterrit ailleurs aussi : cela apparaît dans Énergie, coche votre habitude d'exercice et alimente les objectifs de Direction qui dépendent du mouvement.",
      ],
    },
    {
      id: "habitos",
      titulo: "Habitudes (Habits)",
      parrafos: [
        "Il y a trois choses différentes ici et il vaut mieux ne pas les confondre. Une habitude est quelque chose que vous voulez tenir dans la durée. Un défi (Challenge) a un début et une fin, comme trente jours sans sucre. Une routine est une suite d'étapes que vous enchaînez d'un coup.",
        "On la coche d'un geste et la case se remplit de la couleur de l'habitude. La grille commence le jour où vous l'avez créée, pas avant, donc les séries ne mentent pas.",
        "Certaines se cochent toutes seules. Si vous enregistrez une séance dans Mouvement, votre habitude d'exercice est cochée sans rien faire de plus.",
      ],
    },
    {
      id: "relaciones",
      titulo: "Relations (Relationships)",
      parrafos: [
        "Pour ne pas perdre de vue les gens qui vous importent quand la vie devient dense.",
        "Vous notez chaque personne et tous les combien de jours vous aimeriez lui parler. Sept pour votre mère, quatre-vingt-dix pour un ami de la fac. L'application ne juge pas le chiffre, elle vous prévient seulement quand c'est dépassé.",
        "Vous notez aussi les moments : un appel, un café, quelque chose qu'on vous a raconté. Cela sert à vous rappeler l'essentiel la prochaine fois que vous vous voyez, et c'est tout le propos. Les anniversaires que vous notez apparaissent seuls dans le Calendrier.",
      ],
    },
    {
      id: "direccion",
      titulo: "Direction",
      parrafos: [
        "Pour transformer ce que vous voulez en quelque chose qui avance vraiment. Objectifs actifs (Active goals) est ce que vous poursuivez maintenant, Prochaines étapes (Next steps) est ce qui est à faire cette semaine, Avancées (Wins) est ce que vous avez déjà bougé, et Atteints (Achieved) est l'onglet que l'on regarde les jours où l'on a l'impression de ne rien avancer.",
        "Chaque objectif se découpe en jalons, et le pourcentage vient d'eux. C'est la différence entre apprendre l'anglais et quelque chose que l'on peut commencer mardi.",
        "Un objectif peut se nourrir seul de ce que vous notez déjà : séances de mouvement, jours d'une habitude, heures sur un projet, versements sur une épargne. Il avance pendant que vous vivez, sans que vous entriez le mettre à jour.",
      ],
    },
    {
      id: "trabajo",
      titulo: "Travail (Work)",
      parrafos: [
        "Pour savoir où votre temps est réellement passé, et pas seulement où vous croyiez qu'il passait.",
        "Chaque projet porte ses tâches et l'avancement se calcule à partir de ce que vous cochez. Vous notez votre journée et les blocs de concentration restent liés au projet, donc à la fin du mois le chiffre existe au lieu d'être une impression.",
        "En clôturant la journée vous pouvez noter comment elle s'est passée. Après quelques semaines, on voit quels jours vous laissent bien et lesquels vous vident, et ce ne sont pas toujours ceux que l'on croit.",
      ],
    },
    {
      id: "aprendizaje",
      titulo: "Apprentissage (Learning)",
      parrafos: [
        "Pour que ce que vous apprenez ne se perde pas dans des carnets épars.",
        "Les notes vivent dans des carnets par thème, pour qu'une note de cours ne finisse pas mélangée à une recette. La recherche regarde dans toutes vos notes à la fois, donc peu importe dans quel carnet vous l'avez laissée. C'est la différence entre garder quelque chose et pouvoir le retrouver un an plus tard.",
        "La bibliothèque (Library) est à part : ce que vous voulez lire et ce que vous avez lu, avec la date. Aucun objectif de livres par an, rien qui vous fasse la morale.",
      ],
    },
    {
      id: "vision",
      titulo: "Vision",
      parrafos: [
        "Pour vous rappeler pourquoi vous faites tout le reste. Rêves (Dreams) est la liste de ce que vous voulez vivre, Vision board sert à le voir en images, et Vie idéale (Ideal life) est le texte où vous décrivez la journée que vous voulez avoir.",
        "Ici rien n'a de date et rien ne vous poursuit, volontairement. Le jour où un rêve cesse d'être un rêve, vous le passez dans Direction et c'est seulement là qu'il devient un objectif avec des étapes.",
      ],
    },
    {
      id: "informes",
      titulo: "Montrer vos données à quelqu'un d'autre",
      parrafos: [
        "Il y a deux rapports et les deux sont faits pour être lus par quelqu'un qui n'utilise pas l'application.",
        "Celui de Finances, dans l'onglet Rapport, est celui que vous apporteriez à un comptable ou à un conseiller : graphiques, catégories, prélèvements récurrents et argent à récupérer. Celui de Revue, dans son onglet Rapport, est celui que vous apporteriez à un psychologue, à un médecin ou à une diététicienne : énergie, mouvement, habitudes, esprit et direction sur la période choisie.",
        "Les deux sortent en trois formats. Le rapport s'ouvre prêt à imprimer, et de là le navigateur l'enregistre en PDF. Le tableur sort en CSV, pour qui veut faire ses propres calculs. Et le lot rassemble tout dans un ZIP.",
      ],
      puntos: [
        "Chaque moyenne indique sur combien de jours elle a été calculée, et les jours sans note ne comptent jamais pour zéro. Un rapport affirmant que vous avez dormi zéro heure les nuits où vous n'avez rien noté serait pire que pas de rapport du tout.",
        "Les croisements entre domaines indiquent combien de jours les soutiennent, et sont signalés comme fragiles quand ils sont peu nombreux. Ainsi la personne qui lit sait quel poids leur donner.",
        "Le texte de votre journal ne sort jamais, sauf si vous cochez une case décochée par défaut.",
      ],
    },
    {
      id: "privacidad",
      titulo: "Vos données et votre vie privée",
      parrafos: [
        "Vos données sont à vous et l'application est faite pour que vous puissiez les sortir quand vous voulez, dans des formats que tout le monde ouvre. C'est volontaire : une application où vos données restent prisonnières n'est pas un endroit sûr pour y mettre sa vie.",
        "Il y a un mode privé dans Finances, le bouton en forme d'œil, qui masque tous les montants à l'écran. Utile pour montrer l'application à quelqu'un, ou pour s'en servir dans un lieu avec du monde autour, sans montrer son argent. Ce que vous exportez contient les chiffres réels : le mode privé est pour l'écran, pas pour les rapports.",
        "Les conditions et la politique de confidentialité se lisent en entier sur nucleoos.app/terms et nucleoos.app/privacy.",
      ],
    },
    {
      id: "ajustes",
      titulo: "Réglages (Settings)",
      parrafos: [
        "C'est ici que vous décidez quelle application vous avez. Votre pays et votre monnaie, les sections visibles, le thème de couleurs, la langue, et les fonctions qui ne servent qu'à certaines personnes, comme le jeûne ou le véhicule de travail.",
        "Le pays est ce qui change le plus de choses : il détermine ce que l'application peut vous proposer, pour ne pas vous offrir quelque chose qui ne marchera pas là où vous vivez.",
        "D'ici vous pouvez aussi revoir la visite guidée complète, autant de fois que vous voulez.",
      ],
    },
    {
      id: "idiomas",
      titulo: "Langues",
      parrafos: [
        "L'application existe en espagnol, en anglais et en portugais, et la langue se change dans Réglages. Toute la visite guidée, les rapports et les alertes existent dans ces trois langues.",
        "Ce manuel existe en plus en français. L'interface, elle, n'est pas encore traduite : c'est pour cela que chaque écran est nommé ici avec son libellé anglais entre parenthèses. En attendant, l'anglais est le choix le plus proche.",
      ],
    },
    {
      id: "problemas",
      titulo: "Si quelque chose ne marche pas",
      parrafos: [
        "Les questions les plus fréquentes, avec ce qui est d'habitude la réponse :",
      ],
      puntos: [
        "La visite guidée ne s'affiche pas chez moi. Si vous l'avez passée une fois, l'application respecte ce choix et elle ne revient plus d'elle-même. Elle se redemande à la main depuis le point d'interrogation de la barre du haut, ou dans Réglages.",
        "L'application me propose de connecter ma banque et je ne vis ni au Canada ni aux États-Unis. Vérifiez votre pays dans Réglages : avec le pays renseigné, l'application arrête de le proposer et vous montre l'import du relevé, qui fait le même travail.",
        "J'ai chargé mon relevé et des opérations en double sont apparues. L'application les repère et les laisse décochées toute seule. Si vous aviez déjà importé ce mois, vérifiez avant de confirmer : les doublons sortent avec un avertissement.",
        "Le PDF de ma banque a été mal lu. Un PDF ne contient pas des données, il contient l'image du papier, donc la lecture est une estimation. Si votre banque propose du CSV ou de l'OFX, prenez ceux-là. Ce qui est faux se corrige dans Transactions sans réimporter.",
        "On me dit qu'un achat normal est un abonnement. Allez dans Abonnements et mensualités et écartez-le. Le rapport utilise ce que vous avez confirmé, pas ce que l'application a supposé.",
        "Mon rapport dit que j'ai trop peu de données. C'est littéral et volontaire : avec peu de jours notés une moyenne ne veut rien dire, et nous préférons le dire plutôt qu'inventer un chiffre qui a l'air bon.",
      ],
    },
    {
      id: "ayuda",
      titulo: "Si vous avez besoin d'aide",
      parrafos: [
        "Si quelque chose n'est pas ici, ou ne fonctionne pas comme ce manuel l'annonce, écrivez-nous à hola@nucleoos.app. Préciser de quel écran il s'agissait et ce que vous attendiez aide énormément.",
      ],
    },
  ],
};
