import { PrismaClient } from '@prisma/client';
import { clearDatabase, createUsersWithCategoriesAndJoinToGroup } from './seed-helpers';

const prisma = new PrismaClient();

async function main() {
  if (process.argv.includes('--clear')) {
    await clearDatabase(prisma);
    console.log('Database cleared -`♡´-');
  }

  await createUsersWithCategoriesAndJoinToGroup(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seeding completed successfully, -`♡´-');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
