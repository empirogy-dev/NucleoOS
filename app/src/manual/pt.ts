import type { Manual } from "./tipos";

export const MANUAL_PT: Manual = {
  titulo: "Manual do NucleoOS",
  intro: "Tudo o que o app faz, explicado em ordem e em palavras normais. Não precisa ler inteiro: procure a seção que te interessa e leia só essa. Se você acabou de chegar, as três primeiras já bastam para começar.",
  indice: "Conteúdo",
  secciones: [
    {
      id: "que-es",
      titulo: "O que é o NucleoOS",
      parrafos: [
        "O NucleoOS é uma agenda viva. Tudo o que você registra fica com a sua data: o que comeu, o quanto dormiu, o que gastou, como treinou, o que praticou, o que avançou. Depois a seção Revisão junta tudo isso e devolve convertido em algo que dá para entender: seu dia, sua semana, seu mês e os padrões entre uma área e outra.",
        "A ideia de fundo é simples: registrar uma vez, no lugar que corresponde, e deixar o app fazer o trabalho de cruzar os dados. Se você registra um treino em Movimento, seu hábito de exercício fica marcado, seus minutos da semana sobem e a meta que dependia disso avança, sem você anotar nada três vezes.",
        "Não é um app que te cobra. Se um dia você não registrar nada, tudo bem: não há sequências que punem nem telas que te pedem explicações. Foi feito assim de propósito, porque pensamos em quem acaba recebendo culpa em vez de ordem dos apps de produtividade.",
      ],
    },
    {
      id: "empezar",
      titulo: "Primeiros passos",
      parrafos: [
        "Ao criar sua conta o app faz quatro perguntas curtas e nada mais. Você pode mudar todas as respostas depois, em Ajustes.",
      ],
      pasos: [
        "Como você se chama, ou como quer que o app te chame.",
        "O que você quer organizar primeiro: tudo, suas finanças, seu corpo ou sua cabeça. Isso decide quais seções você vê no começo, para o menu não te gritar com catorze coisas no primeiro dia. As outras se ligam quando você quiser, em Ajustes e depois Módulos.",
        "Onde você mora e em que moeda lida com seu dinheiro. Isso só é perguntado se você for usar Finanças. O país importa mais do que parece: define o que o app pode te oferecer, porque a conexão automática com o banco funciona em alguns países e em outros ainda não.",
        "Por onde começar: o app propõe duas ou três coisas concretas conforme o que você escolheu, não uma lista de trinta.",
      ],
    },
    {
      id: "moverse",
      titulo: "Como se mover pelo app",
      parrafos: [
        "O menu da esquerda está agrupado pelo que cada coisa serve, não por ordem alfabética: Panorama para ver o conjunto, Núcleo para o que sustenta seu corpo e sua cabeça, Minha vida para o que você administra, Inspiração para o que te move. Se há seções que não te servem, você as desliga em Ajustes e o menu encolhe de verdade.",
        "No alto à direita há quatro botões que vale conhecer no primeiro dia:",
      ],
      puntos: [
        "O sino, com seus avisos: pagamentos que vencem, pessoas com quem você não fala há tempo, coisas com data.",
        "A paleta, para escolher o tema de cores com o qual quer viver aqui.",
        "O ponto de interrogação, que abre o tour guiado. Tem duas opções: conhecer o app inteiro em sete passos, ou que ele te explique a tela onde você está.",
        "Os ajustes, onde se decide qual app você tem.",
      ],
    },
    {
      id: "ayuda-dentro",
      titulo: "A ajuda que vem dentro do app",
      parrafos: [
        "Não precisa voltar a este manual para cada dúvida. O app se explica sozinho em três níveis, e vale saber que existem:",
      ],
      puntos: [
        "O ponto de interrogação ao lado do título de cada seção. Você aperta e em duas frases ele diz para que serve aquela seção, que pergunta da sua vida ela responde. De lá você também pode pedir o tour daquela tela, que são três ou quatro janelinhas apontando o que importa.",
        "O tour geral, no ponto de interrogação da barra de cima. Sete passos curtos que mostram o app inteiro. Dá para pular em qualquer momento, e se você pular, ele não volta sozinho.",
        "O tour da importação de extrato, o único que te acompanha enquanto você faz algo. Aparece na primeira vez que você abre a janela de importar, e também se pede à mão no link que diz primeira vez.",
      ],
    },
    {
      id: "inicio",
      titulo: "Início",
      parrafos: [
        "É a tela onde o dia começa. Mostra suas tarefas de hoje, o pulso do dia, que são os números que vêm de Energia, Hábitos e Movimento, e a bússola, que é o quanto suas metas de Direção vão avançando.",
        "Nada do que você vê aqui é preenchido à mão: tudo se monta sozinho com o que você registra no resto do app. Os cartões se arrastam, então coloque em cima o que você realmente olha e deixe o resto embaixo. A ordem é salva e te segue entre dispositivos.",
        "Também existe a captura rápida, o botão para anotar algo sem perder o que você estava fazendo. Você escreve a ideia, ela é salva, e segue no seu. Depois decide se era uma tarefa, um gasto ou nada.",
      ],
    },
    {
      id: "calendario",
      titulo: "Calendário",
      parrafos: [
        "Tudo o que tem data na sua vida, em uma só tela: suas tarefas, seus pagamentos, seus compromissos, os aniversários dos seus vínculos, suas jornadas de trabalho e os avanços das suas metas.",
        "Você anda entre os meses com as setas do título e o botão Hoje te traz de volta onde estava. Em cima diz quantas coisas tem o mês que você está olhando.",
        "Quase nada é preenchido aqui: chega sozinho dos outros módulos. Se o mês parece vazio é porque você ainda não registrou nada, não porque falta configurar algo.",
      ],
    },
    {
      id: "revision",
      titulo: "Revisão",
      parrafos: [
        "É a seção que converte o registrado em clareza, e provavelmente o motivo pelo qual vale a pena registrar. Tem cinco abas:",
      ],
      puntos: [
        "Dia: a agenda do que aconteceu, não do que você planejava. A que horas comeu, quando se moveu, o que anotou. Serve para reconstruir um dia estranho e entender o que o deixou assim.",
        "Semana e Mês: a mesma coisa com mais zoom, para ver tendências em vez de dias soltos.",
        "Padrões: cruza módulos. Como sua energia muda conforme o que você dorme, o que acontece com seu humor nas semanas em que você se move, esse tipo de coisa.",
        "Relatório: você escolhe um período e quais áreas entram, e sai um documento com gráficos e observações que você pode imprimir, salvar como PDF ou exportar como planilha.",
      ],
    },
    {
      id: "finanzas",
      titulo: "Finanças",
      parrafos: [
        "É o módulo maior, então vai explicado por partes. Para que serve: para saber para onde vai o seu dinheiro e parar de adivinhar.",
        "As abas estão agrupadas pelo que servem. Primeiro o dia a dia, depois o que você tem e o que deve, depois o que se repete, e no final, separado, o de configurar.",
      ],
      puntos: [
        "Resumo: o mês de relance, com suas receitas, seus gastos, seu saldo nas contas e seu patrimônio líquido.",
        "Transações: o seu livro de movimentos. Tudo o que entrou e saiu, com sua data, sua categoria e sua conta.",
        "Contas: suas contas bancárias e de dinheiro vivo, com o saldo.",
        "Dívidas e cartões: o que você deve, a quem, e o que te cabe pagar.",
        "Assinaturas e parcelas: as cobranças que se cobram sozinhas mês a mês.",
        "Metas: suas metas de poupança.",
        "Relatório: o documento que explica para onde foi o dinheiro.",
        "Categorias e etiquetas: como você quer classificar o que é seu.",
        "Veículo: se você tem um veículo de trabalho, seus gastos e quilômetros à parte.",
      ],
    },
    {
      id: "registrar-gasto",
      titulo: "Registrar um gasto ou uma receita",
      parrafos: [
        "O botão Registrar abre a janela para anotar um movimento à mão. Você escreve uma vez e ele fica com sua data, sua categoria e sua conta.",
        "Se você tem o comprovante na mão, pode tirar uma foto e deixar o app preencher os dados. Confira o que ele colocou antes de salvar: a leitura automática acerta quase sempre, e quase sempre não é sempre.",
        "Os comprovantes ficam guardados junto ao movimento, então um ano depois você pode olhar o papel de novo sem procurar numa caixa.",
      ],
    },
    {
      id: "cartola",
      titulo: "Importar o extrato do banco",
      parrafos: [
        "Esta é a parte que mais economiza tempo e a que mais confunde no começo, então vai completa.",
        "Um extrato é o arquivo com todos os movimentos de um mês que o seu banco te dá. Em alguns lugares se chama extrato de conta ou statement. Não é a foto da tela do banco nem um e-mail: é um arquivo que se baixa.",
      ],
      pasos: [
        "Entre no seu banco pela internet e procure extrato, movimentação ou statement. Escolha o mês que quer e baixe o arquivo.",
        "Se o seu banco deixar escolher o formato, prefira CSV ou OFX, porque esses são lidos exatos. Também servem QFX, Excel e PDF. O PDF é lido pela inteligência artificial e depois conferido por você, porque um PDF não traz dados organizados, traz uma imagem do papel.",
        "No app, entre em Finanças e aperte Importar extrato.",
        "Diga de qual conta ou cartão é o extrato e de que mês. Com isso os movimentos ficam arquivados onde devem e o app consegue te avisar se subir o mesmo mês duas vezes.",
        "Escolha o arquivo. Você pode subir vários de uma vez, até seis, por exemplo a conta e o cartão do mesmo mês.",
        "Confira a lista que aparece. Cada linha é um movimento com sua data, sua descrição e seu valor. Nada está salvo ainda: é uma prévia.",
        "Olhe os repetidos. O app compara com o que você já tem e deixa desmarcado o que já estava, para não contar duas vezes. Acontece bastante quando você anotou algo à mão e depois sobe o extrato do mesmo mês.",
        "Aperte o botão do final, que diz quantos movimentos vão entrar. Só aí é salvo.",
      ],
      puntos: [
        "Se algo foi lido errado, corrige-se depois em Transações. Não precisa importar de novo.",
        "A conexão automática com o banco, que pula todo esse processo, funciona por enquanto com bancos do Canadá e dos Estados Unidos. No resto dos países se importa o extrato, que faz o mesmo com um passo a mais.",
      ],
    },
    {
      id: "clasificar",
      titulo: "Categorias e etiquetas",
      parrafos: [
        "A categoria responde que tipo de gasto é: mercado, aluguel, transporte. Cada movimento leva uma.",
        "A etiqueta responde outra coisa: para que era. Você pode etiquetar um gasto como negócio, como pessoal, como uma viagem específica, como um projeto. Um mesmo movimento pode levar várias, e é isso que permite responder perguntas que a categoria sozinha não responde, por exemplo quanto aquela viagem custou de verdade entre combustível, comida e hospedagem.",
        "Se você trabalha por conta própria, etiquetar o que é de negócio desde o começo significa que no fim do ano o resumo de impostos já está feito, em vez de passar um fim de semana reconstruindo.",
      ],
    },
    {
      id: "deudas",
      titulo: "Contas, dívidas e cartões",
      parrafos: [
        "As contas são onde o seu dinheiro vive, incluindo o dinheiro vivo. Cada uma leva sua moeda: se você tem contas em dois países, o NucleoOS nunca as mistura nem as soma como se fossem a mesma coisa.",
        "As dívidas são o que você deve, com sua instituição, seu valor e o que te cabe pagar. Pagar um cartão não é um gasto novo: é mover dinheiro de uma conta para o cartão, e o app trata assim para que seus gastos do mês não sejam contados duas vezes.",
        "O patrimônio líquido que você vê no Resumo é simplesmente o que você tem menos o que você deve. É o número mais honesto da tela e às vezes o mais incômodo.",
      ],
    },
    {
      id: "recurrentes",
      titulo: "Assinaturas e parcelas",
      parrafos: [
        "O app olha seus movimentos e propõe quais parecem cobranças que se repetem sozinhas todo mês: streaming, academia, seguros, parcelas.",
        "São propostas, não conclusões, e você confirma ou descarta cada uma. Isso importa: um detector automático que ninguém revisa acaba dizendo que o mercado é uma assinatura, e com isso os números do relatório deixam de servir. O que você confirma é o que o relatório usa.",
        "Vale a pena fazer uma vez com calma, porque é onde costuma aparecer o dinheiro que vai embora sem ninguém olhar.",
      ],
    },
    {
      id: "reporte",
      titulo: "O relatório de Finanças",
      parrafos: [
        "A aba Relatório é o coach financeiro. Você escolhe um período e ele te mostra, com gráficos, para onde foi o dinheiro:",
      ],
      puntos: [
        "Em que categorias foi, ordenadas por tamanho, com quanto cada uma mudou em relação ao período anterior.",
        "Quanto do seu gasto são cobranças que se cobram sozinhas, das que você confirmou em Assinaturas e parcelas.",
        "Onde há dinheiro para recuperar, com uma faixa realista em vez de uma promessa.",
        "Como você vem mês a mês, para ver se a tendência vai para algum lado.",
      ],
    },
    {
      id: "energia",
      titulo: "Energia",
      parrafos: [
        "Para entender por que há dias em que você está bem e outros não. Aqui ficam a água, a comida, o sono, o ciclo, a recuperação e seus dados de saúde clínica.",
        "Registrar leva segundos: os copos de água e seu nível de energia se marcam com um toque. As refeições podem ser fotografadas e o app estima calorias e proteína. É um guia, não uma balança: serve para ver a tendência, não para pesar cada coisa.",
        "O jejum só aparece se você disser que jejua. O app pergunta uma vez e respeita a resposta, porque marcar jejum para alguém que simplesmente ainda não comeu não ajuda ninguém.",
        "Com duas semanas de registro, a Revisão já consegue te dizer como sua energia se relaciona com o quanto você dorme e se move.",
      ],
    },
    {
      id: "mente",
      titulo: "Mente",
      parrafos: [
        "Para baixar a rotação e tirar da cabeça o que fica dando voltas.",
        "Práticas e Sadhana são respirações e meditações que correm com seu próprio tempo e seu sino. Você escolhe uma, faz, e ela fica registrada com seus minutos.",
        "O diário é para escrever. Se você não sabe por onde começar, o app te propõe uma pergunta. O que você escreve é seu: não sai do app nunca, a menos que você marque a caixinha ao exportar um relatório, e essa caixinha vem desligada.",
        "Histórico guarda cada prática com seus minutos, e Insights procura o que se repete no que você escreve. Nenhuma das duas te pede nada: elas se enchem sozinhas.",
      ],
    },
    {
      id: "movimiento",
      titulo: "Movimento",
      parrafos: [
        "Três formas de mover o corpo, conforme o dia: Prática suave para soltar quando você está travada, Treino para o que cansa de verdade, e Programas para seguir um plano de várias semanas sem ter que inventá-lo todo dia.",
        "Você pode seguir uma rotina passo a passo ou simplesmente anotar o que fez e quantos minutos. As duas coisas contam igual.",
        "Tudo o que você registra aqui cai em outros lugares: aparece em Energia, marca seu hábito de exercício e alimenta as metas de Direção que dependem do movimento.",
      ],
    },
    {
      id: "habitos",
      titulo: "Hábitos",
      parrafos: [
        "Há três coisas diferentes aqui e vale não confundi-las. Um hábito é algo que você quer sustentar sempre. Um desafio tem começo e fim, como trinta dias sem açúcar. Uma rotina é uma sequência de passos que você faz de uma vez.",
        "Marca-se com um toque e o quadradinho se pinta com a cor do hábito. A grade começa no dia em que você o criou, não antes, então as sequências não mentem.",
        "Alguns se marcam sozinhos. Se você registra um treino em Movimento, seu hábito de exercício fica marcado sem fazer mais nada.",
      ],
    },
    {
      id: "relaciones",
      titulo: "Relações",
      parrafos: [
        "Para não perder de vista as pessoas que te importam quando a vida aperta.",
        "Você anota cada pessoa e de quantos em quantos dias gostaria de falar com ela. Sete para a sua mãe, noventa para um amigo da faculdade. O app não opina sobre o número, só te avisa quando passa.",
        "Você também registra os momentos: uma ligação, um café, algo que te contaram. Serve para lembrar do importante na próxima vez que se virem, que é do que se trata. Os aniversários que você anotar aparecem sozinhos no Calendário.",
      ],
    },
    {
      id: "direccion",
      titulo: "Direção",
      parrafos: [
        "Para transformar o que você quer em algo que de fato avança. Metas ativas é o que você persegue agora, Próximos passos é o que cabe nesta semana, Avanços é o que você já moveu, e Alcançadas é a aba que se olha nos dias em que você sente que não avança em nada.",
        "Cada meta se divide em marcos, e a porcentagem sai deles. É a diferença entre aprender inglês e algo que dá para começar na terça.",
        "Uma meta pode se alimentar sozinha do que você já registra: sessões de movimento, dias de um hábito, horas de um projeto, aportes a uma poupança. Avança enquanto você vive, sem você precisar entrar para atualizá-la.",
      ],
    },
    {
      id: "trabajo",
      titulo: "Trabalho",
      parrafos: [
        "Para saber para onde foi o seu tempo, e não só para onde você achava que ia.",
        "Cada projeto leva suas tarefas e o avanço é calculado com o que você vai marcando. Você registra sua jornada e os blocos de foco ficam ligados ao projeto, então no fim do mês o número existe em vez de ser uma impressão.",
        "Ao fechar a jornada você pode anotar como ela foi. Com algumas semanas disso dá para ver quais dias te deixam bem e quais te esvaziam, que nem sempre são os que a gente imagina.",
      ],
    },
    {
      id: "aprendizaje",
      titulo: "Aprendizado",
      parrafos: [
        "Para que o que você aprende não se perca em cadernos soltos.",
        "As notas vivem em cadernos por tema, para que uma anotação de um curso não fique misturada com uma receita. A busca olha dentro de todas as suas notas de uma vez, então tanto faz em que caderno você a deixou. É a diferença entre guardar algo e conseguir encontrá-lo um ano depois.",
        "A biblioteca é à parte: o que você quer ler e o que já leu, com a data. Não há meta de livros por ano nem nada que te cobre.",
      ],
    },
    {
      id: "vision",
      titulo: "Visão",
      parrafos: [
        "Para lembrar por que você faz todo o resto. Sonhos é a lista do que você quer viver, Visual board é para ver em imagens, e Vida ideal é o texto onde você descreve o dia que quer ter.",
        "Aqui nada tem data nem te persegue, de propósito. No dia em que um sonho deixar de ser sonho, você o passa para Direção e só aí ele vira uma meta com passos.",
      ],
    },
    {
      id: "informes",
      titulo: "Levar seus dados para outra pessoa",
      parrafos: [
        "Há dois relatórios e os dois foram pensados para serem lidos por quem não usa o app.",
        "O de Finanças, na aba Relatório, é o que você levaria a um contador ou a um assessor: gráficos, categorias, cobranças recorrentes e onde há dinheiro para recuperar. O da Revisão, na aba Relatório dela, é o que você levaria a um psicólogo, a um médico ou a um nutricionista: energia, movimento, hábitos, mente e direção no período que você escolher.",
        "Os dois saem em três formatos. O relatório abre pronto para imprimir, e de lá o navegador salva como PDF. A planilha sai em CSV, para quem quiser fazer os próprios cálculos. E o pacote traz tudo junto em um ZIP.",
      ],
      puntos: [
        "Cada média diz sobre quantos dias foi calculada, e os dias sem registro nunca contam como zero. Um relatório dizendo que você dormiu zero horas nas noites em que não anotou nada seria pior do que não ter relatório.",
        "Os cruzamentos entre áreas publicam quantos dias os sustentam, e são marcados como fracos quando são poucos. Assim quem lê sabe que peso dar.",
        "O texto do seu diário nunca sai, a menos que você marque uma caixinha que vem desligada.",
      ],
    },
    {
      id: "privacidad",
      titulo: "Seus dados e sua privacidade",
      parrafos: [
        "Seus dados são seus e o app foi feito para você poder tirá-los quando quiser, em formatos que qualquer um abre. Isso é de propósito: um app onde seus dados ficam presos não é um lugar seguro para guardar sua vida.",
        "Há um modo privado em Finanças, o botão do olho, que tapa todos os valores na tela. Serve para mostrar o app a alguém, ou para usá-lo em um lugar com gente em volta, sem mostrar o seu dinheiro. O que você exporta leva os números reais: o modo privado é para a tela, não para os relatórios.",
        "Os termos e a política de privacidade podem ser lidos completos em nucleoos.app/terms e nucleoos.app/privacy.",
      ],
    },
    {
      id: "ajustes",
      titulo: "Ajustes",
      parrafos: [
        "Aqui se decide qual app você tem. Seu país e sua moeda, quais seções você vê, o tema de cores, o idioma, e as funções que só servem para algumas pessoas, como o jejum ou o veículo de trabalho.",
        "O país é o que muda mais as coisas: define o que o app pode te oferecer, para não te oferecer algo que não vai funcionar onde você mora.",
        "Também daqui você pode rever o tour guiado completo, quantas vezes quiser.",
      ],
    },
    {
      id: "idiomas",
      titulo: "Idiomas",
      parrafos: [
        "O app está em espanhol, inglês e português, e se muda em Ajustes. Todo o tour guiado, os relatórios e os avisos estão nos três.",
        "Este manual está também em francês, para quem preferir ler assim, mesmo que a aplicação ainda não esteja traduzida para esse idioma.",
      ],
    },
    {
      id: "problemas",
      titulo: "Se algo não funciona",
      parrafos: [
        "As coisas que mais se perguntam, com o que costuma ser a resposta:",
      ],
      puntos: [
        "O tour guiado não aparece para mim. Se você o pulou uma vez, o app respeita isso e ele não volta sozinho. Dá para pedir à mão no ponto de interrogação da barra de cima, ou em Ajustes.",
        "O app me oferece conectar o banco e eu não moro no Canadá nem nos Estados Unidos. Confira seu país em Ajustes: com o país definido, o app para de oferecer isso e te mostra a importação de extrato, que faz o mesmo.",
        "Subi o extrato e apareceram movimentos repetidos. O app os marca e os deixa desmarcados sozinho. Se você já tinha importado o mês, confira antes de confirmar: os repetidos saem com um aviso.",
        "O PDF do meu banco foi lido errado. Um PDF não traz dados, traz a imagem do papel, então a leitura é uma estimativa. Se o seu banco oferece CSV ou OFX, use esses. O que ficou errado se corrige em Transações sem importar de novo.",
        "Ele me diz que uma compra normal é uma assinatura. Entre em Assinaturas e parcelas e descarte. O relatório usa o que você confirmou, não o que o app supôs.",
        "Meu relatório diz que tenho poucos dados. É literal e é de propósito: com poucos dias registrados uma média não significa nada, e preferimos dizer isso a inventar um número que pareça bom.",
      ],
    },
    {
      id: "ayuda",
      titulo: "Se você precisar de ajuda",
      parrafos: [
        "Se algo não está aqui, ou algo não funciona como este manual diz, escreva para hola@nucleoos.app. Dizer qual tela era e o que você esperava que acontecesse ajuda muito.",
      ],
    },
  ],
};
