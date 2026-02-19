/**
 * Seed Script: Create VIEWER accounts for LeTIP members
 *
 * Upserts 9 VIEWER accounts with must_change_password=true.
 * Default password: letip2026 (members must change on first login).
 *
 * Usage: npx ts-node prisma/seed-viewers.ts
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'letip2026';

// Admin account
const admin = { email: 'Justin@jjailabs.io', name: 'Justin Nalven' };

const members = [
  { email: 'Pseha@oceanfirst.com', name: 'P. Seha' },
  { email: 'Rstillwell@elegant-exteriors-llc.com', name: 'R. Stillwell' },
  { email: 'Rklegal@rkl-llc.com', name: 'RK Legal' },
  { email: 'Alan.Dworkin@dpassociates.cpa', name: 'Alan Dworkin' },
  { email: 'Sconnor@loandepot.com', name: 'S. Connor' },
  { email: 'Johncraig@allstate.com', name: 'John Craig' },
  { email: 'Amorak01@ft.newyorklife.com', name: 'A. Morak' },
  { email: 'Sherylkernerc21@gmail.com', name: 'Sheryl Kerner' },
  { email: 'Colin.rath@ampf.com', name: 'Colin Rath' },
];

async function main() {
  console.log('Seeding accounts...\n');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // Create admin account
  const adminEmail = admin.email.toLowerCase();
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: admin.name,
      role: Role.ADMIN,
      is_active: true,
    },
    create: {
      email: adminEmail,
      name: admin.name,
      password_hash: passwordHash,
      role: Role.ADMIN,
      must_change_password: true,
      is_active: true,
    },
  });
  console.log(`  ${adminUser.email} -> ${adminUser.name} (${adminUser.role}) [ADMIN]`);

  // Create viewer accounts
  for (const member of members) {
    const email = member.email.toLowerCase();

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: member.name,
        role: Role.VIEWER,
        must_change_password: true,
        is_active: true,
      },
      create: {
        email,
        name: member.name,
        password_hash: passwordHash,
        role: Role.VIEWER,
        must_change_password: true,
        is_active: true,
      },
    });

    console.log(`  ${user.email} -> ${user.name} (${user.role})`);
  }

  console.log(`\nSeeded 1 ADMIN + ${members.length} VIEWER accounts.`);
  console.log('Default password: letip2026 (must change on first login)');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
