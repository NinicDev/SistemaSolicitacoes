const pool = require("../../config/database");


// Validação dos dígitos verificadores do CPF, recebendo apenas números.
function validarCPF(cpf) {

    if (!/^\d{11}$/.test(cpf)) {
        return false;
    }
    
    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    let soma = 0;

    for (let i = 0; i < 9; i++) {
        soma += Number(cpf[i]) * (10 - i);
    }

    let resto = soma % 11;

    let primeiroDigito =
        resto < 2 ? 0 : 11 - resto;

    if (primeiroDigito !== Number(cpf[9])) {
        return false;
    }

    soma = 0;

    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i);
    }

    resto = soma % 11;

    let segundoDigito =
        resto < 2 ? 0 : 11 - resto;

    if (segundoDigito !== Number(cpf[10])) {
        return false;
    }

    return true;
}

async function validarSolicitacao(req, res, next) {

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
            descricao,
            status
        } = req.body;

        const statusValidos = [
            "ABERTA",
            "EM_ANDAMENTO",
            "CONCLUIDA",
            "CANCELADA"
        ];

        if (status && !statusValidos.includes(status)) {
            return res.status(400).json({
                mensagem: "Status inválido."
            });
        }

        if (!nome || !cpf || !cep || !tipo_servico_id || !prioridade) {
            return res.status(400).json({
                mensagem: "Preencha todos os campos obrigatórios."
            });
        }

        if (!/^\d{11}$/.test(cpf)) {
            return res.status(400).json({
                mensagem: "CPF deve conter exatamente 11 números."
            });
        }

        if (!validarCPF(cpf)) {
            return res.status(400).json({
                mensagem: "CPF inválido."
            });
        }

        if (!/^\d{8}$/.test(cep)) {
            return res.status(400).json({
                mensagem: "CEP deve conter exatamente 8 números."
            });
        }

         if (telefone_celular && !/^\d{11}$/.test(telefone_celular)) {
            return res.status(400).json({
                mensagem: "Telefone deve conter exatamente 11 números."
            });
        }

        if (nome.length > 80) {
            return res.status(400).json({
                mensagem: "Nome deve possuir no máximo 80 caracteres."
            });
        }

        if (rg && rg.length > 20) {
            return res.status(400).json({
                mensagem: "RG deve possuir no máximo 20 caracteres."
            });
        }

        if (rua && rua.length > 150) {
            return res.status(400).json({
                mensagem: "Rua deve possuir no máximo 150 caracteres."
            });
        }

        if (numero && numero.length > 4) {
            return res.status(400).json({
                mensagem: "Número deve possuir no máximo 4 caracteres."
            });
        }

        if (bairro && bairro.length > 150) {
            return res.status(400).json({
                mensagem: "Bairro deve possuir no máximo 150 caracteres."
            });
        }

        if (cidade && cidade.length > 40) {
            return res.status(400).json({
                mensagem: "Cidade deve possuir no máximo 40 caracteres."
            });
        }

        if (uf && uf.length !== 2) {
            return res.status(400).json({
                mensagem: "UF deve possuir exatamente 2 caracteres."
            });
        }

        if (complemento && complemento.length > 100) {
            return res.status(400).json({
                mensagem: "Complemento deve possuir no máximo 100 caracteres."
            });
        }

        if (descricao && descricao.length > 5000) {
            return res.status(400).json({
                mensagem: "Descrição deve possuir no máximo 5000 caracteres."
            });
        }


        const prioridadesValidas = [
            "BAIXO",
            "MEDIO",
            "ALTO"
        ];

        if (!prioridadesValidas.includes(prioridade)) {
            return res.status(400).json({
                mensagem: "Prioridade inválida."
            });
        }

        const tipoServicoExiste = await pool.query(
            "SELECT id FROM tipos_servico WHERE id = $1",
            [tipo_servico_id]
        );

        if (tipoServicoExiste.rows.length === 0) {
            return res.status(400).json({
                mensagem: "Tipo de serviço inválido."
            });
        }

        if (responsavel_id) {

            const resultadoResponsavel = await pool.query(
                `
                SELECT
                    id,
                    ativo
                FROM responsaveis
                WHERE id = $1
                `,
                [responsavel_id]
            );

            if (resultadoResponsavel.rows.length === 0) {
                return res.status(400).json({
                    mensagem: "Responsável inválido."
                });
            }

            const responsavel = resultadoResponsavel.rows[0];

            // Em edição, um responsável inativo pode ser mantido no histórico,
            // mas não pode ser atribuído a novas solicitações.
            if (!responsavel.ativo) {

                let responsavelAtualPodeSerMantido = false;

                if (req.method === "PUT" && req.params.id) {
                    const resultadoSolicitacaoAtual = await pool.query(
                        `
                        SELECT responsavel_id
                        FROM solicitacoes
                        WHERE id = $1
                        `,
                        [req.params.id]
                    );

                    if (resultadoSolicitacaoAtual.rows.length > 0) {
                        const responsavelAtual =
                            resultadoSolicitacaoAtual.rows[0].responsavel_id;

                        responsavelAtualPodeSerMantido =
                            Number(responsavelAtual) === Number(responsavel_id);
                    }
                }

                if (!responsavelAtualPodeSerMantido) {
                    return res.status(400).json({
                        mensagem: "Responsável inativo não pode receber novas solicitações."
                    });
                }
            }
        }

        return next();

    } catch (error) {

        console.error("ERRO NA VALIDAÇÃO:", error);

        return res.status(500).json({
            mensagem: "Erro ao validar solicitação."
        });
    }
}

module.exports = validarSolicitacao;
