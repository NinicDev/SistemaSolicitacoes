const express = require("express");

const autenticarToken =
    require("../middlewares/authMiddleware");

const autorizarNiveis =
    require("../middlewares/autorizarNiveis");

const {
    listarResponsaveis,
    listarResponsaveisAdmin,
    cadastrarResponsavel,
    alterarStatusResponsavel
} = require("../controllers/responsavelController");

const router = express.Router();

router.get(
    "/",
    autenticarToken,
    listarResponsaveis
);

router.get(
    "/admin",
    autenticarToken,
    autorizarNiveis("ADMIN"),
    listarResponsaveisAdmin
);

router.post(
    "/",
    autenticarToken,
    autorizarNiveis("ADMIN"),
    cadastrarResponsavel
);

router.patch(
    "/:id/status",
    autenticarToken,
    autorizarNiveis("ADMIN"),
    alterarStatusResponsavel
);


module.exports = router;
