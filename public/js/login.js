const formLogin = document.querySelector("#form-login");
const mensagem = document.querySelector("#mensagem");

formLogin.addEventListener("submit", async function(event) {
    event.preventDefault();
   try{
        const usuario = document.querySelector("#usuario").value;
        const senha = document.querySelector("#senha").value;

        const dadosLogin = {
        usuario,
        senha
        }

        const resposta = await fetch(`${API_URL}/usuarios/login`, {
            method: "POST",
                
            headers: {
            "Content-Type": "application/json"
            },

            body: JSON.stringify(dadosLogin)
        });

        const dados = await resposta.json();

        if (resposta.status === 403) {

            sessionStorage.setItem(
                "emailVerificacao",
                dados.email
            );

            window.location.href =
                "./verificar-email.html";

            return;
        }

        if(resposta.ok) {
            localStorage.setItem("token", dados.token);

            window.location.href = "./inicio.html";
        }else{
            mensagem.textContent = dados.mensagem;
        }
   }catch{
        mensagem.textContent =
        "Não foi possível conectar ao servidor.";
   }

});

