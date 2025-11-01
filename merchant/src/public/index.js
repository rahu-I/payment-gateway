/** ************ Creating and loading the Payment Gateway sdk ************ */
const paymentGatewayContainer = document.getElementById(
  "payment-gateway-container"
);
const tokenisedDetailsContainer = document.getElementById(
  "tokenised-details-container"
);

const onTokenReady = (token) => {
  tokenisedDetailsContainer.innerHTML = `Tokenised card details: ${token}`;
};

const paymentGatewaySDK = new LazorpaySDK(
  paymentGatewayContainer,
  onTokenReady
);

/** *********************************************************************** */

/** ************ Demo of resource isolation (same-origin policy) ************ */
const cardNumber = document.getElementById("card-number");
console.log(cardNumber); // null - element exists in iframe's origin, not accessible!

const cardCvv = document.getElementById("card-cvv");
console.log(cardCvv); // null - element exists in iframe, not accessible!

/** *********************************************************************** */

/** ************ Demo of cross-origin request blocking. ************ */

const callPaymentBlockedApiButton = document.getElementById(
  "call-payment-blocked-api"
);
callPaymentBlockedApiButton.addEventListener("click", () => {
  // Cross-origin request. will be blocked by the browser under same-origin policy.
  fetch("http://localhost:3005/api/payment-blocked")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    });
});

const callPaymentAllowedApiButton = document.getElementById(
  "call-payment-allowed-api"
);
callPaymentAllowedApiButton.addEventListener("click", () => {
  // Cross-origin request. will be allowed by the browser as the api explicitly allows the merchant's origin.
  fetch("http://localhost:3005/api/payment-allowed")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    });
});

/** *********************************************************************** */
