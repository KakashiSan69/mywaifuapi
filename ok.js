const express = require('express')
const puppeteer = require('puppeteer-extra').default
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const app = express()
const PORT = process.env.PORT || 3000

async function openPage(url) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    })

    try {
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

        const html = await page.content()

        await browser.close()
        return html

    } catch (err) {
        await browser.close()
        throw err
    }
}

app.get('/', (req, res) => res.send('Server running'))

app.get('/random', async (req, res) => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()
        await page.goto('https://mywaifulist.moe/random', { waitUntil: 'networkidle2' })

        const data = await page.evaluate(() => {
            const el = document.querySelector('#app')
            return el ? el.getAttribute('data-page') : null
        })

        await browser.close()

        res.json(JSON.parse(data))

    } catch (err) {
        console.log('ERROR →', err.message)
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

app.listen(PORT, () => console.log(`Server running on ${PORT}`))
