/**
 * Vercel Serverless Function entry point.
 *
 * Vercel's @vercel/node runtime bundles this file with esbuild and serves
 * the exported Express app as a serverless handler. All /api/* requests are
 * rewritten here via vercel.json rewrites.
 *
 * The Express app is defined in artifacts/api-server/src/app.ts and uses
 * workspace packages (@workspace/db, @workspace/api-zod) which pnpm links
 * into node_modules so esbuild can resolve and bundle them at deploy time.
 */
import app from "../artifacts/api-server/src/app";

export default app;
