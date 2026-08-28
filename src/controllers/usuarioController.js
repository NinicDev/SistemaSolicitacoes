// Biblioteca utilizada para gerar e comparar hashes de senha.
const bcrypt = require("bcrypt");

// Pool de conexões com o PostgreSQL.
const pool = require("../../config/database");

// Biblioteca utilizada para criação dos tokens JWT.
const jwt = require("jsonwebtoken");


// Controller responsável pelo cadastro de novos usuários.
async function cadastrarUsuario(req, res) {

    try {

        // Recupera usuário e senha enviados no corpo da requisição.
        const { usuario, senha } = req.body;


        // Impede cadastro com campos vazios ou contendo
        // somente espaços.
        if (!usuario?.trim() || !senha?.trim()) {
            return res.status(400).json({
                mensagem: "Usuário e senha são obrigatórios."
            });
        }


        // Remove espaços extras no começo e no fim do usuário.
        const usuarioNormalizado = usuario.trim();


        // Define um tamanho mínimo para o nome de usuário.
        if (usuarioNormalizado.length < 3) {
            return res.status(400).json({
                mensagem: "O usuário deve ter pelo menos 3 caracteres."
            });
        }


        // Define um tamanho mínimo para a senha.
        if (senha.length < 6) {
            return res.status(400).json({
                mensagem: "A senha deve ter pelo menos 6 caracteres."
            });
        }


        // Expressão regular que permite somente
        // letras, números e underscore no usuário.
        const usuarioValido = /^[A-Za-z0-9_]+$/;


        if (!usuarioValido.test(usuarioNormalizado)) {
            return res.status(400).json({
                mensagem: "O usuário pode conter apenas letras, números e underscore."
            });
        }

        // Gera um hash da senha antes de armazená-la.
        // Assim, a senha original nunca é salva diretamente no banco.
        const senhaHash = await bcrypt.hash(senha, 10);

        // Insere o novo usuário e o hash da senha no banco.
        // Os parâmetros $1 e $2 também ajudam a evitar SQL Injection.
        await pool.query(
            "INSERT INTO usuarios (usuario, senha) values ($1, $2)",
            [usuarioNormalizado, senhaHash]
        );

        return res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso!"
        });

    } catch (error) {

        // Código 23505 do PostgreSQL representa
        // uma violação de restrição UNIQUE.
        // Neste caso, significa que o usuário já existe.
        if (error.code === "23505") {
            return res.status(409).json({
                mensagem: "Este usuário já está cadastrado."
            });
        }

        return res.status(500).json({
            mensagem: "Erro ao cadastrar usuário"
        });
    }
}

// Controller responsável por autenticar um usuário.
async function loginUsuario(req, res) {

    try {

        const { usuario, senha } = req.body;

        // Procura no banco um usuário com o nome informado.
        const resultado = await pool.query(
            "SELECT * FROM usuarios WHERE usuario = $1",
            [usuario]
        );

        // Como o nome de usuário é único,
        // utilizamos somente o primeiro registro encontrado.
        const usuarioEncontrado = resultado.rows[0];

        // Caso nenhum usuário tenha sido localizado,
        // interrompe o processo de login.
        if (!usuarioEncontrado) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        // Compara a senha enviada com o hash armazenado no banco.
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuarioEncontrado.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "Senha incorreta"
            });
        }

        // Gera um JWT contendo informações básicas do usuário.
        // O token utiliza a chave secreta do .env e expira em 8 horas.
        const token = jwt.sign(
            {
                id: usuarioEncontrado.id,
                usuario: usuarioEncontrado.usuario
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        // Retorna o token para ser utilizado
        // nas próximas requisições protegidas.
        return res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            token
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao realizar login."
        });
    }
}

module.exports = {
    cadastrarUsuario,
    loginUsuario
};