import { Kafka, Consumer, EachMessagePayload, logLevel } from "kafkajs";
import { SchemaRegistry } from "@kafkajs/confluent-schema-registry";
import {
  KAFKA_CONFIG,
  SCHEMA_REGISTRY_CONFIG,
  TOPICS,
  CONSUMER_CONFIG,
} from "./config";
import { Order, RetryMetadata } from "./types";

class OrderConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: any;
  private registry: SchemaRegistry;
  private runningTotal: number = 0;
  private orderCount: number = 0;
  private runningAverage: number = 0;

  constructor() {
    this.kafka = new Kafka({
      ...KAFKA_CONFIG,
      logLevel: logLevel.INFO,
    });

    this.consumer = this.kafka.consumer({
      groupId: CONSUMER_CONFIG.groupId,
    });

    this.producer = this.kafka.producer();
    this.registry = new SchemaRegistry(SCHEMA_REGISTRY_CONFIG);
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    await this.producer.connect();
    console.log("Consumer connected to Kafka");
  }

  private async decodeMessage(encodedValue: Buffer): Promise<Order> {
    try {
      const decodedValue = await this.registry.decode(encodedValue);
      return decodedValue as Order;
    } catch (error) {
      console.error("Error decoding message:", error);
      throw error;
    }
  }

  private updateRunningAverage(price: number): void {
    this.orderCount++;
    this.runningTotal += price;
    this.runningAverage = this.runningTotal / this.orderCount;

    console.log(`\nReal-time Aggregation:`);
    console.log(`   Total Orders: ${this.orderCount}`);
    console.log(`   Running Total: $${this.runningTotal.toFixed(2)}`);
    console.log(`   Running Average: $${this.runningAverage.toFixed(2)}\n`);
  }

  private getRetryCount(headers: any): number {
    if (!headers || !headers.retryCount) {
      return 0;
    }
    return parseInt(headers.retryCount.toString(), 10);
  }

  private async sendToRetryTopic(
    message: EachMessagePayload["message"],
    error: Error
  ): Promise<void> {
    const retryCount = this.getRetryCount(message.headers) + 1;

    console.log(
      `Sending to retry topic (attempt ${retryCount}/${CONSUMER_CONFIG.maxRetries})`
    );

    await this.producer.send({
      topic: TOPICS.ORDERS_RETRY,
      messages: [
        {
          key: message.key,
          value: message.value,
          headers: {
            ...message.headers,
            retryCount: retryCount.toString(),
            error: error.message,
            originalTopic: TOPICS.ORDERS,
            timestamp: Date.now().toString(),
          },
        },
      ],
    });

    // Wait before retrying
    await new Promise((resolve) =>
      setTimeout(resolve, CONSUMER_CONFIG.retryDelayMs)
    );
  }

  private async sendToDLQ(
    message: EachMessagePayload["message"],
    error: Error
  ): Promise<void> {
    console.log(`Max retries exceeded. Sending to DLQ...`);

    const metadata: RetryMetadata = {
      retryCount: this.getRetryCount(message.headers),
      originalTopic: TOPICS.ORDERS,
      error: error.message,
      timestamp: Date.now(),
    };

    await this.producer.send({
      topic: TOPICS.ORDERS_DLQ,
      messages: [
        {
          key: message.key,
          value: message.value,
          headers: {
            ...message.headers,
            dlqMetadata: JSON.stringify(metadata),
            finalError: error.message,
          },
        },
      ],
    });

    console.log(`Message sent to DLQ`);
  }

  private async processOrder(order: Order): Promise<void> {
    // Simulate potential processing errors (10% chance)
    if (Math.random() < 0.1) {
      throw new Error("Simulated temporary processing error");
    }

    // Process the order
    console.log(
      `Processing order: ID=${order.orderId}, Product=${order.product}, Price=$${order.price}`
    );

    // Update running average
    this.updateRunningAverage(order.price);
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      // Decode the Avro message
      const order = await this.decodeMessage(message.value!);

      // Process the order
      await this.processOrder(order);
    } catch (error) {
      const err = error as Error;
      console.error(`\nError processing message:`, err.message);

      const retryCount = this.getRetryCount(message.headers);

      if (retryCount < CONSUMER_CONFIG.maxRetries) {
        // Send to retry topic
        await this.sendToRetryTopic(message, err);
      } else {
        // Send to DLQ after max retries
        await this.sendToDLQ(message, err);
      }
    }
  }

  async subscribe(): Promise<void> {
    // Subscribe to main topic
    await this.consumer.subscribe({
      topic: TOPICS.ORDERS,
      fromBeginning: true,
    });

    // Subscribe to retry topic
    await this.consumer.subscribe({
      topic: TOPICS.ORDERS_RETRY,
      fromBeginning: false,
    });

    console.log(
      `Subscribed to topics: ${TOPICS.ORDERS}, ${TOPICS.ORDERS_RETRY}`
    );
  }

  async run(): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload) => {
        await this.handleMessage(payload);
      },
    });

    console.log("Consumer is running...\n");
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
    console.log("Consumer disconnected");
  }

  getStatistics() {
    return {
      totalOrders: this.orderCount,
      runningTotal: this.runningTotal,
      runningAverage: this.runningAverage,
    };
  }
}

// Main execution
async function main() {
  const consumer = new OrderConsumer();

  try {
    await consumer.connect();
    await consumer.subscribe();
    await consumer.run();
  } catch (error) {
    console.error("Error in consumer:", error);
    await consumer.disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down consumer...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down consumer...");
  process.exit(0);
});

main();
