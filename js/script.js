/*
  Battle Born Data
  Newsletter / Network Signup

  The Azure Function will eventually receive:

  Email:
  {
    "type": "email",
    "value": "person@example.com"
  }

  Phone:
  {
    "type": "phone",
    "value": "7025551234"
  }
*/


const FORM_ENDPOINT = "/api/saveEmail";


/*
  DOM ELEMENTS
*/

const form =
  document.getElementById("newsletterForm");

const contact =
  document.getElementById("contact");

const signupTypes =
  document.querySelectorAll(
    'input[name="signupType"]'
  );

const button =
  document.getElementById("submitButton");

const message =
  document.getElementById("message");

const successModal =
  document.getElementById("successModal");

const closeSuccessModal =
  document.getElementById("closeSuccessModal");

const successContact =
  document.getElementById("successContact");


/*
  MESSAGE DISPLAY
*/

function setMessage(text, type = "") {

  message.textContent = text;

  message.className =
    "message " + type;

}


/*
  GET CURRENT SIGNUP TYPE
*/

function getSignupType() {

  const selected =
    document.querySelector(
      'input[name="signupType"]:checked'
    );

  return selected
    ? selected.value
    : "email";

}


/*
  EMAIL VALIDATION
*/

function isValidEmail(value) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    .test(value);

}


/*
  PHONE VALIDATION

  Allows formatting such as:

  7025551234
  702-555-1234
  (702) 555-1234
  +1 702 555 1234
*/

function isValidPhone(value) {

  const digits =
    value.replace(/\D/g, "");

  return (
    digits.length >= 10 &&
    digits.length <= 15
  );

}


/*
  UPDATE INPUT FIELD

  This runs whenever the user switches
  between Email and Phone.
*/

function updateContactField() {

  const type = getSignupType();


  if (type === "phone") {

    contact.type = "tel";

    contact.autocomplete = "tel";

    contact.inputMode = "tel";

    contact.placeholder =
      "ENTER YOUR PHONE NUMBER";

    contact.setAttribute(
      "placeholder",
      "ENTER YOUR PHONE NUMBER"
    );

    contact.setAttribute(
      "aria-label",
      "Phone number"
    );

  } else {

    contact.type = "email";

    contact.autocomplete = "email";

    contact.inputMode = "email";

    contact.placeholder =
      "ENTER YOUR EMAIL ADDRESS";

    contact.setAttribute(
      "placeholder",
      "ENTER YOUR EMAIL ADDRESS"
    );

    contact.setAttribute(
      "aria-label",
      "Email address"
    );

  }


  /*
    Clear the old value when switching
    between email and phone.
  */

  contact.value = "";

  setMessage("");

}


/*
  WATCH EMAIL / PHONE RADIO BUTTONS
*/

signupTypes.forEach((radio) => {

  radio.addEventListener(
    "change",
    updateContactField
  );

});


/*
  SUCCESS MODAL
*/

function showSuccessModal(value) {

  successContact.textContent = value;

  successModal.hidden = false;

  closeSuccessModal.focus();

}


function hideSuccessModal() {

  successModal.hidden = true;

}


/*
  CLOSE BUTTON
*/

closeSuccessModal.addEventListener(
  "click",
  hideSuccessModal
);


/*
  CLICK OUTSIDE MODAL
*/

successModal.addEventListener(
  "click",
  (event) => {

    if (event.target === successModal) {

      hideSuccessModal();

    }

  }
);


/*
  ESCAPE KEY
*/

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      !successModal.hidden
    ) {

      hideSuccessModal();

    }

  }
);


/*
  FORM SUBMISSION
*/

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    /*
      Determine whether we're submitting
      an email or phone number.
    */

    const type =
      getSignupType();


    let value =
      contact.value.trim();


    /*
      Normalize email addresses.
    */

    if (type === "email") {

      value =
        value.toLowerCase();

    }


    /*
      EMPTY FIELD
    */

    if (!value) {

      if (type === "email") {

        setMessage(
          "Please enter your email address.",
          "error"
        );

      } else {

        setMessage(
          "Please enter your phone number.",
          "error"
        );

      }

      contact.focus();

      return;

    }


    /*
      EMAIL VALIDATION
    */

    if (
      type === "email" &&
      !isValidEmail(value)
    ) {

      setMessage(
        "Please enter a valid email address.",
        "error"
      );

      contact.focus();

      return;

    }


    /*
      PHONE VALIDATION
    */

    if (
      type === "phone" &&
      !isValidPhone(value)
    ) {

      setMessage(
        "Please enter a valid phone number.",
        "error"
      );

      contact.focus();

      return;

    }


    /*
      DISABLE BUTTON WHILE REQUEST RUNS
    */

    button.disabled = true;

    setMessage(
      "Joining the network…"
    );


    try {

      /*
        SEND TO AZURE FUNCTION
      */

      const response =
        await fetch(
          FORM_ENDPOINT,
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              type: type,

              value: value

            })

          }
        );


      /*
        HANDLE API ERROR
      */

      if (!response.ok) {

        throw new Error(
          "Newsletter request failed."
        );

      }


      /*
        SUCCESS
      */

      setMessage("");


      /*
        Reset the form.

        This also returns the radio
        selection to Email because Email
        is checked by default in the HTML.
      */

      form.reset();


      /*
        Restore the input to email mode.
      */

      updateContactField();


      /*
        Display what was actually submitted.
      */

      showSuccessModal(value);


    } catch (error) {

      console.error(
        "Newsletter signup error:",
        error
      );


      setMessage(
        "Something went wrong. Please try again in a moment.",
        "error"
      );

    } finally {

      button.disabled = false;

    }

  }
);


/*
  INITIALIZE FIELD

  Makes sure the input matches whichever
  radio button is selected when the page
  first loads.
*/

updateContactField();
