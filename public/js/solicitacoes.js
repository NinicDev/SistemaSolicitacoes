const API_URL = "http://localhost:3000";
const token = localStorage.getItem("token");
const listaContainer = document.querySelector("#lista-container");
const campoPesquisa = document.getElementById("pesquisa");
const botaoExcluirSelecionadas = document.getElementById("excluir-selecionadas");
const botaoImprimirSelecionadas = document.getElementById("imprimir-selecionadas");
let solicitacoes = [];
let nivelAcesso = null;

if (!token) {
    window.location.href = "./login.html";
}

document
    .querySelector("#listar")
    .addEventListener("click", listarSolicitacoes);

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
        const response = await fetch(
            `${API_URL}/usuarios/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const usuario = await lerResposta(response);

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "./login.html";
            return null;
        }

        if (!response.ok) {
            throw new Error(
                usuario.mensagem || "Erro ao buscar usuário atual"
            );
        }

        return usuario;

    } catch (erro) {
        console.error("Erro ao buscar usuário atual:", erro);
        listaContainer.innerHTML =
            "<p>Não foi possível verificar as permissões do usuário.</p>";
        return null;
    }
}

function configurarPermissoes() {
    botaoExcluirSelecionadas.hidden =
        nivelAcesso !== "ADMIN";
}

async function listarSolicitacoes() {
    try {
        const response = await fetch(
                `${API_URL}/solicitacoes`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
            );

        const dados = await lerResposta(response);

        if(response.status === 401){
            localStorage.removeItem("token")
            window.location.href = "./login.html";
            return;
        }

        solicitacoes =
                Array.isArray(dados)
                    ? dados
                    : dados.solicitacoes ||
                      dados.dados ||
                    [];
                renderizarLista(solicitacoes);
        
    }catch(erro){
        console.error("Erro na listagem:", erro);
        listaContainer.innerHTML ="<p>Não foi possível conectar ao servidor.</p>";
    }
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(
        /[&<>"']/g,
        caractere => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caractere]
    );
}

async function obterUrlArquivoAnexo(idAnexo) {

    const response = await fetch(
        `${API_URL}/anexos/${idAnexo}/arquivo`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        let mensagem = "Erro ao carregar imagem";

        try {
            const erro = await response.json();
            mensagem = erro.mensagem || mensagem;
        } catch {}

        throw new Error(mensagem);
    }

    const blob = await response.blob();

    return URL.createObjectURL(blob);
}

function renderizarLista(lista) {

    if (!lista.length) {

        listaContainer.innerHTML =
                    "<p>Nenhuma solicitação encontrada.</p>";

        return;
    }


    const linhas = lista.map(solicitacao => `
        <tr>
            <td><input type="checkbox" class="selecionar-solicitacao" value="${Number(solicitacao.id)}"></td>
            <td>${escaparHTML(solicitacao.id)}</td>
            <td>${escaparHTML(solicitacao.nome)}</td>
            <td>${escaparHTML(solicitacao.tipo_servico)}</td>
            <td>${escaparHTML(solicitacao.responsavel)}</td>
            <td>
                <span class="status status-${solicitacao.status?.toLowerCase()}">
                    ${escaparHTML(solicitacao.status)}
                </span>
            </td>

            <td>
                <span class="prioridade prioridade-${solicitacao.prioridade?.toLowerCase()}">
                    ${escaparHTML(solicitacao.prioridade)}
                </span>
            </td>
            <td>
            
            <button type="button" class="abrir" data-id="${Number(solicitacao.id)}">
                Abrir
            </button>

            <button type="button" class="ver-imagens" data-id="${Number(solicitacao.id)}">
                Ver imagens
            </button>

            ${nivelAcesso === "ADMIN" ? `
                <button type="button" class="excluir" data-id="${Number(solicitacao.id)}">
                    Excluir
                </button>
            ` : ""}
            </td>
        </tr>`).join("");

    listaContainer.innerHTML = `
        <table>
           <thead>
                <tr>
                    <th>
                        <input type="checkbox" id="selecionar-todos">
                    </th>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Tipo de serviço</th>
                    <th>Responsável</th>
                    <th>Status</th>
                    <th>Prioridade</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody>
                ${linhas}
            </tbody>
        </table>`;

    const selecionarTodos = document.getElementById("selecionar-todos");
    const checkboxes = document.querySelectorAll(".selecionar-solicitacao");
    selecionarTodos.addEventListener("change", function() {
        checkboxes.forEach(checkbox => {
            checkbox.checked = selecionarTodos.checked;
        });

    });

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function() {
        const todosMarcados = Array.from(checkboxes).every(checkbox => checkbox.checked);
            selecionarTodos.checked = todosMarcados;
        });

    });

    const botoesAbrir = document.querySelectorAll(".abrir");
        botoesAbrir.forEach(botao => {
            botao.addEventListener("click", function() {
                const id = botao.dataset.id;
                window.location.href = `solicitacao.html?id=${id}`;
            });
        });

    const botoesVerImagens = document.querySelectorAll(".ver-imagens");

    botoesVerImagens.forEach(botao => {

        botao.addEventListener("click", async function() {

            const id = botao.dataset.id;

            try {
                const response = await fetch(
                    `${API_URL}/anexos/${id}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const anexos = await lerResposta(response);

                if (!response.ok) {
                    throw new Error(
                        anexos.mensagem || "Erro ao buscar imagens"
                    );
                }

            const modal = document.getElementById("modal-anexos");
            const container = document.getElementById("imagens-solicitacao");

            container.innerHTML = "";

            if (anexos.length === 0) {

                container.innerHTML = "<p>Esta solicitação não possui imagens.</p>";

            } else {

                for (const anexo of anexos) {

                    const img = document.createElement("img");

                    try {
                        img.src = await obterUrlArquivoAnexo(anexo.id);
                    } catch (erro) {
                        console.error(`Erro ao carregar anexo ${anexo.id}:`, erro);
                        continue;
                    }

                    img.alt = anexo.nome_original;

                    container.appendChild(img);
                }
            }

            modal.style.display = "flex";

            }catch(erro){
                console.error(
                    "Erro ao buscar imagens:",
                    erro
                );
            }
        });

    });
    
    const botoesExcluir = document.querySelectorAll(".excluir");
    botoesExcluir.forEach(botao => {
        botao.addEventListener("click", async function() {

            if (nivelAcesso !== "ADMIN") {
                return;
            }

            const id = botao.dataset.id;

            const confirmou = confirm(
                "Tem certeza que deseja excluir esta solicitação?"
            );

            if (!confirmou) {
                return;
            }

            try {
                const response = await fetch(
                    `${API_URL}/solicitacoes/${id}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const dados = await lerResposta(response);

                if (!response.ok) {
                    throw new Error(
                        dados.mensagem || "Erro ao excluir solicitação"
                    );
                }

                await listarSolicitacoes();

            }catch(erro){
                console.error("Erro ao excluir solicitação:", erro);
            }
    });
});
}

const modalAnexos = document.getElementById("modal-anexos");
const fecharModalAnexos = document.getElementById("fechar-modal-anexos");

fecharModalAnexos.addEventListener("click", function() {
    modalAnexos.style.display = "none";
});

modalAnexos.addEventListener("click", function(event) {

    if (event.target === modalAnexos) {
        modalAnexos.style.display = "none";
    }

});

botaoExcluirSelecionadas.addEventListener("click", async function() {

    if (nivelAcesso !== "ADMIN") {
        return;
    }

    const selecionadas = document.querySelectorAll(
        ".selecionar-solicitacao:checked"
    );

    const ids = Array.from(selecionadas).map(checkbox => {
        return checkbox.value;
    });

    if (!ids.length) {
        alert("Selecione pelo menos uma solicitação.");
        return;
    }

    const confirmou = confirm(
        `Tem certeza que deseja excluir ${ids.length} solicitação(ões)?`
    );

    if (!confirmou) {
        return;
    }

    try{
        for (const id of ids) {

            const response = await fetch(
                `${API_URL}/solicitacoes/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const dados = await lerResposta(response);

            if (!response.ok) {
                throw new Error(
                    dados.mensagem || `Erro ao excluir solicitação ${id}`
                );
            }
        }

        await listarSolicitacoes();

    }catch(erro){
        console.error("Erro na exclusão em lote:", erro);

    }
});

campoPesquisa.addEventListener("input", function() {
    const texto = campoPesquisa.value
        .toLowerCase()
        .trim();
    const filtradas = solicitacoes.filter(solicitacao => {
        return (
            String(solicitacao.id).includes(texto) ||
            solicitacao.nome?.toLowerCase().includes(texto) ||
            solicitacao.tipo_servico?.toLowerCase().includes(texto) ||
            solicitacao.responsavel?.toLowerCase().includes(texto) ||
            solicitacao.status?.toLowerCase().includes(texto) ||
            solicitacao.prioridade?.toLowerCase().includes(texto)
        );
    });
    renderizarLista(filtradas);
});

botaoImprimirSelecionadas.addEventListener("click", async function() {

    const selecionadas = document.querySelectorAll(
        ".selecionar-solicitacao:checked"
    );

    const ids = Array.from(selecionadas).map(checkbox => {
        return checkbox.value;
    });

    if (!ids.length) {
        alert("Selecione pelo menos uma solicitação.");
        return;
    }

    try{
        const response = await fetch(
            `${API_URL}/solicitacoes/pdf/lote`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ids})
                }
        )
        
        if(!response.ok){
            throw new Error("Erro ao gerar PDF em lote");
        }

        const blob = await response.blob();

        const urlPdf = URL.createObjectURL(blob);

        window.open(urlPdf, "_blank");
    }
    catch(error){
        console.error("Erro ao imprimir solicitações:", error);
    }

});

async function iniciarPagina() {

    const usuario = await obterUsuarioAtual();

    if (!usuario) {
        return;
    }

    nivelAcesso = usuario.nivel_acesso;

    configurarPermissoes();

    await listarSolicitacoes();
}

iniciarPagina();