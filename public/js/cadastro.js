const formCadastro = document.querySelector("#form-cadastro");
const mensagem = document.querySelector("#mensagem");

formCadastro.addEventListener("submit", cadastrarUsuario);

async function cadastrarUsuario(event) {

    event.preventDefault();
    const usuario = document
    .querySelector("#usuario")
    .value
    .trim();

    const email = document
    .querySelector("#email")
    .value
    .trim()
    .toLowerCase();;

    const senha = document
    .querySelector("#senha")
    .value
    .trim();

    const dados = {
        usuario,
        email,
        senha
    }

    try {
        const response = await fetch(
            `${API_URL}/usuarios/cadastro`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            }
        );
        
        const resultado = await response.json();

        if(!response.ok){
            mensagem.textContent = resultado.mensagem
            return;
        }
        mensagem.textContent = resultado.mensagem;

        sessionStorage.setItem(
            "emailVerificacao",
            email
        );

        window.location.href = "./verificar-email.html";


    }catch(error){
        console.error(error);

        mensagem.textContent = "Não foi possível conectar ao servidor.";
    }

}