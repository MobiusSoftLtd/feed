import { ExchangeWS } from '../lib/ws';
import Constants from '../constants';

export default class Finnhub extends ExchangeWS {
  constructor(name, settings, symbols) {
    super(
      name,
      {
        volume: 4000000,
        url: `wss://ws.finnhub.io?token=${settings.apiKey}`,
        ...settings,
      },
      symbols
    );

    this.lastPrice = {};
  }

  subscribe(symbol) {
    console.log(this.name, 'subscribe', symbol);
    this.send({
      type: 'subscribe',
      symbol,
    });
  }

  unsubscribe(symbol) {
    this.send({
      type: 'unsubscribe',
      symbol,
    });
  }

  sendPing() {
    this.socket.ping();
  }

  onTimeout() {}

  onMessage(inMessage) {
    super.onMessage(inMessage);

    const messages = JSON.parse(inMessage.data);

    if (
      messages &&
      messages.type === 'trade' &&
      messages.data &&
      messages.data instanceof Array
    ) {
      for (const message of messages.data) {
        const symbolName = message.s;

        if (this.symbols[symbolName]) {
          this.updateSymbol(symbolName, message.p);
        }
      }
    }
  }

  updateSymbol(symbolName, price) {
    if (!this.symbols[symbolName] || !price) return;

    const symbolData = this.symbols[symbolName];
    const spreadType = symbolData.spreadType;
    const spreadValue = symbolData.spreadValue;
    const digits = symbolData.digits;
    let spread = 0;

    if (spreadType === Constants.SpreadType.Percentage) {
      spread = (price * spreadValue) / 100 / 2;
    } else if (spreadType === Constants.SpreadType.Pips) {
      spread = (Math.pow(10, -digits) * spreadValue) / 2;
    }

    const ask = Number((price + spread).toFixed(digits));
    const bid = Number((price - spread).toFixed(digits));

    if (!this.lastPrice[symbolName]) {
      this.lastPrice[symbolName] = {
        ask: 0,
        bid: 0,
      };
    }

    if (
      this.lastPrice[symbolName].ask === ask &&
      this.lastPrice[symbolName].bid === bid
    ) {
      return;
    }

    this.lastPrice[symbolName].ask = ask;
    this.lastPrice[symbolName].bid = bid;

    let snapshot = this.snapshots[symbolName];
    const isSnapshot = snapshot === undefined;
    if (isSnapshot) {
      snapshot = {
        Asks: new Map(),
        Bids: new Map(),
      };
      this.snapshots[symbolName] = snapshot;
    }

    this.change(snapshot.Asks, ask, 1);
    this.change(snapshot.Bids, bid, -1);

    this.emit(isSnapshot ? 'snapshot' : 'update', symbolData.name, snapshot);
  }

  change(snapshot, price) {
    let { volume } = this.settings;

    snapshot.clear();
    snapshot.set(price, volume);
  }
}
