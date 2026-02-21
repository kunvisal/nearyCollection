import 'dotenv/config';
import prisma from './src/lib/prisma';

async function main() {
    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: 'password', // Note: Storing plain text password for development testing only
            fullName: 'System Admin',
            role: 'ADMIN',
            isActive: true,
        },
    });
    console.log('Admin user initialized successfully:', user);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    });
