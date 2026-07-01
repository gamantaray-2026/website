export type DashboardRoute = "A" | "B";

export type Metric = {
  label: string;
  value: string;
};

export type MissionStep = {
  id: string;
  label: string;
};

export type CameraFeed = {
  title: string;
  code: string;
  label: string;
};
