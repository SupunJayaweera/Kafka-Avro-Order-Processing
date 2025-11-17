import { Kafka, Producer, logLevel } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import * as fs from 'fs';
import * as path from 'path';
import { KAFKA_CONFIG, SCHEMA_REGISTRY_CONFIG, TOPICS, PRODUCTS, PRICE_RANGE } from './config';
import { Order } from './types';

class OrderProducer {
  private kafka: Kafka;
  private producer: Producer;
  private registry: SchemaRegistry;
  private schemaId: number | null = null;

  constructor() {
    this.kafka = new Kafka({
      ...KAFKA_CONFIG,
      logLevel: logLevel.INFO,
    });

    this.producer = this.kafka.producer();
    this.registry = new SchemaRegistry(SCHEMA_REGISTRY_CONFIG);
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    console.log('✓ Producer connected to Kafka');

    // Register Avro schema
    await this.registerSchema();
  }

  private async registerSchema(): Promise<void> {
    const schemaPath = path.join(__dirname, '..', 'schemas', 'order.avsc');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    try {
      const { id } = await this.registry.register(schema);
      this.schemaId = id;
      console.log(`✓ Schema registered with ID: ${id}`);
    } catch (error) {
      console.error('Error registering schema:', error);
      throw error;
    }
  }

  private generateRandomOrder(orderId: number): Order {
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const price = parseFloat(
      (Math.random() * (PRICE_RANGE.max - PRICE_RANGE.min) + PRICE_RANGE.min).toFixed(2)
    );

    return {
      orderId: orderId.toString(),
      product,
      price,
    };
  }

  async produceOrder(orderId: number): Promise<void> {
    const order = this.generateRandomOrder(orderId);

    try {
      // Encode the message using Avro schema
      const encodedValue = await this.registry.encode(this.schemaId!, order);

      await this.producer.send({
        topic: TOPICS.ORDERS,
        messages: [
          {
            key: order.orderId,
            value: encodedValue,
            headers: {
              timestamp: Date.now().toString(),
            },
          },
        ],
      });

      console.log(`✓ Produced order: ${JSON.stringify(order)}`);
    } catch (error) {
      console.error('Error producing message:', error);
      throw error;
    }
  }

  async produceOrders(count: number, intervalMs: number = 1000): Promise<void> {
    console.log(`\nStarting to produce ${count} orders with ${intervalMs}ms interval...\n`);

    for (let i = 1; i <= count; i++) {
      await this.produceOrder(i);
      
      if (i < count) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    console.log(`\n✓ Finished producing ${count} orders`);
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    console.log('✓ Producer disconnected');
  }
}

// Main execution
async function main() {
  const producer = new OrderProducer();

  try {
    await producer.connect();

    // Produce orders continuously
    // You can modify this to produce a specific number or run indefinitely
    const ordersPerBatch = 10;
    const intervalMs = 2000; // 2 seconds between orders
    
    let orderCounter = 1;
    
    while (true) {
      await producer.produceOrder(orderCounter);
      orderCounter++;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

  } catch (error) {
    console.error('Error in producer:', error);
    await producer.disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down producer...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down producer...');
  process.exit(0);
});

main();
