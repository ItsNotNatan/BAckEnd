/**
 * Pega num valor (número ou texto) e formata para a moeda brasileira (R$).
 * Exemplo: 1500.5 -> "R$ 1.500,50"
 */
export const formatarDinheiro = (valor) => {
  if (valor === null || valor === undefined || valor === '') {
    return 'R$ 0,00';
  }

  let numeroLimpo = valor;

  if (typeof numeroLimpo === 'string') {
    numeroLimpo = numeroLimpo.replace(/[^\d.,-]/g, '');
    if (numeroLimpo.includes('.') && numeroLimpo.includes(',')) {
      numeroLimpo = numeroLimpo.replace(/\./g, '').replace(',', '.');
    } else if (numeroLimpo.includes(',')) {
      numeroLimpo = numeroLimpo.replace(',', '.');
    }
  }

  const valorNumerico = parseFloat(numeroLimpo);

  if (isNaN(valorNumerico)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valorNumerico);
};

/**
 * Formata o valor em tempo real para moeda (R$) enquanto o utilizador digita.
 */
export const formatarDinheiroTempoReal = (valorOriginal) => {
  if (!valorOriginal) return '';

  // Remove tudo o que não for número
  const apenasNumeros = valorOriginal.replace(/\D/g, '');

  if (apenasNumeros === '') return '';

  // Divide por 100 para ter sempre 2 casas decimais
  const valorDecimal = parseInt(apenasNumeros, 10) / 100;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valorDecimal);
};