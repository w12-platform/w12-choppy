const Runner = new require('../helpers/Runner');
const Logger = new require('../helpers/Logger');

const WToken = artifacts.require('WToken');

const version = '0.23.2';

const base = require('../parts/0.23.2/base');
const runner = new Runner(this);

module.exports = runner.generateHandler(async (ctx) => {
    const _artifacts = await require('../parts/0.23.2/artifacts')(artifacts);
    const utils = ctx.utils;

    const logs = new Logger(__filename);
    const accounts = web3.eth.accounts;

    const owner = accounts[0];
    const serviceWallet = accounts[0];

    logs.addRecord('Owner', owner);

    const {
        VersionsLedgerContract,
        WTokenStubContract,
        WTokenTestHelperContract,
        W12FundFactoryContract,
        W12CrowdsaleFactoryContract,
        TokenExchangerContract,
        W12ListerStubContract,
        W12Crowdsale
    } = await base(_artifacts);

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
            withdrawalWindow: startDate + utils.time.duration.seconds(37)
        },
        {
            endDate: startDate + utils.time.duration.seconds(38),
            voteEndDate: startDate + utils.time.duration.seconds(39),
            withdrawalWindow: startDate + utils.time.duration.minutes(500)
        }
    ]);

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
        '1' + '000000'
    );

    const crowdsale = W12Crowdsale.at(
        await W12ListerStubContract.getTokenCrowdsale(WTokenStubContract.address, accounts[0])
    );
    const startDate = web3.eth.getBlock('latest').timestamp;

    await crowdsale.setup(
        ...utils.packSetupCrowdsaleParameters_v0_23_2(
            stagesDefaultFixture(startDate),
            milestonesDefaultFixture(startDate)
        )
    );
    await utils.time.increaseTo(startDate + utils.time.duration.seconds(20));

    await crowdsale.buyTokens({value: '1000000' + '0'});

    logs.addRecord(VersionsLedgerContract.constructor.contractName, VersionsLedgerContract.address);
    logs.addRecord(WTokenStubContract.constructor.contractName, WTokenStubContract.address);
    logs.addRecord(WTokenTestHelperContract.constructor.contractName, WTokenTestHelperContract.address);
    logs.addRecord(W12ListerStubContract.constructor.contractName, W12ListerStubContract.address);
    logs.addRecord(TokenExchangerContract.constructor.contractName, TokenExchangerContract.address);
    logs.addRecord(W12FundFactoryContract.constructor.contractName, W12FundFactoryContract.address);
    logs.addRecord(W12CrowdsaleFactoryContract.constructor.contractName, W12CrowdsaleFactoryContract.address);

    logs.flush();
});
