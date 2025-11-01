/** This script and the index.html file rendering and manage the card fields
 *  They run on the Payment Gateway's origin (localhost:3005).
 * */
const cardNumber = document.getElementById("card-number");
const cardCvv = document.getElementById("card-cvv");
const payButton = document.getElementById("pay-button");

let cardNumberValue = "";
let cardCvvValue = "";

cardNumber.addEventListener("input", (e) => {
  cardNumberValue = e.target.value;
});

cardCvv.addEventListener("input", (e) => {
  cardCvvValue = e.target.value;
});

payButton.addEventListener("click", () => {
  // obviously, this is not how we would tokenize the card details in a real-world scenario.
  // Assume we have a backend API that can tokenize the card details securely.
  const tokenisedCardDetails = cardNumberValue + "|" + cardCvvValue;
  window.parent.postMessage(
    { type: "tokenisedCardDetails", value: tokenisedCardDetails },
    "http://localhost:3000"
  );
});
