const PDFDocument = require("pdfkit");
const pool = require("../../config/database");
const MARGEM_ESQUERDA = 50;
const MARGEM_DIREITA = 545;
const ALTURA_LABEL = 14;
const ESPACO_ENTRE_CAMPOS = 20;

function adicionarTituloSecao(doc, titulo) {

    const y = doc.y + 10;

    doc
        .fillColor("#eeeeee")
        .rect(
            MARGEM_ESQUERDA,
            y,
            MARGEM_DIREITA - MARGEM_ESQUERDA,
            25
        )
        .fill();

    doc
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
            titulo,
            MARGEM_ESQUERDA + 8,
            y + 7
        );

    doc.x = MARGEM_ESQUERDA;
    doc.y = y + 35;

    doc
        .font("Helvetica")
        .fontSize(11);
}

function adicionarLinhaDupla(doc, labelEsquerda, valorEsquerda, labelDireita, valorDireita){

    const y = doc.y;
    const yValor = y + ALTURA_LABEL;

    const alturaEsquerda = doc.heightOfString(
    valorEsquerda || "Não informado",
        {
            width: 220
        }
    );

    const alturaDireita = doc.heightOfString(
        valorDireita || "Não informado",
        {
            width: 220
        }
    );

    const alturaValor = Math.max(
        alturaEsquerda,
        alturaDireita
    );

    doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
            labelEsquerda.toUpperCase(),
            MARGEM_ESQUERDA,
            y
        );

    doc.text(
        labelDireita.toUpperCase(),
        300,
        y
    );

    doc
        .font("Helvetica")
        .fontSize(11)
        .text(
            valorEsquerda || "Não informado",
            MARGEM_ESQUERDA,
            yValor,
            {
                width: 220
            }
        );

    doc.text(
        valorDireita || "Não informado",
        300,
        yValor,
        {
            width: 220
        }
    );
    
    doc.x = MARGEM_ESQUERDA;
    doc.y = yValor + alturaValor + ESPACO_ENTRE_CAMPOS;
}

function adicionarCampo(doc, label, valor) {

    const y = doc.y;
    const yValor = y + ALTURA_LABEL;

    doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
            label.toUpperCase(),
            MARGEM_ESQUERDA,
            y
        );

    doc
        .font("Helvetica")
        .fontSize(11)
        .text(
            valor || "Não informado",
            MARGEM_ESQUERDA,
            yValor
        );

    doc.x = MARGEM_ESQUERDA;
    doc.y = yValor + 14 + ESPACO_ENTRE_CAMPOS;
}

function adicionarDescricao(doc, descricao) {

    const texto = descricao || "Nenhuma descrição informada.";
    const largura = MARGEM_DIREITA - MARGEM_ESQUERDA;

    const linhas = texto.split("\n");

    doc
        .font("Helvetica")
        .fontSize(11);

    for (const linha of linhas) {

        if (linha.trim() === "") {
            doc.y += 8;
            continue;
        }

        doc.x = MARGEM_ESQUERDA;

        doc.text(
            linha,
            {
                width: largura,
                lineGap: 3
            }
        );
    }
}

function verificarEspaco(doc, alturaNecessaria) {

    const limiteInferior =
        doc.page.height - doc.page.margins.bottom;

    if (doc.y + alturaNecessaria > limiteInferior) {
        doc.addPage();

        doc.x = MARGEM_ESQUERDA;
        doc.y = doc.page.margins.top;
    }
}

async function gerarPdfSolicitacao(req, res) {

    try{
        const { id } = req.params;

        const resultado = await pool.query(
            `
            SELECT
                s.*,
                r.nome AS responsavel,
                ts.nome AS tipo_servico
            FROM solicitacoes s
            LEFT JOIN responsaveis r
                ON s.responsavel_id = r.id
            JOIN tipos_servico ts
                ON s.tipo_servico_id = ts.id
            WHERE s.id = $1
            `,
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: "Solicitação não encontrada"
            });
        }

        const solicitacao = resultado.rows[0];

        const doc = new PDFDocument({
            size: "A4",
            margins: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50
            }
        });

        res.setHeader("Content-Type", "application/pdf");

        res.setHeader(
            "Content-Disposition",
            `inline; filename="solicitacao-${id}.pdf"`
        );

        doc.pipe(res);

        adicionarSolicitacaoAoPdf(doc, solicitacao);

        doc.end();
    }catch(error){
        console.error(
            "Erro ao gerar PDF:",
            error
        );

        return res.status(500).json({
            mensagem: "Erro ao gerar PDF"
        });
    }
}

async function gerarPdfLote(req, res){
    
    try{
        const { ids } =  req.body;

        if(!ids || ids.length === 0){
            return res.status(400).json({
                mensagem: "Selecione pelo menos uma solicitação"
            })
        }

        const resultado = await pool.query(
            `
            SELECT
                s.*,
                r.nome AS responsavel,
                ts.nome AS tipo_servico
            FROM solicitacoes s
            LEFT JOIN responsaveis r
                ON s.responsavel_id = r.id
            JOIN tipos_servico ts
                ON s.tipo_servico_id = ts.id
            WHERE s.id = ANY($1)
            ORDER by s.id
            `,
            [ids]
            )

            if(resultado.rows.length === 0){
                return res.status(404).json({
                    mensagem: "Solicitação não encontrada."
                })
            }

        const doc = new PDFDocument({
            size: "A4",
            margins: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50
            }
        });

        res.setHeader("Content-Type", "application/pdf");

        res.setHeader(
            "Content-Disposition",
            `inline; filename="solicitacoes-lote.pdf"`
        );

        doc.pipe(res);

        for (let i = 0; i < resultado.rows.length; i++) {

            const solicitacao = resultado.rows[i];

            if (i !== 0) {
                   doc.addPage();
                }

                adicionarSolicitacaoAoPdf(doc, solicitacao);
        }

        doc.end();


    }catch(error){
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao gerar PDF em lote"
        });
    }


}

function adicionarSolicitacaoAoPdf(doc, solicitacao) {
    doc
            .fontSize(22)
            .font("Helvetica-Bold")
            .text(
                "SOLICITAÇÃO DE SERVIÇO",
                MARGEM_ESQUERDA,
                50,
                {
                    align: "center",
                    width: MARGEM_DIREITA - MARGEM_ESQUERDA
                }
            );

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(
                `Solicitação Nº ${solicitacao.id}`,
                MARGEM_ESQUERDA,
                80,
                {
                    align: "center",
                    width: MARGEM_DIREITA - MARGEM_ESQUERDA
                }
            );

        doc
            .moveTo(MARGEM_ESQUERDA, 105)
            .lineTo(MARGEM_DIREITA, 105)
            .lineWidth(1.5)
            .stroke();

        doc.x = MARGEM_ESQUERDA;
        doc.y = 115;

        adicionarTituloSecao(doc, "Dados do solicitante");

        adicionarCampo(
            doc,
            "Nome",
            solicitacao.nome
        );

        adicionarLinhaDupla(
            doc,
            "CPF",
            solicitacao.cpf,
            "RG",
            solicitacao.rg
        );

        adicionarCampo(
            doc,
            "Telefone",
            solicitacao.telefone_celular
        );

        adicionarTituloSecao(doc, "Endereço");

        adicionarLinhaDupla(
            doc,
            "Rua",
            solicitacao.rua,
            "Número",
            solicitacao.numero
        );

        adicionarLinhaDupla(
            doc,
            "Bairro",
            solicitacao.bairro,
            "CEP",
            solicitacao.cep
        );

        adicionarLinhaDupla(
            doc,
            "Cidade",
            solicitacao.cidade,
            "UF",
            solicitacao.uf
        );
        adicionarCampo(
            doc,
            "Complemento",
            solicitacao.complemento
        );

        adicionarTituloSecao(doc, "Dados da solicitação");

        adicionarLinhaDupla(
            doc,
            "Responsável",
            solicitacao.responsavel,
            "Tipo de serviço",
            solicitacao.tipo_servico
        );

        adicionarLinhaDupla(
            doc,
            "Prioridade",
            solicitacao.prioridade,
            "Status",
            solicitacao.status
        );

        const textoDescricao =
        solicitacao.descricao || "Nenhuma descrição informada.";

        const alturaDescricao = doc.heightOfString(
            textoDescricao,
            {
              width: MARGEM_DIREITA - MARGEM_ESQUERDA
            }
        );

        verificarEspaco(doc, alturaDescricao + 55);

        adicionarTituloSecao(doc, "Descrição"); 

        adicionarDescricao(
            doc,
            solicitacao.descricao
        );

}

module.exports = {
    gerarPdfSolicitacao,
    gerarPdfLote
};