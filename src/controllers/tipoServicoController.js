const pool = require("../../config/database")

async function listarTiposServico(req, res){

    try{
        const resultado = await pool.query(
            `
            SELECT id, nome
                FROM tipos_servico
                ORDER BY nome
            `)

            return res.status(200).json(resultado.rows)

    }catch(error){
        return  res.status(500).json({
            mensagem: "Erro ao buscar tipos de serviço"
        })
    }
    

}

module.exports = {
    listarTiposServico
};