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
  width: "100%-21",
  height: "100%-3",
  border: {
    type: "line"
  }
});

const chatLog = blessed.log({
  width: "100%-22",
  parent: chatBox,
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  keys: true,
});

const inputBox = blessed.box({
  label: "Write something...",
  bottom: "0",
  width: "100%-21",
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
  width: 20,
  height: "100%",
  tags: true,
  scrollable: true,
  alwaysScroll: true,
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
    msg.users.sort((a, b) => (a.nick < b.nick ? 1 : -1));
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
      data = `{red-fg}${msg.data}{/}`;
    } else {
      data = msg.data;
    }

    if (msg.features.includes("admin")) {
      name = `{red-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("flair12")) {
      name = `{yellow-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("bot")) {
      name = `🤖 {bold}${msg.nick}{/}`;
    } else if (msg.features.includes("protected")) {
      name = `✔ {blue-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("subscriber")) {
      name = `{blue-fg}{bold}${msg.nick}{/}`;
    } else {
      name = `{bold}${msg.nick}{/}`;
    }

    if (msg.data[0] === ">") {
      data = `{green-fg}${data}{/}`;
    }

    chatLog.log(name + ": " + data);
  }
});

let users = true;

input.key("enter", () => {
  const text = input.getValue();
  if (text === "/users" && users) {
    screen.remove(userBox);
    inputBox.width = "100%";
    chatBox.width = "100%";
    chatLog.width = "100%-1";
    users = false;
  } else if (text === "/users" && !users) {
    screen.append(userBox);
    inputBox.width = "100%-21";
    chatBox.width = "100%-21";
    chatLog.width = "100%-22";
    users = true;
  } else {
    chatLog.log(`{right}${text} <-{/right}`);
    // socket.emit(CHAT_MESSAGE, {
    //   username: name,
    //   text,
    // });
  }
  

  input.clearValue();
  input.focus();
});

input.key(["C-c"], () => process.exit(0));

screen.append(chatBox);
screen.append(inputBox);
screen.append(userBox);

screen.render();

input.focus();

chatLog.log(`{cyan-fg}Connecting to destiny.gg ...{/}`);
