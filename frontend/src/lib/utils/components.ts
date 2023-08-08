function getUUID(): string {
  return crypto?.randomUUID ? crypto.randomUUID() : (Math.random() * 10e15).toString(16);
}

export {getUUID};
