function novoElemento(tagName, className) {         //função para criar elementos passando a tag e 
    const elem = document.createElement(tagName)    //classe que quero que seja criada.
    elem.className = className
    return elem
}

function Barreira(reversa = false) {
    this.elemento = novoElemento('div', 'barreira')  //novo elemento barreira 

    const borda = novoElemento('div', 'borda')
    const corpo = novoElemento('div', 'corpo')
    this.elemento.appendChild(reversa ? corpo : borda)  //para criar as barreiras variaveis 
    this.elemento.appendChild(reversa ? borda : corpo)  //em cima e embaixo e add como filho de barreira

    //para definir o tamanho do corpo das barreiras 
    this.setAltura = altura => corpo.style.height = `${altura}px`
}

/*const b = new Barreira(true)   //testando
b.setAltura(300)
document.querySelector('[wm-flappy]').appendChild(b.elemento)*/

function ParDeBarreiras(altura, abertura, x) {
    this.elemento = novoElemento('div', 'par-de-barreiras')

    this.superior = new Barreira(true)   // atribuindo a barreira reversa como de cima
    this.inferior = new Barreira(false) // e a reversa debaixo

    this.elemento.appendChild(this.superior.elemento)  // adicionado a par-de-barreiras
    this.elemento.appendChild(this.inferior.elemento)

    //vamos variar as aberturas, as passagens entres as barreiras, calculando as diferenças entre alturas
    this.sortearAbertura = () => {
        const alturaSuperior = Math.random()*(altura - abertura)
        const alturaInferior = altura - abertura - alturaSuperior
        this.superior.setAltura(alturaSuperior)
        this.inferior.setAltura(alturaInferior)
    }
    console.log(abertura)

    this.getX = () => parseInt(this.elemento.style.left.split('px')[0]) // para saber a posição que estará a barreira na tela
    this.setX = x => this.elemento.style.left = `${x}px`                // para alterar o x
    this.getLargura = () => this.elemento.clientWidth           //para obter a largura
    this.sortearAbertura()
    this.setX(x)
}

/* testando variaçao da barreira
 b é objeto criado a partir de uma função construtora, e para add tem que usar b.elemento 

 const b = new ParDeBarreiras(700, 200, 800) 
 document.querySelector('[wm-flappy]').appendChild(b.elemento)*/


// Barreiras irem andando - parametros: altura e largura do jogo, abertura e espaco entre as barreiras
function Barreiras(altura, largura, abertura, espaco, notificarPonto) {
    this.pares = [
        new ParDeBarreiras(altura, abertura, largura),
        new ParDeBarreiras(altura, abertura, largura + espaco),         // criar looping usando as mesmas 4 barreiras
        new ParDeBarreiras(altura, abertura, largura + espaco * 2),
        new ParDeBarreiras(altura, abertura, largura + espaco * 3)
    ]

    const deslocamento = 3     // barreiras vão se deslocar a cada 3 px
    this.animar = () => {
        this.pares.forEach(par => {
            par.setX(par.getX() - deslocamento)

            // quando o elemento barreira sair da area do jogo
            if(par.getX() < -par.getLargura()) {
                par.setX(par.getX() + espaco * this.pares.length)
                par.sortearAbertura() // para nao repetir as mesmas 4, sorteamos denovo
            }

            const meio = largura / 2
            const cruzou0Meio = par.getX() + deslocamento >= meio
                && par.getX() < meio
            if(cruzou0Meio) notificarPonto()

        })
    }
}

function Passaro(alturaJogo) {
    let voando = false

    this.elemento = novoElemento('img', 'passaro')
    this.elemento.src = 'imgs/passaro.png'

    this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0])
    this.setY = y => this.elemento.style.bottom = `${y}px`

    window.onkeydown = e => voando = true
    window.onkeyup = e => voando = false

    this.animar = () => {
        const novoY = this.getY() + (voando ? 8 : -5)
        const alturaMaxima = alturaJogo - this.elemento.clientHeight

        if(novoY <= 0){
            this.setY(0)
        } else if(novoY >= alturaMaxima){
            this.setY(alturaMaxima)
        } else {
            this.setY(novoY)
        } 
    }

    this.setY(alturaJogo / 2)
}


/* testanto animação barreiras andando e voo do passaro

const barreiras = new Barreiras(700, 1200, 200, 400)
const passaro = new Passaro(700)
const areaDoJogo = document.querySelector('[wm-flappy]')

areaDoJogo.appendChild(passaro.elemento)
barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))
setInterval(() => {
    barreiras.animar()
    passaro.animar()
}, 20) */


function Progresso() {
    this.elemento = novoElemento('span', 'progresso')
    this.atualizarPontos = pontos => {
        this.elemento.innerHTML = pontos
    }
    this.atualizarPontos(0)
}

function estaoSobrepostos(elementoA, elementoB){
    const a = elementoA.getBoundingClientRect()
    const b = elementoB.getBoundingClientRect()

    const horizontal = a.left + a.width >= b.left
        && b.left + b.width >= a.left
    const vertical = a.top + a.height >= b.top
        && b.top + b.height >= a.top
    return horizontal && vertical
}

function colidiu(passaro, barreiras){
    let colidiu = false
    barreiras.pares.forEach(pardeBarreiras => {
        if (!colidiu) {
            const superior = pardeBarreiras.superior.elemento
            const inferior = pardeBarreiras.inferior.elemento
            colidiu = estaoSobrepostos(passaro.elemento, superior)
                || estaoSobrepostos(passaro.elemento, inferior)
        }
    })
    return colidiu

}

function FlappyBird() {
    let pontos = 0

    const areaDoJogo = document.querySelector('[wm-flappy]')
    const altura = areaDoJogo.clientHeight
    const largura = areaDoJogo.clientWidth

    const progresso = new Progresso()
    const barreiras = new Barreiras(altura, largura, 200, 400,
        () => progresso.atualizarPontos(++pontos))              //incremento dos pontos
    const passaro = new Passaro(altura)

    areaDoJogo.appendChild(progresso.elemento)
    areaDoJogo.appendChild(passaro.elemento)
    barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

    this.start = () => { //loop do jog
        const temporizador = setInterval(() => {
            barreiras.animar()
            passaro.animar()

            if(colidiu(passaro,barreiras)){
                clearInterval(temporizador)
                
            }
        }, 20)
    }
}

const homeFlappy = new FlappyBird()

function start() {
    homeFlappy.start()
} 



