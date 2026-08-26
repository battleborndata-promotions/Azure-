const { app } = require("@azure/functions");

app.http("saveEmail", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "saveEmail",
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const email = body?.email?.trim();

      if (!email) {
        return {
          status: 400,
          jsonBody: { success: false, message: "Email is required." }
        };
      }

      context.log(`Received newsletter signup for: ${email}`);

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: "Email received successfully.",
          email
        }
      };
    } catch (error) {
      context.error("saveEmail error:", error);
      return {
        status: 400,
        jsonBody: { success: false, message: "Invalid request." }
      };
    }
  }
});
