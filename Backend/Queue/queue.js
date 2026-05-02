import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

export const mintQueue = new Queue("mintQueue", {
  connection: redisConnection
});

export const shipmentQueue = new Queue("shipmentQueue", {
  connection: redisConnection
});

export const redeemQueue = new Queue("redeemQueue", {
  connection: redisConnection
});

export const freezeQueue = new Queue("freezeQueue", {
  connection: redisConnection
});

export const recallQueue = new Queue("recallQueue", {
  connection: redisConnection
});