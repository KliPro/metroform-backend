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

    // Preenche os dados básicos do utilizador no cabeçalho e perfil da página
    document.getElementById('nome-exibir').textContent = candidato.nome || 'Utilizador';
    document.getElementById('email-exibir').textContent = candidato.email || '-';
    document.getElementById('telefone-exibir').textContent = candidato.telefone || 'Não informado';
    
    // Se houver um resumo profissional registado, exibe-o no respetivo elemento do DOM
    if (candidato.resumo) {
        document.getElementById('resumo-exibir').textContent = candidato.resumo;
    }

    // Seleciona o elemento de exibição da formação académica no DOM
    const formacaoExibir = document.getElementById('formacao-exibir');
    if (formacaoExibir) {
        // Injeta o ícone e o texto da formação ou uma mensagem padrão se não estiver preenchida
        formacaoExibir.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${candidato.formacao || 'Formação não informada'}`;
    }

    // Seleciona o elemento de exibição da cidade/morada no DOM
    const cidadeExibir = document.getElementById('cidade-exibir');
    if (cidadeExibir) {
        // Injeta o ícone de localização e a cidade ou uma mensagem padrão
        cidadeExibir.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${candidato.cidade || 'Endereço não informado'}`;
    }

    // --- RENDERIZAÇÃO INTELIGENTE DO AVATAR ---
    // Seleciona o container wrapper onde a foto de perfil ou as iniciais serão exibidas
    const avatarWrapper = document.getElementById('avatar-container-wrapper');
    if (avatarWrapper) {
        // Se o candidato tiver uma foto de perfil cadastrada na base de dados
        if (candidato.foto_perfil) {
            // Renderiza a imagem do avatar apontando para a pasta de uploads do servidor backend
            avatarWrapper.innerHTML = `<img src="/uploads/${candidato.foto_perfil}" alt="Foto de Perfil" class="foto-perfil">`;
        } else {
            // Caso não tenha foto, separa o nome em partes para gerar iniciais automáticas
            const nomePartes = (candidato.nome || 'Utilizador').trim().split(' ');
            // Se houver mais de uma palavra, pega a primeira letra do primeiro e último nome; senão, pega as duas primeiras letras
            const iniciais = nomePartes.length > 1 
                ? (nomePartes[0][0] + nomePartes[nomePartes.length - 1][0]).toUpperCase() 
                : nomePartes[0].substring(0, 2).toUpperCase();
            
            // Renderiza um bloco estilizado com as iniciais geradas dinamicamente
            avatarWrapper.innerHTML = `<div class="avatar-inicial-perfil">${iniciais}</div>`;
        }
    }

    // --- EXIBIÇÃO DINÂMICA DO CURRÍCULO PDF ---
    // Seleciona o container de status do currículo na página de perfil
    const statusCurriculo = document.getElementById('status-curriculo');
    if (statusCurriculo) {
        // Verifica se o candidato possui um ficheiro de currículo em PDF válido associado
        if (candidato.curriculo_pdf && candidato.curriculo_pdf !== 'null') {
            // Injeta a estrutura HTML informando que o currículo foi enviado com sucesso e criando o botão de visualização
            statusCurriculo.innerHTML = `
                <div class="curriculo-box-info">
                    <div>
                        <p style="margin: 0; color: #0ca678; font-weight: bold; font-size: 14px;">
                            <i class="fa-solid fa-check-circle"></i> Currículo enviado com sucesso
                        </p>
                        <small style="color: #666; font-size: 12px;">${candidato.curriculo_pdf}</small>
                    </div>
                    <a href="/uploads/${candidato.curriculo_pdf}" target="_blank" class="btn-ver-pdf-perfil">
                        <i class="fa-solid fa-eye"></i> Ver PDF
                    </a>
                </div>
            `;
        } else {
            // Exibe mensagem informativa caso nenhum currículo tenha sido anexado ainda
            statusCurriculo.innerHTML = `<p style="color: #666; font-size: 14px;">Nenhum currículo em PDF enviado. Edite o perfil para enviar o seu arquivo.</p>`;
        }
    }

    // Se o ID real do candidato estiver disponível, chama a função para carregar as candidaturas na base de dados MySQL
    if (idCandidatoReal) {
        carregarCandidaturas(idCandidatoReal);
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
function abrirModalEdicao() {
    // Preenche os campos do formulário de edição com os dados existentes no objeto candidato
    document.getElementById('edit-nome').value = candidato.nome || '';
    document.getElementById('edit-telefone').value = candidato.telefone || '';
    document.getElementById('edit-resumo').value = candidato.resumo || '';
    document.getElementById('edit-formacao').value = candidato.formacao || '';
    document.getElementById('edit-cidade').value = candidato.cidade || '';
    
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

        // Cria uma instância de FormData para suportar o envio de dados textuais e ficheiros binários (fotos/PDFs)
        const formData = new FormData();
        formData.append('nome', document.getElementById('edit-nome').value);
        formData.append('telefone', document.getElementById('edit-telefone').value);
        formData.append('resumo', document.getElementById('edit-resumo').value);
        formData.append('formacao', document.getElementById('edit-formacao').value);
        formData.append('cidade', document.getElementById('edit-cidade').value);
        
        // Verifica se foi selecionado um ficheiro de nova foto de perfil
        const fotoInput = document.getElementById('edit-foto');
        if (fotoInput && fotoInput.files[0]) {
            formData.append('foto', fotoInput.files[0]);
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
                candidato.nome = document.getElementById('edit-nome').value;
                candidato.telefone = document.getElementById('edit-telefone').value;
                candidato.resumo = document.getElementById('edit-resumo').value;
                candidato.formacao = document.getElementById('edit-formacao').value;
                candidato.cidade = document.getElementById('edit-cidade').value;
                
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