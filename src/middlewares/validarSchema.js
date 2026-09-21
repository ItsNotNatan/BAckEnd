// ==========================================
// FILE: src/middlewares/validarSchema.js
// ==========================================

const validarSchema = (schema) => (req, res, next) => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
        const errosFormatados = resultado.error.issues.map(issue => ({
            campo: issue.path.join('.'),
            mensagem: issue.message
        }));

        console.warn("⚠️ Dados bloqueados pelo Zod no Back-end:", errosFormatados);

        return res.status(400).json({
            sucesso: false,
            erro: 'Dados informados são inválidos.',
            detalhes: errosFormatados
        });
    }

    req.body = resultado.data;
    next();
};

module.exports = validarSchema;