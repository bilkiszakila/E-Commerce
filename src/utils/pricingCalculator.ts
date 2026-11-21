import type { VariationGroup } from "../types/database";

export function calculateDisplayPrice(basePrice: number, discountPercent: number, discountActive: boolean) {
  return discountActive ? Math.round(basePrice * (1 - discountPercent / 100)) : basePrice;
}

export function calculateMeterArea(lengthCm: number, widthCm: number) {
  return (Math.max(1, lengthCm) * Math.max(1, widthCm)) / 10000;
}

export function calculateVariationExtras(groups: VariationGroup[], selected: Record<string,string>) {
  let perUnit = 0;
  let flat = 0;
  groups.forEach((group) => {
    const option = group.options.find((item) => item.name === selected[group.group_name]);
    if (!option) return;
    if (option.charge_type === "flat") flat += option.extra_price;
    else perUnit += option.extra_price;
  });
  return { perUnit, flat };
}
