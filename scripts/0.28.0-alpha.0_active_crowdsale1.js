const Runner = new require('../helpers/Runner');
const Logger = new require('../helpers/Logger');

const W12Crowdsale = artifacts.require('W12Crowdsale');
const WToken = artifacts.require('WToken');

const version = '0.28.0';
const base = require('../parts/0.28.0/base');
const runner = new Runner(this);

module.exports = runner.generateHandler(async (ctx) => {
    const _artifacts = await require('../parts/0.28.0/artifacts')(artifacts);
    const utils = ctx.utils;

    const logs = new Logger(__filename);
    const accounts = web3.eth.accounts;

    const owner = accounts[0];
    const serviceWallet = accounts[0];

    logs.addRecord('Owner', owner);

    const {
        VersionsLedgerContract,
        WalletsContract,
        WTokenStubContract,
        WTokenTestHelperContract,
        RatesContract,
        W12FundFactoryContract,
        W12CrowdsaleFactoryContract,
        TokenExchangerContract,
        W12ListerStubContract
    } = await base(_artifacts);

    const defaultStagesGenerator = utils.createStagesGenerator();
    const defaultMilestonesGenerator = utils.createMilestonesGenerator();
    const stagesDefaultFixture = (startDate) => defaultStagesGenerator({
        dates: [
            startDate + utils.time.duration.seconds(20),
            startDate + utils.time.duration.minutes(500),
        ],
        volumeBoundaries: [
            '1' + '00000000',
            '2' + '00000000',
            '3' + '00000000'
        ],
        volumeBonuses: [
            utils.toInternalPercent(10),
            utils.toInternalPercent(20),
            utils.toInternalPercent(30)
        ],
    });
    const milestonesDefaultFixture = (startDate) => defaultMilestonesGenerator([
        {
            endDate: startDate + utils.time.duration.minutes(501),
            voteEndDate: startDate + utils.time.duration.minutes(502),
            withdrawalWindow: startDate + utils.time.duration.minutes(503)
        }
    ]);

    const TT1 = await WToken.new('TT1', 'TT1', 18);
    const TT2 = await WToken.new('TT2', 'TT2', 2);
    const ZERO = await WToken.new('ZERO', 'ZERO', 18);

    await TT1.mint(accounts[0], '100000000' + '000000000000000000', 0);
    await TT2.mint(accounts[0], '100000000' + '00', 0);

    await RatesContract.addSymbol(web3.fromUtf8('ETH'));
    await RatesContract.addSymbolWithTokenAddress(web3.fromUtf8('TT1'), TT1.address);
    await RatesContract.addSymbolWithTokenAddress(web3.fromUtf8('TT2'), TT2.address);
    await RatesContract.addSymbolWithTokenAddress(web3.fromUtf8('ZERO'), ZERO.address);
    await RatesContract.set(web3.fromUtf8('TT1'), '1' + '00000000');
    await RatesContract.set(web3.fromUtf8('TT2'), '2' + '00000000');
    await RatesContract.set(web3.fromUtf8('ETH'), '3' + '00000000');
    await RatesContract.set(web3.fromUtf8('ZERO'), '4' + '00000000');

    await WTokenStubContract.mint(owner, '100000000' + '000000000000000000', 0);
    await WTokenStubContract.approve(W12ListerStubContract.address, '100000000' + '000000000000000000');
    await W12ListerStubContract.whitelistToken(
        WTokenStubContract.address,
        await WTokenStubContract.name(),
        await WTokenStubContract.symbol(),
        await WTokenStubContract.decimals(),
        [owner],
        0,
        400,
        200,
        100
    );
    await W12ListerStubContract.placeToken(
        WTokenStubContract.address,
        0,
        '1000' + '000000000000000000'
    );
    // initCrowdsale(address tokenAddress, uint amountForSale, uint price)
    await W12ListerStubContract.initCrowdsale(
        WTokenStubContract.address,
        '100' + '000000000000000000',
        '1' + '00000000'
    );
    const crowdsale = W12Crowdsale.at(
        (await W12ListerStubContract.getCrowdsales(WTokenStubContract.address))[0]
    );
    const startDate = web3.eth.getBlock('latest').timestamp;

    await crowdsale.setup(
        ...utils.packSetupCrowdsaleParameters(
            stagesDefaultFixture(startDate),
            milestonesDefaultFixture(startDate),
            [
                web3.fromUtf8('ETH'),
                web3.fromUtf8('TT1'),
                web3.fromUtf8('TT2')
            ]
        )
    );
    await utils.time.increaseTo(startDate + utils.time.duration.seconds(20));

    logs.addRecord(VersionsLedgerContract.constructor.contractName, VersionsLedgerContract.address);
    logs.addRecord(WalletsContract.constructor.contractName, WalletsContract.address);
    logs.addRecord(WTokenStubContract.constructor.contractName, WTokenStubContract.address);
    logs.addRecord(WTokenTestHelperContract.constructor.contractName, WTokenTestHelperContract.address);
    logs.addRecord(RatesContract.constructor.contractName, RatesContract.address);
    logs.addRecord(W12ListerStubContract.constructor.contractName, W12ListerStubContract.address);
    logs.addRecord(TokenExchangerContract.constructor.contractName, TokenExchangerContract.address);
    logs.addRecord(W12FundFactoryContract.constructor.contractName, W12FundFactoryContract.address);
    logs.addRecord(W12CrowdsaleFactoryContract.constructor.contractName, W12CrowdsaleFactoryContract.address);

    logs.flush();
});
