export interface Order {
  orderId: string;
  product: string;
  price: number;
}

export interface OrderMessage {
  key: string;
  value: Order;
  headers?: Record<string, string>;
}

export interface RetryMetadata {
  retryCount: number;
  originalTopic: string;
  error: string;
  timestamp: number;
}
