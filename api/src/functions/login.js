const { app } = require("@azure/functions");
const { TableClient } = require("@azure/data-tables");
const crypto = require("crypto");

function verifyPassword(password, storedPasswordHash) {
  try {
    const [salt, storedHash] = storedPasswordHash.split(":");

    if (!salt || !storedHash) {
      return false;
    }

    const calculatedHash = crypto
      .scryptSync(password, salt, 64)
      .toString("hex");

    const storedBuffer = Buffer.from(storedHash, "hex");
    const calculatedBuffer = Buffer.from(calculatedHash, "hex");

    if (storedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      storedBuffer,
      calculatedBuffer
    );
  } catch {
    return false;
  }
}

app.http("login", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "login",

  handler: async (request, context) => {
    try {
      const body = await request.json();

      const username = body?.username?.trim();
      const password = body?.password;

      if (!username || !password) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            message: "Username and password are required."
          }
        };
      }

      const expectedUsername = process.env.STAFF_USERNAME;
      const storedPasswordHash =
        process.env.STAFF_PASSWORD_HASH;
      const connectionString =
        process.env.AZURE_STORAGE_CONNECTION_STRING;

      if (
        !expectedUsername ||
        !storedPasswordHash ||
        !connectionString
      ) {
        context.error(
          "Authentication configuration is missing."
        );

        return {
          status: 500,
          jsonBody: {
            success: false,
            message: "Authentication is not configured."
          }
        };
      }

      const usernameMatches =
        username === expectedUsername;

      const passwordMatches = verifyPassword(
        password,
        storedPasswordHash
      );

      if (!usernameMatches || !passwordMatches) {
        return {
          status: 401,
          jsonBody: {
            success: false,
            message: "Invalid username or password."
          }
        };
      }

      // Create a cryptographically random session ID.
      const sessionId = crypto
        .randomBytes(32)
        .toString("hex");

      const createdAt = new Date();
      const expiresAt = new Date(
        createdAt.getTime() + 8 * 60 * 60 * 1000
      );

      const tableClient =
        TableClient.fromConnectionString(
          connectionString,
          "staffSessions"
        );

      await tableClient.createEntity({
        partitionKey: "session",
        rowKey: sessionId,
        username,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString()
      });

      return {
        status: 200,

        headers: {
          "Set-Cookie":
            `bb_session=${sessionId}; ` +
            `HttpOnly; Secure; SameSite=Strict; ` +
            `Path=/; Max-Age=28800`
        },

        jsonBody: {
          success: true,
          message: "Login successful."
        }
      };
    } catch (error) {
      context.error("login error:", error);

      return {
        status: 500,
        jsonBody: {
          success: false,
          message: "Unable to sign in."
        }
      };
    }
  }
});
