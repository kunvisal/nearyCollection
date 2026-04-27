import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BundleRepository } from "@/lib/repositories/bundleRepository";
import { CategoryService } from "@/lib/services/categoryService";
import {
    createBundleSchema,
    updateBundleSchema,
    type CreateBundleInput,
    type UpdateBundleInput,
} from "@/lib/validators/bundleValidators";

export class BundleService {
    static async getAllBundles() {
        return BundleRepository.findAll();
    }

    static async getActiveBundles() {
        return BundleRepository.findActive();
    }

    static async getBundleById(id: string) {
        const bundle = await BundleRepository.findById(id);
        if (!bundle) throw new Error(`Bundle with ID ${id} not found`);
        return bundle;
    }

    /**
     * Returns suggested bundle unit price = sum(component.salePrice * component.qty) - bundleDiscount,
     * floored at 0. Used by UI to show a live preview.
     */
    static suggestUnitPrice(
        components: Array<{ salePrice: Prisma.Decimal | number | string; qty: number }>,
        bundleDiscount: Prisma.Decimal | number | null | undefined,
    ): number {
        const sum = components.reduce(
            (acc, c) => acc + Number(c.salePrice) * c.qty,
            0,
        );
        return Math.max(0, sum - Number(bundleDiscount ?? 0));
    }

    static async createBundle(data: CreateBundleInput) {
        const v = createBundleSchema.parse(data);
        await CategoryService.getCategoryById(v.categoryId);
        await this.assertVariantsExistAndActive(v.components.map((c) => c.variantId));

        const productData: Prisma.ProductCreateInput = {
            nameKm: v.nameKm,
            nameEn: v.nameEn ?? null,
            descriptionKm: v.descriptionKm ?? null,
            descriptionEn: v.descriptionEn ?? null,
            isActive: v.isActive,
            isBundle: true,
            bundleDiscount:
                v.bundleDiscount != null ? new Prisma.Decimal(v.bundleDiscount) : null,
            category: { connect: { id: v.categoryId } },
        };

        return BundleRepository.createBundleTransaction(productData, v.components);
    }

    static async updateBundle(id: string, data: UpdateBundleInput) {
        const v = updateBundleSchema.parse(data);
        const existing = await this.getBundleById(id);

        if (v.categoryId) await CategoryService.getCategoryById(v.categoryId);
        if (v.components) {
            await this.assertVariantsExistAndActive(v.components.map((c) => c.variantId));
        }

        const productData: Prisma.ProductUpdateInput = {
            ...(v.nameKm !== undefined && { nameKm: v.nameKm }),
            ...(v.nameEn !== undefined && { nameEn: v.nameEn ?? null }),
            ...(v.descriptionKm !== undefined && { descriptionKm: v.descriptionKm ?? null }),
            ...(v.descriptionEn !== undefined && { descriptionEn: v.descriptionEn ?? null }),
            ...(v.isActive !== undefined && { isActive: v.isActive }),
            ...(v.bundleDiscount !== undefined && {
                bundleDiscount:
                    v.bundleDiscount != null ? new Prisma.Decimal(v.bundleDiscount) : null,
            }),
            ...(v.categoryId && { category: { connect: { id: v.categoryId } } }),
        };
        // Mark intent — guard against turning a bundle into a non-bundle here.
        void existing;

        return BundleRepository.updateBundleTransaction(id, productData, v.components);
    }

    static async deleteBundle(id: string) {
        await this.getBundleById(id);
        return prisma.product.delete({ where: { id } });
    }

    static async getAvailability(bundleId: string) {
        return BundleRepository.computeAvailableQty(bundleId);
    }

    private static async assertVariantsExistAndActive(variantIds: string[]) {
        const variants = await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, isActive: true },
        });
        if (variants.length !== variantIds.length) {
            const found = new Set(variants.map((v) => v.id));
            const missing = variantIds.filter((id) => !found.has(id));
            throw new Error(`Variant(s) not found: ${missing.join(", ")}`);
        }
        const inactive = variants.filter((v) => !v.isActive).map((v) => v.id);
        if (inactive.length > 0) {
            throw new Error(`Variant(s) are inactive: ${inactive.join(", ")}`);
        }
    }
}
