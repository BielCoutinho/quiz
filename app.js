// Registrar Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log("Service worker registrado!"))
      .catch(err => console.error("Falha no registro do service worker:", err));
  }
  
  // Conexão Socket.io
  const socket = io('http://localhost:3306');
  
  // Elementos DOM
  const quizContainer = document.getElementById('quiz-container');
  const rankingDiv1 = document.getElementById('ranking-quiz1');
  const rankingDiv2 = document.getElementById('ranking-quiz2');
  
  const quizzes = {
    quiz1: [
      { q: "Qual é a primeira etapa para criar um sistema?", options: ["Começar a programar direto", "Comprar um mouse novo", "✅Planejar e revisar os requisitos", "Escolher um nome bonito"] },
      { q: "O que significa MVP em um projeto?", options: ["Meu Vídeo Preferido", "✅Mínimo Produto Viável", "Modo Virtual de Presença", "Manual para Visualizar Projetos"] },
      { q: "Para desenhar as telas do sistema, qual ferramenta pode ser usada?", options: ["Excel", "✅Figma", "PowerPoint", "WhatsApp"] },
      { q: "O que é necessário instalar para começar a programar com Node.js?", options: ["Paint", "✅Node.js versão 18 ou superior", "Word", "Zoom"] },
      { q: "Para criar o banco de dados, usamos:", options: ["PowerPoint", "Notepad", "✅MySQL Server / MySQL Workbench", "Canva"] },
      { q: "O nome do banco de dados usado no projeto é:", options: ["evento_show", "✅controle_evento", "sorteio_online", "dados_admin"] }
    ],
    quiz2: [
      { q: "Onde criamos as regras de funcionamento do sistema (como cadastro e sorteio)?", options: ["Nas tabelas", "✅Nos controllers do backend", "No botão “Enter”", "No slide de apresentação"] },
      { q: "Para o sistema funcionar em tempo real, usamos:", options: ["Chart.js", "HTML", "✅Socket.io", "Google Docs"] },
      { q: "O que o totem touchscreen permite fazer no evento?", options: ["Jogar", "✅Cadastrar presença tocando na tela", "Fazer café", "Tirar fotos"] },
      { q: "Para ver os dados do sistema com gráficos, usamos:", options: ["Instagram", "✅Dashboard com Chart.js ou Power BI", "Calculadora", "Netflix"] },
      { q: "O que é uma PWA?", options: ["Uma página que não abre", "✅Um app da web que funciona até offline", "Um tipo de vírus", "Um comando de sorteio"] },
      { q: "O que deve ser feito no fim do projeto?", options: ["Deletar tudo", "Jogar no pendrive", "✅Apresentar com slides e publicar no GitHub", "Imprimir a tela"] }
    ]
  };
  
  let currentQuiz = "";
  let score = 0;
  let current = 0;
  let startTime;
  let nome = "Anônimo";
  
  function startQuiz(quizName) {
    nome = document.getElementById('nomeInput').value.trim() || "Anônimo";
    currentQuiz = quizName;
    score = 0;
    current = 0;
    startTime = Date.now();
    document.getElementById('start-screen').style.display = 'none';
    quizContainer.style.display = 'block';
    renderQuestion();
  }
  
  function renderQuestion() {
    const q = quizzes[currentQuiz][current];
    if (!q) {
      const time = Math.floor((Date.now() - startTime) / 1000);
      socket.emit('quiz-result', { nome, quiz: currentQuiz, score, time });
  
      quizContainer.innerHTML = `<h2>Fim do ${currentQuiz}</h2>
        <p>Pontuação: ${score}</p>
        <p>Tempo: ${time}s</p>`;
  
      // Voltar para a tela inicial após 3 segundos
      setTimeout(() => {
        quizContainer.innerHTML = '';
        quizContainer.style.display = 'none';
        document.getElementById('start-screen').style.display = 'block';
      }, 5000);
  
      return;
    }
  
    const opts = q.options.map(opt =>
      `<button onclick="selectOption(this)" data-correct="${opt.startsWith('✅')}">${opt.replace('✅','')}</button>`
    ).join('');
  
    quizContainer.innerHTML = `<h2>${q.q}</h2>${opts}`;
  }
  
  function selectOption(btn) {
    if (btn.dataset.correct === "true") score++;
    current++;
    renderQuestion();
  }
  
  // Função para mostrar aba de ranking correta
function showRankingTab(quiz) {
    // Remove 'active' de todas as tabs
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  
    // Marca aba clicada como ativa
    document.getElementById(`tab-${quiz}`).classList.add('active');
  
    // Esconde todas as divs de ranking
    document.querySelectorAll('.ranking-tab').forEach(div => div.style.display = 'none');
  
    // Mostra só a div da aba selecionada
    document.getElementById(`ranking-${quiz}`).style.display = 'block';
  }
  
  // Escuta atualização do ranking do servidor
  socket.on('ranking-update', (ranking) => {
    // Filtra e ordena para quiz1 e quiz2
    const r1 = ranking.filter(r => r.quiz === 'quiz1').sort((a, b) => b.score - a.score || a.time - b.time);
    const r2 = ranking.filter(r => r.quiz === 'quiz2').sort((a, b) => b.score - a.score || a.time - b.time);
  
    // Função que monta o HTML do ranking
    const renderList = (list) => {
      if (!list.length) return '<p>Nenhum resultado ainda.</p>';
      const rows = list.map(r => 
        `<div class='ranking-entry'>
           <span>${r.nome}</span>
           <span>${r.score}</span>
           <span>${r.time}s</span>
         </div>`
      ).join('');
      return `<div class='ranking-header'><span>Nome</span><span>Pontos</span><span>Tempo</span></div>` + rows;
    };
  
    rankingDiv1.innerHTML = renderList(r1);
    rankingDiv2.innerHTML = renderList(r2);
  });
  
  // Inicializa mostrando ranking do quiz1
  showRankingTab('quiz1');
  