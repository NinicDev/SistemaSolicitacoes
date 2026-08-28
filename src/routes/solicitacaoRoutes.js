// Importa o Express para criação das rotas.
const express = require("express");

// Middleware que exige um token JWT válido
// para acessar as rotas de solicitações.
const autenticarToken = require("../middlewares/authMiddleware");

// Importa os controllers responsáveis pelas operações
// CRUD das solicitações.
const {
    listarSolicitacoes,
    criarSolicitacao,
    buscarPorId,
    atualizarSolicitacao,
    excluirSolicitacao
} = require("../controllers/solicitacaoController");

// Middleware responsável por validar os dados
// enviados ao criar ou atualizar uma solicitação.
const validarSolicitacao = require("../middlewares/validarSolicitacao");

const router = express.Router();

// Lista todas as solicitações.
// GET /solicitacoes
router.get(
    "/",
    autenticarToken,
    listarSolicitacoes
);

// Cria uma nova solicitação.
// Antes de chegar ao controller, a requisição precisa
// passar pela autenticação e pela validação dos dados.
// POST /solicitacoes
router.post(
    "/",
    autenticarToken,
    validarSolicitacao,
    criarSolicitacao
);

// Busca uma solicitação específica pelo seu ID.
// GET /solicitacoes/:id
router.get(
    "/:id",
    autenticarToken,
    buscarPorId
);

// Atualiza uma solicitação existente.
// PUT /solicitacoes/:id
router.put(
    "/:id",
    autenticarToken,
    validarSolicitacao,
    atualizarSolicitacao
);

// Exclui uma solicitação pelo ID.
// DELETE /solicitacoes/:id
router.delete(
    "/:id",
    autenticarToken,
    excluirSolicitacao
);

module.exports = router;