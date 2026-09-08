export async function executeKafkaOperation({ transport, payload, operationName }) {
  const config = transport.kafka;

  let Kafka;
  try {
    ({ Kafka } = await import("kafkajs"));
  } catch {
    return {
      ok: false,
      status: 501,
      message: "Kafka transport requires kafkajs. Run: npm install kafkajs",
    };
  }

  const kafka = new Kafka({
    clientId: config.clientId || "operator-adapter",
    brokers: config.brokers,
  });

  const producer = kafka.producer();
  await producer.connect();

  try {
    const message = {
      key: payload.transactionId || payload.playerId || operationName,
      value: JSON.stringify({
        operation: operationName,
        payload,
        sentAt: new Date().toISOString(),
      }),
    };

    const result = await producer.send({
      topic: config.topic,
      acks: config.acks === "all" ? -1 : 1,
      messages: [message],
    });

    return {
      ok: true,
      status: 202,
      data: {
        queued: true,
        transport: "KAFKA",
        topic: config.topic,
        partition: result[0]?.partition ?? config.partition ?? null,
        offset: result[0]?.baseOffset ?? null,
      },
    };
  } finally {
    await producer.disconnect();
  }
}
