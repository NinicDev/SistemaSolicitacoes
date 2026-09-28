const express = require("express");

const autenticarToken = require("../middlewares/authMiddleware");

const {listarTiposServico} = require("../controllers/tipoServicoController");
const router = express.Router();


router.get("/", autenticarToken, listarTiposServico);


module.exports = router;

