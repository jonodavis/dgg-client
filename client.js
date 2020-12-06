const WebSocket = require("ws");
const blessed = require("blessed");
const cookie = require("cookie");
const emojiRegex = require("emoji-regex/es2015/index.js");
// const emojiRegexText = require("emoji-regex/es2015/text.js");
const config = require("./config.json");
const flairs = require("./flairs.json");

let showUsers = config.showUsers;
let showTimestamp = config.showTimestamp;
let flairsMap = new Map();
let userMap = new Map();
flairs.forEach(v => flairsMap.set(v.name, v));

const ws = new WebSocket("wss://chat.destiny.gg/ws", {
  headers: { Cookie: cookie.serialize("authtoken", config.authtoken) }
});

const screen = blessed.screen({
  smartCSR: true,
  title: "destiny.gg",
  fullUnicode: true
});

const chatBox = blessed.box({
  label: "destiny.gg",
  width: "100%-20",
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
  scrollOnInput: false,
  mouse: true,
  keys: true
});

const inputBox = blessed.box({
  label: `Write something ${config.username}...`,
  bottom: "0",
  width: "100%-20",
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
  border: {
    type: "line"
  }
});

userList = blessed.list({
  parent: userBox,
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  keys: true,
  invertSelected: false,
})

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

  // remove emojis from message
  const regex = emojiRegex();
  let match;
  while ((match = regex.exec(msg.data))) {
    const emoji = match[0];
    msg.data = msg.data.replace(emoji, "[emoji]");
  }

  // first packet sent by server, used to fill user list
  if (type === "NAMES") {
    msg.users.forEach(user => {
      userMap.set(user.nick, user);
    });
    let userName;
    msg.users.sort(userComparator).forEach(user => {
      let userFeatures = (user.features || [])
        .filter(e => flairsMap.has(e))
        .map(e => flairsMap.get(e))
        .sort((a, b) => (a.priority < b.priority ? 1 : -1))
        .reduce((str, e) => e.color, "");

      if (userFeatures) {
        userName = `{${userFeatures}-fg}${user.nick}{/}`;
      } else {
        userName = user.nick;
      }

      userList.add(userName);
    });

    chatLog.log(
      `Serving {cyan-fg}${msg.connectioncount}{/} connections and {cyan-fg}${msg.users.length}{/} users.`
    );
  }

  if (type === "MSG") {
    let name, data;

    if (
      msg.data.toLowerCase().includes("nsfw") ||
      msg.data.toLowerCase().includes("nsfl")
    ) {
      data = `{red-fg}${msg.data}{/}`;
    } else {
      data = msg.data;
    }

    let features = (msg.features || [])
      .filter(e => flairsMap.has(e))
      .map(e => flairsMap.get(e))
      .sort((a, b) => (a.priority < b.priority ? 1 : -1))
      .reduce((str, e) => e.color, "");

    if (features) {
      name = `{${features}-fg}{bold}${msg.nick}{/}`;
    } else {
      name = `{bold}${msg.nick}{/}`;
    }

    if (msg.data[0] === ">") {
      data = `{green-fg}${data}{/}`;
    }

    if (showTimestamp) {
      let timestamp = new Date(msg.timestamp).toUTCString();
      chatLog.log("[" + timestamp + "] " + name + ": " + data);
    } else {
      chatLog.log(name + ": " + data);
    }
    
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
    inputBox.width = "100%-20";
    chatBox.width = "100%-20";
    showUsers = true;
  } else if (text === "/timestamps") {
    showTimestamp = !showTimestamp;
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

const userComparator = (a, b) => {
  const u1 = userMap.get(a.nick);
  const u2 = userMap.get(b.nick);
  if (!u1 || !u2) return 0;
  let v1, v2;

  v1 = u1.features.includes("admin") || u1.features.includes("vip");
  v2 = u2.features.includes("admin") || u2.features.includes("vip");
  if (v1 > v2) return -1;
  if (v1 < v2) return 1;

  v1 = u1.features.includes("flair11");
  v2 = u2.features.includes("flair11");
  if (v1 > v2) return 1;
  if (v1 < v2) return -1;
  v1 = u1.features.includes("bot");
  v2 = u2.features.includes("bot");
  if (v1 > v2) return 1;
  if (v1 < v2) return -1;

  v1 = u1.features.includes("flair12") || u1.features.includes("flair12");
  v2 = u2.features.includes("flair12") || u2.features.includes("flair12");
  if (v1 > v2) return -1;
  if (v1 < v2) return 1;

  v1 = u1.features.includes("subscriber") || u1.features.includes("subscriber");
  v2 = u2.features.includes("subscriber") || u2.features.includes("subscriber");
  if (v1 > v2) return -1;
  if (v1 < v2) return 1;

  let u1Nick = u1.nick.toLowerCase(),
    u2Nick = u2.nick.toLowerCase();

  if (u1Nick < u2Nick) return -1;
  if (u1Nick > u2Nick) return 1;
  return 0;
};

input.key(["C-c"], () => process.exit(0));

screen.append(chatBox);
screen.append(inputBox);
screen.append(userBox);

screen.render();

input.focus();

chatLog.log(`{cyan-fg}Connecting to destiny.gg ...{/}`);
