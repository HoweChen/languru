// Example 5: Factory Method Pattern
// Goal: Encapsulate object creation logic.
//
// Scenario:
// You need to support multiple payment gateways (Stripe, PayPal, Crypto).
// The client code (CheckoutService) shouldn't know the details of how to initialize "Stripe".
// It just asks for a "PaymentProcessor".

// 1. Interface (The Product)
interface PaymentProcessor {
  process(amount: number): void;
}

// 2. Concrete Implementations
class StripeProcessor implements PaymentProcessor {
  process(amount: number) { console.log(`[Stripe] Charged $${amount} (Fee: $${amount * 0.03})`); }
}

class PayPalProcessor implements PaymentProcessor {
  process(amount: number) { console.log(`[PayPal] Charged $${amount} (Redirecting to paypal.com...)`); }
}

// 3. The Factory
// Contains the decision logic ("Switch Statement of Doom").
class PaymentFactory {
  static create(method: "stripe" | "paypal"): PaymentProcessor {
    // In a real app, this might read config, check feature flags, etc.
    if (method === "stripe") {
        return new StripeProcessor();
    } else if (method === "paypal") {
        return new PayPalProcessor();
    }
    
    throw new Error(`Unknown Payment Method: ${method}`);
  }
}

// --- Usage ---

// Client Code
// Notice it doesn't import 'StripeProcessor' directly.
function checkout(amount: number, userPreference: "stripe" | "paypal") {
  console.log(`\nInitiating Checkout for $${amount}...`);
  
  // Delegate creation to Factory
  const processor = PaymentFactory.create(userPreference);
  
  // Polymorphism: We don't care WHICH processor it is, as long as it follows the interface.
  processor.process(amount);
}

checkout(100, "stripe");
checkout(50, "paypal");

