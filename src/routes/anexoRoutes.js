const express = require("express");

const router = express.Router();

const autenticarToken = require("../middlewares/authMiddleware");
const autorizarNiveis = require("../middlewares/autorizarNiveis");
const { upload } = require("../middlewares/uploadsMiddleware");
const { verificarSolicitacao } = require("../middlewares/verificarSolicitacao");

const {
    criarAnexo,
    listarAnexos,
    obterArquivoAnexo,
    excluirAnexos
} = require("../controllers/anexosController");

router.post(
    "/:id_solicitacao",
    autenticarToken,
    autorizarNiveis("ADMIN", "OPERADOR"),
    verificarSolicitacao,
    upload.array("anexos"),
    criarAnexo
);

router.get(
    "/:id/arquivo",
    autenticarToken,
    obterArquivoAnexo
);

router.get(
    "/:id_solicitacao",
    autenticarToken,
    listarAnexos
);

router.delete(
    "/:id",
    autenticarToken,
    autorizarNiveis("ADMIN", "OPERADOR"),
    excluirAnexos
);

module.exports = router;
