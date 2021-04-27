import request from 'request';

import { ExchangeWS } from './ws';

/**
 * https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams
 *
 * URI: wss://stream.binance.com:9443
 * Pairs: BTCUSD, LTCUSD, LTCBTC, ETHUSD, ETHBTC, ETCUSD, ETCBTC, BFXUSD, BFXBTC, RRTUSD, RRTBTC, ZECUSD, ZECBTC
 */

const getURL = (symbol, limit) =>
  `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`;

export default class Binance extends ExchangeWS {
  constructor(settings, symbols) {
    super(
      {
        url: `wss://stream.binance.com:9443/ws/bookTicker`,
        limit: 100,
        ...settings,
      },
      symbols,
      'Binance'
    );
    this.id = 1;
    this._buffers = {};
  }

  subscribeSymbols() {
    this.send({
      method: 'SUBSCRIBE',
      params: this.symbols.map(
        ({srcName}) => `${srcName.toLowerCase()}@depth@1000ms`
      ),
      id: ++this.id,
    });
  }

  unsubscribeSymbols() {
    try {
      this.send({
        method: 'UNSUBSCRIBE',
        params: this.symbols.map(
          ({srcName}) => `${srcName.toLowerCase()}@depth@1000ms`
        ),
        id: ++this.id,
      });
    } catch (e) {
      console.error(e);
    }
  }

  sendPing() {}

  onMessage(inMessage) {
    super.onMessage(inMessage);
    let message;

    try {
      message = JSON.parse(inMessage.data);
    } catch (e) {
      console.error('Binance JSON parse problem', e.message);
      this.onClose('parse');
      return;
    }

    if (message && message.e === 'depthUpdate' && message.s) {
      const symbolName = message.s;
      const symbolSettings = this.symbols.find(({ srcName }) => symbolName === srcName);
      if (!symbolSettings) {
        return;
      }

      const snapshot = this.snapshots[symbolName];

      if (this._buffers[symbolName]) {
        this._buffers[symbolName].push(message);
        return;
      }

      if (!snapshot) {
        this._buffers[symbolName] = [message];
        this.loadSnapshot(symbolSettings).then((lastUpdateId) => {
          this._buffers[symbolName]
            .filter((m) => m.u > lastUpdateId)
            .forEach((m) => {
              this.onMessage(JSON.stringify(m));
            });
          this._buffers[symbolName] = null;
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

      this._merge(snapshot.Asks, asks);
      this._merge(snapshot.Bids, bids);

      this.emit('update', symbolSettings.name, snapshot);
    }
  }

  _merge(snapshot, items) {
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
  }

  loadSnapshot(symbolSettings) {
    return new Promise((resolve, reject) => {
      request(
        {
          url: getURL(symbolSettings.srcName, this._settings.limit),
          json: true,
          followRedirect: false,
        },
        (error, response, body) => {
          if (
            !error &&
            response.statusCode === 200 &&
            body &&
            body.lastUpdateId > 0 &&
            body.bids !== undefined
          ) {
            let price;
            let volume;

            const snapshot = {
              Asks: new Map(),
              Bids: new Map(),
            };

            for ([price, volume] of body.asks) {
              snapshot.Asks.set(Number(price), Number(volume));
            }
            for ([price, volume] of body.bids) {
              snapshot.Bids.set(Number(price), Number(volume));
            }

            this.snapshots[symbolSettings.srcName] = snapshot;

            this.emit('snapshot', symbolSettings.name, snapshot);

            resolve(body.lastUpdateId);
          } else {
            reject(error);
          }
        }
      );
    });
  }
}
