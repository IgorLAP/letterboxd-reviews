require('dotenv/config');
const readline = require('readline-sync');
const run = require('./app');

// Refatorar

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
            const onePage = await readline.question('Qual pagina? ');
            if(!isNaN(Number(onePage))){
                initialPage = onePage;
                finalPage = onePage;
            }
            break;
    }

    await run(initialPage, pages, finalPage);
})();

