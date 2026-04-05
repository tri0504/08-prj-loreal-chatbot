/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

const storageKey = "loreal-chat-state";
const maxStoredMessages = 24;
let latestQuestionElement = null;

// System prompt that keeps the assistant focused on L'Oréal beauty topics.
const systemPrompt =
  "You are a L'Oréal beauty assistant. Only answer questions about L'Oréal products, routines, ingredients, shades, categories, skincare, haircare, makeup, fragrance, and recommendations. Politely refuse any request that is unrelated to L'Oréal beauty topics. When refusing, keep the reply short, courteous, and brand-appropriate, and redirect the user back to a relevant beauty question or product recommendation. Do not provide general advice on unrelated subjects. Keep answers concise and helpful.";

// Replace this with your deployed Cloudflare Worker URL.
const apiUrl = "https://loreal-chatbot.thn210005.workers.dev/";

function createInitialState() {
  return {
    userName: "",
    conversation: [],
  };
}

function loadState() {
  try {
    const storedState = localStorage.getItem(storageKey);

    if (!storedState) {
      return createInitialState();
    }

    const parsedState = JSON.parse(storedState);

    return {
      userName:
        typeof parsedState.userName === "string" ? parsedState.userName : "",
      conversation: Array.isArray(parsedState.conversation)
        ? parsedState.conversation
        : [],
    };
  } catch {
    return createInitialState();
  }
}

function saveState(state) {
  const trimmedConversation = state.conversation.slice(-maxStoredMessages);

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      userName: state.userName,
      conversation: trimmedConversation,
    }),
  );
}

const chatState = loadState();

function renderStoredConversation() {
  if (chatState.conversation.length === 0) {
    appendMessage("👋 Hello! How can I help you today?", "ai");
    return;
  }

  chatState.conversation.forEach((message) => {
    if (message.role === "user") {
      appendMessage(message.content, "user");
    }

    if (message.role === "assistant") {
      appendMessage(message.content, "ai");
    }
  });
}

function extractUserName(messageText) {
  const matchedName = messageText.match(
    /\b(?:my name is|i am|i'm|call me)\s+([A-Za-z][A-Za-z' -]{1,39})/i,
  );

  if (!matchedName) {
    return "";
  }

  return matchedName[1].trim().replace(/\s+/g, " ");
}

function buildMemoryPrompt() {
  const recentQuestions = chatState.conversation
    .filter((message) => message.role === "user")
    .slice(-5)
    .map((message) => `- ${message.content}`)
    .join("\n");

  const rememberedName = chatState.userName
    ? chatState.userName
    : "not yet known";
  const questionSummary = recentQuestions || "- No prior questions yet.";

  return [
    "Conversation memory for this session:",
    `- User name: ${rememberedName}`,
    "- Recent user questions:",
    questionSummary,
    "Use this memory to keep the conversation natural and consistent.",
  ].join("\n");
}

function buildApiMessages() {
  return [
    { role: "system", content: systemPrompt },
    { role: "system", content: buildMemoryPrompt() },
    ...chatState.conversation,
  ];
}

function appendMessage(text, className) {
  const message = document.createElement("div");
  message.className = `msg ${className}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
}

function setLatestQuestion(text) {
  if (latestQuestionElement) {
    latestQuestionElement.remove();
  }

  latestQuestionElement = document.createElement("div");
  latestQuestionElement.className = "latest-question";
  latestQuestionElement.textContent = text;
  chatWindow.appendChild(latestQuestionElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Set initial message
renderStoredConversation();

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const messageText = userInput.value.trim();

  if (!messageText) {
    return;
  }

  appendMessage(messageText, "user");
  chatState.conversation.push({ role: "user", content: messageText });
  setLatestQuestion(messageText);

  const extractedName = extractUserName(messageText);

  if (extractedName) {
    chatState.userName = extractedName;
  }

  saveState(chatState);
  userInput.value = "";
  userInput.focus();

  const loadingMessage = appendMessage("Thinking…", "ai");
  chatForm.querySelector("button").disabled = true;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: buildApiMessages(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
          "Unable to get a response from the Cloudflare Worker.",
      );
    }

    const assistantReply = data.choices?.[0]?.message?.content?.trim();

    if (!assistantReply) {
      throw new Error("The API returned an empty response.");
    }

    loadingMessage.textContent = assistantReply;
    chatState.conversation.push({ role: "assistant", content: assistantReply });
    saveState(chatState);
  } catch (error) {
    loadingMessage.textContent =
      error instanceof Error
        ? error.message
        : "Something went wrong while getting a response.";
  } finally {
    chatForm.querySelector("button").disabled = false;
  }
});
