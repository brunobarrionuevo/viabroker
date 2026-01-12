import Stripe from "stripe";
import { Router, Request, Response } from "express";
import * as db from "./db";
import { BROKVIA_PLANS, getPlanById } from "./products";

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export const stripeRouter = Router();

// Webhook endpoint - DEVE ser registrado ANTES do express.json()
stripeRouter.post(
  "/webhook",
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.error("[Stripe Webhook] Missing signature or webhook secret");
      return res.status(400).json({ error: "Missing signature or webhook secret" });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Detectar eventos de teste
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session);
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdate(subscription);
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionCanceled(subscription);
          break;
        }
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoiceFailed(invoice);
          break;
        }
        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }

    res.json({ received: true });
  }
);

// Criar checkout session para assinatura
export async function createCheckoutSession(
  companyId: number,
  planId: string,
  billingCycle: "monthly" | "yearly",
  userEmail: string,
  userName: string,
  origin: string
): Promise<string> {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error("Plano não encontrado");
  }

  const company = await db.getCompanyById(companyId);
  if (!company) {
    throw new Error("Empresa não encontrada");
  }

  // Buscar ou criar customer no Stripe
  let customerId = company.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      name: company.name,
      metadata: {
        company_id: companyId.toString(),
        user_name: userName,
      },
    });
    customerId = customer.id;
    // Salvar o customerId na empresa
    await db.updateCompany(companyId, { stripeCustomerId: customerId });
  }

  const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const interval = billingCycle === "yearly" ? "year" : "month";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    allow_promotion_codes: true,
    customer_email: customerId ? undefined : userEmail,
    client_reference_id: companyId.toString(),
    metadata: {
      company_id: companyId.toString(),
      plan_id: planId,
      billing_cycle: billingCycle,
      customer_email: userEmail,
      customer_name: userName,
    },
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: `Brokvia ${plan.name}`,
            description: plan.description,
            metadata: {
              plan_id: planId,
            },
          },
          unit_amount: price,
          recurring: {
            interval: interval,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/settings?payment=canceled`,
  });

  return session.url || "";
}

// Criar portal de gerenciamento de assinatura
export async function createBillingPortalSession(
  companyId: number,
  origin: string
): Promise<string> {
  const company = await db.getCompanyById(companyId);
  if (!company || !company.stripeCustomerId) {
    throw new Error("Empresa não possui customer no Stripe");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${origin}/dashboard/settings`,
  });

  return session.url;
}

// Handlers de webhook
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const companyId = parseInt(session.metadata?.company_id || session.client_reference_id || "0");
  const planId = session.metadata?.plan_id;
  const billingCycle = session.metadata?.billing_cycle as "monthly" | "yearly";

  if (!companyId || !planId) {
    console.error("[Stripe] Checkout completed but missing metadata");
    return;
  }

  console.log(`[Stripe] Checkout completed for company ${companyId}, plan ${planId}`);

  // Buscar o plano no banco
  const plans = await db.getAllPlans();
  const plan = plans.find(p => p.slug === planId);

  if (plan) {
    // Criar ou atualizar assinatura
    const existingSub = await db.getSubscriptionByCompanyId(companyId);
    
    if (existingSub) {
      await db.updateSubscription(existingSub.id, {
        planId: plan.id,
        status: "active",
        stripeSubscriptionId: session.subscription as string,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
      });
    } else {
      await db.createSubscription({
        companyId,
        planId: plan.id,
        status: "active",
        stripeSubscriptionId: session.subscription as string,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
      });
    }
  }

  // Registrar atividade
  await db.createActivityLog({
    actorType: "system",
    actorId: 0,
    action: "subscription_created",
    entityType: "company",
    entityId: companyId,
    details: { planId, billingCycle, sessionId: session.id },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const companyId = parseInt(subscription.metadata?.company_id || "0");
  
  if (!companyId) {
    // Tentar encontrar pelo customer
    const company = await findCompanyByStripeCustomer(subscription.customer as string);
    if (!company) {
      console.error("[Stripe] Subscription update but company not found");
      return;
    }
  }

  const existingSub = await db.getSubscriptionByCompanyId(companyId);
  if (existingSub) {
    await db.updateSubscription(existingSub.id, {
      status: mapStripeStatus(subscription.status) as "active" | "canceled" | "past_due" | "trialing" | "paused" | "expired",
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }

  console.log(`[Stripe] Subscription ${subscription.id} updated to status ${subscription.status}`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const companyId = parseInt(subscription.metadata?.company_id || "0");
  
  const existingSub = companyId 
    ? await db.getSubscriptionByCompanyId(companyId)
    : null;

  if (existingSub) {
    await db.updateSubscription(existingSub.id, {
      status: "canceled",
      canceledAt: new Date(),
    });

    await db.createActivityLog({
      actorType: "system",
      actorId: 0,
      action: "subscription_canceled",
      entityType: "company",
      entityId: companyId,
      details: { subscriptionId: subscription.id },
    });
  }

  console.log(`[Stripe] Subscription ${subscription.id} canceled`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const company = await findCompanyByStripeCustomer(customerId);
  
  if (company) {
    await db.createPayment({
      companyId: company.id,
      stripePaymentIntentId: (invoice as any).payment_intent as string,
      stripeInvoiceId: invoice.id,
      amount: (invoice.amount_paid / 100).toString(),
      currency: invoice.currency,
      status: "succeeded",
    });

    console.log(`[Stripe] Invoice ${invoice.id} paid for company ${company.id}`);
  }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const company = await findCompanyByStripeCustomer(customerId);
  
  if (company) {
    await db.createPayment({
      companyId: company.id,
      stripePaymentIntentId: (invoice as any).payment_intent as string,
      stripeInvoiceId: invoice.id,
      amount: (invoice.amount_due / 100).toString(),
      currency: invoice.currency,
      status: "failed",
    });

    // Atualizar status da assinatura
    const subscription = await db.getSubscriptionByCompanyId(company.id);
    if (subscription) {
      await db.updateSubscription(subscription.id, {
        status: "past_due",
      });
    }

    console.log(`[Stripe] Invoice ${invoice.id} failed for company ${company.id}`);
  }
}

// Helpers
async function findCompanyByStripeCustomer(customerId: string) {
  const companies = await db.getAllCompanies({ limit: 1000 });
  return companies.find(c => c.stripeCustomerId === customerId);
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    trialing: "trialing",
    incomplete: "pending",
    incomplete_expired: "expired",
    paused: "paused",
  };
  return statusMap[status] || "pending";
}
