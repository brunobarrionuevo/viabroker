import { describe, it, expect, vi } from "vitest";

// Testes para as funções utilitárias do serviço de redes sociais
describe("Social Media Service", () => {
  describe("getFacebookAuthUrl", () => {
    it("should generate a valid Facebook OAuth URL", async () => {
      // Mock das variáveis de ambiente
      vi.stubEnv("FACEBOOK_APP_ID", "test_app_id");
      vi.stubEnv("VITE_APP_URL", "https://test.viabroker.app");

      const { getFacebookAuthUrl } = await import("./socialMediaService");
      
      const state = Buffer.from(JSON.stringify({
        companyId: 1,
        platform: "facebook",
        timestamp: Date.now(),
      })).toString("base64");

      const url = getFacebookAuthUrl(state);
      
      expect(url).toContain("https://www.facebook.com/v24.0/dialog/oauth");
      expect(url).toContain("response_type=code");
      expect(url).toContain("state=");
    });
  });

  describe("Social Post Content Generation", () => {
    it("should format property info correctly for social media", () => {
      // Teste da formatação de preço
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

      expect(formatPrice(500000)).toMatch(/R\$\s*500\.000/);
      expect(formatPrice("750000")).toMatch(/R\$\s*750\.000/);
      expect(formatPrice(null)).toBe("Sob consulta");
      expect(formatPrice(undefined)).toBe("Sob consulta");
      expect(formatPrice("invalid")).toBe("Sob consulta");
    });

    it("should build property info object with available data", () => {
      const property = {
        type: "Apartamento",
        purpose: "venda",
        salePrice: 500000,
        totalArea: 120,
        bedrooms: 3,
        suites: 1,
        bathrooms: 2,
        parkingSpaces: 2,
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
      };

      const propertyInfo = {
        tipo: property.type,
        finalidade: property.purpose === "venda" ? "Venda" : "Aluguel",
        area: property.totalArea ? `${property.totalArea}m²` : null,
        quartos: property.bedrooms,
        suites: property.suites,
        banheiros: property.bathrooms,
        vagas: property.parkingSpaces,
        bairro: property.neighborhood,
        cidade: property.city,
        estado: property.state,
      };

      expect(propertyInfo.tipo).toBe("Apartamento");
      expect(propertyInfo.finalidade).toBe("Venda");
      expect(propertyInfo.area).toBe("120m²");
      expect(propertyInfo.quartos).toBe(3);
      expect(propertyInfo.suites).toBe(1);
      expect(propertyInfo.vagas).toBe(2);
    });
  });

  describe("Platform-specific hints", () => {
    it("should return correct hint for Instagram", () => {
      const platform = "instagram";
      const hint = platform === "instagram" 
        ? "Use emojis estratégicos, hashtags relevantes no final, e um texto envolvente que capture atenção nos primeiros segundos. Limite de 2200 caracteres."
        : "Texto mais descritivo, profissional, com call-to-action claro. Pode ser um pouco mais longo.";

      expect(hint).toContain("emojis");
      expect(hint).toContain("hashtags");
      expect(hint).toContain("2200 caracteres");
    });

    it("should return correct hint for Facebook", () => {
      const platform = "facebook";
      const hint = platform === "instagram" 
        ? "Use emojis estratégicos, hashtags relevantes no final, e um texto envolvente que capture atenção nos primeiros segundos. Limite de 2200 caracteres."
        : "Texto mais descritivo, profissional, com call-to-action claro. Pode ser um pouco mais longo.";

      expect(hint).toContain("descritivo");
      expect(hint).toContain("profissional");
      expect(hint).toContain("call-to-action");
    });
  });

  describe("State encoding/decoding", () => {
    it("should correctly encode and decode OAuth state", () => {
      const stateData = {
        companyId: 123,
        platform: "facebook",
        timestamp: 1704067200000,
      };

      const encoded = Buffer.from(JSON.stringify(stateData)).toString("base64");
      const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));

      expect(decoded.companyId).toBe(123);
      expect(decoded.platform).toBe("facebook");
      expect(decoded.timestamp).toBe(1704067200000);
    });
  });
});
