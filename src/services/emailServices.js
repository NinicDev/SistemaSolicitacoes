const { Resend } = require("resend");

const resend = new Resend(
    process.env.RESEND_API_KEY
);

async function enviarEmail({ to, subject, text }) {

    const { error } = await resend.emails.send({
        from: "Sistema de Solicitações <onboarding@resend.dev>",
        to,
        subject,
        text
    });

    if (error) {
        throw new Error(
            "Não foi possível enviar o e-mail."
        );
    }
}

async function enviarCodigoRecuperacaoSenha(
    email,
    codigo
) {
    await enviarEmail({
        to: email,
        subject: "Código de recuperação de senha",
        text:
            `Seu código para redefinir sua senha é: ${codigo}. ` +
            "Se você não solicitou isso, ignore este e-mail."
    });
}

async function enviarCodigoVerificacao(
    email,
    codigo
) {
    await enviarEmail({
        to: email,
        subject: "Código de verificação",
        text:
            `Seu código de verificação é: ${codigo}`
    });
}

module.exports = {
    enviarCodigoVerificacao,
    enviarCodigoRecuperacaoSenha
};