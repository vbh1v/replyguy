chrome.commands.onCommand.addListener((command) => {
  console.log("Handling: " + command);

  if (command === "generate_reply") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["src/content.js"],
      });
    });
  } else if (command === "move_to_next_button") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["src/move-to-next-button.js"],
      });
    });
  } else if (command === "move_to_previous_button") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["src/move-to-previous-button.js"],
      });
    });
  } else if (command === "toggle_auto_reply") {
    chrome.storage.local.get(["auto-reply-enabled"], (result) => {
      const current = !!result["auto-reply-enabled"];
      chrome.storage.local.set({ "auto-reply-enabled": !current }, () => {
        console.log("Auto-reply toggled. Now:", !current);
      });
    });
  }
});

//chrome.scripting.registerContentScripts({
//  matches: ["https://twitter.com/*"],
//  files: ['src/single-reply-content.js'],
//});

chrome.runtime.onInstalled.addListener(async function (details) {
  console.log("Handling runtime install...", ...arguments);

  const self = await chrome.management.getSelf();

  if (details.reason === "update" && self.installType !== "development") {
    const changelogUrl = chrome.runtime.getURL("src/changelog.html");

    chrome.tabs.create({ url: changelogUrl });
  }
});
