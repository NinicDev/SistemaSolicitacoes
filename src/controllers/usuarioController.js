const bcrypt = require("bcrypt");

const {
    enviarCodigoVerificacao,
    enviarCodigoRecuperacaoSenha
} = require("../services/emailServices");

const crypto = require("crypto");

const pool = require("../../config/database");

const jwt = require("jsonwebtoken");

async function cadastrarUsuario(req, res) {

    let client;
    let transactionIniciada = false;
    try {
        const { usuario, email ,senha } = req.body;

        if (!usuario?.trim() || !email?.trim() || !senha?.trim()) {
            return res.status(400).json({
                mensagem: "Usuário, email e senha são obrigatórios."
            });
        }

        const usuarioNormalizado = usuario.trim();

        const emailNormalizado = email.trim().toLowerCase();

        const emailValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailValido.test(emailNormalizado)) {
            return res.status(400).json({
                mensagem: "E-mail inválido."
            });
        }
                
        if (usuarioNormalizado.length < 3) {
            return res.status(400).json({
                mensagem: "O usuário deve ter pelo menos 3 caracteres."
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                mensagem: "A senha deve ter pelo menos 6 caracteres."
            });
        }

        const usuarioValido = /^[A-Za-z0-9_]+$/;

        if (!usuarioValido.test(usuarioNormalizado)) {
            return res.status(400).json({
                mensagem: "O usuário pode conter apenas letras, números e underscore."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        client = await pool.connect();

        // Usuário e código de verificação devem ser gravados na mesma transação.
        await client.query("BEGIN");
        transactionIniciada = true;
        const resultadoUsuario = await client.query(
            `INSERT INTO 
            usuarios 
            (usuario, email, senha) 
            values ($1, $2, $3)
            RETURNING id`,
            [usuarioNormalizado, emailNormalizado ,senhaHash]
        );

        const usuarioId = resultadoUsuario.rows[0].id;

        const codigo = crypto.randomInt(100000, 1000000).toString();

        const expiraEm = new Date(
            Date.now() + 10 * 60 * 1000
        );

        const codigoHash = await bcrypt.hash(codigo, 10);

        await client.query(
            `
            INSERT INTO codigos_verificacao
            (
                usuario_id,
                codigo_hash,
                tipo,
                expira_em
            )
            VALUES
                ($1, $2, $3, $4)
            `,
            [usuarioId, codigoHash, "VERIFICAR_EMAIL", expiraEm]
        );  

        await client.query("COMMIT");
        transactionIniciada = false;

            // O envio ocorre após o commit; falha no provedor não desfaz o cadastro já persistido.
            try{
                await enviarCodigoVerificacao(
                        emailNormalizado,
                        codigo
                    );

            }catch(error){
                console.error("Erro ao enviar código de verificação:", error);

                return res.status(500).json({
                    mensagem:"Usuário cadastrado, mas não foi possível enviar o código de verificação."
                });
            }

        return res.status(201).json({
            mensagem: "Usuário cadastrado. Enviamos um código de verificação para seu e-mail."
        });

    }catch (error) {

        if(client && transactionIniciada){
            await client.query("ROLLBACK")
        }

        if (error.code === "23505") {

             if (error.constraint === "usuarios_email_unique") {
                return res.status(409).json({
                    mensagem: "Este e-mail já está cadastrado."
                });
            }
            
            return res.status(409).json({
                mensagem: "Este usuário já está cadastrado."
            });
        }

        return res.status(500).json({
            mensagem: "Erro ao cadastrar usuário"
        });
    }
    finally{
        if(client){
            client.release();
        }
    }
}

async function verificarEmail(req, res) {

    let client;
    let transactionIniciada = false;

    try {
        const {
            email,
            codigo
        } = req.body;

        if (!email?.trim() || !codigo?.trim()) {
            return res.status(400).json({
                mensagem: "E-mail e código são obrigatórios."
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        if (!/^\d{6}$/.test(codigo)) {
            return res.status(400).json({
                mensagem:
                    "O código deve conter exatamente 6 dígitos."
            });
        }

        const resultadoUsuario = await pool.query(
                    `
                    SELECT * from view_email_verificacao
                    WHERE email = $1
                    `,
                    [emailNormalizado]
                );
                
        if (resultadoUsuario.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const usuario = resultadoUsuario.rows[0];

        if (usuario.email_verificado) {
            return res.status(409).json({
                mensagem:
                    "Este e-mail já foi verificado."
            });
        }

        const resultadoCodigo = await pool.query(
            `
            SELECT
                id,
                codigo_hash,
                expira_em
            FROM codigos_verificacao
            WHERE usuario_id = $1
            AND tipo = 'VERIFICAR_EMAIL'
            AND usado_em IS NULL
            ORDER BY criado_em DESC
            LIMIT 1
            `,
            [usuario.id]
        )

        if (resultadoCodigo.rows.length === 0) {
            return res.status(400).json({
                mensagem:
                    "Nenhum código de verificação válido foi encontrado."
            });
        }

        const registroCodigo = resultadoCodigo.rows[0];

        const expiraEm = new Date(registroCodigo.expira_em);

        if (new Date() > expiraEm) {
            return res.status(400).json({
                mensagem:
                    "O código de verificação expirou."
            });
        }

        const codigoCorreto =
            await bcrypt.compare(
                codigo,
                registroCodigo.codigo_hash
            );

        if (!codigoCorreto) {
            return res.status(400).json({
                mensagem:
                    "Código de verificação inválido."
            });
        }

        client = await pool.connect();

        await client.query("BEGIN");
        transactionIniciada = true;

        await client.query(
            `
            UPDATE usuarios
            SET email_verificado = true
            WHERE id = $1
            `,
        [usuario.id])

        await client.query(
            `
            UPDATE codigos_verificacao
            SET usado_em = NOW()
            where id = $1
            `,
        [registroCodigo.id])

        await client.query("COMMIT")
        transactionIniciada = false;
        
        return res.status(200).json({
            mensagem: "E-mail verificado com sucesso!"
        });

    }catch(error){
        
        console.error("ERRO AO VERIFICAR E-MAIL:");
        console.error(error);

        if(client && transactionIniciada){
            await client.query("ROLLBACK")
        }

        return res.status(500).json({
            mensagem: "Erro ao verificar e-mail."
        });
    }

    finally{
        if(client){
            client.release();
        }
    }

}

async function loginUsuario(req, res) {

    try {

        const { usuario, senha } = req.body;

        if (!usuario?.trim() || !senha?.trim()) {
            return res.status(400).json({
                mensagem: "Usuário e senha são obrigatórios."
            });
        }

        const usuarioNormalizado = usuario.trim();

        const resultado = await pool.query(
            "SELECT * FROM usuarios WHERE usuario = $1",
            [usuarioNormalizado]
        );

        const usuarioEncontrado = resultado.rows[0];

        if (!usuarioEncontrado) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuarioEncontrado.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "Senha incorreta"
            });
        }

        if (!usuarioEncontrado.email_verificado) {
            return res.status(403).json({
                mensagem: "E-mail ainda não verificado.",
                email: usuarioEncontrado.email
            });
        }

        const jti = crypto.randomUUID();

        const token = jwt.sign(
            {
                id: usuarioEncontrado.id,
                usuario: usuarioEncontrado.usuario,
                jti
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

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

async function reenviarCodigo(req, res) {

    let client;
    let transactionIniciada = false;
        
    try{
        const { email }  =  req.body

        if (!email?.trim()) {
                return res.status(400).json({
                    mensagem: "E-mail é obrigatório"
                });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const resultadoUsuario = await pool.query(
            `
            SELECT * from view_email_verificacao
            WHERE email = $1
            `,
            [emailNormalizado]);

        if(resultadoUsuario.rows.length === 0){
            return res.status(404).json({
                mensagem:"Email não encontrado"
            })
        };

        const usuario = resultadoUsuario.rows[0];
        
        if(usuario.email_verificado){
            return res.status(409).json({
                mensagem:"Esse email já foi verificado"
            })
        }

        client = await pool.connect();

        await client.query("BEGIN");
        transactionIniciada = true;

        await client.query(
            `
            UPDATE codigos_verificacao
            SET usado_em = NOW()
            WHERE usuario_id = $1
            AND tipo = 'VERIFICAR_EMAIL'
            AND usado_em IS NULL
            `,
            [usuario.id]
        )
        const codigo = crypto.randomInt(100000, 1000000).toString();

        const expiraEm = new Date(
            Date.now() + 10 * 60 * 1000
        );

        const codigoHash = await bcrypt.hash(codigo, 10);

        await client.query(
            `
            INSERT INTO codigos_verificacao
            (
                usuario_id,
                codigo_hash,
                tipo,
                expira_em
            )
            VALUES
                ($1, $2, $3, $4)
            `,
            [usuario.id, codigoHash, "VERIFICAR_EMAIL", expiraEm]
        );  

        await client.query("COMMIT")
        transactionIniciada = false;

        await enviarCodigoVerificacao(
            emailNormalizado,
            codigo
        );

        return res.status(200).json({
            mensagem:"Novo código de verificação enviado."
        })

    }catch(error){

        console.error("ERRO AO REENVIAR CÓDIGO:");
        console.error(error);

        if(client && transactionIniciada){
            await client.query("ROLLBACK");
        }

        return res.status(500).json({
            mensagem: "Erro ao enviar código novo."
        });
    }
    finally{
        if(client){
            client.release();
        }
    }

}

async function solicitarRecuperacaoSenha(req, res) {

    let client;
    let transactionIniciada = false;

    // Evita enumeração de contas: a resposta não confirma se o e-mail existe.
    const mensagemGenerica =
        "Se este e-mail estiver cadastrado, enviaremos um código de recuperação.";

    try {
        const { email } = req.body;

        if (!email?.trim()) {
            return res.status(400).json({
                mensagem: "E-mail é obrigatório"
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const resultadoUsuario = await pool.query(
            `
            SELECT * from view_email_verificacao
            WHERE email = $1
            `,
            [emailNormalizado]
        );

        if (resultadoUsuario.rows.length === 0) {
            return res.status(200).json({
                mensagem: mensagemGenerica
            });
        }

        const usuario = resultadoUsuario.rows[0];

        client = await pool.connect();

        await client.query("BEGIN");
        transactionIniciada = true;

        // Um novo pedido invalida códigos de recuperação anteriores ainda pendentes.
        await client.query(
            `
            UPDATE codigos_verificacao
            SET usado_em = NOW()
            WHERE usuario_id = $1
            AND tipo = 'RECUPERAR_SENHA'
            AND usado_em IS NULL
            `,
            [usuario.id]
        );

        const codigo = crypto.randomInt(100000, 1000000).toString();

        const expiraEm = new Date(
            Date.now() + 10 * 60 * 1000
        );

        const codigoHash = await bcrypt.hash(codigo, 10);

        await client.query(
            `
            INSERT INTO codigos_verificacao
            (
                usuario_id,
                codigo_hash,
                tipo,
                expira_em
            )
            VALUES
                ($1, $2, $3, $4)
            `,
            [usuario.id, codigoHash, "RECUPERAR_SENHA", expiraEm]
        );

        await client.query("COMMIT");
        transactionIniciada = false;

        await enviarCodigoRecuperacaoSenha(
            emailNormalizado,
            codigo
        );

        return res.status(200).json({
            mensagem: mensagemGenerica
        });

    } catch (error) {

        console.error("ERRO AO SOLICITAR RECUPERAÇÃO DE SENHA:");
        console.error(error);

        if (client && transactionIniciada) {
            await client.query("ROLLBACK");
        }

        return res.status(500).json({
            mensagem: "Erro ao solicitar recuperação de senha."
        });
    }
    finally {
        if (client) {
            client.release();
        }
    }
}

async function redefinirSenha(req, res) {
    
    let client;
    let transactionIniciada = false;

    const mensagemGenerica =
        "Se este e-mail estiver cadastrado, atualizaremos a senha.";

    try{
        const {email, codigo, novaSenha} = req.body

        if (!email?.trim() || !codigo?.trim() || !novaSenha?.trim()) {
            return res.status(400).json({
                mensagem: "E-mail, código e a senha são obrigatórios."
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

         if (!/^\d{6}$/.test(codigo)) {
            return res.status(400).json({
                mensagem:
                    "O código deve conter exatamente 6 dígitos."
            });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({
                mensagem: "A senha deve ter pelo menos 6 caracteres."
            });
        }

        const resultadoUsuario = await pool.query(
                    `
                    SELECT * from view_email_verificacao
                    WHERE email = $1
                    `,
                    [emailNormalizado]
                );
                
        if (resultadoUsuario.rows.length === 0) {
            return res.status(200).json({
                mensagem: mensagemGenerica
            });
        }

        const usuario = resultadoUsuario.rows[0]

        const resultadoCodigo = await pool.query(
            `
            SELECT
                id,
                codigo_hash,
                expira_em
            FROM codigos_verificacao
            WHERE usuario_id = $1
            AND tipo = 'RECUPERAR_SENHA'
            AND usado_em IS NULL
            ORDER BY criado_em DESC
            LIMIT 1
            `,
            [usuario.id]
        )

        if (resultadoCodigo.rows.length === 0) {
            return res.status(400).json({
                mensagem:
                    "Nenhum código de verificação válido foi encontrado."
            });
        }

        const registroCodigo = resultadoCodigo.rows[0];

        const expiraEm = new Date(registroCodigo.expira_em);

        if (new Date() > expiraEm) {
            return res.status(400).json({
                mensagem:
                    "O código de verificação expirou."
            });
        }

        const codigoCorreto =
            await bcrypt.compare(
                codigo,
                registroCodigo.codigo_hash
            );

        if (!codigoCorreto) {
            return res.status(400).json({
                mensagem:
                    "Código de verificação inválido."
            });
        }

        client = await pool.connect();

        await client.query("BEGIN")
        transactionIniciada = true;

        const senhaHash = await bcrypt.hash(novaSenha, 10);

        await client.query(
            `
            UPDATE usuarios
            SET senha = $1
            where id = $2
            `,
        [senhaHash, usuario.id])


        await client.query(
            `
            UPDATE codigos_verificacao
            SET usado_em = NOW()
            where id = $1
            `,
        [registroCodigo.id])

        await client.query("COMMIT");
        transactionIniciada = false;
        
        return res.status(200).json({
            mensagem: "Senha redefinida com sucesso!"
        })

    }catch(error){

        console.error(error)
        if(client  && transactionIniciada){
            await client.query("ROLLBACK")
        }
        return res.status(500).json({
            mensagem: "Erro ao redefinir senha"
        })
    }

    finally{
        if(client){
            client.release();
        }
    }
}

async function logoutUsuario(req, res){

    try{

        const {jti, iat, exp} = req.usuario
        const iatConvertido = new Date(req.usuario.iat * 1000)
        const expConvertido = new Date(req.usuario.exp * 1000)
        
        await pool.query(
            `
            INSERT into tokens_invalidados
            (jti_id, criado_em, expira_em)
            VALUES ($1, $2, $3)
            `,[jti, iatConvertido, expConvertido])

        return res.status(200).json({
            mensagem:"Logout feito com sucesso!"
        })


    }catch(error){
        console.error(error)
        return res.status(500).json({
            mensagem:"Erro ao fazer logout."
        })
    }
}

async function obterUsuarioAtual(req, res) {

    try {

        const usuarioId = req.usuario.id;

        const resultado = await pool.query(
            `
            SELECT
                id,
                usuario,
                email,
                nivel_acesso
            FROM usuarios
            WHERE id = $1
            `,
            [usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        return res.status(200).json(
            resultado.rows[0]
        );

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao buscar usuário."
        });
    }
}

async function listarUsuarios(req, res) {

    try {

        const resultado = await pool.query(
            `
            SELECT
                id,
                usuario,
                email,
                nivel_acesso,
                criado_em
            FROM usuarios
            ORDER BY id
            `
        );

        return res.status(200).json(
            resultado.rows
        );

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao listar usuários."
        });
    }
}

async function alterarNivelAcesso(req, res) {

    try {

        const { id } = req.params;
        const { nivel_acesso } = req.body;

        const niveisValidos = [
            "ADMIN",
            "OPERADOR",
            "VISUALIZADOR"
        ];

        if (!nivel_acesso) {
            return res.status(400).json({
                mensagem:
                    "O nível de acesso é obrigatório."
            });
        }

        const nivelNormalizado = nivel_acesso.trim().toUpperCase();

        if (!niveisValidos.includes(nivelNormalizado)) {
            return res.status(400).json({
                mensagem:
                    "Nível de acesso inválido."
            });
        }

        const resultadoUsuario = await pool.query(
            `
            SELECT
                id,
                usuario,
                nivel_acesso
            FROM usuarios
            WHERE id = $1
            `,
            [id]
        );

        if (resultadoUsuario.rows.length === 0) {
            return res.status(404).json({
                mensagem:"Usuário não encontrado."
            });
        }

        const usuario =
            resultadoUsuario.rows[0];

        // O sistema nunca pode ficar sem ao menos um administrador.
        if (usuario.nivel_acesso === "ADMIN" && nivelNormalizado !== "ADMIN"){

            const resultadoAdmins = await pool.query(
                `
                SELECT COUNT(*)::int AS total
                FROM usuarios
                WHERE nivel_acesso = 'ADMIN'
                `
            );

            const totalAdmins = resultadoAdmins.rows[0].total;

            if (totalAdmins <= 1) {
                return res.status(409).json({
                    mensagem:"Não é possível remover o último administrador do sistema."
                });
            }
        }

        const resultadoResponsavel = await pool.query(
            `
            SELECT
                id,
                ativo
            FROM responsaveis
            WHERE usuario_id = $1
            `,
            [id]
        );

        const responsavel = resultadoResponsavel.rows[0];

        // Responsável ativo é, por regra de negócio, sempre OPERADOR.
        if (responsavel?.ativo && nivelNormalizado !== "OPERADOR"){
            return res.status(409).json({
                mensagem:
                    "O usuário é um responsável ativo e deve possuir nível de OPERADOR."
            });
        }

        const resultadoAtualizacao =
            await pool.query(
                `
                UPDATE usuarios
                SET nivel_acesso = $1
                WHERE id = $2
                RETURNING
                    id,
                    usuario,
                    email,
                    nivel_acesso
                `,
                [nivelNormalizado, id]
            );

        return res.status(200).json({
            mensagem:"Nível de acesso atualizado com sucesso.",
            usuario:resultadoAtualizacao.rows[0]
        });

    }catch(error){

        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao alterar nível de acesso."
        });
    }
}

async function listarUsuariosDisponiveisResponsavel(req, res) {

    try {

        const resultado = await pool.query(
            `
            SELECT
                u.id,
                u.usuario,
                u.email,
                u.nivel_acesso
            FROM usuarios u

            LEFT JOIN responsaveis r
                ON r.usuario_id = u.id

            WHERE
                u.nivel_acesso <> 'ADMIN'
                AND r.id IS NULL

            ORDER BY u.usuario
            `
        );

        return res.status(200).json(
            resultado.rows
        );

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            mensagem:
                "Erro ao buscar usuários disponíveis."
        });
    }
}

module.exports = {
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
};
