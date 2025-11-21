import { Kafka } from "kafkajs";
import { SchemaRegistry } from "@kafkajs/confluent-schema-registry";
import * as fs from "fs";
import * as path from "path";
import { KAFKA_CONFIG, SCHEMA_REGISTRY_CONFIG, TOPICS } from "./config";

/**
 * This script manually sends a few messages to the DLQ for demonstration purposes
 */
async function sendTestMessagesToDLQ() {
  const kafka = new Kafka(KAFKA_CONFIG);
  const producer = kafka.producer();
  const registry = new SchemaRegistry(SCHEMA_REGISTRY_CONFIG);

  try {
    await producer.connect();
    console.log("✓ Connected to Kafka");

    // Register schema
    const schemaPath = path.join(__dirname, "..", "schemas", "order.avsc");
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
    const { id } = await registry.register(schema);
    console.log(`✓ Schema registered with ID: ${id}`);

    // Create test orders that "failed"
    const failedOrders = [
      {
        orderId: "DLQ-TEST-001",
        product: "Failed Laptop",
        price: 999.99,
      },
      {
        orderId: "DLQ-TEST-002",
        product: "Failed Smartphone",
        price: 599.99,
      },
      {
        orderId: "DLQ-TEST-003",
        product: "Failed Tablet",
        price: 399.99,
      },
    ];

    console.log("\n📤 Sending test messages to DLQ...\n");

    for (const order of failedOrders) {
      const encodedValue = await registry.encode(id, order);

      await producer.send({
        topic: TOPICS.ORDERS_DLQ,
        messages: [
          {
            key: order.orderId,
            value: encodedValue,
            headers: {
              dlqMetadata: JSON.stringify({
                retryCount: 3,
                originalTopic: TOPICS.ORDERS,
                error: "Manual test - demonstrating DLQ functionality",
                timestamp: Date.now(),
              }),
              finalError: "Max retries exceeded during test",
              timestamp: Date.now().toString(),
            },
          },
        ],
      });

      console.log(`✓ Sent to DLQ: ${JSON.stringify(order)}`);
    }

    console.log("\n✅ Test messages sent to DLQ successfully!");
    console.log(
      `\nYou can now view them in Kafka UI at: http://localhost:8080`
    );
    console.log(`Topic: ${TOPICS.ORDERS_DLQ}\n`);

    await producer.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

sendTestMessagesToDLQ();
