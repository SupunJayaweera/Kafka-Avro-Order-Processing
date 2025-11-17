# Kafka Order Processing System

A Kafka-based order processing system with Avro serialization, real-time aggregation, retry logic, and Dead Letter Queue (DLQ) support. Built with Node.js and TypeScript.

## 🚀 Features

- **Avro Serialization**: Messages are serialized using Apache Avro schema
- **Real-time Aggregation**: Calculates running average of order prices
- **Retry Logic**: Automatic retry mechanism for temporary failures
- **Dead Letter Queue (DLQ)**: Failed messages after max retries are sent to DLQ
- **Schema Registry**: Integration with Confluent Schema Registry
- **Monitoring**: Kafka UI for visual monitoring

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js (v16 or higher)
- npm or yarn

## 🏗️ Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│  Producer   │────────▶│   orders    │────────▶│   Consumer   │
│             │         │   (topic)   │         │              │
└─────────────┘         └─────────────┘         └──────┬───────┘
                                                       │
                        ┌─────────────┐                │
                        │ orders-retry│◀───────────────┤
                        │   (topic)   │                │
                        └─────────────┘                │
                                                       │
                        ┌─────────────┐                │
                        │ orders-dlq  │◀───────────────┘
                        │   (topic)   │
                        └─────────────┘
```

### Message Flow

1. **Producer** generates random orders and publishes to `orders` topic
2. **Consumer** processes messages from `orders` topic
3. If processing fails (temporary error):
   - Message is sent to `orders-retry` topic
   - Retry count is incremented
   - Consumer retries after delay
4. After max retries (3 attempts):
   - Message is sent to `orders-dlq` (Dead Letter Queue)
   - Error metadata is preserved

## 📦 Installation

### 1. Clone the repository

```bash
cd "d:\OneDrive - engug.ruh.ac.lk\Academic Semester_8\BigData\My-Assignment-1"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start Kafka infrastructure

```bash
docker-compose up -d
```

This will start:
- Zookeeper (port 2181)
- Kafka (port 9092)
- Schema Registry (port 8081)
- Kafka UI (port 8080)

### 4. Verify services are running

```bash
docker-compose ps
```

All services should be in "Up" state.

### 5. Access Kafka UI

Open your browser and navigate to:
```
http://localhost:8080
```

## 🎯 Usage

### Run Producer

The producer generates random orders and publishes them to Kafka:

```bash
npm run producer
```

**Producer Features:**
- Generates random orders with ID, product name, and price
- Serializes messages using Avro schema
- Publishes to `orders` topic
- Sends one order every 2 seconds (configurable)

**Example Output:**
```
✓ Producer connected to Kafka
✓ Schema registered with ID: 1
✓ Produced order: {"orderId":"1","product":"Laptop","price":1245.67}
✓ Produced order: {"orderId":"2","product":"Smartphone","price":599.99}
```

### Run Consumer

The consumer processes orders, calculates running average, and handles failures:

```bash
npm run consumer
```

**Consumer Features:**
- Deserializes Avro messages
- Calculates real-time running average of prices
- Implements retry logic (max 3 retries)
- Sends failed messages to DLQ
- 10% simulated failure rate for demonstration

**Example Output:**
```
✓ Consumer connected to Kafka
✓ Subscribed to topics: orders, orders-retry
✓ Consumer is running...

✓ Processing order: ID=1, Product=Laptop, Price=$1245.67

📊 Real-time Aggregation:
   Total Orders: 1
   Running Total: $1245.67
   Running Average: $1245.67

✓ Processing order: ID=2, Product=Smartphone, Price=$599.99

📊 Real-time Aggregation:
   Total Orders: 2
   Running Total: $1845.66
   Running Average: $922.83
```

### Run Both (Development Mode)

Open two terminal windows:

**Terminal 1 - Producer:**
```bash
npm run dev:producer
```

**Terminal 2 - Consumer:**
```bash
npm run dev:consumer
```

## 🔧 Configuration

Edit `src/config.ts` to customize:

```typescript
export const KAFKA_CONFIG = {
  brokers: ['localhost:9092'],
  clientId: 'order-processing-system',
};

export const CONSUMER_CONFIG = {
  groupId: 'order-consumer-group',
  maxRetries: 3,              // Number of retry attempts
  retryDelayMs: 2000,         // Delay between retries (ms)
};

export const PRODUCTS = [
  'Laptop', 'Smartphone', 'Tablet', // Add more products
];

export const PRICE_RANGE = {
  min: 10.0,
  max: 2000.0,
};
```

## 📊 Monitoring

### Kafka UI

Access the Kafka UI at `http://localhost:8080` to:
- View topics and messages
- Monitor consumer groups
- Inspect schemas in Schema Registry
- Check message flow

### Topics

- `orders` - Main topic for order messages
- `orders-retry` - Retry topic for failed messages
- `orders-dlq` - Dead Letter Queue for permanently failed messages

## 🧪 Testing Retry and DLQ

The consumer has a built-in 10% failure rate to demonstrate retry logic:

1. Start producer and consumer
2. Observe some messages failing (❌ Error processing message)
3. Watch retry attempts (⚠️ Sending to retry topic)
4. After 3 failed attempts, message goes to DLQ (❌ Max retries exceeded)
5. Check Kafka UI to see messages in `orders-dlq` topic

## 📁 Project Structure

```
My-Assignment-1/
├── docker-compose.yml          # Kafka infrastructure
├── package.json                # Dependencies
├── tsconfig.json              # TypeScript config
├── schemas/
│   └── order.avsc             # Avro schema definition
└── src/
    ├── config.ts              # Configuration
    ├── types.ts               # TypeScript types
    ├── producer.ts            # Producer implementation
    └── consumer.ts            # Consumer implementation
```

## 🛠️ Development

### Build TypeScript

```bash
npm run build
```

Compiled files will be in `dist/` directory.

### Run compiled code

```bash
node dist/producer.js
node dist/consumer.js
```

## 📝 Avro Schema

The order schema (`schemas/order.avsc`):

```json
{
  "type": "record",
  "name": "Order",
  "namespace": "com.bigdata.order",
  "fields": [
    {
      "name": "orderId",
      "type": "string",
      "doc": "Unique identifier for the order"
    },
    {
      "name": "product",
      "type": "string",
      "doc": "Name of the purchased item"
    },
    {
      "name": "price",
      "type": "float",
      "doc": "Price of the product"
    }
  ]
}
```

## 🔍 Key Implementation Details

### Producer
- Registers Avro schema with Schema Registry on startup
- Encodes messages using schema ID
- Generates random orders with configurable interval
- Includes timestamp in message headers

### Consumer
- Decodes Avro messages using Schema Registry
- Maintains running statistics (total, count, average)
- Tracks retry count in message headers
- Implements exponential backoff for retries
- Preserves error metadata in DLQ messages

### Retry Mechanism
1. Message processing fails → Extract retry count from headers
2. If retry count < maxRetries (3) → Send to retry topic with incremented count
3. Wait for retry delay (2 seconds)
4. Consumer processes from retry topic
5. If still failing after 3 attempts → Send to DLQ with error details

## 🚨 Troubleshooting

### Kafka not connecting
```bash
# Check if services are running
docker-compose ps

# Restart services
docker-compose restart
```

### Schema Registry errors
```bash
# Check Schema Registry logs
docker logs schema-registry

# Verify Schema Registry is accessible
curl http://localhost:8081/subjects
```

### Consumer not receiving messages
```bash
# Check if topics exist (in Kafka UI or CLI)
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list

# Reset consumer group (WARNING: starts from beginning)
docker exec -it kafka kafka-consumer-groups --bootstrap-server localhost:9092 --group order-consumer-group --reset-offsets --to-earliest --all-topics --execute
```

## 🧹 Cleanup

### Stop services
```bash
docker-compose down
```

### Remove all data (volumes)
```bash
docker-compose down -v
```

## 📚 Technologies Used

- **Kafka**: Apache Kafka 7.5.0
- **Schema Registry**: Confluent Schema Registry
- **Node.js**: Runtime environment
- **TypeScript**: Programming language
- **KafkaJS**: Kafka client for Node.js
- **Avro**: Schema serialization
- **Docker**: Containerization

## 🎓 Assignment Requirements Checklist

✅ Kafka-based system with producer and consumer  
✅ Avro serialization for all messages  
✅ Real-time aggregation (running average of prices)  
✅ Retry logic for temporary failures (max 3 retries)  
✅ Dead Letter Queue (DLQ) for permanently failed messages  
✅ Complete implementation in Node.js/TypeScript  
✅ Git repository with clear structure  
✅ Documentation (README)  

## 📄 License

This project is for academic purposes.

## 👤 Author

Big Data Assignment - Academic Semester 8
# Kafka-Avro-Order-Processing
