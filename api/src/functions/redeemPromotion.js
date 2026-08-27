const { app } = require("@azure/functions");

app.http("redeemPromotion", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "redeemPromotion",

  handler: async (request, context) => {
    try {
      const body = await request.json();

      const partitionKey =
        body?.partitionKey;

      const rowKey =
        body?.rowKey;

      if (!partitionKey || !rowKey) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            message:
              "partitionKey and rowKey are required."
          }
        };
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
            message:
              "Storage configuration is missing."
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

      /*
        Fetch the exact customer entity.
      */

      let customer;

      try {
        customer =
          await tableClient.getEntity(
            partitionKey,
            rowKey
          );
      } catch (error) {
        if (error.statusCode === 404) {
          return {
            status: 404,
            jsonBody: {
              success: false,
              message:
                "Customer not found."
            }
          };
        }

        throw error;
      }

      /*
        Prevent duplicate redemption.
      */

      if (
        customer.promotionUsed === true
      ) {
        return {
          status: 409,
          jsonBody: {
            success: false,
            message:
              "Promotion already used.",

            promotionUsed: true,

            promotionUsedAt:
              customer.promotionUsedAt ??
              null
          }
        };
      }

      /*
        Mark promotion as used.
      */

      const promotionUsedAt =
        new Date().toISOString();

      customer.promotionUsed = true;

      customer.promotionUsedAt =
        promotionUsedAt;

      /*
        Update the existing entity.
      */

      await tableClient.updateEntity(
        customer,
        "Merge"
      );

      return {
        status: 200,
        jsonBody: {
          success: true,
          message:
            "Promotion redeemed successfully.",

          promotionUsed: true,

          promotionUsedAt
        }
      };

    } catch (error) {
      context.error(
        "redeemPromotion error:",
        error
      );

      return {
        status: 500,
        jsonBody: {
          success: false,
          message:
            "Unable to redeem promotion."
        }
      };
    }
  }
});
