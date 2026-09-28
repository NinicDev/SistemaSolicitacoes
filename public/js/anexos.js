const API_URL = window.location.origin;

let anexosPendentes = [];
let anexosParaExcluir = [];

const anexarImg = document.getElementById("anexar-img");
const inputAnexos = document.getElementById("input-anexos");
const anexosPendentesContainer = document.getElementById("anexos-pendentes");

const modalImagem = document.querySelector("#modal-imagem");
const fecharModal = document.querySelector("#fechar-modal");

if (fecharModal && modalImagem) {
    fecharModal.addEventListener("click", () => {
        modalImagem.style.display = "none";
    });

    modalImagem.addEventListener("click", (event) => {
        if (event.target === modalImagem) {
            modalImagem.style.display = "none";
        }
    });
}

if (anexarImg && inputAnexos) {
    anexarImg.addEventListener("click", function() {
        inputAnexos.click();
    });

    inputAnexos.addEventListener("change", function() {
        const arquivosSelecionados = Array.from(inputAnexos.files);

        anexosPendentes.push(...arquivosSelecionados);

        renderizarAnexosPendentes();
    });
}

function renderizarAnexosPendentes() {

    if (!anexosPendentesContainer) {
        return;
    }

    anexosPendentesContainer.innerHTML = "";

    anexosPendentes.forEach(function(arquivo, indice) {
        const img = document.createElement("img");
        const urlTemporaria = URL.createObjectURL(arquivo);
        const containerAnexo = document.createElement("div");

        containerAnexo.classList.add("anexo-pendente");

        img.src = urlTemporaria;
        img.alt = arquivo.name;

        img.addEventListener("click", function() {
            const imagemAmpliada = document.querySelector("#imagem-ampliada");

            if (!imagemAmpliada || !modalImagem) {
                return;
            }

            imagemAmpliada.src = urlTemporaria;
            modalImagem.style.display = "flex";
        });

        const botaoRemover = document.createElement("button");

        botaoRemover.type = "button";
        botaoRemover.textContent = "X";

        botaoRemover.addEventListener("click", function() {
            anexosPendentes.splice(indice, 1);
            renderizarAnexosPendentes();
        });

        containerAnexo.appendChild(img);
        containerAnexo.appendChild(botaoRemover);

        anexosPendentesContainer.appendChild(containerAnexo);
    });
}

async function obterUrlArquivoAnexo(idAnexo, token) {

    const resposta = await fetch(
        `${API_URL}/anexos/${idAnexo}/arquivo`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!resposta.ok) {
        let mensagem = "Erro ao carregar imagem";

        try {
            const erro = await resposta.json();
            mensagem = erro.mensagem || mensagem;
        } catch {}

        throw new Error(mensagem);
    }

    const blob = await resposta.blob();

    return URL.createObjectURL(blob);
}

export async function buscarAnexos(id, token, modoEdicao) {

    try {
        const resposta = await fetch(
            `${API_URL}/anexos/${id}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!resposta.ok) {
            const erro = await resposta.json();

            throw new Error(
                erro.mensagem || "Erro ao buscar anexos"
            );
        }

        const anexos = await resposta.json();

        await renderizarAnexos(anexos, modoEdicao, token);

    } catch (erro) {
        console.error("Erro ao buscar anexos:", erro);
    }
}

export async function enviarAnexos(id, token) {

    if (anexosPendentes.length === 0) {
        return;
    }

    const formData = new FormData();

    anexosPendentes.forEach(function(arquivo) {
        formData.append("anexos", arquivo);
    });

    const resposta = await fetch(
        `${API_URL}/anexos/${id}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        }
    );

    if (!resposta.ok) {
        const erro = await resposta.json();

        throw new Error(
            erro.mensagem || "Erro ao enviar anexos"
        );
    }

    limparAnexosPendentes();
}

export async function excluirAnexo(idAnexo, token) {

    const resposta = await fetch(
        `${API_URL}/anexos/${idAnexo}`,
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
            erro.mensagem || "Erro ao excluir anexo"
        );
    }
}

async function renderizarAnexos(anexos, modoEdicao, token) {

    const listaAnexos = document.querySelector("#lista-anexos");

    if (!listaAnexos) {
        return;
    }

    listaAnexos.innerHTML = "";

    for (const anexo of anexos) {

        const img = document.createElement("img");
        const containerAnexo = document.createElement("div");

        containerAnexo.classList.add("anexo-salvo");

        if (modoEdicao) {
            containerAnexo.classList.add("anexo-edicao");
        } else {
            containerAnexo.classList.add("anexo-visualizacao");
        }

        try {
            img.src = await obterUrlArquivoAnexo(anexo.id, token);
        } catch (erro) {
            console.error(`Erro ao carregar anexo ${anexo.id}:`, erro);
            continue;
        }

        img.alt = anexo.nome_original;

        img.addEventListener("click", () => {
            const modal = document.querySelector("#modal-imagem");
            const imagemAmpliada = document.querySelector("#imagem-ampliada");

            if (!modal || !imagemAmpliada) {
                return;
            }

            imagemAmpliada.src = img.src;
            modal.style.display = "flex";
        });

        if (modoEdicao) {
            const botaoRemover = document.createElement("button");

            botaoRemover.type = "button";
            botaoRemover.textContent = "X";

            botaoRemover.addEventListener("click", function() {
                anexosParaExcluir.push(anexo.id);
                containerAnexo.remove();
            });

            containerAnexo.appendChild(botaoRemover);
        }

        containerAnexo.appendChild(img);
        listaAnexos.appendChild(containerAnexo);
    }
}

export async function excluirAnexosMarcados(token) {

    for (const idAnexo of anexosParaExcluir) {
        await excluirAnexo(idAnexo, token);
    }

    anexosParaExcluir = [];
}

export function limparAnexosPendentes() {
    anexosPendentes = [];

    if (inputAnexos) {
        inputAnexos.value = "";
    }

    renderizarAnexosPendentes();
}

export function habilitarAnexos() {
    if (anexarImg) {
        anexarImg.disabled = false;
    }
}

export function limparAnexosParaExcluir() {
    anexosParaExcluir = [];
}

export function desabilitarAnexos() {
    if (anexarImg) {
        anexarImg.disabled = true;
    }
}
