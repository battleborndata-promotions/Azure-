const { TableClient } = require("@azure/data-tables");

function getCookie(request, name) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      return valueParts.join("=");
    }
  }

  return null;
}

async function validateSession(request, context) {
  try {
    const sessionId = getCookie(
      request,
      "bb_session"
    );

    if (!sessionId) {
      return {
        valid: false,
        reason: "missing"
      };
    }

    const connectionString =
      process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      context.error(
        "Storage connection string is missing."
      );

      return {
        valid: false,
        reason: "configuration"
      };
    }

    const tableClient =
      TableClient.fromConnectionString(
        connectionString,
        "staffSessions"
      );

    let session;

    try {
      session = await tableClient.getEntity(
        "session",
        sessionId
      );
    } catch (error) {
      if (error.statusCode === 404) {
        return {
          valid: false,
          reason: "not_found"
        };
      }

      throw error;
    }

    const expiresAt =
      new Date(session.expiresAt);

    if (
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt <= new Date()
    ) {
      // Delete expired session if possible.
      try {
        await tableClient.deleteEntity(
          "session",
          sessionId
        );
      } catch (deleteError) {
        context.warn(
          "Unable to delete expired session:",
          deleteError
        );
      }

      return {
        valid: false,
        reason: "expired"
      };
    }

    return {
      valid: true,

      session: {
        id: sessionId,
        username: session.username,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt
      }
    };

  } catch (error) {
    context.error(
      "Session validation error:",
      error
    );

    return {
      valid: false,
      reason: "error"
    };
  }
}

module.exports = {
  validateSession
};
