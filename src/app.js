const fs = require('fs');
const path = require('path');

const puppeteer = require('puppeteer');
const convert = require('json-to-plain-text');
const readline = require('readline-sync');

async function run(initialPage, pages, finalPage){
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto('https://letterboxd.com', {
        waitUntil: 'load',
        timeout: 0
    });

    await page.click('[href="/sign-in/"]');
    await page.type('input[type="email"]', process.env.EMAIL);
    await page.type('input[type="password"]', process.env.PASS);
    await page.click('input[type="submit"]');
    await delay(3000);
    const error = await page.evaluate(()=>{
        return document.querySelector('div.errormessage').innerText;
    })
    
    if(error !== ''){
        throw new Error('Login falhou. Confira o seu arquivo .env');
    } else {
        console.log('Login realizado');
    }

    await page.waitForSelector('.nav-account');
    const userName = await page.evaluate(() => document.querySelector('.nav-account a').innerHTML.split('>').pop());
    if(initialPage){
        await page.goto(`https://letterboxd.com/${userName}/films/reviews/page/${initialPage}`, {
            waitUntil: 'load',
            timeout: 0
        });
    } else {
        await page.goto(`https://letterboxd.com/${userName}/films/reviews/`, {
            waitUntil: 'load',
            timeout: 0
        });
    }
    // Lidando com possíveis textos protegidos por spoilers não carregados pela página
    await page.evaluate(()=>{
        const hidden = document.querySelectorAll('.hidden-spoilers.expanded-text');
        if(hidden){
            [...hidden].forEach(i=>i.style.display = 'block');
        }
    })
    let totalReviewPages = await page.evaluate(()=>
    document.querySelector('.paginate-pages ul').lastElementChild.innerText);

    if(
        (finalPage || pages) && 
        (Number(finalPage) > Number(totalReviewPages) || Number(pages) > Number(totalReviewPages))
    ){
        const ans = readline.keyInYN(`Pagina ${finalPage || pages} inexistente! Deseja selecionar ate a ultima, ${totalReviewPages}, no perfil de ${userName}? `);
        if(!ans){
            throw new Error('Páginal final inexistente');
        }
    }
    
    if(finalPage && !pages){
        totalReviewPages = finalPage;
    } else if(!finalPage && pages){
        totalReviewPages = pages;
    }

    let allReviews;

    for(let i = Number(initialPage) || 1; i <= totalReviewPages; i++){
        const clicks = await page.evaluate(()=> document.querySelectorAll('a[href="#"].reveal.js-reveal'));

        console.log('Processando...');
        if(i == totalReviewPages){
            console.log(`Pegando reviews da pagina ${i}`)
        } else {
            console.log(`Na página ${i} de ${totalReviewPages}. Aguarde`);
        }

        for(let i = 0; i<Object.keys(clicks).length; i++ ){
            await page.click('a[href="#"].reveal.js-reveal')
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
                    text: separator.map(i=>i.replace('\n', ' '))
                }
            })
            return reviewsJsonLike;
        })
        
        if(initialPage){
            if(i == Number(initialPage)){
                allReviews = currentReviews;
            } else {
                allReviews.push(...currentReviews);
            }
        } else {
            if(i == 1){
                allReviews = currentReviews;
            } else {
                allReviews.push(...currentReviews);
            }
        }
        
        if((i+1) <= totalReviewPages){
            await page.goto(`https://letterboxd.com/${userName}/films/reviews/page/${i+1}/`, {
                waitUntil: 'load',
                timeout: 0
            })
        }
    }
    
    fs.writeFile(path.join(__dirname, `./../your-reviews/${userName}-reviews.txt`), convert.toPlainText(allReviews), err=>{
        if(err) console.log(err)
    })
    fs.writeFile(path.join(__dirname, `./../your-reviews/${userName}-reviews.json`), JSON.stringify(allReviews, null, 2), err=>{
        if(err) console.log(err)
    })

    await browser.close();
    console.log('Finalizado!');
}

function delay(time){
    return new Promise(resolve=>{
        setTimeout(resolve, time);
    })
}

module.exports = run;