import EventEmitter from 'events';

import * as exchanges from '../exchanges';
import Config from '../config';

const DEPTH_MAX_LENGTH = process.env.NODE_ENV === 'development' ? 10 : 100;

const sortDepthAsks = (a, b) => a - b;
const sortDepthBids = (a, b) => b - a;
const sortAsks = (a, b) => a[0] - b[0];
const sortBids = (a, b) => b[0] - a[0];
const sortResult = (a, b) => a[1] - b[1];

export default class Service extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(1000);
  }

  async start() {
    this._feeds = {};
    this._depths = {};

    return Promise.all(Object.entries(Config.exchanges)
      .map(async ([name, props]) => this.startFeed(name, props)));
  }

  getSnapshots() {
    return Object.entries(this._depths)
      .filter(([, depth]) => depth && depth.Asks)
      .map(([name, {Asks, Bids}]) => ({
        name,
        asks: [...Asks].sort(sortResult),
        bids: [...Bids].sort(sortResult),
      }));
  }

  async startFeed(name, props) {
    if (!exchanges[name] || !props.enabled) {
      return;
    }

    const symbols = Config.symbols.filter(({exchange}) => exchange === name);

    if (symbols.length > 0) {
      this._feeds[name] = new exchanges[name](props, symbols);

      this._feeds[name].on('snapshot', this._onSnapshot.bind(this, name));
      this._feeds[name].on('update', this._onUpdate.bind(this, name));
    }
  }

  stop() {
    Object.values(this._feeds).forEach((feed) => {
      feed.removeAllListeners();
      feed.destroy();
    });

    this._feeds = null;
  }

  _onSnapshot(name, symbol, depth) {
    this._depths[symbol] = null;
    this._onUpdate(name, symbol, depth);
  }

  _onUpdate(name, symbol, depth) {
    const ask =
      depth.Asks.size > 0
        ? [...depth.Asks.keys()].sort(sortDepthAsks)[0]
        : 0;
    const bid =
      depth.Bids.size > 0
        ? [...depth.Bids.keys()].sort(sortDepthBids)[0]
        : 0;

    if (bid > ask) {
      console.error(
        `Feed ${name} SymbolId ${symbol} Bid > Ask Ask=${ask} Bid=${bid} Depth:`,
        {
          sizeAsks: depth.Asks.size,
          sizeBids: depth.Bids.size,
        }
      );
      if (this._feeds[name].reconnect) {
        this._feeds[name].reconnect('BidMoreAsk');
      }
      return;
    }

    if (Config.rejectAskBidDiff > 0) {
      const diff = Math.floor(((ask - bid) / bid) * 100);

      if (diff >= Config.rejectAskBidDiff) {
        console.error(
          `Feed ${name} SymbolId ${symbol} Ask > Bid by ${diff}% Ask=${ask} Bid=${bid} Depth:`,
          depth
        );
        return;
      }
    }

    let price = 0;
    let volume = 0;
    let asks;
    let bids;
    let incrementAsks;
    let incrementBids;
    let isSnapshot = false;

    asks = new Map(depth.Asks);
    bids = new Map(depth.Bids);

    if (asks.size > DEPTH_MAX_LENGTH) {
      const asksArr = [...asks.entries()].sort(sortAsks);
      asksArr.length = DEPTH_MAX_LENGTH;
      asks = new Map(asksArr);
    }

    if (bids.size > DEPTH_MAX_LENGTH) {
      const bidsArr = [...bids.entries()].sort(sortBids);
      bidsArr.length = DEPTH_MAX_LENGTH;
      bids = new Map(bidsArr);
    }

    // Find increment
    if (!this._depths[symbol] || !this._depths[symbol].Asks) {
      incrementAsks = asks;
      incrementBids = bids;
      isSnapshot = true;

      this._depths[symbol] = {
        Asks: null,
        Bids: null,
      };
    } else {
      const { Asks: oldAsks, Bids: oldBids } = this._depths[symbol];

      incrementAsks = new Map();
      incrementBids = new Map();

      for (price of oldAsks.keys()) {
        if (!asks.has(price)) {
          incrementAsks.set(price, 0);
        }
      }
      for ([price, volume] of asks.entries()) {
        if (oldAsks.get(price) !== volume) {
          incrementAsks.set(price, volume);
        }
      }

      for (price of oldBids.keys()) {
        if (!bids.has(price)) {
          incrementBids.set(price, 0);
        }
      }
      for ([price, volume] of bids.entries()) {
        if (oldBids.get(price) !== volume) {
          incrementBids.set(price, volume);
        }
      }
    }

    this._depths[symbol].Asks = asks;
    this._depths[symbol].Bids = bids;

    this._notify(symbol, incrementAsks, incrementBids, isSnapshot);
  }

  _notify(
    name,
    asks,
    bids,
    isSnapshot = false
  ) {
    const event = isSnapshot ? 'snapshot' : 'update';

    const message = {
      name,
      asks: [...asks].sort(sortResult),
      bids: [...bids].sort(sortResult),
    };

    this.emit(event, message);
  }
}
