const { app } = require("@azure/functions");
const crypto = require("crypto");

app.http("saveEmail", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "saveEmail",

  handler: async (request, context) => {
    try {
      const body = await request.json();
      const email = body?.email?.trim().toLowerCase();

      if (!email) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            message: "Email is required."
          }
        };
      }

      const connectionString =
        process.env.AZURE_STORAGE_CONNECTION_STRING;

      if (!connectionString) {
        context.error("Storage connection string is missing.");

        return {
          status: 500,
          jsonBody: {
            success: false,
            message: "Storage configuration is missing."
          }
        };
      }

      // Load Azure Tables only after the function route is already registered.
      const { TableClient } = require("@azure/data-tables");

      const tableClient = TableClient.fromConnectionString(
        connectionString,
        "newsletter"
      );

      const entity = {
        partitionKey: "newsletter",
        rowKey: crypto.randomUUID(),
        email,
        createdAt: new Date().toISOString()
      };

      await tableClient.createEntity(entity);

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: "Email saved successfully.",
          email
        }
      };

    } catch (error) {
      context.error("saveEmail error:", error);

      return {
        status: 500,
        jsonBody: {
          success: false,
          message: "Unable to save email."
        }
      };
    }
  }
});
