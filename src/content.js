// Function to check if loading spinner is present
function isLoadingSpinnerPresent(container) {
  return container.querySelector(".loading-spinner") !== null;
}

// Function to show loading spinner
function showLoadingSpinner(container) {
  const loadingSVG = document.createElement("div");
  loadingSVG.className = "loading-spinner";
  loadingSVG.innerHTML = `<svg
  id="loading-spinner"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 100"
  preserveAspectRatio="xMidYMid"
  class="loading-svg"
>
  <circle cx="50" cy="50" fill="none" stroke="#3490dc" stroke-width="8" r="40" stroke-dasharray="188.49555921538757 64.83185307179586">
    <animateTransform
      attributeName="transform"
      type="rotate"
      repeatCount="indefinite"
      dur="1s"
      keyTimes="0;1"
      values="0 50 50;360 50 50"
    ></animateTransform>
  </circle>
</svg>`;
  container.appendChild(loadingSVG);
}

// Function to hide loading spinner
function hideLoadingSpinner(container) {
  const loadingSpinner = container.querySelector(".loading-spinner");
  if (loadingSpinner) {
    container.removeChild(loadingSpinner);
  }
}

function generateReply() {
  window.articles = document.querySelectorAll('[data-testid="tweet"]');

  if (window.articles) {
    const shadowRootStyles = `
          /* Add your Tailwind styles or regular CSS styles here */
          /* Example: */
          .generated-reply-container {
            border-style: solid;
            border-radius: 5px;
            border-width: 2px;
            padding: 15px;
          }

          /* Styles for the button */
          .button {
            background-color: #3490dc;
            border: 1px solid #3490dc; /* Add blue border on focus */
            color: #ffffff;
            border-radius: 0.25rem;
            padding: 0.5rem 1rem;
            font-weight: bold;
            cursor: pointer;
            margin-top: 5px;
            transition: background-color 0.2s ease, border-color 0.2s ease;
          }

          .button:focus {
            background-color: #2779bd;
            border: 2px solid black; /* Add blue border on focus */
          }

          /* Hover effect */
          .button:hover {
            background-color: #2779bd;
          }

          /* Active effect */
          .button:active {
            background-color: #1c6ca5;
          }


        `;
    const loadingSpinnerStyles = `
          .loading-spinner {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
          }
          
          .loading-svg {
            width: 50px;
            height: 50px;
            animation: rotate 2s linear infinite;
          }
          
          @keyframes rotate {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }`;

    const user = document.querySelector(
      '[data-testid="AppTabBar_Profile_Link"]'
    );
    const userHandle = "@" + user.href.split("/")[3];

    console.log(window.articles);

    window.articles.forEach(async (article) => {
      const content = article.querySelector(
        '[data-testid="tweet"] [data-testid="tweetText"]'
      );
      const user = article.querySelector(
        '[data-testid="tweet"] [data-testid="User-Name"]'
      );

      const spans = user.querySelectorAll("span");
      let username = "";
      for (let i = 0; i < spans.length; i++) {
        if (spans[i].innerText.startsWith("@")) {
          username = spans[i].innerText || "";
          break;
        }
      }

      if (userHandle == username) {
        console.log("Don't reply to yourself");
        return;
      }

      const tweetRef = article.querySelectorAll('[id="generated-reply"]');

      if (tweetRef.length > 0) {
        console.log("already generated");
        return;
      }

      const tweetContainer = document.createElement("div");

      const shadowRoot = tweetContainer.attachShadow({ mode: "open" });
      const styleElement = document.createElement("style");
      styleElement.textContent = shadowRootStyles;
      shadowRoot.appendChild(styleElement);

      if (isLoadingSpinnerPresent(content)) {
        return;
      }

      const loadingStyle = document.createElement("style");
      loadingStyle.textContent = loadingSpinnerStyles;
      content.appendChild(loadingStyle);
      showLoadingSpinner(content);

      if (content == undefined) {
        console.log("No content");
        return;
      }
      console.log(content.innerText);
      console.log(content);

      const allRefs = user.querySelectorAll("a");
      console.log(allRefs);
      if (allRefs.length < 3) {
        console.log("Not enough refs");
        return;
      }

      const ref = allRefs[2].getAttribute("href");
      const tweetId = ref.split("/")[3];
      console.log(tweetId);

      // Log the extracted information to the console
      const div = document.createElement("div");
      div.className = "generated-reply-container"; // Apply Tailwind classes or use custom class names

      const apiKey = await chrome.storage.local.get(["open-ai-key"]);
      const gptQuery = await chrome.storage.local.get(["gpt-query"]);

      const model = await chrome.storage.local.get(["openai-model"]);
      console.log(`Using model: ${model["openai-model"]}`);

      const providerObj = await chrome.storage.local.get(["provider"]);
      const provider = providerObj["provider"] || "openai";
      let endpoint;
      if (provider === "deepseek") {
        endpoint = "https://api.deepseek.com/v1/chat/completions";
      } else if (provider === "openrouter") {
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
      } else if (provider === "grok") {
        endpoint = "https://api.x.ai/v1/chat/completions";
      } else {
        endpoint = "https://api.openai.com/v1/chat/completions";
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey["open-ai-key"],
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                gptQuery["gpt-query"] ||
                "You are a ghostwriter and reply to the user's tweets by talking directly to the person, you must keep it short, exclude hashtags.",
            },
            {
              role: "user",
              content: "[username] wrote [tweet]"
                .replace("[username]", username)
                .replace("[tweet]", content.innerText),
            },
          ],
          model: model["openai-model"],
          temperature: 1,
          max_tokens: 256,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      });

      if (!response.ok) {
        // creates a modal error over twitter content
        const errorMessage =
          "Error while generating a reply for this tweet: " +
          (await response.json()).error.message;
        let p = document.createElement("p");
        p.innerHTML = errorMessage;
        p.style.marginBottom = "5px";
        p.style.marginTop = "5px";
        div.appendChild(p);

        // Create the button
        let button = document.createElement("button");
        button.innerText = "Report Issue";
        button.classList.add("button");
        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.marginTop = "10px";

        div.appendChild(button);
        shadowRoot.appendChild(div);
        content.appendChild(shadowRoot);
        return;
      }

      const resp = await response.json();
      hideLoadingSpinner(content);

      let p = document.createElement("p");
      p.innerHTML = "Generated reply: ";
      p.style.marginBottom = "5px";
      p.style.marginTop = "5px";
      div.appendChild(p);

      resp.choices.forEach((choice) => {
        if (
          !choice.message ||
          !choice.message.content ||
          !choice.message.content.trim()
        ) {
          let blankMsg = document.createElement("p");
          blankMsg.innerHTML =
            "No reply generated. The model may have returned a blank response or filtered your prompt.";
          blankMsg.style.color = "red";
          blankMsg.style.marginBottom = "5px";
          blankMsg.style.marginTop = "5px";
          div.appendChild(blankMsg);
          return;
        }
        let link = document.createElement("a");
        link.id = "generated-reply";
        link.href =
          "https://twitter.com/intent/tweet?text=" +
          encodeURIComponent(choice.message.content) +
          "&in_reply_to=" +
          tweetId;
        link.target = "_blank";
        link.innerHTML = choice.message.content;
        link.style.marginTop = "10px";
        link.style.color = "rgb(0, 0, 0)";
        link.style.textDecoration = "none";
        // Analytics block removed

        let buttonReply = document.createElement("button");
        buttonReply.id = "generated-reply";
        buttonReply.setAttribute(
          "data-link",
          "https://twitter.com/intent/tweet?text=" +
            encodeURIComponent(choice.message.content) +
            "&in_reply_to=" +
            tweetId
        );
        buttonReply.classList.add("button");
        buttonReply.style.display = "flex";
        buttonReply.style.alignItems = "center";
        buttonReply.style.marginTop = "10px";

        // Create an SVG element for the icon
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");
        svg.setAttribute("viewBox", "0 0 512 512");

        // Create the SVG path for the paper plane icon
        let path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        path.setAttribute(
          "d",
          "M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"
        );
        path.setAttribute("fill", "white"); // Set the icon color to the current text color

        svg.appendChild(path);
        buttonReply.appendChild(svg);

        // Add text to the button
        let buttonText = document.createElement("span");
        buttonText.innerText = "Send reply";
        buttonText.style.marginLeft = "10px";
        buttonReply.appendChild(buttonText);

        let br = document.createElement("br");
        link.appendChild(br);
        link.appendChild(buttonReply);

        div.appendChild(link);
      });

      shadowRoot.appendChild(div);
      content.appendChild(shadowRoot);
    });
  }
}

window.generateReply = generateReply;

generateReply();

// --- AUTO-REPLY AUTOMATION ---
(function autoReplyInit() {
  let autoReplyActive = false;
  let autoReplyTimer = null;
  let fakeCursor = null;

  async function getSettings() {
    const settings = await chrome.storage.local.get([
      "auto-reply-enabled",
      "auto-reply-users",
    ]);
    return {
      enabled: !!settings["auto-reply-enabled"],
      users: (settings["auto-reply-users"] || "")
        .split(/[,\n]+/)
        .map((u) => u.trim().replace(/^@/, ""))
        .filter(Boolean),
    };
  }

  function getVisibleTweets() {
    return Array.from(document.querySelectorAll('[data-testid="tweet"]'));
  }

  function getTweetUsername(article) {
    const user = article.querySelector('[data-testid="User-Name"]');
    if (!user) return null;
    const spans = user.querySelectorAll("span");
    for (let i = 0; i < spans.length; i++) {
      if (spans[i].innerText.startsWith("@")) {
        return spans[i].innerText.replace(/^@/, "").trim();
      }
    }
    return null;
  }

  function hasGeneratedReply(article) {
    return article.querySelectorAll('[id="generated-reply"]').length > 0;
  }

  function pickTargetTweet(tweets, targetUsers) {
    for (const article of tweets) {
      const username = getTweetUsername(article);
      if (
        username &&
        targetUsers.includes(username) &&
        !hasGeneratedReply(article)
      ) {
        return article;
      }
    }
    return null;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function simulateMouseMovement() {
    // Create a fake cursor if not present
    if (!fakeCursor) {
      fakeCursor = document.createElement("div");
      fakeCursor.style.position = "fixed";
      fakeCursor.style.zIndex = 99999;
      fakeCursor.style.width = "18px";
      fakeCursor.style.height = "18px";
      fakeCursor.style.borderRadius = "50%";
      fakeCursor.style.background = "rgba(37,99,235,0.7)";
      fakeCursor.style.pointerEvents = "none";
      fakeCursor.style.transition =
        "top 0.4s cubic-bezier(.4,2,.6,1), left 0.4s cubic-bezier(.4,2,.6,1)";
      document.body.appendChild(fakeCursor);
    }
    // Move to a random position on the viewport
    const x = randomInt(20, window.innerWidth - 20);
    const y = randomInt(60, window.innerHeight - 20);
    fakeCursor.style.left = x + "px";
    fakeCursor.style.top = y + "px";
    // Optionally, trigger mouseover on a random element
    const elements = document.elementsFromPoint(x, y);
    if (elements.length > 1) {
      const el = elements[1];
      const evt = new MouseEvent("mouseover", { bubbles: true });
      el.dispatchEvent(evt);
    }
  }

  async function autoReplyLoop() {
    if (!autoReplyActive) return;
    const { enabled, users } = await getSettings();
    if (!enabled || !users.length) {
      autoReplyActive = false;
      if (fakeCursor) {
        fakeCursor.remove();
        fakeCursor = null;
      }
      return;
    }
    const tweets = getVisibleTweets();
    const targetTweet = pickTargetTweet(tweets, users);
    if (targetTweet) {
      // Scroll into view and simulate mouse movement
      targetTweet.scrollIntoView({ behavior: "smooth", block: "center" });
      simulateMouseMovement();
      // Wait a bit before replying to look more human
      setTimeout(() => {
        window.generateReply && window.generateReply();
      }, randomInt(1200, 2200));
    } else {
      simulateMouseMovement();
    }
    // Schedule next run
    const nextDelay = randomInt(30000, 40000); // 30-40s
    autoReplyTimer = setTimeout(autoReplyLoop, nextDelay);
  }

  async function startAutoReplyIfEnabled() {
    const { enabled } = await getSettings();
    if (enabled && !autoReplyActive) {
      autoReplyActive = true;
      autoReplyLoop();
    }
  }

  // Listen for changes in storage to start/stop automation
  chrome.storage.onChanged.addListener((changes, area) => {
    if (
      area === "local" &&
      ("auto-reply-enabled" in changes || "auto-reply-users" in changes)
    ) {
      getSettings().then(({ enabled }) => {
        if (enabled && !autoReplyActive) {
          autoReplyActive = true;
          autoReplyLoop();
        } else if (!enabled && autoReplyActive) {
          autoReplyActive = false;
          if (autoReplyTimer) clearTimeout(autoReplyTimer);
          if (fakeCursor) {
            fakeCursor.remove();
            fakeCursor = null;
          }
        }
      });
    }
  });

  // Initial check on load
  startAutoReplyIfEnabled();
})();
