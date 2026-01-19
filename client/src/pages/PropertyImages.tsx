import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Upload, Trash2, Star, GripVertical, Image as ImageIcon, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const MAX_IMAGES = 20;

interface PropertyImage {
  id: number;
  propertyId: number;
  url: string | null;
  fileKey: string | null;
  imageData: string | null;
  mimeType: string | null;
  caption: string | null;
  order: number;
  isMain: boolean;
  createdAt: Date;
}

interface SortableImageProps {
  image: PropertyImage;
  index: number;
  onDelete: (id: number) => void;
  onSetMain: (id: number) => void;
  onPreview: (index: number) => void;
  totalImages: number;
}

function SortableImage({ image, index, onDelete, onSetMain, onPreview, totalImages }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg overflow-hidden border-2 ${
        image.isMain ? "border-yellow-500" : "border-transparent"
      }`}
    >
      <img
        src={image.url || ''}
        alt={image.caption || `Foto ${index + 1}`}
        className="w-full aspect-square object-cover cursor-pointer"
        onClick={() => onPreview(index)}
      />
      
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-black/70 text-white p-1.5 rounded cursor-move z-20"
        title="Arrastar para reordenar"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Overlay com ações */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
        <Button
          size="icon"
          variant={image.isMain ? "default" : "secondary"}
          className={`pointer-events-auto ${image.isMain ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
          onClick={() => onSetMain(image.id)}
          title={image.isMain ? "Foto principal" : "Definir como principal"}
        >
          <Star className={`w-4 h-4 ${image.isMain ? "fill-current" : ""}`} />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="pointer-events-auto"
          onClick={() => onPreview(index)}
          title="Visualizar"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="pointer-events-auto"
          onClick={() => onDelete(image.id)}
          title="Remover foto"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Badge de foto principal */}
      {image.isMain && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
          Principal
        </div>
      )}

      {/* Número da foto */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        {index + 1}/{totalImages}
      </div>
    </div>
  );
}

interface LightboxProps {
  images: PropertyImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1));
    if (zoom <= 1.5) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [currentIndex, images.length]);

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          <p className="text-sm font-medium">
            Foto {currentIndex + 1} de {images.length}
          </p>
          {currentImage.caption && (
            <p className="text-xs text-white/70">{currentImage.caption}</p>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20 relative z-10"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Image */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={currentImage.url || ''}
          alt={currentImage.caption || `Foto ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s',
          }}
          draggable={false}
        />
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
          onClick={handlePrevious}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}
      {currentIndex < images.length - 1 && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
          onClick={handleNext}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-lg p-2">
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={handleZoomOut}
          disabled={zoom <= 1}
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
        <span className="text-white text-sm min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
      </div>

      {/* Thumbnails */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => {
              onNavigate(idx);
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            className={`w-16 h-16 rounded overflow-hidden flex-shrink-0 border-2 ${
              idx === currentIndex ? 'border-white' : 'border-transparent'
            } hover:border-white/50 transition-colors`}
          >
            <img
              src={img.url || ''}
              alt={`Miniatura ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PropertyImages() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: property, isLoading: loadingProperty } = trpc.properties.get.useQuery(
    { id: propertyId },
    { enabled: !!propertyId }
  );

  const { data: images, isLoading: loadingImages, refetch: refetchImages } = trpc.properties.getImages.useQuery(
    { propertyId },
    { enabled: !!propertyId }
  );

  const [localImages, setLocalImages] = useState<PropertyImage[]>([]);

  // Sincronizar imagens locais com dados do servidor
  useEffect(() => {
    if (images) {
      setLocalImages([...images].sort((a, b) => a.order - b.order));
    }
  }, [images]);

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

  const reorderImagesMutation = trpc.properties.reorderImages.useMutation({
    onSuccess: () => {
      refetchImages();
      toast.success("Ordem das fotos atualizada!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao reordenar fotos");
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localImages.findIndex((img) => img.id === active.id);
      const newIndex = localImages.findIndex((img) => img.id === over.id);

      const newOrder = arrayMove(localImages, oldIndex, newIndex);
      setLocalImages(newOrder);

      // Atualizar ordem no servidor
      const imageOrders = newOrder.map((img, index) => ({
        id: img.id,
        order: index,
      }));

      reorderImagesMutation.mutate({
        propertyId,
        imageOrders,
      });
    }
  };

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

        // Comprimir imagem antes do upload com melhor qualidade
        let fileToUpload = file;
        try {
          const options = {
            maxSizeMB: 2, // Aumentado para 2MB para manter melhor qualidade
            maxWidthOrHeight: 2560, // Aumentado para 2560px para imagens de alta resolução
            useWebWorker: true,
            initialQuality: 0.85, // Qualidade inicial de 85% (padrão era 75%)
            alwaysKeepResolution: false,
            fileType: 'image/jpeg',
          };
          fileToUpload = await imageCompression(file, options);
          console.log(`Imagem comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
        } catch (error) {
          console.error("Erro ao comprimir imagem:", error);
          // Se falhar a compressão, usa o arquivo original
        }

        // Fazer upload para S3
        const formData = new FormData();
        formData.append("file", fileToUpload);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(errorData.error || "Erro no upload");
        }

        const { url, key, imageData, mimeType } = await response.json();

        // Salvar imagem no banco de dados
        await addImageMutation.mutateAsync({
          propertyId,
          url,
          fileKey: key,
          imageData, // Base64 da imagem
          mimeType, // Tipo MIME
          order: currentCount + i,
          isMain: currentCount === 0 && i === 0, // Primeira imagem é a principal
        });
      }

      toast.success(`${filesToUpload.length} imagem(ns) enviada(s) com sucesso!`);
    } catch (error) {
      console.error("Erro no upload:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao enviar imagens";
      toast.error(errorMessage);
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
              {imageCount} de {MAX_IMAGES} fotos utilizadas. <br />
              <strong>Formato recomendado:</strong> JPG ou PNG em alta resolução (1920x1080px ou superior). <br />
              <strong>Dica:</strong> Use fotos bem iluminadas, horizontais e que destaquem os melhores ângulos do imóvel. <br />
              As imagens serão automaticamente otimizadas mantendo alta qualidade.
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
              Arraste as fotos para reorganizar a ordem. Clique na estrela para definir a foto principal. Clique na foto para visualizar em tela cheia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingImages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : localImages && localImages.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localImages.map(img => img.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {localImages.map((image, index) => (
                      <SortableImage
                        key={image.id}
                        image={image}
                        index={index}
                        onDelete={handleDeleteImage}
                        onSetMain={handleSetMainImage}
                        onPreview={(idx) => setLightboxIndex(idx)}
                        totalImages={localImages.length}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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

      {/* Lightbox */}
      {lightboxIndex !== null && localImages && (
        <Lightbox
          images={localImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </AppLayout>
  );
}
