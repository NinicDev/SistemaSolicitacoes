const pool = require("../../config/database");

async function verificarSolicitacao(req, res, next) {
   try{
        const { id_solicitacao } = req.params

        const resultado = await pool.query(
            `SELECT id FROM solicitacoes WHERE id = $1`,
            [id_solicitacao]
        );
        if(resultado.rows.length === 0){
            return res.status(404).json({
                mensagem: "Solicitação não encontrada"
            })
        }
        next();
   }catch(error){
        next(error);
   }
}

module.exports = { verificarSolicitacao };
