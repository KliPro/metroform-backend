// ==========================================
// FUNÇÃO GLOBAL DE TOAST NOTIFICATIONS
// ==========================================
// Exibe uma notificação flutuante elegante no canto superior direito da tela
function mostrarToast(mensagem, tipo = 'erro') {
    let container = document.getElementById('toast-container'); // Procura o container de toasts no HTML
    if (!container) {
        container = document.createElement('div'); // Cria o container caso não exista
        container.id = 'toast-container';
        document.body.appendChild(container); // Adiciona ao corpo da página
    }

    const toast = document.createElement('div'); // Cria o elemento visual do toast
    toast.className = `toast ${tipo}`; // Define a classe de estilo (sucesso ou erro)
    toast.innerText = mensagem; // Insere o texto da mensagem no toast

    container.appendChild(toast); // Adiciona o toast dentro do container

    setTimeout(() => {
        toast.remove(); // Remove o toast automaticamente após 3 segundos
    }, 3000);
}


// ==========================================
// FUNÇÕES DE CONTROLE DE MODAIS (ABRIR E FECHAR)
// ==========================================

// Exibe o modal de login/cadastro do candidato na tela alterando o display para flex
function abrirModalCandidato() {
    document.getElementById('modal-candidato').style.display = 'flex';
}

// Oculta o modal de candidato alterando o display para none
function fecharModalCandidato() {
    document.getElementById('modal-candidato').style.display = 'none';
}

// Exibe o modal de acesso restrito para o RH/Gestor
function abrirModalRH() {
    document.getElementById('modal-rh').style.display = 'flex';
}

// Oculta o modal de acesso do RH/Gestor
function fecharModalRH() {
    document.getElementById('modal-rh').style.display = 'none';
}

// Abre o modal de recuperação de senha a partir do link do modal de candidato
function abrirModalRecuperar(event) {
    event.preventDefault(); // Impede o comportamento padrão de navegação do link
    document.getElementById('modal-recuperar').style.display = 'flex'; // Exibe o modal de recuperação
}

// Fecha o modal de recuperação de senha
function fecharModalRecuperar() {
    document.getElementById('modal-recuperar').style.display = 'none';
}


// ==========================================
// ALTERNÂNCIA DE ABAS NO MODAL DE CANDIDATO
// ==========================================
// Alterna visualmente entre as abas de "Entrar" e "Criar Conta"
function mudarAbaCand(tipo) {
    const btnEntrar = document.getElementById('aba-cand-entrar'); // Botão da aba Entrar
    const btnCadastrar = document.getElementById('aba-cand-cadastrar'); // Botão da aba Cadastrar
    const formLogin = document.getElementById('form-login-candidato'); // Formulário de login
    const formCadastro = document.getElementById('form-cadastro-candidato'); // Formulário de cadastro

    if (tipo === 'login') {
        btnEntrar.style.background = 'white'; // Destaca o botão de entrar
        btnEntrar.style.color = '#7A0000';
        btnCadastrar.style.background = 'transparent'; // Desmarca o botão de cadastrar
        btnCadastrar.style.color = '#555';
        formLogin.style.display = 'block'; // Mostra formulário de login
        formCadastro.style.display = 'none'; // Esconde formulário de cadastro
    } else {
        btnCadastrar.style.background = 'white'; // Destaca o botão de cadastrar
        btnCadastrar.style.color = '#7A0000';
        btnEntrar.style.background = 'transparent'; // Desmarca o botão de entrar
        btnEntrar.style.color = '#555';
        formCadastro.style.display = 'block'; // Mostra formulário de cadastro
        formLogin.style.display = 'none'; // Esconde formulário de login
    }
}


// ==========================================
// FORMULÁRIO DE CADASTRO DE CANDIDATO
// ==========================================
// Intercepta o envio do formulário de registo para enviar os dados via API
document.getElementById('form-cadastro-candidato').addEventListener('submit', async function(e) {
    e.preventDefault(); // Evita o recarregamento da página
    
    // Captura os valores inseridos nos inputs do formulário de cadastro
    const dadosCandidato = {
        nome: document.getElementById('nome-cad-cand').value,
        email: document.getElementById('email-cad-cand').value,
        senha: document.getElementById('senha-cad-cand').value
    };

    try {
        // Faz a requisição POST para a API de registo de candidatos no backend
        const resposta = await fetch('/api/candidatos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCandidato)
        });
        const resultado = await resposta.json();

        if (resposta.ok) {
            mostrarToast(resultado.mensagem, 'sucesso'); // Exibe toast de sucesso verde
            document.getElementById('form-cadastro-candidato').reset(); // Limpa os campos do formulário
            mudarAbaCand('login'); // Alterna para a aba de login automaticamente
        } else {
            mostrarToast(resultado.erro || 'Erro ao cadastrar candidato.', 'erro'); // Exibe toast de erro vermelho
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        mostrarToast('Não foi possível conectar ao servidor backend.', 'erro'); // Toast de falha de conexão
    }
});


// ==========================================
// FORMULÁRIO DE LOGIN DE CANDIDATO
// ==========================================
// Intercepta o envio do formulário de login do candidato
document.getElementById('form-login-candidato').addEventListener('submit', async function(e) {
    e.preventDefault(); // Evita o recarregamento padrão da página
    
    // Captura e-mail e senha inseridos
    const dadosLogin = {
        email: document.getElementById('email-login-cand').value,
        senha: document.getElementById('senha-login-cand').value
    };

    try {
        // Envia as credenciais para a API de autenticação
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosLogin)
        });
        const resultado = await resposta.json();

        if (resposta.ok) {
            localStorage.removeItem('adminLogado'); // Remove sessão de RH por segurança
            localStorage.setItem('candidatoLogado', JSON.stringify(resultado.candidato)); // Guarda os dados do candidato no navegador
            window.location.href = 'perfil.html'; // Redireciona para a página de perfil
        } else {
            mostrarToast(resultado.erro || 'E-mail ou senha incorretos.', 'erro'); // Toast de erro de credenciais
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        mostrarToast('Não foi possível conectar ao servidor backend.', 'erro'); // Toast de erro de rede
    }
});


// ==========================================
// VALIDAÇÃO E LOGIN DO GESTOR RH
// ==========================================
const formLoginRhModal = document.getElementById("form-login-rh-modal");

if (formLoginRhModal) {
    formLoginRhModal.addEventListener("submit", (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        // Captura e remove espaços extras dos dados digitados
        const emailInput = document.getElementById("email-rh-modal").value.trim();
        const senhaInput = document.getElementById("senha-rh-modal").value.trim();

        // Validação estática das credenciais de acesso do gestor de RH
        if (emailInput === "rh@metroform.com" && senhaInput === "123456") {
            localStorage.removeItem('candidatoLogado'); // Remove sessão de candidato ativa
            
            const dadosAdmin = {
                nome: "Gestor RH",
                email: emailInput
            };
            localStorage.setItem('adminLogado', JSON.stringify(dadosAdmin)); // Salva sessão do admin
            window.location.href = 'rh.html'; // Redireciona para o painel de RH
        } else {
            mostrarToast("E-mail ou senha incorretos!", 'erro'); // Toast de erro de login de RH
        }
    });
}


// ==========================================
// RECUPERAÇÃO DE SENHA
// ==========================================
const formModalRecuperar = document.getElementById('form-modal-recuperar');
if (formModalRecuperar) {
    formModalRecuperar.addEventListener('submit', async function(e) {
        e.preventDefault(); // Evita recarregamento
        const email = document.getElementById('email-recuperar').value.trim();
        const novaSenha = prompt('Insira a sua nova senha temporária ou definitiva:'); // Solicita nova senha via prompt

        if (!novaSenha) return; // Cancela se o usuário fechar o prompt

        try {
            // Envia solicitação de recuperação para a API
            const resposta = await fetch('/api/recuperar-senha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, novaSenha })
            });
            const resultado = await resposta.json();
            
            if (resposta.ok) {
                mostrarToast(resultado.mensagem, 'sucesso'); // Toast de sucesso na alteração
                fecharModalRecuperar(); // Fecha o modal
                formModalRecuperar.reset(); // Limpa o formulário
            } else {
                mostrarToast(resultado.erro || 'Erro ao redefinir senha.', 'erro'); // Toast de erro
            }
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            mostrarToast('Não foi possível conectar ao servidor.', 'erro'); // Toast de erro de rede
        }
    });
}


// ==========================================
// LOGOUT GERAL DO SISTEMA
// ==========================================
// Remove todos os dados de sessão armazenados e retorna à página inicial
function logoutGeral() {
    localStorage.removeItem('candidatoLogado'); 
    localStorage.removeItem('adminLogado');     
    localStorage.removeItem('rhLogado');        
    window.location.href = 'index.html';        
}


// ==========================================
// VERIFICAÇÃO DE SESSÃO AO CARREGAR A PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // --- VERIFICAÇÃO DO CANDIDATO ---
    const candidatoLogado = JSON.parse(localStorage.getItem('candidatoLogado'));
    const linkCandidato = document.getElementById('link-candidato-header');

    // Personaliza o botão do cabeçalho se houver candidato logado
    if (candidatoLogado && linkCandidato) {
        const primeiroNome = candidatoLogado.nome.split(' ')[0]; 
        linkCandidato.textContent = `Olá, ${primeiroNome}`; 
        
        linkCandidato.onclick = function(e) {
            e.preventDefault();
            window.location.href = 'perfil.html'; // Redireciona para o perfil ao clicar
        };
        
        linkCandidato.classList.add('usuario-logado');
    }

    // --- VERIFICAÇÃO DO GESTOR RH ---
    const adminLogado = JSON.parse(localStorage.getItem('adminLogado'));
    const linkRh = document.getElementById('link-rh-header');

    // Personaliza o botão do cabeçalho se houver gestor logado
    if (adminLogado && linkRh) {
        const primeiroNomeAdmin = adminLogado.nome.split(' ')[0];
        linkRh.textContent = `Painel: ${primeiroNomeAdmin}`; 
        
        linkRh.onclick = function(e) {
            e.preventDefault();
            window.location.href = 'rh.html'; // Redireciona para o painel de RH ao clicar
        };
        
        linkRh.classList.add('usuario-logado');
    }
});


// ==========================================
// CARREGAR VAGAS RECENTES NA PÁGINA INICIAL
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    // Esconde o banco de talentos se o gestor de RH estiver logado
    if (localStorage.getItem("adminLogado")) {
        const linkBancoTalentos = document.querySelector(".link-banco-talentos"); 
        if (linkBancoTalentos) {
            linkBancoTalentos.style.display = "none";
        }
    }
});

// Busca as vagas cadastradas e renderiza dinamicamente na página inicial
async function carregarVagasNaHome() {
    const gridVagas = document.querySelector(".grid-vagas");
    if (!gridVagas) return; // Se a grelha não existir na página, interrompe

    try {
        const resposta = await fetch("/api/vagas"); // Requisição GET para buscar vagas
        if (resposta.ok) {
            const vagas = await resposta.json();

            // Mensagem caso não existam vagas
            if (vagas.length === 0) {
                gridVagas.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #666;">Nenhuma vaga ativa no momento.</p>`;
                return;
            }

            gridVagas.innerHTML = ""; // Limpa o container
            
            // Exibe apenas as 3 vagas mais recentes na home
            vagas.slice(0, 3).forEach(vaga => {
                const card = document.createElement("div");
                
                card.innerHTML = `
                    <h3 class="vaga-titulo">${vaga.titulo}</h3>
                    <p class="vaga-info"><strong>Setor:</strong> ${vaga.setor}</p>
                    <p class="vaga-info">📍 ${vaga.localizacao || "Guarulhos / SP"}</p>
                    <p class="vaga-requisitos"><strong>Requisitos:</strong> ${vaga.requisitos || ""}</p>
                    <div class="vaga-acoes">
                     <button type="button" class="btn-candidatar" onclick="candidatarVaga(${vaga.id_vaga})">Candidatar-se</button>
                    </div>
                `;
                gridVagas.appendChild(card); // Adiciona o card na grelha
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar vagas na home:", erro);
    }
}


// ==========================================
// BANCO GERAL DE TALENTOS (ENVIO RÁPIDO / MODAL)
// ==========================================
function abrirModalBancoTalentos() {
    const modal = document.getElementById('modal-banco-talentos');
    if (!modal) return;

    const candidatoLogado = JSON.parse(localStorage.getItem('candidatoLogado'));
    const conteudoModal = modal.querySelector('.modal-box');

    // Se o candidato estiver logado, oferece envio rápido em 1 clique com os dados já salvos
    if (candidatoLogado) {
        conteudoModal.innerHTML = `
            <button type="button" onclick="fecharModalBancoTalentos()" class="modal-close">&times;</button>
            <div class="modal-header">
                <h2>Banco Geral de Talentos</h2>
                <p>Olá, <strong>${candidatoLogado.nome.split(' ')[0]}</strong>! Envie o seu perfil atual instantaneamente.</p>
            </div>
            <div style="text-align: center; padding: 20px 0;">
                <p style="color: #555; margin-bottom: 25px; font-size: 14px; line-height: 1.5;">
                    O sistema irá utilizar automaticamente as suas informações de contacto, resumo profissional e o currículo já associados à sua conta.
                </p>
                <button type="button" id="btn-envio-rapido" class="btn-submit-auth">
                    🚀 Enviar Meu Perfil Atual com 1 Clique
                </button>
            </div>
        `;

        // Evento de clique para o envio rápido do perfil existente
        document.getElementById('btn-envio-rapido').addEventListener('click', async () => {
            try {
                const formData = new FormData();
                formData.append('nome', candidatoLogado.nome || '');
                formData.append('email', candidatoLogado.email || '');
                formData.append('telefone', candidatoLogado.telefone || '');
                formData.append('resumo', candidatoLogado.resumo || '');
                
                const nomeCurriculo = candidatoLogado.curriculo_pdf || candidatoLogado.curriculoPdf || candidatoLogado.curriculo || 'curriculo_via_perfil.pdf';
                formData.append('curriculo_pdf_existente', nomeCurriculo);

                // Envia dados para a API do banco de talentos
                const resposta = await fetch('/api/banco-talentos', {
                    method: 'POST',
                    body: formData
                });

                const resultado = await resposta.json();

                if (resposta.ok) {
                    mostrarToast(resultado.mensagem, 'sucesso'); // Toast de sucesso
                    fecharModalBancoTalentos(); // Fecha o modal
                    window.location.reload(); // Atualiza a página
                } else {
                    mostrarToast(resultado.erro || 'Erro ao enviar o currículo.', 'erro'); // Toast de erro
                }
            } catch (erro) {
                console.error('Erro de conexão:', erro);
                mostrarToast('Não foi possível conectar ao servidor.', 'erro'); // Toast de erro de rede
            }
        });
    }

    modal.style.display = 'flex'; // Exibe o modal
    modal.classList.remove('oculto');
}

// Fecha o modal do banco de talentos
function fecharModalBancoTalentos() {
    const modal = document.getElementById('modal-banco-talentos');
    if (modal) {
        modal.style.display = 'none'; 
        modal.classList.add('oculto');
    }
}


// ==========================================
// FORMULÁRIO DO BANCO DE TALENTOS (VISITANTES)
// ==========================================
const formBancoTalentos = document.getElementById('form-banco-talentos');

// Submissão manual de currículo para utilizadores não logados
if (formBancoTalentos) {
    formBancoTalentos.addEventListener('submit', async function(e) {
        e.preventDefault(); // Evita o recarregamento

        const formData = new FormData();
        formData.append('nome', document.getElementById('talento-nome').value.trim());
        formData.append('email', document.getElementById('talento-email').value.trim());
        formData.append('telefone', document.getElementById('talento-telefone').value.trim());
        formData.append('resumo', document.getElementById('talento-resumo').value.trim());
        
        const curriculoFile = document.getElementById('talento-curriculo').files[0];
        if (curriculoFile) {
            formData.append('curriculo', curriculoFile); // Anexa o ficheiro PDF de currículo
        }

        try {
            // Envia o formulário completo com o ficheiro para o backend
            const resposta = await fetch('/api/banco-talentos', {
                method: 'POST',
                body: formData
            });

            const resultado = await resposta.json();

            if (resposta.ok) {
                mostrarToast(resultado.mensagem, 'sucesso'); // Toast de sucesso
                formBancoTalentos.reset(); // Limpa o formulário
                fecharModalBancoTalentos(); // Fecha o modal
            } else {
                mostrarToast(resultado.erro || 'Erro ao enviar o currículo.', 'erro'); // Toast de erro
            }
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            mostrarToast('Não foi possível conectar ao servidor para enviar o currículo.', 'erro'); // Toast de falha de rede
        }
    });
}


// ==========================================
// FUNÇÃO DE CANDIDATURA À VAGA
// ==========================================
// Efetua a candidatura do utilizador logado a uma vaga específica
async function candidatarVaga(idVaga) {
    if (!idVaga) {
        console.error("ID da vaga não foi fornecido.");
        mostrarToast("Erro: ID da vaga não identificado.", 'erro');
        return;
    }

    const candidatoStr = localStorage.getItem('candidatoLogado');

    // Valida se o candidato está logado antes de permitir candidatar-se
    if (!candidatoStr) {
        mostrarToast('Você precisa estar logado para se candidatar a uma vaga.', 'erro');
        abrirModalCandidato(); // Abre o modal de login automaticamente
        return;
    }

    let candidato;
    try {
        candidato = JSON.parse(candidatoStr);
    } catch (e) {
        mostrarToast('Erro nos dados do utilizador. Faça login novamente.', 'erro');
        localStorage.removeItem('candidatoLogado');
        return;
    }

    const idCandidatoReal = candidato.id_candidato || candidato.id || candidato.usuario_id;

    if (!idCandidatoReal) {
        mostrarToast('ID do candidato não encontrado. Faça login novamente.', 'erro');
        localStorage.removeItem('candidatoLogado');
        return;
    }

    try {
        // Envia a candidatura para a API de candidaturas
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
            mostrarToast(resultado.mensagem, 'sucesso'); // Toast de sucesso na candidatura
            setTimeout(() => {
                window.location.href = 'perfil.html'; // Redireciona para o perfil após 1 segundo
            }, 1000);
        } else {
            mostrarToast(resultado.erro || 'Erro ao efetuar a candidatura.', 'erro'); // Toast de erro
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        mostrarToast('Não foi possível conectar ao servidor.', 'erro'); // Toast de erro de rede
    }
}

// ==========================================
// CONTADOR DE CARACTERES DO RESUMO PROFISSIONAL
// ==========================================
function atualizarContadorResumo(textarea) {
    const max = textarea.getAttribute('maxlength'); // Pega o limite máximo (350)
    const atual = textarea.value.length; // Conta quantos caracteres já foram digitados
    const restantes = max - atual; // Calcula quantos faltam
    
    const contadorEl = document.getElementById('contador-resumo');
    if (contadorEl) {
        contadorEl.innerText = `${restantes} caracteres restantes`;
        
        // Opcional: muda a cor para vermelho se estiver a aproximar-se do limite
        if (restantes < 30) {
            contadorEl.style.color = '#d32f2f';
        } else {
            contadorEl.style.color = '#666';
        }
    }
}

// ==========================================
// MÁSCARA E VALIDAÇÃO DO CAMPO TELEFONE
// ==========================================
function mascaraTelefone(input) {
    // Remove tudo o que não for número (bloqueia letras e símbolos instantaneamente)
    let valor = input.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos no máximo
    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }

    // Aplica a máscara dinamicamente
    if (valor.length > 10) {
        valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (valor.length > 5) {
        valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (valor.length > 2) {
        valor = valor.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (valor.length > 0) {
        valor = valor.replace(/^(\d{0,2})/, '($1');
    }

    input.value = valor;
}