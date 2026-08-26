/*
      REAL COLLECTION:
      Set FORM_ENDPOINT to your backend/API endpoint, for example:
      const FORM_ENDPOINT = "/api/newsletter";

      The endpoint should accept:
      POST { "email": "person@example.com" }

      If left blank, this demo stores validated addresses in localStorage
      so the page works immediately without a backend.
    */
    const FORM_ENDPOINT = "";

    const form = document.getElementById("newsletterForm");
    const email = document.getElementById("email");
    const button = document.getElementById("submitButton");
    const message = document.getElementById("message");
    const successModal = document.getElementById("successModal");
    const closeSuccessModal = document.getElementById("closeSuccessModal");
    const successEmail = document.getElementById("successEmail");

    function setMessage(text, type = "") {
      message.textContent = text;
      message.className = "message " + type;
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
    }


    function showSuccessModal(value) {
      successEmail.textContent = value;
      successModal.hidden = false;
      closeSuccessModal.focus();
    }

    function hideSuccessModal() {
      successModal.hidden = true;
    }

    closeSuccessModal.addEventListener("click", hideSuccessModal);

    successModal.addEventListener("click", (event) => {
      if (event.target === successModal) hideSuccessModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !successModal.hidden) hideSuccessModal();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const value = email.value.trim().toLowerCase();

      if (!value) {
        setMessage("Please enter your email address.", "error");
        email.focus();
        return;
      }

      if (!isValidEmail(value)) {
        setMessage("Please enter a valid email address.", "error");
        email.focus();
        return;
      }

      button.disabled = true;
      setMessage("Joining the network…");

      try {
        if (FORM_ENDPOINT) {
          const response = await fetch(FORM_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: value })
          });

          if (!response.ok) {
            throw new Error("Newsletter request failed.");
          }
        } else {
          const existing = JSON.parse(
            localStorage.getItem("battleBornNewsletter") || "[]"
          );

          if (!existing.includes(value)) {
            existing.push(value);
            localStorage.setItem(
              "battleBornNewsletter",
              JSON.stringify(existing)
            );
          }
        }

        setMessage("");
        form.reset();
        showSuccessModal(value);
      } catch (error) {
        setMessage(
          "Something went wrong. Please try again in a moment.",
          "error"
        );
      } finally {
        button.disabled = false;
      }
    });
