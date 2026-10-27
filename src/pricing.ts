import type { Product, PriceResult } from "./types";

/**
 * Чистая функция: рассчитывает новую цену для одного товара.
 * Правила — см. README, раздел «Правила расчёта цены».
 * Не меняйте сигнатуру и путь к файлу: решение проверяется автотестами.
 */
export function calculatePrice(product: Product): PriceResult {
  const { sku, myPrice, minPrice, maxPrice, step, competitors } = product;

  // 1. Filter competitors where inStock === true
  const inStockCompetitors = competitors.filter((c) => c.inStock === true);

  // 2. If none → NO_COMPETITORS
  if (inStockCompetitors.length === 0) {
    return { sku, oldPrice: myPrice, newPrice: maxPrice, reason: "NO_COMPETITORS" };
  }

  // 3. Find best (lowest) price among in-stock competitors
  const best = Math.min(...inStockCompetitors.map((c) => c.price));

  // 4. candidate = floor(best - step)
  const candidate = Math.floor(best - step);

  // 5-7. Clamp to [minPrice, maxPrice]
  if (candidate < minPrice) {
    return { sku, oldPrice: myPrice, newPrice: minPrice, reason: "AT_MIN" };
  }
  if (candidate > maxPrice) {
    return { sku, oldPrice: myPrice, newPrice: maxPrice, reason: "AT_MAX" };
  }
  return { sku, oldPrice: myPrice, newPrice: candidate, reason: "UNDERCUT" };
}
