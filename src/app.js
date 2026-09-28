const express = require("express");

const cors = require("cors");

const usuarioRoutes = require("./routes/usuarioRoutes");

const solicitacoesRoutes = require("./routes/solicitacaoRoutes");

const responsavelRoutes = require("./routes/responsavelRoutes");

const tipoServicoRoutes = require("./routes/tipoServicoRoutes")

const anexosRoutes = require("./routes/anexoRoutes")

const app = express();

const path = require("path");

app.use(cors());

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "../public")
    )
);

app.get("/", (req, res) => {
    res.redirect("/login.html");
});

app.use(
    express.static(
        path.join(__dirname, "../public")
    )
);

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../public/login.html"
        )
    );
});

app.use("/usuarios", usuarioRoutes);

app.use("/solicitacoes", solicitacoesRoutes);

app.use("/responsaveis", responsavelRoutes);

app.use("/tipos-servico", tipoServicoRoutes)

app.use("/anexos", anexosRoutes)


app.use((error, req, res, next) => {

    if(error.code === "LIMIT_FILE_SIZE"){
        return res.status(400).json({
            mensagem: "Arquivo excede o limite de 5mb"
        })
    }

    if (error.message === "Formato de arquivo não permitido") {
        return res.status(400).json({
            mensagem: "Formato de arquivo não permitido"
        })
    }

    console.error("Erro interno da aplicação:", error);

    return res.status(500).json({
        mensagem: "Erro interno do servidor."
    })
})

module.exports = app;
