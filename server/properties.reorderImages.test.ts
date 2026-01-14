import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("properties.reorderImages", () => {
  let testCompanyId: number;
  let testUserId: number;
  let testPropertyId: number;
  let testImageIds: number[] = [];

  beforeAll(async () => {
    // Criar empresa de teste
    const company = await db.createCompany({
      name: "Test Realty Reorder",
      slug: `test-reorder-${Date.now()}`,
      email: "test-reorder@example.com",
      phone: "11999999999",
    });
    testCompanyId = company.id;

    // Criar usuário de teste
    const user = await db.createUser({
      openId: `test-reorder-${Date.now()}`,
      name: "Test User Reorder",
      email: "test-reorder@example.com",
      companyId: testCompanyId,
      role: "admin",
    });
    testUserId = user.id;

    // Criar imóvel de teste
    const property = await db.createProperty({
      title: "Test Property for Reorder",
      type: "apartamento",
      purpose: "venda",
      city: "São Paulo",
      state: "SP",
      companyId: testCompanyId,
      userId: testUserId,
    });
    testPropertyId = property.id;

    // Criar 3 imagens de teste
    for (let i = 0; i < 3; i++) {
      const image = await db.addPropertyImage({
        propertyId: testPropertyId,
        url: `https://example.com/image${i}.jpg`,
        fileKey: `test-key-${i}`,
        order: i,
        isMain: i === 0,
      });
      testImageIds.push(image.id);
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    // Nota: cleanup manual não é necessário para testes isolados
  });

  it("deve reordenar imagens com sucesso", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: `test-reorder-${Date.now()}`,
        name: "Test User Reorder",
        email: "test-reorder@example.com",
        companyId: testCompanyId,
        role: "admin",
      },
      req: {} as any,
      res: {} as any,
    });

    // Reordenar: inverter ordem das 3 imagens
    const result = await caller.properties.reorderImages({
      propertyId: testPropertyId,
      imageOrders: [
        { id: testImageIds[2], order: 0 }, // última vira primeira
        { id: testImageIds[1], order: 1 }, // meio fica no meio
        { id: testImageIds[0], order: 2 }, // primeira vira última
      ],
    });

    expect(result.success).toBe(true);

    // Verificar se a ordem foi atualizada
    const images = await db.getPropertyImages(testPropertyId);
    const sortedImages = images.sort((a, b) => a.order - b.order);

    expect(sortedImages[0].id).toBe(testImageIds[2]);
    expect(sortedImages[1].id).toBe(testImageIds[1]);
    expect(sortedImages[2].id).toBe(testImageIds[0]);
  });

  it("deve rejeitar reordenação de imóvel de outra empresa", async () => {
    // Criar outra empresa
    const otherCompany = await db.createCompany({
      name: "Other Company",
      slug: `other-reorder-${Date.now()}`,
      email: "other-reorder@example.com",
      phone: "11888888888",
    });

    const otherUser = await db.createUser({
      openId: `other-reorder-${Date.now()}`,
      name: "Other User",
      email: "other-reorder@example.com",
      companyId: otherCompany.id,
      role: "admin",
    });

    const caller = appRouter.createCaller({
      user: {
        id: otherUser.id,
        openId: `other-reorder-${Date.now()}`,
        name: "Other User",
        email: "other-reorder@example.com",
        companyId: otherCompany.id,
        role: "admin",
      },
      req: {} as any,
      res: {} as any,
    });

    // Tentar reordenar imagens do imóvel de outra empresa
    await expect(
      caller.properties.reorderImages({
        propertyId: testPropertyId,
        imageOrders: [
          { id: testImageIds[0], order: 1 },
          { id: testImageIds[1], order: 0 },
        ],
      })
    ).rejects.toThrow("Imóvel não encontrado");

    // Limpar
    // Nota: cleanup manual não é necessário para testes isolados
  });
});
