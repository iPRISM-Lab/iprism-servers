# INSTALLATION (Method 1 - Pre-built Binary)
wget https://github.com/vi/websocat/releases/download/v1.14.0/websocat.x86_64-unknown-linux-musl -O websocat
chmod +x websocat
sudo mv websocat /usr/local/bin/
websocat --version

### EXAMPLE 1: Connect to a public echo server (interactive)
websocat ws://ws.vi-server.org/mirror
#### Type any message and press Enter - server will echo it back
#### Press Ctrl+D to exit

### EXAMPLE 2: Create a WebSocket server and connect to it (two terminals)
#### Terminal 1 - Start server
websocat -s 8080
#### Terminal 2 - Connect to server
websocat ws://127.0.0.1:8080
#### Type messages in either terminal - they will appear on the other side

### EXAMPLE 3: Send a file and save the response
echo '{"command":"ping"}' > request.json
websocat -n1 wss://echo.websocket.org < request.json > response.json
cat response.json