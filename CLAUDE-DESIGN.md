# Regras de Design — Erros a evitar

Este arquivo documenta padrões de erro visual identificados em sites reais e as regras que devem ser seguidas para não repeti-los. Sempre consultar antes de gerar ou revisar layout de qualquer seção.

---

## 1. Espaçamento entre seções

**Erro:** Vão gigante de espaço vazio entre o fim de uma seção e o começo da próxima (200px+ de nada), geralmente porque o `padding-bottom` da seção de cima soma com o `padding-top`/`margin-top` da seção de baixo sem ninguém calcular o total combinado.

**Regra:**
- Nunca usar `padding` grande nas duas pontas de seções adjacentes ao mesmo tempo. Escolher UM responsável pelo espaçamento (ou a seção de cima com `padding-bottom`, ou a de baixo com `padding-top`, não as duas).
- Espaçamento padrão entre seções: entre 64px e 120px, dependendo do tamanho da página — nunca passar disso sem justificativa visual clara (ex: seção de respiro proposital).
- Sempre verificar visualmente o espaço combinado antes de finalizar, não confiar só no valor isolado de cada seção.

**Opções de solução:**
1. **Padrão de espaçamento único (recomendado):** definir uma variável global (`--section-gap: 96px`) e aplicar só como `padding-top` de cada seção (exceto a primeira). A seção anterior nunca tem `padding-bottom` — assim nunca soma.
2. **Reset + gap controlado:** zerar margin/padding de topo e fundo em todas as `<section>` por padrão, e usar um wrapper único (`main > section + section { margin-top: 96px }`) pra controlar o espaço só uma vez, num só lugar.
3. **Auditoria rápida em dev:** antes de dar como pronto, inspecionar no DevTools o espaço computado entre o fim de um bloco e o início do outro — se passar de ~120px sem ter conteúdo visual ali, é bug, não decisão de design.

---

## 2. Hierarquia tipográfica

**Erro:** Frases de destaque/impacto (manifesto, chamada emocional) recebendo `font-size` de texto corrido comum (14–16px), perdendo o peso que deveriam ter.

**Regra:**
- Diferenciar por função, não só por local: texto corrido (body) = 16–18px. Frase de destaque/impacto/gancho emocional = 20–28px, geralmente em itálico ou serifada.
- Antes de estilizar um bloco de texto, perguntar: "essa frase é informação de apoio ou é a mensagem principal da seção?" — isso define o tamanho, não a posição no layout.

**Opções de solução:**
1. **Escala tipográfica fixa em classes utilitárias:** criar 3-4 classes reutilizáveis (`.text-body`, `.text-lead`, `.text-hero-quote`) com tamanhos já definidos, em vez de escrever `font-size` solto em cada componente. Evita inconsistência entre seções.
2. **Regra de decisão rápida:** se a frase poderia funcionar como citação isolada ou "gancho" de abertura de seção → usar `.text-lead` (20px+, itálico). Se é explicação/detalhe de apoio → `.text-body` (16-18px).
3. **Teste de distância:** olhar a seção de longe (ou reduzir o zoom do navegador) — se a frase de impacto não se destacar visualmente do resto do texto, o tamanho está errado.

---

## 3. Texto cru (parede de texto sem hierarquia interna)

**Erro:** Parágrafos inteiros com mesma cor, mesmo peso, mesmo tamanho, sem nenhuma variação que guie o olho — mesmo quando o copy em si é bom.

**Regra — padrão de referência a seguir:**
Ao montar um bloco de "título + texto explicativo", seguir esta estrutura:
1. **Título grande serifado** (Instrument Serif ou equivalente), quebra de linha só onde faz sentido semântico (máx. 2 linhas)
2. **Frase de abertura/gancho** logo abaixo: barra vertical à esquerda + itálico — cria contraste de leitura imediato
3. **Parágrafo intermediário** com **negrito estratégico** na frase-chave final (não espalhado aleatoriamente no meio do texto — sempre na ideia mais importante)
4. **Parágrafo final** mais neutro/explicativo, sem cor de destaque, fechando o raciocínio
5. Se fizer sentido, fechar com **badges/pills** com as palavras-chave do conteúdo, reforçando escaneabilidade

Nunca soltar um parágrafo de 4+ linhas sem pelo menos um desses elementos de quebra (negrito, itálico, badge, cor).

**Opções de solução:**
1. **Componente reutilizável "Storytelling Block":** criar um componente fixo (`<StoryBlock>` ou similar) que já vem com a estrutura título → gancho itálico → parágrafo com negrito → parágrafo neutro → badges, pra sempre montar esse tipo de seção do mesmo jeito, sem esquecer nenhuma camada.
2. **Checklist ao escrever o copy:** ao gerar o texto, já marcar mentalmente (ou em comentário no código) qual frase é o "gancho" e qual é a "frase-chave" que leva negrito — não deixar pra decidir isso só na hora de estilizar.
3. **Regra dos "3 elementos por bloco":** todo bloco de texto explicativo (3+ linhas) precisa ter no mínimo 3 dos seguintes: título, itálico de abertura, negrito estratégico, badge/pill, cor de destaque. Se tiver só título + parágrafo cinza, falta trabalhar.

---

## 4. Cards sem vida

**Erro:** Grid de cards todos idênticos — só `<h3>` + `<p>` cinza dentro de `border + padding`, sem ícone, sem cor, sem hierarquia entre eles, parecendo tabela disfarçada de card.

**Regra:**
- Todo card de "lista de benefícios/tópicos" precisa de pelo menos UM elemento visual de apoio: ícone (SVG), número decorativo grande, ou cor de destaque no topo/borda.
- Evitar grid 100% uniforme quando há 7+ itens — considerar variar 1-2 cards em destaque (tamanho, cor de fundo, ou posição) para quebrar a monotonia visual.
- Adicionar profundidade sutil: sombra leve, hover state, ou borda com leve gradiente — nunca deixar borda reta e chapada sem nenhum tratamento.

**Opções de solução:**
1. **Ícone/SVG obrigatório no topo do card:** definir como regra que todo card de "lista de tópicos/benefícios" tem um ícone SVG (mesmo que simples, tipo outline) acima do título — nunca só texto.
2. **Numeração ou cor como substituto de ícone:** quando não houver ícone disponível, usar número grande estilizado (`01`, `02`...) ou uma barra/tag colorida no topo do card, no lugar do ícone — mantém a mesma função de "âncora visual".
3. **Variação de destaque no grid:** em grids com muitos cards (7+), destacar 1-2 com fundo levemente diferente, borda colorida, ou tamanho maior (card "featured") pra quebrar a repetição visual.
4. **Micro-interação:** adicionar `transition` simples de `transform: translateY(-4px)` + leve `box-shadow` no `:hover`, dando sensação de profundidade/clicável mesmo em página estática.

---

## 5. Espaço vazio sem propósito (falta de consciência de layout)

**Erro (o mais crítico):** Sobra uma coluna ou área grande do layout completamente vazia (mesma cor do fundo), sem imagem, ícone, gráfico ou qualquer conteúdo — parece bug, não decisão de design.

**Regra:**
- Ao montar qualquer grid ou layout de duas colunas (ex: texto de um lado, "espaço" do outro), SEMPRE questionar: "esse espaço vazio faz sentido ou é preguiça de preencher?"
- Se sobrar espaço grande e não houver imagem/ícone disponível, escolher uma destas soluções:
  - Preencher com elemento visual: SVG decorativo, ícone grande, número/estatística em destaque, citação (quote)
  - Redesenhar o grid para não sobrar vazio (ex: texto ocupando largura total, ou cards ocupando o espaço da coluna vazia)
- Nunca entregar uma seção com área vazia "porque ainda não tem imagem" — ou resolve com placeholder visual consciente, ou ajusta o layout.

**Opções de solução:**
1. **Placeholder visual consciente:** se não tem imagem/foto do cliente ainda, preencher com SVG decorativo relacionado ao tema (ícone grande, ilustração line-art, gráfico), nunca deixar cor sólida igual ao fundo.
2. **Elemento de dado/prova social:** usar a coluna vazia pra colocar um número/estatística em destaque (ex: "+200 empresas atendidas"), uma citação de cliente, ou um mini-gráfico — transforma espaço morto em argumento de venda.
3. **Redesenho pra largura total:** se realmente não há nada pra colocar ali, abandonar o grid de 2 colunas e deixar o texto ocupar 100% da largura (com `max-width` pra não ficar longo demais de ler), eliminando a necessidade da coluna vazia.
4. **Regra de bloqueio antes de finalizar:** o Claude nunca deve entregar uma seção com área grande sem conteúdo sem avisar explicitamente: "essa coluna ficou vazia, quer que eu preencha com X ou prefere redesenhar o grid?" — nunca assumir silenciosamente que tá ok deixar vazio.

---

## Checklist rápido antes de finalizar qualquer seção

- [ ] O espaçamento entre esta seção e a anterior/próxima foi somado e checado visualmente?
- [ ] Frases de impacto têm tamanho de fonte compatível com a importância delas?
- [ ] Todo parágrafo longo tem pelo menos um elemento de quebra (negrito, itálico, cor, badge)?
- [ ] Cards têm algum elemento visual além de título + texto?
- [ ] Existe alguma área vazia no layout que não tem propósito? Se sim, resolver antes de entregar.
- [ ] Componentes repetidos (hero, cards, botões, footer) seguem o mesmo tamanho já usado em outras páginas do site?

---

## Padronização de tamanho entre componentes do mesmo tipo

**Erro:** Componentes do mesmo tipo com tamanhos diferentes entre páginas — ex: hero da home com 500px de altura, mas hero de uma página interna (sobre, serviços, contato) com 350px ou 600px, sem motivo.

**Regra:**
- Uma vez definido o tamanho de um tipo de componente em um lugar do site, esse tamanho vira o **padrão obrigatório** pra todas as outras ocorrências do mesmo tipo de componente, em qualquer página.
- Isso não vale só pra hero — se aplica a qualquer elemento repetido: altura de hero, altura/padding de cards, tamanho de ícones, largura máxima de texto (`max-width`), altura de footer, tamanho de botões, espaçamento entre seções (ver Caso 1), tamanho de badges/pills, etc.
- Se for necessário um tamanho diferente por causa do conteúdo (ex: hero com mais texto precisa de mais altura), a variação deve ser proposital e documentada — nunca inconsistência por falta de atenção.

**Opções de solução:**
1. **Design tokens centralizados:** definir os tamanhos padrão em variáveis CSS globais ou arquivo de tokens (`--hero-height: 500px`, `--card-padding: 32px`, `--icon-size: 48px`) e todo componente do mesmo tipo referenciar essa variável — nunca hardcode do valor repetido em cada arquivo.
2. **Componentização:** se o projeto usa React/Next.js, criar um componente único (`<Hero />`, `<Card />`) reutilizado em todas as páginas, em vez de recriar o HTML/JSX do zero em cada página — impossibilita a inconsistência por design.
3. **Checklist de auditoria antes de subir página nova:** ao criar uma página nova, comparar visualmente (ou inspecionar no DevTools) os componentes repetidos com a versão já existente no site — hero, cards, botões, footer — pra garantir que os tamanhos batem.
4. **Documentar exceções:** se um tamanho realmente precisa variar por causa de conteúdo, deixar isso claro (comentário no código ou nota no design) pra não ser confundido com erro numa auditoria futura.

---

Essas regras acima existem pra **evitar erro**, não pra engessar a criatividade. Dentro delas, o Claude tem liberdade total pra tomar decisões de design ousadas — o objetivo final de qualquer seção, card ou página é parecer **premium**, nunca genérico ou "template de curso".

Isso significa: quando houver dúvida entre a opção óbvia/segura e uma opção mais elaborada mas ainda dentro do bom senso, **escolher a mais elaborada**. Preferir o design que impressiona a decisão mais fácil de implementar.

### O que caracteriza um site/sistema premium

- **Assinatura visual própria:** nada de layout que pareceria igual em qualquer outro site — usar elementos que criam identidade (tipografia serifada de destaque, paleta de cor específica da marca, iconografia customizada em vez de biblioteca genérica sem edição).
- **Movimento com propósito:** animações (GSAP/ScrollTrigger, Lenis) que revelam conteúdo de forma cinematográfica — parallax sutil, reveals no scroll, transições suaves entre seções — nunca animação só "porque sim" ou decorativa sem função.
- **Espaço negativo como decisão, não acidente:** whitespace generoso e proposital (diferente do "espaço vazio sem propósito" do Caso 5) — dar respiro pro conteúdo respirar é premium; deixar espaço morto sem pensar é erro.
- **Detalhes que ninguém pede mas fazem diferença:** micro-interações no hover, cursor customizado, transições de página, loading states elegantes, easter eggs sutis — o tipo de coisa que separa "site feito rápido" de "site pensado".
- **Contraste de escala:** títulos muito grandes ao lado de textos pequenos e discretos — a diferença de tamanho cria hierarquia dramática (referência: Apple, Linear, Stripe).
- **Fotografia/imagem tratada, nunca crua:** se usar foto, sempre com tratamento (overlay, grain, duotone, crop editorial) — nunca imagem de banco de imagem solta sem curadoria.
- **Copy que vende sem parecer que está vendendo:** linguagem direta, confiante, que fala com a dor do visitante antes de apresentar a solução — nunca "corporativês" genérico tipo "somos uma empresa comprometida com a excelência".
- **Consistência de sistema, não só de página:** cores, espaçamentos, tipografia e componentes seguindo os mesmos tokens em todo o site — dá sensação de produto pensado, não de páginas remendadas.

### Referências de padrão premium pra se inspirar
Apple, Linear, Stripe, Vercel, Arc Browser, Framer — todos com uso extremo de whitespace, tipografia como elemento central de design, movimento sutil e nada decorativo sem função.
