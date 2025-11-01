# Payment Gateway iframe Architecture - Proof of Concept

A simplified demonstration of how real-world payment gateways (like Stripe, PayPal, Razorpay) use iframe isolation to securely handle sensitive payment information which is mandatory for maintaining PCI DSS compliance. This project showcases fundamental web security concepts including Same-Origin Policy, iframe isolation, postMessage communication, and CORS.

## 🎯 What is this project?

This proof-of-concept demonstrates the **security architecture** used by payment gateway providers. It consists of two separate web applications:

1. **Merchant Website** (`localhost:3000`) - An e-commerce site that needs to collect payments
2. **Payment Gateway** (`localhost:3005`) - A payment processor (like Stripe) that handles sensitive card data

The key concept: **The merchant never directly accesses sensitive payment data**. Instead, the payment gateway runs in an isolated iframe, processes the card details securely, and returns only a safe **token** to the merchant.

## 🏗️ Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                    Browser (Chrome/Firefox/etc)                   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │          MERCHANT WEBSITE (localhost:3000)                 │   │
│  │                                                            │   │
│  │  Origin: http://localhost:3000                             │   │
│  │  JavaScript Context: Merchant's code                       │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────┐          │   │
│  │  │  Lazorpay SDK (loaded from payment gateway)  │          │   │
│  │  │  - Creates iframe dynamically                │          │   │
│  │  │  - Listens for postMessage from iframe       │          │   │
│  │  │  - Validates origin of messages              │          │   │
│  │  │  - Receives tokenized card data              │          │   │
│  │  └──────────────────────────────────────────────┘          │   │
│  │                        │                                   │   │
│  │                        │ SDK creates iframe                │   │
│  │                        ▼                                   │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  <iframe> (DYNAMICALLY CREATED BY SDK)               │  │   │
│  │  │  ╔════════════════════════════════════════════════╗  │  │   │
│  │  │  ║  PAYMENT GATEWAY (localhost:3005)              ║  │  │   │
│  │  │  ║                                                ║  │  │   │
│  │  │  ║  Origin: http://localhost:3005                 ║  │  │   │
│  │  │  ║  JavaScript Context: Payment gateway's code    ║  │  │   │
│  │  │  ║  Protected by: frame-ancestors CSP             ║  │  │   │
│  │  │  ║                                                ║  │  │   │
│  │  │  ║  ┌─────────────────────────────────────┐       ║  │  │   │
│  │  │  ║  │  Card Number Input: [4532...]       │       ║  │  │   │
│  │  │  ║  │  CVV Input: [123]                   │       ║  │  │   │
│  │  │  ║  │  [Pay Button]                       │       ║  │  │   │
│  │  │  ║  └─────────────────────────────────────┘       ║  │  │   │
│  │  │  ║                                                ║  │  │   │
│  │  │  ║  Variables (inaccessible from parent):         ║  │  │   │
│  │  │  ║  - cardNumberValue = "4532..."                 ║  │  │   │
│  │  │  ║  - cardCvvValue = "123"                        ║  │  │   │
│  │  │  ╚════════════════════════════════════════════════╝  │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                            │   │
│  │  Display: [Tokenised card details: 4532...|123]            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## 🔐 Browser Process Isolation (OS Level)

Modern browsers use **Site Isolation** to render different origins in separate OS-level processes. This provides security even if one site is compromised.

```
┌───────────────────────────────────────────────────────────────────────┐
│               Operating System (macOS/Linux/Windows)                  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │            Browser Main Process (Chrome/Firefox)             │     │
│  │  - Manages tabs, bookmarks, extensions                       │     │
│  │  - Coordinates renderer processes                            │     │
│  │  - Enforces security policies                                │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                          │                                            │
│           ┌──────────────┴──────────────┐                             │
│           │                             │                             │
│           ▼                             ▼                             │
│  ┌──────────────────────┐      ┌──────────────────────┐               │
│  │  Renderer Process 1  │      │  Renderer Process 2  │               │
│  │  (Sandboxed)         │      │  (Sandboxed)         │               │
│  ├──────────────────────┤      ├──────────────────────┤               │
│  │ Origin:              │      │ Origin:              │               │
│  │ localhost:3000       │      │ localhost:3005       │               │
│  │                      │      │                      │               │
│  │ DOM:                 │      │ DOM:                 │               │
│  │ - <h1>Merchant</h1>  │      │ - <input card-num>   │               │
│  │ - <iframe>           │      │ - <input cvv>        │               │
│  │ - <button>           │      │ - <button>Pay        │               │
│  │                      │      │                      │               │
│  │ JavaScript Heap:     │      │ JavaScript Heap:     │               │
│  │ - LazorpaySDK obj    │      │ - cardNumberValue    │               │
│  │ - onTokenReady()     │      │ - cardCvvValue       │               │
│  │ - tokenContainer     │      │ - payButton          │               │
│  │                      │      │                      │               │
│  │ Memory Space:        │      │ Memory Space:        │               │
│  │ 0x7F8A... - 0x7F9B...│      │ 0x8A2C... - 0x8B3D...│               │
│  │                      │      │                      │               │
│  │ ❌ CANNOT ACCESS →   │      │ ← ❌ CANNOT ACCESS    │               |
│  │    Process 2's       │      │    Process 1's       │               │
│  │    memory            │      │    memory            │               │
│  └──────────────────────┘      └──────────────────────┘               │
│           │                              │                            │
│           └──────────────┬───────────────┘                            │
│                          │                                            │
│                          ▼                                            │
│              ┌───────────────────────┐                                │
│              │   IPC (postMessage)   │                                │
│              │  Controlled by        │                                │
│              │  Browser Main Process │                                │
│              └───────────────────────┘                                │
└───────────────────────────────────────────────────────────────────────┘
```

### Key Points about Process Isolation:

1. **Separate Memory Spaces**: Each origin runs in its own process with isolated memory
2. **OS-Level Protection**: The operating system prevents processes from accessing each other's memory
3. **IPC Communication**: The only way to communicate is through browser-controlled Inter-Process Communication (postMessage)
4. **Sandboxing**: Renderer processes run with limited OS privileges
5. **Security Boundary**: Even if one process is compromised, the attacker cannot directly read another process's memory

## 📊 Communication Flow Diagram

```
┌────────────────┐                                  ┌─────────────────┐
│   MERCHANT     │                                  │ PAYMENT GATEWAY │
│  (Port 3000)   │                                  │   (Port 3005)   │
└────────────────┘                                  └─────────────────┘
        │                                                     │
        │ 1. Load SDK script from gateway                     │
        ├────────────────────────────────────────────────────>│
        │    <script src="http://localhost:3005/sdk.js">      │
        │                                                     │
        │ 2. Instantiate SDK with container & callback        │
        │    new LazorpaySDK(container, onTokenReady)         │
        │                                                     │
        │ 3. SDK dynamically creates iframe                   │
        │    iframe.src = "http://localhost:3005/cardFields"  │
        ├────────────────────────────────────────────────────>│
        │                                                     │
        │ 4. Load card fields in iframe                       │
        │    CSP validates: frame-ancestors                   │
        │<────────────────────────────────────────────────────┤
        │                                                     │
        │ 5. User enters card details in iframe               │
        │    (Merchant CANNOT access these inputs)            │
        │    cardNumberValue, cardCvvValue stored in          │
        │    payment gateway's origin only                    │
        │                                                     │
        │                                                     │ 6. User clicks Pay
        │                                                     │    button
        │                                                     │
        │ 7. postMessage (tokenized data)                     │
        │    { type: "tokenisedCardDetails",                  │
        │      value: "4532...|123" }                         │
        │<────────────────────────────────────────────────────┤
        │    Target origin: "http://localhost:3000"           │
        │                                                     │
        │ 8. SDK validates message origin                     │
        │    if (event.origin !== "http://localhost:3005")    │
        │       reject message                                │
        │                                                     │
        │ 9. SDK triggers callback: onTokenReady(token)       │
        │                                                     │
        │ 10. Display token on merchant page                  │
        │     "Tokenised card details: 4532...|123"           │
        │                                                     │
        │ 11. Merchant sends token to backend                 │
        │     (Backend processes payment with token)          │
        │                                                     │
```

## 🔒 Security Concepts Demonstrated

### 1. **Same-Origin Policy (SOP)**

The browser prevents JavaScript from one origin from accessing data from another origin.

**Demo in code:**

```javascript
// In merchant's index.js (localhost:3000)
const cardNumber = document.getElementById("card-number");
console.log(cardNumber); // null - element exists in iframe, not accessible!
```

Even though the card input field is visible on the page (inside the iframe), the merchant's JavaScript **cannot access it** because it belongs to a different origin (`localhost:3005`).

### 2. **iframe Isolation**

- **By default, browsers ALLOW cross-origin iframe embedding** (so merchant can embed payment gateway)
- But **Same-Origin Policy prevents** the parent from accessing iframe content
- This creates a secure sandbox for sensitive data
- **SDK dynamically creates iframe** - mimics real payment gateways like Stripe Elements
- **frame-ancestors CSP** on payment gateway prevents clickjacking attacks

### 3. **postMessage API**

Safe cross-origin communication controlled by the browser:

```javascript
// Payment Gateway (iframe) sends message
window.parent.postMessage(
  { type: "tokenisedCardDetails", value: token },
  "http://localhost:3000" // Target origin - explicit security
);

// Merchant's SDK receives and validates message
window.addEventListener("message", (event) => {
  if (event.origin !== "http://localhost:3005") {
    console.warn("Rejected message from unauthorized origin:", event.origin);
    return; // Origin validation - critical security!
  }
  // Process the token safely
});
```

### 4. **CORS (Cross-Origin Resource Sharing)**

Demonstrates how APIs can selectively allow cross-origin requests:

```javascript
// Blocked by default (no CORS headers)
fetch("http://localhost:3005/api/payment-blocked"); // ❌ Fails

// Allowed with CORS headers set on server
fetch("http://localhost:3005/api/payment-allowed"); // ✅ Works
// Server: cors("http://localhost:3000")
```

### 5. **Variable Isolation**

Variables in different origins are completely isolated:

```
Merchant's JavaScript (localhost:3000):
- Has access to: LazorpaySDK, onTokenReady, tokenisedDetailsContainer
- NO access to: cardNumberValue, cardCvvValue (in iframe)

Payment Gateway's JavaScript (localhost:3005):
- Has access to: cardNumberValue, cardCvvValue, payButton
- NO access to: merchant's variables
```

## 🚀 Project Structure

```
payment-gateway/
├── README.md                      # This comprehensive documentation
│
├── merchant/
│   ├── package.json
│   └── src/
│       ├── server.js              # Express server (port 3000)
│       │                          # - Sets CSP headers (script-src, frame-src)
│       └── public/
│           ├── index.html         # Merchant's webpage
│           │                      # - Loads SDK from payment gateway
│           │                      # - Contains container for iframe
│           └── index.js           # Merchant's client-side code
│                                  # - Initializes SDK
│                                  # - Demos Same-Origin Policy
│                                  # - Demos CORS
│
└── lazorpay-payment-gateway/
    ├── package.json
    └── src/
        ├── server.js              # Express server (port 3005)
        │                          # - Serves SDK and card fields
        │                          # - Sets frame-ancestors CSP
        │                          # - Implements CORS policies
        ├── sdk.js                 # LazorpaySDK class (loaded by merchant)
        │                          # - Dynamically creates iframe
        │                          # - Validates postMessage origin
        │                          # - Manages payment flow
        └── payment-card-fields/
            ├── index.html         # Payment form (loaded in iframe)
            │                      # - Card number & CVV inputs
            └── index.js           # Payment gateway's client-side code
                                   # - Runs in isolated origin
                                   # - Tokenizes & sends via postMessage
```

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/proofs-of-concepts.git
cd proofs-of-concepts/payment-gateway-security
```

### 2. Install Dependencies

You need to install dependencies for both applications. Open two terminal windows and navigate to payment-gateway-security repo in them:

In the first terminal window

```bash
# Install merchant dependencies
cd merchant
npm install
```

In the second terminal window

```bash
# Install payment gateway dependencies
cd lazorpay-payment-gateway
npm install
```

### 3. Start Both Servers

You'll need **two terminal windows**:

**Terminal 1 - Once you are in merchant folder**

```bash
npm run serve
```

You should see: `Merchant's website listening on port 3000`

**Terminal 2 - Once you are in payment-gateway folder**

```bash
npm run serve
```

You should see: `Lazorpay server listening on port 3005`

### 4. Open in Browser

Navigate to: `http://localhost:3000`

## 🧪 Testing the Security Features

### Test 1: Same-Origin Policy & Variable Isolation

1. Open browser DevTools (F12)
2. Go to Console tab
3. The merchant's `index.js` includes a demo that tries to access card fields:
   ```javascript
   const cardNumber = document.getElementById("card-number");
   console.log(cardNumber); // null - element exists in iframe's origin, not accessible!
   ```
4. **Result**: `null` - proving the merchant cannot access iframe elements due to Same-Origin Policy
5. **What this proves**: Even though the card input is visible on screen, JavaScript from the merchant's origin cannot read it

### Test 2: SDK Dynamic iframe Creation

1. Open DevTools → Elements tab
2. Look for the `<div id="payment-gateway-container"></div>`
3. **Notice**: The iframe is NOT in the original HTML source
4. The SDK creates it dynamically: `iframe.src = "http://localhost:3005/cardFields"`
5. **What this proves**: Real payment SDKs control the iframe creation, not the merchant

### Test 3: postMessage Communication with Origin Validation

1. Type a card number in the iframe: `4532123456789012`
2. Type a CVV: `123`
3. Open DevTools → Console (watch for security messages)
4. Click the **Pay** button inside the iframe
5. **Result**: Token appears on merchant page: `Tokenised card details: 4532123456789012|123`
6. **Check Console**: No unauthorized origin warnings (only localhost:3005 accepted)
7. **What this proves**: Safe cross-origin communication with strict origin validation

### Test 4: CORS Blocking

1. Click the **"Call payment API at /api/payment-blocked"** button
2. Open DevTools → Console tab
3. **Result**: CORS error - request is blocked
   ```
   Access to fetch at 'http://localhost:3005/api/payment-blocked' from origin
   'http://localhost:3000' has been blocked by CORS policy
   ```
4. **What this proves**: By default, browsers block cross-origin API requests

### Test 5: CORS Allowed

1. Click the **"Call payment API at /api/payment-allowed"** button
2. Open DevTools → Console tab
3. **Result**: Success! `{ message: "You'll only see this message if you're on allowed origins." }`
4. **What this proves**: Server can explicitly allow specific origins using CORS headers

### Test 6: CSP frame-ancestors (Clickjacking Protection)

1. Try to open `http://localhost:3005/cardFields` directly in browser
2. **Result**: Works fine (no parent frame)
3. Now try embedding it in an unauthorized iframe (change merchant port to 3001)
4. **Result**: Blocked! `frame-ancestors` CSP prevents unauthorized embedding
5. **What this proves**: Payment gateway controls which sites can embed its forms

## 💡 Key Takeaways

### What This Architecture Protects Against:

✅ **XSS on Merchant Site** - Even if attacker injects malicious code on merchant site, they cannot access payment data in iframe

✅ **Data Leakage** - Sensitive card data never touches merchant's JavaScript context

✅ **Man-in-the-Middle on Merchant** - Even if merchant's HTTPS is compromised, payment gateway has its own secure connection

✅ **Merchant Database Breach** - Merchant only stores tokens, not actual card data

### What This Architecture Does NOT Protect Against:

❌ **Physical Access** - If attacker has DevTools access on victim's machine, they can inspect the iframe

❌ **XSS on Payment Gateway** - If the payment gateway itself is compromised, protection fails

❌ **Phishing** - If attacker tricks user to enter details on fake payment gateway

### Real-World Payment Gateways:

This simplified demo mirrors how real payment processors work:

- **Stripe Elements**: Uses iframes for card inputs, returns tokens
- **PayPal Checkout**: Renders payment form in iframe
- **Razorpay**: Uses iframe isolation for card fields
- **Square Payment Form**: Tokenizes card data in isolated context

## 🔬 Learning Objectives

By exploring this project, you'll understand:

1. **Same-Origin Policy (SOP)** - How browsers isolate different origins to prevent unauthorized data access
2. **iframe Security** - How iframes create security boundaries for sensitive data
3. **postMessage API** - Safe cross-origin communication with origin validation
4. **CORS** - How servers control which origins can make API requests
5. **Content Security Policy (CSP)** - Preventing XSS attacks and clickjacking
   - `script-src` - Control which scripts can execute
   - `frame-src` - Control which iframes can be loaded
   - `frame-ancestors` - Control who can embed your content
6. **Process Isolation** - How browsers use OS-level processes for security
7. **SDK Architecture** - How payment SDKs dynamically create isolated payment forms
8. **PCI DSS Compliance** - Why payment gateways use this architecture
9. **Tokenization** - How sensitive data is replaced with safe tokens
10. **Origin Validation** - Critical security pattern for postMessage

## 🎓 Further Exploration

To extend your learning:

1. **Add HTTPS** - Use self-signed certificates for both servers
2. **Implement real tokenization** - Use crypto library instead of concatenation
3. **Add server-side validation** - Validate origin on payment gateway API
4. **Implement token expiration** - Tokens should expire after use
5. **Add styling** - Make it look like a real payment form
6. **Add 3D Secure / 2FA flow** - Implement additional authentication
7. **Test with Content Security Policy Report-Only mode** - Learn CSP without breaking functionality
8. **Add nonce to CSP** - For inline scripts security
9. **Implement SRI (Subresource Integrity)** - Verify SDK integrity
10. **Add rate limiting** - Prevent brute force attacks

## 📚 Additional Resources

- [MDN: Same-Origin Policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [MDN: postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Chrome Site Isolation](https://www.chromium.org/Home/chromium-security/site-isolation/)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
- [Stripe Elements Security](https://stripe.com/docs/security/guide#validating-pci-compliance)

## ⚠️ Disclaimer

This is a **proof-of-concept for educational purposes only**. It demonstrates security concepts but is NOT production-ready:

- No actual payment processing
- Simplified tokenization (not secure for real use)
- No HTTPS
- No server-side validation
- No encryption

**Never use this code in production!** Use established payment gateway SDKs like Stripe, PayPal, or Razorpay for real applications.

## 📝 License

ISC

## 👨‍💻 Author

Rahul Agarwal

## 🤝 Contributing

Feel free to explore, learn, and suggest improvements!
