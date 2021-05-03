const FixClient = require('fix-client');
const { Field, Fields, Messages } = require('fix-client/src/lib/FIXParser');
import { EventEmitter } from 'events';

export default class FixAPI extends EventEmitter {
  constructor(name, settings, symbols) {
    super();

    this.onOpen = this.onOpen.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onError = this.onError.bind(this);

    this.name = name;

    this.snapshots = {};

    this.setMaxListeners(100);

    this.settings = {
      fixVersion: 'FIX.4.4',
      host: '',
      port: 0,
      sender: '',
      target: '',
      userName: '',
      password: '',
      ...settings,
    };

    const {
      host,
      port,
      fixVersion,
      sender,
      target,
      userName,
      password,
    } = this.settings;

    this.symbols = symbols;

    this.client = new FixClient(
      {
        fixVersion,
        host,
        port,
        sender,
        target,
        accountID: userName,
        accountPassword: password,
      },
      sender
    );

    this.client.parser.on('open', this.onOpen);
    this.client.parser.on('message', this.onMessage);
    this.client.parser.on('error', this.onError);

    this.on('connect', this.onConnect.bind(this));
  }

  onConnect() {
    this.snapshots = {};

    Object.keys(this.symbols).forEach((symbolName) => {
      this.subscribeSymbol(symbolName);
    });
  }

  start() {
    console.log(this.name, 'start');
    this.client.connect();
  }

  onOpen() {
    console.log(this.name, 'connected');
    this.client.sendLogon();
  }

  subscribeSymbol(symbolName) {
    this.marketDataRequest(symbolName, '1');
  }

  unsubscribeSymbol(symbolName) {
    this.marketDataRequest(symbolName, '2');
  }

  marketDataRequest(symbolName, reqType) {
    const clientID = this.client.uniqueClientID();
    const order = this.client.parser.createMessage(
      ...this.client.standardHeader(Messages.MarketDataRequest),
      new Field(Fields.MDReqID, clientID),
      new Field(Fields.SubscriptionRequestType, reqType),
      new Field(Fields.MarketDepth, '0'),
      new Field(Fields.MDUpdateType, '0'),
      new Field(Fields.NoMDEntryTypes, '2'),
      new Field(Fields.MDEntryType, '0'),
      new Field(Fields.MDEntryType, '1'),
      new Field(Fields.NoRelatedSym, '1'),
      new Field(Fields.Symbol, symbolName)
    );
    this.client.parser.send(order);
  }

  unsubscribeSymbols() {
    try {
      Object.keys(this.symbols).forEach((symbolName) => {
        this.unsubscribeSymbol(symbolName);
      });
    } catch (e) {
      console.error(this.name, e);
    }
  }

  onError(err) {
    console.error(this.name, 'Error: ', err);
  }

  onMessage(message) {
    if (message.messageType === Messages.Logon) {
      this.emit('connect');
    }

    if (message.messageType === Messages.MarketDataSnapshotFullRefresh) {
      let symbolName;
      const quotes = {
        asks: [],
        bids: [],
      };
      let entry = {};

      for (const { tag, value } of message.data) {
        if (tag === Fields.Symbol) {
          symbolName = value;
        } else if (tag === Fields.MDEntryType) {
          const t = value === '0' ? 'bids' : 'asks';
          entry = {
            price: 0,
            volume: 0,
          };
          quotes[t].push(entry);
        } else if (tag === Fields.MDEntryPx) {
          entry.price = value;
        } else if (tag === Fields.MDEntrySize) {
          entry.volume = value;
        }
      }
      this.updateSymbol(symbolName, quotes.asks, quotes.bids);
    }
  }

  updateSymbol(symbolName, asks, bids) {
    let snapshot = this.snapshots[symbolName];
    let isSnapshot = false;

    if (!snapshot) {
      isSnapshot = true;
      snapshot = {
        Asks: new Map(),
        Bids: new Map(),
      };
      this.snapshots[symbolName] = snapshot;
    } else {
      snapshot.Asks.clear();
      snapshot.Bids.clear();
    }

    for (const { price, volume } of asks) {
      snapshot.Asks.set(parseFloat(price), parseFloat(volume));
    }

    for (const { price, volume } of bids) {
      snapshot.Bids.set(parseFloat(price), parseFloat(volume));
    }

    this.emit(
      isSnapshot ? 'snapshot' : 'update',
      this.symbols[symbolName].name,
      snapshot
    );
  }

  destroy() {
    console.log(this.name, 'destroy');
    this.unsubscribeSymbols();
  }
}
