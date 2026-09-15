export function generateSine(frequency: number, sampleRate = 8000, seconds = 0.25, amplitude = 0.6) {
  const n = Math.floor(sampleRate * seconds);
  return Array.from({ length: n }, (_, i) => amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate));
}

export function dftMagnitude(frame: number[]) {
  const n = frame.length;
  const mags = Array.from({ length: Math.floor(n / 2) }, () => 0);
  for (let k = 0; k < mags.length; k += 1) {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t += 1) {
      const angle = (-2 * Math.PI * k * t) / n;
      re += frame[t] * Math.cos(angle);
      im += frame[t] * Math.sin(angle);
    }
    mags[k] = Math.sqrt(re * re + im * im) / n;
  }
  return mags;
}

export function stft(samples: number[], fftSize = 64, hop = 32) {
  const frames: number[][] = [];
  for (let start = 0; start + fftSize <= samples.length; start += hop) {
    const frame = samples.slice(start, start + fftSize);
    const windowed = frame.map((v, i) => v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (fftSize - 1))));
    frames.push(dftMagnitude(windowed));
  }
  return frames;
}

export function rms(samples: number[]) {
  return Math.sqrt(samples.reduce((s, v) => s + v * v, 0) / Math.max(samples.length, 1));
}

export function zeroCrossingRate(samples: number[]) {
  let z = 0;
  for (let i = 1; i < samples.length; i += 1) if (samples[i - 1] * samples[i] < 0) z += 1;
  return z / Math.max(samples.length - 1, 1);
}

export function spectralCentroid(magnitudes: number[], sampleRate: number, fftSize: number) {
  let num = 0;
  let den = 0;
  magnitudes.forEach((mag, k) => {
    const freq = (k * sampleRate) / fftSize;
    num += freq * mag;
    den += mag;
  });
  return den === 0 ? 0 : num / den;
}

export const AUDIO_DEMO_CLASSES = [
  { id: "tone_a", name: "440 Hz tone", frequency: 440 },
  { id: "tone_b", name: "880 Hz tone", frequency: 880 },
  { id: "noise", name: "Noise-like", frequency: 0 },
] as const;

export function demoClip(classId: string, variant = 0) {
  const spec = AUDIO_DEMO_CLASSES.find((item) => item.id === classId) ?? AUDIO_DEMO_CLASSES[0];
  if (spec.frequency === 0) {
    let state = (variant + 3) * 9973;
    return Array.from({ length: 2000 }, () => {
      state = (1664525 * state + 1013904223) >>> 0;
      return (state / 4294967296) * 2 - 1;
    });
  }
  return generateSine(spec.frequency * (1 + variant * 0.01), 8000, 0.25, 0.55);
}

export function stereoToMono(channels: number[][]) {
  if (!channels.length) return [];
  if (channels.length === 1) return channels[0];
  const n = Math.max(...channels.map((ch) => ch.length));
  return Array.from({ length: n }, (_, i) => {
    let sum = 0;
    let count = 0;
    channels.forEach((ch) => {
      if (i < ch.length) {
        sum += ch[i];
        count += 1;
      }
    });
    return count ? sum / count : 0;
  });
}

export function resampleLinear(samples: number[], fromRate: number, toRate: number) {
  if (fromRate === toRate || samples.length === 0) return samples;
  const ratio = fromRate / toRate;
  const n = Math.max(1, Math.floor(samples.length / ratio));
  return Array.from({ length: n }, (_, i) => {
    const x = i * ratio;
    const i0 = Math.floor(x);
    const frac = x - i0;
    const a = samples[i0] ?? 0;
    const b = samples[i0 + 1] ?? a;
    return a * (1 - frac) + b * frac;
  });
}

export function isSilent(samples: number[], threshold = 0.01) {
  return rms(samples) < threshold;
}

export function featureScaler(rows: number[][]) {
  const dim = rows[0]?.length ?? 0;
  const mean = Array.from({ length: dim }, () => 0);
  rows.forEach((row) => row.forEach((value, i) => {
    mean[i] += value;
  }));
  mean.forEach((_, i) => {
    mean[i] /= Math.max(rows.length, 1);
  });
  const std = Array.from({ length: dim }, () => 0);
  rows.forEach((row) => row.forEach((value, i) => {
    std[i] += (value - mean[i]) ** 2;
  }));
  std.forEach((_, i) => {
    std[i] = Math.sqrt(std[i] / Math.max(rows.length, 1)) || 1;
  });
  const apply = (row: number[]) => row.map((value, i) => (value - (mean[i] ?? 0)) / (std[i] ?? 1));
  return { mean, std, apply };
}

export function mfccFromLogSpectrum(logBands: number[], nCoeffs = 13) {
  const n = logBands.length;
  return Array.from({ length: nCoeffs }, (_, k) => {
    let sum = 0;
    for (let i = 0; i < n; i += 1) {
      sum += (logBands[i] ?? 0) * Math.cos((Math.PI * k * (i + 0.5)) / n);
    }
    return sum;
  });
}

export function bandEnergies(samples: number[], bands = 40) {
  const spectrum = dftMagnitude(samples.slice(0, 256).concat(Array(Math.max(0, 256 - samples.length)).fill(0)));
  const size = Math.max(1, Math.floor(spectrum.length / bands));
  return Array.from({ length: bands }, (_, i) => {
    const slice = spectrum.slice(i * size, (i + 1) * size);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}
