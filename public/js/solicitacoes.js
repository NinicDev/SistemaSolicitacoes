const API_URL = window.location.origin;
const token = localStorage.getItem("token");
const listaContainer = document.querySelector("#lista-container");
const campoPesquisa = document.getElementById("pesquisa");
const filtroStatus = document.getElementById("filtro-status");
const filtroPrioridade = document.getElementById("filtro-prioridade");
const filtroResponsavel = document.getElementById("filtro-responsavel");
const filtroTipoServico = document.getElementById("filtro-tipo-servico");
const botaoLimparFiltros = document.getElementById("limpar-filtros");
const botaoExcluirSelecionadas = document.getElementById("excluir-selecionadas");
const botaoImprimirSelecionadas = document.getElementById("imprimir-selecionadas");

let solicitacoes = [];
let nivelAcesso = null;

let paginaAtual = 1;
let totalPaginas = 1;
let totalSolicitacoes = 0;
const limitePorPagina = 20;

let timerPesquisa = null;

if (!token) {
    window.location.href = "./login.html";
}

document
    .querySelector("#listar")
    .addEventListener("click", () => {listarSolicitacoes(1);});

async function lerResposta(response) {
    try {
        return await response.json();
    } catch {
        return {
            mensagem: "O servidor retornou uma resposta que não é JSON."
        };
    }
}

filtroStatus.addEventListener(
    "change", function() {
        listarSolicitacoes(1);
    }
);

filtroPrioridade.addEventListener(
    "change", function() {
        listarSolicitacoes(1);
    }
);

filtroResponsavel.addEventListener(
    "change", function() {
        listarSolicitacoes(1);
    }
);

filtroTipoServico.addEventListener(
    "change", function() {
        listarSolicitacoes(1);
    }
);

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

async function listarSolicitacoes(pagina = 1) {

    try {
        const parametros = new URLSearchParams();

        parametros.set("page", pagina);
        parametros.set("limit", limitePorPagina);

        const busca = campoPesquisa.value.trim();

        if (busca) {
            parametros.set("busca", busca);
        }

        const status = filtroStatus.value;
        const prioridade = filtroPrioridade.value;
        const responsavelId = filtroResponsavel.value;
        const tipoServicoId = filtroTipoServico.value;

        if (status) {
            parametros.set("status", status);
        }

        if (prioridade) {
            parametros.set("prioridade", prioridade);
        }

        if (responsavelId) {
            parametros.set("responsavel_id", responsavelId);
        }

        if (tipoServicoId){
            parametros.set("tipo_servico_id", tipoServicoId);
        }

        const response = await fetch(
            `${API_URL}/solicitacoes?${parametros.toString()}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const dados = await lerResposta(response);

        if (response.status === 401) {
            localStorage.removeItem("token");

            window.location.href = "./login.html";
            return;
        }

        if (!response.ok) {
            listaContainer.innerHTML = `
                <p>
                    ${escaparHTML(
                        dados.mensagem ||
                        "Erro ao listar solicitações."
                    )}
                </p>
            `;
            return;
        }

        solicitacoes = dados.solicitacoes || [];
        paginaAtual = dados.pagina;
        totalPaginas = dados.totalPaginas;
        totalSolicitacoes = dados.total;

        renderizarLista(solicitacoes);

    } catch (erro) {

        console.error(
            "Erro na listagem:",
            erro
        );

        listaContainer.innerHTML =
            "<p>Não foi possível conectar ao servidor.</p>";
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
                        <input
                            type="checkbox"
                            id="selecionar-todos"
                        >
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
        </table>

        <div class="paginacao">

            <button
                type="button"
                id="pagina-anterior"
                ${paginaAtual <= 1 ? "disabled" : ""}
            >
                Anterior
            </button>

            <span>
                Página ${paginaAtual} de ${totalPaginas}
                — ${totalSolicitacoes} solicitação(ões)
            </span>

            <button
                type="button"
                id="proxima-pagina"
                ${
                    paginaAtual >= totalPaginas
                        ? "disabled"
                        : ""
                }
            >
                Próxima
            </button>

        </div>
    `;

        const botaoAnterior = document.getElementById("pagina-anterior");

        const botaoProxima = document.getElementById("proxima-pagina");

        botaoAnterior.addEventListener("click", function() {
                if (paginaAtual > 1) {

                    listarSolicitacoes(
                        paginaAtual - 1
                    );
                }
            }
        );

        botaoProxima.addEventListener("click", function() {
                if (paginaAtual < totalPaginas) {

                    listarSolicitacoes(
                        paginaAtual + 1
                    );
                }
            }
        );

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

campoPesquisa.addEventListener(
    "input",
    function() {

        clearTimeout(timerPesquisa);

        timerPesquisa = setTimeout(
            function() {
                listarSolicitacoes(1);
            },
            400
        );
    }
);

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

async function carregarResponsaveis() {

    try {
        const response = await fetch(
            `${API_URL}/responsaveis`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const dados = await lerResposta(response);

        if (response.status === 401) {
            localStorage.removeItem("token");

            window.location.href = "./login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(
                dados.mensagem || "Erro ao carregar responsáveis."
            );
        }

        filtroResponsavel.innerHTML = `
            <option value="">
                Todos os responsáveis
            </option>
        `;

        dados.forEach(responsavel => {

            const option = document.createElement("option");

            option.value = responsavel.id;

            option.textContent = responsavel.nome;

            filtroResponsavel.appendChild(option);
        });

    }catch(erro){

        console.error(
            "Erro ao carregar responsáveis:", erro
        );
    }
}

async function carregarTiposServico() {

    try {
        const response = await fetch(
            `${API_URL}/tipos-servico`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const dados = await lerResposta(response);

        if (response.status === 401) {
            localStorage.removeItem("token");

            window.location.href = "./login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(
                dados.mensagem || "Erro ao carregar tipos de serviço."
            );
        }

        filtroTipoServico.innerHTML = `
            <option value="">
                Todos os tipos de serviço
            </option>
        `;

        dados.forEach(tipo => {

            const option = document.createElement("option");

            option.value = tipo.id;

            option.textContent = tipo.nome;

            filtroTipoServico.appendChild(option);
        });

    }catch(erro){
        console.error(
            "Erro ao carregar tipos de serviço:", erro
        );
    }
}

botaoLimparFiltros.addEventListener("click", function() {

        campoPesquisa.value = "";

        filtroStatus.value = "";

        filtroPrioridade.value = "";

        filtroResponsavel.value = "";

        filtroTipoServico.value = "";

        clearTimeout(timerPesquisa);

        listarSolicitacoes(1);
    }
);

async function iniciarPagina() {

    const usuario = await obterUsuarioAtual();

    if (!usuario) {
        return;
    }

    nivelAcesso = usuario.nivel_acesso;

    configurarPermissoes();

    await Promise.all([
        carregarResponsaveis(),
        carregarTiposServico()
    ]);

    await listarSolicitacoes(1);
}

iniciarPagina();