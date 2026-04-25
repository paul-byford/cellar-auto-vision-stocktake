// Indicative GBP retail prices for ~50 common wines. Match keys
// case-insensitively against `producer + " " + wine`. Fallback £25 per
// 750ml when no match is found. Prices are rough — for indicative
// cellar-value display only, not for stocktake purposes.

export const winePrices: Record<string, number> = {
  // Bordeaux — classified growths
  "chateau margaux": 850,
  "chateau lafite rothschild": 950,
  "chateau latour": 900,
  "chateau mouton rothschild": 880,
  "chateau haut brion": 820,
  "chateau pichon baron": 240,
  "chateau leoville barton": 95,
  "chateau palmer": 380,
  "chateau pavie": 420,
  "chateau angelus": 410,

  // Bordeaux — everyday
  "chateau cantemerle": 38,
  "chateau lanessan": 22,
  "chateau meyney": 32,

  // Burgundy — domaines
  "domaine de la romanee conti la tache": 6500,
  "domaine leflaive puligny montrachet": 220,
  "domaine dujac morey saint denis": 95,
  "louis jadot bourgogne": 22,
  "louis latour pouilly fuisse": 28,
  "joseph drouhin chablis": 24,
  "william fevre chablis": 26,

  // Loire
  "domaine vacheron sancerre": 28,
  "henri bourgeois sancerre": 24,
  "pascal jolivet sancerre": 26,
  "domaine huet vouvray": 30,

  // Rhone
  "guigal cotes du rhone": 14,
  "chapoutier crozes hermitage": 24,
  "beaucastel chateauneuf du pape": 75,
  "vieux telegraphe chateauneuf du pape": 70,

  // Champagne
  "krug grande cuvee": 220,
  "dom perignon": 180,
  "bollinger special cuvee": 55,
  "veuve clicquot brut": 45,
  "moet chandon brut imperial": 38,
  "taittinger brut reserve": 42,
  "ruinart blanc de blancs": 78,
  "pol roger brut reserve": 48,

  // Italy
  "antinori tignanello": 110,
  "sassicaia": 220,
  "ornellaia": 200,
  "gaja barbaresco": 230,
  "produttori del barbaresco": 32,
  "biondi santi brunello": 180,
  "frescobaldi chianti": 18,

  // Spain
  "vega sicilia unico": 380,
  "cvne rioja reserva": 22,
  "muga rioja reserva": 24,
  "marques de murrieta rioja": 26,

  // Portugal
  "taylors lbv port": 22,
  "graham six grapes": 24,
  "fonseca bin 27": 18,

  // New World
  "cloudy bay sauvignon blanc": 28,
  "penfolds bin 389": 70,
  "penfolds grange": 700,
  "ridge monte bello": 280,
  "opus one": 380,
  "screaming eagle": 4500,
  "kistler chardonnay": 110,
  "felton road pinot noir": 60,
  "te mata coleraine": 75,

  // English sparkling
  "nyetimber classic cuvee": 38,
  "hambledon classic cuvee": 32,
  "gusbourne brut reserve": 36,
  "chapel down classic": 24,
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const indexed = Object.fromEntries(
  Object.entries(winePrices).map(([k, v]) => [norm(k), v])
);

const FALLBACK_PER_750ML = 25;

export function priceFor(opts: {
  producer: string | null;
  wine: string | null;
  sizeMl?: number;
}): number {
  const sizeMultiplier = (opts.sizeMl ?? 750) / 750;
  if (!opts.producer && !opts.wine) {
    return FALLBACK_PER_750ML * sizeMultiplier;
  }
  const key = norm(`${opts.producer ?? ""} ${opts.wine ?? ""}`);
  if (key && indexed[key]) return indexed[key] * sizeMultiplier;
  // Try producer alone
  if (opts.producer) {
    const pKey = norm(opts.producer);
    if (indexed[pKey]) return indexed[pKey] * sizeMultiplier;
    // Substring match — e.g. "chateau margaux pavillon rouge" → "chateau margaux"
    for (const k of Object.keys(indexed)) {
      if (key.includes(k)) return indexed[k] * sizeMultiplier;
    }
  }
  return FALLBACK_PER_750ML * sizeMultiplier;
}

export function formatGbp(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}
