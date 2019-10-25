const WebSocket = require("ws");
const chalk = require("chalk");
const blessed = require("blessed");

const ws = new WebSocket("wss://www.destiny.gg/ws");

const screen = blessed.screen({
  smartCSR: true,
  title: "destiny.gg",
  fullUnicode: true
});

const chatBox = blessed.box({
  label: "destiny.gg",
  width: "80%",
  height: "100%-3",
  border: {
    type: "line"
  }
});

const chatLog = blessed.log({
  parent: chatBox,
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: "",
    inverse: true
  },
  mouse: true
});

const inputBox = blessed.box({
  label: "Type your message (press enter to send)",
  bottom: "0",
  width: "80%",
  height: 3,
  border: {
    type: "line"
  }
});

const input = blessed.textbox({
  parent: inputBox,
  inputOnFocus: true
});

const userBox = blessed.box({
  label: "Users",
  right: "0",
  width: "20%",
  height: "100%",
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: "",
    inverse: true
  },
  mouse: true,
  keys: true,
  border: {
    type: "line"
  }
});


// runs on opening of the websocket
ws.on("open", function open() {
  chatLog.log(chalk.cyan(`Connected.`));
});

// runs on each message received by the websocket
ws.on("message", function incoming(data) {
  // FORMAT OF DATA:
  // MSG {
  //   "nick":"bird",
  //   "features":["subscriber","flair9"],
  //   "timestamp":1571967272433,
  //   "data":"NO GODSTINY BURN EVERY BRIDGE PEPE"
  // }
  const type = data.split(" ")[0];
  let msg = JSON.parse(data.substring(data.indexOf(" ")));

  if (type === "NAMES") {
    // let feats = [];
    // msg.users.forEach(user => {
    //   user.features.forEach(feat => {
    //     if (!feats.includes(feat)) {
    //       feats.push(feat);
    //     }
    //   });
    // });
    msg.users.forEach(user => {
      userBox.insertLine(1, user.nick);
    });

    chatLog.log(
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

    if (msg.data[0] === '>') {
      data = chalk.green(data);
    }

    chatLog.log(name + ": " + data);
  }
});

input.key("enter", () => {
  const text = input.getValue();
  chatLog.log(`{right}${text} <-{/right}`);
  // socket.emit(CHAT_MESSAGE, {
  //   username: name,
  //   text,
  // });

  input.clearValue();
  input.focus();
});

input.key(["C-c"], () => process.exit(0));

screen.append(chatBox);
screen.append(inputBox);
screen.append(userBox);

screen.render();

input.focus();

chatLog.log(chalk.cyan(`Connecting to destiny.gg ...`));
