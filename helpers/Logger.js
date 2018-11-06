class Logger {
    constructor(id) {
        this.id = id;
        this.messages = [];
    }

    addRecord(name, address) {
        this.messages.push(`${name}: ${address}`);
    }

    flush() {
        console.log(`Logs id: ${this.id}`);
        console.log(this.messages.join('\n'));
        this.messages = [];
    }
}

module.exports = Logger;
