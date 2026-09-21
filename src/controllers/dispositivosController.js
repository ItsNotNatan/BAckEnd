// ==========================================
// FILE: src/controllers/dispositivosController.js
// ==========================================
const axios = require('axios');

/**
 * Cria um novo dispositivo na base de dados Supabase via API REST.
 * Os dados já chegam validados pelo middleware do Zod.
 */
exports.criarDispositivo = async (req, res) => {
    const dadosDoFormulario = req.body;
    console.log("📦 Dados recebidos e validados:", dadosDoFormulario);

    const urlSupabase = `${process.env.SUPABASE_URL}/rest/v1/dispositivos`;

    // Execução da requisição HTTP POST utilizando o Axios
    const respostaSupabase = await axios.post(urlSupabase, dadosDoFormulario, {
        headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SECRET_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
            'Prefer': 'return=representation'
        }
    });

    console.log("✅ Dados gravados com sucesso no Supabase!");

    // Retorna a resposta de sucesso para o Front-end
    return res.status(201).json({
        sucesso: true,
        mensagem: 'Dispositivo registrado com sucesso!',
        dados: respostaSupabase.data
    });
};

/**
 * Busca todos os dispositivos registados no Supabase
 * para alimentar a tabela de Logística no Front-end.
 */
exports.listarDispositivos = async (req, res) => {
    console.log("🔍 A buscar lista de dispositivos no Supabase...");

    // O select=* pede todas as colunas da tabela
    const urlSupabase = `${process.env.SUPABASE_URL}/rest/v1/dispositivos?select=*`;

    const respostaSupabase = await axios.get(urlSupabase, {
        headers: {
            'apikey': process.env.SUPABASE_SECRET_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`
        }
    });

    console.log(`✅ Foram encontrados ${respostaSupabase.data.length} dispositivos.`);

    return res.status(200).json({
        sucesso: true,
        dados: respostaSupabase.data
    });
};