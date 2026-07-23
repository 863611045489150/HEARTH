import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import router from "./routes";
import { logger } from "./lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

// Request logger — inline so we avoid CJS/ESM interop issues with pino-http
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(
      {
        req: { method: req.method, url: req.url.split("?")[0] },
        res: { statusCode: res.statusCode },
        responseTime: Date.now() - start,
      },
      "request completed",
    );
  });
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// ─── Render single-service deployment ────────────────────────────────────────
// In production the Vite frontend is built first, then Express serves it as
// static files so everything runs on one URL (no separate frontend host needed).
//
// Directory layout after build:
//   {repo}/artifacts/hearth/dist/public  ← Vite output
//   {repo}/artifacts/api-server/dist/    ← esbuild output (this file lives here)
//
// __dirname resolves to the dist/ folder at runtime so we go up three levels.
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(__dirname, "../../../artifacts/hearth/dist/public");

  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));

    // SPA fallback — any non-/api path returns index.html so client-side routing works
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });

    logger.info({ frontendDist }, "Serving frontend static files");
  } else {
    logger.warn({ frontendDist }, "Frontend dist not found — API-only mode");
  }
}

export default app;
