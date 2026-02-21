import { CategoryRepository } from "@/lib/repositories/categoryRepository";
import { CreateCategoryInput, UpdateCategoryInput, createCategorySchema, updateCategorySchema } from "@/lib/validators/categoryValidators";

export class CategoryService {
    static async gllAllCategories() {
        return CategoryRepository.findAll();
    }

    static async getActiveCategories() {
        return CategoryRepository.findActive();
    }

    static async getCategoryById(id: number) {
        const category = await CategoryRepository.findById(id);
        if (!category) {
            throw new Error(`Category with ID ${id} not found`);
        }
        return category;
    }

    static async createCategory(data: CreateCategoryInput) {
        const validatedData = createCategorySchema.parse(data);
        return CategoryRepository.create(validatedData);
    }

    static async updateCategory(id: number, data: UpdateCategoryInput) {
        const validatedData = updateCategorySchema.parse(data);
        // Ensure category exists
        await this.getCategoryById(id);
        return CategoryRepository.update(id, validatedData);
    }

    static async deleteCategory(id: number) {
        // Ensure category exists
        await this.getCategoryById(id);
        return CategoryRepository.delete(id);
    }
}
