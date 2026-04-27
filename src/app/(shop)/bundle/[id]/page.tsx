import React from "react";
import { notFound } from "next/navigation";
import { BundleService } from "@/lib/services/bundleService";
import { BundleRepository } from "@/lib/repositories/bundleRepository";
import { SettingsRepository } from "@/lib/repositories/settingsRepository";
import BundleDetail from "@/components/Shop/BundleDetail/BundleDetail";

export default async function BundlePage({ params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const bundle = await BundleService.getBundleById(id);
        if (!bundle || !bundle.isActive) notFound();

        const availableQty = await BundleRepository.computeAvailableQty(id);
        const suggestedUnitPrice = BundleService.suggestUnitPrice(
            bundle.bundleComponents.map((c) => ({
                salePrice: c.variant.salePrice,
                qty: c.qty,
            })),
            bundle.bundleDiscount != null ? Number(bundle.bundleDiscount) : null,
        );
        const settings = await SettingsRepository.getSettings();

        // Serialize Decimals before passing to client component.
        const serialized = {
            id: bundle.id,
            nameKm: bundle.nameKm,
            nameEn: bundle.nameEn,
            descriptionKm: bundle.descriptionKm,
            descriptionEn: bundle.descriptionEn,
            images: bundle.images.map((i) => ({ url: i.url })),
            bundleComponents: bundle.bundleComponents.map((c) => ({
                variantId: c.variantId,
                qty: c.qty,
                variant: {
                    id: c.variant.id,
                    size: c.variant.size,
                    color: c.variant.color,
                    salePrice: Number(c.variant.salePrice),
                    stockOnHand: c.variant.stockOnHand,
                    product: {
                        nameKm: c.variant.product.nameKm,
                        images: c.variant.product.images.map((i) => ({ url: i.url })),
                    },
                },
            })),
            availableQty,
            suggestedUnitPrice,
        };

        return (
            <BundleDetail
                bundle={serialized}
                settings={
                    settings
                        ? {
                              contactTelegram: settings.contactTelegram ?? undefined,
                              contactMessenger: settings.contactMessenger ?? undefined,
                              contactFacebook: settings.contactFacebook ?? undefined,
                          }
                        : undefined
                }
            />
        );
    } catch {
        notFound();
    }
}
