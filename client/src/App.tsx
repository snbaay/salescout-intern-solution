import { useState } from "react";
import "./App.css";

// ─── Types (mirrored from src/types.ts) ─────────────────────────────────────

interface Competitor {
  seller: string;
  price: number;
  inStock: boolean;
}

interface Product {
  sku: string;
  name: string;
  myPrice: number;
  minPrice: number;
  maxPrice: number;
  step: number;
  competitors: Competitor[];
}

type Reason = "UNDERCUT" | "AT_MIN" | "AT_MAX" | "NO_COMPETITORS";

interface PriceResult {
  sku: string;
  oldPrice: number;
  newPrice: number;
  reason: Reason;
}

// ─── Product data (from data/products.json) ──────────────────────────────────

const PRODUCTS: Product[] = [
  {
    sku: "IPH15-128-BLK",
    name: "Apple iPhone 15 128Gb черный",
    myPrice: 389990,
    minPrice: 370000,
    maxPrice: 420000,
    step: 10,
    competitors: [
      { seller: "TechnoMarket", price: 384990, inStock: true },
      { seller: "GadgetKZ", price: 379990, inStock: false },
      { seller: "AlmatyPhone", price: 386500, inStock: true },
    ],
  },
  {
    sku: "SAM-A55-256",
    name: "Samsung Galaxy A55 256Gb",
    myPrice: 189000,
    minPrice: 180000,
    maxPrice: 210000,
    step: 100,
    competitors: [{ seller: "MobiStore", price: 175000, inStock: true }],
  },
  {
    sku: "XIA-RN13-128",
    name: "Xiaomi Redmi Note 13 128Gb",
    myPrice: 89990,
    minPrice: 80000,
    maxPrice: 99990,
    step: 50,
    competitors: [{ seller: "Shop1", price: 85000, inStock: false }],
  },
  {
    sku: "AIRPODS-PRO2",
    name: "Apple AirPods Pro 2",
    myPrice: 119990,
    minPrice: 100000,
    maxPrice: 125000,
    step: 1,
    competitors: [{ seller: "EarShop", price: 150000, inStock: true }],
  },
  {
    sku: "DYSON-V15",
    name: "Dyson V15 Detect",
    myPrice: 359000,
    minPrice: 330000,
    maxPrice: 380000,
    step: 0.5,
    competitors: [{ seller: "HomeTech", price: 349999.9, inStock: true }],
  },
  {
    sku: "JBL-FLIP6",
    name: "JBL Flip 6",
    myPrice: 54990,
    minPrice: 45000,
    maxPrice: 60000,
    step: 10,
    competitors: [],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<Reason, string> = {
  UNDERCUT: "Undercut",
  AT_MIN: "At Minimum",
  AT_MAX: "At Maximum",
  NO_COMPETITORS: "No Competitors",
};

const REASON_COLORS: Record<Reason, string> = {
  UNDERCUT: "#d4edda",      // green
  AT_MIN: "#f8d7da",        // red
  AT_MAX: "#fff3cd",        // orange/yellow
  NO_COMPETITORS: "#e2e3e5", // gray
};

const REASON_TEXT_COLORS: Record<Reason, string> = {
  UNDERCUT: "#155724",
  AT_MIN: "#721c24",
  AT_MAX: "#856404",
  NO_COMPETITORS: "#383d41",
};

function formatPrice(price: number): string {
  return price.toLocaleString("ru-RU") + " ₸";
}

function PriceChange({ oldPrice, newPrice }: { oldPrice: number; newPrice: number }) {
  const diff = newPrice - oldPrice;
  if (diff === 0) return <span style={{ color: "#555" }}>{formatPrice(newPrice)}</span>;
  const arrow = diff < 0 ? "▼" : "▲";
  const color = diff < 0 ? "#155724" : "#856404";
  return (
    <span>
      <strong style={{ color }}>{formatPrice(newPrice)}</strong>
      <span style={{ color, fontSize: "0.8em", marginLeft: 4 }}>
        {arrow} {Math.abs(diff).toLocaleString("ru-RU")} ₸
      </span>
    </span>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "success" | "error";

export default function App() {
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<PriceResult[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  async function runRepricing() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const response = await fetch("http://localhost:3001/reprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(PRODUCTS),
      });
      if (!response.ok) {
        const err: unknown = await response.json();
        throw new Error(
          typeof err === "object" && err !== null && "error" in err
            ? String((err as { error: unknown }).error)
            : `HTTP ${response.status}`
        );
      }
      const data: PriceResult[] = (await response.json()) as PriceResult[];
      setResults(data);
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  // Build a lookup map for product names
  const productMap = new Map<string, Product>(PRODUCTS.map((p) => [p.sku, p]));

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">📊 SaleScout</div>
        <h1>Repricing Engine</h1>
        <p className="subtitle">Automated competitor price analysis &amp; repricing</p>
      </header>

      <main className="app-main">
        <div className="controls">
          <button
            className="reprice-btn"
            onClick={() => void runRepricing()}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <span className="spinner" />
            ) : (
              "▶ Run Repricing"
            )}
          </button>

          {status === "error" && (
            <div className="error-banner">
              ⚠ Error: {errorMsg}
              <br />
              <small>Make sure the server is running: <code>npm run server:dev</code></small>
            </div>
          )}
        </div>

        {status === "success" && results.length > 0 && (
          <div className="table-wrapper">
            <div className="stats-row">
              {(["UNDERCUT", "AT_MIN", "AT_MAX", "NO_COMPETITORS"] as Reason[]).map((r) => {
                const count = results.filter((x) => x.reason === r).length;
                return (
                  <div
                    key={r}
                    className="stat-chip"
                    style={{
                      background: REASON_COLORS[r],
                      color: REASON_TEXT_COLORS[r],
                      border: `1px solid ${REASON_TEXT_COLORS[r]}44`,
                    }}
                  >
                    <span className="stat-count">{count}</span>
                    <span className="stat-label">{REASON_LABELS[r]}</span>
                  </div>
                );
              })}
            </div>

            <table className="reprice-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Название</th>
                  <th className="num">Старая цена</th>
                  <th className="num">Новая цена</th>
                  <th>Причина</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const product = productMap.get(r.sku);
                  return (
                    <tr
                      key={r.sku}
                      style={{ background: REASON_COLORS[r.reason] }}
                    >
                      <td className="sku-cell">
                        <code>{r.sku}</code>
                      </td>
                      <td>{product?.name ?? r.sku}</td>
                      <td className="num" style={{ color: "#555", textDecoration: "line-through" }}>
                        {formatPrice(r.oldPrice)}
                      </td>
                      <td className="num">
                        <PriceChange oldPrice={r.oldPrice} newPrice={r.newPrice} />
                      </td>
                      <td>
                        <span
                          className="reason-badge"
                          style={{
                            background: REASON_TEXT_COLORS[r.reason],
                            color: "#fff",
                          }}
                        >
                          {REASON_LABELS[r.reason]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {status === "idle" && (
          <div className="placeholder">
            <div className="placeholder-icon">🏷️</div>
            <p>Click <strong>Run Repricing</strong> to fetch results from the server.</p>
          </div>
        )}
      </main>
    </div>
  );
}
