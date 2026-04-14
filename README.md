# L'Oréal Chatbot

This project is a lightweight, browser-based chatbot experience inspired by L'Oréal beauty consulting. Users can ask about products, routines, ingredients, categories, shades, skincare, haircare, makeup, and fragrance recommendations.

The interface keeps a running conversation in the browser, remembers simple session details such as the user's name, and sends each request to a Cloudflare Worker that forwards the prompt to OpenAI.

## Technologies Used

- HTML for the page structure
- CSS for the visual design and layout
- Vanilla JavaScript for chatbot behavior, message rendering, and local storage
- OpenAI GPT-4o for generating responses
- Cloudflare Workers for the API proxy layer
- Google Fonts and Material Icons for the UI styling

## How It Works

1. The user types a question into the chat form.
2. `script.js` stores the message in browser `localStorage` so the conversation can persist during the session.
3. The app sends a `messages` array to the Cloudflare Worker endpoint.
4. The worker returns the OpenAI response, and the app displays `data.choices[0].message.content` in the chat window.

## Run the App

1. Open the repository in GitHub Codespaces or another local development environment.
2. Open `index.html` in a browser or use the live preview in your editor.
3. Enter a question and start chatting.

## Notes

- The chatbot is designed to stay focused on L'Oréal-related beauty topics.
- If you are using your own Cloudflare Worker, update the API URL in `script.js`.
