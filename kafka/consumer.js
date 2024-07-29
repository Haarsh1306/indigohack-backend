const { Kafka } = require("kafkajs");
const sendEmail = require("../email");

const TOPIC = "indigohack-email";

const kafka = new Kafka({
  clientId: "indigohack",
  brokers: ["pkc-41p56.asia-south1.gcp.confluent.cloud:9092"],
  ssl: true,
  sasl: {
    mechanism: "plain",
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
  sessionTimeout: 45000,
});

const consumer = kafka.consumer({ groupId: "indigohack-email-group" });

const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = JSON.parse(message.value.toString());
      const subject = "Indigohack flight update email";
      for (const email of value.emails) {
        await sendEmail(email, subject, value.message);
      }
    },
  });
};

const disconnectConsumer = async () => {
  await consumer.disconnect();
};

module.exports = { disconnectConsumer, startConsumer };
