# Kafka-Avro-Order-Processing

A production-ready Kafka-based order processing system with Avro serialization, real-time aggregation, retry logic, and Dead Letter Queue (DLQ) support. Built with Node.js and TypeScript.

## 📦 Installation & Setup

Follow these steps to set up the project on your local machine:

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/SupunJayaweera/Kafka-Avro-Order-Processing.git

# Navigate to the project directory
cd Kafka-Avro-Order-Processing
```

### Install Node.js Dependencies

```bash
# Install all required npm packages
npm install
```

This will install:

- `kafkajs` - Kafka client for Node.js
- `@kafkajs/confluent-schema-registry` - Schema Registry client
- `avsc` - Avro serialization library
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution engine
- And other development dependencies

### Verify Docker Installation

```bash
# Check Docker version
docker --version
# Expected: Docker version 20.10.x or higher

# Check Docker Compose version
docker-compose --version
# Expected: Docker Compose version 2.x or higher
```

If Docker is not installed, please install Docker Desktop from the prerequisites section.

### Start Kafka Infrastructure

````bash
# Start all services in detached mode
docker-compose up -d


### Step 5: Verify Services are Running

```bash
# Check status of all services
docker-compose ps
````

### Verify Kafka UI Access

Open the web browser and navigate to:

```
http://localhost:8080
```

**Start Producer (Terminal 1)**

   ```bash
   npm run producer
   ```

**Start Consumer (Terminal 2)**

   ```bash
   npm run consumer
   ```


