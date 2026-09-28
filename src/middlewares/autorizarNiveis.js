function autorizarNiveis(...niveisPermitidos) {

    return (req, res, next) => {

        if (!req.usuario) {
            return res.status(401).json({
                mensagem: "Usuário não autenticado."
            });
        }

        const nivelUsuario =
            req.usuario.nivel_acesso;

        if (!niveisPermitidos.includes(nivelUsuario)) {
            return res.status(403).json({
                mensagem:
                    "Você não possui permissão para realizar esta ação."
            });
        }

        next();
    };
}

module.exports = autorizarNiveis;