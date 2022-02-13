const puppeteer = require('puppeteer');
require('dotenv/config');
const fs = require('fs');
const convert = require('json-to-plain-text');
const readline = require('readline-sync');

console.log('📽 ✍️ 🤖 Letterboxd Reviews in JSON');
(async () => {
    let pages = await readline.question('Quantidade de páginas, em seu histórico de reviews, desejadas OU pressione "Enter" para trazer todas: ', {
        encoding: 'utf-8'
    });
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto('https://letterboxd.com', {
        waitUntil: 'load',
        timeout: 0
    });

    await page.click('[href="/sign-in/"]');
    await page.type('input[type="email"]', process.env.EMAIL );
    await page.type('input[type="password"]', process.env.PASS);
    await page.click('input[type="submit"]');
    await delay(3000);
    const error = await page.evaluate(()=>{
        return document.querySelector('div.errormessage').innerText;
    })
    
    if(error !== ''){
        throw new Error('Login falhou. Confira o seu arquivo .env');
    }
    await page.waitForSelector('.nav-account');
    const userName = await page.evaluate(() => document.querySelector('.nav-account a').innerHTML.split('>').pop());
    await page.goto(`https://letterboxd.com/${userName}/films/reviews/`, {
        waitUntil: 'load',
        timeout: 0
    });
    await page.waitForSelector('section.col-main');
    
    if(isNaN((Number(pages))) || pages == 0){
        throw new Error('Quantidade de páginas inválida')
    }
    const totalReviewPages = pages || await page.evaluate(()=>
    document.querySelector('.paginate-pages ul').lastElementChild.innerText);
    
    let allReviews = [];

    for(let i = 1; i<=totalReviewPages; i++){
        const clicks = await page.evaluate(()=> document.querySelectorAll('a.reveal.js-reveal'));

        for(let i = 0; i<Object.keys(clicks).length; i++ ){
            await page.click('a.reveal.js-reveal');
            await delay(3000);
        }

        const currentReviews = await page.evaluate(()=>{
            const nodeList = document.querySelectorAll('.film-detail-content');
            const htmlArray = [...nodeList];
            const reviewsJsonLike = htmlArray.map(({innerText}) => {
                let separator = innerText.split('\n\n')
                return {
                    title: separator.shift(),
                    rating: separator.shift(),
                    likes: separator.pop(),
                    text: separator
                }
            })
            return reviewsJsonLike;
        })
        console.log('Processando...');
        console.log(`Na página ${i} de ${totalReviewPages}. Aguarde`)
        allReviews.push(currentReviews);
        if((i+1) <= totalReviewPages){
            await page.goto(`https://letterboxd.com/${userName}/films/reviews/page/${i+1}/`, {
                waitUntil: 'load',
                timeout: 0
            })
        }
    }
    
    fs.writeFile(`./your-reviews/${userName}-reviews.txt`, convert.toPlainText(allReviews), err=>{
        if(err) console.log(err)
    })
    fs.writeFile(`./your-reviews/${userName}-reviews.json`, JSON.stringify(allReviews, null, 2), err=>{
        if(err) console.log(err)
    })

    await browser.close();
    console.log('Finalizado!')
})();

function delay(time){
    return new Promise(resolve=>{
        setTimeout(resolve, time);
    })
}