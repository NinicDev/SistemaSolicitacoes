export function formatarTelefone(valor) {
    return valor
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatarRG(valor) {
    return valor
        .replace(/\D/g, "")
        .slice(0, 9)
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1-$2");
}

export function formatarCPF(valor) {
    return valor
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1-$2");
}

export function formatarCEP(valor) {
    return valor
        .replace(/\D/g, "")
        .slice(0, 8)
        .replace(/^(\d{5})(\d)/, "$1-$2");
}

function aplicarMascara(id, formatador) {
    const input = document.getElementById(id);

    if(!input){
        return;
    }

    input.addEventListener("input", function () {
        input.value = formatador(input.value);
    });
}

export function aplicarMascarasSolicitacao() {
    aplicarMascara("cpf", formatarCPF);
    aplicarMascara("rg", formatarRG);
    aplicarMascara("telefone-celular", formatarTelefone)
    aplicarMascara("cep", formatarCEP)
}