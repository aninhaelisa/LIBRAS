import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, push, query, get, set, child } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD9FTeXP2r0aFoO_le2hCHApJxl4TcnlHw",
    authDomain: "libras-jogo.firebaseapp.com",
    databaseURL: "https://libras-jogo-default-rtdb.firebaseio.com",
    projectId: "libras-jogo",
    storageBucket: "libras-jogo.firebasestorage.app",
    messagingSenderId: "510664364893",
    appId: "1:510664364893:web:a434a65dd2232227944eb4",
    measurementId: "G-KCF7QBNH98"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let userId = localStorage.getItem("userId");
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userId", userId);
}

document.addEventListener('DOMContentLoaded', () => {


    const telaNome = document.getElementById('tela-nome');
    const telaJogo = document.getElementById('tela-jogo');
    const telaRanking = document.getElementById('tela-ranking');

    const btnIniciar = document.getElementById('btn-iniciar');
    const btnAjuda = document.getElementById('btn-ajuda');
    const btnVerRanking = document.getElementById('btn-ver-ranking');
    const btnVoltarJogo = document.getElementById('btn-voltar-jogo');
    const btnFecharAviso = document.getElementById('btn-fechar-aviso');
    const btnReiniciar = document.getElementById('btn-reiniciar');

    const tabuleiro = document.getElementById('tabuleiro');
    const pontuacaoElem = document.getElementById('pontuacao');
    const tempoElem = document.getElementById('tempo');
    const rankingList = document.getElementById('ranking-list');
    const inputNome = document.getElementById('nome-jogador');
    const resultadoJogador = document.getElementById('resultado-jogador');
    const avisoNome = document.getElementById('aviso-nome');


    let primeiraCarta = null;
    let segundaCarta = null;
    let bloqueio = false;
    let pontuacao = 0;
    let nomeJogador = "";
    let tempo = 0;
    let timerInterval;

    const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "X", "Z"];

    function mostrarAviso(mensagem) {
        avisoNome.querySelector('p').textContent = mensagem;
        avisoNome.classList.remove('escondido');
    }

    function resetarCartas() { primeiraCarta = null; segundaCarta = null; }
    function bloquearTabuleiro(valor) { bloqueio = valor; }
    function atualizarPontuacao() { pontuacaoElem.textContent = `Pontuação: ${pontuacao}`; }

    
    function criarCartas() {
        const pares = [];
        letras.forEach(letra => {
            pares.push({ tipo: 'letra', valor: letra });
            pares.push({ tipo: 'imagem', valor: letra });
        });
        const embaralhado = pares.sort(() => Math.random() - 0.5);
        tabuleiro.innerHTML = "";

        embaralhado.forEach(cartaObj => {
            const carta = document.createElement('div');
            carta.classList.add('carta');
            carta.dataset.tipo = cartaObj.tipo;
            carta.dataset.valor = cartaObj.valor;

            const inner = document.createElement('div');
            inner.classList.add('carta-inner');

            const front = document.createElement('div');
            front.classList.add('carta-front');
            if (cartaObj.tipo === 'imagem') {
                const img = document.createElement('img');
                img.src = `letras-libras/${cartaObj.valor}.png`;
                front.appendChild(img);
            } else {
                front.textContent = cartaObj.valor;
            }

            const back = document.createElement('div');
            back.classList.add('carta-back');
            back.textContent = '?';

            inner.appendChild(front);
            inner.appendChild(back);
            carta.appendChild(inner);
            carta.addEventListener('click', virarCarta);
            tabuleiro.appendChild(carta);
        });
    }

    function virarCarta(e) {
        if (bloqueio) return;
        const carta = e.currentTarget;
        if (carta === primeiraCarta || carta.classList.contains('virada') || carta.classList.contains('acertada')) return;

        carta.classList.add('virada');

        if (!primeiraCarta) {
            primeiraCarta = carta;
            return;
        }

        segundaCarta = carta;
        bloquearTabuleiro(true);

        setTimeout(() => verificarPar(), 600);
    }

    function verificarPar() {
        if (primeiraCarta.dataset.valor === segundaCarta.dataset.valor &&
            primeiraCarta.dataset.tipo !== segundaCarta.dataset.tipo) {

            pontuacao += 2;
            if (tempo < 10) pontuacao += 1;

            primeiraCarta.classList.add('acertada');
            segundaCarta.classList.add('acertada');

            atualizarPontuacao();
            resetarCartas();
            bloquearTabuleiro(false);
            checarFim();
        } else {
            pontuacao = Math.max(0, pontuacao - 1);
            atualizarPontuacao();
            setTimeout(() => {
                primeiraCarta.classList.remove('virada');
                segundaCarta.classList.remove('virada');
                resetarCartas();
                bloquearTabuleiro(false);
            }, 800);
        }
    }

    function checarFim() {
        const todas = document.querySelectorAll('.carta.acertada');
        if (todas.length === letras.length * 2) {
            clearInterval(timerInterval);
            salvarPontuacaoFirebase();
            finalizarJogo(); 
        }
    }
    function iniciarTimer() {
        tempo = 0;
        tempoElem.textContent = `Tempo: 0s`;
        timerInterval = setInterval(() => {
            tempo++;
            tempoElem.textContent = `Tempo: ${tempo}s`;
        }, 1000);
    }

    function reiniciarJogo() {
        telaRanking.classList.add('escondido');
        telaJogo.classList.remove('escondido');

        criarCartas();
        pontuacao = 0;
        atualizarPontuacao();
        iniciarTimer();
    }

    document.getElementById("btn-reiniciar").addEventListener("click", () => {
      
        location.reload();
        
    });

    function finalizarJogo() {
        const fimJogoElem = document.getElementById("fim-jogo");
        const btnReiniciar = document.getElementById("btn-reiniciar");
    
        fimJogoElem.style.display = "block";
        btnReiniciar.style.display = "inline-block";
    }
   
    btnAjuda.addEventListener('click', () => {
        if (bloqueio) return;
        bloquearTabuleiro(true);

        const cartasNaoAcertadas = document.querySelectorAll('.carta:not(.acertada)');
        cartasNaoAcertadas.forEach(c => c.classList.add('virada'));

        setTimeout(() => {
            cartasNaoAcertadas.forEach(c => c.classList.remove('virada'));
            resetarCartas();
            bloquearTabuleiro(false);
        }, 1500);
    });

   
    async function salvarPontuacaoFirebase() {
        const userRef = ref(database, `pontuacoes/${userId}`);
        const snapshot = await get(userRef);

        
        await set(userRef, {
            nome: nomeJogador,
            pontos: pontuacao,
            userId: userId
        });

        resultadoJogador.textContent = `Jogador: ${nomeJogador} | Pontos: ${pontuacao} | Tempo: ${tempo}s`;
        mostrarRankingGeral();
    }

  
    async function mostrarRankingGeral() {
        telaJogo.classList.add('escondido');
        telaRanking.classList.remove('escondido');
        rankingList.innerHTML = "";

        const pontuacoesRef = ref(database, 'pontuacoes');
        const snapshot = await get(pontuacoesRef);
        const ranking = [];

        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                ranking.push(data[key]);
            });
        }

        ranking.sort((a, b) => b.pontos - a.pontos);

        ranking.forEach((jogador, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${jogador.nome} - ${jogador.pontos} pontos`;

            if (nomeJogador && jogador.userId === userId) {
                li.style.color = "#e9b50b";
                li.style.fontWeight = "800";
            }

            rankingList.appendChild(li);
        });
    }

    btnIniciar.addEventListener('click', async () => {
        nomeJogador = inputNome.value.trim();
        if (!nomeJogador) {
            mostrarAviso("Digite seu nome para jogar!");
            return;
        }

        const pontuacoesRef = ref(database, 'pontuacoes');
        const snapshot = await get(pontuacoesRef);
        const data = snapshot.val();

        if (data) {
            for (let key in data) {
                if (data[key].nome.toLowerCase() === nomeJogador.toLowerCase() && data[key].userId !== userId) {
                    mostrarAviso("Este nome já está em uso por outro jogador! Escolha outro.");
                    return;
                }
            }
        }

        telaNome.classList.add('escondido');
        telaJogo.classList.remove('escondido');
        criarCartas();
        pontuacao = 0;
        atualizarPontuacao();
        iniciarTimer();
    });

    btnReiniciar.addEventListener('click', reiniciarJogo);
    btnVerRanking.addEventListener('click', mostrarRankingGeral);
    btnVoltarJogo.addEventListener('click', () => {
        telaRanking.classList.add('escondido');
        telaJogo.classList.remove('escondido');
    });

    btnFecharAviso.addEventListener('click', () => {
        avisoNome.classList.add('escondido');
    });

});