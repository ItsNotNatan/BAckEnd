// src/controllers/usuariosController.js
const service = require('../services/usuariosService');

const listar = async (req, res) => {
  try {
    const dados = await service.listarUsuarios();
    res.status(200).json({ sucesso: true, dados });
  } catch (error) {
    console.error('[Erro ao listar utilizadores]:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar utilizadores.' });
  }
};

const criar = async (req, res) => {
  try {
    const dados = req.body;
    
    // Validação básica
    if (!dados.email || !dados.nome || !dados.cargo) {
      return res.status(400).json({ sucesso: false, erro: 'Preencha os campos obrigatórios.' });
    }

    await service.criarUsuario(dados);
    res.status(201).json({ sucesso: true, mensagem: 'Utilizador criado com sucesso!' });
  } catch (error) {
    console.error('[Erro ao criar utilizador]:', error);
    // Erro 23505 é o código do PostgreSQL para duplicados (email já existe)
    if (error.code === '23505') {
      return res.status(400).json({ sucesso: false, erro: 'Este e-mail já está registado.' });
    }
    res.status(500).json({ sucesso: false, erro: 'Falha ao criar utilizador.' });
  }
};

const atualizar = async (req, res) => {
  const { id } = req.params;
  const dados = req.body;

  try {
    await service.atualizarUsuario(id, dados);
    res.status(200).json({ sucesso: true, mensagem: 'Utilizador atualizado com sucesso!' });
  } catch (error) {
    console.error(`[Erro ao atualizar utilizador ${id}]:`, error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao atualizar dados.' });
  }
};
// src/controllers/usuariosController.js
// Adiciona esta função junto das outras (listar, criar, atualizar)

const deletar = async (req, res) => {
  const idAlvo = req.params.id; // O ID do utilizador que vai ser apagado
  const { senha_admin } = req.body; // A senha que o administrador digitou no modal
  const idLogado = req.usuario.id; // ID extraído do Token JWT de quem está a fazer o pedido

  try {
    if (!senha_admin) {
      return res.status(400).json({ sucesso: false, erro: 'A senha de confirmação é obrigatória.' });
    }

    // 1. O serviço vai validar a senha e deletar o usuário se estiver correta
    await service.deletarUsuarioComConfirmacao(idAlvo, idLogado, senha_admin);
    
    res.status(200).json({ sucesso: true, mensagem: 'Utilizador removido com sucesso!' });
  } catch (error) {
    console.error(`[Erro ao deletar utilizador ${idAlvo}]:`, error.message);
    res.status(401).json({ sucesso: false, erro: error.message || 'Falha ao remover utilizador.' });
  }
};

// Não te esqueças de exportar o 'deletar' no module.exports no final do ficheiro!
module.exports = { listar, criar, atualizar, deletar };