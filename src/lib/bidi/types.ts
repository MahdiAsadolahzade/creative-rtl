export type BidiDirection = "rtl" | "ltr";
export type DirectionMode = "auto" | BidiDirection;

export type DirectionStats = {
  rtl: number;
  ltr: number;
  total: number;
};

export type DirectionMeta = {
  dominant: BidiDirection | "none";
  mixed: boolean;
  rtlShare: number;
  forced: BidiDirection | null;
};
