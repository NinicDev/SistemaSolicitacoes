const pool = require("../../config/database");
const fs = require("fs/promises");

async function listarSolicitacoes(req, res) {

    try {

        const resultado = await pool.query(
            `
            SELECT
                s.*,
                r.nome AS responsavel,
                ts.nome AS tipo_servico
            FROM solicitacoes s
            LEFT JOIN responsaveis r
                ON s.responsavel_id = r.id
            JOIN tipos_servico ts
                ON s.tipo_servico_id = ts.id
            ORDER BY s.id
            `
        );


        return res.status(200).json(resultado.rows);

    } catch (error) {

        return res.status(500).json({
            mensagem: "Erro ao listar solicitações"
        });
    }
}

async function criarSolicitacao(req, res) {

    try {

        const {
            nome,
            cpf,
            rg,
            telefone_celular,
            rua,
            numero,
            bairro,
            cidade,
            uf,
            cep,
            complemento,
            responsavel_id,
            tipo_servico_id,
            prioridade,
            descricao
        } = req.body;


        const resultado = await pool.query(
            `
            INSERT INTO solicitacoes (
                nome,
                cpf,
                rg,
                telefone_celular,
                rua,
                numero,
                bairro,
                cidade,
                uf,
                cep,
                complemento,
                responsavel_id,
                tipo_servico_id,
                prioridade,
                descricao
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15
            )
            RETURNING id
            `,
            [
                nome,
                cpf,
                rg,
                telefone_celular,
                rua,
                numero,
                bairro,
                cidade,
                uf,
                cep,
                complemento,
                responsavel_id,
                tipo_servico_id,
                prioridade,
                descricao
            ]
        );


        return res.status(201).json({
            mensagem: "Solicitação criada com sucesso!",
            id: resultado.rows[0].id
        });

    } catch (error) {

        console.error("ERRO AO CRIAR SOLICITAÇÃO:", error);


        return res.status(500).json({
            mensagem: "Erro ao criar solicitação"
        });
    }
}

async function buscarPorId(req, res) {

    try {

        const { id } = req.params;

        const resultado = await pool.query(
            `
            SELECT * from view_solicitacoes_registro
            WHERE id = $1
            `,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Solicitação não encontrada"
            });
        }

        return res.status(200).json(resultado.rows[0]);

    } catch (error) {

        return res.status(500).json({
            mensagem: "Erro ao buscar solicitação"
        });
    }
}

async function atualizarSolicitacao(req, res) {

    try {

        const { id } = req.params;

        const {
            nome,
            cpf,
            rg,
            telefone_celular,
            rua,
            numero,
            bairro,
            cidade,
            uf,
            cep,
            complemento,
            responsavel_id,
            tipo_servico_id,
            prioridade,
            descricao,
            status
        } = req.body;

        const resultado = await pool.query(
            `
            UPDATE solicitacoes
            SET
                nome = $1,
                cpf = $2,
                rg = $3,
                telefone_celular = $4,
                rua = $5,
                numero = $6,
                bairro = $7,
                cidade = $8,
                uf = $9,
                cep = $10,
                complemento = $11,
                responsavel_id = $12,
                tipo_servico_id = $13,
                prioridade = $14,
                descricao = $15,
                status = $16
            WHERE id = $17
            `,
            [
                nome,
                cpf,
                rg,
                telefone_celular,
                rua,
                numero,
                bairro,
                cidade,
                uf,
                cep,
                complemento,
                responsavel_id,
                tipo_servico_id,
                prioridade,
                descricao,
                status,
                id
            ]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: "Solicitação não encontrada"
            });
        }

        return res.status(200).json({
            mensagem: "Solicitação atualizada com sucesso!"
        });

    } catch (error) {
         console.error("ERRO AO ATUALIZAR SOLICITAÇÃO:", error);

        return res.status(500).json({
            mensagem: "Erro ao atualizar solicitação"
        });
    }
}

async function excluirSolicitacao(req, res) {

    const { id } = req.params;

    let client;

    try {

        client = await pool.connect();

        await client.query("BEGIN");

        // Guarda os caminhos antes do DELETE; os registros de anexos caem por CASCADE.
        const resultadoAnexos = await client.query(
            `
            SELECT caminho_arquivo
            FROM anexos
            WHERE id_solicitacao = $1
            `,
            [id]
        );

        const resultado = await client.query(
            `
            DELETE FROM solicitacoes
            WHERE id = $1
            RETURNING id
            `,
            [id]
        );

        if (resultado.rowCount === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                mensagem: "Solicitação não encontrada"
            });
        }

        await client.query("COMMIT");

        // Arquivos físicos só são removidos depois que a transação do banco foi confirmada.
        for (const anexo of resultadoAnexos.rows) {
            try {
                await fs.unlink(anexo.caminho_arquivo);
            } catch (erroArquivo) {
                if (erroArquivo.code !== "ENOENT") {
                    console.error(
                        "Solicitação excluída, mas um arquivo físico não pôde ser removido:",
                        erroArquivo
                    );
                }
            }
        }

        return res.status(200).json({
            mensagem: "Solicitação excluída com sucesso!"
        });

    } catch (error) {

        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch {}
        }

        console.error("Erro ao excluir solicitação:", error);

        return res.status(500).json({
            mensagem: "Erro ao excluir solicitação"
        });

    } finally {
        if (client) {
            client.release();
        }
    }
}

module.exports = {
    listarSolicitacoes,
    criarSolicitacao,
    buscarPorId,
    atualizarSolicitacao,
    excluirSolicitacao
};
