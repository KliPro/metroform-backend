// Obtém a string JSON com os dados do candidato armazenados no localStorage do navegador
const candidatoStr = localStorage.getItem('candidatoLogado');
// Se existir dados, converte a string JSON de volta para objeto JavaScript; caso contrário, atribui null
const candidato = candidatoStr ? JSON.parse(candidatoStr) : null;

// Verifica se o candidato NÃO está logado ou se falta o identificador único (id ou id_candidato)
if (!candidato || (!candidato.id && !candidato.id_candidato)) {
    // Alerta o utilizador que é obrigatório estar autenticado
    alert('Você precisa estar logado para aceder a esta página.');
    // Redireciona o utilizador não autenticado de volta para a página inicial
    window.location.href = 'index.html';
} else {
    // Armazena o ID real do candidato utilizando a propriedade disponível (id_candidato ou id)
    const idCandidatoReal = candidato.id_candidato || candidato.id;

    exibirDadosPerfil(candidato);
    sincronizarPerfilComServidor(idCandidatoReal);

    // Se o ID real do candidato estiver disponível, chama a função para carregar as candidaturas na base de dados MySQL
    if (idCandidatoReal) {
        carregarCandidaturas(idCandidatoReal);
    }
}

function escaparHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function arquivoSalvo(nome) {
    const texto = String(nome || '').trim();
    return Boolean(texto) && texto !== 'null' && texto !== 'undefined';
}

function urlUpload(nomeArquivo) {
    return `/uploads/${encodeURIComponent(nomeArquivo)}`;
}

function iniciaisDoNome(nome) {
    const partes = String(nome || 'Utilizador').trim().split(/\s+/).filter(Boolean);
    if (partes.length > 1) {
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return (partes[0] || 'U').substring(0, 2).toUpperCase();
}

function exibirDadosPerfil(dados) {
    document.getElementById('nome-exibir').textContent = dados.nome || 'Utilizador';
    document.getElementById('email-exibir').textContent = dados.email || '-';
    document.getElementById('telefone-exibir').textContent = dados.telefone || 'Não informado';

    const resumoEl = document.getElementById('resumo-exibir');
    if (resumoEl) {
        resumoEl.textContent = dados.resumo
            ? dados.resumo
            : 'Adicione um resumo sobre a sua experiência profissional...';
    }

    const formacaoExibir = document.getElementById('formacao-exibir');
    if (formacaoExibir) {
        formacaoExibir.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${escaparHtml(dados.formacao || 'Formação não informada')}`;
    }

    const cidadeExibir = document.getElementById('cidade-exibir');
    if (cidadeExibir) {
        cidadeExibir.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escaparHtml(dados.cidade || 'Endereço não informado')}`;
    }

    const avatarWrapper = document.getElementById('avatar-container-wrapper');
    if (avatarWrapper) {
        const desenharIniciais = () => {
            avatarWrapper.innerHTML = `<div class="avatar-inicial-perfil">${escaparHtml(iniciaisDoNome(dados.nome))}</div>`;
        };

        if (arquivoSalvo(dados.foto_perfil)) {
            const src = urlUpload(dados.foto_perfil);
            avatarWrapper.innerHTML = `<img src="${escaparHtml(src)}" alt="Foto de Perfil" class="foto-perfil">`;
            const img = avatarWrapper.querySelector('img');
            if (img) img.addEventListener('error', desenharIniciais);
        } else {
            desenharIniciais();
        }
    }

    const statusCurriculo = document.getElementById('status-curriculo');
    if (statusCurriculo) {
        if (arquivoSalvo(dados.curriculo_pdf)) {
            const href = urlUpload(dados.curriculo_pdf);
            statusCurriculo.innerHTML = `
                <div class="curriculo-box-info">
                    <div>
                        <p style="margin: 0; color: #0ca678; font-weight: bold; font-size: 14px;">
                            <i class="fa-solid fa-check-circle"></i> Currículo enviado com sucesso
                        </p>
                        <small style="color: #666; font-size: 12px;">${escaparHtml(dados.curriculo_pdf)}</small>
                    </div>
                    <a href="${escaparHtml(href)}" target="_blank" rel="noopener" class="btn-ver-pdf-perfil">
                        <i class="fa-solid fa-eye"></i> Ver PDF
                    </a>
                </div>
            `;
        } else {
            statusCurriculo.innerHTML = `<p style="color: #666; font-size: 14px;">Nenhum currículo em PDF enviado. Edite o perfil para enviar o seu arquivo.</p>`;
        }
    }
}

async function sincronizarPerfilComServidor(idCandidato) {
    try {
        const resposta = await fetch(`/api/candidatos/${idCandidato}`);
        if (!resposta.ok) return;
        const dados = await resposta.json();
        Object.assign(candidato, dados, {
            id: dados.id_candidato || candidato.id,
            id_candidato: dados.id_candidato || candidato.id_candidato
        });
        localStorage.setItem('candidatoLogado', JSON.stringify(candidato));
        exibirDadosPerfil(candidato);
    } catch (erro) {
        console.error('Erro ao sincronizar perfil:', erro);
    }
}

// Função assíncrona para buscar e renderizar as candidaturas efetuadas pelo candidato
async function carregarCandidaturas(idCandidato) {
    // Procura pelo container da lista de candidaturas utilizando múltiplos IDs de compatibilidade possíveis
    const containerLista = document.getElementById('grid-candidaturas') || document.getElementById('minhas-candidaturas');
    if (!containerLista) return; // Se o container não existir na página, interrompe a execução

    try {
        // Realiza uma requisição GET assíncrona para buscar as candidaturas do candidato específico na API (corrigido '=-')
        const resposta = await fetch(`/api/candidaturas/${idCandidato}`);
        
        // Se a resposta da API não for bem-sucedida
        if (!resposta.ok) {
            containerLista.innerHTML = '<p style="color: #666; font-size: 14px;">Ainda não se candidatou a nenhuma vaga.</p>';
            return;
        }

        // Converte a resposta da API num array de objetos JSON contendo as candidaturas
        const candidaturas = await resposta.json();

        // Se o array de candidaturas estiver vazio
        if (candidaturas.length === 0) {
            containerLista.innerHTML = '<p style="color: #666; font-size: 14px;">Ainda não se candidatou a nenhuma vaga. Explore as oportunidades disponíveis!</p>';
            return;
        }

        containerLista.innerHTML = ''; // Limpa o container antes de renderizar os itens
        // Itera sobre cada candidatura obtida para construir os cartões visuais
        candidaturas.forEach(item => {
            const cardItem = document.createElement('div');
            cardItem.className = 'item-candidatura'; // Adiciona a classe de estilo ao cartão

            // Injeta o conteúdo HTML estruturado com título da vaga, setor, localização, status e data
            cardItem.innerHTML = `
                <div>
                    <h4>${item.titulo}</h4>
                    <span class="tag-setor">Setor: ${item.setor}</span>
                    <p class="local-candidatura"><i class="fa-solid fa-location-dot" style="color: #7A0000;"></i> ${item.localizacao || 'Guarulhos / SP'}</p>
                </div>
                <div style="text-align: right;">
                    <span class="status-badge">${item.status_candidatura || 'Em Análise'}</span>
                    <br><small class="data-candidatura">Data: ${item.data_candidatura ? new Date(item.data_candidatura).toLocaleDateString('pt-BR') : 'Recente'}</small>
                </div>
            `;
            containerLista.appendChild(cardItem); // Adiciona o cartão gerado ao container principal na página
        });

    } catch (erro) {
        console.error('Erro de conexão ao carregar candidaturas:', erro);
        containerLista.innerHTML = '<p style="color: #666; font-size: 14px;">Ainda não possui candidaturas ativas registadas.</p>';
    }
}

// Função global para terminar sessão do candidato (Logout)
function logout() {
    localStorage.removeItem('candidatoLogado'); // Remove os dados do candidato armazenados no navegador
    window.location.href = 'index.html'; // Redireciona o utilizador de volta para a página inicial pública
}

// Função para abrir o modal de edição de perfil e preenchê-lo com os dados atuais
function separarCidadeEstado(valor) {
    const texto = String(valor || '').trim();
    const partes = texto.match(/^(.*)\s-\s([A-Za-z]{2})$/);
    if (partes) {
        return { cidade: partes[1].trim(), estado: partes[2].toUpperCase() };
    }
    return { cidade: texto, estado: '' };
}

function atualizarContadorResumo(textarea) {
    const max = Number(textarea.getAttribute('maxlength')) || 350;
    const restantes = max - textarea.value.length;
    const contadorEl = document.getElementById('contador-resumo');
    if (!contadorEl) return;
    contadorEl.textContent = `${restantes} caracteres restantes`;
    contadorEl.style.color = restantes < 30 ? '#d32f2f' : '#666';
}

function abrirModalEdicao() {
    const local = separarCidadeEstado(candidato.cidade);
    // Preenche os campos do formulário de edição com os dados existentes no objeto candidato
    document.getElementById('edit-nome').value = candidato.nome || '';
    document.getElementById('edit-telefone').value = String(candidato.telefone || '').replace(/\D/g, '').slice(0, 11);
    document.getElementById('edit-resumo').value = candidato.resumo || '';
    document.getElementById('edit-formacao').value = candidato.formacao || '';
    document.getElementById('edit-cidade').value = local.cidade;
    document.getElementById('edit-estado').value = local.estado;
    atualizarContadorResumo(document.getElementById('edit-resumo'));
    
    // Seleciona o elemento modal de edição no DOM
    const modal = document.getElementById('modal-edicao');
    if (modal) {
        modal.style.display = 'flex'; // Exibe o modal alterando o display para flex
        modal.classList.remove('oculto'); // Remove a classe que oculta o elemento
    }
}

// Função para fechar o modal de edição de perfil
function fecharModalEdicao() {
    const modal = document.getElementById('modal-edicao');
    if (modal) {
        modal.style.display = 'none'; // Esconde o modal definindo o display como none
        modal.classList.add('oculto'); // Adiciona a classe de ocultação
    }
}

// Seleciona o formulário de edição de perfil na página
const formEditarPerfil = document.getElementById('form-editar-perfil');
if (formEditarPerfil) {
    // Adiciona um ouvinte de evento para interceptar a submissão do formulário de edição
    formEditarPerfil.addEventListener('submit', async function(e) {
        e.preventDefault(); // Impede o recarregamento padrão da página

        const telefone = document.getElementById('edit-telefone').value.trim();
        const formacao = document.getElementById('edit-formacao').value.trim();
        const cidade = document.getElementById('edit-cidade').value.trim();
        const estado = document.getElementById('edit-estado').value.trim().toUpperCase();
        const resumo = document.getElementById('edit-resumo').value.trim();

        if (telefone && !/^\d+$/.test(telefone)) {
            alert('O telefone deve conter apenas números.');
            return;
        }
        if (telefone.length > 11) {
            alert('O telefone deve ter no máximo 11 números.');
            return;
        }
        if (formacao.length > 50) {
            alert('A formação deve ter no máximo 50 caracteres.');
            return;
        }
        if (cidade.length > 30) {
            alert('A cidade deve ter no máximo 30 caracteres.');
            return;
        }
        if (cidade || estado) {
            if (!cidade) {
                alert('Informe a cidade junto com a UF.');
                return;
            }
            if (!/^[A-Za-z]{2}$/.test(estado)) {
                alert('O estado deve ter exatamente 2 letras (UF).');
                return;
            }
        }
        if (resumo.length > 300) {
            alert('O resumo deve ter no máximo 300 caracteres.');
            return;
        }

        const fotoInput = document.getElementById('edit-foto');
        const fotoArquivo = fotoInput && fotoInput.files[0] ? fotoInput.files[0] : null;
        if (fotoArquivo) {
            const extensao = (fotoArquivo.name.split('.').pop() || '').toLowerCase();
            if (!['jpg', 'jpeg', 'png'].includes(extensao)) {
                alert('A foto de perfil deve ser .jpg, .jpeg ou .png.');
                return;
            }
            if (fotoArquivo.size > 2 * 1024 * 1024) {
                alert('A foto de perfil deve ter no máximo 2MB.');
                return;
            }
        }

        // Cria uma instância de FormData para suportar o envio de dados textuais e ficheiros binários (fotos/PDFs)
        const formData = new FormData();
        formData.append('nome', document.getElementById('edit-nome').value.trim());
        formData.append('telefone', telefone);
        formData.append('resumo', resumo);
        formData.append('formacao', formacao);
        formData.append('cidade', cidade);
        formData.append('estado', estado);
        
        if (fotoArquivo) {
            formData.append('foto', fotoArquivo);
        }

        // Verifica se foi selecionado um novo ficheiro de currículo em PDF
        const curriculoInput = document.getElementById('edit-curriculo');
        if (curriculoInput && curriculoInput.files[0]) {
            formData.append('curriculo', curriculoInput.files[0]);
        }

        // Identifica o ID real do candidato
        const idCandidato = candidato.id_candidato || candidato.id;

        try {
            // Envia os dados atualizados para a API do backend via requisição PUT utilizando FormData
            const resposta = await fetch(`/api/candidatos/${idCandidato}`, {
                method: 'PUT',
                body: formData
            });

            const resultado = await resposta.json();

            // Se a atualização for bem-sucedida no servidor
            if (resposta.ok) {
                alert(resultado.mensagem); // Exibe mensagem informativa de sucesso
                
                // Atualiza os dados localmente no objeto candidato com os novos valores inseridos nos inputs
                candidato.nome = document.getElementById('edit-nome').value.trim();
                candidato.telefone = telefone;
                candidato.resumo = resumo;
                candidato.formacao = formacao;
                candidato.cidade = resultado.cidade || (cidade ? `${cidade} - ${estado}` : '');
                candidato.foto_perfil = resultado.foto_perfil || candidato.foto_perfil || null;
                candidato.curriculo_pdf = resultado.curriculo_pdf || candidato.curriculo_pdf || null;
                
                // Atualiza o objeto serializado no localStorage com as novas informações
                localStorage.setItem('candidatoLogado', JSON.stringify(candidato));
                
                fecharModalEdicao(); // Fecha o modal de edição
                location.reload(); // Recarrega a página para atualizar visualmente todas as mudanças
            } else {
                alert(resultado.erro || 'Erro ao atualizar perfil.');
            }
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            alert('Não foi possível conectar ao servidor para atualizar.');
        }
    });
}