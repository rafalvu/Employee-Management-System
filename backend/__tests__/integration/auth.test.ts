import request from "supertest";
import { app } from "../../src/server.js";
import { prisma } from "../../tests/setup";

describe("Authentication Integration Tests", () => {
  it("should register a new user in test database", async () => {
    const response = await request(app).post("/api/register").send({
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe("test@example.com");

    // Verify user exists in TEST database
    const user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    expect(user).toBeTruthy();
    expect(user?.name).toBe("Test User");
    // Verify password is hashed (not plain text)
    expect(user?.password).not.toBe("password123");
  });

  it("should login with correct credentials", async () => {
    // First register
    await request(app).post("/api/register").send({
      email: "login@example.com",
      password: "password123",
      name: "Login User",
    });

    // Then login
    const response = await request(app).post("/api/login").send({
      email: "login@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe("login@example.com");
  });

  it("should fail login with wrong password", async () => {
    // First register
    await request(app).post("/api/register").send({
      email: "wrong@example.com",
      password: "password123",
      name: "User",
    });

    // Try login with wrong password
    const response = await request(app).post("/api/login").send({
      email: "wrong@example.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
  });

  it("should access protected route with valid token", async () => {
    // Register and get token
    const registerResponse = await request(app).post("/api/register").send({
      email: "protected@example.com",
      password: "password123",
      name: "Protected User",
    });

    const token = registerResponse.body.token;

    // Access protected route
    const response = await request(app)
      .get("/api/employees")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should reject access without token", async () => {
    const response = await request(app).get("/api/employees");

    expect(response.status).toBe(401);
  });
});
