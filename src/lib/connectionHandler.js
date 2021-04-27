export default function connectionHandler(ws, service) {
  function send(data) {
    try {
      ws.send(JSON.stringify(data));
    } catch (e) {
      ws.terminate();
    }
  }

  const onSnapshot = (message) => {
    send({
      ...message,
      event: 'snapshot',
    });
  };

  const onUpdate = (message) => {
    send({
      ...message,
      event: 'update',
    });
  };

  service.on('snapshot', onSnapshot);
  service.on('update', onUpdate);

  ws.on('close', () => {
    console.log('close');
    service.off('snapshot', onSnapshot);
    service.off('update', onUpdate);
  });

  service.getSnapshots().forEach(onSnapshot);
}
