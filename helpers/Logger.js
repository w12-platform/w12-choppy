class Logger {
    constructor(sender) {
        this.sender = sender;
        this.messages = [];
    }

    addRecord(name, address) {
        this.messages.push(`${name}: ${address}`);
    }

    flush() {
        console.log(`Logs from: ${this.sender}`);
        console.log(this.messages.join('\n'));
        this.messages = [];
    }
}

module.exports = Logger;
