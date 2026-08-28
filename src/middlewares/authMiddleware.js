// Biblioteca utilizada para criar e validar tokens JWT.
const jwt = require("jsonwebtoken");

// Middleware responsável por verificar se a requisição
// possui um token JWT válido antes de continuar.
function autenticarToken(req, res, next) {

    // Recupera o conteúdo do header Authorization.
    // O formato esperado é:
    // Authorization: Bearer TOKEN
    const authorization = req.headers.authorization;

    // Caso nenhum header Authorization tenha sido enviado,
    // o acesso à rota protegida é bloqueado.
    if (!authorization) {
        return res.status(401).json({
            mensagem: "Token não fornecido"
        });
    }

    // Divide o header em duas partes:
    // type  -> "Bearer"
    // token -> token JWT enviado pelo usuário
    const [type, token] = authorization.split(" ");

    // Verifica se o formato recebido corresponde
    // ao padrão Bearer Token.
    if (type !== "Bearer" || !token) {
        return res.status(401).json({
            mensagem: "Formato de token inválido."
        });
    }

    try {

        // Verifica a assinatura e a validade do token
        // utilizando a chave secreta armazenada no .env.
        const dadosUsuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // Armazena os dados presentes no token dentro
        // da requisição para que possam ser utilizados
        // nas próximas etapas, se necessário.
        req.usuario = dadosUsuario;


        // Libera a requisição para o próximo middleware
        // ou controller da rota.
        next();

    } catch (error) {

        // jwt.verify lança um erro caso o token seja inválido,
        // tenha sido adulterado ou esteja expirado.
        return res.status(401).json({
            mensagem: "Token inválido ou expirado."
        });
    }
}

module.exports = autenticarToken;