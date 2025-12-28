import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const saltRounds = 12;

    // Read from environment or use defaults for development only
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD;
    const displayName = process.env.ADMIN_DISPLAY_NAME || '系统管理员';
    const role = 'super_admin';

    // Security check for production
    if (process.env.NODE_ENV === 'production' && !password) {
        console.error('❌ 生产环境必须通过 ADMIN_PASSWORD 环境变量设置管理员密码!');
        console.error('   用法: ADMIN_PASSWORD=your_secure_password npx ts-node scripts/seed-admin.ts');
        process.exit(1);
    }

    const actualPassword = password || 'admin123';

    console.log('🔧 Creating default admin account...');

    // Idempotent check
    const existingAdmin = await prisma.admin.findUnique({
        where: { username },
    });

    if (existingAdmin) {
        console.log('⚠️  Admin account already exists, skipping creation.');
        console.log('   Username:', username);
        console.log('   Role:', existingAdmin.role);
        return;
    }

    const passwordHash = await hash(actualPassword, saltRounds);

    const admin = await prisma.admin.create({
        data: {
            username,
            passwordHash,
            displayName,
            role,
        },
    });

    console.log('✅ Default admin account created successfully!');
    console.log('   Username:', username);
    if (!password) {
        console.log('   Password:', actualPassword);
        console.log('');
        console.log('⚠️  警告: 使用了默认密码，请在生产环境中修改!');
    } else {
        console.log('   Password: (from environment variable)');
    }
    console.log('   Role:', admin.role);
    console.log('');
    console.log('📝 生产环境建议:');
    console.log('   ADMIN_USERNAME=admin ADMIN_PASSWORD=secure_password npx ts-node scripts/seed-admin.ts');
}

main()
    .catch((e) => {
        console.error('❌ Error creating admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
