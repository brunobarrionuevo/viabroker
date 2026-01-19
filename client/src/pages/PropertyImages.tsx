import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Upload, Trash2, Star, GripVertical, Image as ImageIcon, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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
    // Compatibilidade Safari
    WebkitTransform: CSS.Transform.toString(transform),
    WebkitTransition: transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-lg overflow-hidden border-2 touch-manipulation ${
        image.isMain ? "border-yellow-500" : "border-gray-200"
      } ${isDragging ? "z-50 shadow-2xl" : ""}`}
    >
      {/* Imagem */}
      <img
        src={image.url || ''}
        alt={image.caption || `Foto ${index + 1}`}
        className="w-full aspect-square object-cover"
        onClick={() => onPreview(index)}
        draggable={false}
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      />
      
      {/* Barra superior com drag handle e menu */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-1.5 bg-gradient-to-b from-black/60 to-transparent">
        {/* Drag handle - lado esquerdo - Área maior para facilitar toque */}
        <div
          {...attributes}
          {...listeners}
          className="bg-primary text-white p-3 rounded-md cursor-grab active:cursor-grabbing touch-manipulation shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 transition-transform"
          title="Segure e arraste para reordenar"
          style={{ 
            WebkitTouchCallout: 'none',
            touchAction: 'none',
          }}
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Badge de foto principal */}
        {image.isMain && (
          <div className="bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded-md shadow-sm">
            Principal
          </div>
        )}

        {/* Menu de ações - lado direito */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="bg-white/90 text-gray-700 p-2 rounded-md shadow-sm touch-manipulation"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onPreview(index);
              }}
              className="cursor-pointer"
            >
              <ZoomIn className="w-4 h-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onSetMain(image.id);
              }}
              className="cursor-pointer"
              disabled={image.isMain}
            >
              <Star className={`w-4 h-4 mr-2 ${image.isMain ? "fill-yellow-500 text-yellow-500" : ""}`} />
              {image.isMain ? "Foto principal" : "Definir como principal"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id);
              }}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir foto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Número da foto - canto inferior direito */}
      <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
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

  // Touch events para Safari
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown as any);
    // Prevenir scroll do body quando lightbox está aberto
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown as any);
      document.body.style.overflow = '';
    };
  }, [currentIndex, images.length]);

  const currentImage = images[currentIndex];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center touch-manipulation"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent z-10">
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
          className="text-white hover:bg-white/20"
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <img
          src={currentImage.url || ''}
          alt={currentImage.caption || `Foto ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s',
            WebkitTransform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            WebkitTransition: isDragging ? 'none' : '-webkit-transform 0.2s',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
          draggable={false}
        />
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-10 h-10 md:w-12 md:h-12"
          onClick={handlePrevious}
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </Button>
      )}
      {currentIndex < images.length - 1 && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-10 h-10 md:w-12 md:h-12"
          onClick={handleNext}
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
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

      {/* Thumbnails - hidden on very small screens */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 hidden sm:flex gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => {
              onNavigate(idx);
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            className={`w-12 h-12 md:w-16 md:h-16 rounded overflow-hidden flex-shrink-0 border-2 ${
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

  // Sensores otimizados para touch e mouse
  // TouchSensor com delay menor e tolerância maior para facilitar o arrastar
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduzido para ativar mais rápido
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Delay reduzido para 100ms - mais responsivo
        tolerance: 10, // Tolerância maior para movimento durante o delay
      },
    }),
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
    
    if (files.length > remainingSlots) {
      toast.error(`Você pode enviar apenas mais ${remainingSlots} foto(s)`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgress(Math.round(((i + 0.5) / filesToUpload.length) * 100));

        // Comprimir imagem antes do upload
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };

        let fileToUpload = file;
        try {
          fileToUpload = await imageCompression(file, options);
        } catch (compressionError) {
          console.warn("Erro na compressão, usando arquivo original:", compressionError);
        }

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
              <span className="block mb-1"><strong>Para reorganizar:</strong> Segure o botão azul <span className="inline-flex items-center justify-center bg-primary text-white rounded px-1 py-0.5 mx-1"><GripVertical className="w-3 h-3" /></span> por 1 segundo e arraste.</span>
              <span className="block"><strong>Para mais opções:</strong> Toque no menu <MoreVertical className="w-4 h-4 inline" /></span>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
