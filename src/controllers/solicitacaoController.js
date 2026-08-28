// Importa o pool de conexões para realizar
// as operações das solicitações no PostgreSQL.
const pool = require("../../config/database");

// Lista todas as solicitações cadastradas no sistema.
async function listarSolicitacoes(req, res) {

    try {

        // Além dos dados da solicitação, utiliza JOIN para
        // retornar o nome do responsável e do tipo de serviço,
        // em vez de retornar somente seus IDs.
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


// Cria uma nova solicitação no banco de dados.
async function criarSolicitacao(req, res) {

    try {

        // Recupera os dados enviados pelo cliente.
        // As validações principais já são realizadas
        // anteriormente pelo middleware validarSolicitacao.
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


        // Insere os dados da nova solicitação.
        // Os placeholders ($1, $2...) mantêm os valores
        // separados da instrução SQL e ajudam a prevenir SQL Injection.
        await pool.query(
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
            mensagem: "Solicitação criada com sucesso!"
        });

    } catch (error) {

        console.error("ERRO AO CRIAR SOLICITAÇÃO:", error);


        return res.status(500).json({
            mensagem: "Erro ao criar solicitação"
        });
    }
}

// Busca uma única solicitação através do seu ID.
async function buscarPorId(req, res) {

    try {

        // O ID vem do parâmetro presente na URL.
        // Exemplo: /solicitacoes/5
        const { id } = req.params;

        // Busca a solicitação e também retorna os nomes
        // relacionados ao responsável e ao tipo de serviço.
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
            WHERE s.id = $1
            `,
            [id]
        );

        // Se nenhuma linha foi retornada,
        // não existe solicitação com esse ID.
        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Solicitação não encontrada"
            });
        }

        // Como buscamos apenas um ID,
        // retornamos somente o primeiro registro.
        return res.status(200).json(resultado.rows[0]);

    } catch (error) {

        return res.status(500).json({
            mensagem: "Erro ao buscar solicitação"
        });
    }
}

// Atualiza os dados de uma solicitação existente.
async function atualizarSolicitacao(req, res) {

    try {

        // ID da solicitação que será atualizada.
        const { id } = req.params;

        // Novos valores enviados pelo cliente.
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

        // Atualiza todos os campos da solicitação
        // correspondente ao ID recebido na URL.
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

        // rowCount informa quantas linhas foram afetadas.
        // Se nenhuma linha foi atualizada, o ID não existe.
        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: "Solicitação não encontrada"
            });
        }

        return res.status(200).json({
            mensagem: "Solicitação atualizada com sucesso!"
        });

    } catch (error) {

        return res.status(500).json({
            mensagem: "Erro ao atualizar solicitação"
        });
    }
}

// Exclui uma solicitação através do seu ID.
async function excluirSolicitacao(req, res) {

    try {

        const { id } = req.params;

        // Exclui somente o registro correspondente
        // ao ID recebido na URL.
        const resultado = await pool.query(
            `
            DELETE FROM solicitacoes
            WHERE id = $1
            `,
            [id]
        );

        // Se nenhuma linha foi removida,
        // não existe solicitação com o ID informado.
        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: "Solicitação não encontrada"
            });
        }

        return res.status(200).json({
            mensagem: "Solicitação excluída com sucesso!"
        });

    } catch (error) {

        return res.status(500).json({
            mensagem: "Erro ao excluir solicitação"
        });
    }
}

// Exporta os controllers para que possam
// ser utilizados pelas rotas de solicitações.
module.exports = {
    listarSolicitacoes,
    criarSolicitacao,
    buscarPorId,
    atualizarSolicitacao,
    excluirSolicitacao
};