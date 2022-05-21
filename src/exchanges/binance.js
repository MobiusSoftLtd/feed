import axios from 'axios';

import { ExchangeWS } from '../lib/ws';

const sortAsks = (a, b) => a - b;
const sortBids = (a, b) => b - a;

/**
 * https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams
 *
 * URI: wss://stream.binance.com:9443
 * Pairs: BTCUSD, LTCUSD, LTCBTC, ETHUSD, ETHBTC, ETCUSD, ETCBTC, BFXUSD, BFXBTC, RRTUSD, RRTBTC, ZECUSD, ZECBTC
 */

const getSnapshotURL = (symbol, limit) =>
  `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`;

const getLimit = (symbolName) => (symbolName === 'BTCUSDT' ? 100 : 10);

export default class Binance extends ExchangeWS {
  constructor(name, settings, symbols) {
    super(
      name,
      {
        url: `wss://stream.binance.com:9443/ws/bookTicker`,
        limit: 100,
        ...settings,
      },
      symbols
    );
    this.id = 1;
    this.queue = {};
  }

  destroy() {
    this.unsubscribeSymbols();
    super.destroy();
  }

  subscribeSymbols() {
    const params = Object.keys(this.symbols).map(
      (name) => `${name.toLowerCase()}@depth@1000ms`
    );

    if (params.length) {
      this.send({
        method: 'SUBSCRIBE',
        params,
        id: ++this.id,
      });
    }
  }

  unsubscribeSymbols() {
    try {
      const params = Object.keys(this.symbols).map(
        (name) => `${name.toLowerCase()}@depth@1000ms`
      );

      if (params.length) {
        this.send({
          method: 'UNSUBSCRIBE',
          params,
          id: ++this.id,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  sendPing() {}

  onMessage(inMessage, restore = false) {
    super.onMessage(inMessage);
    let message;


    if (restore) {
      message = inMessage;
    } else {
      try {
        message = JSON.parse(inMessage.data);
      } catch (e) {
        console.error('Binance JSON parse problem', e.message, inMessage);
        this.onClose('parse');
        return;
      }
    }

    if (message && message.e === 'depthUpdate' && message.s) {
      const symbolName = message.s;
      const symbolData = this.symbols[symbolName];
      if (!symbolData) {
        return;
      }

      const snapshot = this.snapshots[symbolName];

      const limit = getLimit(symbolName);

      if (this.queue[symbolName]) {
        this.queue[symbolName].push(message);
        return;
      }

      if (!snapshot) {
        this.queue[symbolName] = [message];
        this.loadSnapshot(symbolName).then((lastUpdateId) => {
          const queue = this.queue[symbolName];
          this.queue[symbolName] = null;

          const messages = queue.filter(
            (m) => m.U <= lastUpdateId + 1 && m.u >= lastUpdateId + 1
          );
          messages.forEach((m) => {
            this.onMessage(m, true);
          });
        });
        return;
      }

      const asks = message.a.map(([price, volume]) => ({
        Price: Number(price),
        Volume: Number(volume),
      }));

      const bids = message.b.map(([price, volume]) => ({
        Price: Number(price),
        Volume: Number(volume),
      }));

      this.merge(snapshot.Asks, asks, sortAsks, limit);
      this.merge(snapshot.Bids, bids, sortBids, limit);

      this.emit('update', symbolData.name, snapshot);
    }
  }

  merge(snapshot, items, sorter, limit) {
    let item;

    if (!items || items.length === 0) {
      return;
    }

    for (item of items) {
      if (item.Volume === 0) {
        snapshot.delete(item.Price);
      } else {
        snapshot.set(item.Price, item.Volume);
      }
    }

    if (snapshot.size > limit) {
      [...snapshot.keys()]
        .sort(sorter)
        .slice(limit)
        .forEach((p) => {
          snapshot.delete(p);
        });
    }
  }

  async loadSnapshot(symbolName) {
    const { status, data } = await axios.get(
      getSnapshotURL(symbolName, getLimit(symbolName))
    );

    if (
      status !== 200 ||
      !data ||
      !data.lastUpdateId ||
      data.bids === undefined
    ) {
      throw new Error('NotLoaded');
    }
    const snapshot = {
      Asks: new Map(),
      Bids: new Map(),
    };

    for (const [price, volume] of data.asks) {
      snapshot.Asks.set(Number(price), Number(volume));
    }

    for (const [price, volume] of data.bids) {
      snapshot.Bids.set(Number(price), Number(volume));
    }

    this.snapshots[symbolName] = snapshot;

    this.emit('snapshot', this.symbols[symbolName].name, snapshot);

    return data.lastUpdateId;
  }
}
