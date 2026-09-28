const pool = require("../../config/database")

async function listarResponsaveis(req, res){

    try{
        const resultado = await pool.query(
            `
            SELECT
                id,
                nome
            FROM responsaveis
            WHERE ativo = TRUE
            ORDER BY nome;
            `)

            return res.status(200).json(resultado.rows)

    }catch(error){
        return  res.status(500).json({
            mensagem: "Erro ao buscar responsavéis"
        })
    }
    

}

async function listarResponsaveisAdmin(req, res) {

    try {

        const resultado = await pool.query(
            `
            SELECT
                r.id,
                r.nome,
                r.usuario_id,
                r.ativo,
                u.usuario,
                u.email,
                u.nivel_acesso
            FROM responsaveis r
            LEFT JOIN usuarios u
                ON u.id = r.usuario_id
            ORDER BY r.nome
            `
        );

        return res.status(200).json(
            resultado.rows
        );

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            mensagem:
                "Erro ao listar responsáveis."
        });
    }
}

async function cadastrarResponsavel(req, res) {

    const client = await pool.connect();

    try {

        const { usuario_id } = req.body;

        if (!usuario_id) {
            return res.status(400).json({
                mensagem:
                    "O usuário é obrigatório."
            });
        }

        // Criar o responsável e promover o usuário para OPERADOR é uma única operação lógica.
        await client.query("BEGIN");

        const resultadoUsuario = await client.query(
            `
            SELECT
                id,
                usuario,
                nivel_acesso
            FROM usuarios
            WHERE id = $1
            `,
            [usuario_id]
        );

        if (resultadoUsuario.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                mensagem:
                    "Usuário não encontrado."
            });
        }

        const usuario =
            resultadoUsuario.rows[0];

        if (usuario.nivel_acesso === "ADMIN") {

            await client.query("ROLLBACK");

            return res.status(409).json({
                mensagem:
                    "Um administrador não pode ser cadastrado como responsável."
            });
        }

        const resultadoResponsavel =
            await client.query(
                `
                SELECT id
                FROM responsaveis
                WHERE usuario_id = $1
                `,
                [usuario_id]
            );

        if (resultadoResponsavel.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                mensagem:
                    "Este usuário já está cadastrado como responsável."
            });
        }

        const novoResponsavel =
            await client.query(
                `
                INSERT INTO responsaveis
                    (
                        nome,
                        usuario_id
                    )
                VALUES
                    ($1, $2)
                RETURNING
                    id,
                    nome,
                    usuario_id,
                    ativo
                `,
                [
                    usuario.usuario,
                    usuario.id
                ]
            );

        await client.query(
            `
            UPDATE usuarios
            SET nivel_acesso = 'OPERADOR'
            WHERE id = $1
            `,
            [usuario.id]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            mensagem:
                "Responsável cadastrado com sucesso.",
            responsavel:
                novoResponsavel.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        return res.status(500).json({
            mensagem:
                "Erro ao cadastrar responsável."
        });

    } finally {

        client.release();
    }
}

async function alterarStatusResponsavel(req, res) {

    const client = await pool.connect();

    try {

        const { id } = req.params;
        const { ativo } = req.body;

        if (typeof ativo !== "boolean") {
            return res.status(400).json({
                mensagem:
                    "O campo ativo deve ser true ou false."
            });
        }

        // Status do responsável e nível do usuário precisam permanecer sincronizados.
        await client.query("BEGIN");

        const resultadoResponsavel =
            await client.query(
                `
                SELECT
                    id,
                    nome,
                    usuario_id,
                    ativo
                FROM responsaveis
                WHERE id = $1
                `,
                [id]
            );

        if (resultadoResponsavel.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                mensagem:
                    "Responsável não encontrado."
            });
        }

        const responsavel =
            resultadoResponsavel.rows[0];

        if (!responsavel.usuario_id) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                mensagem:
                    "Este responsável não está vinculado a um usuário."
            });
        }

        const resultadoUsuario = await client.query(
            `
            SELECT
                id,
                nivel_acesso
            FROM usuarios
            WHERE id = $1
            FOR UPDATE
            `,
            [responsavel.usuario_id]
        );

        if (resultadoUsuario.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                mensagem: "Usuário vinculado ao responsável não foi encontrado."
            });
        }

        const usuario = resultadoUsuario.rows[0];

        if (ativo && usuario.nivel_acesso === "ADMIN") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                mensagem:
                    "Um administrador não pode ser reativado como responsável. Altere o nível de acesso dele antes."
            });
        }

        await client.query(
            `
            UPDATE responsaveis
            SET ativo = $1
            WHERE id = $2
            `,
            [
                ativo,
                id
            ]
        );

        const novoNivel =
            ativo
                ? "OPERADOR"
                : "VISUALIZADOR";

        await client.query(
            `
            UPDATE usuarios
            SET nivel_acesso = $1
            WHERE id = $2
            `,
            [
                novoNivel,
                responsavel.usuario_id
            ]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            mensagem:
                ativo
                    ? "Responsável ativado com sucesso."
                    : "Responsável desativado com sucesso."
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        return res.status(500).json({
            mensagem:
                "Erro ao alterar status do responsável."
        });

    } finally {

        client.release();
    }
}

module.exports = {
    listarResponsaveis,
    listarResponsaveisAdmin,
    cadastrarResponsavel,
    alterarStatusResponsavel
};