export const KAFKA_CONFIG = {
  brokers: ["localhost:9092"],
  clientId: "order-processing-system",
};

export const SCHEMA_REGISTRY_CONFIG = {
  host: "http://localhost:8081",
};

export const TOPICS = {
  ORDERS: "orders",
  ORDERS_RETRY: "orders-retry",
  ORDERS_DLQ: "orders-dlq",
};

export const CONSUMER_CONFIG = {
  groupId: "order-consumer-group",
  maxRetries: 3,
  retryDelayMs: 2000,
};

export const PRODUCTS = [
  "Laptop",
  "Smartphone",
  "Tablet",
  "Headphones",
  "Monitor",
  "Keyboard",
  "Mouse",
  "Webcam",
  "Speaker",
  "Smartwatch",
];

export const PRICE_RANGE = {
  min: 10.0,
  max: 2000.0,
};
