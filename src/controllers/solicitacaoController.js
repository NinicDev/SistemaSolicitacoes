const pool = require("../../config/database");
const fs = require("fs/promises");

async function listarSolicitacoes(req, res) {

    try {
        const {
            busca,
            status,
            prioridade,
            responsavel_id,
            tipo_servico_id,
            page = "1",
            limit = "20"
        } = req.query;

        const pagina = Number(page);
        const limite = Number(limit);

        if(!Number.isInteger(pagina) || pagina <= 0){
            return res.status(400).json({
                mensagem: "Página inválida."
            });
        }

        if(!Number.isInteger(limite) || limite <= 0 || limite > 100) {
            return res.status(400).json({
                mensagem: "Limite inválido."
            });
        }

        const STATUS_VALIDOS = [
            "ABERTA",
            "EM_ANDAMENTO",
            "CONCLUIDA",
            "CANCELADA"
        ];

        const PRIORIDADES_VALIDAS = [
            "BAIXO",
            "MEDIO",
            "ALTO"
        ];

        if(status && !STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                mensagem: "Status inválido."
            });
        }

        if(prioridade && !PRIORIDADES_VALIDAS.includes(prioridade)){
            return res.status(400).json({
                mensagem: "Prioridade inválida."
            });
        }

        if(responsavel_id && (!Number.isInteger(Number(responsavel_id)) || Number(responsavel_id) <= 0)) {
            return res.status(400).json({
                mensagem: "Responsável inválido."
            });
        }

        if(tipo_servico_id && (!Number.isInteger(Number(tipo_servico_id)) ||Number(tipo_servico_id) <= 0)){
            return res.status(400).json({
                mensagem: "Tipo de serviço inválido."
            });
        }

        const offset = (pagina - 1) * limite;

        const condicoes = [];
        const valores = [];

        if (busca?.trim()) {

            const buscaLimpa = busca.trim();

            const condicoesBusca = [];

            valores.push(`%${buscaLimpa}%`);

            const indiceNome = valores.length;

            condicoesBusca.push(
                `s.nome ILIKE $${indiceNome}`
            );

            const cpfBusca = buscaLimpa.replace(/\D/g, "");

            if (cpfBusca){

                valores.push(`%${cpfBusca}%`);

                const indiceCpf = valores.length;

                condicoesBusca.push(`s.cpf LIKE $${indiceCpf}`);
            }

            if (/^\d+$/.test(buscaLimpa)) {

                valores.push(Number(buscaLimpa));

                const indiceId = valores.length;

                condicoesBusca.push(`s.id = $${indiceId}`);
            }

            condicoes.push(
                `(${condicoesBusca.join(" OR ")})`
            );
        }

        if (status){
            valores.push(status);

            condicoes.push(`s.status = $${valores.length}`);
        }

        if (prioridade) {
            valores.push(prioridade);

            condicoes.push(`s.prioridade = $${valores.length}`);
        }

        if (responsavel_id) {
            valores.push(responsavel_id);

            condicoes.push(`s.responsavel_id = $${valores.length}`);
        }

        if (tipo_servico_id) {
            valores.push(tipo_servico_id);

            condicoes.push(`s.tipo_servico_id = $${valores.length}`);
        }

        let where = "";

        if (condicoes.length > 0) {
            where = `
                WHERE ${condicoes.join(" AND ")}
            `;
        }
        const valoresListagem = [...valores];

        valoresListagem.push(limite);

        const indiceLimite = valoresListagem.length;

        valoresListagem.push(offset);

        const indiceOffset = valoresListagem.length;

        const queryListagem = `
            SELECT
                s.*,
                r.nome AS responsavel,
                ts.nome AS tipo_servico
            FROM solicitacoes s
            LEFT JOIN responsaveis r
                ON s.responsavel_id = r.id
            JOIN tipos_servico ts
                ON s.tipo_servico_id = ts.id
            ${where}
            ORDER BY s.id
            LIMIT $${indiceLimite}
            OFFSET $${indiceOffset}
        `;

        const queryTotal = `
            SELECT COUNT(*) AS total
            FROM solicitacoes s
            ${where}
        `;

        const resultado = await pool.query(
            queryListagem,
            valoresListagem
        );

        const resultadoTotal = await pool.query(
            queryTotal,
            valores
        );

        const total = Number(
            resultadoTotal.rows[0].total
        );

        const totalPaginas = Math.ceil(
            total / limite
        );

        return res.status(200).json({
            solicitacoes: resultado.rows,
            pagina,
            limite,
            total,
            totalPaginas
        });

    }catch(error){
        console.error(
            "ERRO AO LISTAR SOLICITAÇÕES:",
            error
        );

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
