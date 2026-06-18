import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@paintballhq.com";
const adminPasswordEnv = process.env.SEED_ADMIN_PASSWORD;
const directUrl = process.env.DIRECT_URL;

if (!adminPasswordEnv) {
  throw new Error("Missing SEED_ADMIN_PASSWORD in environment variables");
}

if (!directUrl) {
  throw new Error("Missing DIRECT_URL in environment variables");
}

const adapter = new PrismaNeon({
  connectionString: directUrl,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash(adminPasswordEnv!, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password,
      role: "admin",
    },
    create: {
      email: adminEmail,
      password,
      role: "admin",
    },
  });

  console.log(`Admin user created/updated: ${adminEmail}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .then(async () => {
    await prisma.$disconnect();
  });