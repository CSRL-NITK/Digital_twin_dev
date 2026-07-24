// --- Aquatwin Local Simulation Sandbox Interceptor ---
// Overrides WebSocket, fetch, and XMLHttpRequest dynamically on /analytics pages
// to ensure the sandbox runs 100% locally and isolated.

(function installSandboxMocks() {
  const originalWebSocket = window.WebSocket;
  const originalFetch = window.fetch;
  const originalXHR = window.XMLHttpRequest;

  // 1. Plain JavaScript MockWebSocket Class (Manual EventTarget implementation)
  class MockWebSocket {
    url: string;
    readyState: number = 0; // CONNECTING
    binaryType: string = 'blob';
    bufferedAmount: number = 0;
    extensions: string = '';
    protocol: string = '';
    onopen: any = null;
    onclose: any = null;
    onerror: any = null;
    onmessage: any = null;
    listeners: Record<string, any[]> = {};

    constructor(url: string, _protocols?: string | string[]) {
      this.url = url;
      console.log("[MockWS] WebSocket constructor called. URL:", url);

      if (!(window as any).__activeSockets) {
        (window as any).__activeSockets = new Set();
      }
      (window as any).__activeSockets.add(this);

      setTimeout(() => {
        console.log("[MockWS] Transitioning readyState to 1 (OPEN) for:", this.url);
        this.readyState = 1; // OPEN
        const openEvent = { type: 'open' } as any;
        if (this.onopen) {
          console.log("[MockWS] Calling onopen callback");
          this.onopen(openEvent);
        }
        this.dispatchEvent(openEvent);

        // For direct WebSocket connections (where transport starts on WebSocket directly and sid is not pre-established)
        if (!this.url.includes('sid=')) {
          console.log("[MockWS] Direct WS connection detected. Sending Engine.IO open (0) and Socket.IO connect (40)");
          setTimeout(() => {
            const openPacket = {
              type: 'message',
              data: '0' + JSON.stringify({
                sid: "mockSessionId",
                upgrades: [],
                pingInterval: 25000,
                pingTimeout: 20000
              })
            } as any;
            if (this.onmessage) this.onmessage(openPacket);
            this.dispatchEvent(openPacket);

            setTimeout(() => {
              const connectPacket = {
                type: 'message',
                data: '40' + JSON.stringify({ sid: "mockSessionId" })
              } as any;
              if (this.onmessage) this.onmessage(connectPacket);
              this.dispatchEvent(connectPacket);
            }, 10);
          }, 10);
        }
      }, 20);
    }

    addEventListener(type: string, listener: any) {
      if (!this.listeners[type]) this.listeners[type] = [];
      this.listeners[type].push(listener);
    }

    removeEventListener(type: string, listener: any) {
      if (!this.listeners[type]) return;
      this.listeners[type] = this.listeners[type].filter((l: any) => l !== listener);
    }

    dispatchEvent(event: any) {
      const type = event.type;
      if (this.listeners[type]) {
        this.listeners[type].forEach((l: any) => {
          try {
            l(event);
          } catch (e) {
            console.error("[MockWS] Error in event listener:", e);
          }
        });
      }
      return true;
    }

    send(msg: string) {
      console.log("[MockWS] Client sent message through WebSocket:", msg);
      if (msg === '2probe') {
        setTimeout(() => {
          const probeEvent = { type: 'message', data: '3probe' } as any;
          console.log("[MockWS] Responding with 3probe");
          if (this.onmessage) this.onmessage(probeEvent);
          this.dispatchEvent(probeEvent);
        }, 10);
      } else if (msg === '5') {
        // Transport upgrade complete! Send namespace connect packet with sid
        setTimeout(() => {
          const connectEvent = { type: 'message', data: '40' + JSON.stringify({ sid: "mockSessionId" }) } as any;
          console.log("[MockWS] WebSocket transport upgraded. Sending namespace connect (40)");
          if (this.onmessage) this.onmessage(connectEvent);
          this.dispatchEvent(connectEvent);
        }, 10);
      }
    }

    close(code?: number, reason?: string) {
      console.log("[MockWS] Closing WebSocket, code:", code, "reason:", reason, "URL:", this.url);
      this.readyState = 3; // CLOSED
      const activeSockets = (window as any).__activeSockets;
      if (activeSockets) activeSockets.delete(this);
      const closeEvent = { type: 'close', code: code || 1000, reason: reason || '', wasClean: true } as any;
      if (this.onclose) this.onclose(closeEvent);
      this.dispatchEvent(closeEvent);
    }
  }

  // Define a dynamic proxy WebSocket constructor
  const NewWebSocket = function (this: any, url: string, protocols?: string | string[]) {
    const useMock = window.location.pathname.includes('/analytics');
    console.log("[MockWS] NewWebSocket constructor factory invoked. useMock:", useMock, "URL:", url);
    if (useMock) {
      return new MockWebSocket(url, protocols) as any;
    } else {
      return new originalWebSocket(url, protocols);
    }
  };
  NewWebSocket.prototype = originalWebSocket.prototype;
  (NewWebSocket as any).CONNECTING = originalWebSocket.CONNECTING;
  (NewWebSocket as any).OPEN = originalWebSocket.OPEN;
  (NewWebSocket as any).CLOSING = originalWebSocket.CLOSING;
  (NewWebSocket as any).CLOSED = originalWebSocket.CLOSED;
  (window as any).WebSocket = NewWebSocket;
  (globalThis as any).WebSocket = NewWebSocket;

  let sentConnectPacket = false;

  // 2. Dynamic Fetch Mock
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const useMock = window.location.pathname.includes('/analytics');
    const url = String(input);
    if (useMock && url.includes('/socket.io/')) {
      const isHandshake = !url.includes('sid=');
      console.log("[MockWS] Fetch request intercepted. isHandshake:", isHandshake, "URL:", url);
      if (isHandshake) {
        sentConnectPacket = false; // Reset for new handshake
        return Promise.resolve(new Response('0' + JSON.stringify({
          sid: "mockSessionId",
          upgrades: ["websocket"],
          pingInterval: 25000,
          pingTimeout: 20000
        }), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'text/plain' }
        }));
      } else {
        const method = init?.method?.toUpperCase() || 'GET';
        if (method === 'POST') {
          // Acknowledge polling payload writes
          return Promise.resolve(new Response('ok', {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/plain' }
          }));
        }
        // If it's a GET long-poll request, send '40{"sid":"..."}' on first call
        if (!sentConnectPacket) {
          sentConnectPacket = true;
          console.log("[MockWS] Fetch long-poll GET: sending namespace connect (40)");
          return Promise.resolve(new Response('40' + JSON.stringify({ sid: "mockSessionId" }), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/plain' }
          }));
        }
        // Return Engine.IO NOOP (6) for subsequent long-polling requests
        return Promise.resolve(new Response('6', {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'text/plain' }
        }));
      }
    }
    return originalFetch(input, init);
  };

  // 3. Dynamic XMLHttpRequest Mock
  const NewXHR = function (this: any) {
    const xhr = new originalXHR();
    let intercepted = false;
    let targetUrl = '';
    let requestMethod = 'GET';

    const mockOpen = xhr.open;
    xhr.open = function (method: string, url: string | URL, ...args: any[]) {
      const useMock = window.location.pathname.includes('/analytics');
      targetUrl = String(url);
      requestMethod = (method || 'GET').toUpperCase();
      if (useMock && targetUrl.includes('/socket.io/')) {
        intercepted = true;
      } else {
        (mockOpen as any).apply(xhr, [method, url, ...args]);
      }
    } as any;

    const mockSend = xhr.send;
    xhr.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      if (intercepted) {
        const isHandshake = !targetUrl.includes('sid=');
        console.log("[MockWS] XMLHttpRequest intercepted. Method:", requestMethod, "isHandshake:", isHandshake, "URL:", targetUrl);
        setTimeout(() => {
          Object.defineProperty(xhr, 'readyState', { value: 4, writable: true });
          Object.defineProperty(xhr, 'status', { value: 200, writable: true });
          let responseText = '';
          if (targetUrl.includes('transport=polling')) {
            if (isHandshake) {
              sentConnectPacket = false; // Reset for new handshake
              responseText = '0' + JSON.stringify({
                sid: "mockSessionId",
                upgrades: ["websocket"],
                pingInterval: 25000,
                pingTimeout: 20000
              });
            } else {
              if (requestMethod === 'POST') {
                responseText = 'ok';
              } else if (!sentConnectPacket) {
                sentConnectPacket = true;
                console.log("[MockWS] XHR long-poll GET: sending namespace connect (40)");
                responseText = '40' + JSON.stringify({ sid: "mockSessionId" });
              } else {
                responseText = '6'; // NOOP
              }
            }
          }
          Object.defineProperty(xhr, 'responseText', { value: responseText, writable: true });
          if (xhr.onreadystatechange) (xhr as any).onreadystatechange();
          if (xhr.onload) (xhr as any).onload();
        }, 10);
      } else {
        mockSend.call(xhr, body);
      }
    };

    return xhr;
  };
  window.XMLHttpRequest = NewXHR as any;

  // 4. Global Emitter Hook
  (window as any).__emitMockSocketEvent = (event: string, data: any) => {
    const payload = '42' + JSON.stringify([event, data]);
    const activeSockets = (window as any).__activeSockets;
    console.log("[MockWS] __emitMockSocketEvent invoked. Event:", event, "ActiveSocketsCount:", activeSockets ? activeSockets.size : 0);
    if (activeSockets) {
      activeSockets.forEach((ws: any) => {
        const msgEvent = { type: 'message', data: payload } as any;
        const listenersCount = ws.listeners['message'] ? ws.listeners['message'].length : 0;
        console.log("[MockWS] Socket URL:", ws.url, "Listeners count for 'message':", listenersCount, "onmessage exists:", !!ws.onmessage);
        console.log("[MockWS] Emitting payload to mock WS:", payload);
        if (ws.onmessage) {
          ws.onmessage(msgEvent);
        }
        ws.dispatchEvent(msgEvent);
      });
    }
  };
})();
