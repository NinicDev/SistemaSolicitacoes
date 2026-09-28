const jwt = require("jsonwebtoken");

const pool = require("../../config/database");

async function autenticarToken(req, res, next) {

    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            mensagem: "Token não fornecido"
        });
    }

    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({
            mensagem: "Formato de token inválido."
        });
    }

    try{
        const dadosUsuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // O logout revoga o JWT pelo jti até a expiração original do token.
        const resultadoToken = await pool.query(
            `
            SELECT id from tokens_invalidados 
            WHERE jti_id = $1
            LIMIT 1
            `, [dadosUsuario.jti]);

        if(resultadoToken.rows.length > 0){
            return res.status(401).json({
                mensagem: "Token inválido"
            })
        }

        // O nível é lido do banco para mudanças de permissão valerem sem novo login.
        const resultadoUsuario = await pool.query(
            `
            SELECT
                id,
                usuario,
                nivel_acesso
            FROM usuarios
            WHERE id = $1
            LIMIT 1
            `,
            [dadosUsuario.id]
        );

        if (resultadoUsuario.rows.length === 0) {
            return res.status(401).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const usuarioAtual = resultadoUsuario.rows[0];
        // Mantém os claims do JWT (incluindo jti/exp) e sobrescreve dados mutáveis.
        req.usuario = {
            ...dadosUsuario,
            usuario: usuarioAtual.usuario,
            nivel_acesso: usuarioAtual.nivel_acesso
        };


        next();

    }catch(error){

        return res.status(401).json({
            mensagem: "Token inválido ou expirado."
        });
    }
}

module.exports = autenticarToken;
