import * as db from "./db";
import { Property, PropertyImage, Company } from "../drizzle/schema";

/**
 * Gerador de XML para integração com portais imobiliários
 * Formatos suportados:
 * - ZAP Imóveis (padrão VivaReal)
 * - OLX
 * - Imovelweb
 */

interface PropertyWithImages {
  property: Property;
  images: PropertyImage[];
  company: Company | null;
}

// Função auxiliar para escapar caracteres especiais em XML
function escapeXml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Função para formatar preço
function formatPrice(price: string | null): string {
  if (!price) return "0";
  // Remove formatação e retorna apenas números
  return price.replace(/[^\d]/g, "") || "0";
}

// Mapeamento de tipos de imóveis para o padrão dos portais
const typeMapping: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  terreno: "Terreno",
  comercial: "Comercial",
  rural: "Rural",
  cobertura: "Cobertura",
  flat: "Flat",
  kitnet: "Kitnet",
  loft: "Loft",
  sobrado: "Sobrado",
};

// Mapeamento de finalidade
const purposeMapping: Record<string, string> = {
  venda: "Sale",
  aluguel: "Rental",
  venda_aluguel: "Sale|Rental",
};

/**
 * Gera XML no formato padrão VivaReal/ZAP
 */
export async function generateVivaRealXML(companyId: number): Promise<string> {
  const properties = await db.getProperties({ companyId, isPublished: true, status: "disponivel" }, 1000, 0);
  const company = await db.getCompanyById(companyId);
  
  if (!company) {
    throw new Error("Empresa não encontrada");
  }

  // Buscar imagens de todos os imóveis
  const propertiesWithImages: PropertyWithImages[] = await Promise.all(
    properties.map(async (property) => ({
      property,
      images: await db.getPropertyImages(property.id),
      company,
    }))
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync http://xml.vivareal.com/vrsync.xsd">
  <Header>
    <Provider>${escapeXml(company.name)}</Provider>
    <Email>${escapeXml(company.email)}</Email>
    <ContactName>${escapeXml(company.name)}</ContactName>
    <Telephone>${escapeXml(company.phone)}</Telephone>
    <PublishDate>${new Date().toISOString()}</PublishDate>
  </Header>
  <Listings>
${propertiesWithImages.map(({ property, images }) => generateVivaRealListing(property, images, company)).join("\n")}
  </Listings>
</ListingDataFeed>`;

  return xml;
}

function generateVivaRealListing(property: Property, images: PropertyImage[], company: Company): string {
  const transactionType = property.purpose === "aluguel" ? "For Rent" : "For Sale";
  const propertyType = typeMapping[property.type] || "Outro";
  
  return `    <Listing>
      <ListingID>${property.id}</ListingID>
      <Title><![CDATA[${property.title}]]></Title>
      <TransactionType>${transactionType}</TransactionType>
      <Featured>${property.isHighlight ? "true" : "false"}</Featured>
      <ListDate>${property.createdAt?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]}</ListDate>
      <LastUpdateDate>${property.updatedAt?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]}</LastUpdateDate>
      <DetailViewUrl>https://seusite.com.br/imovel/${property.id}</DetailViewUrl>
      <Media>
${images.map((img, idx) => `        <Item medium="image" caption="Foto ${idx + 1}">${escapeXml(img.url)}</Item>`).join("\n")}
${property.videoUrl ? `        <Item medium="video">${escapeXml(property.videoUrl)}</Item>` : ""}
      </Media>
      <Details>
        <PropertyType>${propertyType}</PropertyType>
        <Description><![CDATA[${property.description || ""}]]></Description>
        <ListPrice currency="BRL">${formatPrice(property.salePrice)}</ListPrice>
        <RentalPrice currency="BRL" period="Monthly">${formatPrice(property.rentPrice)}</RentalPrice>
        <PropertyAdministrationFee currency="BRL">${formatPrice(property.condoFee)}</PropertyAdministrationFee>
        <YearlyTax currency="BRL">${formatPrice(property.iptuAnnual)}</YearlyTax>
        <LivingArea unit="square metres">${property.builtArea || 0}</LivingArea>
        <LotArea unit="square metres">${property.totalArea || 0}</LotArea>
        <Bedrooms>${property.bedrooms || 0}</Bedrooms>
        <Bathrooms>${property.bathrooms || 0}</Bathrooms>
        <Suites>${property.suites || 0}</Suites>
        <Garage type="Parking Spaces">${property.parkingSpaces || 0}</Garage>
      </Details>
      <Location displayAddress="All">
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="${escapeXml(property.state)}">${escapeXml(property.state)}</State>
        <City>${escapeXml(property.city)}</City>
        <Neighborhood>${escapeXml(property.neighborhood)}</Neighborhood>
        <Address>${escapeXml(property.address)}</Address>
        <StreetNumber>${escapeXml(property.number)}</StreetNumber>
        <Complement>${escapeXml(property.complement)}</Complement>
        <PostalCode>${escapeXml(property.zipCode)}</PostalCode>
        ${property.latitude && property.longitude ? `<Latitude>${property.latitude}</Latitude>
        <Longitude>${property.longitude}</Longitude>` : ""}
      </Location>
      <ContactInfo>
        <Name>${escapeXml(company.name)}</Name>
        <Email>${escapeXml(company.email)}</Email>
        <Telephone>${escapeXml(company.phone)}</Telephone>
        <Website>https://seusite.com.br</Website>
      </ContactInfo>
    </Listing>`;
}

/**
 * Gera XML no formato OLX
 */
export async function generateOLXXML(companyId: number): Promise<string> {
  const properties = await db.getProperties({ companyId, isPublished: true, status: "disponivel" }, 1000, 0);
  const company = await db.getCompanyById(companyId);
  
  if (!company) {
    throw new Error("Empresa não encontrada");
  }

  const propertiesWithImages = await Promise.all(
    properties.map(async (property) => ({
      property,
      images: await db.getPropertyImages(property.id),
    }))
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Ads>
${propertiesWithImages.map(({ property, images }) => generateOLXAd(property, images, company)).join("\n")}
</Ads>`;

  return xml;
}

function generateOLXAd(property: Property, images: PropertyImage[], company: Company): string {
  const category = property.purpose === "aluguel" ? "1020" : "1010"; // Códigos de categoria OLX
  const price = property.purpose === "aluguel" 
    ? formatPrice(property.rentPrice) 
    : formatPrice(property.salePrice);

  return `  <Ad>
    <id>${property.code || property.id}</id>
    <operation>${property.purpose === "aluguel" ? "Alugar" : "Vender"}</operation>
    <category>${category}</category>
    <subject><![CDATA[${property.title}]]></subject>
    <body><![CDATA[${property.description || ""}]]></body>
    <price>${price}</price>
    <zipcode>${escapeXml(property.zipCode)}</zipcode>
    <state>${escapeXml(property.state)}</state>
    <city>${escapeXml(property.city)}</city>
    <neighborhood>${escapeXml(property.neighborhood)}</neighborhood>
    <address>${escapeXml(property.address)}</address>
    <phone>${escapeXml(company.phone)}</phone>
    <type>${typeMapping[property.type] || "Outro"}</type>
    <rooms>${property.bedrooms || 0}</rooms>
    <bathrooms>${property.bathrooms || 0}</bathrooms>
    <garage_spaces>${property.parkingSpaces || 0}</garage_spaces>
    <size>${property.totalArea || 0}</size>
    <condominio>${formatPrice(property.condoFee)}</condominio>
    <iptu>${formatPrice(property.iptuAnnual)}</iptu>
    <images>
${images.slice(0, 20).map((img, idx) => `      <image url="${escapeXml(img.url)}" order="${idx + 1}" />`).join("\n")}
    </images>
  </Ad>`;
}

/**
 * Gera XML genérico simplificado
 */
export async function generateGenericXML(companyId: number): Promise<string> {
  const properties = await db.getProperties({ companyId, isPublished: true, status: "disponivel" }, 1000, 0);
  const company = await db.getCompanyById(companyId);
  
  if (!company) {
    throw new Error("Empresa não encontrada");
  }

  const propertiesWithImages = await Promise.all(
    properties.map(async (property) => ({
      property,
      images: await db.getPropertyImages(property.id),
    }))
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<imoveis>
  <empresa>
    <nome>${escapeXml(company.name)}</nome>
    <email>${escapeXml(company.email)}</email>
    <telefone>${escapeXml(company.phone)}</telefone>
    <whatsapp>${escapeXml(company.whatsapp)}</whatsapp>
  </empresa>
  <lista>
${propertiesWithImages.map(({ property, images }) => generateGenericProperty(property, images)).join("\n")}
  </lista>
</imoveis>`;

  return xml;
}

function generateGenericProperty(property: Property, images: PropertyImage[]): string {
  return `    <imovel>
      <codigo>${property.code || property.id}</codigo>
      <titulo><![CDATA[${property.title}]]></titulo>
      <descricao><![CDATA[${property.description || ""}]]></descricao>
      <tipo>${typeMapping[property.type] || property.type}</tipo>
      <finalidade>${property.purpose}</finalidade>
      <preco_venda>${formatPrice(property.salePrice)}</preco_venda>
      <preco_aluguel>${formatPrice(property.rentPrice)}</preco_aluguel>
      <condominio>${formatPrice(property.condoFee)}</condominio>
      <iptu>${formatPrice(property.iptuAnnual)}</iptu>
      <endereco>
        <logradouro>${escapeXml(property.address)}</logradouro>
        <numero>${escapeXml(property.number)}</numero>
        <complemento>${escapeXml(property.complement)}</complemento>
        <bairro>${escapeXml(property.neighborhood)}</bairro>
        <cidade>${escapeXml(property.city)}</cidade>
        <estado>${escapeXml(property.state)}</estado>
        <cep>${escapeXml(property.zipCode)}</cep>
      </endereco>
      <caracteristicas>
        <area_total>${property.totalArea || 0}</area_total>
        <area_construida>${property.builtArea || 0}</area_construida>
        <quartos>${property.bedrooms || 0}</quartos>
        <suites>${property.suites || 0}</suites>
        <banheiros>${property.bathrooms || 0}</banheiros>
        <vagas>${property.parkingSpaces || 0}</vagas>
      </caracteristicas>
      <destaque>${property.isHighlight ? "sim" : "nao"}</destaque>
      <fotos>
${images.map((img) => `        <foto>${escapeXml(img.url)}</foto>`).join("\n")}
      </fotos>
      ${property.videoUrl ? `<video>${escapeXml(property.videoUrl)}</video>` : ""}
    </imovel>`;
}
