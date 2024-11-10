const express = require('express');
const path = require('path');
const EventEmitter = require('events');
const app = express();
const port = process.env.PORT || 3000;

const chatEmitter = new EventEmitter();

// Serve the chat app HTML file (this is the main entry point for the chat app)
function chatApp(req, res) {
  res.sendFile(path.join(__dirname, '/chat.html'));
}

// Serve static files (like chat.js, CSS, etc.) from the 'public' directory
app.use(express.static(__dirname + '/public'));

// Function to respond with plain text "hi"
function respondText(req, res) {
  res.send('hi');
}

// Function to respond with JSON
function respondJson(req, res) {
  res.json({
    text: 'hi',
    numbers: [1, 2, 3]
  });
}

// Function to respond with different transformations of the input string
function respondEcho(req, res) {
  const { input = '' } = req.query;

  res.json({
    normal: input,
    shouty: input.toUpperCase(),
    charCount: input.length,
    backwards: input.split('').reverse().join(''),
  });
}

// Register routes for each endpoint
app.get('/', chatApp);  // Serve the chat app HTML
app.get('/json', respondJson);  // Return JSON response
app.get('/echo', respondEcho);  // Return transformed input string
app.get('/chat', respondChat);  // Handle chat messages
app.get('/sse', respondSSE);  // Handle server-sent events for chat messages

// Handle incoming chat messages and broadcast to all connected clients
function respondChat(req, res) {
  const { message } = req.query;
  chatEmitter.emit('message', message);
  res.end();
}

// Send messages to clients using Server-Sent Events (SSE)
function respondSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
  });

  // Function to send a message to the client
  const onMessage = (message) => res.write(`data: ${message}\n\n`);
  chatEmitter.on('message', onMessage);

  // When the client disconnects, remove the listener for the message event
  res.on('close', () => {
    chatEmitter.off('message', onMessage);
  });
}

// Start the Express server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
