# Plataforma Imobiliária - TODO

## Fase 1: Estrutura de Banco de Dados
- [x] Tabela de Imobiliárias/Empresas (tenants)
- [x] Tabela de Corretores (usuários do sistema)
- [x] Tabela de Imóveis
- [x] Tabela de Leads/Clientes
- [x] Tabela de Interações (histórico de contatos)
- [x] Tabela de Agendamentos (visitas)
- [ ] Tabela de Planos de Assinatura
- [x] Tabela de Configurações do Site

## Fase 2: Backend - APIs
- [x] CRUD de Imóveis (criar, listar, editar, excluir)
- [x] CRUD de Leads/Clientes
- [x] CRUD de Agendamentos
- [x] API de Busca de Imóveis (filtros avançados)
- [x] API de Dashboard (estatísticas)
- [x] API de Upload de Imagens (S3)
- [x] Geração de Descrições com IA

## Fase 3: Frontend - Painel do Cliente (Dashboard/CRM)
- [x] Layout do Dashboard com sidebar
- [x] Página de Listagem de Imóveis
- [x] Formulário de Cadastro/Edição de Imóvel
- [x] Página de Leads/CRM
- [x] Página de Agendamentos/Calendário
- [x] Dashboard com métricas e gráficos
- [x] Configurações do Site/Perfil

## Fase 4: Frontend - Site Público do Corretor
- [x] Landing Page pública do corretor/imobiliária
- [x] Página de listagem de imóveis (com filtros)
- [x] Página de detalhes do imóvel
- [x] Formulário de contato/lead capture
- [ ] Integração WhatsApp

## Fase 5: Funcionalidades Avançadas
- [x] Integração com portais imobiliários (XML)
- [ ] Geração automática de posts para redes sociais
- [ ] Relatórios avançados
- [ ] Multi-idioma

## Testes
- [x] Testes unitários das APIs (properties, leads, appointments, company, siteSettings)

## Correções Solicitadas
- [x] Cadastro flexível: pessoa física (CPF) ou pessoa jurídica (CNPJ)
- [x] Corrigir bug que impede finalizar o cadastro

## Melhorias Solicitadas (Nova Iteração)
- [x] Validação completa de CPF com algoritmo de dígitos verificadores
- [x] Validação completa de CNPJ com algoritmo de dígitos verificadores
- [x] Rejeição de números inválidos conhecidos (sequências repetidas)
- [x] Formatação de moedas para preços (R$ 1.234.567,89)
- [x] Integração com API dos Correios (ViaCEP) para preenchimento automático de endereço
- [x] Armazenar CPF/CNPJ apenas com dígitos no banco de dados

## Correções e Melhorias (Nova Iteração)
- [x] Corrigir erro de inserção de imóveis (valores monetários formatados não aceitos pelo banco)
- [x] Criar tabela de fotos de imóveis (property_images)
- [x] Implementar upload de até 20 fotos por imóvel
- [x] Implementar campo de vídeo do imóvel (URL do YouTube/Vimeo)
- [x] Exibir galeria de fotos na página de detalhes do imóvel

## Galeria Pública de Imóveis
- [x] API pública para buscar imagens do imóvel
- [x] Carrossel de fotos com navegação e miniaturas
- [x] Player de vídeo incorporado (YouTube/Vimeo)
- [x] Exibição responsiva da galeria

## Correções Urgentes
- [x] Botão de incluir fotos não aparece no formulário de cadastro (corrigido - link para gerenciar fotos aparece na edição)
- [x] Erro ao finalizar o cadastro de imóveis (corrigido - valores monetários e videoUrl)

## Página de Exibição do Imóvel
- [x] Redesenhar página pública de detalhes do imóvel
- [x] Galeria de fotos com navegação e zoom
- [x] Player de vídeo incorporado
- [x] Informações detalhadas do imóvel (características, valores, localização)
- [x] Mapa de localização integrado (link para Google Maps)
- [x] Formulário de contato/interesse
- [x] Botão de WhatsApp
- [x] Design responsivo e profissional
## Melhorias de Listagem e Integração

- [x] Exibir foto principal na listagem de imóveis (cards com imagem)
- [x] Integração com portais imobiliários (geração de XML)
- [x] Formato XML compatível com ZAP, Viva Real, OLX
- [x] Endpoint para download do XML
- [x] Página de Integrações no dashboard
