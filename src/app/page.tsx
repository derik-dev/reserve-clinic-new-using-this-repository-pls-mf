const appointments = [
  ["09:00", "Maria Oliveira", "Dra. Ana", "#4c6fff"],
  ["11:00", "João Pereira", "Dr. Bruno", "#34d6c4"],
  ["14:00", "Fernanda Souza", "Dra. Carla", "#a78bfa"],
  ["16:00", "Ricardo Lima", "Dr. Diego", "#7dd3fc"],
];

const stats = [
  ["+500", "clínicas ativas", "#4c6fff"],
  ["40%", "menos faltas", "#34d6c4"],
  ["40 mil", "consultas/mês", "#a78bfa"],
  ["4,9★", "avaliação média", "#f5a623"],
];

const features = [
  {
    eyebrow: "AGENDA CENTRALIZADA",
    title: "Toda a clínica, numa agenda só",
    text: "Cada profissional, sala e horário visível em uma única tela. Chega de planilha, WhatsApp e caderno de recados para saber quem atende quando.",
    color: "#8fa3ff",
    bullets: ["Visão semanal de todos os profissionais e salas", "Bloqueio automático de conflitos de horário", "Filtro por profissional, especialidade ou status"],
    visual: "calendar",
  },
  {
    eyebrow: "LINK DE AGENDAMENTO",
    title: "O paciente marca e paga sozinho",
    text: "Gere um link exclusivo da sua clínica. O paciente escolhe o profissional, o dia e o horário, preenche os dados e paga o sinal via Pix.",
    color: "#34d6c4",
    bullets: ["Link único e personalizável para sua clínica", "Cadastro do paciente em apenas 1 minuto", "Cobrança do sinal via Pix com QR code instantâneo"],
    visual: "phone",
  },
  {
    eyebrow: "LEMBRETES",
    title: "Menos faltas, mais agenda cheia",
    text: "Lembretes automáticos por WhatsApp e SMS antes de cada consulta. Clínicas que usam o Reserve Clinic relatam queda média de 40% nas faltas.",
    color: "#a78bfa",
    bullets: ["Lembrete automático 24h e 2h antes", "Confirmação por um clique do paciente", "Reagendamento fácil e sem ligações"],
    visual: "chat",
  },
];

const plans = [
  { name: "BÁSICO", price: "R$ 89", description: "Para consultórios individuais organizarem a própria agenda.", features: ["1 profissional", "Agenda ilimitada", "Link de agendamento", "Lembretes por WhatsApp"] },
  { name: "PROFISSIONAL", price: "R$ 249", description: "Para clínicas com múltiplos profissionais e recepção.", popular: true, features: ["Até 8 profissionais", "Cobrança de sinal via Pix", "Painel da recepção", "Ficha completa do paciente", "Relatórios de ocupação"] },
  { name: "CLÍNICA", price: "R$ 549", description: "Para redes e clínicas de grande porte com várias unidades.", features: ["Profissionais ilimitados", "Múltiplas unidades", "Gestor de conta dedicado", "Integração com prontuário", "Suporte prioritário"] },
];

function Logo() {
  return <div className="logo"><span className="logoMark" />Reserve Clinic</div>;
}

function Dashboard() {
  return (
    <div className="browser">
      <div className="browserBar"><div className="browserDots"><i /><i /><i /></div><span>app.reserveclinic.com.br/dashboard</span><div className="browserMenu">•••</div></div>
      <div className="dashboard">
        <aside><Logo /><b>◧ Dashboard</b><span>▣ Agenda</span><span>♙ Pacientes</span><span>↗ Link de agendamento</span><span>▤ Financeiro</span><span>⚙ Configurações</span></aside>
        <main>
          <h3>Dashboard</h3><small>Sexta-feira, 3 de julho</small>
          <div className="metrics">
            {[["CONSULTAS HOJE","18"],["OCUPAÇÃO","86%"],["FATURAMENTO","R$ 4.860"],["PENDENTES","3"]].map(([a,b]) => <div key={a}><small>{a}</small><strong>{b}</strong></div>)}
          </div>
          <div className="appointments"><b>Próximos atendimentos</b>
            {appointments.map(([time, patient, prof, color]) => <div className="appointment" style={{borderLeftColor: color}} key={time}><strong>{time}</strong><span>{patient}</span><small>{prof}</small></div>)}
          </div>
        </main>
      </div>
    </div>
  );
}

function FeatureVisual({ type }: { type: string }) {
  if (type === "phone") return <div className="phone"><div className="notch" /><Logo /><small>Clínica Vida Nova</small><p>Valor do sinal</p><strong>R$ 60,00</strong><div className="qr">{Array.from({length:81},(_,i)=><i className={(i*37)%9>3?"dark":""} key={i}/>)}</div><em>Aguardando pagamento</em></div>;
  if (type === "chat") return <div className="chat"><div><small>Reserve Clinic · ontem 18:00</small>Olá Maria! Lembrando da sua consulta amanhã às 14h com a Dra. Ana Silva.</div><div className="reply"><small>Maria Oliveira</small>Confirmado, obrigada! 👍</div><div><small>Reserve Clinic · hoje 08:00</small>Sua consulta é hoje às 14h. Toque para confirmar presença.</div></div>;
  return <div className="miniCalendar"><div className="week"><span /><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span></div>{["08h","09h","10h","11h","13h"].map((time,r)=><div className="week" key={time}><small>{time}</small>{[0,1,2,3].map(c=><i className={(r+c)%3===0?"empty":""} style={{borderLeftColor:["#4c6fff","#34d6c4","#a78bfa","#7dd3fc"][c]}} key={c}/>)}</div>)}</div>;
}

export default function Home() {
  return (
    <div className="site">
      <div className="gridBg" /><div className="aurora auroraOne" /><div className="aurora auroraTwo" />
      <nav><Logo /><div className="navLinks"><a href="#produto">Produto</a><a href="#recursos">Recursos</a><a href="#precos">Preços</a><a href="#clientes">Clínicas parceiras</a></div><div className="navActions"><a href="/login">Entrar</a><a className="button light" href="#cta">Agendar demo</a></div></nav>
      <header>
        <div className="pill"><i /> Feito para clínicas médicas de todos os portes</div>
        <h1>Menos ligação,<br/>mais <span>consulta confirmada.</span></h1>
        <p>O Reserve Clinic organiza a agenda da sua clínica, envia lembretes automáticos e cobra o sinal via Pix antes da consulta — para sua recepção parar de correr atrás de paciente.</p>
        <div className="heroActions"><a className="button primary" href="#cta">Começar gratuitamente →</a><a className="button ghost" href="#produto">Ver demonstração</a></div>
        <div className="trust"><div><i/><i/><i/><i/></div> usado por +500 clínicas em todo o Brasil</div>
      </header>
      <section className="heroVisual" id="produto"><div className="floatCard pix"><small>PIX RECEBIDO</small><strong>R$ 60,00</strong><span>Maria Oliveira</span></div><Dashboard/><div className="floatCard whatsapp"><small>● WhatsApp · agora</small><span>Sua consulta amanhã às 14h foi confirmada ✅</span></div></section>
      <section className="stats">{stats.map(([value,label,color])=><div key={value}><i style={{background:color}}/><strong>{value}</strong><span>{label}</span></div>)}</section>
      <div id="recursos">{features.map((f,i)=><section className={`feature ${i%2?"reverse":""}`} key={f.title}><div className="featureCopy"><small style={{color:f.color}}>{f.eyebrow}</small><h2>{f.title}</h2><p>{f.text}</p>{f.bullets.map(b=><div className="check" key={b}><i style={{color:f.color,background:`${f.color}20`}}>✓</i>{b}</div>)}</div><FeatureVisual type={f.visual}/></section>)}</div>
      <section className="testimonial" id="clientes"><div className="quote">“</div><div className="stars">★★★★★</div><blockquote>“Reduzimos as faltas em quase metade e a recepção parou de perder meio dia confirmando consulta por telefone. O link de pagamento via Pix sozinho já se paga.”</blockquote><div className="person"><i/><div><b>Dra. Renata Ferraz</b><span>Diretora clínica, Clínica Vida Nova</span></div></div></section>
      <section className="pricing" id="precos"><div className="sectionTitle"><small>PREÇOS</small><h2>Um plano para cada clínica</h2></div><div className="plans">{plans.map(p=><div className={`plan ${p.popular?"popular":""}`} key={p.name}>{p.popular&&<em>MAIS POPULAR</em>}<small>{p.name}</small><div><strong>{p.price}</strong><span>/mês</span></div><p>{p.description}</p><a className={`button ${p.popular?"primary":"ghost"}`} href="#cta">{p.popular?"Começar agora":p.name==="CLÍNICA"?"Falar com vendas":"Começar"}</a>{p.features.map(f=><span className="planFeature" key={f}>✓ {f}</span>)}</div>)}</div></section>
      <section className="finalCta" id="cta"><h2>Sua agenda organizada em uma tarde</h2><p>Configuração guiada, sem custo de implantação. Comece hoje mesmo.</p><div><a className="button light" href="#">Começar gratuitamente</a><a className="button ghost" href="#">Falar com um especialista</a></div></section>
      <footer><div className="footerGrid"><div><Logo/><p>Agendamento, confirmação e cobrança de sinal via Pix para clínicas médicas.</p></div>{[["Produto","Agenda","Link de agendamento","Pagamentos via Pix","Lembretes automáticos"],["Empresa","Sobre","Clínicas parceiras","Carreiras","Blog"],["Suporte","Central de ajuda","Fale conosco","Status","Segurança"]].map(([title,...links])=><div key={title}><b>{title}</b>{links.map(l=><a href="#" key={l}>{l}</a>)}</div>)}</div><div className="copyright">© 2026 Reserve Clinic. Todos os direitos reservados.</div></footer>
    </div>
  );
}



