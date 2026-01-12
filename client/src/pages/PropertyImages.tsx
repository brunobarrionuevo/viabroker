import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Upload, Trash2, Star, GripVertical, Image as ImageIcon } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";


const MAX_IMAGES = 20;

export default function PropertyImages() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: property, isLoading: loadingProperty } = trpc.properties.get.useQuery(
    { id: propertyId },
    { enabled: !!propertyId }
  );

  const { data: images, isLoading: loadingImages, refetch: refetchImages } = trpc.properties.getImages.useQuery(
    { propertyId },
    { enabled: !!propertyId }
  );

  const addImageMutation = trpc.properties.addImage.useMutation({
    onSuccess: () => {
      refetchImages();
      toast.success("Imagem adicionada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar imagem");
    },
  });

  const deleteImageMutation = trpc.properties.deleteImage.useMutation({
    onSuccess: () => {
      refetchImages();
      toast.success("Imagem removida!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover imagem");
    },
  });

  const setMainImageMutation = trpc.properties.setMainImage.useMutation({
    onSuccess: () => {
      refetchImages();
      toast.success("Imagem principal definida!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao definir imagem principal");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = images?.length || 0;
    const remainingSlots = MAX_IMAGES - currentCount;
    
    if (remainingSlots <= 0) {
      toast.error(`Limite de ${MAX_IMAGES} fotos atingido`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      toast.warning(`Apenas ${remainingSlots} fotos serão enviadas (limite de ${MAX_IMAGES})`);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));

        // Validar tipo de arquivo
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} não é uma imagem válida`);
          continue;
        }

        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede o limite de 10MB`);
          continue;
        }

        // Fazer upload para S3
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Erro no upload");
        }

        const { url, key } = await response.json();

        // Salvar referência no banco
        await addImageMutation.mutateAsync({
          propertyId,
          url,
          fileKey: key,
          order: currentCount + i,
          isMain: currentCount === 0 && i === 0, // Primeira imagem é a principal
        });
      }

      toast.success(`${filesToUpload.length} imagem(ns) enviada(s) com sucesso!`);
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao enviar imagens");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = (imageId: number) => {
    if (confirm("Tem certeza que deseja remover esta imagem?")) {
      deleteImageMutation.mutate({ id: imageId });
    }
  };

  const handleSetMainImage = (imageId: number) => {
    setMainImageMutation.mutate({ propertyId, imageId });
  };

  if (loadingProperty) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Imóvel não encontrado</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/properties">Voltar</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const imageCount = images?.length || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/properties/${propertyId}/edit`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Fotos do Imóvel</h1>
            <p className="text-muted-foreground">{property.title}</p>
          </div>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Enviar Fotos
            </CardTitle>
            <CardDescription>
              {imageCount} de {MAX_IMAGES} fotos utilizadas. Formatos aceitos: JPG, PNG, WebP (máx. 10MB cada)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  imageCount >= MAX_IMAGES 
                    ? "border-muted bg-muted/50 cursor-not-allowed" 
                    : "border-primary/30 hover:border-primary/50 cursor-pointer"
                }`}
                onClick={() => imageCount < MAX_IMAGES && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading || imageCount >= MAX_IMAGES}
                />
                
                {uploading ? (
                  <div className="space-y-2">
                    <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Enviando... {uploadProgress}%</p>
                    <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : imageCount >= MAX_IMAGES ? (
                  <div className="space-y-2">
                    <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Limite de {MAX_IMAGES} fotos atingido</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar ou arraste as fotos aqui
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Você pode enviar até {MAX_IMAGES - imageCount} foto(s)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Galeria de Fotos</CardTitle>
            <CardDescription>
              Clique na estrela para definir a foto principal. A foto principal aparece em destaque nas listagens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingImages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : images && images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className={`relative group rounded-lg overflow-hidden border-2 ${
                      image.isMain ? "border-yellow-500" : "border-transparent"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.caption || `Foto ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    
                    {/* Overlay com ações */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant={image.isMain ? "default" : "secondary"}
                        className={image.isMain ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        onClick={() => handleSetMainImage(image.id)}
                        title={image.isMain ? "Foto principal" : "Definir como principal"}
                      >
                        <Star className={`w-4 h-4 ${image.isMain ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteImage(image.id)}
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Badge de foto principal */}
                    {image.isMain && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Principal
                      </div>
                    )}

                    {/* Número da foto */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}/{images.length}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma foto adicionada ainda</p>
                <p className="text-sm">Clique acima para enviar as primeiras fotos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/properties/${propertyId}/edit`}>
              Voltar para Edição
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/properties">
              Concluir
            </Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
