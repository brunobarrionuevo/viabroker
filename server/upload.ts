import { Router, Request, Response } from "express";
import { nanoid } from "nanoid";
import multer, { FileFilterCallback } from "multer";
import * as db from "./db";

// Configurar multer para armazenar em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por imagem (reduzido para banco de dados)
    files: 20,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

export const uploadRouter = Router();

// Interface para request com arquivo
interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Rota de upload de arquivo único - salva no banco de dados como Base64
uploadRouter.post("/upload", upload.single("file"), async (req: MulterRequest, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Converter para Base64
    const base64Data = file.buffer.toString("base64");
    const key = `img_${nanoid()}`;
    
    // Retornar dados para serem salvos no banco pelo frontend
    // A URL será gerada dinamicamente quando a imagem for requisitada
    const url = `/api/images/${key}`;
    
    console.log(`[Upload] Imagem processada: ${key}, tamanho: ${file.buffer.length} bytes, tipo: ${file.mimetype}`);

    return res.json({ 
      url, 
      key,
      imageData: base64Data,
      mimeType: file.mimetype
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno no upload";
    return res.status(500).json({ error: errorMessage });
  }
});

// Rota de upload de logo do site
uploadRouter.post("/upload/site/logo", upload.single("file"), async (req: MulterRequest, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const base64Data = file.buffer.toString("base64");
    const key = `logo_${nanoid()}`;
    const url = `/api/images/${key}`;

    return res.json({ 
      url, 
      key,
      imageData: base64Data,
      mimeType: file.mimetype
    });
  } catch (error) {
    console.error("Erro no upload do logo:", error);
    return res.status(500).json({ error: "Erro interno no upload" });
  }
});

// Rota de upload de favicon do site
uploadRouter.post("/upload/site/favicon", upload.single("file"), async (req: MulterRequest, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const base64Data = file.buffer.toString("base64");
    const key = `favicon_${nanoid()}`;
    const url = `/api/images/${key}`;

    return res.json({ 
      url, 
      key,
      imageData: base64Data,
      mimeType: file.mimetype
    });
  } catch (error) {
    console.error("Erro no upload do favicon:", error);
    return res.status(500).json({ error: "Erro interno no upload" });
  }
});

// Rota de upload de imagem de capa (hero) do site
uploadRouter.post("/upload/site/hero", upload.single("file"), async (req: MulterRequest, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const base64Data = file.buffer.toString("base64");
    const key = `hero_${nanoid()}`;
    const url = `/api/images/${key}`;

    return res.json({ 
      url, 
      key,
      imageData: base64Data,
      mimeType: file.mimetype
    });
  } catch (error) {
    console.error("Erro no upload da imagem de capa:", error);
    return res.status(500).json({ error: "Erro interno no upload" });
  }
});

// Rota de upload de múltiplos arquivos
uploadRouter.post("/upload/multiple", upload.array("files", 20), async (req: MulterRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const results = [];

    for (const file of files) {
      const base64Data = file.buffer.toString("base64");
      const key = `img_${nanoid()}`;
      const url = `/api/images/${key}`;
      
      results.push({ 
        url, 
        key, 
        originalName: file.originalname,
        imageData: base64Data,
        mimeType: file.mimetype
      });
    }

    return res.json({ files: results });
  } catch (error) {
    console.error("Erro no upload:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno no upload";
    return res.status(500).json({ error: errorMessage });
  }
});


// Rota para servir imagens do banco de dados
uploadRouter.get("/images/:id", async (req: Request, res: Response) => {
  try {
    const imageId = parseInt(req.params.id, 10);
    
    if (isNaN(imageId)) {
      return res.status(400).json({ error: "ID de imagem inválido" });
    }

    const image = await db.getPropertyImageById(imageId);
    
    if (!image) {
      return res.status(404).json({ error: "Imagem não encontrada" });
    }

    // Se a imagem tem dados Base64, servir diretamente
    if (image.imageData && image.mimeType) {
      const buffer = Buffer.from(image.imageData, "base64");
      res.setHeader("Content-Type", image.mimeType);
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache por 1 ano
      return res.send(buffer);
    }

    // Se não tem dados Base64, redirecionar para URL externa (fallback)
    if (image.url) {
      return res.redirect(image.url);
    }

    return res.status(404).json({ error: "Dados da imagem não encontrados" });
  } catch (error) {
    console.error("Erro ao servir imagem:", error);
    return res.status(500).json({ error: "Erro interno ao carregar imagem" });
  }
});

// Rota para servir imagens pelo fileKey
uploadRouter.get("/images/key/:key", async (req: Request, res: Response) => {
  try {
    const fileKey = req.params.key;
    
    if (!fileKey) {
      return res.status(400).json({ error: "Chave de imagem inválida" });
    }

    const image = await db.getPropertyImageByKey(fileKey);
    
    if (!image) {
      return res.status(404).json({ error: "Imagem não encontrada" });
    }

    // Se a imagem tem dados Base64, servir diretamente
    if (image.imageData && image.mimeType) {
      const buffer = Buffer.from(image.imageData, "base64");
      res.setHeader("Content-Type", image.mimeType);
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache por 1 ano
      return res.send(buffer);
    }

    // Se não tem dados Base64, redirecionar para URL externa (fallback)
    if (image.url) {
      return res.redirect(image.url);
    }

    return res.status(404).json({ error: "Dados da imagem não encontrados" });
  } catch (error) {
    console.error("Erro ao servir imagem:", error);
    return res.status(500).json({ error: "Erro interno ao carregar imagem" });
  }
});
