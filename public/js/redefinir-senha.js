const email = sessionStorage.getItem("emailRecuperacao");

if (!email) {
    window.location.href = "./login.html";
}

const formRecuperacao = document.querySelector("#form-redefinir-senha")

formRecuperacao.addEventListener("submit", redefinirSenha);

const mensagem = document.querySelector("#mensagem")

const botaoReenviar = document.querySelector("#reenviar-codigo")

botaoReenviar.addEventListener("click", reenviarCodigoRecuperacao);

async function redefinirSenha(event) {
    event.preventDefault();

    const codigo = document.querySelector("#codigo").value.trim();

    const novaSenha = document.querySelector("#novaSenha").value;

    const dados = { email, codigo, novaSenha }

    try{
        const response = await fetch(
            "http://localhost:3000/usuarios/redefinir-senha",
            {
                "method":"POST",
                "headers":{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify(dados)
            }
        )

        const resultado = await response.json();

        if(!response.ok){
            mensagem.textContent = resultado.mensagem;
            return;
        }
        mensagem.textContent = resultado.mensagem

        sessionStorage.removeItem("emailRecuperacao");

        setTimeout(() => {
            window.location.href = "./login.html";
        }, 2000);

    }catch(error){
        console.error(error)

        mensagem.textContent = "Não foi possivel conectar ao servidor"
    }
}

async function reenviarCodigoRecuperacao() {
    
    const dados = 
    {
        email
    }

    try{
        const response = await fetch(
            "http://localhost:3000/usuarios/esqueci-senha",
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



