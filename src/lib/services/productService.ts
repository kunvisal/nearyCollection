import { ProductRepository } from "@/lib/repositories/productRepository";
import { CreateProductInput, UpdateProductInput, createProductSchema, updateProductSchema } from "@/lib/validators/productValidators";
import { CategoryService } from "@/lib/services/categoryService";
import { Prisma } from "@prisma/client";

export class ProductService {
    static async getAllProducts() {
        return ProductRepository.findAll();
    }

    static async getActiveProducts() {
        return ProductRepository.findActive();
    }

    static async getProductById(id: string) {
        const product = await ProductRepository.findById(id);
        if (!product) {
            throw new Error(`Product with ID ${id} not found`);
        }
        return product;
    }

    static async createProduct(data: CreateProductInput) {
        const validatedData = createProductSchema.parse(data);

        // Ensure category exists
        await CategoryService.getCategoryById(validatedData.categoryId);

        // Prepare Prisma Create Input
        const createData: Prisma.ProductCreateInput = {
            nameKm: validatedData.nameKm,
            nameEn: validatedData.nameEn,
            descriptionKm: validatedData.descriptionKm,
            descriptionEn: validatedData.descriptionEn,
            isActive: validatedData.isActive,
            category: {
                connect: { id: validatedData.categoryId }
            }
        };

        return ProductRepository.create(createData);
    }

    static async updateProduct(id: string, data: UpdateProductInput) {
        const validatedData = updateProductSchema.parse(data);
        const existingProduct = await this.getProductById(id);

        // Validate category if updating
        if (validatedData.categoryId) {
            await CategoryService.getCategoryById(validatedData.categoryId);
        }

        const updateData: Prisma.ProductUpdateInput = {
            nameKm: validatedData.nameKm,
            nameEn: validatedData.nameEn,
            descriptionKm: validatedData.descriptionKm,
            descriptionEn: validatedData.descriptionEn,
            isActive: validatedData.isActive,
        };

        if (validatedData.categoryId) {
            updateData.category = { connect: { id: validatedData.categoryId } };
        }

        return ProductRepository.update(id, updateData);
    }

    static async deleteProduct(id: string) {
        await this.getProductById(id);
        return ProductRepository.delete(id);
    }
}
