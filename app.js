if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log("Service Worker registrado!"))
    .catch(err => console.error("Erro ao registrar Service Worker:", err));
}

const quizContainer = document.getElementById('quiz-container');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

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
let score1 = 0;
let score2 = 0;
let current = 0;
let startTime;

let awaitingStartKey = false;    // espera jogador apertar A ou D para começar responder
let responderJogador = null;     // jogador que ganhou direito de responder
let respostaTimeout = null;      // timeout para tempo da resposta
let tempoRespostaSeg = 10;       // tempo para responder

window.startQuiz = function (quizName) {
  if (!quizzes[quizName]) return alert("Quiz inválido.");

  currentQuiz = quizName;
  score1 = 0;
  score2 = 0;
  current = 0;
  startTime = Date.now();

  document.getElementById('start-screen').style.display = 'none';
  quizContainer.style.display = 'block';

  mostrarPerguntaParaReflexo();
}

function mostrarPerguntaParaReflexo() {
  responderJogador = null;
  clearTimeout(respostaTimeout);

  const q = quizzes[currentQuiz][current];
  if (!q) {
    mostrarResultadoFinal();
    return;
  }

  const alternativas = q.options.map(opt => `<div>${opt.replace('✅', '')}</div>`).join('');

  // Mostra pergunta + alternativas + contagem regressiva
  quizContainer.innerHTML = `
    <h2>Leiam a pergunta e as alternativas!</h2>
    <p><strong>${q.q}</strong></p>
    <div style="margin-bottom:20px;">${alternativas}</div>
    <p style="font-weight:bold; font-size: 32px; text-align:center;" id="countdown">3</p>
    <p><em>Depois do "Já!", pressione a tecla A (Jogador 1) ou D (Jogador 2) para responder primeiro.</em></p>
  `;

  let countdown = 3;
  const countdownEl = document.getElementById('countdown');
  awaitingStartKey = false;  // bloqueia teclas até acabar contagem

  const interval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownEl.innerText = countdown;
    } else if (countdown === 0) {
      countdownEl.innerText = "Já!";
    } else {
      clearInterval(interval);
      countdownEl.style.display = 'none';
      awaitingStartKey = true;  // libera pressionar tecla A ou D
    }
  }, 1000);
}


function mostrarResultadoFinal() {
  const tempoTotal = Math.floor((Date.now() - startTime) / 1000);

  quizContainer.innerHTML = `
    <h2>Fim do quiz ${currentQuiz}</h2>
    <p>🎯 Jogador 1: ${score1} ponto(s)</p>
    <p>🎯 Jogador 2: ${score2} ponto(s)</p>
    <p>⏱ Tempo total: ${tempoTotal} segundos</p>
    <p>🏆 Vencedor: ${score1 === score2 ? 'Empate' : (score1 > score2 ? 'Jogador 1' : 'Jogador 2')}</p>
    <button onclick="window.location.reload()">Reiniciar Quiz</button>
  `;
}

function renderizaPerguntaResposta() {
  const q = quizzes[currentQuiz][current];
  if (!q) {
    mostrarResultadoFinal();
    return;
  }

  // Cria botões clicáveis para responder
  const opts = q.options.map(opt =>
    `<button data-correct="${opt.startsWith('✅')}">${opt.replace('✅', '')}</button>`
  ).join('');

  quizContainer.innerHTML = `
    <h2>Jogador ${responderJogador} deve responder!</h2>
    <p><strong>${q.q}</strong></p>
    <div id="options">${opts}</div>
    <p id="tempo" style="margin-top:10px; font-weight:bold;">⏱ Tempo para responder: ${tempoRespostaSeg}s</p>
  `;

  // Adiciona evento nos botões para responder
  const botoes = quizContainer.querySelectorAll("#options button");
  botoes.forEach(btn => {
    btn.addEventListener('click', () => {
      processarResposta(btn);
    });
  });

  // Começa contagem regressiva para resposta
  let segundosRestantes = tempoRespostaSeg;
  const tempoEl = document.getElementById("tempo");

  respostaTimeout = setInterval(() => {
    segundosRestantes--;
    tempoEl.textContent = `⏱ Tempo para responder: ${segundosRestantes}s`;

    if (segundosRestantes <= 0) {
      clearInterval(respostaTimeout);
      quizContainer.innerHTML += `<p>⏳ Tempo esgotado!</p>`;
      passarVezOutroJogador();
    }
  }, 1000);
}

function processarResposta(botao) {
  clearInterval(respostaTimeout);

  const correta = botao.dataset.correct === "true";

  const botoes = quizContainer.querySelectorAll("#options button");
  botoes.forEach(b => b.disabled = true);


  
  if (correta) {
    botao.style.backgroundColor = "green";
    document.getElementById("acerto")?.play();

    if (responderJogador === 1) score1++;
    else score2++;

    current++;
    setTimeout(() => {
      mostrarPerguntaParaReflexo();
    }, 1500);

  } else {
    botao.style.backgroundColor = "red";
    document.getElementById("erro")?.play();

    passarVezOutroJogador();
  }
}

function passarVezOutroJogador() {
  responderJogador = responderJogador === 1 ? 2 : 1;
  setTimeout(() => {
    renderizaPerguntaResposta();
  }, 1500);
}

// Escuta teclado para definir quem respondeu primeiro ou quem vai responder na rodada
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (awaitingStartKey) {
    if (key === 'a' || key === 'd') {
      responderJogador = key === 'a' ? 1 : 2;
      awaitingStartKey = false;
      renderizaPerguntaResposta();
    }
  }
});

// --- ANIMAÇÃO BINÁRIO CANVAS ---

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const chars = ['0', '1'];
const fontSize = 16;
const columns = Math.floor(window.innerWidth / fontSize);
const drops = new Array(columns).fill(1);
ctx.font = `${fontSize}px monospace`;
let lastTime = 0;
const speed = 80;

function draw(time = 0) {
  if (time - lastTime < speed) {
    requestAnimationFrame(draw);
    return;
  }
  lastTime = time;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#002244';

  for (let i = 0; i < drops.length; i++) {
    const text = chars[Math.floor(Math.random() * chars.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    drops[i]++;
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
  }

  requestAnimationFrame(draw);
}
draw();
