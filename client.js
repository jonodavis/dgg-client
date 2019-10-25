const WebSocket = require("ws");
const chalk = require("chalk");
const log = console.log;

const ws = new WebSocket("wss://www.destiny.gg/ws");

// runs on opening of the websocket
ws.on("open", function open() {
  log(chalk.cyan(`Connected.`));
});

// runs on each message received by the websocket
ws.on("message", function incoming(data) {
  // FORMAT OF DATA:
  // MSG
  // {
  //   "nick":"bird",
  //   "features":["subscriber","flair9"],
  //   "timestamp":1571967272433,
  //   "data":"NO GODSTINY BURN EVERY BRIDGE PEPE"
  // }
  const type = data.split(" ")[0];
  let msg = JSON.parse(data.substring(data.indexOf(" ")));
  let feats = [];
  if (type === "NAMES") {
    // msg.users.forEach(user => {
    //   user.features.forEach(feat => {
    //     if (!feats.includes(feat)) {
    //       feats.push(feat);
    //     }
    //   });
    // });
    log(
      `Serving ${chalk.cyan(msg.connectioncount)} connections and ${chalk.cyan(
        msg.users.length
      )} users.`
    );
  }
  if (type === "MSG") {
    let name, data;

    if (msg.data.toLowerCase().includes("nsfw")) {
      data = chalk.red(msg.data);
    } else {
      data = msg.data;
    }

    if (msg.features.includes("admin")) {
      name = chalk.red.bold(msg.nick);
    } else if (msg.features.includes("flair12")) {
      name = chalk.yellow.bold(msg.nick);
    } else if (msg.features.includes("bot")) {
      name = `🤖 ${chalk.dim(msg.nick)}`;
      data = chalk.dim(data);
    } else if (msg.features.includes("protected")) {
      name = `✔ ${chalk.blue.bold(msg.nick)}`;
    } else if (msg.features.includes("subscriber")) {
      name = chalk.blue.bold(msg.nick);
    } else {
      name = chalk.bold(msg.nick);
    }
    log(name + ": " + data);
  }
});

log(chalk.cyan(`Connecting to destiny.gg ...`));
