"use client";
import { createContext, useContext, useTransition, ReactNode } from "react";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

type FilterCtx = { startFilterTransition: (cb: () => void) => void };

const FilterContext = createContext<FilterCtx>({ startFilterTransition: (cb) => cb() });

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <FilterContext.Provider value={{ startFilterTransition: startTransition }}>
      {isPending ? <DashboardSkeleton /> : children}
    </FilterContext.Provider>
  );
}

export const useFilterTransition = () => useContext(FilterContext);
