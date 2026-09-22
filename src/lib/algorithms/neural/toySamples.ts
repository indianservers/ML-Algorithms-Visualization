export function imageSample(index: number) {
  const label = index % 2;
  const values = Array.from({ length: 64 }, (_, i) => {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const signal =
      label === 1 ? Math.abs(col - 3.5) < 1.1 : Math.abs(row - 3.5) < 1.1;
    const noise = ((Math.sin(index * 17 + i * 3) + 1) / 2) * 0.18;
    return signal ? 0.82 + noise : noise;
  });
  return { values, label };
}

export function sequenceSample(index: number) {
  const label = index % 2;
  const values = Array.from({ length: 12 }, (_, t) => {
    const trend = label === 1 ? t / 11 : 1 - t / 11;
    return trend + Math.sin(index * 0.9 + t) * 0.05;
  });
  return { values, label };
}
