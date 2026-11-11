import net from 'node:net';

const ports = [3000, 4000];
const checks = ports.map((port) => new Promise((resolve) => {
  const server = net.createServer();
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[VersionFlow] Port ${port} is already in use. Stop the process using localhost:${port} before running pnpm dev.`);
    } else {
      console.error(`[VersionFlow] Could not check port ${port}: ${error.message}`);
    }
    resolve(false);
  });
  server.once('listening', () => server.close(() => resolve(true)));
  server.listen(port);
}));

const available = (await Promise.all(checks)).every(Boolean);
if (!available) process.exit(1);
