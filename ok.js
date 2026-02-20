const express = require('express')
const puppeteer = require('puppeteer-extra').default
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const app = express()
const PORT = process.env.PORT || 3000

let browser

async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        })

        console.log('✅ Browser Launched')
    }

    return browser
}

async function openPage(url) {
    const br = await getBrowser()
    const page = await br.newPage()

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        const html = await page.content()
        await page.close()
        return html
    } catch (err) {
        await page.close()
        throw err
    }
}

app.get('/', (req, res) => res.send('Server running'))

app.get('/random', async (req, res) => {
    try {
        const br = await getBrowser()
        const page = await br.newPage()

        await page.goto('https://mywaifulist.moe/random', { waitUntil: 'networkidle2' })

        const data = await page.evaluate(() => {
            const el = document.querySelector('#app')
            return el ? el.getAttribute('data-page') : null
        })

        await page.close()

        if (!data) return res.status(500).send('No Data')

        res.json(JSON.parse(data))

    } catch (err) {
        console.log('RANDOM ERROR →', err.message)
        res.status(500).send('Failed')
    }
})

app.get('/character/:slug', async (req, res) => {
    try {
        const { slug } = req.params
        const html = await openPage(`https://mywaifulist.moe/waifu/${slug}`)
        res.setHeader('Content-Type', 'text/html')
        res.send(html)
    } catch (err) {
        console.log('CHARACTER ERROR →', err.message)
        res.status(500).send('Failed')
    }
})

app.listen(PORT, async () => {
    console.log(`🚀 Server running on ${PORT}`)
    await getBrowser()
})
