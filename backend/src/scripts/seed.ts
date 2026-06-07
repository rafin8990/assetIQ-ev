import bcrypt from 'bcryptjs';

import config from '../config';
import { ENUM_USER_ROLE } from '../enums/user';
import pool from '../utils/dbClient';

type SeedUser = {
  name: string;
  mobile_no?: string | null;
  email?: string | null;
  image?: string | null;
  password: string;
  role: ENUM_USER_ROLE;
};

const dummyUsers: SeedUser[] = [
  {
    name: 'Super Admin',
    email: 'superadmin@example.com',
    mobile_no: '+8801712345678',
    image: null,
    password: 'superadmin123',
    role: ENUM_USER_ROLE.SUPER_ADMIN,
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    mobile_no: '+8801712345679',
    image: null,
    password: 'admin123',
    role: ENUM_USER_ROLE.ADMIN,
  },
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    mobile_no: '+8801712345680',
    image: null,
    password: 'user123',
    role: ENUM_USER_ROLE.USER,
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    mobile_no: '+8801712345681',
    image: null,
    password: 'user123',
    role: ENUM_USER_ROLE.USER,
  },
  {
    name: 'Manager User',
    email: 'manager@example.com',
    mobile_no: '+8801712345682',
    image: null,
    password: 'manager123',
    role: ENUM_USER_ROLE.ADMIN,
  },
  {
    name: 'Test User',
    email: 'test@example.com',
    mobile_no: '+8801712345683',
    image: null,
    password: 'test123',
    role: ENUM_USER_ROLE.USER,
  },
];

const seedUsers = async () => {
  try {
    console.log('🌱 Starting user seeding...\n');

    const existingUsers = await pool.query<{
      email: string | null;
      mobile_no: string | null;
    }>('SELECT email, mobile_no FROM users');

    const existingEmails = new Set(
      existingUsers.rows.map(row => row.email).filter(Boolean)
    );
    const existingMobiles = new Set(
      existingUsers.rows.map(row => row.mobile_no).filter(Boolean)
    );

    let createdCount = 0;
    let skippedCount = 0;

    for (const user of dummyUsers) {
      const alreadyExists =
        (user.email && existingEmails.has(user.email)) ||
        (user.mobile_no && existingMobiles.has(user.mobile_no));

      if (alreadyExists) {
        console.log(
          `⏭️  Skipped: ${user.email ?? user.mobile_no} (already exists)`
        );
        skippedCount++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(
        user.password,
        Number(config.bycrypt_salt_rounds) || 12
      );

      const result = await pool.query<{
        id: number;
        name: string;
        email: string | null;
        mobile_no: string | null;
        image: string | null;
        role: string;
      }>(
        `INSERT INTO users (name, mobile_no, email, image, password, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, mobile_no, email, image, role`,
        [
          user.name,
          user.mobile_no ?? null,
          user.email ?? null,
          user.image ?? null,
          hashedPassword,
          user.role,
        ]
      );

      const createdUser = result.rows[0];

      console.log(
        `✅ Created: ${createdUser.name} (${createdUser.email ?? createdUser.mobile_no}) - Role: ${createdUser.role}`
      );
      createdCount++;
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   Created: ${createdCount} users`);
    console.log(`   Skipped: ${skippedCount} users (already exist)`);
    console.log(`   Total: ${dummyUsers.length} users\n`);

    if (createdCount > 0) {
      console.log('🔐 Default Passwords:');
      dummyUsers.forEach(user => {
        const exists =
          (user.email && existingEmails.has(user.email)) ||
          (user.mobile_no && existingMobiles.has(user.mobile_no));

        if (!exists) {
          console.log(`   ${user.email ?? user.mobile_no}: ${user.password}`);
        }
      });
      console.log('');
    }

    console.log('✨ User seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
};

seedUsers()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
