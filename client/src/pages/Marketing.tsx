import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Instagram, 
  Facebook, 
  Sparkles, 
  Copy, 
  Check, 
  Image as ImageIcon,
  Loader2,
  Share2,
  Link2,
  AlertCircle,
  RefreshCw,
  Eye,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";

// Formatar preço em BRL
function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "Sob consulta";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

export default function Marketing() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"instagram" | "facebook">("instagram");

  // Buscar imóveis do corretor
  const { data: properties, isLoading: propertiesLoading } = trpc.properties.list.useQuery({
    limit: 100,
  });

  // Mutation para gerar descrição com IA
  const generateDescription = trpc.marketing.generateSocialPost.useMutation({
    onSuccess: (data) => {
      setGeneratedText(data.text);
      toast.success("Descrição gerada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar descrição: " + error.message);
    },
  });

  const selectedProperty = properties?.find(
    (p: any) => p.id.toString() === selectedPropertyId
  );

  const handleGenerateDescription = async () => {
    if (!selectedPropertyId) {
      toast.error("Selecione um imóvel primeiro");
      return;
    }

    setIsGenerating(true);
    try {
      await generateDescription.mutateAsync({
        propertyId: parseInt(selectedPropertyId),
        platform: selectedPlatform,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = async () => {
    if (!generatedText) return;
    
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      toast.success("Texto copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar texto");
    }
  };

  const handleShareInstagram = () => {
    // Instagram não tem API de compartilhamento direto, abre o app
    toast.info("Copie o texto e cole no Instagram. Abrindo o app...");
    handleCopyText();
    // Tenta abrir o app do Instagram
    window.open("instagram://", "_blank");
  };

  const handleShareFacebook = () => {
    if (!selectedProperty) return;
    
    const url = `${window.location.origin}/site/${selectedProperty.companyId}/imovel/${selectedProperty.id}`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(generatedText)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Marketing</h1>
              <p className="text-sm text-muted-foreground">
                Crie anúncios persuasivos para suas redes sociais
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="criar" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="criar" className="text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Criar Anúncio
            </TabsTrigger>
            <TabsTrigger value="conexoes" className="text-xs sm:text-sm">
              <Link2 className="w-4 h-4 mr-1.5" />
              Conexões
            </TabsTrigger>
          </TabsList>

          {/* Tab: Criar Anúncio */}
          <TabsContent value="criar" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Coluna 1: Seleção e Geração */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Gerador de Descrição com IA
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Selecione um imóvel e gere um texto persuasivo para redes sociais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seleção de Imóvel */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selecione o Imóvel</label>
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um imóvel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {propertiesLoading ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Carregando imóveis...
                          </div>
                        ) : !properties || properties.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhum imóvel cadastrado
                          </div>
                        ) : (
                          properties.map((property: any) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{property.referenceCode}</span>
                                <span className="text-muted-foreground">-</span>
                                <span className="truncate max-w-[200px]">{property.title}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preview do Imóvel Selecionado */}
                  {selectedProperty && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-start gap-3">
                        {selectedProperty.mainImageUrl ? (
                          <img 
                            src={selectedProperty.mainImageUrl} 
                            alt={selectedProperty.title}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{selectedProperty.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedProperty.neighborhood}, {selectedProperty.city}
                          </p>
                          <p className="text-sm font-bold text-primary mt-1">
                            {formatPrice(selectedProperty.price)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedProperty.bedrooms && (
                              <Badge variant="secondary" className="text-[10px]">
                                {selectedProperty.bedrooms} quartos
                              </Badge>
                            )}
                            {selectedProperty.suites && (
                              <Badge variant="secondary" className="text-[10px]">
                                {selectedProperty.suites} suítes
                              </Badge>
                            )}
                            {selectedProperty.parkingSpaces && (
                              <Badge variant="secondary" className="text-[10px]">
                                {selectedProperty.parkingSpaces} vagas
                              </Badge>
                            )}
                            {selectedProperty.area && (
                              <Badge variant="secondary" className="text-[10px]">
                                {selectedProperty.area}m²
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seleção de Plataforma */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Plataforma</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={selectedPlatform === "instagram" ? "default" : "outline"}
                        className={cn(
                          "flex-1",
                          selectedPlatform === "instagram" && "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        )}
                        onClick={() => setSelectedPlatform("instagram")}
                      >
                        <Instagram className="w-4 h-4 mr-2" />
                        Instagram
                      </Button>
                      <Button
                        type="button"
                        variant={selectedPlatform === "facebook" ? "default" : "outline"}
                        className={cn(
                          "flex-1",
                          selectedPlatform === "facebook" && "bg-[#1877F2] hover:bg-[#166FE5]"
                        )}
                        onClick={() => setSelectedPlatform("facebook")}
                      >
                        <Facebook className="w-4 h-4 mr-2" />
                        Facebook
                      </Button>
                    </div>
                  </div>

                  {/* Botão Gerar */}
                  <Button
                    onClick={handleGenerateDescription}
                    disabled={!selectedPropertyId || isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Descrição com IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Coluna 2: Resultado */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-primary" />
                      Texto Gerado
                    </span>
                    {generatedText && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleGenerateDescription}
                          disabled={isGenerating}
                          title="Gerar novamente"
                        >
                          <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopyText}
                          title="Copiar texto"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={generatedText}
                    onChange={(e) => setGeneratedText(e.target.value)}
                    placeholder="O texto gerado aparecerá aqui. Você pode editá-lo antes de publicar."
                    className="min-h-[200px] resize-none text-sm"
                  />

                  {generatedText && (
                    <div className="space-y-3">
                      {/* Preview */}
                      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Preview do Post</DialogTitle>
                            <DialogDescription>
                              Assim ficará seu anúncio no {selectedPlatform === "instagram" ? "Instagram" : "Facebook"}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3">
                            {selectedProperty?.mainImageUrl && (
                              <img 
                                src={selectedProperty.mainImageUrl}
                                alt="Preview"
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                            )}
                            <p className="text-sm whitespace-pre-wrap">{generatedText}</p>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Botões de Compartilhamento */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={handleShareInstagram}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          <Instagram className="w-4 h-4 mr-2" />
                          Compartilhar
                        </Button>
                        <Button
                          onClick={handleShareFacebook}
                          className="bg-[#1877F2] hover:bg-[#166FE5]"
                        >
                          <Facebook className="w-4 h-4 mr-2" />
                          Compartilhar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Conexões */}
          <TabsContent value="conexoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Conectar Redes Sociais</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Conecte suas contas para publicar diretamente da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instagram */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Instagram</h4>
                      <p className="text-xs text-muted-foreground">Não conectado</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Em breve
                  </Button>
                </div>

                {/* Facebook */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Facebook</h4>
                      <p className="text-xs text-muted-foreground">Não conectado</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Em breve
                  </Button>
                </div>

                {/* Aviso */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm text-amber-800 dark:text-amber-200">
                        Funcionalidade em desenvolvimento
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        A conexão direta com Instagram e Facebook estará disponível em breve. 
                        Por enquanto, você pode gerar o texto e copiar para publicar manualmente.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
