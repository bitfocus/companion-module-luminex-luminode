import WebSocket from 'ws'

interface onOpen {
	(): void
}

interface onMessage {
	(data: any): void
}

interface onError {
	(msg: string): void
}

interface onDisconnect {
	(msg: string): void
}

interface WsCallbacks {
	onopen: onOpen
	onmessage: onMessage
	onerror: onError
	ondisconnect: onDisconnect
}

export class WS {
	ws?: WebSocket
	reconnect_timer?: NodeJS.Timeout
	ping_timer?: NodeJS.Timeout
	pong_timeout?: NodeJS.Timeout

	callbacks: WsCallbacks

	host: string
	constructor(host: string, callbacks: WsCallbacks) {
		this.host = host
		this.callbacks = callbacks
	}

	private safeStringify(value: unknown): string {
		try {
			if (typeof value === 'string') return value
			if (value === null) return 'null'
			if (value === undefined) return 'undefined'
			return JSON.stringify(value)
		} catch (_) {
			return String(value)
		}
	}

	public init(): void {
		if (this.reconnect_timer) {
			clearTimeout(this.reconnect_timer)
			delete this.reconnect_timer
		}

		const url = `ws://${this.host}/api/ws`

		if (this.ws) {
			this.ws.close(1000)
			delete this.ws
		}
		this.ws = new WebSocket(url, ['luminex-luminode-v1-json'])

		// Use event listeners which are the standard for the Node 'ws' package.
		// Keep the onXXX fallback for environments that expect it.
		if ('on' in this.ws && typeof (this.ws as any).on === 'function') {
			// ws (node) event signatures differ from browser WebSocket.
			;(this.ws as any).on('open', () => this.websocketOpen())
			;(this.ws as any).on('close', (code: number, _reason: Buffer) => this.websocketClose({ code } as any))
			;(this.ws as any).on('message', (data: WebSocket.Data) =>
				// wrap into an object with `.data` to match messageReceivedFromWebSocket
				this.messageReceivedFromWebSocket({ data } as any),
			)
			;(this.ws as any).on('error', (err: Error) => this.websocketError(err as any))
		} else {
			// browser-like WebSocket
			this.ws.onopen = this.websocketOpen.bind(this)
			this.ws.onclose = this.websocketClose.bind(this)
			this.ws.onmessage = this.messageReceivedFromWebSocket.bind(this)
			this.ws.onerror = this.websocketError.bind(this)
		}
	}

	public close(): void {
		this.ws?.close(1000)
		delete this.ws
		if (this.reconnect_timer) {
			clearTimeout(this.reconnect_timer)
			delete this.reconnect_timer
		}
		if (this.ping_timer) {
			clearInterval(this.ping_timer)
			delete this.ping_timer
		}
		if (this.pong_timeout) {
			clearTimeout(this.pong_timeout)
			delete this.pong_timeout
		}
		console.log(`WS closed for ${this.host}`)
	}

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	public send(data: any): void {
		if (this.ws) {
			//console.log(`send: ${JSON.stringify(data)}`)
			this.ws.send(data)
		} else {
			console.log(`Msg ${JSON.stringify(data)} lost because websocket not initialized yet`)
		}
	}

	websocketOpen(): void {
		this.initPingPong()
		this.callbacks.onopen()
	}

	websocketClose(event: WebSocket.CloseEvent): void {
		this.disconnect(`Connection to ${this.host} closed with code ${event.code}`)
	}

	websocketError(event: WebSocket.Event): void {
		const msgValue = this.safeStringify(event)
		this.callbacks.onerror(msgValue)
	}

	public disconnect(msg: string): void {
		this.callbacks.ondisconnect(msg)
		this.maybeReconnect()
	}

	maybeReconnect(): void {
		if (!this.ws) {
			return
		}
		if (this.reconnect_timer) {
			clearTimeout(this.reconnect_timer)
		}
		if (this.ping_timer) {
			clearInterval(this.ping_timer)
			delete this.ping_timer
		}
		if (this.pong_timeout) {
			clearTimeout(this.pong_timeout)
			delete this.pong_timeout
		}

		// If a socket object is still present try to close it gracefully.
		try {
			this.ws?.close(1000)
		} catch (_) {
			/* ignore */
		}

		this.reconnect_timer = setTimeout(() => {
			delete this.reconnect_timer
			this.init()
		}, 5000)
	}

	initPingPong(): void {
		if (this.ping_timer) {
			clearInterval(this.ping_timer)
		}
		if (this.pong_timeout) {
			clearTimeout(this.pong_timeout)
			delete this.pong_timeout
		}
		this.ping_timer = setInterval(() => {
			if (this.pong_timeout) {
				clearTimeout(this.pong_timeout)
			}
			this.pong_timeout = setTimeout(() => {
				this.disconnect('Websocket Pong timeout')
			}, 3500)
			this.send('ping')
		}, 5000)
	}

	messageReceivedFromWebSocket(event: WebSocket.MessageEvent): void {
		let msgValue = null
		try {
			msgValue = JSON.parse(this.safeStringify(event.data))
		} catch (_) {
			msgValue = event.data
		}

		if (msgValue === 'pong') {
			if (this.pong_timeout) {
				clearTimeout(this.pong_timeout)
				delete this.pong_timeout
			}
			return
		}

		this.callbacks.onmessage(msgValue)
	}
}
