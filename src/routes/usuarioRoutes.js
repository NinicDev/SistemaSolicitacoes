// Importa o Express para criação das rotas.
const express = require("express");

// Middleware responsável por verificar o token JWT
// antes de permitir acesso a rotas protegidas.
const autenticarToken = require("../middlewares/authMiddleware");

// Importa os controllers responsáveis pelo
// cadastro e login dos usuários.
const {
    cadastrarUsuario,
    loginUsuario
} = require("../controllers/usuarioController");

// Cria um roteador do Express.
const router = express.Router();

// Cadastra um novo usuário.
// Rota final: POST /usuarios/cadastro
router.post("/cadastro", cadastrarUsuario);

// Realiza o login e retorna um token JWT.
// Rota final: POST /usuarios/login
router.post("/login", loginUsuario);

// Rota criada para testar o funcionamento
// do middleware de autenticação.
router.get("/protegida", autenticarToken, (req, res) => {
    res.json({
        mensagem: "Você acessou uma rota protegida!"
    });
});


// Exporta as rotas para serem utilizadas em app.js.
module.exports = router;