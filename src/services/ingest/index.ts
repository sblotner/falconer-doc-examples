import express from "express";
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";

const app = express();
const PORT = process.env.PORT || 3000;

const QUEUE_URL = process.env.QUEUE_URL!;
const DATABASE_URL = process.env.DATABASE_URL!;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "10");

const sqs = new SQSClient({ region: process.env.AWS_REGION || "us-east-1" });

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ingest" });
});

async function pollQueue() {
  const command = new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: BATCH_SIZE,
    WaitTimeSeconds: 20,
  });

  const response = await sqs.send(command);
  const messages = response.Messages || [];

  for (const message of messages) {
    try {
      const payload = JSON.parse(message.Body!);
      console.log(`[ingest] Processing message: ${message.MessageId}`);
      // TODO: write payload to database
      await deleteMessage(message.ReceiptHandle!);
    } catch (err) {
      console.error(`[ingest] Failed to process message ${message.MessageId}:`, err);
    }
  }
}

async function deleteMessage(receiptHandle: string) {
  await sqs.send(new DeleteMessageCommand({ QueueUrl: QUEUE_URL, ReceiptHandle: receiptHandle }));
}

app.listen(PORT, () => {
  console.log(`[ingest] Service running on port ${PORT}`);
  console.log(`[ingest] Queue: ${QUEUE_URL}`);
  console.log(`[ingest] Database: ${DATABASE_URL}`);
  setInterval(pollQueue, 5000);
});
