export async function executeRabbitmqOperation({ transport, payload }) {
  const config = transport.rabbitmq;

  let amqplib;
  try {
    amqplib = await import("amqplib");
  } catch {
    return {
      ok: false,
      status: 501,
      message:
        "RabbitMQ transport requires amqplib. Run: npm install amqplib",
    };
  }

  const connection = await amqplib.connect(config.url);
  const channel = await connection.createChannel();

  try {
    if (config.exchange) {
      await channel.assertExchange(config.exchange, "topic", {
        durable: config.durable ?? true,
      });
    }

    if (config.queue) {
      await channel.assertQueue(config.queue, {
        durable: config.durable ?? true,
      });
    }

    const message = Buffer.from(JSON.stringify(payload));
    const publishOptions = { persistent: true };

    if (config.exchange) {
      channel.publish(
        config.exchange,
        config.routingKey || "",
        message,
        publishOptions
      );
    } else if (config.queue) {
      channel.sendToQueue(config.queue, message, publishOptions);
    } else {
      return {
        ok: false,
        status: 400,
        message: "RabbitMQ transport requires exchange or queue",
      };
    }

    return {
      ok: true,
      status: 202,
      data: {
        queued: true,
        transport: "RABBITMQ",
        exchange: config.exchange ?? null,
        queue: config.queue ?? null,
        routingKey: config.routingKey ?? null,
      },
    };
  } finally {
    await channel.close();
    await connection.close();
  }
}
