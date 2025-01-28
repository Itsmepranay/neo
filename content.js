if (browser === undefined) {
  var browser = chrome;
}

var sc = document.createElement('script');
sc.src = browser.runtime.getURL("anti-anti-debug.js");
var it = document.head || document.documentElement;

it.appendChild(sc)
sc.remove();

(function() {
  // Override offline detection to always think it's online
  window.onoffline = function() {
    this.isOffline.next(false); // Always set to online
  };

  // Override copy-paste handlers
  window.removeEventListener("copy", window.handleCopy, true);
  window.removeEventListener("cut", window.handleCopy, true);
  window.removeEventListener("paste", window.handlePaste.bind(window), true);
  window.removeEventListener("drop", window.handlePaste.bind(window), true);
  window.removeEventListener("dragstart", window.handleDragStart, true);

  // Override DevTools detection
  if (window.w && window.w.addListener) {
    window.w.removeListener(window.devtoolsListener);
    window.w.stop();
  }

  // Override leave alert
  window.onbeforeunload = null;

  // Override window blur and focus handlers
  window.onblur = null;
  window.onfocus = null;

  // Override presentation detection
  if (window.PresentationRequest) {
    window.PresentationRequest = null;
  }

  // Override message handler for project questions
  window.removeEventListener("message", window.messageHandler, true);


  // Function to handle paste events
  function handlePaste(event) {
    const clipboardData = event.clipboardData;
    const dataTransfer = event.dataTransfer;
    const text = clipboardData ? clipboardData.getData("text") : "";
    const transferredText = dataTransfer ? dataTransfer.getData("text") : "";
    const pastedText = text || transferredText;

    // Allow pasting
    document.execCommand("insertText", false, pastedText);
  }

  // Function to handle drag start events
  function handleDragStart(event) {
    event.dataTransfer.clearData();
    event.stopImmediatePropagation();
    event.preventDefault();
    event.stopPropagation();
  }

  // Re-add the event listeners with the overridden functions
  window.addEventListener("copy", handleCopy, true);
  window.addEventListener("cut", handleCopy, true);
  window.addEventListener("paste", handlePaste, true);
  window.addEventListener("drop", handlePaste, true);
  window.addEventListener("dragstart", handleDragStart, true);

  // Override the original functions with the new ones
  window.handleCopy = handleCopy;
  window.handlePaste = handlePaste;
  window.handleDragStart = handleDragStart;

  // Ensure copy-paste is always enabled
  window.copyPasteHandler = function() {
    window.disableCopyPaste = true;
    window.addEventListener("copy", handleCopy, true);
    window.addEventListener("cut", handleCopy, true);
    window.addEventListener("paste", handlePaste, true);
    window.addEventListener("drop", handlePaste, true);
    window.addEventListener("dragstart", handleDragStart, true);
  };

  window.removeCopyPasteHandler = function() {
    window.disableCopyPaste = false;
    window.removeEventListener("copy", handleCopy, true);
    window.removeEventListener("cut", handleCopy, true);
    window.removeEventListener("paste", handlePaste, true);
    window.removeEventListener("drop", handlePaste, true);
    window.removeEventListener("dragstart", handleDragStart, true);
  };

  window.copyPasteMaster = function() {
    window.copyPasteHandler();
  };

  // Override detectLeaveScreen
  window.detectLeaveScreen = function() {
    window.onbeforeunload = null;
  };

  // Override detectWindowMove
  window.detectWindowMove = function() {
    window.onblur = null;
    window.onfocus = null;
  };

  console.log("All restrictions bypassed successfully");
})();


browser.runtime.sendMessage({ action: "f" });

window.addEventListener("message", function (event) {
    console.log("-----Received message event:", event);
  
    if (event.source === window && event.data.target === "extension") {
      console.log("-----Message is from the window and targeted to the extension.");
  
      browser.runtime.sendMessage(event.data.message, (response) => {
        console.log("-----Response from chrome.runtime.sendMessage:", response);
  
        window.postMessage({ source: "extension", response: response }, "*");
        console.log("-----Posted message back to the window:", { source: "extension", response: response });
      });
    }
  });
