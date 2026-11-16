// ==========================================
// FUNÇÃO TOAST INTERNA DA PÁGINA DE VAGAS (Autónoma)
// ==========================================
function mostrarToast(mensagem, tipo = 'erro') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    } else {
        container.innerHTML = ''; 
    }

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerText = mensagem;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Variável global para armazenar todas as vagas vindas da API e permitir filtrar sem recarregar
let todasAsVagasPagina = [];

// ==========================================
// FUNÇÃO PARA CARREGAR VAGAS DO BANCO DE DADOS
// ==========================================
async function carregarVagasDoBanco() {
    try {
        const resposta = await fetch('/api/vagas');
        todasAsVagasPagina = await resposta.json();

        // Aplica o filtro inicial considerando a URL (se houver parâmetro ?busca=...)
        const urlParams = new URLSearchParams(window.location.search);
        const termoBuscaUrl = urlParams.get('busca') ? urlParams.get('busca').toLowerCase().trim() : '';

        if (termoBuscaUrl) {
            const inputBusca = document.getElementById('filtro-busca');
            if (inputBusca) inputBusca.value = termoBuscaUrl;
        }

        filtrarVagasPagina();

    } catch (erro) {
        console.error('Erro ao carregar as vagas do servidor:', erro);
    }
}

// ==========================================
// FUNÇÃO PARA RENDERIZAR OS CARDS NA TELA
// ==========================================
function renderizarGridVagas(vagas, termoExibicao = '') {
    const gridVagas = document.querySelector('.grid-vagas-completa');
    if (!gridVagas) return;

    gridVagas.innerHTML = '';

    if (vagas.length === 0) {
        gridVagas.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #666; font-size: 16px; padding: 20px;">Não foram encontradas vagas para os critérios selecionados.</p>`;
        return;
    }

    vagas.forEach(vaga => {
        const idVagaReal = vaga.id_vaga || vaga.id;
        const card = document.createElement('div');
        card.className = 'card-vaga';

        card.innerHTML = `
            <h3 class="vaga-titulo">${vaga.titulo}</h3>
            <span class="setor">Setor: ${vaga.setor}</span>
            <p class="local">📍 ${vaga.localizacao || "Guarulhos / SP"}</p>
            <p class="requisitos"><strong>Requisitos:</strong> ${vaga.requisitos || ""}</p>
            <div class="vaga-acoes">
                 <button type="button" class="btn-candidatar" onclick="candidatarVaga(${idVagaReal})">Candidatar-se</button>
            </div>
        `;
        gridVagas.appendChild(card);
    });
}

// ==========================================
// FUNÇÃO DE FILTRAGEM DINÂMICA (PESQUISA + SETOR)
// ==========================================
function filtrarVagasPagina() {
    const termoBusca = document.getElementById('filtro-busca')?.value.toLowerCase().trim() || '';
    const setorSelecionado = document.getElementById('filtro-setor')?.value.toLowerCase().trim() || '';

    const vagasFiltradas = todasAsVagasPagina.filter(vaga => {
        // Verifica se o texto digitado bate com título, setor, requisitos ou localização
        const textoMatch = 
            (vaga.titulo && vaga.titulo.toLowerCase().includes(termoBusca)) || 
            (vaga.setor && vaga.setor.toLowerCase().includes(termoBusca)) || 
            (vaga.requisitos && vaga.requisitos.toLowerCase().includes(termoBusca)) ||
            (vaga.localizacao && vaga.localizacao.toLowerCase().includes(termoBusca));

        // Verifica se o setor bate com o dropdown (se estiver vazio, passa todos)
        const setorVaga = (vaga.setor || '').toLowerCase();
        const setorMatch = !setorSelecionado || setorVaga.includes(setorSelecionado);

        return textoMatch && setorMatch;
    });

    renderizarGridVagas(vagasFiltradas, termoBusca);
}

// ==========================================
// INICIALIZAÇÃO E EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    carregarVagasDoBanco();

    // Adiciona os ouvintes de eventos para filtrar em tempo real conforme o utilizador digita ou seleciona o setor
    const inputBusca = document.getElementById('filtro-busca');
    const selectSetor = document.getElementById('filtro-setor');

    if (inputBusca) {
        inputBusca.addEventListener('input', filtrarVagasPagina);
    }

    if (selectSetor) {
        selectSetor.addEventListener('change', filtrarVagasPagina);
    }
});


// ==========================================
// FUNÇÃO DE CANDIDATURA À VAGA (Com Toast)
// ==========================================
async function candidatarVaga(idVaga) {
    const candidatoStr = localStorage.getItem('candidatoLogado');

    if (!candidatoStr) {
        mostrarToast('Você precisa estar logado para se candidatar a uma vaga.', 'erro');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    let candidato;
    try {
        candidato = JSON.parse(candidatoStr);
    } catch (e) {
        mostrarToast('Erro nos dados do utilizador. Faça login novamente.', 'erro');
        localStorage.removeItem('candidatoLogado');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    const idCandidatoReal = candidato.id_candidato || candidato.id || candidato.usuario_id;

    if (!idCandidatoReal) {
        mostrarToast('ID do candidato não encontrado. Faça login novamente.', 'erro');
        localStorage.removeItem('candidatoLogado');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    try {
        const resposta = await fetch('/api/candidaturas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_candidato: Number(idCandidatoReal),
                id_vaga: Number(idVaga)
            })
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            mostrarToast(resultado.mensagem || 'Candidatura efetuada com sucesso!', 'sucesso');
            setTimeout(() => {
                window.location.href = 'perfil.html';
            }, 1500);
        } else {
            mostrarToast(resultado.erro || 'Erro ao efetuar a candidatura.', 'erro');
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        mostrarToast('Não foi possível conectar ao servidor.', 'erro');
    }
}