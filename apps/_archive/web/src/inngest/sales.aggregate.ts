import { inngest } from "../lib/inngest";

export const aggregateDailySales = inngest.createFunction(
  { id: "aggregate-daily-sales", retries: 3, triggers: [{ event: "app/sales.created" }] },
  async ({ event, step }) => {
    const { storeId, saleId, amount } = event.data;

    // Step 1: Log the start of the process
    await step.run("log-start", async () => {
      console.log(`Starting aggregation for store ${storeId}, sale ${saleId}`);
      return { status: "started" };
    });

    // Step 2: Simulate heavy database aggregation
    const result = await step.run("aggregate-db", async () => {
      // In a real scenario, this would query the DB, sum sales, and update a materialized view
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { success: true, aggregatedAmount: amount };
    });

    return { message: "Daily sales aggregated", result };
  }
);
