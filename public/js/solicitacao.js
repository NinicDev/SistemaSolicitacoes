import {
    limparAnexosPendentes,
    buscarAnexos,
    habilitarAnexos,
    desabilitarAnexos,
    enviarAnexos,
    excluirAnexosMarcados,
    limparAnexosParaExcluir
} from "./anexos.js";

import {
    validarFormularioSolicitacao
} from "./validacoes.js";

import {
    formatarTelefone,
    formatarRG,
    formatarCPF,
    formatarCEP,
    aplicarMascarasSolicitacao,
} from "./formatadores.js";

const API_URL = window.location.origin;

const parametros = new URLSearchParams(window.location.search);
const id = parametros.get("id");
const token = localStorage.getItem("token");

const botaoEditar = document.getElementById("editar");
const botaoExcluir = document.getElementById("excluir");
const botaoCancelar = document.getElementById("cancelar");
const botaoAnexar = document.getElementById("anexar-img");
const mensagem = document.getElementById("mensagem-solicitacao");

let nivelAcesso = null;
let modoEdicao = false;
let dadosOriginais = null;

if (!token) {
    window.location.href = "./login.html";
}

async function lerResposta(response) {
    try {
        return await response.json();
    } catch {
        return {
            mensagem: "O servidor retornou uma resposta que não é JSON."
        };
    }
}

async function obterUsuarioAtual() {
    try {
        const resposta = await fetch(
            `${API_URL}/usuarios/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const usuario = await lerResposta(resposta);

        if (resposta.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "./login.html";
            return null;
        }

        if (!resposta.ok) {
            throw new Error(
                usuario.mensagem || "Erro ao buscar usuário atual"
            );
        }

        return usuario;

    } catch (erro) {
        console.error("Erro ao buscar usuário atual:", erro);
        mensagem.textContent =
            "Não foi possível verificar as permissões do usuário.";
        return null;
    }
}

function configurarPermissoes() {
    const podeEditar =
        nivelAcesso === "ADMIN" ||
        nivelAcesso === "OPERADOR";

    botaoEditar.hidden = !podeEditar;
    botaoExcluir.hidden = nivelAcesso !== "ADMIN";

    // Somente quem pode editar precisa do controle de anexos.
    // Ele permanece desabilitado até entrar no modo de edição.
    botaoAnexar.hidden = !podeEditar;
    botaoAnexar.disabled = true;

    botaoCancelar.hidden = true;
    botaoCancelar.disabled = true;
}


async function buscarSolicitacao() {

    try {
        const resposta = await fetch(
            `${API_URL}/solicitacoes/${id}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

        );

        if (!resposta.ok) {
            const erro = await resposta.json();
            throw new Error(erro.mensagem || "Erro ao buscar solicitação");
        }

        const solicitacao = await resposta.json();
       
        preencherSolicitacao(solicitacao);
        await carregarResponsaveis(
            solicitacao.responsavel_id,
            solicitacao.responsavel
        );
        await carregarTiposServico(solicitacao.tipo_servico_id);
        await buscarAnexos(id, token, modoEdicao);

    }catch(erro){
        console.error("Erro ao buscar solicitação:", erro);

    }
}

function preencherSolicitacao(solicitacao) {

    document.getElementById("nome").value = solicitacao.nome;
    document.getElementById("cpf").value =
        formatarCPF(solicitacao.cpf);

    document.getElementById("rg").value =
        formatarRG(solicitacao.rg);

    document.getElementById("telefone-celular").value =
        formatarTelefone(solicitacao.telefone_celular);

    document.getElementById("cep").value =
    formatarCEP(solicitacao.cep);
    document.getElementById("numero").value = solicitacao.numero;
    document.getElementById("complemento").value = solicitacao.complemento;

    document.getElementById("rua").value = solicitacao.rua;
    document.getElementById("bairro").value = solicitacao.bairro;
    document.getElementById("cidade").value = solicitacao.cidade;
    document.getElementById("uf").value = solicitacao.uf;

    document.getElementById("prioridade").value = solicitacao.prioridade;
    document.getElementById("status").value = solicitacao.status;

    document.getElementById("descricao").value = solicitacao.descricao;
}

async function carregarResponsaveis(responsavelId, responsavelNome) {

    try {
        const resposta = await fetch(
            `${API_URL}/responsaveis`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resposta.ok) {
            throw new Error("Erro ao carregar responsáveis");
        }

        const responsaveis = await resposta.json();
        const select = document.getElementById("responsavel-id");

        select.innerHTML = "";

        const optionPadrao = document.createElement("option");
        optionPadrao.value = "";
        optionPadrao.textContent = "Selecione um responsável";
        select.appendChild(optionPadrao);

        let responsavelAtualEncontrado = false;

        responsaveis.forEach(responsavel => {
            const option = document.createElement("option");

            option.value = responsavel.id;
            option.textContent = responsavel.nome;

            if (Number(responsavel.id) === Number(responsavelId)) {
                responsavelAtualEncontrado = true;
            }

            select.appendChild(option);
        });

        if (
            responsavelId &&
            !responsavelAtualEncontrado
        ) {
            const optionResponsavelInativo = document.createElement("option");

            optionResponsavelInativo.value = responsavelId;
            optionResponsavelInativo.textContent =
                `${responsavelNome || "Responsável"} (INATIVO)`;

            select.appendChild(optionResponsavelInativo);
        }

        select.value = responsavelId ?? "";

    } catch (erro) {
        console.error("Erro ao carregar responsáveis:", erro);
    }
}

async function carregarTiposServico(tipoServicoId) {

    try {
        const resposta = await fetch(
            `${API_URL}/tipos-servico`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resposta.ok) {
            throw new Error("Erro ao carregar tipos de serviço");
        }

        const tiposServico = await resposta.json();
        const select = document.getElementById("tipo-servico-id");

        tiposServico.forEach(tipo => {

            const option = document.createElement("option");

            option.value = tipo.id;
            option.textContent = tipo.nome;

            select.appendChild(option);
        });

        select.value = tipoServicoId;

    }catch(erro){
        console.error("Erro ao carregar tipos de serviço:", erro);

    }
}

function pegarNumeroOuNull(id) {
    const valor = document.getElementById(id).value;

    if (valor === "") {
        return null;
    }

    return Number(valor);
}

botaoEditar.addEventListener("click", async function() {

    if (
        nivelAcesso !== "ADMIN" &&
        nivelAcesso !== "OPERADOR"
    ) {
        return;
    }

    const campos = document.querySelectorAll(
        "#solicitacao-form input, #solicitacao-form select, #solicitacao-form textarea"
    );

    if (!modoEdicao) {
        dadosOriginais = obterDadosFormulario();
        campos.forEach(campo => {
            campo.disabled = false;
        });
        botaoEditar.textContent = "Salvar";
        botaoCancelar.hidden = false;
        botaoCancelar.disabled = false;
        habilitarAnexos();
        modoEdicao = true;
        await buscarAnexos(id, token, modoEdicao);
        return;
    }
    const dados = obterDadosFormulario();

    const erroValidacao =
    validarFormularioSolicitacao(dados);

    if (erroValidacao) {
        const mensagem =
            document.getElementById("mensagem-solicitacao");

        mensagem.textContent = erroValidacao;
        return;
}
    try{    
        await atualizarSolicitacao(dados);

        await excluirAnexosMarcados(token);

        await enviarAnexos(id, token);

            const mensagem = document.getElementById("mensagem-solicitacao");

            mensagem.textContent = "Solicitação atualizada com sucesso!";
            campos.forEach(campo => {
                campo.disabled = true;
                });

                botaoEditar.textContent = "Editar";
                modoEdicao = false;
                await buscarAnexos(id, token, modoEdicao);
                botaoCancelar.disabled = true;
                botaoCancelar.hidden = true;
                desabilitarAnexos();
    }catch(erro){
        console.error("Não foi possível salvar:", erro);

        const mensagem = document.getElementById("mensagem-solicitacao");
        mensagem.textContent = erro.message;
    }
});

botaoCancelar.addEventListener("click",async function() {

    preencherSolicitacao(dadosOriginais);

    document.getElementById("responsavel-id").value =dadosOriginais.responsavel_id;
    document.getElementById("tipo-servico-id").value = dadosOriginais.tipo_servico_id;

    const campos = document.querySelectorAll(
        "#solicitacao-form input, #solicitacao-form select, #solicitacao-form textarea"
    );

    campos.forEach(campo => {
        campo.disabled = true;
    });

    botaoEditar.textContent = "Editar";
    botaoCancelar.disabled = true;
    botaoCancelar.hidden = true;
    desabilitarAnexos();
    limparAnexosParaExcluir();
    limparAnexosPendentes();

    modoEdicao = false;
    await buscarAnexos(id, token, modoEdicao);
});
    
botaoExcluir.addEventListener("click", async function() {

    if (nivelAcesso !== "ADMIN") {
        return;
    }

    const confirmou = confirm(
        "Tem certeza que deseja excluir esta solicitação?"
    );

    if (!confirmou) {
        return;
    }

    try {
        const resposta = await fetch(
            `${API_URL}/solicitacoes/${id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resposta.ok) {
            const erro = await resposta.json();
            throw new Error(
                erro.mensagem || "Erro ao excluir solicitação"
            );
        }

        alert("Solicitação excluída com sucesso!");
        window.location.href = "./solicitacoes.html";

    }catch(erro){
        const mensagem = document.getElementById("mensagem-solicitacao");
        mensagem.textContent = erro.message;

    }
});

const botaoImprimir = document.getElementById("imprimir");

botaoImprimir.addEventListener("click", async function() {

    try {
        const resposta = await fetch(
            `${API_URL}/solicitacoes/${id}/pdf`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resposta.ok) {
            let mensagemErro = "Erro ao gerar PDF";

            try {
                const erro = await resposta.json();
                mensagemErro = erro.mensagem || mensagemErro;
            } catch {}

            throw new Error(mensagemErro);
        }

        const blob = await resposta.blob();
        const urlPdf = URL.createObjectURL(blob);

        window.open(urlPdf, "_blank");

    } catch (erro) {
        const mensagem = document.getElementById("mensagem-solicitacao");
        mensagem.textContent = erro.message;
    }
});

function obterDadosFormulario() {
    const dados = {
        nome: document.getElementById("nome").value.trim(),
        cpf: document.getElementById("cpf").value.replace(/\D/g, ""),
        rg: document.getElementById("rg").value.replace(/\D/g, ""),
        telefone_celular: document.getElementById("telefone-celular").value.replace(/\D/g, ""),
        cep: document.getElementById("cep").value.replace(/\D/g, ""),
        numero: document.getElementById("numero").value.trim(),
        complemento: document.getElementById("complemento").value.trim(),
        rua: document.getElementById("rua").value.trim(),
        bairro: document.getElementById("bairro").value.trim(),
        cidade: document.getElementById("cidade").value.trim(),
        uf: document.getElementById("uf").value.trim().toUpperCase(),
        responsavel_id: pegarNumeroOuNull("responsavel-id"),
        tipo_servico_id: pegarNumeroOuNull("tipo-servico-id"),
        prioridade: document.getElementById("prioridade").value,
        status: document.getElementById("status").value,
        descricao: document.getElementById("descricao").value.trim()
    };

    return dados;
}

async function atualizarSolicitacao(dados) {

    try {
        const resposta = await fetch(
            `${API_URL}/solicitacoes/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify(dados)
            }
        );

         if (!resposta.ok) {
            const erro = await resposta.json();
            throw new Error(erro.mensagem || "Erro ao atualizar solicitação");
        }

        const resultado = await resposta.json();

        return resultado;

    }catch(erro){
        console.error("Erro ao atualizar solicitação:", erro);
        throw erro;
    }
}

async function iniciarPagina() {

    const usuario = await obterUsuarioAtual();

    if (!usuario) {
        return;
    }

    nivelAcesso = usuario.nivel_acesso;

    configurarPermissoes();

    aplicarMascarasSolicitacao();

    await buscarSolicitacao();
}

iniciarPagina();
