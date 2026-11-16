// ==========================================
// FUNÇÃO TOAST INTERNA DO PAINEL RH (Autónoma)
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


// ==========================================
// INICIALIZAÇÃO DA PÁGINA DO PAINEL RH
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const adminLogado = JSON.parse(localStorage.getItem('adminLogado'));
    
    if (!adminLogado) {
        mostrarToast('Acesso restrito. Faça login como Gestor RH.', 'erro');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    carregarCandidaturasRH();
    carregarBancoTalentosRH();
    carregarVagasPainelRH();
    carregarEstatisticasRH();
});

// Função global para terminar a sessão do Gestor de RH (Logout)
function logoutGestor() {
    localStorage.removeItem('adminLogado');
    window.location.href = 'index.html';
}

// Função para exibir o modal de criação de nova vaga na tela
function abrirModalVaga() {
    const modal = document.getElementById('modal-nova-vaga');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('oculto');
    }
}

// Função para ocultar o modal de criação de nova vaga
function fecharModalVaga() {
    const modal = document.getElementById('modal-nova-vaga');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('oculto');
    }
}

// Função para fechar o modal de detalhes do currículo/candidato
function fecharModal() {
    const modal = document.getElementById('modal-curriculo');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('oculto');
    }
}


// ==========================================
// CADASTRO DE NOVA VAGA (Com fecho automático)
// ==========================================
const formCadastrarVaga = document.getElementById('form-cadastrar-vaga');
if (formCadastrarVaga) {
    formCadastrarVaga.addEventListener('submit', async function(e) {
        e.preventDefault();

        const inputTitulo = document.getElementById('input-titulo-vaga') || document.getElementById('titulo-vaga');
        const inputSetor = document.getElementById('input-setor-vaga') || document.getElementById('setor-vaga');
        const inputLocal = document.getElementById('input-local-vaga') || document.getElementById('local-vaga');
        const inputRequisitos = document.getElementById('input-requisitos-vaga') || document.getElementById('requisitos-vaga');

        const novaVaga = {
            titulo: inputTitulo ? inputTitulo.value.trim() : '',
            setor: inputSetor ? inputSetor.value.trim() : '',
            localizacao: (inputLocal ? inputLocal.value.trim() : '') || 'Guarulhos / SP',
            requisitos: inputRequisitos ? inputRequisitos.value.trim() : ''
        };

        if (!novaVaga.titulo || !novaVaga.setor) {
            mostrarToast('Preencha o Título e o Setor da vaga.', 'erro');
            return;
        }

        try {
            const resposta = await fetch('/api/vagas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaVaga)
            });

            const resultado = await resposta.json();

            if (resposta.ok) {
                mostrarToast(resultado.mensagem || 'Vaga cadastrada com sucesso!', 'sucesso');
                formCadastrarVaga.reset(); 
                fecharModalVaga(); // Fecha o modal imediatamente
                carregarVagasPainelRH(); 
                carregarEstatisticasRH(); 
            } else {
                mostrarToast(resultado.erro || 'Erro ao cadastrar a vaga.', 'erro');
            }
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            mostrarToast('Não foi possível conectar ao servidor para cadastrar a vaga.', 'erro');
        }
    });
}


// ==========================================
// CARREGAR E EXCLUIR VAGAS NO PAINEL DO RH
// ==========================================
async function carregarVagasPainelRH() {
    const containerVagas = document.getElementById('lista-vagas-rh');
    if (!containerVagas) return;

    try {
        const resposta = await fetch('/api/vagas');
        if (!resposta.ok) return;

        const vagas = await resposta.json();

        if (vagas.length === 0) {
            containerVagas.innerHTML = '<p style="color: #666; font-size: 14px; padding: 10px;">Nenhuma vaga cadastrada no momento.</p>';
            return;
        }

        containerVagas.innerHTML = ''; 
        vagas.forEach(vaga => {
            const idVagaReal = vaga.id_vaga || vaga.id; 

            const itemVaga = document.createElement('div');
            itemVaga.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border: 1px solid #e0e0e0; padding: 15px; margin-bottom: 10px; border-radius: 6px;";
            
            itemVaga.innerHTML = `
                <div>
                    <h4 style="margin: 0 0 5px 0; color: #1a1a1a;">${vaga.titulo}</h4>
                    <p style="margin: 0; font-size: 13px; color: #666;"><strong>Setor:</strong> ${vaga.setor} | <strong>Local:</strong> ${vaga.localizacao || 'Guarulhos / SP'}</p>
                </div>
                <div>
                    <button onclick="excluirVaga(${idVagaReal})" class="btn-profissional btn-vermelho" style="padding: 6px 12px; font-size: 13px; background-color: #d9534f; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fa-solid fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            containerVagas.appendChild(itemVaga);
        });

    } catch (erro) {
        console.error('Erro ao carregar vagas no painel do RH:', erro);
    }
}

async function excluirVaga(idVaga) {
    try {
        const resposta = await fetch(`/api/vagas/${idVaga}`, {
            method: 'DELETE'
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            mostrarToast(resultado.mensagem || 'Vaga excluída com sucesso!', 'sucesso');
            carregarVagasPainelRH(); 
            carregarEstatisticasRH(); 
        } else {
            mostrarToast(resultado.erro || 'Erro ao excluir a vaga.', 'erro');
        }
    } catch (erro) {
        console.error('Erro de conexão ao excluir:', erro);
        mostrarToast('Não foi possível conectar ao servidor para excluir a vaga.', 'erro');
    }
}


// ==========================================
// GESTÃO DE CANDIDATURAS RECENTES
// ==========================================
async function carregarCandidaturasRH() {
    const tbody = document.getElementById('tabela-candidatos-rh');
    if (!tbody) return;

    try {
        const resposta = await fetch('/api/candidaturas-rh');
        if (!resposta.ok) return;

        const candidaturas = await resposta.json();
        tbody.innerHTML = ''; 

        if (candidaturas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666; padding: 20px;">Nenhuma candidatura recente encontrada.</td></tr>';
            return;
        }

        candidaturas.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.candidato_nome}</td>
                <td>${item.vaga_titulo}</td>
                <td>${item.vaga_setor}</td>
                <td><span class="status-badge">${item.status_candidatura || 'Em Análise'}</span></td>
                <td>
                    <button onclick='abrirDetalhesCandidato(${JSON.stringify(item)})' class="btn-profissional" style="padding: 5px 10px; font-size: 12px;">Ver Detalhes</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar candidaturas do RH:', erro);
    }
}


// ==========================================
// BANCO GERAL DE TALENTOS (GESTÃO RH)
// ==========================================
async function carregarBancoTalentosRH() {
    const tbody = document.getElementById('tabela-banco-talentos');
    if (!tbody) return;

    try {
        const resposta = await fetch('/api/banco-talentos');
        if (!resposta.ok) return;

        const dados = await resposta.json();
        const talentos = dados.talentos || dados;
        tbody.innerHTML = '';

        if (!Array.isArray(talentos) || talentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666; padding: 20px;">Nenhum currículo no banco de talentos.</td></tr>';
            return;
        }

        talentos.forEach(talento => {
            const idTalentoReal = talento.id_talento || talento.id;
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${talento.nome}</td>
                <td>${talento.email}</td>
                <td>${talento.telefone || '-'}</td>
                <td><a href="/uploads/${talento.curriculo_pdf}" target="_blank" style="background-color: #f1f1f1; color: #7A0000; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 12px;">Ver PDF</a></td>
                <td>${new Date(talento.data_envio).toLocaleDateString('pt-BR')}</td>
                <td>
                    <button onclick="excluirTalento(${idTalentoReal})" class="btn-profissional btn-vermelho" style="padding: 6px 10px; font-size: 12px; background-color: #d9534f; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        <i class="fa-solid fa-trash"></i> Excluir
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar banco de talentos:', erro);
    }
}

async function excluirTalento(idTalento) {
    try {
        const resposta = await fetch(`/api/banco-talentos/${idTalento}`, {
            method: 'DELETE'
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            mostrarToast(resultado.mensagem || 'Currículo removido com sucesso!', 'sucesso');
            carregarBancoTalentosRH(); 
        } else {
            mostrarToast(resultado.erro || 'Erro ao excluir o currículo.', 'erro');
        }
    } catch (erro) {
        console.error('Erro de conexão ao excluir talento:', erro);
        mostrarToast('Não foi possível conectar ao servidor.', 'erro');
    }
}


// ==========================================
// ESTATÍSTICAS DO PAINEL RH
// ==========================================
async function carregarEstatisticasRH() {
    try {
        const resposta = await fetch('/api/estatisticas-rh');
        if (!resposta.ok) return;

        const dados = await resposta.json();

        const elVagas = document.getElementById('contador-vagas');
        const elCandidatos = document.getElementById('contador-candidatos');
        const elMatches = document.getElementById('contador-matches');

        if (elVagas) elVagas.textContent = dados.vagasAtivas;
        if (elCandidatos) elCandidatos.textContent = dados.candidatosInscritos;
        if (elMatches) elMatches.textContent = dados.matchesAltos;

    } catch (erro) {
        console.error('Erro ao carregar estatísticas do RH:', erro);
    }
}


// ==========================================
// DETALHES E STATUS DO CANDIDATO (MODAL)
// ==========================================
let candidaturaSelecionadaId = null;

function abrirDetalhesCandidato(item) {
    candidaturaSelecionadaId = item.id_candidatura; 

    document.getElementById('modal-nome').textContent = item.candidato_nome || '---';
    document.getElementById('modal-email').textContent = item.candidato_email || '---';
    document.getElementById('modal-telefone').textContent = item.candidato_telefone || 'Não informado';
    document.getElementById('modal-cidade').textContent = item.candidato_cidade || 'Não informado';
    document.getElementById('modal-formacao').textContent = item.candidato_formacao || 'Não informada';
    document.getElementById('modal-vaga').textContent = item.vaga_titulo || '---';
    document.getElementById('modal-setor').textContent = item.vaga_setor || '---';
    document.getElementById('modal-match').textContent = '85%';
    document.getElementById('modal-resumo').textContent = item.candidato_resumo || 'Nenhum resumo informado.';

    const pdfContainer = document.getElementById('modal-pdf-container');
    if (item.curriculo_pdf && item.curriculo_pdf !== 'null') {
        pdfContainer.innerHTML = `<a href="/uploads/${item.curriculo_pdf}" target="_blank" style="color: #7A0000; font-weight: bold;"><i class="fa-solid fa-file-pdf"></i> Abrir Currículo em PDF</a>`;
    } else {
        pdfContainer.textContent = 'Nenhum currículo em anexo.';
    }

    const modal = document.getElementById('modal-curriculo');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('oculto');
    }
}

async function atualizarStatusCandidatura(novoStatus) {
    if (!candidaturaSelecionadaId) return; 

    try {
        const resposta = await fetch(`/api/candidaturas/${candidaturaSelecionadaId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            mostrarToast(resultado.mensagem, 'sucesso'); 
            fecharModal(); 
            carregarCandidaturasRH(); 
        } else {
            mostrarToast(resultado.erro || 'Erro ao atualizar status.', 'erro');
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        mostrarToast('Não foi possível conectar ao servidor.', 'erro');
    }
}