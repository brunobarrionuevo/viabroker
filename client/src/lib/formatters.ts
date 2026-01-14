// Utilitários de formatação e validação

/**
 * Formata número de telefone no padrão brasileiro (XX) XXXXX-XXXX
 */
export function formatPhone(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11);
  
  // Aplica a máscara
  if (limited.length <= 2) {
    return limited.length > 0 ? `(${limited}` : '';
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
}

/**
 * Remove formatação do telefone, retornando apenas números
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida se o telefone tem o formato correto (10 ou 11 dígitos)
 */
export function isValidPhone(value: string): boolean {
  const numbers = value.replace(/\D/g, '');
  return numbers.length >= 10 && numbers.length <= 11;
}

/**
 * Formata CPF no padrão XXX.XXX.XXX-XX
 */
export function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
  }
}

/**
 * Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
  }
}

/**
 * Formata CPF ou CNPJ automaticamente baseado no tamanho
 */
export function formatCPFOrCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    return formatCPF(value);
  } else {
    return formatCNPJ(value);
  }
}

/**
 * Valida CPF usando algoritmo oficial
 */
export function isValidCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[9])) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[10])) return false;
  
  return true;
}

/**
 * Valida CNPJ usando algoritmo oficial
 */
export function isValidCNPJ(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(numbers[12])) return false;
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(numbers[13])) return false;
  
  return true;
}

/**
 * Valida CPF ou CNPJ automaticamente baseado no tamanho
 */
export function isValidCPFOrCNPJ(value: string): { valid: boolean; type: 'cpf' | 'cnpj' | null; message: string } {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 0) {
    return { valid: false, type: null, message: 'CPF ou CNPJ é obrigatório' };
  }
  
  if (numbers.length <= 11) {
    if (numbers.length < 11) {
      return { valid: false, type: 'cpf', message: 'CPF incompleto. Digite os 11 dígitos.' };
    }
    if (!isValidCPF(numbers)) {
      return { valid: false, type: 'cpf', message: 'CPF inválido. Verifique os números digitados.' };
    }
    return { valid: true, type: 'cpf', message: '' };
  } else {
    if (numbers.length < 14) {
      return { valid: false, type: 'cnpj', message: 'CNPJ incompleto. Digite os 14 dígitos.' };
    }
    if (!isValidCNPJ(numbers)) {
      return { valid: false, type: 'cnpj', message: 'CNPJ inválido. Verifique os números digitados.' };
    }
    return { valid: true, type: 'cnpj', message: '' };
  }
}

/**
 * Exibe telefone formatado para visualização
 */
export function displayPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length === 0) return '';
  return formatPhone(numbers);
}


/**
 * Formata valor monetário no padrão brasileiro (xxx.xxx.xxx,xx)
 * @param value Valor numérico ou string
 * @returns String formatada no padrão brasileiro
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  
  // Converte para número
  let numValue: number;
  if (typeof value === 'string') {
    // Remove formatação existente e converte
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    numValue = parseFloat(cleaned);
  } else {
    numValue = value;
  }
  
  if (isNaN(numValue)) return '';
  
  // Formata no padrão brasileiro
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formata valor monetário com símbolo R$
 * @param value Valor numérico ou string
 * @returns String formatada com R$ no padrão brasileiro
 */
export function formatCurrencyWithSymbol(value: number | string | null | undefined): string {
  const formatted = formatCurrency(value);
  if (!formatted) return '';
  return `R$ ${formatted}`;
}

/**
 * Formata input de preço enquanto o usuário digita
 * @param value Valor digitado
 * @returns String formatada para exibição no input
 */
export function formatPriceInput(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 0) return '';
  
  // Converte para centavos (últimos 2 dígitos são centavos)
  const cents = parseInt(numbers, 10);
  const reais = cents / 100;
  
  return formatCurrency(reais);
}

/**
 * Remove formatação de preço e retorna valor numérico em centavos
 * @param value Valor formatado
 * @returns Número em centavos
 */
export function unformatPrice(value: string): number {
  if (!value) return 0;
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  return parseInt(numbers, 10) || 0;
}

/**
 * Converte valor formatado para número decimal
 * @param value Valor formatado (ex: "1.234.567,89")
 * @returns Número decimal (ex: 1234567.89)
 */
export function parseFormattedPrice(value: string): number {
  if (!value) return 0;
  // Remove pontos de milhar e substitui vírgula por ponto
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
