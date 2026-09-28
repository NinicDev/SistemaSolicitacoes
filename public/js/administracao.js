const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token");

const mensagem = document.querySelector("#mensagem");

const usuariosContainer = document.querySelector("#usuarios-container");

const responsaveisContainer = document.querySelector("#responsaveis-container");

const selectUsuarioResponsavel = document.querySelector("#usuario-responsavel");

const botaoCadastrarResponsavel = document.querySelector("#cadastrar-responsavel");

const botaoAtualizarUsuarios = document.querySelector("#atualizar-usuarios");

const botaoAtualizarResponsaveis = document.querySelector("#atualizar-responsaveis");

const botaoVoltar = document.querySelector("#voltar");

let usuarios = [];
let responsaveis = [];

if (!token) {
    window.location.href =
        "./login.html";
}

botaoVoltar.addEventListener("click",() => { window.location.href = "./inicio.html"; }
);

botaoAtualizarUsuarios.addEventListener("click", carregarUsuarios);


botaoAtualizarResponsaveis.addEventListener( "click", carregarResponsaveis);

botaoCadastrarResponsavel.addEventListener("click", cadastrarResponsavel);

async function lerResposta(response){

    try {
        return await response.json();

    }catch(error){
        return {
            mensagem:
                "O servidor retornou uma resposta inválida."
        };
    }
}

async function verificarAdministrador(){

    try {
        const response = await fetch(
            `${API_URL}/usuarios/me`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const resultado = await lerResposta(response);

        if (response.status === 401){

            localStorage.removeItem("token");

            window.location.href = "./login.html";

            return false;
        }


        if (!response.ok) {
            mensagem.textContent = resultado.mensagem;
            return false;
        }


        if (resultado.nivel_acesso !== "ADMIN"){
            window.location.href ="./inicio.html";
            return false;
        }

        return true;

    }catch(error){

        console.error(error);

        mensagem.textContent = "Não foi possível conectar ao servidor.";
        return false;
    }
}

async function carregarUsuarios(){

    try {
        const response = await fetch(
            `${API_URL}/usuarios`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const resultado = await lerResposta(response);

        if (response.status === 401) {

            localStorage.removeItem("token");
            window.location.href ="./login.html";
            return;
        }

        if (!response.ok) {
            mensagem.textContent = resultado.mensagem;
            return;
        }

        usuarios = resultado;

        renderizarUsuarios();

    }catch(error){
        console.error(error);

        mensagem.textContent ="Erro ao carregar usuários.";
    }
}

function adicionarCelula(linha, valor){

    const td = document.createElement("td");

    td.textContent = valor ?? "";

    linha.appendChild(td);
}

function renderizarUsuarios(){

    usuariosContainer.innerHTML = "";

    if (!usuarios.length) {

        const texto = document.createElement("p");

        texto.textContent = "Nenhum usuário encontrado.";

        usuariosContainer.appendChild(texto);
        return;
    }

    const tabela = document.createElement("table");


    const thead = document.createElement("thead");

    const linhaCabecalho = document.createElement("tr");


    const colunas = [
        "ID",
        "Usuário",
        "E-mail",
        "Nível",
        "Alterar nível"
    ];


    for (const coluna of colunas) {

        const th = document.createElement("th");

        th.textContent = coluna;

        linhaCabecalho.appendChild(th);
    }

    thead.appendChild(linhaCabecalho);

    tabela.appendChild(thead);


    const tbody = document.createElement("tbody");


    for (const usuario of usuarios) {

        const linha = document.createElement("tr");

        adicionarCelula(
            linha,
            usuario.id
        );

        adicionarCelula(
            linha,
            usuario.usuario
        );

        adicionarCelula(
            linha,
            usuario.email
        );

        const tdNivel = document.createElement("td");

        const spanNivel = document.createElement("span");

        spanNivel.textContent = usuario.nivel_acesso;

        spanNivel.classList.add("nivel", `nivel-${usuario.nivel_acesso.toLowerCase()}`);

        tdNivel.appendChild(spanNivel);

        linha.appendChild(tdNivel);


        const tdAcao = document.createElement("td");


        const select = document.createElement("select");

        const niveis = [
            "ADMIN",
            "OPERADOR",
            "VISUALIZADOR"
        ];

        for (const nivel of niveis) {

            const option = document.createElement("option");

            option.value = nivel;

            option.textContent = nivel;

            if (nivel ===usuario.nivel_acesso){
                option.selected = true;
            }

            select.appendChild(option);
        }


        const botao = document.createElement("button");

        botao.type = "button";

        botao.textContent = "Salvar";

        botao.addEventListener("click",() => {alterarNivelUsuario(usuario.id, select.value);});


        tdAcao.appendChild(select);

        tdAcao.appendChild(botao);

        linha.appendChild(tdAcao);


        tbody.appendChild(linha);
    }


    tabela.appendChild(tbody);

    usuariosContainer.appendChild(tabela);
}

async function alterarNivelUsuario(id, nivel_acesso){

    try {
        const response = await fetch(
            `${API_URL}/usuarios/${id}/nivel-acesso`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },
                body: JSON.stringify({
                    nivel_acesso
                })
            }
        );


        const resultado = await lerResposta(response);


        if (!response.ok) {
            mensagem.textContent = resultado.mensagem;
            return;
        }

        mensagem.textContent = resultado.mensagem;


        await carregarUsuarios();

        await carregarResponsaveis();

        await carregarUsuariosDisponiveis();

    }catch(error){
        console.error(error);

        mensagem.textContent = "Erro ao alterar nível de acesso.";
    }
}

async function carregarUsuariosDisponiveis(){

    try {
        const response = await fetch(
            `${API_URL}/usuarios/disponiveis-responsavel`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const resultado = await lerResposta(response);

        if (!response.ok) {
            mensagem.textContent = resultado.mensagem;
            return;
        }

        renderizarUsuariosDisponiveis(resultado);

    }catch(error){

        console.error(error);

        mensagem.textContent = "Erro ao buscar usuários disponíveis.";
    }
}

function renderizarUsuariosDisponiveis(lista){

    selectUsuarioResponsavel.innerHTML = "";

    const optionPadrao = document.createElement("option");

    optionPadrao.value = "";

    optionPadrao.textContent = "Selecione um usuário";

    selectUsuarioResponsavel.appendChild(optionPadrao);

    for (const usuario of lista) {

        const option = document.createElement("option");
        
        option.value = usuario.id;

        option.textContent = `${usuario.usuario} - ${usuario.email}`;

        selectUsuarioResponsavel.appendChild(option);
    }
}

async function cadastrarResponsavel() {

    const usuarioId = selectUsuarioResponsavel.value;

    if (!usuarioId){
        mensagem.textContent ="Selecione um usuário.";
        return;
    }

    try{
        const response = await fetch(
            `${API_URL}/responsaveis`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },
                body: JSON.stringify({
                    usuario_id:
                        Number(usuarioId)
                })
            }
        );

        const resultado = await lerResposta(response);

        if (!response.ok) {
            mensagem.textContent =resultado.mensagem;
            return;
        }

        mensagem.textContent = resultado.mensagem;

        await carregarResponsaveis();

        await carregarUsuarios();

        await carregarUsuariosDisponiveis();

    }catch(error){
        console.error(error);

        mensagem.textContent = "Erro ao cadastrar responsável.";
    }
}

async function carregarResponsaveis() {

    try {
        const response = await fetch(
            `${API_URL}/responsaveis/admin`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const resultado = await lerResposta(response);


        if (!response.ok) {
            mensagem.textContent =resultado.mensagem;
            return;
        }

        responsaveis = resultado;
        renderizarResponsaveis();

    }catch(error){

        console.error(error);

        mensagem.textContent = "Erro ao carregar responsáveis.";
    }
}

function renderizarResponsaveis() {

    responsaveisContainer.innerHTML = "";

    if (!responsaveis.length) {

        const texto = document.createElement("p");

        texto.textContent = "Nenhum responsável cadastrado.";

        responsaveisContainer.appendChild(texto);
        return;
    }


    const tabela = document.createElement("table");


    const thead = document.createElement("thead");

    const linhaCabecalho = document.createElement("tr");


    const colunas = [
        "ID",
        "Responsável",
        "Usuário",
        "E-mail",
        "Status",
        "Ação"
    ];

    for (const coluna of colunas) {

        const th = document.createElement("th");

        th.textContent = coluna;

        linhaCabecalho.appendChild(th);
    }

    thead.appendChild(linhaCabecalho);

    tabela.appendChild(thead);

    const tbody = document.createElement("tbody");


    for (const responsavel of responsaveis) {

        const linha = document.createElement("tr");

        adicionarCelula(
            linha,
            responsavel.id
        );

        adicionarCelula(
            linha,
            responsavel.nome
        );

        adicionarCelula(
            linha,
            responsavel.usuario
        );

        adicionarCelula(
            linha,
            responsavel.email
        );


        const tdStatus = document.createElement("td");

        const status = document.createElement("span");

        status.classList.add("status");

        if (responsavel.ativo) {

            status.textContent = "ATIVO";

            status.classList.add("status-ativo");

        }else{
            status.textContent = "INATIVO";

            status.classList.add("status-inativo");
        }

        tdStatus.appendChild(status);

        linha.appendChild(tdStatus);


        const tdAcao = document.createElement("td");

        const botao = document.createElement("button");

        botao.type = "button";

        if(responsavel.ativo){
            botao.textContent = "Desativar";

        }else{
            botao.textContent = "Ativar";
        }

        botao.addEventListener("click", () => {alterarStatusResponsavel(responsavel.id,
            !responsavel.ativo);
            }
        );

        tdAcao.appendChild(botao);

        linha.appendChild(tdAcao);

        tbody.appendChild(linha);
    }

    tabela.appendChild(tbody);

    responsaveisContainer.appendChild(tabela);
}

async function alterarStatusResponsavel(id, ativo){
    
    try{
        const response = await fetch(
            `${API_URL}/responsaveis/${id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ativo
                })
            }
        );

        const resultado = await lerResposta(response);

        if (!response.ok) {
            mensagem.textContent = resultado.mensagem;
            return;
        }

        mensagem.textContent = resultado.mensagem;


        await carregarResponsaveis();

        await carregarUsuarios();

        await carregarUsuariosDisponiveis();

    }catch(error){

        console.error(error);

        mensagem.textContent = "Erro ao alterar responsável.";
    }
}

async function iniciar() {

    const administrador = await verificarAdministrador();

    if (!administrador) {
        return;
    }


    await carregarUsuarios();

    await carregarResponsaveis();

    await carregarUsuariosDisponiveis();
}

iniciar();