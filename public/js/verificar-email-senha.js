const formEmail = document.querySelector("#form-verificacao-email-senha")
const mensagem = document.querySelector("#mensagem")

formEmail.addEventListener("submit", enviarCodigo);

async function enviarCodigo(event) {
    event.preventDefault();

    const email = document.querySelector("#email").value.trim();

    const dados = {email}
    
    try{
        const response = await fetch(
            "http://localhost:3000/usuarios/esqueci-senha",
            {
                "method":"POST",
                "headers":{
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
            "emailRecuperacao",
            email
        );

        window.location.href = "./redefinir-senha.html";

    }catch(error){
        console.error(error)
        
        mensagem.textContent = "Não foi possivel conectar ao servidor"
    }
}