/**
 * Utilitários de validação e formatação para CPF, CNPJ e moeda brasileira
 */

// ==================== CPF ====================

/**
 * Remove caracteres não numéricos do CPF
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Formata CPF para exibição (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanCPF(cpf);
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Verifica se o CPF é uma sequência inválida conhecida
 */
function isInvalidCPFSequence(cpf: string): boolean {
  const invalidSequences = [
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
  ];
  return invalidSequences.includes(cpf);
}

/**
 * Valida CPF usando o algoritmo oficial de dígitos verificadores
 * @param cpf CPF com ou sem formatação
 * @returns true se o CPF é válido
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cleanCPF(cpf);
  
  // Deve ter 11 dígitos
  if (cleaned.length !== 11) {
    return false;
  }
  
  // Rejeitar sequências inválidas conhecidas
  if (isInvalidCPFSequence(cleaned)) {
    return false;
  }
  
  // Extrair dígitos
  const digits = cleaned.split('').map(Number);
  
  // Calcular primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let remainder = sum % 11;
  const firstVerifier = remainder < 2 ? 0 : 11 - remainder;
  
  // Verificar primeiro dígito
  if (digits[9] !== firstVerifier) {
    return false;
  }
  
  // Calcular segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  remainder = sum % 11;
  const secondVerifier = remainder < 2 ? 0 : 11 - remainder;
  
  // Verificar segundo dígito
  if (digits[10] !== secondVerifier) {
    return false;
  }
  
  return true;
}

// ==================== CNPJ ====================

/**
 * Remove caracteres não numéricos do CNPJ
 */
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Formata CNPJ para exibição (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanCNPJ(cnpj);
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Verifica se o CNPJ é uma sequência inválida conhecida
 */
function isInvalidCNPJSequence(cnpj: string): boolean {
  const invalidSequences = [
    '00000000000000',
    '11111111111111',
    '22222222222222',
    '33333333333333',
    '44444444444444',
    '55555555555555',
    '66666666666666',
    '77777777777777',
    '88888888888888',
    '99999999999999',
  ];
  return invalidSequences.includes(cnpj);
}

/**
 * Valida CNPJ usando o algoritmo oficial de dígitos verificadores
 * @param cnpj CNPJ com ou sem formatação
 * @returns true se o CNPJ é válido
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cleanCNPJ(cnpj);
  
  // Deve ter 14 dígitos
  if (cleaned.length !== 14) {
    return false;
  }
  
  // Rejeitar sequências inválidas conhecidas
  if (isInvalidCNPJSequence(cleaned)) {
    return false;
  }
  
  // Extrair dígitos
  const digits = cleaned.split('').map(Number);
  
  // Pesos para o primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  // Calcular primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weights1[i];
  }
  let remainder = sum % 11;
  const firstVerifier = remainder < 2 ? 0 : 11 - remainder;
  
  // Verificar primeiro dígito
  if (digits[12] !== firstVerifier) {
    return false;
  }
  
  // Pesos para o segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  // Calcular segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weights2[i];
  }
  remainder = sum % 11;
  const secondVerifier = remainder < 2 ? 0 : 11 - remainder;
  
  // Verificar segundo dígito
  if (digits[13] !== secondVerifier) {
    return false;
  }
  
  return true;
}

// ==================== MOEDA ====================

/**
 * Formata número para moeda brasileira (R$ 1.234.567,89)
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

/**
 * Converte string de moeda brasileira para número
 * Ex: "R$ 1.234.567,89" -> 1234567.89
 */
export function parseCurrency(value: string): number {
  // Remove "R$", espaços, pontos de milhar e troca vírgula por ponto
  const cleaned = value
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata input de moeda enquanto o usuário digita
 * Retorna apenas números para armazenamento
 */
export function formatCurrencyInput(value: string): { display: string; raw: number } {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) {
    return { display: '', raw: 0 };
  }
  
  // Converte para centavos
  const cents = parseInt(numbers, 10);
  const reais = cents / 100;
  
  return {
    display: formatCurrency(reais),
    raw: reais,
  };
}

// ==================== CEP ====================

/**
 * Remove caracteres não numéricos do CEP
 */
export function cleanCEP(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Formata CEP para exibição (00000-000)
 */
export function formatCEP(cep: string): string {
  const cleaned = cleanCEP(cep);
  if (cleaned.length !== 8) return cep;
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Valida formato do CEP (8 dígitos)
 */
export function validateCEP(cep: string): boolean {
  const cleaned = cleanCEP(cep);
  return cleaned.length === 8;
}

// ==================== TELEFONE ====================

/**
 * Remove caracteres não numéricos do telefone
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formata telefone para exibição
 * (00) 0000-0000 ou (00) 00000-0000
 */
export function formatPhone(phone: string): string {
  const cleaned = cleanPhone(phone);
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}
