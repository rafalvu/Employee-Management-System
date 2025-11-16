import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

export const prisma = new PrismaClient();

// Clean database before each test suite
export async function setupTestDatabase() {
  // Delete all data
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
}

// Close connection after all tests
export async function teardownTestDatabase() {
  await prisma.$disconnect();
}

// Global setup
beforeAll(async () => {
  await setupTestDatabase();
});

// Global teardown
afterAll(async () => {
  await teardownTestDatabase();
});

// Clean between tests
beforeEach(async () => {
  await setupTestDatabase();
});
