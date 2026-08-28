// Importa o Express, responsável pela criação da API.
const express = require("express");

// Middleware que permite requisições vindas de outras origens,
// como um frontend executando em outra porta.
const cors = require("cors");

// Importa as rotas relacionadas aos usuários.
const usuarioRoutes = require("./routes/usuarioRoutes");

// Importa as rotas relacionadas às solicitações.
const solicitacoesRoutes = require("./routes/solicitacaoRoutes");

// Cria a aplicação Express.
const app = express();

// Permite que o backend receba requisições de outras origens.
app.use(cors());

// Permite que o Express interprete JSON enviado
// no corpo das requisições.
app.use(express.json());

// Todas as rotas de usuário começam com /usuarios.
// Exemplo: POST /usuarios/login
app.use("/usuarios", usuarioRoutes);

// Todas as rotas de solicitações começam com /solicitacoes.
// Exemplo: GET /solicitacoes
app.use("/solicitacoes", solicitacoesRoutes);

// Exporta a aplicação para que ela possa ser iniciada no server.js.
module.exports = app;