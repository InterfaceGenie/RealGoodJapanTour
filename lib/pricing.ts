// src/lib/pricing.ts

export type GroupDiscountRule = {
  min: number;         // inclusive
  max?: number;        // inclusive, omit = open-ended
  percent: number;     // 0-100
};

export type PriceInput = {
  pricePerPerson: number;    // e.g., 15000
  guests: number;            // >=1
  soloMultiplier?: number;   // default 2x if only 1 guest
  couponPercent?: number;    // 0-100
  groupRules?: GroupDiscountRule[];
};

export type PriceBreakdown = {
  basePerPerson: number;
  guests: number;
  soloApplied: boolean;
  soloMultiplier: number;
  baseTotal: number;               // with solo rule applied already
  groupDiscountPercent: number;    // 0-100
  groupDiscountAmount: number;
  subtotalAfterGroup: number;
  couponPercent: number;           // 0-100 (clamped)
  couponAmount: number;
  total: number;
};

export const DEFAULT_GROUP_RULES: GroupDiscountRule[] = [
  { min: 3, max: 3, percent: 10 },
  { min: 4, max: 4, percent: 15 },
  { min: 5, max: 5, percent: 20 },
  { min: 6, max: 7, percent: 30 },
  { min: 8,           percent: 45 },
];

export function getGroupDiscountPercent(
  guests: number,
  rules: GroupDiscountRule[] = DEFAULT_GROUP_RULES
): number {
  if (!Number.isFinite(guests) || guests <= 0) return 0;
  const rule = rules.find(r =>
    guests >= r.min && (typeof r.max === "number" ? guests <= r.max : true)
  );
  return rule ? clampPercent(rule.percent) : 0;
}

export function priceBreakdown(input: PriceInput): PriceBreakdown {
  const {
    pricePerPerson,
    guests,
    soloMultiplier = 2,
    couponPercent = 0,
    groupRules = DEFAULT_GROUP_RULES,
  } = input;

  const safePrice = Math.max(0, Number(pricePerPerson || 0));
  const safeGuests = Math.max(1, Math.floor(guests || 1));

  const soloApplied = safeGuests === 1 && soloMultiplier > 1;
  const baseTotal = soloApplied
    ? Math.round(safePrice * soloMultiplier)
    : Math.round(safePrice * safeGuests);

  const groupDiscountPercent = getGroupDiscountPercent(safeGuests, groupRules);
  const groupDiscountAmount = Math.round(baseTotal * (groupDiscountPercent / 100));
  const subtotalAfterGroup = Math.max(0, baseTotal - groupDiscountAmount);

  const couponP = clampPercent(couponPercent);
  const couponAmount = Math.round(subtotalAfterGroup * (couponP / 100));
  const total = Math.max(0, subtotalAfterGroup - couponAmount);

  return {
    basePerPerson: safePrice,
    guests: safeGuests,
    soloApplied,
    soloMultiplier,
    baseTotal,
    groupDiscountPercent,
    groupDiscountAmount,
    subtotalAfterGroup,
    couponPercent: couponP,
    couponAmount,
    total,
  };
}

export function clampPercent(n: any): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.min(100, Math.max(0, Math.round(x * 100) / 100));
}

export function fmtJPY(n: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n)));
}
