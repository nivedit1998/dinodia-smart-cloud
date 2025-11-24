import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Example seed: create a tenant user linked to household 1 / "Living Room".
  // Adjust householdId and areaFilter to match a real household and HA area.
  await prisma.user.create({
    data: {
      email: 'tenant_living@example.com',
      name: 'Living Room Tenant',
      role: 'TENANT',
      householdMemberships: {
        create: {
          householdId: 1,
          role: 'TENANT',
          areaFilter: 'Living Room',
        },
      },
    },
  });
}

main()
  .catch((e) => {
    console.error('Prisma seed error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

