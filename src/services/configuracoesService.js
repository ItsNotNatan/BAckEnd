const supabase = require('../config/supabase');

const obterTarget = async () => {
  // Procura a linha onde a chave é 'target_eficiencia'
  const { data, error } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'target_eficiencia')
    .single();

  // Se não encontrar nada (PGRST116), assumimos o padrão de 3 dias
  if (error && error.code !== 'PGRST116') throw error;
  
  return data ? Number(data.valor) : 3; 
};

const atualizarTarget = async (novoValor) => {
  // O upsert insere se não existir, ou atualiza se já existir
  const { error } = await supabase
    .from('configuracoes')
    .upsert([{ chave: 'target_eficiencia', valor: novoValor }]);

  if (error) throw error;
  return true;
};

module.exports = { obterTarget, atualizarTarget };