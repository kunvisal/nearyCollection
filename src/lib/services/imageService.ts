import { ImageRepository } from "@/lib/repositories/imageRepository";
import { CreateImageInput, UpdateImageInput, createImageSchema, updateImageSchema } from "@/lib/validators/imageValidators";
import { Prisma } from "@prisma/client";
import { supabase } from "@/lib/supabaseClient";

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

        // Retrieve the image to get its Supabase storage URL
        const image = await ImageRepository.findById(imageId);
        if (image && image.url) {
            try {
                // The public URL contains the bucket structure:
                // e.g. https://[ref].supabase.co/storage/v1/object/public/products/[productId]/[filename].jpg
                // We split by '/public/products/' to get everything after it as the file path.
                const urlParts = image.url.split('/public/products/');
                if (urlParts.length === 2) {
                    const filePath = urlParts[1];
                    // Delete from Supabase Storage to save space
                    await supabase.storage.from('products').remove([filePath]);
                }
            } catch (err) {
                console.error("Failed to delete image from Supabase storage:", err);
                // We proceed to delete from DB even if cloud storage deletion fails
            }
        }

        return ImageRepository.delete(imageId);
    }
}
