/*
  Battle Born Promotions
  Staff Redemption Dashboard

  Customer lookup is live.

  Redemption is NOT connected
  to Azure yet.
*/


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

    redeemButton.disabled = true;

    redeemButton.classList.add(
      "used"
    );


    /*
      SHOW REDEMPTION TIME
    */

    if (
      customer.promotionUsedAt
    ) {

      const usedDate =
        new Date(
          customer.promotionUsedAt
        );

      redeemedAt.textContent =
        "Redeemed: " +
        usedDate.toLocaleString();

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

    redeemButton.disabled = false;

    redeemButton.classList.remove(
      "used"
    );


    redeemedAt.textContent = "";

    redeemedAt.classList.remove(
      "visible"
    );

  }

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

      resultCard.classList.remove(
        "visible"
      );

      return;

    }


    /*
      SEARCHING STATE
    */

    searchButton.disabled = true;

    setMessage(
      "Searching…"
    );

    resultCard.classList.remove(
      "visible"
    );


    try {

      /*
        CALL AZURE FUNCTION
      */

      const response =
        await fetch(

          "/api/findCustomer?value=" +

          encodeURIComponent(
            searchValue
          )

        );


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

        currentCustomer = null;

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


      resultCard.classList.remove(
        "visible"
      );


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

  This is intentionally not
  connected to Azure yet.

  Next step:
  /api/redeemPromotion
*/

confirmRedeem.addEventListener(
  "click",
  () => {

    modalBackdrop.hidden =
      true;


    setMessage(
      "Redemption API is not connected yet."
    );

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
