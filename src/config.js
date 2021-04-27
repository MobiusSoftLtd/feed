module.exports = {
  port: 7050,
  authToken: 'a2b4aceb-ec44-4aaa-b723-d7d0624bb1f3',
  rejectAskBidDiff: 10,
  exchanges: {
    Binance: {
      enabled: true,
    }
  },
  symbols: [
    {
      name: 'BTCUSD',
      srcName: 'BTCUSDT',
      exchange: 'Binance',
    },
    {
      name: 'ETHUSD',
      srcName: 'ETHUSDT',
      exchange: 'Binance',
    },
    {
      name: 'BCHUSD',
      srcName: 'BCHUSDT',
      exchange: 'Binance',
    },
    {
      name: 'LTCUSD',
      srcName: 'LTCUSDT',
      exchange: 'Binance',
    },
    {
      name: 'DASHUSD',
      srcName: 'DASHUSDT',
      exchange: 'Binance',
    },
    {
      name: 'XMRUSD',
      srcName: 'XMRUSDT',
      exchange: 'Binance',
    },
  ]
};
