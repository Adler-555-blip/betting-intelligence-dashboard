"use client";

import { create } from "zustand";

type DashboardStore = {
  game: "all" | "cs2" | "dota2";
  status: "all" | "prematch" | "live" | "finished";
  setGame: (game: DashboardStore["game"]) => void;
  setStatus: (status: DashboardStore["status"]) => void;
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  game: "all",
  status: "all",
  setGame: (game) => set({ game }),
  setStatus: (status) => set({ status })
}));
