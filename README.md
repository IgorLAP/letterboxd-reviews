# letterboxd-reviews
# 📽✍️🤖 Letterboxd Reviews Web Scrapping with Puppeteer


### Continuando os estudos com o Puppeteer, decidi colocar em verdadeiro uso real, sendo assim, automatizar tarefas as quais já pretendia há algum tempo. Neste, realizo a busca e salvamento de algumas reviews que faço no Letterboxd, rede social focada em filmes. Ideia é funcionar para qualquer um mediante email e senha.


## Instalação e Uso

- `git clone` e `npm install`
- `setar EMAIL (email) e PASS (senha) no arquivo .env`
- `npm start`
- `retornará arquivos JSON e TXT, com suas reviews cadastradas no site`

## Libs
- `puppeteer`
- `fs`
- `dotenv`
- `json-to-plain-text`
- `readline-sync`

## Opções atuais:

1. Trazer todas Reviews Cadastradas 
     - [reviews até a última página]
1. Até uma página especifica
     - [ex: input: 7 | output: reviews entre as páginas 1 à 7]
1. Entre determinadas páginas
     - [ex: input: 3, 7 | output: reviews entre as páginas 3 à 7]
1. Apenas uma página
     - [input: 10 | output: todas reviews da página 10]