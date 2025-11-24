const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  console.log(Object.keys(prisma));
  await prisma.$disconnect();
})();
