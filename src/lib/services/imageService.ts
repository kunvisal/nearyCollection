import { ImageRepository } from "@/lib/repositories/imageRepository";
import { CreateImageInput, UpdateImageInput, createImageSchema, updateImageSchema } from "@/lib/validators/imageValidators";
import { Prisma } from "@prisma/client";

export class ImageService {
    static async addImage(productId: string, data: CreateImageInput) {
        const validatedData = createImageSchema.parse(data);

        // If setting as primary, we should ideally unset others, but keep simple for now
        const createData: Prisma.ProductImageCreateInput = {
            url: validatedData.url,
            sortOrder: validatedData.sortOrder,
            product: {
                connect: { id: productId }
            }
        };

        return ImageRepository.create(createData);
    }

    static async deleteImage(id: string) {
        const imageId = parseInt(id, 10);
        if (isNaN(imageId)) {
            throw new Error("Invalid image ID");
        }
        return ImageRepository.delete(imageId);
    }
}
