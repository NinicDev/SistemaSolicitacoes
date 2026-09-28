const API_URL = window.location.origin;

const newButton = document.querySelector("#newButton");

const listButton = document.querySelector("#listButton");

const adminButton = document.querySelector("#adminButton");

const botaoSair = document.querySelector("#sair");

const mensagem = document.querySelector("#mensagem");

const usuarioLogado = document.querySelector("#usuario-logado");


const token = localStorage.getItem("token");


if (!token) {
    window.location.href ="./login.html";
}

botaoSair.addEventListener("click", logout);

newButton.addEventListener("click",() => {
    window.location.href = "./nova-solicitacao.html";
    }
);

listButton.addEventListener("click",() => {
    window.location.href ="./solicitacoes.html";
    }
);

adminButton.addEventListener("click",() => {
        window.location.href ="./administracao.html";
    }
);

async function carregarUsuarioAtual() {

    try {
        const resposta = await fetch(
            `${API_URL}/usuarios/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const resultado = await resposta.json();

        if (resposta.status === 401) {

            localStorage.removeItem("token");
            window.location.href ="./login.html";
            return;
        }

        if (!resposta.ok) {
            mensagem.textContent = resultado.mensagem;
            return;
        }

        configurarInterface(resultado);

    }catch(error){

        console.error(error);
        mensagem.textContent = "Não foi possível conectar ao servidor.";
    }
}

function configurarInterface(usuario) {

    usuarioLogado.textContent = `${usuario.usuario} - ${usuario.nivel_acesso}`;

    if (usuario.nivel_acesso === "ADMIN") {
        newButton.hidden = false;
        adminButton.hidden = false;
        return;
    }

    if (usuario.nivel_acesso === "OPERADOR") {
        newButton.hidden = false;
        adminButton.hidden = true;
        return;
    }

    if (usuario.nivel_acesso === "VISUALIZADOR") {
        newButton.hidden = true;
        adminButton.hidden = true;
    }
}

async function logout() {

    try {
        const resposta = await fetch(
            `${API_URL}/usuarios/logout`,
            {
                method: "POST",
                headers: {
                    Authorization:`Bearer ${token}`
                }
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            mensagem.textContent = resultado.mensagem;
            return;
        }

        localStorage.removeItem("token");
        window.location.href = "./login.html";

    }catch(error){
        console.error(error);

        mensagem.textContent = "Não foi possível conectar ao servidor.";
    }
}

carregarUsuarioAtual();