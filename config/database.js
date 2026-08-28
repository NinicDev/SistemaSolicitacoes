// Importa o Pool da biblioteca pg.
// O Pool gerencia as conexões entre a aplicação e o PostgreSQL.
const { Pool } = require("pg");

// Carrega as variáveis definidas no arquivo .env
// para dentro de process.env.
require("dotenv").config();

// Cria o pool de conexões com o banco de dados.
// Os dados de acesso ficam no .env para evitar
// deixar informações sensíveis diretamente no código.
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Exporta o pool para que controllers e middlewares
// possam realizar consultas ao banco.
module.exports = pool;