const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },

    filename: function (req, file, cb) {
        const extensao = path.extname(file.originalname).toLowerCase();
        const nomeArquivo = `${Date.now()}-${crypto.randomUUID()}${extensao}`;

        cb(null, nomeArquivo);
    }
});

function filtroArquivo(req, file, cb) {

    const tiposPermitidos = [
        "image/jpeg",
        "image/png"
    ];

    if (tiposPermitidos.includes(file.mimetype)) {
        return cb(null, true);
    }

    return cb(new Error("Formato de arquivo não permitido"));
}

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: filtroArquivo
});

module.exports = { upload };
