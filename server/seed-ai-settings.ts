import { getDb } from "./db";
import { aiSettings } from "../drizzle/schema";

const DEFAULT_DESCRIPTION_PROMPT = `Crie uma descrição imobiliária profissional e persuasiva para o seguinte imóvel:

{propertyInfo}

Diretrizes para a descrição:
1. Escreva 2-3 parágrafos fluidos e bem conectados
2. Comece destacando o principal diferencial do imóvel
3. Descreva a localização e suas vantagens (comércio, transporte, segurança)
4. Destaque os ambientes e suas características (iluminação, ventilação, acabamento)
5. Mencione os diferenciais e comodidades de forma natural
6. Use linguagem persuasiva mas honesta, sem exageros
7. Transmita exclusividade e qualidade
8. Finalize com um convite à visita
9. Não use emojis
10. Não invente informações que não foram fornecidas

Tom: Profissional, sofisticado e acolhedor`;

const DEFAULT_SYSTEM_PROMPT = "Você é um copywriter especializado em imóveis de alto padrão.";

async function seedAISettings() {
  const db = await getDb();
  try {
    // Verificar se já existe configuração
    const existing = await db.select().from(aiSettings).limit(1);
    
    if (existing.length === 0) {
      // Inserir configuração padrão
      await db.insert(aiSettings).values({
        model: "gpt-4o-mini",
        temperature: "0.7",
        maxTokens: 1000,
        descriptionPrompt: DEFAULT_DESCRIPTION_PROMPT,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
      });
      
      console.log("✅ Configurações padrão de IA criadas com sucesso!");
    } else {
      console.log("ℹ️ Configurações de IA já existem, pulando seed.");
    }
  } catch (error) {
    console.error("❌ Erro ao criar configurações de IA:", error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedAISettings()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedAISettings };
