#!/usr/bin/env python3
import http.server
import socketserver
import threading
import time

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        html_content = '''
<!DOCTYPE html>
<html>
<head>
    <title>VoidMuse Dev Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #2b2b2b; color: #fff; }
        .header { background: #3c3f41; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .content { background: #3c3f41; padding: 20px; border-radius: 5px; }
        .status { color: #4CAF50; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 VoidMuse Development Mode</h1>
        <p class="status">✅ JCEF Browser Loaded Successfully!</p>
    </div>
    <div class="content">
        <h2>Development Mode Active</h2>
        <p>This page is served from the development server on port 3002.</p>
        <p>If you can see this content, it means:</p>
        <ul>
            <li>✅ JCEF browser is working correctly</li>
            <li>✅ Development server is accessible</li>
            <li>✅ Plugin is loading content properly</li>
        </ul>
        <p><strong>Time:</strong> <span id="time"></span></p>
    </div>
    <script>
        function updateTime() {
            document.getElementById('time').textContent = new Date().toLocaleString();
        }
        updateTime();
        setInterval(updateTime, 1000);
    </script>
</body>
</html>
        '''
        self.wfile.write(html_content.encode())

def start_server():
    PORT = 3002
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server running at http://localhost:{PORT}/")
        httpd.serve_forever()

if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    print("Test server started on port 3002")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nServer stopped.")