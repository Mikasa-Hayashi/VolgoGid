import { create } from 'zustand';

interface FruitInfo {
  id: number;
  name: string;
  description: string;
  image_url: string;
  scientific_name: string;
  nutrients: any[];
  slug: string;
}

interface FruitStore {
  fruitData: FruitInfo | null;
  setFruitData: (data: FruitInfo) => void;
}

export const useFruitStore = create<FruitStore>((set) => ({
  fruitData: null,
  setFruitData: (data) => set({ fruitData: data }),
}));
