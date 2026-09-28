const express = require("express");

const autenticarToken = require("../middlewares/authMiddleware");

const autorizarNiveis = require("../middlewares/autorizarNiveis");

const {
    listarSolicitacoes,
    criarSolicitacao,
    buscarPorId,
    atualizarSolicitacao,
    excluirSolicitacao
} = require("../controllers/solicitacaoController");

const validarSolicitacao = require("../middlewares/validarSolicitacao");

const {gerarPdfSolicitacao, gerarPdfLote} = require("../controllers/pdfController");

const router = express.Router();

router.post("/pdf/lote", autenticarToken, gerarPdfLote)

router.get("/:id/pdf", autenticarToken, gerarPdfSolicitacao);



router.get(
    "/",
    autenticarToken,
    listarSolicitacoes
);

router.post(
    "/",
    autenticarToken,
    autorizarNiveis("ADMIN", "OPERADOR"),
    validarSolicitacao,
    criarSolicitacao
);

router.get(
    "/:id",
    autenticarToken,
    buscarPorId
);

router.put(
    "/:id",
    autenticarToken,
    autorizarNiveis("ADMIN", "OPERADOR"),
    validarSolicitacao,
    atualizarSolicitacao
);

router.delete(
    "/:id",
    autenticarToken,
    autorizarNiveis("ADMIN"),
    excluirSolicitacao
);


module.exports = router;
