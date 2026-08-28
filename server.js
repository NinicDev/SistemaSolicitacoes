// Importa a aplicação Express configurada em src/app.js.
const app = require("./src/app");

// Importa o pool de conexões com o PostgreSQL.
const pool = require("./config/database");


// Executa uma consulta simples ao iniciar a aplicação
// para confirmar que a conexão com o banco está funcionando.
pool.query("SELECT NOW()")
    .then((result) => {
        console.log("Banco conectado!");
        console.log(result.rows[0]);
    })
    .catch((error) => {
        console.error("Erro ao conectar com o banco:", error);
    });


// Inicia o servidor HTTP na porta 3000.
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});