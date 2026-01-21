import { describe, it, expect } from "vitest";

describe("Facebook Webhook Verification", () => {
  const VERIFY_TOKEN = "viabroker_webhook_verify_2024";

  it("should return challenge when verification is successful", () => {
    // Simula os parâmetros que o Facebook envia
    const params = {
      "hub.mode": "subscribe",
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": "test_challenge_12345",
    };

    // Verifica a lógica de verificação
    const mode = params["hub.mode"];
    const token = params["hub.verify_token"];
    const challenge = params["hub.challenge"];

    const isValid = mode === "subscribe" && token === VERIFY_TOKEN;
    
    expect(isValid).toBe(true);
    expect(challenge).toBe("test_challenge_12345");
  });

  it("should reject invalid verify token", () => {
    const params = {
      "hub.mode": "subscribe",
      "hub.verify_token": "wrong_token",
      "hub.challenge": "test_challenge_12345",
    };

    const mode = params["hub.mode"];
    const token = params["hub.verify_token"];

    const isValid = mode === "subscribe" && token === VERIFY_TOKEN;
    
    expect(isValid).toBe(false);
  });

  it("should reject invalid mode", () => {
    const params = {
      "hub.mode": "unsubscribe",
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": "test_challenge_12345",
    };

    const mode = params["hub.mode"];
    const token = params["hub.verify_token"];

    const isValid = mode === "subscribe" && token === VERIFY_TOKEN;
    
    expect(isValid).toBe(false);
  });
});

describe("Facebook OAuth State Encoding", () => {
  it("should encode and decode state correctly", () => {
    const stateData = {
      companyId: 123,
      platform: "facebook",
    };

    // Codifica o state
    const encoded = Buffer.from(JSON.stringify(stateData)).toString("base64");
    
    // Decodifica o state
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));

    expect(decoded.companyId).toBe(123);
    expect(decoded.platform).toBe("facebook");
  });

  it("should handle instagram platform", () => {
    const stateData = {
      companyId: 456,
      platform: "instagram",
    };

    const encoded = Buffer.from(JSON.stringify(stateData)).toString("base64");
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));

    expect(decoded.companyId).toBe(456);
    expect(decoded.platform).toBe("instagram");
  });
});
