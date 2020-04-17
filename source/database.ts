import WebSocket from 'ws'

export class Database {
	protected protocol = this.secure ? 'wss://' : 'ws://'
	protected socket: WebSocket
	protected id: number = 0
	protected callbacks: any = {}
	
	public test = 'test'

	constructor(
		protected host: string,
		protected port: number,
		protected secure: boolean = false,
		protected onConnect?: () => void
	) { 
		this.socket = new WebSocket(this.protocol.concat(this.host, ':', this.port.toString()))
		this.init()
	}

	private async init() {
		this.socket.on('message', (e) => {
			// @ts-ignore
			const result  = JSON.parse(e)
			
			if (result.s) this.callbacks[result.id].resolve(result.r)
			else this.callbacks[result.id].reject(result.r)

			if (!this.callbacks[result.id].sync) delete this.callbacks[result.id]
			else this.callbacks[result.id].sync(result.r)
		})
	}

	public async send(name: string, args: any) {
		const id = ++this.id
		const self = this

		const callback = new Promise((resolve, reject) => {
			if (!self.callbacks[id]) self.callbacks[id] = {}
			self.callbacks[id].resolve = resolve
			self.callbacks[id].reject = reject
		})

		const data = JSON.stringify({
			'c': name,
			'id': id,
			'a': args
		})
		
		try {
			this.socket.onopen = () => {
				this.socket.send(data)
			}
		} catch (e) {
			console.log(e)
		}

		return callback
	}

	public register(username: string, password: string) {
		return this.send('register', { username, password })
	}

	public async auth(username: string, password: string) {
		return await this.send('connect', { username, password })
	}

	public open(name: string) {
		return this.send('open', {
			name
		})
	}

	public create(name: string) {
		return this.send('create', {
			name
		})
	}

	public get(keyPath: string) {
		if (keyPath === '/') return this.send('getAllBk', {})
		else {
			const keyPaths: string[] = keyPath.split('/')
			const link = false
			return this.send('get', {
				keyPath: keyPaths,
				link
			})
		}	
	}

	public set(keyPath: string, value: any, access_level: number = 3) {
		const keyPaths: string[] = keyPath.split('/')
		return this.send('set', {
			keyPath: keyPaths,
			value,
			access_level
		})
	}

	public delete(keyPath: string) {
		const keyPaths: string[] = keyPath.split('/')
		return this.send('delete', {
			keyPath: keyPaths
		})
	}

	public exec(keyPath: string, args: any) {
		return this.send('exec', {
			keyPath,
			args
		})
	}

	public sync(path: string) {
		return {
			then: () => {
				const keyPath: string[] = path.split('/')
				const link = true
				return this.send('get', {
					keyPath,
					link
				})
			}
		}
	}

	public bind(obj: object, prop: string, path: string) {
		Object.defineProperty(obj, prop, {
			get: () => this.get(path),
			set: (value) => this.set(path, value)
		})
	}

	public unlink(links: string) {
		return this.send('unlink', {
			links
		})
	}
}