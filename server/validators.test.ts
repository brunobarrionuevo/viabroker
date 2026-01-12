import { describe, expect, it } from "vitest";
import {
  validateCPF,
  validateCNPJ,
  formatCPF,
  formatCNPJ,
  formatCurrency,
  parseCurrency,
  cleanCPF,
  cleanCNPJ,
  validateCEP,
  formatCEP,
} from "../shared/validators";

describe("CPF Validation", () => {
  it("validates a correct CPF", () => {
    // CPFs válidos conhecidos (gerados para teste)
    expect(validateCPF("529.982.247-25")).toBe(true);
    expect(validateCPF("52998224725")).toBe(true);
    expect(validateCPF("111.444.777-35")).toBe(true);
  });

  it("rejects invalid CPF with wrong check digits", () => {
    expect(validateCPF("529.982.247-26")).toBe(false);
    expect(validateCPF("529.982.247-24")).toBe(false);
    expect(validateCPF("123.456.789-00")).toBe(false);
  });

  it("rejects CPF with invalid length", () => {
    expect(validateCPF("123456789")).toBe(false);
    expect(validateCPF("1234567890123")).toBe(false);
    expect(validateCPF("")).toBe(false);
  });

  it("rejects known invalid sequences", () => {
    expect(validateCPF("000.000.000-00")).toBe(false);
    expect(validateCPF("111.111.111-11")).toBe(false);
    expect(validateCPF("222.222.222-22")).toBe(false);
    expect(validateCPF("333.333.333-33")).toBe(false);
    expect(validateCPF("444.444.444-44")).toBe(false);
    expect(validateCPF("555.555.555-55")).toBe(false);
    expect(validateCPF("666.666.666-66")).toBe(false);
    expect(validateCPF("777.777.777-77")).toBe(false);
    expect(validateCPF("888.888.888-88")).toBe(false);
    expect(validateCPF("999.999.999-99")).toBe(false);
  });

  it("formats CPF correctly", () => {
    expect(formatCPF("52998224725")).toBe("529.982.247-25");
    expect(formatCPF("11144477735")).toBe("111.444.777-35");
  });

  it("cleans CPF correctly", () => {
    expect(cleanCPF("529.982.247-25")).toBe("52998224725");
    expect(cleanCPF("111.444.777-35")).toBe("11144477735");
  });
});

describe("CNPJ Validation", () => {
  it("validates a correct CNPJ", () => {
    // CNPJs válidos conhecidos (gerados para teste)
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
    expect(validateCNPJ("11222333000181")).toBe(true);
    expect(validateCNPJ("11.444.777/0001-61")).toBe(true);
  });

  it("rejects invalid CNPJ with wrong check digits", () => {
    expect(validateCNPJ("11.222.333/0001-82")).toBe(false);
    expect(validateCNPJ("11.222.333/0001-80")).toBe(false);
    expect(validateCNPJ("12.345.678/0001-00")).toBe(false);
  });

  it("rejects CNPJ with invalid length", () => {
    expect(validateCNPJ("1234567890")).toBe(false);
    expect(validateCNPJ("123456789012345")).toBe(false);
    expect(validateCNPJ("")).toBe(false);
  });

  it("rejects known invalid sequences", () => {
    expect(validateCNPJ("00.000.000/0000-00")).toBe(false);
    expect(validateCNPJ("11.111.111/1111-11")).toBe(false);
    expect(validateCNPJ("22.222.222/2222-22")).toBe(false);
    expect(validateCNPJ("33.333.333/3333-33")).toBe(false);
    expect(validateCNPJ("44.444.444/4444-44")).toBe(false);
    expect(validateCNPJ("55.555.555/5555-55")).toBe(false);
    expect(validateCNPJ("66.666.666/6666-66")).toBe(false);
    expect(validateCNPJ("77.777.777/7777-77")).toBe(false);
    expect(validateCNPJ("88.888.888/8888-88")).toBe(false);
    expect(validateCNPJ("99.999.999/9999-99")).toBe(false);
  });

  it("formats CNPJ correctly", () => {
    expect(formatCNPJ("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatCNPJ("11444777000161")).toBe("11.444.777/0001-61");
  });

  it("cleans CNPJ correctly", () => {
    expect(cleanCNPJ("11.222.333/0001-81")).toBe("11222333000181");
    expect(cleanCNPJ("11.444.777/0001-61")).toBe("11444777000161");
  });
});

describe("Currency Formatting", () => {
  it("formats numbers to Brazilian currency", () => {
    // Intl.NumberFormat usa espaço não-quebrável (\u00a0) entre R$ e o valor
    expect(formatCurrency(1234567.89)).toContain("1.234.567,89");
    expect(formatCurrency(1000)).toContain("1.000,00");
    expect(formatCurrency(0)).toContain("0,00");
    expect(formatCurrency(99.9)).toContain("99,90");
  });

  it("parses Brazilian currency to number", () => {
    expect(parseCurrency("R$ 1.234.567,89")).toBe(1234567.89);
    expect(parseCurrency("R$ 1.000,00")).toBe(1000);
    expect(parseCurrency("R$ 0,00")).toBe(0);
    expect(parseCurrency("1.234,56")).toBe(1234.56);
  });

  it("handles invalid currency strings", () => {
    expect(parseCurrency("invalid")).toBe(0);
    expect(parseCurrency("")).toBe(0);
    expect(formatCurrency(NaN)).toBe("R$ 0,00");
  });
});

describe("CEP Validation and Formatting", () => {
  it("validates CEP format", () => {
    expect(validateCEP("01310-100")).toBe(true);
    expect(validateCEP("01310100")).toBe(true);
    expect(validateCEP("12345")).toBe(false);
    expect(validateCEP("")).toBe(false);
  });

  it("formats CEP correctly", () => {
    expect(formatCEP("01310100")).toBe("01310-100");
    expect(formatCEP("12345678")).toBe("12345-678");
  });
});
