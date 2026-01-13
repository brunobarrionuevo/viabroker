import { describe, it, expect } from 'vitest';
import {
  formatPhone,
  unformatPhone,
  isValidPhone,
  formatCPF,
  formatCNPJ,
  formatCPFOrCNPJ,
  isValidCPF,
  isValidCNPJ,
  isValidCPFOrCNPJ,
  displayPhone
} from './formatters';

describe('formatPhone', () => {
  it('should format phone number with DDD', () => {
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
  });

  it('should format partial phone number', () => {
    expect(formatPhone('11')).toBe('(11');
    expect(formatPhone('1199')).toBe('(11) 99');
    expect(formatPhone('1199999')).toBe('(11) 99999');
  });

  it('should handle empty string', () => {
    expect(formatPhone('')).toBe('');
  });

  it('should strip non-numeric characters', () => {
    expect(formatPhone('(11) 99999-8888')).toBe('(11) 99999-8888');
  });
});

describe('unformatPhone', () => {
  it('should remove formatting from phone', () => {
    expect(unformatPhone('(11) 99999-8888')).toBe('11999998888');
  });
});

describe('isValidPhone', () => {
  it('should validate correct phone numbers', () => {
    expect(isValidPhone('11999998888')).toBe(true);
    expect(isValidPhone('1199998888')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});

describe('formatCPF', () => {
  it('should format CPF correctly', () => {
    expect(formatCPF('12345678909')).toBe('123.456.789-09');
  });

  it('should format partial CPF', () => {
    expect(formatCPF('123')).toBe('123');
    expect(formatCPF('1234')).toBe('123.4');
    expect(formatCPF('1234567')).toBe('123.456.7');
    expect(formatCPF('123456789')).toBe('123.456.789');
  });
});

describe('formatCNPJ', () => {
  it('should format CNPJ correctly', () => {
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('should format partial CNPJ', () => {
    expect(formatCNPJ('11')).toBe('11');
    expect(formatCNPJ('11222')).toBe('11.222');
    expect(formatCNPJ('11222333')).toBe('11.222.333');
    expect(formatCNPJ('112223330001')).toBe('11.222.333/0001');
  });
});

describe('isValidCPF', () => {
  it('should validate correct CPFs', () => {
    // CPFs válidos de teste
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('should reject invalid CPFs', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('123.456.789-00')).toBe(false);
    expect(isValidCPF('12345678900')).toBe(false);
    expect(isValidCPF('')).toBe(false);
    expect(isValidCPF('123')).toBe(false);
  });

  it('should reject CPFs with all same digits', () => {
    expect(isValidCPF('00000000000')).toBe(false);
    expect(isValidCPF('99999999999')).toBe(false);
  });
});

describe('isValidCNPJ', () => {
  it('should validate correct CNPJs', () => {
    // CNPJs válidos de teste
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    expect(isValidCNPJ('11222333000181')).toBe(true);
  });

  it('should reject invalid CNPJs', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
    expect(isValidCNPJ('12.345.678/0001-00')).toBe(false);
    expect(isValidCNPJ('')).toBe(false);
    expect(isValidCNPJ('123')).toBe(false);
  });

  it('should reject CNPJs with all same digits', () => {
    expect(isValidCNPJ('00000000000000')).toBe(false);
    expect(isValidCNPJ('99999999999999')).toBe(false);
  });
});

describe('isValidCPFOrCNPJ', () => {
  it('should validate CPF correctly', () => {
    const result = isValidCPFOrCNPJ('529.982.247-25');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('cpf');
  });

  it('should validate CNPJ correctly', () => {
    const result = isValidCPFOrCNPJ('11.222.333/0001-81');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('cnpj');
  });

  it('should return error for invalid CPF', () => {
    const result = isValidCPFOrCNPJ('123.456.789-00');
    expect(result.valid).toBe(false);
    expect(result.type).toBe('cpf');
    expect(result.message).toContain('inválido');
  });

  it('should return error for incomplete CPF', () => {
    const result = isValidCPFOrCNPJ('123.456');
    expect(result.valid).toBe(false);
    expect(result.type).toBe('cpf');
    expect(result.message).toContain('incompleto');
  });

  it('should return error for empty value', () => {
    const result = isValidCPFOrCNPJ('');
    expect(result.valid).toBe(false);
    expect(result.type).toBe(null);
    expect(result.message).toContain('obrigatório');
  });
});

describe('displayPhone', () => {
  it('should format phone for display', () => {
    expect(displayPhone('11999998888')).toBe('(11) 99999-8888');
  });

  it('should handle null/undefined', () => {
    expect(displayPhone(null)).toBe('');
    expect(displayPhone(undefined)).toBe('');
  });

  it('should handle already formatted phone', () => {
    expect(displayPhone('(11) 99999-8888')).toBe('(11) 99999-8888');
  });
});

describe('formatCPFOrCNPJ', () => {
  it('should format as CPF when 11 digits or less', () => {
    expect(formatCPFOrCNPJ('12345678909')).toBe('123.456.789-09');
  });

  it('should format as CNPJ when more than 11 digits', () => {
    expect(formatCPFOrCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });
});
