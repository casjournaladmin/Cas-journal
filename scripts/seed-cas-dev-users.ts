import {
  ensureCasDevUsersInDatabase,
  CAS_DATABASE_DEV_USERS,
} from "../lib/auth/dev-database-users";
import { prisma } from "../lib/db/prisma";

async function main() {
  console.log("Seeding 5 CAS Development Users...");
  await ensureCasDevUsersInDatabase(prisma);
  console.log("Successfully seeded 5 CAS Development Users:");
  for (const user of CAS_DATABASE_DEV_USERS) {
    console.log(` - ${user.displayName} (${user.email}) [ID: ${user.id}]`);
  }
}

main()
  .catch((e) => {
    console.error("Failed to seed dev users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
