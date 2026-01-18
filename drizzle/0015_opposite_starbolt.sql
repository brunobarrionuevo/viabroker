CREATE TABLE `ai_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model` varchar(50) NOT NULL DEFAULT 'gpt-4o-mini',
	`temperature` decimal(3,2) DEFAULT '0.7',
	`maxTokens` int DEFAULT 1000,
	`descriptionPrompt` text NOT NULL DEFAULT ('Crie uma descrição imobiliária profissional e persuasiva para o seguinte imóvel:

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

Tom: Profissional, sofisticado e acolhedor'),
	`systemPrompt` text NOT NULL DEFAULT ('Você é um copywriter especializado em imóveis de alto padrão.'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_settings_id` PRIMARY KEY(`id`)
);
