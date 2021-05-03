import { ExchangeWS } from '../lib/ws';

export default class Mobius extends ExchangeWS {
  constructor(name, settings, symbols) {
    super(
      name,
      {
        url: '',
        token: '',
        headers: {
          Authorization: settings.token,
        },
        ...settings,
      },
      symbols
    );
  }

  sendPing() {}

  onMessage(inMessage) {
    super.onMessage(inMessage);

    try {
      let { event, name, asks = [], bids = [] } = JSON.parse(inMessage.data);

      const symbolData = this.symbols[name];
      if (!symbolData) {
        return;
      }

      if (event === 'snapshot' || event === 'update') {
        let snapshot = this.snapshots[name];

        const isSnapshot = !snapshot || event === 'snapshot';

        if (isSnapshot) {
          snapshot = {
            Asks: new Map(),
            Bids: new Map(),
          };
          this.snapshots[name] = snapshot;
        }

        this.merge(snapshot.Asks, asks);
        this.merge(snapshot.Bids, bids);

        this.emit(
          isSnapshot ? 'snapshot' : 'update',
          symbolData.name,
          snapshot
        );
      }
    } catch (e) {
      this.onClose('parse');
    }
  }

  merge(snapshot, items) {
    for (const [price, volume] of items) {
      if (volume === 0) {
        snapshot.delete(price);
      } else {
        snapshot.set(price, volume);
      }
    }
  }
}
