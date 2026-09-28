const pool = require("../../config/database");
const fs = require("fs/promises");
const path = require("path");

async function criarAnexo(req, res) {

    const { id_solicitacao } = req.params;
    const arquivos = req.files;

    if (!arquivos || arquivos.length === 0) {
        return res.status(400).json({
            mensagem: "Nenhum arquivo enviado"
        });
    }

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        for (const arquivo of arquivos) {
            await client.query(
                `
                INSERT INTO anexos
                    (id_solicitacao, nome_original, caminho_arquivo)
                VALUES
                    ($1, $2, $3)
                `,
                [id_solicitacao, arquivo.originalname, arquivo.path]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            mensagem: "Anexos criados com sucesso!"
        });

    } catch (error) {

        if (client) {
            await client.query("ROLLBACK");
        }

        // Se o banco falhar, remove os arquivos que o multer já gravou em disco.
        try {
            if (req.files?.length) {
                for (const arquivo of req.files) {
                    await fs.unlink(arquivo.path);
                }
            }
        } catch (erroLimpeza) {
            console.error("Erro ao limpar arquivos após falha no upload:", erroLimpeza);
        }

        return res.status(500).json({
            mensagem: "Erro ao criar anexos."
        });

    } finally {
        if (client) {
            client.release();
        }
    }
}

async function listarAnexos(req, res) {

    const { id_solicitacao } = req.params;

    try {
        const resultado = await pool.query(
            `
            SELECT
                id,
                id_solicitacao,
                nome_original,
                criado_em
            FROM anexos
            WHERE id_solicitacao = $1
            ORDER BY id
            `,
            [id_solicitacao]
        );

        return res.status(200).json(resultado.rows);

    } catch (error) {
        return res.status(500).json({
            mensagem: "Erro ao listar anexos"
        });
    }
}

async function obterArquivoAnexo(req, res) {

    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `
            SELECT
                caminho_arquivo,
                nome_original
            FROM anexos
            WHERE id = $1
            `,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Anexo não encontrado"
            });
        }

        const anexo = resultado.rows[0];
        const caminhoAbsoluto = path.resolve(anexo.caminho_arquivo);

        return res.sendFile(caminhoAbsoluto);

    } catch (error) {
        console.error("Erro ao carregar arquivo do anexo:", error);

        return res.status(500).json({
            mensagem: "Erro ao carregar anexo"
        });
    }
}

async function excluirAnexos(req, res) {

    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `
            DELETE FROM anexos
            WHERE id = $1
            RETURNING
                id,
                caminho_arquivo
            `,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Anexo não encontrado"
            });
        }

        const anexo = resultado.rows[0];

        // O registro já foi removido; a limpeza física não deve transformar a resposta em falha.
        try {
            await fs.unlink(anexo.caminho_arquivo);
        } catch (erroArquivo) {
            if (erroArquivo.code !== "ENOENT") {
                console.error("Registro do anexo excluído, mas o arquivo físico não pôde ser removido:", erroArquivo);
            }
        }

        return res.status(200).json({
            mensagem: "Anexo excluído com sucesso"
        });

    } catch (error) {
        console.error("Erro ao excluir anexo:", error);

        return res.status(500).json({
            mensagem: "Não foi possível excluir o anexo"
        });
    }
}

module.exports = {
    criarAnexo,
    listarAnexos,
    obterArquivoAnexo,
    excluirAnexos
};
