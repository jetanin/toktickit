// Suppress known upstream deprecation warning between @prisma/adapter-pg and pg 8.23+
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning: any, ...args: any[]) {
  if (
    (typeof warning === 'string' && warning.includes('Calling client.query()')) ||
    (warning && typeof warning.message === 'string' && warning.message.includes('Calling client.query()'))
  ) {
    return;
  }
  return (originalEmitWarning as any).call(this, warning, ...args);
};

