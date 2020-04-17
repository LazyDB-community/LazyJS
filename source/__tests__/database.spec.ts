import { LazyDB } from '..'

const DB = new LazyDB('beta.lazydb.com', 42600, false)

describe('Connect to LazyDB [TEST] Server', () => {	
	it('Connects as Admin', async () => {
		console.log(DB.auth('admin', '123456'))
	})
})
