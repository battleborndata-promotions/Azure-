const { app } = require("@azure/functions");
const crypto = require("crypto");

app.http("saveEmail", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "saveEmail",

  handler: async (request, context) => {
    try {
      const body = await request.json();

      const type = body?.type?.trim().toLowerCase();
      let value = body?.value?.trim();

      if (!type || !value) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            message: "Signup type and value are required."
          }
        };
      }

      if (type !== "email" && type !== "phone") {
        return {
          status: 400,
          jsonBody: {
            success: false,
            message: "Signup type must be email or phone."
          }
        };
      }

      if (type === "email") {
        value = value.toLowerCase();

        const emailPattern =
          /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

        if (!emailPattern.test(value)) {
          return {
            status: 400,
            jsonBody: {
              success: false,
              message: "Invalid email address."
            }
          };
        }
      }

      if (type === "phone") {
        const digits = value.replace(/\D/g, "");

        if (digits.length < 10 || digits.length > 15) {
          return {
            status: 400,
            jsonBody: {
              success: false,
              message: "Invalid phone number."
            }
          };
        }

        value = digits;
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

      const { TableClient } =
        require("@azure/data-tables");

      const tableClient =
        TableClient.fromConnectionString(
          connectionString,
          "newsletter"
        );

      const entity = {
        partitionKey: "newsletter",
        rowKey: crypto.randomUUID(),
        type,
        value,
        createdAt: new Date().toISOString()
      };

      await tableClient.createEntity(entity);

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: "Signup saved successfully.",
          type,
          value
        }
      };

    } catch (error) {
      context.error("saveEmail error:", error);

      return {
        status: 500,
        jsonBody: {
          success: false,
          message: "Unable to save signup."
        }
      };
    }
  }
});
