export interface Product {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviews: number;
    image: string;
    category: string;
    isNew?: boolean;
    isBestSeller?: boolean;
    description: string;
    sizes: string[];
    colors: string[];
}

export const mockProducts: Product[] = [
    {
        id: 1,
        name: "Elegant Floral Summer Dress",
        price: 25.00,
        originalPrice: 35.00,
        rating: 4.8,
        reviews: 124,
        image: "/images/clothesDemo/1.png",
        category: "dresses",
        isNew: true,
        colors: ["Pink", "Blue"],
        sizes: ["S", "M", "L"],
        description: "A beautiful floral dress perfect for summer days. Lightweight and breathable fabric."
    },
    {
        id: 2,
        name: "Modern Chic Blouse",
        price: 18.50,
        rating: 4.5,
        reviews: 89,
        image: "/images/clothesDemo/2.png",
        category: "tops",
        isBestSeller: true,
        colors: ["White", "Beige"],
        sizes: ["M", "L", "XL"],
        description: "Versatile blouse that goes with everything. Professional yet comfortable."
    },
    {
        id: 3,
        name: "Casual Denim Jacket",
        price: 45.00,
        originalPrice: 55.00,
        rating: 4.9,
        reviews: 210,
        image: "/images/clothesDemo/3.png",
        category: "outerwear",
        isNew: true,
        colors: ["Blue"],
        sizes: ["S", "M", "L", "XL"],
        description: "Classic denim jacket with a modern fit. Essential for your wardrobe."
    },
    {
        id: 4,
        name: "Pleated Midi Skirt",
        price: 22.00,
        rating: 4.6,
        reviews: 56,
        image: "/images/clothesDemo/4.png",
        category: "skirts",
        colors: ["Black", "Green"],
        sizes: ["S", "M"],
        description: "Flowy pleated skirt that adds movement to your step. Elegant and timeless."
    },
    {
        id: 5,
        name: "Cozy Knit Sweater",
        price: 32.00,
        rating: 4.7,
        reviews: 145,
        image: "/images/clothesDemo/5.png",
        category: "tops",
        isBestSeller: true,
        colors: ["Cream", "Brown"],
        sizes: ["One Size"],
        description: "Warm and cozy sweater for chilly evenings. Soft knit texture."
    },
    {
        id: 6,
        name: "High-Waist Trousers",
        price: 28.00,
        originalPrice: 38.00,
        rating: 4.4,
        reviews: 78,
        image: "/images/clothesDemo/6.png",
        category: "pants",
        colors: ["Black", "Grey"],
        sizes: ["S", "M", "L"],
        description: "Tailored trousers that offer both comfort and style. Perfect for work."
    },
    {
        id: 7,
        name: "Evening Cocktail Dress",
        price: 55.00,
        rating: 5.0,
        reviews: 32,
        image: "/images/clothesDemo/7.png",
        category: "dresses",
        isNew: true,
        colors: ["Red", "Navy"],
        sizes: ["XS", "S", "M"],
        description: "Stunning dress for special occasions. Figure-flattering silhouette."
    },
    {
        id: 8,
        name: "Summer Shorts Set",
        price: 24.00,
        rating: 4.3,
        reviews: 45,
        image: "/images/clothesDemo/8.png",
        category: "sets",
        colors: ["Yellow", "White"],
        sizes: ["S", "M", "L"],
        description: "Cute matching set for lazy weekends or beach trips."
    },
    {
        id: 9,
        name: "Oversized Hoodie",
        price: 35.00,
        rating: 4.8,
        reviews: 200,
        image: "/images/clothesDemo/9.png",
        category: "tops",
        isBestSeller: true,
        colors: ["Pink", "Lavender"],
        sizes: ["M", "L", "XL"],
        description: "Ultimate comfort in this oversized hoodie. Premium cotton blend."
    },
    {
        id: 10,
        name: "Classic White Tee",
        price: 15.00,
        rating: 4.5,
        reviews: 300,
        image: "/images/clothesDemo/10.png",
        category: "tops",
        colors: ["White", "Black"],
        sizes: ["S", "M", "L", "XL"],
        description: "The essential white t-shirt. High quality cotton that lasts."
    },
    {
        id: 11,
        name: "Boho Maxi Dress",
        price: 42.00,
        rating: 4.7,
        reviews: 88,
        image: "/images/clothesDemo/11.png",
        category: "dresses",
        isNew: true,
        colors: ["Print"],
        sizes: ["Free Size"],
        description: "Free-spirited maxi dress with beautiful patterns."
    },
    {
        id: 12,
        name: "Leather Mini Skirt",
        price: 26.00,
        originalPrice: 32.00,
        rating: 4.6,
        reviews: 67,
        image: "/images/clothesDemo/12.png",
        category: "skirts",
        colors: ["Black"],
        sizes: ["S", "M", "L"],
        description: "Edgy leather skirt to spice up your outfit."
    },
    {
        id: 13,
        name: "Striped Button Down",
        price: 29.00,
        rating: 4.4,
        reviews: 54,
        image: "/images/clothesDemo/13.png",
        category: "tops",
        colors: ["Blue Stripe"],
        sizes: ["S", "M", "L"],
        description: "Classic striped shirt for a polished look."
    }
];
