module.exports = {
    networkHint: false, // dont`t print hints
    quiet: true, // don`t print compile logs
    networks: {
        development: {
            host: '127.0.0.1',
            port: 7545,
            network_id: '*',
            gasPrice: 0,
            gas: 8000000
        },
    },
    solc: {
        optimizer: {
            enabled: true
        }
    }
};
