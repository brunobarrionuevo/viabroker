import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Download, FileCode, Globe, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";

export default function Integrations() {
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);

  const vivarealQuery = trpc.xml.vivareal.useQuery(undefined, { enabled: false });
  const olxQuery = trpc.xml.olx.useQuery(undefined, { enabled: false });
  const genericQuery = trpc.xml.generic.useQuery(undefined, { enabled: false });

  const downloadXML = async (format: "vivareal" | "olx" | "generic") => {
    setLoadingFormat(format);
    try {
      let xml: string;
      let filename: string;

      if (format === "vivareal") {
        const result = await vivarealQuery.refetch();
        xml = result.data || "";
        filename = "imoveis-vivareal.xml";
      } else if (format === "olx") {
        const result = await olxQuery.refetch();
        xml = result.data || "";
        filename = "imoveis-olx.xml";
      } else {
        const result = await genericQuery.refetch();
        xml = result.data || "";
        filename = "imoveis-generico.xml";
      }

      // Criar blob e fazer download
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("XML gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar XML. Verifique se você tem imóveis publicados.");
    } finally {
      setLoadingFormat(null);
    }
  };

  const portals = [
    {
      id: "vivareal",
      name: "VivaReal / ZAP Imóveis",
      description: "Formato padrão aceito pelo VivaReal, ZAP Imóveis e outros portais do grupo OLX.",
      icon: "🏠",
      color: "bg-orange-500",
      format: "vivareal" as const,
    },
    {
      id: "olx",
      name: "OLX",
      description: "Formato específico para publicação de imóveis no OLX Brasil.",
      icon: "📦",
      color: "bg-purple-500",
      format: "olx" as const,
    },
    {
      id: "generic",
      name: "XML Genérico",
      description: "Formato simplificado compatível com diversos portais e sistemas de integração.",
      icon: "📄",
      color: "bg-blue-500",
      format: "generic" as const,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Integrações</h1>
          <p className="text-muted-foreground mt-1">
            Exporte seus imóveis para os principais portais imobiliários
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Como funciona a integração?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Baixe o arquivo XML com seus imóveis e faça upload no painel do portal desejado. 
                  Alguns portais permitem configurar uma URL para buscar o XML automaticamente. 
                  Consulte a documentação de cada portal para mais detalhes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portals.map((portal) => (
            <Card key={portal.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 ${portal.color}`} />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${portal.color} flex items-center justify-center text-2xl`}>
                    {portal.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{portal.name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {portal.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => downloadXML(portal.format)}
                  disabled={loadingFormat !== null}
                  className="w-full"
                >
                  {loadingFormat === portal.format ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Baixar XML
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Instruções de Uso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  VivaReal / ZAP Imóveis
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Acesse o painel de anunciante do portal</li>
                  <li>Vá em "Integrações" ou "Importar XML"</li>
                  <li>Faça upload do arquivo XML baixado</li>
                  <li>Aguarde o processamento (pode levar alguns minutos)</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  OLX
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Acesse o OLX Pro (painel profissional)</li>
                  <li>Vá em "Ferramentas" &gt; "Importação de anúncios"</li>
                  <li>Selecione "Importar via XML"</li>
                  <li>Faça upload do arquivo e confirme</li>
                </ol>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Dicas importantes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Apenas imóveis <strong>publicados</strong> e com status <strong>disponível</strong> são incluídos no XML</li>
                <li>• Adicione fotos de qualidade para melhorar a visibilidade nos portais</li>
                <li>• Mantenha os dados dos imóveis sempre atualizados</li>
                <li>• Gere um novo XML sempre que fizer alterações significativas</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
