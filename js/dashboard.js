/*
  Battle Born Promotions
  Staff Redemption Dashboard

  Session validation:
  GET /api/checkSession

  Live customer lookup:
  GET /api/findCustomer

  Live promotion redemption:
  POST /api/redeemPromotion
*/


/*
  SESSION CHECK
*/

async function requireStaffSession() {

  try {

    const response =
      await fetch(
        "/api/checkSession",
        {
          method: "GET",
          credentials: "same-origin"
        }
      );


    if (!response.ok) {

      window.location.replace(
        "/login.html"
      );

      return false;

    }


    const data =
      await response.json();


    if (
      !data.authenticated
    ) {

      window.location.replace(
        "/login.html"
      );

      return false;

    }


    return true;


  } catch (error) {

    console.error(
      "Session check failed:",
      error
    );


    window.location.replace(
      "/login.html"
    );


    return false;

  }

}


/*
  PAGE ELEMENTS
*/

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


const lookupForm =
  document.getElementById(
    "lookupForm"
  );

const lookupInput =
  document.getElementById(
    "lookupInput"
  );

const searchButton =
  document.getElementById(
    "searchButton"
  );

const message =
  document.getElementById(
    "message"
  );

const resultCard =
  document.getElementById(
    "resultCard"
  );

const customerValue =
  document.getElementById(
    "customerValue"
  );

const customerType =
  document.getElementById(
    "customerType"
  );

const statusPill =
  document.getElementById(
    "statusPill"
  );

const statusText =
  document.getElementById(
    "statusText"
  );

const redeemedAt =
  document.getElementById(
    "redeemedAt"
  );

const redeemButton =
  document.getElementById(
    "redeemButton"
  );

const modalBackdrop =
  document.getElementById(
    "modalBackdrop"
  );

const cancelRedeem =
  document.getElementById(
    "cancelRedeem"
  );

const confirmRedeem =
  document.getElementById(
    "confirmRedeem"
  );


let currentCustomer = null;


/*
  MESSAGE DISPLAY
*/

function setMessage(
  text,
  type = ""
) {

  message.textContent = text;

  message.className =
    "hint " + type;

}


/*
  FORMAT REDEMPTION DATE
*/

function formatDate(
  value
) {

  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();

}


/*
  CUSTOMER DISPLAY
*/

function renderCustomer(
  customer
) {

  currentCustomer = customer;


  /*
    CUSTOMER INFO
  */

  customerValue.textContent =
    customer.value || "—";


  if (
    customer.type === "phone"
  ) {

    customerType.textContent =
      "Phone";

  } else {

    customerType.textContent =
      "Email";

  }


  /*
    DISPLAY RESULT CARD
  */

  resultCard.classList.add(
    "visible"
  );


  /*
    PROMOTION ALREADY USED
  */

  if (
    customer.promotionUsed
  ) {

    statusPill.classList.add(
      "used"
    );

    statusText.textContent =
      "Already Used";


    redeemButton.textContent =
      "Already Redeemed";

    redeemButton.disabled =
      true;

    redeemButton.classList.add(
      "used"
    );


    const formattedDate =
      formatDate(
        customer.promotionUsedAt
      );


    if (formattedDate) {

      redeemedAt.textContent =
        "Redeemed: " +
        formattedDate;

    } else {

      redeemedAt.textContent =
        "Promotion already redeemed";

    }


    redeemedAt.classList.add(
      "visible"
    );

  }


  /*
    PROMOTION AVAILABLE
  */

  else {

    statusPill.classList.remove(
      "used"
    );

    statusText.textContent =
      "Available";


    redeemButton.textContent =
      "Mark Promotion as Used";

    redeemButton.disabled =
      false;

    redeemButton.classList.remove(
      "used"
    );


    redeemedAt.textContent =
      "";

    redeemedAt.classList.remove(
      "visible"
    );

  }

}


/*
  CLEAR RESULT
*/

function clearResult() {

  currentCustomer = null;

  resultCard.classList.remove(
    "visible"
  );

}


/*
  CUSTOMER LOOKUP
*/

lookupForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const searchValue =
      lookupInput.value.trim();


    /*
      VALIDATION
    */

    if (!searchValue) {

      setMessage(
        "Enter an email address or phone number.",
        "error"
      );

      clearResult();

      return;

    }


    /*
      SEARCHING STATE
    */

    searchButton.disabled =
      true;

    setMessage(
      "Searching…"
    );

    clearResult();


    try {

      /*
        CALL AZURE FUNCTION
      */

      const response =
        await fetch(

          "/api/findCustomer?value=" +

          encodeURIComponent(
            searchValue
          ),

          {
            credentials: "same-origin"
          }

        );


      /*
        SESSION EXPIRED / NOT LOGGED IN
      */

      if (
        response.status === 401
      ) {

        window.location.replace(
          "/login.html"
        );

        return;

      }


      /*
        CUSTOMER NOT FOUND
      */

      if (
        response.status === 404
      ) {

        setMessage(
          "No customer found.",
          "error"
        );

        return;

      }


      /*
        OTHER API ERROR
      */

      if (!response.ok) {

        throw new Error(
          "Customer lookup failed."
        );

      }


      /*
        READ RESPONSE
      */

      const data =
        await response.json();


      if (
        !data.success ||
        !data.customer
      ) {

        throw new Error(
          "Invalid customer response."
        );

      }


      /*
        SUCCESS
      */

      setMessage("");

      renderCustomer(
        data.customer
      );


    } catch (error) {

      console.error(
        "Customer lookup error:",
        error
      );


      setMessage(
        "Unable to search right now. Please try again.",
        "error"
      );


      clearResult();


    } finally {

      searchButton.disabled =
        false;

    }

  }
);


/*
  OPEN REDEMPTION MODAL
*/

redeemButton.addEventListener(
  "click",
  () => {

    if (
      !currentCustomer ||
      currentCustomer.promotionUsed
    ) {

      return;

    }


    modalBackdrop.hidden =
      false;

  }
);


/*
  CANCEL REDEMPTION
*/

cancelRedeem.addEventListener(
  "click",
  () => {

    modalBackdrop.hidden =
      true;

  }
);


/*
  CONFIRM REDEMPTION
*/

confirmRedeem.addEventListener(
  "click",
  async () => {

    if (!currentCustomer) {
      return;
    }


    /*
      DISABLE BUTTON WHILE
      AZURE PROCESSES REQUEST
    */

    confirmRedeem.disabled =
      true;


    setMessage(
      "Redeeming promotion…"
    );


    try {

      /*
        CALL REDEMPTION API
      */

      const response =
        await fetch(
          "/api/redeemPromotion",
          {

            method: "POST",

            credentials: "same-origin",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              partitionKey:
                currentCustomer.partitionKey,

              rowKey:
                currentCustomer.rowKey

            })

          }
        );


      /*
        SESSION EXPIRED / NOT LOGGED IN
      */

      if (
        response.status === 401
      ) {

        window.location.replace(
          "/login.html"
        );

        return;

      }


      /*
        READ RESPONSE BODY
      */

      let data = {};

      try {

        data =
          await response.json();

      } catch (error) {

        data = {};

      }


      /*
        PROMOTION WAS ALREADY USED

        Backend returns 409.
      */

      if (
        response.status === 409
      ) {

        currentCustomer.promotionUsed =
          true;

        currentCustomer.promotionUsedAt =
          data.promotionUsedAt ||
          currentCustomer.promotionUsedAt ||
          null;


        modalBackdrop.hidden =
          true;


        renderCustomer(
          currentCustomer
        );


        setMessage(
          "This promotion was already used."
        );


        return;

      }


      /*
        OTHER API ERROR
      */

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Redemption failed."
        );

      }


      /*
        SUCCESS

        Update browser state using
        the values returned by Azure.
      */

      currentCustomer.promotionUsed =
        true;

      currentCustomer.promotionUsedAt =
        data.promotionUsedAt ||
        new Date().toISOString();


      /*
        CLOSE MODAL
      */

      modalBackdrop.hidden =
        true;


      /*
        IMMEDIATELY UPDATE UI
      */

      renderCustomer(
        currentCustomer
      );


      setMessage(
        "Promotion redeemed successfully."
      );


    } catch (error) {

      console.error(
        "Promotion redemption error:",
        error
      );


      setMessage(
        "Unable to redeem promotion. Please try again.",
        "error"
      );


    } finally {

      confirmRedeem.disabled =
        false;

    }

  }
);


/*
  CLICK OUTSIDE MODAL
*/

modalBackdrop.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      modalBackdrop
    ) {

      modalBackdrop.hidden =
        true;

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
      !modalBackdrop.hidden
    ) {

      modalBackdrop.hidden =
        true;

    }

  }
);


/*
  LOG OUT
*/

logoutButton.addEventListener(
  "click",
  async () => {

    logoutButton.disabled = true;
    logoutButton.textContent = "LOGGING OUT...";

    try {

      const response =
        await fetch(
          "/api/logout",
          {
            method: "POST",
            credentials: "same-origin"
          }
        );


      if (!response.ok) {
        throw new Error(
          "Logout failed."
        );
      }


      window.location.replace(
        "/login.html"
      );


    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

      setMessage(
        "Unable to log out. Please try again.",
        "error"
      );

      logoutButton.disabled = false;
      logoutButton.textContent = "LOG OUT";

    }

  }
);

/*
  INITIAL STAFF SESSION CHECK
*/

requireStaffSession();
