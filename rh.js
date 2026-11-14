// Aguarda o carregamento completo do DOM da página para iniciar a execução dos scripts
document.addEventListener('DOMContentLoaded', () => {
    // Recupera e converte os dados da sessão do administrador guardados no armazenamento local do navegador
    const adminLogado = JSON.parse(localStorage.getItem('adminLogado'));
    
    // Verifica se o objeto de sessão do gestor de RH existe
    if (!adminLogado) {
        alert('Acesso restrito. Faça login como Gestor RH.'); // Alerta o utilizador sobre a restrição de acesso
        window.location.href = 'index.html'; // Redireciona de volta à página inicial se não estiver autenticado
        return; // Interrompe a execução adicional do script nesta página
    }

    // Se estiver autenticado, invoca as funções para carregar os dados dinâmicos do painel restrito
    carregarCandidaturasRH();
    carregarBancoTalentosRH();
    carregarVagasPainelRH();
    carregarEstatisticasRH();
});

// Função global para terminar a sessão do Gestor de RH (Logout)
function logoutGestor() {
    localStorage.removeItem('adminLogado'); // Remove a chave de autenticação do administrador do navegador
    window.location.href = 'index.html'; // Redireciona o utilizador de volta para a página inicial pública
}

// Função para exibir o modal de criação de nova vaga na tela
function abrirModalVaga() {
    const modal = document.getElementById('modal-nova-vaga');
    if (modal) {
        modal.style.display = 'flex'; // Torna o modal visível alterando a propriedade CSS display para flex
        modal.classList.remove('oculto'); // Remove a classe utilitária de ocultação
    }
}

// Função para ocultar o modal de criação de nova vaga
function fecharModalVaga() {
    const modal = document.getElementById('modal-nova-vaga');
    if (modal) {
        modal.style.display = 'none'; // Oculta o modal definindo o display como none
        modal.classList.add('oculto'); // Adiciona a classe utilitária para garantir que permaneça oculto
    }
}

// Função para fechar o modal de detalhes do currículo/candidato
function fecharModal() {
    const modal = document.getElementById('modal-curriculo');
    if (modal) {
        modal.style.display = 'none'; // Esconde a janela modal de detalhes
        modal.classList.add('oculto'); // Adiciona a classe de ocultação
    }
}

// Intercepta o envio do formulário de cadastro de nova vaga pelo RH
const formCadastrarVaga = document.getElementById('form-cadastrar-vaga');
if (formCadastrarVaga) {
    formCadastrarVaga.addEventListener('submit', async function(e) {
        e.preventDefault(); // Impede o recarregamento padrão da página ao submeter o formulário

        // Cria o objeto contendo os dados da nova vaga preenchidos pelo gestor nos campos do modal
        const novaVaga = {
            titulo: document.getElementById('input-titulo-vaga').value.trim(),
            setor: document.getElementById('input-setor-vaga').value.trim(),
            localizacao: document.getElementById('input-local-vaga').value.trim() || 'Guarulhos / SP',
            requisitos: document.getElementById('input-requisitos-vaga').value.trim()
        };

        try {
            // Envia os dados da nova vaga para a API do backend através de uma requisição POST assíncrona
            const resposta = await fetch('/api/vagas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaVaga)
            });

            const resultado = await resposta.json();

            // Verifica se a vaga foi cadastrada com sucesso na base de dados
            if (resposta.ok) {
                alert(resultado.mensagem); // Exibe mensagem informativa de sucesso
                formCadastrarVaga.reset(); // Limpa os campos do formulário
                fecharModalVaga(); // Fecha o modal de criação de vagas
                carregarVagasPainelRH(); // Atualiza a listagem de vagas no painel
                carregarEstatisticasRH(); // Atualiza os contadores estatísticos do topo
            } else {
                alert(resultado.erro || 'Erro ao cadastrar a vaga.'); // Exibe alerta com o erro retornado
            }
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            alert('Não foi possível conectar ao servidor para cadastrar a vaga.');
        }
    });
}

// Função assíncrona para carregar e listar as vagas cadastradas no painel de gestão do RH
async function carregarVagasPainelRH() {
    const containerVagas = document.getElementById('lista-vagas-rh');
    if (!containerVagas) return; // Se o container não existir na página, interrompe a execução

    try {
        // Faz uma requisição GET para buscar todas as vagas registadas no sistema
        const resposta = await fetch('/api/vagas');
        if (!resposta.ok) return;

        const vagas = await resposta.json();

        // Se não houver vagas registadas, exibe uma mensagem informativa no container
        if (vagas.length === 0) {
            containerVagas.innerHTML = '<p style="color: #666; font-size: 14px; padding: 10px;">Nenhuma vaga cadastrada no momento.</p>';
            return;
        }

        containerVagas.innerHTML = ''; // Limpa o container antes de renderizar os itens
        // Itera sobre cada vaga para construir os elementos HTML dinamicamente
        vagas.forEach(vaga => {
            const idVagaReal = vaga.id_vaga || vaga.id; // Identifica o ID real da vaga independentemente da propriedade

            const itemVaga = document.createElement('div');
            itemVaga.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border: 1px solid #e0e0e0; padding: 15px; margin-bottom: 10px; border-radius: 6px;";
            
            // Injeta o conteúdo estruturado da vaga e o botão de exclusão com o respetivo ID
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
            containerVagas.appendChild(itemVaga); // Adiciona o elemento criado ao container principal do painel
        });

    } catch (erro) {
        console.error('Erro ao carregar vagas no painel do RH:', erro);
    }
}

// Função assíncrona para excluir uma vaga específica selecionada pelo RH
async function excluirVaga(idVaga) {
    // Exibe uma caixa de confirmação antes de proceder à exclusão permanente
    if (!confirm('Tem certeza de que deseja excluir esta vaga permanentemente?')) {
        return; // Cancela a operação se o gestor recusar a confirmação
    }

    try {
        // Envia uma requisição DELETE para a API do backend contendo o ID da vaga
        const resposta = await fetch(`/api/vagas/${idVaga}`, {
            method: 'DELETE'
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            alert(resultado.mensagem); // Alerta de sucesso na remoção
            carregarVagasPainelRH(); // Atualiza a lista de vagas visíveis
            carregarEstatisticasRH(); // Atualiza os contadores gerais do painel
        } else {
            alert(resultado.erro || 'Erro ao excluir a vaga.');
        }
    } catch (erro) {
        console.error('Erro de conexão ao excluir:', erro);
        alert('Não foi possível conectar ao servidor para excluir a vaga.');
    }
}

// Função assíncrona para preencher a tabela de candidaturas recentes submetidas pelos utilizadores
async function carregarCandidaturasRH() {
    const tbody = document.getElementById('tabela-candidatos-rh');
    if (!tbody) return;

    try {
        // Busca as candidaturas associadas às vagas através da API restrita do RH
        const resposta = await fetch('/api/candidaturas-rh');
        if (!resposta.ok) return;

        const candidaturas = await resposta.json();
        tbody.innerHTML = ''; // Limpa a tabela antes de preencher

        // Se não existirem candidaturas, exibe uma linha informativa na tabela
        if (candidaturas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666; padding: 20px;">Nenhuma candidatura recente encontrada.</td></tr>';
            return;
        }

        // Itera por cada candidatura e constrói as linhas da tabela dinamicamente
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

// Função assíncrona para carregar a tabela com os currículos enviados para o Banco Geral de Talentos
async function carregarBancoTalentosRH() {
    const tbody = document.getElementById('tabela-banco-talentos');
    if (!tbody) return;

    try {
        // Faz uma requisição GET para obter os currículos gerais do banco de talentos
        const resposta = await fetch('/api/banco-talentos');
        if (!resposta.ok) return;

        const dados = await resposta.json();
        const talentos = dados.talentos || dados;
        tbody.innerHTML = '';

        // Se o banco estiver vazio, exibe uma linha informativa
        if (!Array.isArray(talentos) || talentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666; padding: 20px;">Nenhum currículo no banco de talentos.</td></tr>';
            return;
        }

        // Itera por cada talento registado para povoar a tabela de gestão
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

// Função assíncrona para remover um currículo específico do Banco de Talentos
async function excluirTalento(idTalento) {
    // Solicita confirmação ao gestor antes de prosseguir com a exclusão do registo
    if (!confirm('Tem certeza de que deseja remover este currículo do Banco de Talentos?')) {
        return;
    }

    try {
        // Envia requisição DELETE para a API do backend com o ID do talento selecionado
        const resposta = await fetch(`/api/banco-talentos/${idTalento}`, {
            method: 'DELETE'
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            alert(resultado.mensagem);
            carregarBancoTalentosRH(); // Atualiza a tabela do banco de talentos após a remoção
        } else {
            alert(resultado.erro || 'Erro ao excluir o currículo.');
        }
    } catch (erro) {
        console.error('Erro de conexão ao excluir talento:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
}

// Função assíncrona para carregar as métricas e estatísticas numéricas resumidas no topo do painel do RH
async function carregarEstatisticasRH() {
    try {
        const resposta = await fetch('/api/estatisticas-rh');
        if (!resposta.ok) return;

        const dados = await resposta.json();

        // Seleciona os elementos do DOM responsáveis por exibir os contadores
        const elVagas = document.getElementById('contador-vagas');
        const elCandidatos = document.getElementById('contador-candidatos');
        const elMatches = document.getElementById('contador-matches');

        // Atualiza o texto dos contadores com os dados obtidos da API, se existirem na página
        if (elVagas) elVagas.textContent = dados.vagasAtivas;
        if (elCandidatos) elCandidatos.textContent = dados.candidatosInscritos;
        if (elMatches) elMatches.textContent = dados.matchesAltos;

    } catch (erro) {
        console.error('Erro ao carregar estatísticas do RH:', erro);
    }
}

// Variável global de controlo para guardar o ID da candidatura atualmente selecionada para visualização/edição
let candidaturaSelecionadaId = null;

// Função para abrir o modal de detalhes completos e perfil do candidato a partir de uma candidatura
function abrirDetalhesCandidato(item) {
    candidaturaSelecionadaId = item.id_candidatura; // Armazena o ID da candidatura atual

    // Preenche os campos textuais do modal com as informações detalhadas do candidato e da vaga
    document.getElementById('modal-nome').textContent = item.candidato_nome || '---';
    document.getElementById('modal-email').textContent = item.candidato_email || '---';
    document.getElementById('modal-telefone').textContent = item.candidato_telefone || 'Não informado';
    document.getElementById('modal-cidade').textContent = item.candidato_cidade || 'Não informado';
    document.getElementById('modal-formacao').textContent = item.candidato_formacao || 'Não informada';
    document.getElementById('modal-vaga').textContent = item.vaga_titulo || '---';
    document.getElementById('modal-setor').textContent = item.vaga_setor || '---';
    document.getElementById('modal-match').textContent = '85%';
    document.getElementById('modal-resumo').textContent = item.candidato_resumo || 'Nenhum resumo informado.';

    // Configura o link para visualização do currículo em PDF anexo, se houver
    const pdfContainer = document.getElementById('modal-pdf-container');
    if (item.curriculo_pdf && item.curriculo_pdf !== 'null') {
        pdfContainer.innerHTML = `<a href="/uploads/${item.curriculo_pdf}" target="_blank" style="color: #7A0000; font-weight: bold;"><i class="fa-solid fa-file-pdf"></i> Abrir Currículo em PDF</a>`;
    } else {
        pdfContainer.textContent = 'Nenhum currículo em anexo.';
    }

    // Exibe o modal de currículo na tela alterando o display para flex
    const modal = document.getElementById('modal-curriculo');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('oculto');
    }
}

// Função assíncrona para atualizar o estado/status de uma candidatura específica (ex: Aprovado, Rejeitado)
async function atualizarStatusCandidatura(novoStatus) {
    if (!candidaturaSelecionadaId) return; // Interrompe se nenhuma candidatura estiver selecionada

    try {
        // Envia uma requisição PUT para a rota do backend responsável por atualizar o status da candidatura
        const resposta = await fetch(`/api/candidaturas/${candidaturaSelecionadaId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            alert(resultado.mensagem); // Alerta de sucesso na alteração de status
            fecharModal(); // Fecha o modal de detalhes do candidato
            carregarCandidaturasRH(); // Recarrega a tabela de candidaturas para refletir a atualização
        } else {
            alert(resultado.erro || 'Erro ao atualizar status.');
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
}