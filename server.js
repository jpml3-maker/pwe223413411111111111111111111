const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
// Middleware para interpretar JSON no body das requisições
app.use(express.json());

// Chave secreta para assinar o JWT (em um projeto real, use variáveis de ambiente)
const SECRET_KEY = 'sua_chave_super_secreta';

// Banco de dados em memória para simular as tarefas
let tarefas = [];
let tarefaId = 1;

// ==========================================
// TODO DO SNIPPET INICIAL
// ==========================================
// GET /usuarios/:id → 200, JSON { "id": "<valor do parâmetro>" }
app.get('/usuarios/:id', (req, res) => {
  res.status(200).json({ id: req.params.id });
});

// ==========================================
// ENDPOINTS DO DESAFIO PRINCIPAL
// ==========================================

// 1. POST /auth/login → 200 com JWT
app.post('/auth/login', (req, res) => {
  // Para fins do desafio, vamos gerar um token genérico válido por 1 hora
  const token = jwt.sign({ user: 'jeanpietro' }, SECRET_KEY, { expiresIn: '1h' });
  res.status(200).json({ token });
});

// Middleware de Autenticação (Verifica o JWT)
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // O formato esperado é "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  // GET /tarefas sem token → 401
  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
    req.user = user;
    next(); // Passa para a próxima rota se o token for válido
  });
};

// 2. GET /tarefas com token → 200 + lista
app.get('/tarefas', verificarToken, (req, res) => {
  res.status(200).json(tarefas);
});

// 3. POST /tarefas com token válido
app.post('/tarefas', verificarToken, (req, res) => {
  const { titulo, descricao } = req.body;

  // POST /tarefas com body inválido → 400 com erros
  if (!titulo) {
    return res.status(400).json({ erros: ['O campo "titulo" é obrigatório'] });
  }

  // POST /tarefas com token válido + body válido → 201
  const novaTarefa = {
    id: tarefaId++,
    titulo,
    descricao: descricao || '',
    concluida: false
  };

  tarefas.push(novaTarefa);
  res.status(201).json(novaTarefa);
});

// 4. PUT /tarefas/:id com token → 200 + tarefa atualizada
app.put('/tarefas/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, concluida } = req.body;

  const tarefaIndex = tarefas.findIndex(t => t.id === parseInt(id));

  if (tarefaIndex === -1) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }

  // Atualiza apenas os campos enviados no body
  tarefas[tarefaIndex] = {
    ...tarefas[tarefaIndex],
    titulo: titulo !== undefined ? titulo : tarefas[tarefaIndex].titulo,
    descricao: descricao !== undefined ? descricao : tarefas[tarefaIndex].descricao,
    concluida: concluida !== undefined ? concluida : tarefas[tarefaIndex].concluida
  };

  res.status(200).json(tarefas[tarefaIndex]);
});

// 5. DELETE /tarefas/:id com token → 204
app.delete('/tarefas/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const tarefaIndex = tarefas.findIndex(t => t.id === parseInt(id));

  if (tarefaIndex === -1) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }

  // Remove a tarefa do array
  tarefas.splice(tarefaIndex, 1);
  
  // 204 significa "No Content" (Deletado com sucesso, sem corpo de resposta)
  res.status(204).send();
});

// Inicia o servidor
app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
