import { Router, Request, Response } from "express";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import multer, { FileFilterCallback } from "multer";

// Configurar multer para armazenar em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
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

// Rota de upload de arquivo único
uploadRouter.post("/upload", upload.single("file"), async (req: MulterRequest, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Gerar nome único para o arquivo
    const extension = file.originalname.split(".").pop() || "jpg";
    const uniqueFilename = `properties/${nanoid()}.${extension}`;

    // Upload para S3
    const { url, key } = await storagePut(uniqueFilename, file.buffer, file.mimetype);

    return res.json({ url, key });
  } catch (error) {
    console.error("Erro no upload:", error);
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
      const extension = file.originalname.split(".").pop() || "jpg";
      const uniqueFilename = `properties/${nanoid()}.${extension}`;
      const { url, key } = await storagePut(uniqueFilename, file.buffer, file.mimetype);
      results.push({ url, key, originalName: file.originalname });
    }

    return res.json({ files: results });
  } catch (error) {
    console.error("Erro no upload:", error);
    return res.status(500).json({ error: "Erro interno no upload" });
  }
});
