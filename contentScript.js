if (browser === undefined) {
  var browser = chrome;
}

function extractCodingQuestion() {
  const languageElement = document.querySelector("span.inner-text");
  const programmingLanguage = languageElement ? languageElement.innerText.trim() : "";

  const questionElement = document.querySelector('div[aria-labelledby="question-data"]');
  const questionText = questionElement ? questionElement.innerText.trim() : "";

  const inputFormatElement = document.querySelector('div[aria-labelledby="input-format"]');
  const inputFormat = inputFormatElement ? inputFormatElement.innerText.trim() : "";

  const outputFormatElement = document.querySelector('div[aria-labelledby="output-format"]');
  const outputFormat = outputFormatElement ? outputFormatElement.innerText.trim() : "";

  const testCaseElements = document.querySelectorAll('div[aria-labelledby="each-tc-card"]');
  let testCases = Array.from(testCaseElements)
    .map((testCase, index) => {
      const testCaseText = testCase.innerText.trim();
      console.log(`Test Case ${index + 1} Text:`, testCaseText);
      return `Sample Test Case ${index + 1}:\n${testCaseText}\n`;
    })
    .join("\n");

  const headerElement = document.querySelector('div[aria-labelledby="editor-question"]');
  const headerCode = headerElement ? headerElement.innerText.trim() : "";

  const footerElement = document.querySelector('div[aria-labelledby="editor-footer"]');
  const footerCode = footerElement ? footerElement.innerText.trim() : "";

  const answerElement = document.querySelector('div[aria-labelledby="editor-answer"]');
  const answerCode = answerElement ? answerElement.innerText.trim() : "";

  return {
    action: "extractData",
    programmingLanguage,
    question: questionText,
    inputFormat,
    outputFormat,
    testCases,
    isCoding: true,
  };
}

// Function to extract MCQ details
function extractMCQ() {
  const questionElement = document.querySelector('div[aria-labelledby="question-data"]');
  const questionText = questionElement ? questionElement.innerText.trim() : "";

  const optionElements = document.querySelectorAll('div[aria-labelledby="each-option"]');
  const options = Array.from(optionElements).map((option, index) => {
    const optionText = option.querySelector(".options-color")?.innerText.trim();
    return optionText;
  });

  return {
    action: "extractData",
    question: questionText,
    options: options.join("\n"),
    isMCQ: true,
  };
}

// Update the keydown event listener to handle both Alt+Z and Alt+X
document.addEventListener("keydown", async (event) => {
  if (event.altKey && event.key.toLowerCase() === "z") {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText) {
      console.log("selectedText", selectedText);
    } else {
      // If no text is selected, extract and process coding question
      const questionData = extractCodingQuestion();
      browser.runtime.sendMessage(questionData);
      console.log("questionData", questionData);
    }
  } else if (event.altKey && event.key.toLowerCase() === "x") {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText) {
      console.log("selectedText", selectedText);
    } else {
      const mcqData = extractMCQ();
      browser.runtime.sendMessage(mcqData);
    }
  }
});

// Listen for response from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "pasteResponse" && message.code) {
    // Find active element or code editor
    const activeElement = document.activeElement;
    const editorElement = activeElement; //document.querySelector(".ace_text-input") || activeElement;

    if (editorElement) {
      editorElement.focus();
      editorElement.value = message.code;
      editorElement.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
});

function removeElements() {
  // Clear contents inside <app-dialog-sidebar> element
  const sidebarElement = document.querySelector("app-dialog-sidebar");
  if (sidebarElement) {
    while (sidebarElement.firstChild) {
      sidebarElement.removeChild(sidebarElement.firstChild);
    }
    console.log("Cleared contents inside <app-dialog-sidebar> element.");
  } else {
    console.log("<app-dialog-sidebar> element not found.");
  }

  // Remove <div> element with aria-labelledby="no-network-container"
  const noNetworkElement = document.querySelector('[aria-labelledby="no-network-container"]');
  if (noNetworkElement) {
    noNetworkElement.remove();
    console.log('Removed element with aria-labelledby="no-network-container" from the DOM.');
  } else {
    console.log('Element with aria-labelledby="no-network-container" not found.');
  }
}

function handleKeydown(event) {
  if (event.altKey && event.shiftKey && event.key === "Q") {
    removeElements();
  }
  if (event.altKey && event.shiftKey && event.key === "L") {
    chrome.runtime.sendMessage({ action: "potus-panic-101" });
  }
}

// Add event listener for keydown events
document.addEventListener("keydown", handleKeydown);

// Initial log to confirm script injection
console.log("Content script with keydown listener injected.");

// Add listener for clicking MCQ options
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clickMCQOption" && message.optionIndex !== undefined) {
    const optionElement = document.querySelector(`#tt-option-${message.optionIndex}`);
    if (optionElement) {
      optionElement.click();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "Option element not found" });
    }
  }
});
