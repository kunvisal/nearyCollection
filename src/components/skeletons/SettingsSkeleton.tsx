import { SkeletonBox } from "./primitives";

function InputRow({ count }: { count: 2 | 3 }) {
  const gridClass = count === 3 ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6";
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBox className="h-3.5 w-28" />
          <SkeletonBox className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function SectionCard({ children, titleWidth }: { children: React.ReactNode; titleWidth: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <SkeletonBox className={`h-5 ${titleWidth} mb-4`} />
      {children}
    </div>
  );
}

import React from "react";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 pb-10 max-w-4xl">
      <SkeletonBox className="h-7 w-48 mb-2" />

      <div className="space-y-8">
        {/* Store Preferences: default language select */}
        <SectionCard titleWidth="w-40">
          <InputRow count={2} />
        </SectionCard>

        {/* Delivery Fees: 3-col grid */}
        <SectionCard titleWidth="w-32">
          <InputRow count={3} />
        </SectionCard>

        {/* Payment Instructions: 2 textareas */}
        <SectionCard titleWidth="w-44">
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonBox className="h-3.5 w-28" />
                <SkeletonBox className="h-28 w-full" />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Contact Links: 3 stacked inputs */}
        <SectionCard titleWidth="w-36">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonBox className="h-3.5 w-24" />
                <SkeletonBox className="h-10 w-full" />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Telegram: 2-col grid */}
        <SectionCard titleWidth="w-28">
          <InputRow count={2} />
        </SectionCard>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <SkeletonBox className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
