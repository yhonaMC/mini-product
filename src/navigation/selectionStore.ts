import { create } from 'zustand';

interface SelectionState {
  productId: number | undefined;
  selectProduct: (id: number) => void;
}

/** Only navigation selection lives here; product data stays in React Query. */
export const useSelectionStore = create<SelectionState>(set => ({
  productId: undefined,
  selectProduct: productId => set({ productId }),
}));
