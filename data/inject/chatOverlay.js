// chatOverlay.js
if (typeof browser === "undefined") {
  var browser = chrome;
}

browser.runtime.sendMessage({ action: "dao2damoon" });

window.addEventListener("blur", function () {
  window.focus();
});

window.forceBrowserDefault = (e) => {
  e.stopImmediatePropagation();
  return true;
};

["copy", "cut", "paste"].forEach((e) =>
  document.addEventListener(e, window.forceBrowserDefault, true)
);

(function () {
  "use strict";

  if (!window.__ENABLE_RIGHT_CLICK_SETUP) {
    window.document.addEventListener(
      "contextmenu",
      (event) => {
        event.stopPropagation();
      },
      true
    );
  }
  window.__ENABLE_RIGHT_CLICK_SETUP = true;
})();

(function () {
  // Check if the script has already been injected
  if (window.chatOverlayInjected) {
    console.log("Chat overlay script already injected.");
    return;
  }

  // Set the flag to indicate the script has been injected
  window.chatOverlayInjected = true;

  let chatVisible = false;
  let chatHistory = [];
  let isDraggingOverlay = false;
  let isDraggingButton = false;
  let isResizing = false;
  let offsetX, offsetY;
  let resizeStartX, resizeStartY, resizeStartWidth, resizeStartHeight;
  let stealthMode = false;

  function createChatOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "chat-overlay";
    overlay.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      height: 500px;
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      display: ${chatVisible ? "flex" : "none"};
      flex-direction: column;
      font-family: 'Arial', sans-serif;
      transition: opacity 0.3s ease;
    `;

    const chatHeader = document.createElement("div");
    chatHeader.style.cssText = `
      padding: 15px;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f8f8f8;
      color: #333;
      cursor: move;
    `;
    chatHeader.innerHTML = `
      <span>Chat</span>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span id="stealth-mode" style="cursor: pointer; color: #666; font-size: 13px; padding: 4px 8px; border-radius: 4px; background: #eee;">🔮 Visible</span>
        <span id="clear-chat" style="cursor: pointer; color: #666; font-size: 13px; padding: 4px 8px; border-radius: 4px; background: #eee;">🧹 Clear</span>
        <span id="close-chat" style="cursor: pointer; font-size: 20px; color: #666; padding: 0 4px;">×</span>
      </div>
    `;

    const chatMessages = document.createElement("div");
    chatMessages.id = "chat-messages";
    chatMessages.style.cssText = `
      padding: 15px;
      flex: 1;
      overflow-y: auto;
      background-color: #fafafa;
      color: #333;
    `;

    const chatInputContainer = document.createElement("div");
    chatInputContainer.style.cssText = `
      padding: 15px;
      border-top: 1px solid #ddd;
      background-color: #fff;
      display: flex;
      align-items: center;
    `;

    const chatInput = document.createElement("div");
    chatInput.contentEditable = true;
    chatInput.placeholder = "Type a message...";
    chatInput.style.cssText = `
      width: calc(100% - 40px);
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      outline: none;
      background-color: #fff;
      color: #333;
      min-height: 40px;
      max-height: 100px;
      font-family: 'Arial', sans-serif;
      font-size: 14px;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
      overflow-y: auto;
    `;

    const sendButton = document.createElement("button");
    sendButton.innerHTML = "↩";
    sendButton.style.cssText = `
      margin-left: 10px;
      padding: 10px;
      background-color: #007bff;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;

    const resizeHandle = document.createElement("div");
    resizeHandle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      background-color: #007bff;
      cursor: se-resize;
      border-radius: 0 0 0 0;
    `;

    chatInputContainer.appendChild(chatInput);
    chatInputContainer.appendChild(sendButton);
    overlay.appendChild(chatHeader);
    overlay.appendChild(chatMessages);
    overlay.appendChild(chatInputContainer);
    overlay.appendChild(resizeHandle);
    document.body.appendChild(overlay);

    // Add custom scrollbar styles
    const style = document.createElement("style");
    style.innerHTML = `
      #chat-overlay ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
          transition: 1.0s;
      }

      #chat-overlay ::-webkit-scrollbar-thumb {
          background-color: rgba(127, 127, 127, 0.6);
          background-clip: padding-box;
          border: 2px solid transparent;
          border-radius: 5px;
          transition: 1.0s;
      }

      #chat-overlay ::-webkit-scrollbar-thumb:vertical:hover,
      #chat-overlay ::-webkit-scrollbar-thumb:horizontal:hover {
          background-color: rgb(110, 110, 110);
          transition: 0.3s;
      }

      #chat-overlay ::-webkit-scrollbar-track {
          background-color: transparent;
      }

      #chat-overlay ::-webkit-scrollbar-thumb:vertical:active,
      #chat-overlay ::-webkit-scrollbar-thumb:horizontal:active {
          background: rgba(95, 91, 91, 1);
      }

      #chat-overlay ::-webkit-scrollbar-corner {
          background: none;
      }
    `;
    document.head.appendChild(style);

    chatHeader.addEventListener("mousedown", (e) => {
      isDraggingOverlay = true;
      offsetX = e.clientX - overlay.getBoundingClientRect().left;
      offsetY = e.clientY - overlay.getBoundingClientRect().top;
    });

    resizeHandle.addEventListener("mousedown", (e) => {
      isResizing = true;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      resizeStartWidth = overlay.offsetWidth;
      resizeStartHeight = overlay.offsetHeight;
    });

    document.addEventListener("mousemove", (e) => {
      if (isDraggingOverlay) {
        overlay.style.left = `${e.clientX - offsetX}px`;
        overlay.style.top = `${e.clientY - offsetY}px`;
        overlay.style.bottom = "auto";
        overlay.style.right = "auto";
      }

      if (isResizing) {
        const newWidth = resizeStartWidth + (e.clientX - resizeStartX);
        const newHeight = resizeStartHeight + (e.clientY - resizeStartY);
        overlay.style.width = `${newWidth}px`;
        overlay.style.height = `${newHeight}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDraggingOverlay = false;
      isResizing = false;
    });

    document.getElementById("close-chat").addEventListener("click", () => {
      chatVisible = false;
      overlay.style.display = "none";
    });

    document.getElementById("clear-chat").addEventListener("click", () => {
      chatHistory = [];
      chatMessages.innerHTML = "";
      // Reset context
      browser.runtime.sendMessage({ action: "resetContext" });
    });

    document.getElementById("stealth-mode").addEventListener("click", () => {
      stealthMode = !stealthMode;
      const chatButton = document.getElementById("chat-button");
      if (stealthMode) {
        overlay.style.opacity = "0.15";
        chatButton.style.display = "none";
        document.getElementById("stealth-mode").innerHTML = "⚪ Stealth";
      } else {
        overlay.style.opacity = "1";
        chatButton.style.display = "flex";
        document.getElementById("stealth-mode").innerHTML = "🔮 Visible";
      }

      // Send message with action "tsm" (toggle stealth mode)
      browser.runtime.sendMessage({
        action: "tsm",
        stealthMode: stealthMode,
      });
    });

    sendButton.addEventListener("click", () => {
      const message = chatInput.innerText.trim();
      if (message) {
        chatHistory.push({ role: "user", content: message });
        addMessageToChat(message, "user");
        chatInput.innerText = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Send message to background script for processing
        browser.runtime.sendMessage({
          action: "processChatMessage",
          message,
          context: chatHistory,
        });
      }
    });

    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.altKey && e.key === "t") {
        chatVisible = !chatVisible;
        const overlay = document.getElementById("chat-overlay");
        if (overlay) {
          overlay.style.display = chatVisible ? "flex" : "none";
        } else {
          createChatOverlay();
        }
      }

      if (e.key === "Escape") {
        chatVisible = false;
        overlay.style.display = "none";
      }

      if (e.altKey && e.key === "b") {
        navigator.clipboard
          .readText()
          .then((clipboardText) => {
            const activeElement = document.activeElement;
            if (
              activeElement &&
              (activeElement.isContentEditable ||
                activeElement.tagName === "INPUT" ||
                activeElement.tagName === "TEXTAREA")
            ) {
              if (activeElement.isContentEditable) {
                activeElement.innerText += clipboardText;
              } else {
                activeElement.value += clipboardText;
              }
              // Trigger input event to update the content
              const event = new Event("input", { bubbles: true });
              activeElement.dispatchEvent(event);
            }
          })
          .catch((err) => {
            console.error("Failed to paste: ", err);
          });
      }
    });
  }

  function createChatButton() {
    const button = document.createElement("button");
    button.id = "chat-button";
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background-color: #007bff;
      border: none;
      border-radius: 50%;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    button.innerHTML = "💬";
    document.body.appendChild(button);

    button.addEventListener("dblclick", () => {
      chatVisible = !chatVisible;
      const overlay = document.getElementById("chat-overlay");
      if (overlay) {
        overlay.style.display = chatVisible ? "flex" : "none";
      } else {
        createChatOverlay();
      }
    });

    button.addEventListener("mousedown", (e) => {
      isDraggingButton = true;
      offsetX = e.clientX - button.getBoundingClientRect().left;
      offsetY = e.clientY - button.getBoundingClientRect().top;
    });

    document.addEventListener("mousemove", (e) => {
      if (isDraggingButton) {
        button.style.left = `${e.clientX - offsetX}px`;
        button.style.top = `${e.clientY - offsetY}px`;
        button.style.bottom = "auto";
        button.style.right = "auto";
      }
    });

    document.addEventListener("mouseup", () => {
      isDraggingButton = false;
    });
  }

  function addMessageToChat(message, role) {
    const chatMessages = document.getElementById("chat-messages");
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
      margin-bottom: 10px;
      padding: 10px;
      border-radius: 8px;
      max-width: 90%;
      word-wrap: break-word;
    `;

    if (role === "user") {
      messageDiv.style.backgroundColor = "#dcf8c6";
      messageDiv.style.alignSelf = "flex-end";
      messageDiv.style.paddingLeft = "10px";
    } else {
      messageDiv.style.backgroundColor = "#f1f1f1";
      messageDiv.style.alignSelf = "flex-start";
      messageDiv.style.border = "1px solid #ddd";
      messageDiv.style.paddingLeft = "10px";
    }

    const converter = new showdown.Converter();
    const htmlContent = converter.makeHtml(message);

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    tempDiv.querySelectorAll("pre code").forEach((block) => {
      block.style.border = "1px solid #ddd";
      block.style.borderRadius = "4px";
      block.style.padding = "12px";
      block.style.display = "block";
      block.style.margin = "15px 0";
      block.style.overflowX = "auto";
      block.style.whiteSpace = "pre";

      const button = document.createElement("button");
      button.innerText = "Copy";
      button.style.cssText = `
        position: absolute;
        right: 10px;
        top: 10px;
        background-color: #007bff;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        padding: 5px 10px;
      `;
      button.addEventListener("click", () => {
        navigator.clipboard
          .writeText(block.innerText)
          .then(() => {
            button.innerText = "Copied";
            setTimeout(() => {
              button.innerText = "Copy";
            }, 5000);
          })
          .catch((err) => {
            console.error("Failed to copy: ", err);
          });
      });
      block.parentNode.style.position = "relative";
      block.parentNode.appendChild(button);
    });

    messageDiv.appendChild(tempDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Initialize chat button
  createChatButton();

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateChatHistory") {
      const { role, content } = message;
      chatHistory.push({ role, content });
      addMessageToChat(content, role);
    }
  });
})();
