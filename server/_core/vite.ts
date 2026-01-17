import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      
      // Check if this is a custom domain redirect (url was rewritten by middleware)
      if (req.url.startsWith('/site/') && req.originalUrl === '/') {
        const match = req.url.match(/^\/site\/([^\/]+)/);
        if (match) {
          const slug = match[1];
          console.log(`[Vite] Injecting custom domain redirect for slug: ${slug}`);
          const redirectScript = `<script>window.__CUSTOM_DOMAIN_SLUG__ = "${slug}"; window.__CUSTOM_DOMAIN_REDIRECT__ = "/site/${slug}";</script>`;
          template = template.replace('<head>', `<head>${redirectScript}`);
        }
      }
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  // Inject custom domain info if present
  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    
    // Check if this is a custom domain redirect (url was rewritten by middleware)
    if (req.url.startsWith('/site/') && req.originalUrl === '/') {
      // Extract slug from rewritten URL
      const match = req.url.match(/^\/site\/([^\/]+)/);
      if (match) {
        const slug = match[1];
        console.log(`[ServeStatic] Injecting custom domain redirect for slug: ${slug}`);
        
        // Read index.html and inject redirect script
        let html = fs.readFileSync(indexPath, 'utf-8');
        const redirectScript = `<script>window.__CUSTOM_DOMAIN_SLUG__ = "${slug}"; window.__CUSTOM_DOMAIN_REDIRECT__ = "/site/${slug}";</script>`;
        html = html.replace('<head>', `<head>${redirectScript}`);
        
        return res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      }
    }
    
    res.sendFile(indexPath);
  });
}
