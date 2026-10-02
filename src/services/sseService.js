let clients = [];

function handleSse(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write('data: {"type":"CONNECTED"}\n\n');

  const clientId = Date.now() + Math.random();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter((c) => c.id !== clientId);
  });
}

function broadcast(eventType, data = {}) {
  const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
  clients.forEach((c) => {
    try {
      c.res.write(`data: ${payload}\n\n`);
    } catch (e) {
      // ignore broken client pipe
    }
  });
}

function getClientCount() {
  return clients.length;
}

module.exports = {
  handleSse,
  broadcast,
  getClientCount
};
