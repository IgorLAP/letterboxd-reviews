const puppeteer = require('puppeteer');
require('dotenv/config');
const fs = require('fs');
const convert = require('json-to-plain-text');
const readline = require('readline-sync');

// Refatorar
// Adicionar último método
// Tratar erro

console.log('📽 ✍️ 🤖 Your Letterboxd Reviews easy for you');
(async () => {
    const options = await readline.keyInSelect(
        ['Todas Reviews', 'Ate uma pagina especifica', 'Entre paginas', 'Apenas uma pagina'],'Selecione uma opcao: '
        );

    if(options == -1){
        return;
    }

    let initialPage = null;
    let pages = null;
    let finalPage = null;
    switch(options){
        case 0:
            pages = null;
            break;
        case 1:
            pages = await readline.question('Ate qual pagina deseja? ');
            if(isNaN((Number(pages))) || pages == 0){
                throw new Error('Quantidade de páginas inválida')
            }
            break;
        case 2 :
            initialPage = await readline.question('Pagina inicial: ');
            finalPage = await readline.question('Pagina final: ');
            if((isNaN(initialPage) || isNaN(finalPage)) || (initialPage == '' || finalPage == '')){
                throw new Error('Erro nas páginas informadas');
            }
            break;
        case 3:
            break;
    }

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
    } else {
        console.log('Login realizado');
    }

    await page.waitForSelector('.nav-account');
    const userName = await page.evaluate(() => document.querySelector('.nav-account a').innerHTML.split('>').pop());
    if(options == 2){
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
    await page.waitForSelector('section.col-main');
    
    //Tratar erro possível de passar um número a mais das páginas de reviews existentes
    const totalReviewPages = (pages || finalPage) || await page.evaluate(()=>
    document.querySelector('.paginate-pages ul').lastElementChild.innerText);
    
    let allReviews;

    for(let i = Number(initialPage) || 1; i<=totalReviewPages; i++){
        const clicks = await page.evaluate(()=> document.querySelectorAll('a.reveal.js-reveal'));

        console.log('Processando...');
        console.log(`Na página ${i} de ${totalReviewPages}. Aguarde`);

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