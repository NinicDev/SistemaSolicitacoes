// Importa o pool de conexões para realizar validações
// que dependem de informações existentes no banco.
const pool = require("../../config/database");


// Valida matematicamente os dois dígitos verificadores do CPF.
function validarCPF(cpf) {

    // Impede CPFs formados pelo mesmo número repetido,
    // como 11111111111 ou 00000000000.
    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    // Calcula o primeiro dígito verificador.
    let soma = 0;

    for (let i = 0; i < 9; i++) {
        soma += Number(cpf[i]) * (10 - i);
    }

    let resto = soma % 11;

    let primeiroDigito =
        resto < 2 ? 0 : 11 - resto;

    // Compara o primeiro dígito calculado
    // com o primeiro dígito verificador recebido.
    if (primeiroDigito !== Number(cpf[9])) {
        return false;
    }

    // Reinicia a soma para calcular
    // o segundo dígito verificador.
    soma = 0;

    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i);
    }

    resto = soma % 11;

    let segundoDigito =
        resto < 2 ? 0 : 11 - resto;

    // Compara o segundo dígito calculado
    // com o último número do CPF recebido.
    if (segundoDigito !== Number(cpf[10])) {
        return false;
    }

    // Se todas as verificações forem aprovadas,
    // o CPF é considerado válido.
    return true;
}

// Middleware responsável por validar os dados
// de uma solicitação antes de chegar ao controller.
async function validarSolicitacao(req, res, next) {

    try {

        // Recupera somente os campos necessários
        // para as validações realizadas neste middleware.
        const {
            nome,
            cpf,
            cep,
            responsavel_id,
            tipo_servico_id,
            prioridade,
            status
        } = req.body;

        // Lista dos únicos status aceitos pelo sistema.
        const statusValidos = [
            "ABERTA",
            "EM_ANDAMENTO",
            "CONCLUIDA",
            "CANCELADA"
        ];

        // Status é opcional em algumas operações,
        // mas, caso seja enviado, precisa ser válido.
        if (status && !statusValidos.includes(status)) {
            return res.status(400).json({
                mensagem: "Status inválido."
            });
        }

        // Verifica se todos os campos obrigatórios
        // foram enviados na requisição.
        if (!nome || !cpf || !cep || !tipo_servico_id || !prioridade) {
            return res.status(400).json({
                mensagem: "Preencha todos os campos obrigatórios."
            });
        }

        // O CPF deve possuir exatamente 11 dígitos numéricos.
        if (!/^\d{11}$/.test(cpf)) {
            return res.status(400).json({
                mensagem: "CPF deve conter exatamente 11 números."
            });
        }

        // Depois de validar o formato, verifica
        // matematicamente os dígitos verificadores do CPF.
        if (!validarCPF(cpf)) {
            return res.status(400).json({
                mensagem: "CPF inválido."
            });
        }

        // O CEP deve possuir exatamente 8 dígitos numéricos.
        if (!/^\d{8}$/.test(cep)) {
            return res.status(400).json({
                mensagem: "CEP deve conter exatamente 8 números."
            });
        }

        // Define os únicos níveis de prioridade
        // aceitos pelo sistema.
        const prioridadesValidas = [
            "BAIXO",
            "MEDIO",
            "ALTO"
        ];

        // Impede o envio de uma prioridade
        // que não esteja entre as opções permitidas.
        if (!prioridadesValidas.includes(prioridade)) {
            return res.status(400).json({
                mensagem: "Prioridade inválida."
            });
        }

        // Consulta o banco para confirmar que
        // o tipo de serviço informado realmente existe.
        const tipoServicoExiste = await pool.query(
            "SELECT id FROM tipos_servico WHERE id = $1",
            [tipo_servico_id]
        );

        if (tipoServicoExiste.rows.length === 0) {
            return res.status(400).json({
                mensagem: "Tipo de serviço inválido."
            });
        }

        // O responsável não é obrigatório.
        // Porém, caso um ID seja enviado, precisamos confirmar
        // que ele corresponde a um responsável existente.
        if (responsavel_id) {

            const responsavelExiste = await pool.query(
                "SELECT id FROM responsaveis WHERE id = $1",
                [responsavel_id]
            );

            if (responsavelExiste.rows.length === 0) {
                return res.status(400).json({
                    mensagem: "Responsável inválido."
                });
            }
        }

        // Todas as validações foram aprovadas.
        // A requisição pode seguir para o controller.
        return next();

    } catch (error) {

        console.error("ERRO NA VALIDAÇÃO:", error);

        // Trata erros inesperados ocorridos durante
        // o processo de validação.
        return res.status(500).json({
            mensagem: "Erro ao validar solicitação."
        });
    }
}

module.exports = validarSolicitacao;