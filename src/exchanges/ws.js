import WebSocket from 'ws';
import { EventEmitter } from 'events';

const TIMEOUT = 15000;
const PING_INTERVAL = 10000;

export class ExchangeWS extends EventEmitter {
  constructor(settings, symbols, name) {
    super();
    this.setMaxListeners(100);

    this.name = name;
    this._settings = settings;
    this.symbols = symbols;

    this.snapshots = {};

    this.options = {
      retryCount: 1000,
      retryCountNotify: 3,
      reconnectInterval: 5,
    };
    this.socket = null;
    this.isConnected = false;
    this.reconnectTimeoutId = 0;
    this.retryCount = this.options.retryCount;
    this.shouldAttemptReconnect = !!this.options.reconnectInterval;

    this.start = this.start.bind(this);
    this.checkTimeout = this.checkTimeout.bind(this);
    this.sendPing = this.sendPing.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onOpen = this.onOpen.bind(this);
    this.onError = this.onError.bind(this);
    this.onClose = this.onClose.bind(this);

    this.start();
  }

  start() {
    console.log(this.name, 'start');

    clearTimeout(this.timerTimeout);

    this.shouldAttemptReconnect = !!this.options.reconnectInterval;
    this.isConnected = false;
    this.snapshots = {};

    this.socket = new WebSocket(this._settings.url, {
      perMessageDeflate: false,
    });
    this.socket.onmessage = this.onMessage;
    this.socket.onopen = this.onOpen;
    this.socket.onerror = this.onError;
    this.socket.onclose = this.onClose;

    this._lastActive = Date.now();
    this.checkTimeout();
  }

  checkTimeout() {
    const now = Date.now();
    const isTimeout = this._lastActive + TIMEOUT < now;

    // console.log(this.name, 'checkTimeout', isTimeout);

    if (isTimeout) {
      this.onTimeout();
    } else {
      this._lastActive = now;
      this.timerTimeout = setTimeout(this.checkTimeout, TIMEOUT);
      this.timerTimeout.unref();
    }
  }

  destroy() {
    console.log(this.name, 'destroy');

    clearTimeout(this.reconnectTimeoutId);
    this.shouldAttemptReconnect = false;
    this.socket.close();
  }

  onError(reason) {
    console.error(this.name, 'error', reason);
  }

  onTimeout() {
    this.onClose('timeout');
  }

  reconnect() {}

  _subscribe(symbol) {}

  _unsubscribe(symbol) {}

  onOpen() {
    console.log(this.name, 'open');

    this.isConnected = true;

    // set again the retry count
    this.retryCount = this.options.retryCount;

    this.subscribeSymbols();

    clearInterval(this.pingInterval);
    this.pingInterval = setInterval(this.sendPing, PING_INTERVAL);

    this.emit('connect');
  }

  subscribeSymbols() {
    this.symbols.forEach(({srcName}) => {
      this._subscribe(srcName);
    });
  }

  send(msg) {
    if (typeof msg !== 'string') {
      msg = JSON.stringify(msg);
    }
    try {
      this.socket.send(msg, (error) => {
        if (error) {
          console.error(this.name, 'WS send async error:', error);
          this.socket.close();
        }
      });
    } catch (e) {
      console.error(this.name, 'WS send sync error:', e);
      this.socket.close();
    }
  }

  sendPing() {
    this.send({
      event: 'ping',
    });
  }

  onClose(reason = '') {
    reason = reason.message || reason.reason || reason;

    this.snapshots = {};

    console.error(
      this.name,
      'close',
      reason,
      'retry: ' +
        (this.options.retryCount - this.retryCount) +
        '/' +
        this.options.retryCount
    );

    clearInterval(this.pingInterval);

    if (this.shouldAttemptReconnect && this.retryCount > 0) {
      this.retryCount--;
      console.log(this.name, 'reconnect task', this.retryCount);

      clearTimeout(this.reconnectTimeoutId);

      this.reconnectTimeoutId = setTimeout(() => {
        this.emit('reconnect');
        this.start();
      }, this.options.reconnectInterval * 1000);

      this.reconnectTimeoutId.unref();
    } else {
      console.log(this.name, 'destroyed');
      this.emit('destroyed');
    }
  }

  onMessage(inMessage) {
    this._lastActive = Date.now();
  }
}
