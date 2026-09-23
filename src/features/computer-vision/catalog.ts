import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Aperture,
  ArrowLeft,
  Box,
  Boxes,
  Camera,
  CircleDot,
  Cpu,
  Eye,
  Fingerprint,
  Hand,
  Home,
  Image as ImageIcon,
  Images,
  Layers,
  PersonStanding,
  ScanFace,
  ScanSearch,
  Smile,
  Sparkles,
  Spline,
  Target,
  Timer,
  UserRound,
  Wand2,
  Workflow,
} from "lucide-react";

export type VisionLabStatus = "ready" | "soon";
export type VisionLabGroup =
  | "home"
  | "recognition"
  | "landmarks"
  | "training"
  | "segmentation"
  | "tracking"
  | "advanced";

export type VisionLabFilter =
  | "All"
  | "Detection"
  | "Tracking"
  | "Pose"
  | "Face"
  | "Segmentation"
  | "AR"
  | "Tools";

export interface VisionLab {
  id: string;
  label: string;
  blurb: string;
  route: string;
  group: VisionLabGroup;
  filters: VisionLabFilter[];
  status: VisionLabStatus;
  icon: LucideIcon;
  badge?: string;
}

export const VISION_HOME_ROUTE = "/ml/computer-vision";
export const ALGORITHMS_HOME_ROUTE = "/";

export const visionLabs: VisionLab[] = [
  {
    id: "home",
    label: "Studio Home",
    blurb: "Browse every computer vision lab in one workspace.",
    route: VISION_HOME_ROUTE,
    group: "home",
    filters: ["All"],
    status: "ready",
    icon: Home,
  },
  {
    id: "object-detection",
    label: "Object Detection",
    blurb: "Detect and locate objects in a live camera or still image.",
    route: `${VISION_HOME_ROUTE}/object-detection`,
    group: "recognition",
    filters: ["Detection"],
    status: "ready",
    icon: ScanSearch,
    badge: "Live",
  },
  {
    id: "image-classification",
    label: "Image Classification",
    blurb: "Train a custom classifier from webcam and uploaded photos.",
    route: `${VISION_HOME_ROUTE}/image-classification`,
    group: "training",
    filters: ["Detection", "Tools"],
    status: "ready",
    icon: Images,
    badge: "Train",
  },
  {
    id: "hand-landmarks",
    label: "Hand Landmark Tracking",
    blurb: "Track 21 hand keypoints, handedness, and finger states.",
    route: `${VISION_HOME_ROUTE}/hand-landmarks`,
    group: "landmarks",
    filters: ["Tracking"],
    status: "ready",
    icon: Hand,
    badge: "Live",
  },
  {
    id: "hand-gesture",
    label: "Hand Gesture Recognition",
    blurb: "Recognize built-in MediaPipe gestures with live confidence.",
    route: `${VISION_HOME_ROUTE}/hand-gesture-recognition`,
    group: "recognition",
    filters: ["Detection", "Tracking"],
    status: "ready",
    icon: Fingerprint,
    badge: "Live",
  },
  {
    id: "custom-gesture",
    label: "Custom Gesture Trainer",
    blurb: "Train your own gesture classes from landmark sequences.",
    route: `${VISION_HOME_ROUTE}/custom-gesture-trainer`,
    group: "training",
    filters: ["Tools"],
    status: "ready",
    icon: Wand2,
    badge: "Train",
  },
  {
    id: "face-detection",
    label: "Face Detection",
    blurb: "Detect faces in images and video with bounding boxes.",
    route: `${VISION_HOME_ROUTE}/face-detection`,
    group: "recognition",
    filters: ["Face", "Detection"],
    status: "ready",
    icon: ScanFace,
    badge: "Live",
  },
  {
    id: "face-mesh",
    label: "Face Mesh",
    blurb: "Track dense facial landmarks in real time.",
    route: `${VISION_HOME_ROUTE}/face-mesh`,
    group: "landmarks",
    filters: ["Face"],
    status: "ready",
    icon: Sparkles,
    badge: "Live",
  },
  {
    id: "face-expressions",
    label: "Face Expressions",
    blurb: "Read facial expressions from blendshape scores.",
    route: `${VISION_HOME_ROUTE}/face-expressions`,
    group: "recognition",
    filters: ["Face"],
    status: "ready",
    icon: Smile,
    badge: "Live",
  },
  {
    id: "pose-estimation",
    label: "Pose Estimation",
    blurb: "Track body landmarks in real time.",
    route: `${VISION_HOME_ROUTE}/pose-estimation`,
    group: "landmarks",
    filters: ["Pose"],
    status: "ready",
    icon: PersonStanding,
    badge: "Live",
  },
  {
    id: "pose-angle",
    label: "Pose Angle Analyzer",
    blurb: "Measure joint angles from a live pose skeleton.",
    route: `${VISION_HOME_ROUTE}/pose-angle-analyzer`,
    group: "landmarks",
    filters: ["Pose", "Tools"],
    status: "ready",
    icon: Spline,
    badge: "Live",
  },
  {
    id: "rep-counter",
    label: "Exercise / Rep Counter",
    blurb: "Count workout reps from pose motion.",
    route: `${VISION_HOME_ROUTE}/exercise-rep-counter`,
    group: "tracking",
    filters: ["Pose", "Tracking"],
    status: "ready",
    icon: Timer,
    badge: "Live",
  },
  {
    id: "holistic",
    label: "Holistic Body Tracker",
    blurb: "Track face, hands, and pose together.",
    route: `${VISION_HOME_ROUTE}/holistic-body-tracker`,
    group: "landmarks",
    filters: ["Pose", "Tracking", "Face"],
    status: "ready",
    icon: UserRound,
    badge: "Live",
  },
  {
    id: "segmentation",
    label: "Image Segmentation",
    blurb: "Segment parts of a scene into labeled regions.",
    route: `${VISION_HOME_ROUTE}/image-segmentation`,
    group: "segmentation",
    filters: ["Segmentation"],
    status: "ready",
    icon: Layers,
    badge: "Live",
  },
  {
    id: "person-seg",
    label: "Person / Background Segmentation",
    blurb: "Remove or replace backgrounds in real time.",
    route: `${VISION_HOME_ROUTE}/person-background-segmentation`,
    group: "segmentation",
    filters: ["Segmentation"],
    status: "ready",
    icon: Aperture,
    badge: "Live",
  },
  {
    id: "interactive-seg",
    label: "Interactive Segmentation",
    blurb: "Segment with clicks and interactions.",
    route: `${VISION_HOME_ROUTE}/interactive-segmentation`,
    group: "segmentation",
    filters: ["Segmentation", "Tools"],
        status: "ready",
        icon: Target,
        badge: "Live",
      },
      {
        id: "embeddings",
        label: "Image Embeddings & Similarity",
        blurb: "Extract and compare image embeddings.",
        route: `${VISION_HOME_ROUTE}/image-embeddings`,
        group: "advanced",
        filters: ["Tools"],
        status: "ready",
        icon: Box,
        badge: "Live",
      },
      {
        id: "object-tracking",
        label: "Object Tracking Playground",
        blurb: "Track objects across frames.",
        route: `${VISION_HOME_ROUTE}/object-tracking`,
        group: "tracking",
        filters: ["Tracking"],
        status: "ready",
        icon: Activity,
        badge: "Live",
      },
      {
        id: "multi-object",
        label: "Multi-Object Analytics",
        blurb: "Count and analyze multiple detections over time.",
        route: `${VISION_HOME_ROUTE}/multi-object-analytics`,
        group: "tracking",
        filters: ["Tracking", "Detection"],
        status: "ready",
        icon: Boxes,
        badge: "Live",
      },
      {
        id: "ar-effects",
        label: "Camera Effects / AR Playground",
        blurb: "Try live camera effects in the browser.",
        route: `${VISION_HOME_ROUTE}/camera-effects`,
        group: "advanced",
        filters: ["AR"],
        status: "ready",
        icon: Camera,
        badge: "Live",
      },
      {
        id: "pipeline",
        label: "Vision Pipeline Builder",
        blurb: "Chain vision tasks into a custom pipeline.",
        route: `${VISION_HOME_ROUTE}/pipeline-builder`,
        group: "advanced",
        filters: ["Tools"],
        status: "ready",
        icon: Workflow,
        badge: "Live",
      },
];

export const visionLabFilters: VisionLabFilter[] = [
  "All",
  "Detection",
  "Tracking",
  "Pose",
  "Face",
  "Segmentation",
  "AR",
  "Tools",
];

export function getVisionLab(pathname: string): VisionLab | undefined {
  const exact = visionLabs.find((lab) => lab.route === pathname);
  if (exact) return exact;
  return visionLabs.find((lab) => lab.route !== VISION_HOME_ROUTE && pathname.startsWith(lab.route));
}

export const visionBackItem = {
  label: "Back to Algorithms",
  route: ALGORITHMS_HOME_ROUTE,
  icon: ArrowLeft,
};

export const visionMenuGroups: Array<{ id: VisionLabGroup; label: string }> = [
  { id: "home", label: "Studio" },
  { id: "recognition", label: "Recognition" },
  { id: "landmarks", label: "Landmarks" },
  { id: "training", label: "Training" },
  { id: "segmentation", label: "Segmentation" },
  { id: "tracking", label: "Tracking" },
  { id: "advanced", label: "Advanced" },
];

export const visionBrandIcon = Eye;
export const visionCpuIcon = Cpu;
export const visionImageIcon = ImageIcon;
export const visionDotIcon = CircleDot;
