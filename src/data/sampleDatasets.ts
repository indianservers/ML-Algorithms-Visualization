import { algorithmSpecificDatasets } from "./algorithmSpecificDatasets";
import {
  customerChurnLargeDataset,
  energyDemandLargeDataset,
  expandedSampleDatasets,
  fraudTransactionsLargeDataset,
  gruMachineLoadLargeDataset,
  housingLargeDataset,
  irisLargeDataset,
  loanLargeDataset,
  lstmRetailDemandLargeDataset,
  mallCustomersLargeDataset,
  medicalRiskLargeDataset,
  newsTopicLargeDataset,
  productReviewsLargeDataset,
  ratingsLargeDataset,
  recurrentTrafficLargeDataset,
  retailBasketLargeDataset,
  sensorAnomalyLargeDataset,
  sentimentLargeDataset,
  spamLargeDataset,
  studentMarksLargeDataset,
  timeSeriesSalesLargeDataset,
  weatherDailyLargeDataset,
} from "./expandedSampleDatasets";

export interface Dataset {
  id: string;
  name: string;
  description: string;
  type: 'regression' | 'classification' | 'clustering' | 'timeSeries' | 'nlp' | 'recommendation';
  columns: string[];
  data: Record<string, unknown>[];
}

function asCanonical(dataset: Dataset, id: string, name: string, description: string): Dataset {
  return { ...dataset, id, name, description };
}

export const irisDataset: Dataset = asCanonical(
  irisLargeDataset,
  "iris",
  "Iris Dataset",
  "760 flower measurements across 3 species — sepal and petal length and width.",
);

export const housingDataset: Dataset = asCanonical(
  housingLargeDataset,
  "housing",
  "Housing Price Dataset",
  "760 homes with area, rooms, age, distance to center, and sale price.",
);

export const studentMarksDataset: Dataset = asCanonical(
  studentMarksLargeDataset,
  "student-marks",
  "Student Marks Dataset",
  "760 student records where more study hours generally produce higher marks.",
);

export const mallCustomersDataset: Dataset = asCanonical(
  mallCustomersLargeDataset,
  "mall-customers",
  "Mall Customers Clustering",
  "760 shoppers with age, annual income, and spending score for segmentation.",
);

export const retailBasketDataset: Dataset = asCanonical(
  retailBasketLargeDataset,
  "retail-basket",
  "Retail Basket Dataset",
  "760 grocery baskets with produce, dairy, bakery, meat, snacks, household, and spend.",
);

export const timeSeriesSalesDataset: Dataset = asCanonical(
  timeSeriesSalesLargeDataset,
  "time-series-sales",
  "Time Series Sales Dataset",
  "760 monthly sales points with seasonal peaks and a slow yearly trend.",
);

export const weatherDailyDataset: Dataset = asCanonical(
  weatherDailyLargeDataset,
  "weather-daily",
  "Daily Weather Forecast Dataset",
  "760 daily temperature, rainfall, humidity, and wind readings.",
);

export const sensorAnomalyDataset: Dataset = asCanonical(
  sensorAnomalyLargeDataset,
  "sensor-anomaly",
  "Factory Sensor Anomaly Dataset",
  "760 machine readings with temperature, vibration, pressure, throughput, and anomaly flags.",
);

export const recurrentTrafficDataset: Dataset = asCanonical(
  recurrentTrafficLargeDataset,
  "rnn-web-traffic",
  "Hourly Web Traffic Sequence",
  "760 hourly visits and conversions with business-hour lift and weekend drop.",
);

export const lstmRetailDemandDataset: Dataset = asCanonical(
  lstmRetailDemandLargeDataset,
  "lstm-retail-demand",
  "Weekly Retail Demand Sequence",
  "760 weekly orders with promotions, inventory gap, and seasonal demand.",
);

export const gruMachineLoadDataset: Dataset = asCanonical(
  gruMachineLoadLargeDataset,
  "gru-machine-load",
  "Machine Load Sensor Sequence",
  "760 minute-level machine load readings with shift cycles and temperature coupling.",
);

export const sentimentDataset: Dataset = asCanonical(
  sentimentLargeDataset,
  "sentiment",
  "Text Sentiment Dataset",
  "760 product comments labeled positive, negative, or neutral.",
);

export const spamDataset: Dataset = asCanonical(
  spamLargeDataset,
  "spam",
  "Spam / Ham Email Dataset",
  "760 inbox messages labeled spam or ham.",
);

export const newsTopicDataset: Dataset = asCanonical(
  newsTopicLargeDataset,
  "news-topics",
  "News Topic Text Dataset",
  "760 short news sentences labeled by topic.",
);

export const productReviewsDataset: Dataset = asCanonical(
  productReviewsLargeDataset,
  "product-reviews",
  "Product Reviews Sentiment Dataset",
  "760 product reviews labeled positive, negative, or neutral.",
);

export const ratingsDataset: Dataset = asCanonical(
  ratingsLargeDataset,
  "movie-ratings",
  "Movie Ratings Matrix",
  "760 user-item rating rows across five movies, including missing scores.",
);

export const loanDataset: Dataset = asCanonical(
  loanLargeDataset,
  "loan",
  "Loan Approval Dataset",
  "760 applicants with income, credit score, debt ratio, employment years, and approval.",
);

export const customerChurnDataset: Dataset = asCanonical(
  customerChurnLargeDataset,
  "customer-churn",
  "Customer Churn Dataset",
  "760 subscription records with tenure, fee, usage, tickets, late payments, and churn.",
);

export const medicalRiskDataset: Dataset = asCanonical(
  medicalRiskLargeDataset,
  "medical-risk",
  "Medical Risk Screening Dataset",
  "760 patients with age, BMI, blood pressure, cholesterol, glucose, and risk.",
);

export const fraudTransactionsDataset: Dataset = asCanonical(
  fraudTransactionsLargeDataset,
  "fraud-transactions",
  "Fraud Transactions Dataset",
  "760 payments with amount, hour, merchant risk, device age, distance, and fraud labels.",
);

export const energyDemandDataset: Dataset = asCanonical(
  energyDemandLargeDataset,
  "energy-demand",
  "Energy Demand Regression Dataset",
  "760 hourly demand rows from temperature, humidity, wind, weekend flags, and hour of day.",
);

export function generateSyntheticBlobs(n = 100, k = 3): { x: number; y: number; label: number }[] {
  const centers = Array.from({ length: k }, (_, i) => ({
    cx: Math.cos((i * 2 * Math.PI) / k) * 3,
    cy: Math.sin((i * 2 * Math.PI) / k) * 3,
  }));
  return Array.from({ length: n }, (_, index) => {
    const label = index % k;
    const { cx, cy } = centers[label]!;
    const jitter = ((index * 17) % 11) / 11 - 0.5;
    const jitterY = ((index * 13) % 9) / 9 - 0.5;
    return { x: cx + jitter * 2, y: cy + jitterY * 2, label };
  });
}

export function generateSyntheticMoons(n = 100): { x: number; y: number; label: number }[] {
  const half = Math.floor(n / 2);
  const result: { x: number; y: number; label: number }[] = [];
  for (let i = 0; i < half; i++) {
    const angle = (Math.PI * i) / Math.max(1, half - 1);
    result.push({ x: Math.cos(angle) + ((i % 7) - 3) * 0.04, y: Math.sin(angle) + ((i % 5) - 2) * 0.04, label: 0 });
  }
  for (let i = 0; i < n - half; i++) {
    const angle = (Math.PI * i) / Math.max(1, n - half - 1);
    result.push({ x: 1 - Math.cos(angle) + ((i % 7) - 3) * 0.04, y: 0.5 - Math.sin(angle) + ((i % 5) - 2) * 0.04, label: 1 });
  }
  return result;
}

export function generateSyntheticCircles(n = 100): { x: number; y: number; label: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const label = i % 2;
    const r = label === 0 ? 1 : 2.5;
    const angle = (i / n) * Math.PI * 4;
    return { x: r * Math.cos(angle) + ((i % 5) - 2) * 0.03, y: r * Math.sin(angle) + ((i % 7) - 3) * 0.03, label };
  });
}

export function generateLinearData(n = 50, slope = 2, intercept = 5, noise = 1): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const x = (i / Math.max(1, n - 1)) * 10;
    const wobble = ((i * 11) % 7) / 7 - 0.5;
    return { x: parseFloat(x.toFixed(2)), y: parseFloat((slope * x + intercept + wobble * noise * 5).toFixed(2)) };
  });
}

const expandedOnly = expandedSampleDatasets.filter((dataset) =>
  [
    "book-ratings",
    "music-ratings",
    "restaurant-ratings",
    "ecommerce-interactions",
    "course-ratings",
    "video-watch-ratings",
  ].includes(dataset.id),
);

export const allSampleDatasets: Dataset[] = [
  irisDataset,
  housingDataset,
  studentMarksDataset,
  mallCustomersDataset,
  retailBasketDataset,
  timeSeriesSalesDataset,
  weatherDailyDataset,
  sensorAnomalyDataset,
  recurrentTrafficDataset,
  lstmRetailDemandDataset,
  gruMachineLoadDataset,
  sentimentDataset,
  spamDataset,
  newsTopicDataset,
  productReviewsDataset,
  ratingsDataset,
  loanDataset,
  customerChurnDataset,
  medicalRiskDataset,
  fraudTransactionsDataset,
  energyDemandDataset,
  ...expandedOnly,
  ...algorithmSpecificDatasets,
];
