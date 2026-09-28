const express = require("express");

const autenticarToken = require("../middlewares/authMiddleware");

const {
    cadastrarUsuario,
    loginUsuario,
    verificarEmail,
    reenviarCodigo,
    solicitarRecuperacaoSenha,
    redefinirSenha,
    logoutUsuario,
    obterUsuarioAtual,
    listarUsuarios,
    alterarNivelAcesso,
    listarUsuariosDisponiveisResponsavel
} = require("../controllers/usuarioController");

const autorizarNiveis = require("../middlewares/autorizarNiveis");

const router = express.Router();

router.post("/esqueci-senha", solicitarRecuperacaoSenha);

router.post("/redefinir-senha", redefinirSenha);

router.post("/logout", autenticarToken, logoutUsuario);
router.post("/cadastro", cadastrarUsuario);

router.post("/verificar-email", verificarEmail);

router.post("/reenviar-codigo", reenviarCodigo);

router.post("/login", loginUsuario);

router.get(
    "/me",
    autenticarToken,
    obterUsuarioAtual
);

router.get(
    "/",
    autenticarToken,
    autorizarNiveis("ADMIN"),
    listarUsuarios
);

router.get(
    "/disponiveis-responsavel",
    autenticarToken,
    autorizarNiveis("ADMIN"),
    listarUsuariosDisponiveisResponsavel
);

router.patch(
    "/:id/nivel-acesso",
    autenticarToken,
    autorizarNiveis("ADMIN"),
    alterarNivelAcesso
);

module.exports = router;
