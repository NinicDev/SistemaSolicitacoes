const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function enviarEmail({ to, subject, text }) {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text
    });
}

async function enviarCodigoRecuperacaoSenha(email, codigo) {
    await enviarEmail({
        to: email,
        subject: "Código de recuperação de senha",
        text: `Seu código para redefinir sua senha é: ${codigo}. Se você não solicitou isso, ignore este e-mail.`
    });
}

async function enviarCodigoVerificacao(email, codigo) {
    await enviarEmail({
        to: email,
        subject: "Código de verificação",
        text: `Seu código de verificação é: ${codigo}`
    });
}
module.exports = {enviarCodigoVerificacao, enviarCodigoRecuperacaoSenha};
