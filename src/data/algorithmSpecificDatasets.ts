import type { Dataset } from "./sampleDatasets";

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function lerp(rand: () => number, min: number, max: number) {
  return min + rand() * (max - min);
}

function cloud(
  rand: () => number,
  cx: number,
  cy: number,
  count: number,
  sx: number,
  sy: number,
) {
  return Array.from({ length: count }, () => {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand());
    return {
      x: round(cx + Math.cos(angle) * radius * sx),
      y: round(cy + Math.sin(angle) * radius * sy),
    };
  });
}

export const polynomialCurveDataset: Dataset = {
  id: "polynomial-curve",
  name: "Polynomial Engine Curve",
  description:
    "Engine temperature versus RPM with a curved, non-linear relationship that a straight line cannot fit.",
  type: "regression",
  columns: ["rpm_k", "oil_pressure", "temperature_c"],
  data: (() => {
    const rand = seeded(17);
    return Array.from({ length: 240 }, (_, index) => {
      const rpm = round(0.8 + (index / 239) * 7.4 + lerp(rand, -0.08, 0.08), 2);
      const oil = round(2.1 + rpm * 0.18 + lerp(rand, -0.15, 0.15), 2);
      const temperature = round(
        42 + 9.4 * rpm - 1.15 * rpm ** 2 + 0.22 * rpm ** 3 + lerp(rand, -2.2, 2.2),
        1,
      );
      return { rpm_k: rpm, oil_pressure: oil, temperature_c: temperature };
    });
  })(),
};

export const missingValuesHousingDataset: Dataset = {
  id: "missing-values-housing",
  name: "Incomplete Housing Records",
  description:
    "Home listings with blank area, age, and distance cells so missing-value tools have real gaps to repair.",
  type: "regression",
  columns: ["area_sqft", "bedrooms", "bathrooms", "age_years", "distance_center", "price"],
  data: (() => {
    const rand = seeded(27);
    return Array.from({ length: 220 }, (_, index) => {
      const bedrooms = 1 + (index % 5);
      const bathrooms = Math.max(1, bedrooms - (index % 2));
      const area = 700 + bedrooms * 310 + Math.round(lerp(rand, 0, 650));
      const age = Math.floor(lerp(rand, 0, 40));
      const distance = round(lerp(rand, 0.6, 16), 1);
      const price = Math.round(
        48000 + area * 112 + bedrooms * 12000 - age * 1600 - distance * 3800 + lerp(rand, -12000, 12000),
      );
      return {
        area_sqft: index % 9 === 0 ? null : area,
        bedrooms,
        bathrooms,
        age_years: index % 7 === 2 ? null : age,
        distance_center: index % 11 === 4 ? null : distance,
        price: Math.max(98000, price),
      };
    });
  })(),
};

export const scaleMismatchDataset: Dataset = {
  id: "scale-mismatch",
  name: "Mismatched Feature Scales",
  description:
    "Applicant records mixing age, income in rupees, credit score, and a tiny utilization ratio — scaling is required.",
  type: "classification",
  columns: ["age", "annual_income", "credit_score", "utilization", "approved"],
  data: (() => {
    const rand = seeded(37);
    return Array.from({ length: 220 }, () => {
      const age = Math.round(lerp(rand, 21, 68));
      const income = Math.round(lerp(rand, 180000, 2800000) / 1000) * 1000;
      const credit = Math.round(lerp(rand, 520, 850));
      const utilization = round(lerp(rand, 0.02, 0.94), 3);
      const score = credit / 80 + income / 400000 - utilization * 4 - Math.max(0, age - 55) * 0.08;
      return {
        age,
        annual_income: income,
        credit_score: credit,
        utilization,
        approved: score > 8.1 ? 1 : 0,
      };
    });
  })(),
};

export const categoricalCustomersDataset: Dataset = {
  id: "categorical-customers",
  name: "Categorical Customer Plans",
  description:
    "City, plan tier, channel, and device categories with a churn label — built for encoding lessons.",
  type: "classification",
  columns: ["city", "plan", "channel", "device", "tenure_months", "monthly_fee", "churned"],
  data: (() => {
    const rand = seeded(47);
    const cities = ["Hyderabad", "Bengaluru", "Pune", "Chennai", "Mumbai"] as const;
    const plans = ["basic", "plus", "pro"] as const;
    const channels = ["organic", "ads", "referral"] as const;
    const devices = ["android", "ios", "web"] as const;
    return Array.from({ length: 240 }, (_, index) => {
      const city = cities[index % cities.length]!;
      const plan = plans[Math.floor(rand() * plans.length)]!;
      const channel = channels[Math.floor(rand() * channels.length)]!;
      const device = devices[Math.floor(rand() * devices.length)]!;
      const tenure = 1 + Math.floor(rand() * 48);
      const fee = plan === "basic" ? 199 : plan === "plus" ? 399 : 699;
      const risk =
        (plan === "basic" ? 1.4 : 0.4) +
        (channel === "ads" ? 0.8 : 0) +
        (tenure < 6 ? 1.2 : 0) -
        tenure / 30;
      return {
        city,
        plan,
        channel,
        device,
        tenure_months: tenure,
        monthly_fee: fee,
        churned: risk + rand() * 0.4 > 1.5 ? 1 : 0,
      };
    });
  })(),
};

export const xorClassificationDataset: Dataset = {
  id: "xor-classification",
  name: "XOR Decision Regions",
  description:
    "Four diagonally opposite clouds. A linear perceptron fails; an MLP or kernel method can separate them.",
  type: "classification",
  columns: ["x", "y", "label"],
  data: (() => {
    const rand = seeded(57);
    return [
      ...cloud(rand, -1.5, -1.5, 40, 0.38, 0.38).map((point) => ({ ...point, label: 0 })),
      ...cloud(rand, 1.5, 1.5, 40, 0.38, 0.38).map((point) => ({ ...point, label: 0 })),
      ...cloud(rand, -1.5, 1.5, 40, 0.38, 0.38).map((point) => ({ ...point, label: 1 })),
      ...cloud(rand, 1.5, -1.5, 40, 0.38, 0.38).map((point) => ({ ...point, label: 1 })),
    ];
  })(),
};

export const linearlySeparableDataset: Dataset = {
  id: "linearly-separable",
  name: "Linearly Separable Blobs",
  description:
    "Two compact class clouds a single hyperplane can split — the perceptron and logistic regression hometown.",
  type: "classification",
  columns: ["x", "y", "label"],
  data: (() => {
    const rand = seeded(67);
    return [
      ...cloud(rand, -2.1, -1.8, 80, 0.52, 0.48).map((point) => ({ ...point, label: 0 })),
      ...cloud(rand, 2.0, 1.9, 80, 0.52, 0.48).map((point) => ({ ...point, label: 1 })),
    ];
  })(),
};

export const clusterBlobsDataset: Dataset = {
  id: "cluster-blobs",
  name: "Three Customer Blobs",
  description:
    "Three spherical spend/income groups. K-Means and GMM recover them cleanly; density methods also work.",
  type: "clustering",
  columns: ["x", "y", "segment"],
  data: (() => {
    const rand = seeded(77);
    const centers = [
      { x: -2.4, y: 1.6, segment: "value" },
      { x: 2.2, y: 1.8, segment: "premium" },
      { x: 0.1, y: -2.1, segment: "bargain" },
    ];
    return centers.flatMap((center) =>
      cloud(rand, center.x, center.y, 70, 0.55, 0.5).map((point) => ({
        ...point,
        segment: center.segment,
      })),
    );
  })(),
};

export const clusterMoonsDataset: Dataset = {
  id: "cluster-moons",
  name: "Interlocking Moons",
  description:
    "Two crescent shapes. Spectral clustering, OPTICS, and DBSCAN follow the curve; K-Means cuts across it.",
  type: "clustering",
  columns: ["x", "y", "shape"],
  data: (() => {
    const rand = seeded(87);
    const count = 90;
    const rows: Dataset["data"] = [];
    for (let i = 0; i < count; i += 1) {
      const t = (i / (count - 1)) * Math.PI;
      rows.push({
        x: round(Math.cos(t) + lerp(rand, -0.08, 0.08)),
        y: round(Math.sin(t) + lerp(rand, -0.08, 0.08)),
        shape: "upper",
      });
    }
    for (let i = 0; i < count; i += 1) {
      const t = (i / (count - 1)) * Math.PI;
      rows.push({
        x: round(1 - Math.cos(t) + lerp(rand, -0.08, 0.08)),
        y: round(0.45 - Math.sin(t) + lerp(rand, -0.08, 0.08)),
        shape: "lower",
      });
    }
    return rows;
  })(),
};

export const clusterCirclesDataset: Dataset = {
  id: "cluster-circles",
  name: "Concentric Circles",
  description:
    "A ring around a disk. Kernel PCA, spectral clustering, and non-linear networks recover the nest.",
  type: "clustering",
  columns: ["x", "y", "ring"],
  data: (() => {
    const rand = seeded(97);
    return Array.from({ length: 200 }, (_, index) => {
      const ring = index % 2;
      const radius = ring === 0 ? 0.85 : 2.35;
      const angle = (index / 100) * Math.PI * 2 + lerp(rand, -0.04, 0.04);
      return {
        x: round(Math.cos(angle) * radius + lerp(rand, -0.06, 0.06)),
        y: round(Math.sin(angle) * radius + lerp(rand, -0.06, 0.06)),
        ring,
      };
    });
  })(),
};

export const clusterVariableDensityDataset: Dataset = {
  id: "cluster-variable-density",
  name: "Variable Density Neighborhoods",
  description:
    "A tight cluster, a medium cluster, and a sparse cloud plus outliers — the OPTICS and DBSCAN exam.",
  type: "clustering",
  columns: ["x", "y", "neighborhood"],
  data: (() => {
    const rand = seeded(107);
    return [
      ...cloud(rand, -2.6, 1.4, 80, 0.22, 0.22).map((point) => ({ ...point, neighborhood: "dense" })),
      ...cloud(rand, 0.2, -0.3, 55, 0.7, 0.65).map((point) => ({ ...point, neighborhood: "medium" })),
      ...cloud(rand, 2.7, 1.7, 28, 1.15, 1.05).map((point) => ({ ...point, neighborhood: "sparse" })),
      { x: -4.6, y: 3.9, neighborhood: "outlier" },
      { x: 4.8, y: -3.7, neighborhood: "outlier" },
      { x: 4.3, y: 4.2, neighborhood: "outlier" },
    ];
  })(),
};

export const outlierSalaryDataset: Dataset = {
  id: "outlier-salaries",
  name: "Salary Outlier Audit",
  description:
    "Department salaries with a few extreme bonuses so IQR and z-score fences have something to flag.",
  type: "regression",
  columns: ["employee_id", "years", "department_code", "salary"],
  data: (() => {
    const rand = seeded(117);
    return Array.from({ length: 200 }, (_, index) => {
      const years = round(lerp(rand, 0.5, 18), 1);
      const department = 1 + (index % 4);
      const extreme = index % 37 === 0;
      const salary = extreme
        ? Math.round(lerp(rand, 420000, 890000))
        : Math.round(28000 + years * 4100 + department * 2500 + lerp(rand, -2500, 2500));
      return {
        employee_id: index + 1,
        years,
        department_code: department,
        salary,
      };
    });
  })(),
};

export const hmmWeatherDataset: Dataset = {
  id: "hmm-weather-states",
  name: "Hidden Weather States",
  description:
    "Daily rain readings generated from hidden sunny/cloudy/storm states — a Hidden Markov Model sequence.",
  type: "timeSeries",
  columns: ["day", "rainfall_mm", "visibility_km", "hidden_state"],
  data: (() => {
    const rand = seeded(127);
    const states = ["sunny", "cloudy", "storm"] as const;
    let state = 0;
    return Array.from({ length: 240 }, (_, index) => {
      const stay = rand();
      if (stay > 0.78) state = (state + 1) % 3;
      else if (stay < 0.08) state = (state + 2) % 3;
      const rainfall =
        state === 0
          ? lerp(rand, 0, 1.2)
          : state === 1
            ? lerp(rand, 1.5, 8)
            : lerp(rand, 12, 42);
      const visibility =
        state === 0 ? lerp(rand, 12, 20) : state === 1 ? lerp(rand, 6, 12) : lerp(rand, 1.2, 5);
      return {
        day: `Day ${index + 1}`,
        rainfall_mm: round(rainfall, 1),
        visibility_km: round(visibility, 1),
        hidden_state: states[state],
      };
    });
  })(),
};

export const gestureLandmarksDataset: Dataset = {
  id: "gesture-landmarks",
  name: "Hand Gesture Landmarks",
  description:
    "Normalized fingertip distances and angles labeled open, fist, pinch, and point.",
  type: "classification",
  columns: [
    "thumb_span",
    "index_span",
    "middle_span",
    "ring_span",
    "pinky_span",
    "palm_width",
    "pinch_gap",
    "wrist_angle",
    "gesture",
  ],
  data: (() => {
    const rand = seeded(137);
    const gestures = [
      { name: "open", spans: [0.86, 0.9, 0.92, 0.88, 0.8], pinch: 0.42, angle: 0.1 },
      { name: "fist", spans: [0.22, 0.18, 0.16, 0.17, 0.2], pinch: 0.08, angle: 0.35 },
      { name: "pinch", spans: [0.34, 0.28, 0.72, 0.7, 0.66], pinch: 0.06, angle: 0.18 },
      { name: "point", spans: [0.28, 0.9, 0.24, 0.22, 0.2], pinch: 0.3, angle: 0.12 },
    ] as const;
    return Array.from({ length: 200 }, (_, index) => {
      const gesture = gestures[index % gestures.length]!;
      const jitter = () => lerp(rand, -0.05, 0.05);
      return {
        thumb_span: round(gesture.spans[0] + jitter(), 3),
        index_span: round(gesture.spans[1] + jitter(), 3),
        middle_span: round(gesture.spans[2] + jitter(), 3),
        ring_span: round(gesture.spans[3] + jitter(), 3),
        pinky_span: round(gesture.spans[4] + jitter(), 3),
        palm_width: round(0.48 + jitter(), 3),
        pinch_gap: round(gesture.pinch + jitter(), 3),
        wrist_angle: round(gesture.angle + jitter(), 3),
        gesture: gesture.name,
      };
    });
  })(),
};

export const poseKeypointsDataset: Dataset = {
  id: "pose-keypoints",
  name: "Pose Keypoint Features",
  description:
    "Shoulder, hip, and knee angles labeled stand, sit, squat, and wave for pose classification.",
  type: "classification",
  columns: [
    "left_shoulder",
    "right_shoulder",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "torso_tilt",
    "arm_raise",
    "pose",
  ],
  data: (() => {
    const rand = seeded(147);
    const poses = [
      { name: "stand", knee: 172, hip: 176, arm: 18, tilt: 2 },
      { name: "sit", knee: 92, hip: 96, arm: 28, tilt: 6 },
      { name: "squat", knee: 78, hip: 82, arm: 36, tilt: 10 },
      { name: "wave", knee: 168, hip: 174, arm: 118, tilt: 8 },
    ] as const;
    return Array.from({ length: 180 }, (_, index) => {
      const pose = poses[index % poses.length]!;
      const noise = () => lerp(rand, -5, 5);
      return {
        left_shoulder: round(88 + noise(), 1),
        right_shoulder: round(90 + noise(), 1),
        left_hip: round(pose.hip + noise(), 1),
        right_hip: round(pose.hip + noise(), 1),
        left_knee: round(pose.knee + noise(), 1),
        right_knee: round(pose.knee + noise(), 1),
        torso_tilt: round(pose.tilt + lerp(rand, -2, 2), 1),
        arm_raise: round(pose.arm + noise(), 1),
        pose: pose.name,
      };
    });
  })(),
};

export const fewShotCharactersDataset: Dataset = {
  id: "few-shot-characters",
  name: "Few-Shot Character Strokes",
  description:
    "Six support examples per handwritten-style class — enough to prototype few-shot matching, not a full trainer.",
  type: "classification",
  columns: ["stroke_1", "stroke_2", "stroke_3", "stroke_4", "aspect", "density", "class"],
  data: (() => {
    const rand = seeded(157);
    const classes = ["A", "B", "C", "X", "O", "Z", "plus", "slash"] as const;
    const prototypes: Record<(typeof classes)[number], number[]> = {
      A: [0.9, 0.85, 0.2, 0.7, 0.62, 0.48],
      B: [0.95, 0.4, 0.88, 0.42, 0.48, 0.66],
      C: [0.8, 0.15, 0.18, 0.78, 0.7, 0.4],
      X: [0.88, 0.86, 0.84, 0.82, 0.55, 0.36],
      O: [0.82, 0.8, 0.81, 0.83, 0.92, 0.44],
      Z: [0.9, 0.2, 0.86, 0.18, 0.78, 0.4],
      plus: [0.2, 0.92, 0.18, 0.9, 0.5, 0.3],
      slash: [0.15, 0.88, 0.12, 0.86, 0.42, 0.22],
    };
    return classes.flatMap((name) =>
      Array.from({ length: 6 }, () => {
        const proto = prototypes[name];
        return {
          stroke_1: round(proto[0]! + lerp(rand, -0.06, 0.06), 3),
          stroke_2: round(proto[1]! + lerp(rand, -0.06, 0.06), 3),
          stroke_3: round(proto[2]! + lerp(rand, -0.06, 0.06), 3),
          stroke_4: round(proto[3]! + lerp(rand, -0.06, 0.06), 3),
          aspect: round(proto[4]! + lerp(rand, -0.04, 0.04), 3),
          density: round(proto[5]! + lerp(rand, -0.04, 0.04), 3),
          class: name,
        };
      }),
    );
  })(),
};

export const audioToneFeaturesDataset: Dataset = {
  id: "audio-tone-features",
  name: "Audio Tone Features",
  description:
    "Frequency, amplitude, harmonic ratio, and duration labeled as sine, square, noise, and chord.",
  type: "classification",
  columns: ["frequency_hz", "amplitude", "harmonic_ratio", "zero_crossings", "duration_ms", "class"],
  data: (() => {
    const rand = seeded(167);
    const tones = [
      { name: "sine", freq: 440, amp: 0.62, harm: 0.08, zc: 18 },
      { name: "square", freq: 220, amp: 0.78, harm: 0.72, zc: 46 },
      { name: "noise", freq: 1800, amp: 0.35, harm: 0.9, zc: 120 },
      { name: "chord", freq: 330, amp: 0.7, harm: 0.48, zc: 34 },
    ] as const;
    return Array.from({ length: 200 }, (_, index) => {
      const tone = tones[index % tones.length]!;
      return {
        frequency_hz: Math.round(tone.freq + lerp(rand, -28, 28)),
        amplitude: round(tone.amp + lerp(rand, -0.08, 0.08), 3),
        harmonic_ratio: round(tone.harm + lerp(rand, -0.06, 0.06), 3),
        zero_crossings: Math.round(tone.zc + lerp(rand, -6, 6)),
        duration_ms: Math.round(lerp(rand, 180, 820)),
        class: tone.name,
      };
    });
  })(),
};

export const contentItemFeaturesDataset: Dataset = {
  id: "content-item-features",
  name: "Course Content Features",
  description:
    "Items with topic, level, duration, rating, and tags — the content-based recommender table.",
  type: "recommendation",
  columns: ["item_id", "topic", "level", "duration_min", "rating", "project_count", "tag"],
  data: (() => {
    const rand = seeded(177);
    const topics = ["regression", "classification", "clustering", "nlp", "vision", "time-series"] as const;
    const levels = ["beginner", "intermediate", "advanced"] as const;
    const tags = ["math-light", "visual", "hands-on", "theory"] as const;
    return Array.from({ length: 120 }, (_, index) => ({
      item_id: `course-${String(index + 1).padStart(3, "0")}`,
      topic: topics[index % topics.length],
      level: levels[index % levels.length],
      duration_min: 18 + (index % 7) * 12,
      rating: round(3.4 + ((index * 7) % 16) / 10 + lerp(rand, -0.2, 0.2), 1),
      project_count: index % 5,
      tag: tags[index % tags.length],
    }));
  })(),
};

export const imagePatchDataset: Dataset = {
  id: "image-patches",
  name: "Image Patch Pixels",
  description:
    "8-pixel patches labeled edge, blob, stripe, and noise for convolution and image-classification demos.",
  type: "classification",
  columns: ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "label"],
  data: (() => {
    const rand = seeded(187);
    const patterns = [
      { name: "edge", pixels: [0.1, 0.1, 0.9, 0.9, 0.1, 0.1, 0.9, 0.9] },
      { name: "blob", pixels: [0.1, 0.7, 0.8, 0.1, 0.7, 0.95, 0.75, 0.15] },
      { name: "stripe", pixels: [0.85, 0.15, 0.85, 0.15, 0.85, 0.15, 0.85, 0.15] },
      { name: "noise", pixels: [0.4, 0.6, 0.3, 0.7, 0.5, 0.2, 0.8, 0.45] },
    ] as const;
    return Array.from({ length: 160 }, (_, index) => {
      const pattern = patterns[index % patterns.length]!;
      const pixels = pattern.pixels.map((value) => round(value + lerp(rand, -0.08, 0.08), 3));
      return {
        p0: pixels[0],
        p1: pixels[1],
        p2: pixels[2],
        p3: pixels[3],
        p4: pixels[4],
        p5: pixels[5],
        p6: pixels[6],
        p7: pixels[7],
        label: pattern.name,
      };
    });
  })(),
};

export const transferDomainDataset: Dataset = {
  id: "transfer-domain",
  name: "Source and Target Domains",
  description:
    "Same object classes drawn from a clean source domain and a noisier target domain for transfer learning.",
  type: "classification",
  columns: ["brightness", "contrast", "edge_energy", "texture", "domain", "class"],
  data: (() => {
    const rand = seeded(197);
    const classes = ["cat", "dog", "car", "tree"] as const;
    return Array.from({ length: 200 }, (_, index) => {
      const klass = classes[index % classes.length]!;
      const target = index >= 140;
      const base = { cat: 0.28, dog: 0.42, car: 0.7, tree: 0.55 }[klass];
      const noise = target ? 0.18 : 0.06;
      return {
        brightness: round(base + lerp(rand, -noise, noise), 3),
        contrast: round(0.45 + (target ? 0.2 : 0) + lerp(rand, -0.1, 0.1), 3),
        edge_energy: round(0.3 + base * 0.5 + lerp(rand, -noise, noise), 3),
        texture: round(0.35 + (klass === "tree" ? 0.3 : 0.1) + lerp(rand, -0.08, 0.08), 3),
        domain: target ? "target" : "source",
        class: klass,
      };
    });
  })(),
};

export const algorithmSpecificDatasets: Dataset[] = [
  polynomialCurveDataset,
  missingValuesHousingDataset,
  scaleMismatchDataset,
  categoricalCustomersDataset,
  xorClassificationDataset,
  linearlySeparableDataset,
  clusterBlobsDataset,
  clusterMoonsDataset,
  clusterCirclesDataset,
  clusterVariableDensityDataset,
  outlierSalaryDataset,
  hmmWeatherDataset,
  gestureLandmarksDataset,
  poseKeypointsDataset,
  fewShotCharactersDataset,
  audioToneFeaturesDataset,
  contentItemFeaturesDataset,
  imagePatchDataset,
  transferDomainDataset,
];
