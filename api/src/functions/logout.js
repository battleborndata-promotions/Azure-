const { app } = require("@azure/functions");
const { TableClient } = require("@azure/data-tables");
const { validateSession } = require("../validateSession");

app.http("logout", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "logout",

  handler: async (request, context) => {
    try {
      const session = await validateSession(
        request,
        context
      );

      /*
        If a valid session exists,
        delete it from Azure Storage.
      */

      if (session.valid) {
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
              message: "Unable to log out."
            }
          };
        }

        const tableClient =
          TableClient.fromConnectionString(
            connectionString,
            "staffSessions"
          );

        await tableClient.deleteEntity(
          "session",
          session.session.id
        );
      }


      /*
        Whether the session was valid or not,
        clear the browser cookie.

        This makes logout safe to call more
        than once.
      */

      return {
        status: 200,

        headers: {
          "Set-Cookie":
            "bb_session=; " +
            "HttpOnly; Secure; SameSite=Strict; " +
            "Path=/; Max-Age=0"
        },

        jsonBody: {
          success: true,
          message: "Logged out successfully."
        }
      };

    } catch (error) {
      context.error(
        "logout error:",
        error
      );

      return {
        status: 500,
        jsonBody: {
          success: false,
          message: "Unable to log out."
        }
      };
    }
  }
});
