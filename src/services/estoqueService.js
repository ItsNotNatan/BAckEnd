// src/services/estoqueService.js
const supabase = require('../config/supabase');

const listarEstoqueGeral = async (filial = '', incluirZerados = false) => {
  let query = supabase.from('estoque').select('*');
  if (!incluirZerados) {
    query = query.gt('quantidade_disponivel', 0);
  }
  if (filial && filial !== 'TODOS') {
    query = query.eq('filial_id', filial);
  }
  const { data, error } = await query.order('part_number', { ascending: true });
  if (error) throw error;
  return data;
};

// ✨ NOVA FUNÇÃO: Atualiza os dados de um item específico
const atualizarItemEstoque = async (id, dadosAtualizados) => {
  const { error } = await supabase
    .from('estoque')
    .update(dadosAtualizados)
    .eq('id', id);

  if (error) throw error;
  return true;
};

module.exports = {
  listarEstoqueGeral,
  atualizarItemEstoque // ✨ Exportar a nova função
};