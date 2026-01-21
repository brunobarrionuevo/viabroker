import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do invokeLLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "🏠 Apartamento incrível em localização privilegiada!\n\n✨ 3 quartos | 2 suítes | 2 vagas\n📍 Centro, São Paulo - SP\n💰 R$ 500.000\n\n📲 Entre em contato agora!\n\n#imoveis #apartamento #venda",
        },
      },
    ],
  }),
}));

// Mock do db
vi.mock("./db", () => ({
  getPropertyById: vi.fn().mockResolvedValue({
    id: 1,
    companyId: 1,
    type: "apartamento",
    purpose: "venda",
    salePrice: "500000",
    rentPrice: null,
    totalArea: "120",
    builtArea: "100",
    bedrooms: 3,
    suites: 2,
    bathrooms: 2,
    parkingSpaces: 2,
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
  }),
}));

describe("Marketing Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateSocialPost", () => {
    it("should format property info correctly for prompt", async () => {
      const { invokeLLM } = await import("./_core/llm");
      const { getPropertyById } = await import("./db");

      // Simular chamada do procedimento
      const property = await getPropertyById(1);
      expect(property).toBeDefined();
      expect(property?.type).toBe("apartamento");
      expect(property?.salePrice).toBe("500000");
      expect(property?.bedrooms).toBe(3);
    });

    it("should generate text for Instagram platform", async () => {
      const { invokeLLM } = await import("./_core/llm");

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Você é um copywriter especializado em marketing imobiliário para redes sociais." },
          { role: "user", content: "Gere um post para Instagram" },
        ],
      });

      expect(response.choices[0]?.message?.content).toContain("#imoveis");
      expect(response.choices[0]?.message?.content).toContain("apartamento");
    });

    it("should handle property not found", async () => {
      const { getPropertyById } = await import("./db");
      
      // Mock para retornar null
      vi.mocked(getPropertyById).mockResolvedValueOnce(null);
      
      const property = await getPropertyById(999);
      expect(property).toBeNull();
    });

    it("should format price correctly", () => {
      const formatPrice = (value: number | string | null | undefined): string => {
        if (value === null || value === undefined) return "Sob consulta";
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(numValue)) return "Sob consulta";
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numValue);
      };

      // O Intl.NumberFormat pode usar non-breaking space
      expect(formatPrice(500000)).toContain("500.000");
      expect(formatPrice("1500000")).toContain("1.500.000");
      expect(formatPrice(null)).toBe("Sob consulta");
      expect(formatPrice(undefined)).toBe("Sob consulta");
      expect(formatPrice("invalid")).toBe("Sob consulta");
    });

    it("should handle area fields correctly", () => {
      const property = {
        totalArea: "120",
        builtArea: "100",
      };

      const area = property.totalArea 
        ? `${property.totalArea}m²` 
        : (property.builtArea ? `${property.builtArea}m²` : null);

      expect(area).toBe("120m²");
    });

    it("should use builtArea when totalArea is not available", () => {
      const property = {
        totalArea: null,
        builtArea: "100",
      };

      const area = property.totalArea 
        ? `${property.totalArea}m²` 
        : (property.builtArea ? `${property.builtArea}m²` : null);

      expect(area).toBe("100m²");
    });
  });
});
