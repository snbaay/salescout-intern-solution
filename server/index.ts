import express, { Request, Response } from "express";
import { calculatePrice } from "../src/pricing.js";
import type { Product, PriceResult } from "../src/types.js";

const app = express();
app.use(express.json());

// Allow CORS from Vite dev server
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

// Handle preflight OPTIONS
app.options("/reprice", (_req, res) => {
  res.sendStatus(204);
});

app.post("/reprice", (req: Request, res: Response) => {
  const body = req.body;
  if (!Array.isArray(body)) {
    res.status(400).json({ error: "Body must be an array of products" });
    return;
  }
  const results: PriceResult[] = (body as Product[]).map(calculatePrice);
  res.json(results);
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`SaleScout server running on http://localhost:${PORT}`);
});
