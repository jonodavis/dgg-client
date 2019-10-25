const WebSocket = require('ws');
const chalk = require('chalk');
const wrap = require('word-wrap');
const log = console.log;

const ws = new WebSocket('wss://www.destiny.gg/ws');

ws.on('open', function open() {
  log(chalk.cyan(`Connected to destiny.gg`))
});

ws.on('message', function incoming(data) {
  const type = data.split(" ")[0]
  if (type === "MSG") {
    let msg = JSON.parse(data.substring(data.indexOf(" ")))
    if (msg.features.includes('admin')){
      log(`${chalk.red.bold(msg.nick)}: ${msg.data}`)
      return;
    }
    if (msg.features.includes('flair12')){
      log(`${chalk.yellow.bold(msg.nick)}: ${msg.data}`)
      return;
    }
    if (msg.features.includes('bot')){
      log(`🤖  ${chalk.dim(msg.nick)}: ${chalk.dim(msg.data)}`)
      return;
    }
    if (msg.features.includes('protected')){
      log(`✔  ${chalk.blue.bold(msg.nick)}: ${msg.data}`)
      return;
    }
    if (msg.features.includes('subscriber')) {
      log(`${chalk.blue.bold(msg.nick)}: ${msg.data}`)
      return;
    }
    log(`${chalk.bold(msg.nick)}: ${msg.data}`)
  }
});
