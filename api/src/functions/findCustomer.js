const { app } = require("@azure/functions");
const { validateSession } = require("../validateSession");

app.http("findCustomer", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "findCustomer",

  handler: async (request, context) => {
    try {
      const session = await validateSession(
        request,
        context
      );

      if (!session.valid) {
        return {
          status: 401,
          jsonBody: {
            success: false,
            message: "Unauthorized."
          }
        };
      }

      const rawValue =
        request.query.get("value");

      if (!rawValue) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            message: "A search value is required."
          }
        };
      }

      let searchValue =
        rawValue.trim().toLowerCase();

      const isEmail =
        searchValue.includes("@");

      if (!isEmail) {
        searchValue =
          searchValue.replace(/\D/g, "");
      }

      const connectionString =
        process.env.AZURE_STORAGE_CONNECTION_STRING;

      if (!connectionString) {
        context.error(
          "Storage connection string is missing."
        );

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

      let foundCustomer = null;

      const entities =
        tableClient.listEntities();

      for await (const entity of entities) {

        let storedValue =
          entity.value ??
          entity.email ??
          "";

        storedValue =
          String(storedValue)
            .trim()
            .toLowerCase();

        if (!storedValue.includes("@")) {
          storedValue =
            storedValue.replace(/\D/g, "");
        }

        if (
          storedValue === searchValue
        ) {
          foundCustomer = entity;
          break;
        }
      }

      if (!foundCustomer) {
        return {
          status: 404,
          jsonBody: {
            success: false,
            message: "Customer not found."
          }
        };
      }

      return {
        status: 200,
        jsonBody: {
          success: true,

          customer: {
            partitionKey:
              foundCustomer.partitionKey,

            rowKey:
              foundCustomer.rowKey,

            type:
              foundCustomer.type ??
              (isEmail
                ? "email"
                : "phone"),

            value:
              foundCustomer.value ??
              foundCustomer.email,

            promotionUsed:
              foundCustomer.promotionUsed === true,

            promotionUsedAt:
              foundCustomer.promotionUsedAt ??
              null,

            createdAt:
              foundCustomer.createdAt ??
              null
          }
        }
      };

    } catch (error) {

      context.error(
        "findCustomer error:",
        error
      );

      return {
        status: 500,
        jsonBody: {
          success: false,
          message:
            "Unable to search for customer."
        }
      };
    }
  }
}); 
