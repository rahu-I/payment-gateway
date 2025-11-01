/** SDK responsible for creating and loading the iframe and listening for messages from the iframe.
 * Loaded by and IN the merchant's origin (localhost:3000).
 */
class LazorpaySDK {
  constructor(iframeContainer, tokenReadyCallback) {
    this.iframeContainer = iframeContainer;
    this.tokenReadyCallback = tokenReadyCallback;

    console.log("Lazorpay SDK Loaded.");

    this.createAndLoadIframe();

    // Listen for messages from the iframe.
    window.addEventListener("message", (event) => {
      // Only process messages that look like they're intended for this SDK
      if (!event.data || typeof event.data !== "object") {
        return; // Ignore non-object messages (likely from extensions)
      }

      // Check if this message is intended for our SDK
      if (event.data.type === "tokenisedCardDetails") {
        // Now validate the origin
        if (event.origin !== "http://localhost:3005") {
          console.warn(
            "⚠️ Security: Rejected tokenized card details from unauthorized origin:",
            event.origin
          );
          return;
        }
        // Origin validated - process the token
        this.onTokenReady(event.data.value);
      }
      // Silently ignore other message types (extensions, devtools, etc.)
    });
  }

  onTokenReady(token) {
    this.tokenReadyCallback(token);
  }

  createAndLoadIframe() {
    const iframe = document.createElement("iframe");
    iframe.src = "http://localhost:3005/cardFields";
    iframe.id = "lazorpay-card-fields-iframe";
    this.iframeContainer.appendChild(iframe);
  }
}
