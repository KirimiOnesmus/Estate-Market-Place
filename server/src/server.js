const app = require('./app');
const env = require('./config/env');
const prisma = require('./db/prisma');
const { startWorker } = require('./modules/communications/service');

startWorker();

const server = app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
