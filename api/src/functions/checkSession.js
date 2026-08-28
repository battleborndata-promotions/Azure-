const { app } = require("@azure/functions");
const { validateSession } = require("../validateSession");

app.http("checkSession", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "checkSession",

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
            authenticated: false
          }
        };
      }

      return {
        status: 200,
        jsonBody: {
          success: true,
          authenticated: true,
          username: session.session.username
        }
      };

    } catch (error) {
      context.error(
        "checkSession error:",
        error
      );

      return {
        status: 500,
        jsonBody: {
          success: false,
          authenticated: false
        }
      };
    }
  }
});
