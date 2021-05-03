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
    this.feeds = {};
    this.depths = {};

    return Promise.all(
      Object.entries(Config.exchanges).map(async ([name, props]) =>
        this.startFeed(name, props)
      )
    );
  }

  getSnapshots() {
    return Object.entries(this.depths)
      .filter(([, depth]) => depth && depth.Asks)
      .map(([name, { Asks, Bids }]) => ({
        name,
        asks: [...Asks].sort(sortResult),
        bids: [...Bids].sort(sortResult),
      }));
  }

  startFeed(name, { enabled, settings = {}, symbols = {} }) {
    if (!enabled || !exchanges[name]) {
      return;
    }

    this.feeds[name] = new exchanges[name](name, settings, symbols);
    this.feeds[name].on('snapshot', this.onSnapshot.bind(this, name));
    this.feeds[name].on('update', this.onUpdate.bind(this, name));
    this.feeds[name].start();
  }

  stop() {
    Object.values(this.feeds).forEach((feed) => {
      feed.removeAllListeners();
      feed.destroy();
    });

    this.feeds = null;
  }

  onSnapshot(name, symbol, depth) {
    this.depths[symbol] = null;
    this.onUpdate(name, symbol, depth);
  }

  onUpdate(name, symbol, depth) {
    let asks = new Map(depth.Asks);
    let bids = new Map(depth.Bids);

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

    const ask =
      depth.Asks.size > 0 ? [...depth.Asks.keys()].sort(sortDepthAsks)[0] : 0;
    const bid =
      depth.Bids.size > 0 ? [...depth.Bids.keys()].sort(sortDepthBids)[0] : 0;

    if (bid > ask) {
      console.error(
        `Feed ${name} SymbolId ${symbol} Bid > Ask Ask=${ask} Bid=${bid} Depth:`,
        {
          sizeAsks: depth.Asks.size,
          sizeBids: depth.Bids.size,
        }
      );
      this.feeds[name].destroy();
      this.startFeed(name, Config.exchanges[name]);
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
    let incrementAsks;
    let incrementBids;
    let isSnapshot = false;

    // Find increment
    if (!this.depths[symbol] || !this.depths[symbol].Asks) {
      incrementAsks = asks;
      incrementBids = bids;
      isSnapshot = true;

      this.depths[symbol] = {
        Asks: null,
        Bids: null,
      };
    } else {
      const { Asks: oldAsks, Bids: oldBids } = this.depths[symbol];

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

    this.depths[symbol].Asks = asks;
    this.depths[symbol].Bids = bids;

    this.notify(symbol, incrementAsks, incrementBids, isSnapshot);
  }

  notify(name, asks, bids, isSnapshot = false) {
    const event = isSnapshot ? 'snapshot' : 'update';

    const message = {
      name,
      asks: [...asks].sort(sortResult),
      bids: [...bids].sort(sortResult),
    };

    // console.log(event, message);

    this.emit(event, message);
  }
}
