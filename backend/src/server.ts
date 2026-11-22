import http from 'http';
import { createApp } from './app.js';
import { initSocket } from './sockets/index.js';
import { config } from './config/env.js';

const app = createApp();
const server = http.createServer(app);

initSocket(server);

server.listen(config.port, () => {
  console.log(`🚀 FlowBoard Backend listo en http://localhost:${config.port}`);
  console.log(`🔌 WebSockets escuchando conexiones en http://localhost:${config.port}`);
});
