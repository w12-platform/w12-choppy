global.crypto = require('crypto');
global.bytes = require('utf8-bytes');

global.BigNumber = web3.BigNumber;
global.BigNumber.Zero = new BigNumber(0);
global.BigNumber.UINT_MAX = (new BigNumber(2)).pow(256).minus(1);
global.BigNumber.TEN = new BigNumber(10);
