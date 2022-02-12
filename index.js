const puppeteer = require('puppeteer');
require('dotenv/config');
const fs = require('fs');

console.log('Letterboxd Reviews in JSON');
(async () => {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto('https://letterboxd.com', {
        waitUntil: 'load',
        timeout: 0
    });

    await page.click('[href="/sign-in/"]');
    await page.type('input[type="email"]', process.env.EMAIL, {delay: 100});
    await page.type('input[type="password"]', process.env.PASS, {delay: 100});
    await page.click('input[type="submit"]');
    await page.waitForSelector('.nav-account');
    const userName = await page.evaluate(() => document.querySelector('.nav-account a').innerHTML.split('>').pop());
    await page.goto(`https://letterboxd.com/${userName}/films/reviews/`, {
        waitUntil: 'load',
        timeout: 0
    });
    await page.waitForSelector('section.col-main');
    
    
    const pageInfo = await page.evaluate(()=>{
        return {
            reviewsInPage: document.querySelectorAll('section.col-main ul.film-list li .film-detail-content'),
            moreClicks: document.querySelectorAll('a.reveal.js-reveal'),
            currentPage: document.querySelector('.paginate-page.paginate-current').innerText,
            totalReviewPages: document.querySelector('.paginate-pages ul').lastElementChild.innerText
        }
    })

    for(let i = 0; i<Object.keys(pageInfo.moreClicks).length; i++ ){
        await page.click('a.reveal.js-reveal');
        await delay(3000);
    }
    const currentReviews = await page.evaluate(()=>{
        const nodeList = document.querySelectorAll('.film-detail-content');
        const htmlArray = [...nodeList];
        // const textArray = htmlArray.map(({innerText : review})=>({review}));
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
    
    fs.writeFile('./reviews.json', JSON.stringify(currentReviews, null, 2), err=>{
        if(err){
            console.log(err)
        }
    })

    await browser.close();
})();

function delay(time){
    return new Promise(resolve=>{
        setTimeout(resolve, time);
    })
}