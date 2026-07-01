import type {
  Metric,
  MissionStep,
} from "@/components/dashboard/types";

export const navigationMetrics: Metric[] = [
  { label: "Latitude", value: "°" },
  { label: "Longitude", value: "°" },
  { label: "SoG", value: "—" },
  { label: "CoG", value: "—" },
];

export const missionSteps: MissionStep[] = [
  { id: "01", label: "Prepare" },
  { id: "02", label: "Start" },
  { id: "03", label: "Floating ball set" },
  { id: "04", label: "Surface imaging" },
  { id: "05", label: "Underwater imaging" },
  { id: "06", label: "Docking" },
  { id: "07", label: "Finish" },
];

export const gridRows = ["E", "D", "C", "B", "A"] as const;
export const gridCols = [1, 2, 3, 4, 5] as const;
