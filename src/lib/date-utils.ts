const MONTHS_PL: Record<string, string> = {
  stycznia: "01", lutego: "02", marca: "03", kwietnia: "04",
  maja: "05", czerwca: "06", lipca: "07", sierpnia: "08",
  września: "09", października: "10", listopada: "11", grudnia: "12",
};

export function parsePolishDate(dateStr: string): Date {
  const parts = dateStr.trim().split(" ");
  if (parts.length !== 3) return new Date();
  const [day, monthPL, year] = parts;
  const month = MONTHS_PL[monthPL.toLowerCase()] || "01";
  return new Date(`${year}-${month}-${day.padStart(2, "0")}T00:00:00Z`);
}
