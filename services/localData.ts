export type Product = { id: string; name: string; pricePerLiter: number };
export type ScheduleLine = { productId: string; litersMorning: number; litersEvening: number };
export type Schedule = { lines: ScheduleLine[] };
export type OverrideType = 'skip' | 'extra' | 'adjust';
export type DayOverride = { date: string; productId: string; type: OverrideType; litersMorning?: number; litersEvening?: number };

let products: Product[] = [
  { id: 'cow', name: 'Cow Milk', pricePerLiter: 50 },
  { id: 'buffalo', name: 'Buffalo Milk', pricePerLiter: 60 },
  { id: 'goat', name: 'Goat Milk', pricePerLiter: 80 },
];

let schedule: Schedule = {
  lines: [
    { productId: 'cow', litersMorning: 0, litersEvening: 0 },
    { productId: 'buffalo', litersMorning: 0, litersEvening: 0 },
    { productId: 'goat', litersMorning: 0, litersEvening: 0 },
  ],
};

const overrides: DayOverride[] = [];

export function getProducts(): Product[] {
  return products;
}

export function getSchedule(): Schedule {
  return JSON.parse(JSON.stringify(schedule));
}

export function saveSchedule(next: Schedule) {
  schedule = JSON.parse(JSON.stringify(next));
}

function formatDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function getToday(date: Date = new Date()) {
  const key = formatDateKey(date);
  const base = getSchedule();
  const todays = overrides.filter(o => o.date === key);
  return base.lines.map(line => {
    const p = products.find(x => x.id === line.productId)!;
    const ov = todays.find(o => o.productId === line.productId);
    let m = line.litersMorning;
    let e = line.litersEvening;
    if (ov) {
      if (ov.type === 'skip') {
        m = 0; e = 0;
      } else if (ov.type === 'extra') {
        m = (ov.litersMorning ?? 0) + m; e = (ov.litersEvening ?? 0) + e;
      } else if (ov.type === 'adjust') {
        m = ov.litersMorning ?? m; e = ov.litersEvening ?? e;
      }
    }
    return { product: p, litersMorning: m, litersEvening: e };
  });
}

export function setOverride(date: Date, ov: DayOverride) {
  const key = formatDateKey(date);
  const idx = overrides.findIndex(x => x.date === key && x.productId === ov.productId);
  const payload: DayOverride = { ...ov, date: key };
  if (idx >= 0) overrides[idx] = payload; else overrides.push(payload);
}

export function repeatOrder(fromDate: Date, toDate: Date) {
  const rows = getToday(fromDate) as { product: Product; litersMorning: number; litersEvening: number }[];
  for (const r of rows) {
    setOverride(toDate, {
      productId: r.product.id,
      type: 'adjust',
      litersMorning: r.litersMorning || 0,
      litersEvening: r.litersEvening || 0,
      date: '' as any,
    } as any);
  }
}
