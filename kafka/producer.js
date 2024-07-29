// # Required connection configs for Kafka producer, consumer, and admin
// bootstrap.servers=pkc-41p56.asia-south1.gcp.confluent.cloud:9092
// security.protocol=SASL_SSL
// sasl.mechanisms=PLAIN
// sasl.username=IQM5VGPGBJ6WIFGS
// sasl.password=bUU/OEPc15wSxgcj5seAE+FD4/Clfr80FplFwVmmP43aQGebOmdAYJw7qP0S6pqC

// # Best practice for higher availability in librdkafka clients prior to 1.7
// session.timeout.ms=45000

const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "indigohack",
  brokers: ["pkc-41p56.asia-south1.gcp.confluent.cloud:9092"],
  ssl: true,
  sasl: {
    mechanism: 'plain', 
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  },
  sessionTimeout: 45000 
});

const producer = kafka.producer();

// await producer.send({
//   topic: 'indigohack-email',
//   messages: [
//     { value: 'Hello KafkaJS user!' },
//   ],
// })

const connectProducer = async () => {
  await producer.connect();
};

const disconnectProducer = async () => {
  await producer.disconnect();
};

const sendEmailMessage = async (emails, message) => {  
    await producer.send({
        topic: "indigohack-email",
        messages: [{ value: JSON.stringify({ emails, message }) }],
    });
  }


module.exports = { connectProducer, disconnectProducer, sendEmailMessage };
