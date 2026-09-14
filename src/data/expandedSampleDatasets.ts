import type { Dataset } from "./sampleDatasets";

const ROW_COUNT = 760;

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

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function lerp(rand: () => number, min: number, max: number) {
  return min + rand() * (max - min);
}

function monthLabel(index: number) {
  const start = new Date(2004, 0, 1);
  start.setMonth(start.getMonth() + index);
  return start.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export const irisLargeDataset: Dataset = {
  id: "iris-large",
  name: "Iris Dataset (760 rows)",
  description:
    "Expanded flower measurements using iris species ranges for sepal/petal length and width.",
  type: "classification",
  columns: ["sepal_length", "sepal_width", "petal_length", "petal_width", "species"],
  data: (() => {
    const rand = seeded(11);
    const species = [
      {
        name: "setosa",
        sepal_length: [4.3, 5.8],
        sepal_width: [2.9, 4.4],
        petal_length: [1.0, 1.9],
        petal_width: [0.1, 0.6],
      },
      {
        name: "versicolor",
        sepal_length: [4.9, 7.0],
        sepal_width: [2.0, 3.4],
        petal_length: [3.0, 5.1],
        petal_width: [1.0, 1.8],
      },
      {
        name: "virginica",
        sepal_length: [5.6, 7.9],
        sepal_width: [2.2, 3.8],
        petal_length: [4.5, 6.9],
        petal_width: [1.4, 2.5],
      },
    ] as const;
    return Array.from({ length: ROW_COUNT }, (_, index) => {
      const spec = species[index % 3]!;
      return {
        sepal_length: round(lerp(rand, spec.sepal_length[0], spec.sepal_length[1])),
        sepal_width: round(lerp(rand, spec.sepal_width[0], spec.sepal_width[1])),
        petal_length: round(lerp(rand, spec.petal_length[0], spec.petal_length[1])),
        petal_width: round(lerp(rand, spec.petal_width[0], spec.petal_width[1])),
        species: spec.name,
      };
    });
  })(),
};

export const housingLargeDataset: Dataset = {
  id: "housing-large",
  name: "Housing Price Dataset (760 rows)",
  description:
    "Expanded homes with area, bedrooms, bathrooms, age, distance to center, and price.",
  type: "regression",
  columns: ["area_sqft", "bedrooms", "bathrooms", "age_years", "distance_center", "price"],
  data: (() => {
    const rand = seeded(21);
    return Array.from({ length: ROW_COUNT }, () => {
      const bedrooms = 1 + Math.floor(rand() * 5);
      const bathrooms = Math.max(1, Math.min(bedrooms, 1 + Math.floor(rand() * bedrooms)));
      const area = Math.round(650 + bedrooms * 320 + lerp(rand, 0, 900));
      const age = Math.floor(lerp(rand, 0, 42));
      const distance = round(lerp(rand, 0.8, 18), 1);
      const price = Math.round(
        42000 +
          area * 118 +
          bedrooms * 14000 +
          bathrooms * 9000 -
          age * 1800 -
          distance * 4200 +
          lerp(rand, -18000, 18000),
      );
      return {
        area_sqft: area,
        bedrooms,
        bathrooms,
        age_years: age,
        distance_center: distance,
        price: Math.max(95000, price),
      };
    });
  })(),
};

export const studentMarksLargeDataset: Dataset = {
  id: "student-marks-large",
  name: "Student Marks Dataset (760 rows)",
  description:
    "Expanded student records where more study hours generally produce higher marks.",
  type: "regression",
  columns: ["study_hours", "marks"],
  data: (() => {
    const rand = seeded(31);
    return Array.from({ length: ROW_COUNT }, (_, index) => {
      const hours = round(0.4 + (index % 48) * 0.22 + rand() * 0.4, 2);
      const marks = Math.max(
        16,
        Math.min(99, 18 + hours * 7.1 + lerp(rand, -6, 6)),
      );
      return {
        student_id: index + 1,
        study_hours: hours,
        marks: round(marks, 1),
      };
    });
  })(),
};

export const mallCustomersLargeDataset: Dataset = {
  id: "mall-customers-large",
  name: "Mall Customers Clustering (760 rows)",
  description:
    "Expanded shoppers with age, annual income, and spending score for segmentation.",
  type: "clustering",
  columns: ["customer_id", "age", "annual_income", "spending_score"],
  data: (() => {
    const rand = seeded(41);
    const profiles = [
      { age: [18, 28], income: [15, 35], score: [65, 99] },
      { age: [29, 45], income: [40, 78], score: [40, 70] },
      { age: [35, 58], income: [70, 120], score: [8, 35] },
      { age: [46, 70], income: [18, 42], score: [10, 45] },
    ];
    return Array.from({ length: ROW_COUNT }, (_, index) => {
      const profile = profiles[index % profiles.length]!;
      return {
        customer_id: index + 1,
        age: Math.round(lerp(rand, profile.age[0], profile.age[1])),
        annual_income: Math.round(lerp(rand, profile.income[0], profile.income[1])),
        spending_score: Math.round(lerp(rand, profile.score[0], profile.score[1])),
      };
    });
  })(),
};

export const retailBasketLargeDataset: Dataset = {
  id: "retail-basket-large",
  name: "Retail Basket Dataset (760 rows)",
  description:
    "Expanded grocery baskets with produce, dairy, bakery, meat, snacks, household, and spend.",
  type: "clustering",
  columns: [
    "basket_id",
    "produce",
    "dairy",
    "bakery",
    "meat",
    "snacks",
    "household",
    "basket_value",
    "segment",
  ],
  data: (() => {
    const rand = seeded(51);
    const segments = ["fresh-focused", "family-dairy", "snack-heavy", "pantry-stock"] as const;
    return Array.from({ length: ROW_COUNT }, (_, index) => {
      const segmentId = index % 4;
      const produce = segmentId === 0 ? 5 + Math.floor(rand() * 6) : 1 + Math.floor(rand() * 4);
      const dairy = segmentId === 1 ? 5 + Math.floor(rand() * 5) : 1 + Math.floor(rand() * 4);
      const bakery = segmentId === 2 ? 4 + Math.floor(rand() * 6) : 1 + Math.floor(rand() * 3);
      const meat = segmentId === 3 ? 3 + Math.floor(rand() * 5) : Math.floor(rand() * 3);
      const snacks = segmentId === 2 ? 5 + Math.floor(rand() * 6) : 1 + Math.floor(rand() * 4);
      const household = segmentId === 3 ? 4 + Math.floor(rand() * 5) : Math.floor(rand() * 3);
      const value =
        produce * 3.2 + dairy * 2.6 + bakery * 2.1 + meat * 6.5 + snacks * 1.8 + household * 4.4;
      return {
        basket_id: index + 1,
        produce,
        dairy,
        bakery,
        meat,
        snacks,
        household,
        basket_value: round(value, 2),
        segment: segments[segmentId],
      };
    });
  })(),
};

export const timeSeriesSalesLargeDataset: Dataset = {
  id: "time-series-sales-large",
  name: "Time Series Sales Dataset (760 rows)",
  description: "Expanded monthly sales with seasonal peaks and a slow yearly trend.",
  type: "timeSeries",
  columns: ["month", "sales"],
  data: Array.from({ length: ROW_COUNT }, (_, index) => {
    const month = index % 12;
    const year = Math.floor(index / 12);
    const holiday = month === 10 ? 420 : month === 11 ? 780 : 0;
    const summer = month >= 5 && month <= 7 ? 180 : 0;
    const sales = 1180 + year * 95 + Math.sin((month / 12) * Math.PI * 2) * 210 + holiday + summer;
    return { month: monthLabel(index), sales: Math.round(sales) };
  }),
};

export const weatherDailyLargeDataset: Dataset = {
  id: "weather-daily-large",
  name: "Daily Weather Forecast Dataset (760 rows)",
  description:
    "Expanded daily temperature, rainfall, humidity, and wind for smoothing and forecasting.",
  type: "timeSeries",
  columns: ["day", "temperature_c", "rainfall_mm", "humidity", "wind_kph"],
  data: Array.from({ length: ROW_COUNT }, (_, index) => {
    const temperature = 20 + Math.sin(index / 14) * 9 + Math.sin(index / 4) * 1.6;
    const rainfall = Math.max(0, Math.sin(index / 6) * 13 + ((index * 7) % 5) - 3);
    return {
      day: `Day ${index + 1}`,
      temperature_c: round(temperature, 1),
      rainfall_mm: round(rainfall, 1),
      humidity: round(56 + rainfall * 1.6 + Math.cos(index / 8) * 13, 1),
      wind_kph: round(7 + ((index * 5) % 19) + Math.sin(index / 5) * 2.2, 1),
    };
  }),
};

export const sensorAnomalyLargeDataset: Dataset = {
  id: "sensor-anomaly-large",
  name: "Factory Sensor Anomaly Dataset (760 rows)",
  description:
    "Expanded machine readings for temperature, vibration, pressure, throughput, and anomalies.",
  type: "timeSeries",
  columns: ["timestamp", "temperature_c", "vibration_mm_s", "pressure_bar", "throughput", "is_anomaly"],
  data: Array.from({ length: ROW_COUNT }, (_, index) => {
    const spike = index % 47 === 0 || index % 61 === 0 || index % 89 === 0;
    const temperature = 63 + Math.sin(index / 10) * 4 + (spike ? 13 : 0);
    const vibration = 2.2 + Math.cos(index / 8) * 0.7 + (spike ? 3.6 : 0);
    const pressure = 7.8 + Math.sin(index / 12) * 0.9 + (spike ? -2.2 : 0);
    return {
      timestamp: `T+${index}`,
      temperature_c: round(temperature, 1),
      vibration_mm_s: round(vibration, 2),
      pressure_bar: round(pressure, 2),
      throughput: round(94 + Math.sin(index / 6) * 8 - (spike ? 24 : 0), 1),
      is_anomaly: spike ? 1 : 0,
    };
  }),
};

export const recurrentTrafficLargeDataset: Dataset = {
  id: "rnn-web-traffic-large",
  name: "Hourly Web Traffic Sequence (760 rows)",
  description:
    "Expanded hourly visits and conversions with business-hour lift and weekend drop.",
  type: "timeSeries",
  columns: ["hour", "visits", "conversions"],
  data: Array.from({ length: ROW_COUNT }, (_, index) => {
    const hourOfDay = index % 24;
    const day = Math.floor(index / 24) % 7;
    const businessHours = hourOfDay >= 9 && hourOfDay <= 18 ? 180 : 30;
    const eveningPulse = hourOfDay >= 20 && hourOfDay <= 22 ? 75 : 0;
    const weekend = day >= 5 ? -85 : 0;
    const dailyWave = Math.sin((hourOfDay / 24) * Math.PI * 2 - 1.2) * 95;
    const visits = 420 + businessHours + eveningPulse + weekend + dailyWave + Math.sin(index * 1.7) * 18;
    return {
      hour: `H${index + 1}`,
      visits: Math.round(Math.max(80, visits)),
      conversions: Math.round(Math.max(8, visits * (0.045 + Math.sin(index / 18) * 0.006))),
    };
  }),
};

export const lstmRetailDemandLargeDataset: Dataset = {
  id: "lstm-retail-demand-large",
  name: "Weekly Retail Demand Sequence (760 rows)",
  description:
    "Expanded weekly orders with promotions, inventory gap, and seasonal demand.",
  type: "timeSeries",
  columns: ["week", "orders", "promo_index", "inventory_gap"],
  data: Array.from({ length: ROW_COUNT }, (_, index) => {
    const annualSeason = Math.sin((index / 52) * Math.PI * 2) * 260;
    const quarterlySeason = Math.cos((index / 13) * Math.PI * 2) * 90;
    const promo = index % 11 === 0 || index % 17 === 0 ? 1 : index % 7 === 0 ? 0.45 : 0;
    const orders = 1450 + index * 3.4 + annualSeason + quarterlySeason + promo * 340 + Math.sin(index * 0.91) * 42;
    return {
      week: `W${index + 1}`,
      orders: Math.round(orders),
      promo_index: round(promo, 2),
      inventory_gap: round(Math.max(0, 24 + Math.sin(index / 8) * 18 - promo * 9), 1),
    };
  }),
};

export const gruMachineLoadLargeDataset: Dataset = {
  id: "gru-machine-load-large",
  name: "Machine Load Sensor Sequence (760 rows)",
  description:
    "Expanded minute-level machine load with shift cycles and temperature coupling.",
  type: "timeSeries",
  columns: ["minute", "load_kw", "temperature_c", "shift"],
  data: Array.from({ length: ROW_COUNT }, (_, index) => {
    const shift = Math.floor((index % 72) / 24);
    const shiftLoad = [18, 42, 28][shift] ?? 18;
    const cycle = Math.sin(index / 5) * 8 + Math.cos(index / 17) * 5;
    const ramp = (index % 24) * 0.45;
    const load = 95 + shiftLoad + cycle + ramp + Math.sin(index * 1.31) * 2.4;
    return {
      minute: `M${index + 1}`,
      load_kw: round(load, 2),
      temperature_c: round(52 + load * 0.08 + Math.sin(index / 13) * 2.5, 1),
      shift,
    };
  }),
};

const products = [
  "headphones",
  "blender",
  "backpack",
  "keyboard",
  "monitor",
  "running shoes",
  "coffee maker",
  "desk lamp",
  "smartwatch",
  "webcam",
];
const qualities = [
  "battery life",
  "build quality",
  "shipping speed",
  "sound",
  "fit",
  "screen",
  "support",
  "price",
  "setup",
  "packaging",
];

export const sentimentLargeDataset: Dataset = {
  id: "sentiment-large",
  name: "Text Sentiment Dataset (760 rows)",
  description: "Expanded product comments labeled positive, negative, or neutral.",
  type: "nlp",
  columns: ["text", "label"],
  data: (() => {
    const rand = seeded(61);
    const templates = {
      positive: [
        "I absolutely love this PRODUCT. QUALITY exceeded my expectations.",
        "Amazing PRODUCT with outstanding QUALITY and fast delivery.",
        "Brilliant PRODUCT. Best purchase this year because of the QUALITY.",
        "Incredibly happy with this PRODUCT and the QUALITY.",
        "Great value for money. The PRODUCT QUALITY is excellent.",
      ],
      negative: [
        "This is the worst PRODUCT experience ever. QUALITY was disappointing.",
        "Very disappointed with the PRODUCT. QUALITY failed after two days.",
        "Would not recommend this PRODUCT. QUALITY was terrible.",
        "The PRODUCT broke quickly and the QUALITY was poor.",
        "Terrible customer service around this PRODUCT and its QUALITY.",
      ],
      neutral: [
        "The PRODUCT was okay. QUALITY is average, nothing special.",
        "Decent PRODUCT. QUALITY does what it says, nothing extraordinary.",
        "Pretty average PRODUCT. QUALITY is fine for the price.",
        "It works as advertised. PRODUCT QUALITY is neither great nor bad.",
        "The service around this PRODUCT was okay and QUALITY is typical.",
      ],
    } as const;
    const labels = ["positive", "negative", "neutral"] as const;
    return Array.from({ length: ROW_COUNT }, (_, index) => {
      const label = labels[index % 3]!;
      const text = pick(rand, templates[label])
        .replace("PRODUCT", pick(rand, products))
        .replace("QUALITY", pick(rand, qualities));
      return { text, label };
    });
  })(),
};

export const spamLargeDataset: Dataset = {
  id: "spam-large",
  name: "Spam / Ham Email Dataset (760 rows)",
  description: "Expanded inbox messages labeled spam or ham for text classification.",
  type: "nlp",
  columns: ["text", "label"],
  data: (() => {
    const rand = seeded(71);
    const prizes = ["$1000", "an iPhone", "a gift card", "free crypto", "a vacation"];
    const spam = [
      "Congratulations! You have won PRIZE. Click here to claim now!",
      "FREE OFFER! Get rich quick with PRIZE. Limited time only!!!",
      "URGENT: Your account has been suspended. Verify now to keep PRIZE.",
      "Win PRIZE! Just complete this survey today.",
      "Cheap meds online! No prescription needed. Claim PRIZE instantly.",
      "Your invoice is overdue. Pay now or lose PRIZE access.",
    ];
    const ham = [
      "Hi, are we still meeting tomorrow at TIME?",
      "Please find the attached quarterly report for TEAM.",
      "Can you review the pull request when you get a chance?",
      "The meeting has been rescheduled to DAY.",
      "Thanks for sending over the documents about PROJECT.",
      "Lunch is at 12:30 in the cafeteria if you can join.",
      "Reminder: standup is at TIME on DAY.",
    ];
    const times = ["9am", "11am", "2pm", "3pm", "4:30pm"];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const teams = ["finance", "marketing", "ops", "engineering", "sales"];
    const projects = ["onboarding", "the launch", "Q3 planning", "the redesign", "payroll"];
    return Array.from({ length: ROW_COUNT }, (_, index) => {
      const isSpam = index % 2 === 0;
      const text = isSpam
        ? pick(rand, spam).replace("PRIZE", pick(rand, prizes))
        : pick(rand, ham)
            .replace("TIME", pick(rand, times))
            .replace("DAY", pick(rand, days))
            .replace("TEAM", pick(rand, teams))
            .replace("PROJECT", pick(rand, projects));
      return { text, label: isSpam ? "spam" : "ham" };
    });
  })(),
};

export const newsTopicLargeDataset: Dataset = {
  id: "news-topics-large",
  name: "News Topic Text Dataset (760 rows)",
  description:
    "Expanded article snippets labeled business, technology, sports, health, or entertainment.",
  type: "nlp",
  columns: ["text", "label"],
  data: (() => {
    const rand = seeded(81);
    const snippets: Record<string, string[]> = {
      business: [
        "The central bank held rates steady while inflation cooled across services.",
        "Quarterly revenue climbed after cloud subscriptions beat analyst expectations.",
        "Exports rose as manufacturers recovered from supply delays.",
        "Retail chains expanded stores after holiday sales beat forecasts.",
        "Bond yields slipped as investors priced a slower hiring market.",
      ],
      technology: [
        "A new battery chemistry promises faster charging for electric vehicles.",
        "Researchers released an open model for efficient on-device translation.",
        "Chip makers expanded fabrication capacity for AI accelerators.",
        "A privacy update lets users control on-device microphone access.",
        "Developers shipped a compiler that cuts inference latency on phones.",
      ],
      sports: [
        "The home side won the final after a late goal in extra time.",
        "The rookie guard scored thirty points and led the comeback.",
        "The striker signed a long-term contract before the playoffs.",
        "The marathon record fell on a cool morning in the city.",
        "The coach rotated the lineup after a midweek injury scare.",
      ],
      health: [
        "Doctors reported improved outcomes from an early screening program.",
        "Daily walking and sleep quality were linked to lower cardiac risk.",
        "Nutrition labels will be redesigned to highlight added sugar.",
        "A vaccine trial showed stronger antibody response in older adults.",
        "Clinics expanded mental health hours after demand rose in winter.",
      ],
      entertainment: [
        "The studio announced a sequel after the film topped weekend charts.",
        "A streaming drama earned awards for writing and production design.",
        "The festival lineup includes independent films and live concerts.",
        "The album debuted with strong streaming numbers in three markets.",
        "A stage revival sold out after critics praised the lead performance.",
      ],
    };
    const labels = Object.keys(snippets);
    const cities = ["Austin", "Seoul", "Lisbon", "Nairobi", "Osaka", "Toronto"];
    return Array.from({ length: ROW_COUNT }, (_, index) => {
      const label = labels[index % labels.length]!;
      const base = pick(rand, snippets[label]!);
      return { text: `${base} Reports from ${pick(rand, cities)} added local detail.`, label };
    });
  })(),
};

export const productReviewsLargeDataset: Dataset = {
  id: "product-reviews-large",
  name: "Product Reviews Sentiment Dataset (760 rows)",
  description: "Expanded commerce reviews labeled positive, negative, or neutral.",
  type: "nlp",
  columns: ["text", "label"],
  data: (() => {
    const rand = seeded(91);
    const templates = {
      positive: [
        "Battery life is excellent and the PRODUCT QUALITY is bright outdoors.",
        "Great build quality on this PRODUCT, fast delivery, and worth the price.",
        "Camera-like QUALITY surprised me. This PRODUCT is excellent value.",
        "Excellent PRODUCT for students and remote work. QUALITY is outstanding.",
      ],
      negative: [
        "The PRODUCT cracked after one week and QUALITY support was slow.",
        "It overheats during normal use. PRODUCT QUALITY feels unfinished.",
        "The PRODUCT disconnects often and QUALITY settings are lost.",
        "Buttons feel loose on this PRODUCT and the QUALITY warranty is confusing.",
      ],
      neutral: [
        "Setup was simple but the PRODUCT QUALITY is only average.",
        "The design is clean though PRODUCT QUALITY is just okay.",
        "Packaging was fine and the PRODUCT QUALITY accessories were included.",
        "Works as described. PRODUCT QUALITY has no major issues.",
      ],
    } as const;
    const labels = ["positive", "negative", "neutral"] as const;
    return Array.from({ length: ROW_COUNT }, (_, index) => {
      const label = labels[index % 3]!;
      const text = pick(rand, templates[label])
        .replace("PRODUCT", pick(rand, products))
        .replace("QUALITY", pick(rand, qualities));
      return { text, label };
    });
  })(),
};

const firstNames = [
  "Alice",
  "Bob",
  "Carol",
  "Dave",
  "Eve",
  "Farah",
  "Gabe",
  "Hana",
  "Ivan",
  "Jade",
];

export const ratingsLargeDataset: Dataset = {
  id: "ratings-large",
  name: "Movie Ratings Matrix (760 rows)",
  description:
    "Expanded user-item ratings for five movies, including missing scores for collaborative filtering.",
  type: "recommendation",
  columns: ["user", "movie_a", "movie_b", "movie_c", "movie_d", "movie_e"],
  data: (() => {
    const rand = seeded(101);
    return Array.from({ length: ROW_COUNT }, (_, index) => {
      const score = () => (rand() < 0.18 ? null : 1 + Math.floor(rand() * 5));
      return {
        user: `${pick(rand, firstNames)}_${String(index + 1).padStart(3, "0")}`,
        movie_a: score(),
        movie_b: score(),
        movie_c: score(),
        movie_d: score(),
        movie_e: score(),
      };
    });
  })(),
};

export const loanLargeDataset: Dataset = {
  id: "loan-large",
  name: "Loan Approval Dataset (760 rows)",
  description:
    "Expanded applicants with income, credit score, debt ratio, employment years, and approval.",
  type: "classification",
  columns: ["income", "credit_score", "debt_ratio", "employment_years", "approved"],
  data: (() => {
    const rand = seeded(111);
    return Array.from({ length: ROW_COUNT }, () => {
      const income = Math.round(lerp(rand, 18000, 140000) / 500) * 500;
      const credit = Math.round(lerp(rand, 500, 820));
      const debt = round(lerp(rand, 0.12, 0.72), 2);
      const years = Math.floor(lerp(rand, 0, 18));
      const score = credit * 0.012 + years * 0.35 + income / 40000 - debt * 6.5;
      return {
        income,
        credit_score: credit,
        debt_ratio: debt,
        employment_years: years,
        approved: score > 8.4 ? 1 : 0,
      };
    });
  })(),
};

export const customerChurnLargeDataset: Dataset = {
  id: "customer-churn-large",
  name: "Customer Churn Dataset (760 rows)",
  description:
    "Expanded subscription records with tenure, fee, usage, tickets, late payments, and churn.",
  type: "classification",
  columns: [
    "customer_id",
    "tenure_months",
    "monthly_fee",
    "usage_hours",
    "support_tickets",
    "late_payments",
    "satisfaction",
    "churned",
  ],
  data: Array.from({ length: ROW_COUNT }, (_, index) => {
    const tenure = 1 + (index * 7) % 60;
    const monthlyFee = 18 + ((index * 11) % 80);
    const usage = 4 + ((index * 13) % 95) / 2;
    const supportTickets = (index * 5) % 8;
    const latePayments = (index * 3) % 5;
    const satisfaction = Math.max(
      1,
      Math.min(10, 9 - supportTickets * 0.8 - latePayments * 0.7 + usage / 35 - monthlyFee / 120),
    );
    const churnScore =
      monthlyFee / 28 + supportTickets * 1.6 + latePayments * 2.1 - tenure / 16 - usage / 20 - satisfaction;
    return {
      customer_id: index + 1,
      tenure_months: tenure,
      monthly_fee: round(monthlyFee, 2),
      usage_hours: round(usage, 1),
      support_tickets: supportTickets,
      late_payments: latePayments,
      satisfaction: round(satisfaction, 1),
      churned: churnScore > -0.6 ? 1 : 0,
    };
  }),
};

export const medicalRiskLargeDataset: Dataset = {
  id: "medical-risk-large",
  name: "Medical Risk Screening Dataset (760 rows)",
  description:
    "Expanded patient screening with age, BMI, blood pressure, cholesterol, glucose, and risk.",
  type: "classification",
  columns: [
    "patient_id",
    "age",
    "bmi",
    "systolic_bp",
    "cholesterol",
    "glucose",
    "exercise_hours",
    "high_risk",
  ],
  data: Array.from({ length: ROW_COUNT }, (_, index) => {
    const age = 22 + (index * 3) % 58;
    const bmi = 18 + ((index * 7) % 170) / 10;
    const systolic = 102 + (index * 11) % 68;
    const cholesterol = 145 + (index * 13) % 120;
    const glucose = 74 + (index * 17) % 88;
    const exercise = ((index * 5) % 16) / 2;
    const risk =
      age * 0.035 + bmi * 0.11 + systolic * 0.018 + cholesterol * 0.008 + glucose * 0.015 - exercise * 0.32;
    return {
      patient_id: index + 1,
      age,
      bmi: round(bmi, 1),
      systolic_bp: systolic,
      cholesterol,
      glucose,
      exercise_hours: round(exercise, 1),
      high_risk: risk > 9.2 ? 1 : 0,
    };
  }),
};

export const fraudTransactionsLargeDataset: Dataset = {
  id: "fraud-transactions-large",
  name: "Fraud Transactions Dataset (760 rows)",
  description:
    "Expanded payments with amount, hour, merchant risk, device age, distance, and fraud labels.",
  type: "classification",
  columns: [
    "transaction_id",
    "amount",
    "hour",
    "merchant_risk",
    "device_age_days",
    "distance_from_home_km",
    "previous_declines",
    "fraud",
  ],
  data: Array.from({ length: ROW_COUNT }, (_, index) => {
    const amount = 12 + ((index * 37) % 900) + ((index % 9) * 0.79);
    const hour = (index * 5) % 24;
    const merchantRisk = ((index * 7) % 10) / 10;
    const deviceAge = (index * 19) % 720;
    const distance = ((index * 23) % 400) / 2;
    const declines = (index * 11) % 4;
    const suspicious =
      amount > 620 || (hour < 5 && distance > 120) || (merchantRisk > 0.7 && declines >= 2) || deviceAge < 10;
    return {
      transaction_id: index + 1,
      amount: round(amount, 2),
      hour,
      merchant_risk: round(merchantRisk, 1),
      device_age_days: deviceAge,
      distance_from_home_km: round(distance, 1),
      previous_declines: declines,
      fraud: suspicious ? 1 : 0,
    };
  }),
};

export const energyDemandLargeDataset: Dataset = {
  id: "energy-demand-large",
  name: "Energy Demand Regression Dataset (760 rows)",
  description:
    "Expanded hourly demand from temperature, humidity, wind, weekend flags, and hour of day.",
  type: "regression",
  columns: ["hour_id", "temperature_c", "humidity", "wind_kph", "is_weekend", "hour_of_day", "demand_mw"],
  data: Array.from({ length: ROW_COUNT }, (_, index) => {
    const hour = index % 24;
    const day = Math.floor(index / 24);
    const temperature = 18 + Math.sin(index / 9) * 9 + (hour > 13 ? 4 : 0);
    const humidity = 42 + Math.cos(index / 11) * 22;
    const wind = 5 + ((index * 7) % 28);
    const weekend = day % 7 >= 5 ? 1 : 0;
    const eveningPeak = hour >= 18 && hour <= 22 ? 55 : 0;
    const workdayLoad = weekend ? -28 : 24;
    const demand =
      260 +
      Math.max(0, temperature - 22) * 7 +
      Math.max(0, 18 - temperature) * 5 +
      eveningPeak +
      workdayLoad +
      humidity * 0.35 -
      wind * 0.8;
    return {
      hour_id: index + 1,
      temperature_c: round(temperature, 1),
      humidity: round(humidity, 1),
      wind_kph: wind,
      is_weekend: weekend,
      hour_of_day: hour,
      demand_mw: round(demand, 1),
    };
  }),
};

export const expandedSampleDatasets: Dataset[] = [
  irisLargeDataset,
  housingLargeDataset,
  studentMarksLargeDataset,
  mallCustomersLargeDataset,
  retailBasketLargeDataset,
  timeSeriesSalesLargeDataset,
  weatherDailyLargeDataset,
  sensorAnomalyLargeDataset,
  recurrentTrafficLargeDataset,
  lstmRetailDemandLargeDataset,
  gruMachineLoadLargeDataset,
  sentimentLargeDataset,
  spamLargeDataset,
  newsTopicLargeDataset,
  productReviewsLargeDataset,
  ratingsLargeDataset,
  loanLargeDataset,
  customerChurnLargeDataset,
  medicalRiskLargeDataset,
  fraudTransactionsLargeDataset,
  energyDemandLargeDataset,
];
