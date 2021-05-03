import { ExchangeWS } from '../lib/ws';

/**
 * https://tradernet.ru/tradernet-api/quotes-orderbook
 *
 * URI: wss://ws2.tradernet.ru/socket.io/?EIO=3&transport=websocket
 * Pairs: "TRNFP", "TATNP", "TATN", "SU52001RMFS3", "SU29011RMFS2", "SU26216RMFS0", "SU26215RMFS2", "SU26212RMFS9", "SU26207RMFS9", "SU25077RMFS7"
 */

export default class Tradernet extends ExchangeWS {
  constructor(name, settings, symbols) {
    super(
      name,
      {
        url: `wss://ws2.tradernet.ru/socket.io/?EIO=3&transport=websocket`,
        ...settings,
      },
      symbols
    );
  }

  subscribeSymbols() {
    this.send(
      '42' + JSON.stringify(['sup_updateDom', Object.keys(this.symbols)])
    );
  }

  unsubscribeSymbols() {}

  sendPing() {
    this.send('2');
  }

  onMessage(inMessage) {
    super.onMessage(inMessage);

    let cmd, message;

    console.log(inMessage.data);

    try {
      [, cmd, message] = inMessage.data.match(/^([0-9]+)(.*)/);
      if (message) {
        message = JSON.parse(message);
      }
    } catch (e) {
      console.error('Tradernet JSON parse problem', e.message);
      this.onClose('parse');
      return;
    }

    if (cmd === '42' && message && message[0] === 'b') {
      for (const item of message[1].dom) {
        const symbolName = item.i;
        if (!this.symbols[symbolName]) {
          return;
        }

        let snapshot = this.snapshots[symbolName];

        const isSnapshot = !snapshot;

        if (isSnapshot) {
          snapshot = {
            Asks: new Map(),
            Bids: new Map(),
          };
          this.snapshots[symbolName] = snapshot;
        }

        for (const row of item.del) {
          const map = row.s === 'S' ? snapshot.Asks : snapshot.Bids;
          map.delete(row.p);
        }

        const rows = [...item.upd, ...item.ins];
        for (const row of rows) {
          const map = row.s === 'S' ? snapshot.Asks : snapshot.Bids;
          map.set(row.p, row.q);
        }

        if (isSnapshot && (!snapshot.Asks.size || !snapshot.Bids.size)) {
          this.snapshots[symbolName] = null;
          return;
        }

        this.emit(
          isSnapshot ? 'snapshot' : 'update',
          this.symbols[symbolName].name,
          snapshot
        );
      }
    }
  }
}
