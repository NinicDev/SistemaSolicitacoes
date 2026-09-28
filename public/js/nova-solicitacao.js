import {
    enviarAnexos
} from "./anexos.js";

import {
    validarFormularioSolicitacao
} from "./validacoes.js";

import {
    aplicarMascarasSolicitacao
} from "./formatadores.js";

const token = localStorage.getItem("token");
const API_URL = "http://localhost:3000";

async function verificarPermissao() {

    if (!token) {
        window.location.href = "./login.html";
        return false;
    }

    try {
        const response = await fetch(
            `${API_URL}/usuarios/me`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const dados = await lerResposta(response);

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "./login.html";
            return false;
        }

        if (!response.ok) {
            window.location.href = "./inicio.html";
            return false;
        }

        const niveisPermitidos = [
            "ADMIN",
            "OPERADOR"
        ];

        if (!niveisPermitidos.includes(dados.nivel_acesso)) {
            window.location.href = "./inicio.html";
            return false;
        }

        return true;

    } catch (error) {
        console.error("Erro ao verificar permissão:", error);

        const mensagemElemento =
            document.querySelector("#mensagem-solicitacao");

        if (mensagemElemento) {
            mostrarMensagem(
                mensagemElemento,
                "Não foi possível verificar sua permissão.",
                true
            );
        }

        return false;
    }
}


async function buscarCep() {
            
            const cep = document.getElementById("cep").value;

            const cepLimpo = cep.replace(/\D/g, "")

            try{
                if (cepLimpo.length !== 8) {
                    alert("CEP inválido")
                    return;
                }

                const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

                const dados = await resposta.json();

                if (dados.erro) {
                    alert("CEP não encontrado");
                    return;
                }
                
                document.getElementById("rua").value = dados.logradouro;
                document.getElementById("bairro").value = dados.bairro;
                document.getElementById("cidade").value = dados.localidade;
                document.getElementById("uf").value = dados.uf;

            }catch(error){
                alert("Erro ao buscar CEP")
            }
}
document.getElementById("cep").addEventListener("blur", buscarCep);

function mostrarMensagem(elemento, mensagem, erro = false) {

            elemento.textContent = mensagem;

            elemento.classList.remove("sucesso", "erro");

            elemento.classList.add(
                erro ? "erro" : "sucesso"
            );
}

async function carregarResponsaveis() {
        try{
            const response = await fetch(
                `${API_URL}/responsaveis`,
                    {
                        method:"GET",
                        headers: {
                        "Authorization": `Bearer ${token}`
                        }
                    }
            )
            const dados = await response.json()
            

            const selectResponsavel = document.getElementById("responsavel-id");
            selectResponsavel.innerHTML = `
                <option value="">Selecione um responsável</option>
            `;

            dados.forEach(responsavel => {

                const option = document.createElement("option");

                option.value = responsavel.id;

                option.textContent = responsavel.nome;

                selectResponsavel.appendChild(option);

            });
            
        }catch(error){
            console.error("Erro ao buscar responsáveis:", error);
        }
}   

async function carregarTiposServico() {
        try{
            const response = await fetch(
                `${API_URL}/tipos-servico`,
                    {
                        method:"GET",
                        headers: {
                        "Authorization": `Bearer ${token}`
                        }
                    }
            )
            const dados = await response.json()
            const selectTipoServico = document.getElementById("tipo-servico-id");
            selectTipoServico.innerHTML = `
                <option value="">Selecione um tipo de serviço</option>
            `;
            dados.forEach(tiposervico => {

                const option = document.createElement("option");

                option.value = tiposervico.id;

                option.textContent = tiposervico.nome;

                selectTipoServico.appendChild(option);

            });
            
        }catch(error){
            console.error("Erro ao buscar tipos de serviço:", error);
        }
}

function pegarValor(id) {
            return document.querySelector(id).value.trim();
}

function pegarNumeroOuNull(id) {

            const valor = pegarValor(id);

            if (valor === "") {
                return null;
            }

            return Number(valor);
}

function montarSolicitacao() {

            return {
                nome: pegarValor("#nome"),
                cpf: pegarValor("#cpf").replace(/\D/g, ""),
                rg: pegarValor("#rg").replace(/\D/g, ""),
                telefone_celular: pegarValor("#telefone-celular").replace(/\D/g, ""),
                rua: pegarValor("#rua"),
                numero: pegarValor("#numero"),
                bairro: pegarValor("#bairro"),
                cidade: pegarValor("#cidade"),
                uf: pegarValor("#uf").toUpperCase(),
                cep: pegarValor("#cep").replace(/\D/g, ""),
                complemento: pegarValor("#complemento"),
                responsavel_id: pegarNumeroOuNull("#responsavel-id"),
                tipo_servico_id: pegarNumeroOuNull("#tipo-servico-id"),
                prioridade: pegarValor("#prioridade"),
                descricao: pegarValor("#descricao")
            };
}

function limparFormulario() {
    document.querySelector("#solicitacao-form").reset();
}

const limpar = document.getElementById("limpar");

limpar.addEventListener("click", function(){
    limparFormulario();
})

async function lerResposta(response) {

    try {
        return await response.json();

    }catch{
        return{
                mensagem: "O servidor retornou uma resposta que não é JSON."
            };
    }
}

document.querySelector("#criar").addEventListener("click", async function () {
    const mensagemElemento = document.querySelector("#mensagem-solicitacao");
    const solicitacao = montarSolicitacao();

    const erroValidacao = validarFormularioSolicitacao(solicitacao);

    if (erroValidacao) {
        mostrarMensagem(
            mensagemElemento,
            erroValidacao,
            true
        );

        return;
    }

    try{
        const response = await fetch(
            `${API_URL}/solicitacoes`,
                {
                    method:"POST",
                    headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(solicitacao)
                }
            )

        const dados = await lerResposta(response);

        if (response.ok) {

            await enviarAnexos(dados.id, token);
            
            mostrarMensagem(
                mensagemElemento,
                dados.mensagem || "Solicitação criada com sucesso"
        );

        window.location.href = `./solicitacao.html?id=${dados.id}`;

        }else{
            mostrarMensagem(
                mensagemElemento,
                dados.mensagem || "Erro ao criar solicitação",
                true
            );
        }
    } catch (error) {
        console.error("Erro ao criar solicitação:", error);

        mostrarMensagem(
            mensagemElemento,
            "Não foi possível conectar ao servidor.",
            true
        );
    }

});

async function iniciar() {

    const autorizado = await verificarPermissao();

    if (!autorizado) {
        return;
    }

    aplicarMascarasSolicitacao();

    await Promise.all([
        carregarResponsaveis(),
        carregarTiposServico()
    ]);
}

iniciar();
