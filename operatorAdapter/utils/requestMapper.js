export function mapRequest(payload = {}, mapping) {
  if (!mapping || typeof mapping !== "object" || Object.keys(mapping).length === 0) {
    return payload;
  }

  const mapped = {};
  for (const [from, to] of Object.entries(mapping)) {
    if (payload[from] !== undefined) {
      mapped[to] = payload[from];
    }
  }
  return mapped;
}

export function mapResponse(payload = {}, mapping) {
  if (!mapping || typeof mapping !== "object" || Object.keys(mapping).length === 0) {
    return payload;
  }

  if (typeof payload !== "object" || payload === null) {
    return payload;
  }

  const mapped = { ...payload };
  for (const [from, to] of Object.entries(mapping)) {
    if (payload[from] !== undefined) {
      mapped[to] = payload[from];
      if (from !== to) {
        delete mapped[from];
      }
    }
  }
  return mapped;
}
