import { createServer } from 'node:http';

export const serverPackage = '@zero-hour/server';

const server = createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('ok');
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('not found');
});

server.listen(7777, () => {
  console.log('Zero Hour server listening on http://localhost:7777');
});
