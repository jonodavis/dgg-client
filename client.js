const WebSocket = require("ws");
const blessed = require("blessed");
const cookie = require("cookie");
const config = require("./config.json");

let showUsers = config.showUsers;

const ws = new WebSocket("wss://www.destiny.gg/ws", {
  headers: { Cookie: cookie.serialize("authtoken", config.authtoken) }
});

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
  parent: chatBox,
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  keys: true
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
  chatLog.log(`{cyan-fg}Connected.{/}`);
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
      `Serving {cyan-fg}${msg.connectioncount}{/} connections and {cyan-fg}${msg.users.length}{/} users.`
    );
  }
  if (type === "MSG") {
    let name, data;

    if (msg.data.toLowerCase().includes("nsfw") || msg.data.toLowerCase().includes("nsfl")) {
      data = `{red-fg}${msg.data}{/}`;
    } else {
      data = msg.data;
    }

    if (msg.features.includes("flair17")) {
      name = `{#FCE205-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("admin")) {
      name = `{#EE1F1F-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("vip")) {
      name = `{#DB4C1C-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("flair12")) {
      name = `{#E79015-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("flair8")) {
      name = `{#DD29D2-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("flair3")) {
      name = `{#DD29D2-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("flair1")) {
      name = `{#2ADDC8-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("flair13")) {
      name = `{#59AEEA-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("flair9")) {
      name = `{#59AEEA-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("subscriber")) {
      name = `{#59AEEA-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("bot")) {
      name = `{#0088CC-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("flair11")) {
      name = `{#929292-fg}{bold}${msg.nick}{/}`;
    } else if (msg.features.includes("flair18")) {
      name = `{#B9B9B9-fg}{bold}${msg.nick}{/}`;
    } else {
      name = `{bold}${msg.nick}{/}`;
    }

    if (msg.data[0] === ">") {
      data = `{green-fg}${data}{/}`;
    }

    chatLog.log(name + ": " + data);
  }
});

input.key("enter", () => {
  const text = input.getValue();
  if (text === "/users" && showUsers) {
    screen.remove(userBox);
    inputBox.width = "100%";
    chatBox.width = "100%";
    showUsers = false;
  } else if (text === "/users" && !showUsers) {
    screen.append(userBox);
    inputBox.width = "100%-21";
    chatBox.width = "100%-21";
    showUsers = true;
  } else {
    send("MSG", { data: text });
  }
  input.clearValue();
  input.focus();
});

const send = (eventname, data) => {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  ws.send(`${eventname} ${payload}`);
};

ws.on("error", function incoming(response) {
  chatLog.log(response);
});

// ws.on("upgrade", function incoming(response) {
//   chatLog.log(response);
// });

input.key(["C-c"], () => process.exit(0));

screen.append(chatBox);
screen.append(inputBox);
screen.append(userBox);

screen.render();

input.focus();

chatLog.log(`{cyan-fg}Connecting to destiny.gg ...{/}`);
