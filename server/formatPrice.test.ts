import { describe, it, expect } from "vitest";

// Função de formatação de preço (copiada do frontend para teste)
function formatPriceBR(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function displayPriceBR(value: number): string {
  return `R$ ${formatPriceBR(value)}`;
}

describe("Formatação de Preço Brasileiro", () => {
  it("deve formatar preço simples corretamente", () => {
    expect(formatPriceBR(1000)).toBe("1.000,00");
  });

  it("deve formatar preço com centavos", () => {
    expect(formatPriceBR(1234.56)).toBe("1.234,56");
  });

  it("deve formatar preço grande corretamente", () => {
    expect(formatPriceBR(1500000)).toBe("1.500.000,00");
  });

  it("deve formatar preço muito grande corretamente", () => {
    expect(formatPriceBR(999999999.99)).toBe("999.999.999,99");
  });

  it("deve formatar preço zero", () => {
    expect(formatPriceBR(0)).toBe("0,00");
  });

  it("deve exibir preço com símbolo R$", () => {
    expect(displayPriceBR(1500000)).toBe("R$ 1.500.000,00");
  });

  it("deve exibir preço pequeno com R$", () => {
    expect(displayPriceBR(99.90)).toBe("R$ 99,90");
  });
});
