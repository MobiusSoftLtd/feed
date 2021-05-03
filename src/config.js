import Constants from './constants';

export default {
  port: 5000,
  authToken: '',
  rejectAskBidDiff: 10,
  exchanges: {
    Tradernet: {
      enabled: false,
      symbols: {
        TATNP: {
          name: 'TN.TATNP',
        },
      },
    },
    FinnHub: {
      enabled: false,
      settings: {
        apiKey: '',
        volume: 4000000,
      },
      symbols: {
        'BINANCE:BTCUSDT': {
          name: 'FH.BTCUSD',
          spreadType: Constants.SpreadType.Pips,
          spreadValue: 8,
          digits: 3,
        },
      },
    },
    MatchTrade: {
      enabled: false,
      settings: {
        className: 'FixAPI',
        host: '0.0.50.',
        fixVersion: 'FIX.4.4',
        port: 2450,
        sender: '',
        target: '',
        userName: '',
        password: '',
      },
      symbols: {
        LTCBTC: {
          name: 'MT.LTCBTC',
        },
      },
    },
    Mobius: {
      enabled: true,
      settings: {
        url: 'ws://example.com',
        token: '',
      },
      symbols: {
        BTCUSDT: {
          name: 'BTCUSD',
        },
        ETHUSDT: {
          name: 'ETHUSD',
        },
        BCHUSDT: {
          name: 'BCHUSD',
        },
        LTCUSDT: {
          name: 'LTCUSD',
        },
        DASHUSDT: {
          name: 'DASHUSD',
        },
        XMRUSDT: {
          name: 'XMRUSD',
        },
        USDCNY: {
          name: 'USDCNY',
        },
        USDUAH: {
          name: 'USDUAH',
        },
        USDMYR: {
          name: 'USDMYR',
        },
        USDTHB: {
          name: 'USDTHB',
        },
        USDVND: {
          name: 'USDVND',
        },
        USDIDR: {
          name: 'USDIDR',
        },
        EURUSDv: {
          name: 'EURUSDv',
        },
        AUDCADv: {
          name: 'AUDCADv',
        },
        EURJPYv: {
          name: 'EURJPYv',
        },
        EURCHFv: {
          name: 'EURCHFv',
        },
        USDJPYv: {
          name: 'USDJPYv',
        },
        USDCADv: {
          name: 'USDCADv',
        },
        XAUEURv: {
          name: 'XAUEURv',
        },
        XAGUSDv: {
          name: 'XAGUSDv',
        },
        XAUUSDv: {
          name: 'XAUUSDv',
        },
        CADJPYv: {
          name: 'CADJPYv',
        },
        SGDJPYv: {
          name: 'SGDJPYv',
        },
        CHFJPYv: {
          name: 'CHFJPYv',
        },
        CADCHFv: {
          name: 'CADCHFv',
        },
        AUDJPYv: {
          name: 'AUDJPYv',
        },
        AUDCHFv: {
          name: 'AUDCHFv',
        },
        GBPJPYv: {
          name: 'GBPJPYv',
        },
        GBPCADv: {
          name: 'GBPCADv',
        },
        GBPCHFv: {
          name: 'GBPCHFv',
        },
        GBPAUDv: {
          name: 'GBPAUDv',
        },
        NZDJPYv: {
          name: 'NZDJPYv',
        },
        NZDCADv: {
          name: 'NZDCADv',
        },
        AUDNZDv: {
          name: 'AUDNZDv',
        },
        GBPNZDv: {
          name: 'GBPNZDv',
        },
        EURCADv: {
          name: 'EURCADv',
        },
        NZDCHFv: {
          name: 'NZDCHFv',
        },
        EURAUDv: {
          name: 'EURAUDv',
        },
        EURGBPv: {
          name: 'EURGBPv',
        },
        EURNZDv: {
          name: 'EURNZDv',
        },
        EURNOKv: {
          name: 'EURNOKv',
        },
        EURSGDv: {
          name: 'EURSGDv',
        },
        EURSEKv: {
          name: 'EURSEKv',
        },
        EURHKDv: {
          name: 'EURHKDv',
        },
        EURTRYv: {
          name: 'EURTRYv',
        },
        EURPLNv: {
          name: 'EURPLNv',
        },
        EURDKKv: {
          name: 'EURDKKv',
        },
        USDCHFv: {
          name: 'USDCHFv',
        },
        GBPUSDv: {
          name: 'GBPUSDv',
        },
        NZDUSDv: {
          name: 'NZDUSDv',
        },
        XAGEURv: {
          name: 'XAGEURv',
        },
        USDNOKv: {
          name: 'USDNOKv',
        },
        USDSGDv: {
          name: 'USDSGDv',
        },
        USDSEKv: {
          name: 'USDSEKv',
        },
        USDHKDv: {
          name: 'USDHKDv',
        },
        USDTRYv: {
          name: 'USDTRYv',
        },
        USDPLNv: {
          name: 'USDPLNv',
        },
        USDDKKv: {
          name: 'USDDKKv',
        },
        AUDUSDv: {
          name: 'AUDUSDv',
        },
        AUDUSDecn: {
          name: 'AUDUSDecn',
        },
        EURGBPecn: {
          name: 'EURGBPecn',
        },
        EURUSDecn: {
          name: 'EURUSDecn',
        },
        GBPUSDecn: {
          name: 'GBPUSDecn',
        },
        NZDUSDecn: {
          name: 'NZDUSDecn',
        },
        USDCADecn: {
          name: 'USDCADecn',
        },
        USDCHFecn: {
          name: 'USDCHFecn',
        },
        USDJPYecn: {
          name: 'USDJPYecn',
        },
        XAUUSDecn: {
          name: 'XAUUSDecn',
        },
        AUDJPY: {
          name: 'AUDJPY',
        },
        AUDUSD: {
          name: 'AUDUSD',
        },
        EURCHF: {
          name: 'EURCHF',
        },
        EURGBP: {
          name: 'EURGBP',
        },
        EURJPY: {
          name: 'EURJPY',
        },
        EURUSD: {
          name: 'EURUSD',
        },
        GBPCHF: {
          name: 'GBPCHF',
        },
        GBPJPY: {
          name: 'GBPJPY',
        },
        GBPUSD: {
          name: 'GBPUSD',
        },
        NZDUSD: {
          name: 'NZDUSD',
        },
        USDCAD: {
          name: 'USDCAD',
        },
        USDCHF: {
          name: 'USDCHF',
        },
        USDJPY: {
          name: 'USDJPY',
        },
        AUDUSDbig: {
          name: 'AUDUSDbig',
        },
        EURGBPbig: {
          name: 'EURGBPbig',
        },
        EURUSDbig: {
          name: 'EURUSDbig',
        },
        GBPUSDbig: {
          name: 'GBPUSDbig',
        },
        NZDUSDbig: {
          name: 'NZDUSDbig',
        },
        USDCADbig: {
          name: 'USDCADbig',
        },
        USDCHFbig: {
          name: 'USDCHFbig',
        },
        USDJPYbig: {
          name: 'USDJPYbig',
        },
        AUS200v: {
          name: 'AUS200v',
        },
        COPPERv: {
          name: 'COPPERv',
        },
        FRA40v: {
          name: 'FRA40v',
        },
        GER30v: {
          name: 'GER30v',
        },
        NATGASv: {
          name: 'NATGASv',
        },
        UK100v: {
          name: 'UK100v',
        },
        UKOILv: {
          name: 'UKOILv',
        },
        USA100v: {
          name: 'USA100v',
        },
        USA30v: {
          name: 'USA30v',
        },
        USA500v: {
          name: 'USA500v',
        },
        USOILv: {
          name: 'USOILv',
        },
        ADIDAS: {
          name: 'ADIDAS',
        },
        AIRBUS: {
          name: 'AIRBUS',
        },
        BMW: {
          name: 'BMW',
        },
        CONG: {
          name: 'CONG',
        },
        TOYOTA: {
          name: 'TOYOTA',
        },
        SONY: {
          name: 'SONY',
        },
        AMAZON: {
          name: 'AMAZON',
        },
        GOOGLE: {
          name: 'GOOGLE',
        },
        BOEING: {
          name: 'BOEING',
        },
        NETFLIX: {
          name: 'NETFLIX',
        },
        TESLA: {
          name: 'TESLA',
        },
        NVIDIA: {
          name: 'NVIDIA',
        },
        MCARD: {
          name: 'MCARD',
        },
        APPLE: {
          name: 'APPLE',
        },
        FACEBOOK: {
          name: 'FACEBOOK',
        },
        IBM: {
          name: 'IBM',
        },
        VISA: {
          name: 'VISA',
        },
        FERRARI: {
          name: 'FERRARI',
        },
        CHEVRON: {
          name: 'CHEVRON',
        },
        MSFT: {
          name: 'MSFT',
        },
        DISNEY: {
          name: 'DISNEY',
        },
        WMART: {
          name: 'WMART',
        },
        NIKE: {
          name: 'NIKE',
        },
        MCDON: {
          name: 'MCDON',
        },
        INTEL: {
          name: 'INTEL',
        },
        GM: {
          name: 'GM',
        },
        HPACK: {
          name: 'HPACK',
        },
        COCA: {
          name: 'COCA',
        },
        USDILS: {
          name: 'USDILS',
        },
        EURILS: {
          name: 'EURILS',
        },
        USDRUB: {
          name: 'USDRUB',
        },
      },
    },
  },
};
