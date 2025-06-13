const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise'); // Promises para async/await

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Configurar conexão com MySQL
const dbConfig = {
  host: 'localhost',
  user: 'seu_usuario',
  password: 'sua_senha',
  database: 'quizpwa',
};

// Função para garantir que a tabela exista
async function criarTabela() {
  const conn = await mysql.createConnection(dbConfig);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS participantes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100),
      quiz VARCHAR(20),
      score INT,
      time INT,
      data DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await conn.end();
}

// Chama a criação da tabela na inicialização
criarTabela().catch(console.error);

io.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('quiz-result', async ({ nome = 'Anônimo', quiz, score, time }) => {
    try {
      const conn = await mysql.createConnection(dbConfig);
      // Insere resultado
      await conn.execute(
        'INSERT INTO participantes (nome, quiz, score, time) VALUES (?, ?, ?, ?)',
        [nome, quiz, score, time]
      );

      // Busca ranking top 10
      const [rows] = await conn.execute(
        'SELECT nome, quiz, score, time FROM participantes WHERE quiz = ? ORDER BY score DESC, time ASC LIMIT 10',
        [quiz]
      );

      io.emit('ranking-update', rows);
      await conn.end();
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
    }
  });
});

app.get('/ranking/:quiz', async (req, res) => {
  const { quiz } = req.params;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT nome, quiz, score, time FROM participantes WHERE quiz = ? ORDER BY score DESC, time ASC LIMIT 10',
      [quiz]
    );
    await conn.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
