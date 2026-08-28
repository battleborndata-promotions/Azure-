const loginForm =
  document.getElementById("loginForm");

const usernameInput =
  document.getElementById("username");

const passwordInput =
  document.getElementById("password");

const loginButton =
  document.getElementById("loginButton");

const loginMessage =
  document.getElementById("loginMessage");


loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    loginMessage.textContent = "";

    const username =
      usernameInput.value.trim();

    const password =
      passwordInput.value;

    if (!username || !password) {
      loginMessage.textContent =
        "Enter your username and password.";

      return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "SIGNING IN...";

    try {

      const response = await fetch(
        "/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            username,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {

        loginMessage.textContent =
          data.message ||
          "Unable to sign in.";

        return;
      }

      if (data.success) {

        window.location.href =
          "/dashboard.html";

        return;
      }

      loginMessage.textContent =
        "Unable to sign in.";

    } catch (error) {

      console.error(
        "Login request failed:",
        error
      );

      loginMessage.textContent =
        "Unable to connect. Please try again.";

    } finally {

      loginButton.disabled = false;

      loginButton.textContent =
        "SIGN IN";
    }

  }
);
