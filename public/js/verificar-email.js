const email = sessionStorage.getItem("emailVerificacao");

if (!email) {
    window.location.href = "./cadastro.html";
}

const formVerificacao = document.querySelector("#form-verificacao");

const mensagem = document.querySelector("#mensagem");

formVerificacao.addEventListener("submit", verificarEmail);

const botaoReenviar = document.querySelector("#reenviar-codigo");

botaoReenviar.addEventListener("click", reenviarCodigo);

async function verificarEmail(event) {

    event.preventDefault();

    const codigo = document
        .querySelector("#codigo")
        .value
        .trim();

    const dados = {
        email,
        codigo
    }

    try {
        const response = await fetch(
            "http://localhost:3000/usuarios/verificar-email",
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

        sessionStorage.removeItem("emailVerificacao");

        setTimeout(() => {
            window.location.href = "./login.html";
        }, 2000);

    } catch (error) {
        console.error(error);

        mensagem.textContent =
            "Não foi possível conectar ao servidor.";
    }

}

async function reenviarCodigo() {
    
    const dados = 
    {
        email
    }

    try{
        const response = await fetch(
            "http://localhost:3000/usuarios/reenviar-codigo",
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

        let segundos = 60;

        botaoReenviar.disabled = true;

        botaoReenviar.textContent = `Reenviar código (${segundos}s)`;


        const intervalo = setInterval(() => {

            segundos--;

            botaoReenviar.textContent =
                `Reenviar código (${segundos}s)`;

            if(segundos <= 0){
                clearInterval(intervalo)
                botaoReenviar.disabled = false;
                botaoReenviar.textContent = "Reenviar código";
            }
        }, 1000);

        

    }catch(error){
        console.error(error);

        mensagem.textContent =
            "Não foi possível conectar ao servidor.";
    }
}