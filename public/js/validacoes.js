const PRIORIDADES_VALIDAS = [
    "BAIXO",
    "MEDIO",
    "ALTO"
];

const STATUS_VALIDOS = [
    "ABERTA",
    "EM_ANDAMENTO",
    "CONCLUIDA",
    "CANCELADA"
];

export function validarCPF(cpf) {

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

    const primeiroDigito =
        resto < 2 ? 0 : 11 - resto;

    if (primeiroDigito !== Number(cpf[9])) {
        return false;
    }

    soma = 0;

    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i);
    }

    resto = soma % 11;

    const segundoDigito =
        resto < 2 ? 0 : 11 - resto;

    if (segundoDigito !== Number(cpf[10])) {
        return false;
    }

    return true;
}

function validarTamanhoMaximo(valor, limite, campo) {

    if (valor && valor.length > limite) {
        return `${campo} deve possuir no máximo ${limite} caracteres.`;
    }

    return null;
}

export function validarFormularioSolicitacao(solicitacao) {

    if (!solicitacao.nome) {
        return "Informe o nome.";
    }

    if (!solicitacao.cpf) {
        return "Informe o CPF.";
    }

    if (!validarCPF(solicitacao.cpf)) {
        return "Informe um CPF válido.";
    }

    if (!solicitacao.cep) {
        return "Informe o CEP.";
    }

    if (!/^\d{8}$/.test(solicitacao.cep)) {
        return "CEP deve conter exatamente 8 números.";
    }

    if (
        solicitacao.telefone_celular &&
        !/^\d{11}$/.test(solicitacao.telefone_celular)
    ) {
        return "Telefone deve conter exatamente 11 números.";
    }

    const camposComLimite = [
        {
            valor: solicitacao.nome,
            limite: 80,
            campo: "Nome"
        },
        {
            valor: solicitacao.rg,
            limite: 20,
            campo: "RG"
        },
        {
            valor: solicitacao.rua,
            limite: 150,
            campo: "Rua"
        },
        {
            valor: solicitacao.numero,
            limite: 4,
            campo: "Número"
        },
        {
            valor: solicitacao.bairro,
            limite: 150,
            campo: "Bairro"
        },
        {
            valor: solicitacao.cidade,
            limite: 40,
            campo: "Cidade"
        },
        {
            valor: solicitacao.complemento,
            limite: 100,
            campo: "Complemento"
        },
        {
            valor: solicitacao.descricao,
            limite: 5000,
            campo: "Descrição"
        }
    ];

    for (const regra of camposComLimite) {

        const erro = validarTamanhoMaximo(
            regra.valor,
            regra.limite,
            regra.campo
        );

        if (erro) {
            return erro;
        }
    }

    if(solicitacao.uf && !/^[A-Za-z]{2}$/.test(solicitacao.uf)){
        return "UF deve possuir exatamente 2 letras.";
    }


    if (!solicitacao.tipo_servico_id) {
        return "Selecione um tipo de serviço.";
    }

    if (!solicitacao.prioridade) {
        return "Selecione uma prioridade.";
    }

    if (!PRIORIDADES_VALIDAS.includes(solicitacao.prioridade)) {
        return "Prioridade inválida.";
    }

    if (solicitacao.status && !STATUS_VALIDOS.includes(solicitacao.status)) {
        return "Status inválido.";   
    }

    return null;
}