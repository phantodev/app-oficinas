import { VehicleData } from "@/services/vehicle.service";
import { create } from "zustand";

export interface MediaItem {
  uri: string;
  type: "image" | "video";
}

export interface CheckInStep3Data {
  objetosPessoais: string;
  nivelCombustivel: number; // 0 a 4 (0, 1/4, 1/2, 3/4, Full)
}

interface MainStore {
  vehicleData: VehicleData | null;
  setVehicleData: (vehicleData: VehicleData | null) => void;
  mediaList: MediaItem[];
  setCheckInMediaList: (mediaList: MediaItem[]) => void;
  checkInStep3Data: CheckInStep3Data | null;
  setCheckInStep3Data: (data: CheckInStep3Data | null) => void;
}

export const useMainStore = create<MainStore>((set) => ({
  vehicleData: null,
  setVehicleData: (vehicleData: VehicleData | null) => set({ vehicleData }),
  mediaList: [],
  setCheckInMediaList: (mediaList: MediaItem[]) => set({ mediaList }),
  checkInStep3Data: null,
  setCheckInStep3Data: (data: CheckInStep3Data | null) => set({ checkInStep3Data: data }),
}));
