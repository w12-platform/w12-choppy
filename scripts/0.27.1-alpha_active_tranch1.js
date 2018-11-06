const Runner = new require('../helpers/Runner');
const Logger = new require('../helpers/Logger');
const semint = new require('@redtea/semint');

const W12Crowdsale = artifacts.require('W12Crowdsale');
const W12CrowdsaleStub = artifacts.require('W12CrowdsaleStub');
const Percent = artifacts.require('Percent');
const Utils = artifacts.require('Utils');
const FundAccount = artifacts.require('FundAccount');
const W12CrowdsaleFactory = artifacts.require('W12CrowdsaleFactory');
const W12FundFactory = artifacts.require('W12FundFactory');
const W12Fund = artifacts.require('W12Fund');
const Rates = artifacts.require('Rates');
const W12FundStub = artifacts.require('W12FundStub');
const WTokenStub = artifacts.require('WTokenStub');
const WToken = artifacts.require('WToken');
const WTokenTestHelper = artifacts.require('WTokenTestHelper');
const Wallets = artifacts.require("Wallets");
const Versions = artifacts.require("VersionsLedger");
const TokenExchanger = artifacts.require('TokenExchanger');
const W12ListerStub = artifacts.require('W12ListerStub');

const version = '0.27.1';
const runner = new Runner(this);

module.exports = runner.generateHandler(async (ctx) => {
    const utils = ctx.utils;

    const logs = new Logger('0.27.1-alpha_active_tranch1');
    const accounts = web3.eth.accounts;

    const owner = accounts[0];
    const serviceWallet = accounts[0];

    logs.addRecord('Owner', owner);

    const VersionsContract = await Versions.new();
    const WalletsContract = await Wallets.new();
    const WTokenStubContract = await WTokenStub.new('TestToken1', 'TT1', 18);
    const WTokenTestHelperContract = await WTokenTestHelper.new();
    const RatesContract = await Rates.new();

    const PercentLib = await Percent.new();
    const UtilsLib = await Utils.new();
    const FundAccountLib = await FundAccount.new();

    W12CrowdsaleStub.link(PercentLib.constructor.contractName, PercentLib.address);
    W12CrowdsaleStub.link(UtilsLib.constructor.contractName, UtilsLib.address);
    W12Crowdsale.link(PercentLib.constructor.contractName, PercentLib.address);
    W12Crowdsale.link(UtilsLib.constructor.contractName, UtilsLib.address);
    W12CrowdsaleFactory.link(PercentLib.constructor.contractName, PercentLib.address);
    W12CrowdsaleFactory.link(UtilsLib.constructor.contractName, UtilsLib.address);
    W12FundFactory.link(FundAccountLib.constructor.contractName, FundAccountLib.address);
    W12Fund.link(FundAccountLib.constructor.contractName, FundAccountLib.address);

    const W12FundFactoryContract = await W12FundFactory.new(semint.encode(version, 4), RatesContract.address);
    const W12CrowdsaleFactoryContract = await W12CrowdsaleFactory.new(semint.encode(version, 4), W12FundFactoryContract.address, RatesContract.address);
    const TokenExchangerContract = await TokenExchanger.new(semint.encode(version, 4));
    const W12ListerStubContract = await W12ListerStub.new(
        semint.encode(version, 4),
        WalletsContract.address,
        W12CrowdsaleFactoryContract.address,
        TokenExchangerContract.address
    );

    await TokenExchangerContract.transferOwnership(W12ListerStubContract.address);
    await VersionsContract.setVersion(W12ListerStubContract.address, semint.encode(version, 4));

    const defaultStagesGenerator = utils.createStagesGenerator();
    const defaultMilestonesGenerator = utils.createMilestonesGenerator();
    const stagesDefaultFixture = (startDate) => defaultStagesGenerator({
        dates: [
            startDate + utils.time.duration.seconds(20),
            startDate + utils.time.duration.seconds(34),
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
            endDate: startDate + utils.time.duration.seconds(35),
            voteEndDate: startDate + utils.time.duration.seconds(36),
            withdrawalWindow: startDate + utils.time.duration.minutes(500)
        }
    ]);

    const TT1 = await WToken.new('TT1', 'TT1', 18);
    const TT2 = await WToken.new('TT2', 'TT2', 2);

    await TT1.mint(accounts[0], '100000000' + '000000000000000000', 0);
    await TT2.mint(accounts[0], '100000000' + '00', 0);

    await RatesContract.addSymbol(web3.fromUtf8('ETH'));
    await RatesContract.addSymbolWithTokenAddress(web3.fromUtf8('TT1'), TT1.address);
    await RatesContract.addSymbolWithTokenAddress(web3.fromUtf8('TT2'), TT2.address);
    await RatesContract.set(web3.fromUtf8('TT1'), '1' + '00000000');
    await RatesContract.set(web3.fromUtf8('TT2'), '2' + '00000000');
    await RatesContract.set(web3.fromUtf8('ETH'), '3' + '00000000');

    await WTokenStubContract.mint(owner, '100000000' + '000000000000000000', 0);
    await WTokenStubContract.approve(W12ListerStubContract.address, '100000000' + '000000000000000000');
    await W12ListerStubContract.whitelistToken(
        owner,
        WTokenStubContract.address,
        await WTokenStubContract.name(),
        await WTokenStubContract.symbol(),
        await WTokenStubContract.decimals(),
        0,
        400,
        200,
        100
    );
    await W12ListerStubContract.placeToken(
        WTokenStubContract.address,
        '1000' + '000000000000000000'
    );
    // initCrowdsale(address tokenAddress, uint amountForSale, uint price)
    await W12ListerStubContract.initCrowdsale(
        WTokenStubContract.address,
        '100' + '000000000000000000',
        '1' + '00000000'
    );
    const crowdsale = W12Crowdsale.at(
        await W12ListerStubContract.getTokenCrowdsale(WTokenStubContract.address, accounts[0])
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

    await crowdsale.buyTokens(web3.fromUtf8('ETH'), web3.toWei(1, 'ether'), {value: web3.toWei(1, 'ether')});
    await TT2.approve(crowdsale.address, 200);
    await crowdsale.buyTokens(web3.fromUtf8('TT2'), 200);

    await utils.time.increaseTo(startDate + utils.time.duration.seconds(34));

    logs.addRecord(VersionsContract.constructor.contractName, VersionsContract.address);
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
