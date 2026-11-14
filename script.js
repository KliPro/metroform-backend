// ==========================================
// FUNÇÕES DE CONTROLE DE MODAIS (ABRIR E FECHAR)
// ==========================================

// Função global para exibir o modal de login/cadastro do candidato na tela
function abrirModalCandidato() {
    // Altera a propriedade CSS display do elemento para 'flex', tornando o modal visível
    document.getElementById('modal-candidato').style.display = 'flex';
}

// Função global para ocultar o modal de candidato
function fecharModalCandidato() {
    // Altera a propriedade CSS display para 'none', escondendo o modal da tela
    document.getElementById('modal-candidato').style.display = 'none';
}

// Função global para exibir o modal de acesso do RH/Gestor
function abrirModalRH() {
    // Torna visível o modal de autenticação restrita para o administrador de RH
    document.getElementById('modal-rh').style.display = 'flex';
}

// Função global para ocultar o modal de RH/Gestor
function fecharModalRH() {
    // Oculta o modal de login do gestor de RH
    document.getElementById('modal-rh').style.display = 'none';
}

// Função para abrir o modal de recuperação de senha a partir do link do modal de candidato
function abrirModalRecuperar(event) {
    event.preventDefault(); // Impede o comportamento padrão de navegação ou recarregamento do link HTML
    document.getElementById('modal-recuperar').style.display = 'flex'; // Exibe o modal de recuperação de senha
}

// Função para fechar o modal de recuperação de senha
function fecharModalRecuperar() {
    // Esconde o modal de recuperação de senha da tela
    document.getElementById('modal-recuperar').style.display = 'none';
}


// ==========================================
// ALTERNÂNCIA DE ABAS NO MODAL DE CANDIDATO
// ==========================================
// Função para alternar visualmente entre as abas de Entrar e Criar Conta no modal do Candidato
function mudarAbaCand(tipo) {
    const btnEntrar = document.getElementById('aba-cand-entrar');
    const btnCadastrar = document.getElementById('aba-cand-cadastrar');
    const formLogin = document.getElementById('form-login-candidato');
    const formCadastro = document.getElementById('form-cadastro-candidato');

    // Verifica se a opção escolhida pelo utilizador foi a aba de login
    if (tipo === 'login') {
        // Estiliza visualmente o botão de entrar como ativo (fundo branco e texto em destaque)
        btnEntrar.style.background = 'white';
        btnEntrar.style.color = '#7A0000';
        // Remove o destaque visual da aba de cadastro
        btnCadastrar.style.background = 'transparent';
        btnCadastrar.style.color = '#555';
        // Mostra o formulário de login e esconde o formulário de cadastro
        formLogin.style.display = 'block';
        formCadastro.style.display = 'none';
    } else {
        // Caso contrário, ativa visualmente a aba de cadastro
        btnCadastrar.style.background = 'white';
        btnCadastrar.style.color = '#7A0000';
        // Remove o destaque visual da aba de entrar
        btnEntrar.style.background = 'transparent';
        btnEntrar.style.color = '#555';
        // Mostra o formulário de cadastro e esconde o formulário de login
        formCadastro.style.display = 'block';
        formLogin.style.display = 'none';
    }
}


// ==========================================
// FORMULÁRIO DE CADASTRO DE CANDIDATO
// ==========================================
// Adiciona um ouvinte para interceptar o envio do formulário de cadastro do candidato
document.getElementById('form-cadastro-candidato').addEventListener('submit', async function(e) {
    e.preventDefault(); // Impede o comportamento padrão de submissão que recarregaria a página
    
    // Agrupa em um objeto os valores introduzidos pelo utilizador nos campos de input do cadastro
    const dadosCandidato = {
        nome: document.getElementById('nome-cad-cand').value,
        email: document.getElementById('email-cad-cand').value,
        senha: document.getElementById('senha-cad-cand').value
    };

    try {
        // Envia os dados para a API de registo de candidatos no servidor backend via requisição POST
        const resposta = await fetch('/api/candidatos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCandidato)
        });
        const resultado = await resposta.json();

        // Se o servidor MySQL registar o candidato com sucesso
        if (resposta.ok) {
            alert(resultado.mensagem); // Exibe mensagem informativa de sucesso
            document.getElementById('form-cadastro-candidato').reset(); // Limpa os campos do formulário
            mudarAbaCand('login'); // Redireciona visualmente o utilizador para a aba de login
        } else {
            alert(resultado.erro); // Exibe o erro retornado pela API (ex: e-mail já duplicado)
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        alert('Não foi possível conectar ao servidor backend.');
    }
});


// ==========================================
// FORMULÁRIO DE LOGIN DE CANDIDATO
// ==========================================
// Adiciona um ouvinte para interceptar o envio do formulário de login do candidato
document.getElementById('form-login-candidato').addEventListener('submit', async function(e) {
    e.preventDefault(); // Impede o recarregamento automático da página
    
    // Recolhe as credenciais inseridas no formulário de login
    const dadosLogin = {
        email: document.getElementById('email-login-cand').value,
        senha: document.getElementById('senha-login-cand').value
    };

    try {
        // Envia as credenciais para a rota de autenticação de candidatos via método POST
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosLogin)
        });
        const resultado = await resposta.json();

        // Se as credenciais forem válidas
        if (resposta.ok) {
            localStorage.removeItem('adminLogado'); // Remove qualquer sessão anterior de RH por segurança
            localStorage.setItem('candidatoLogado', JSON.stringify(resultado.candidato)); // Guarda os dados do candidato no armazenamento do navegador
            window.location.href = 'perfil.html'; // Redireciona o utilizador logado para a página de perfil
        } else {
            alert(resultado.erro); // Alerta caso o e-mail ou palavra-passe estejam incorretos
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        alert('Não foi possível conectar ao servidor backend.');
    }
});


// ==========================================
// VALIDAÇÃO E LOGIN DO GESTOR RH
// ==========================================
// Seleciona o formulário de login modal do RH
const formLoginRhModal = document.getElementById("form-login-rh-modal");

if (formLoginRhModal) {
    formLoginRhModal.addEventListener("submit", (e) => {
        e.preventDefault(); // Evita o recarregamento padrão da página

        // Captura e remove espaços extras dos dados digitados nos campos
        const emailInput = document.getElementById("email-rh-modal").value.trim();
        const senhaInput = document.getElementById("senha-rh-modal").value.trim();

        // Validação estática das credenciais de acesso restrito do gestor de RH
        if (emailInput === "rh@metroform.com" && senhaInput === "123456") {
            localStorage.removeItem('candidatoLogado'); // Remove qualquer sessão de candidato aberta para evitar conflitos
            
            // Cria o objeto com os dados de identificação do administrador
            const dadosAdmin = {
                nome: "Gestor RH",
                email: emailInput
            };
            localStorage.setItem('adminLogado', JSON.stringify(dadosAdmin)); // Salva a sessão do administrador no LocalStorage
            window.location.href = 'rh.html'; // Redireciona o gestor para o painel de controlo restrito de RH
        } else {
            alert("E-mail ou senha incorretos!"); // Alerta de credenciais inválidas
        }
    });
}


// ==========================================
// RECUPERAÇÃO DE SENHA
// ==========================================
// Adiciona um ouvinte para o envio do formulário de recuperação de senha
const formModalRecuperar = document.getElementById('form-modal-recuperar');
if (formModalRecuperar) {
    formModalRecuperar.addEventListener('submit', async function(e) {
        e.preventDefault(); // Impede o comportamento padrão de envio
        const email = document.getElementById('email-recuperar').value.trim();
        const novaSenha = prompt('Insira a sua nova senha temporária ou definitiva:');

        if (!novaSenha) return; // Interrompe a execução caso o utilizador cancele o prompt

        try {
            // Envia o e-mail e a nova palavra-passe para a API de recuperação no servidor
            const resposta = await fetch('/api/recuperar-senha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, novaSenha })
            });
            const resultado = await resposta.json();
            
            // Se a alteração for bem-sucedida
            if (resposta.ok) {
                alert(resultado.mensagem);
                fecharModalRecuperar(); // Fecha o modal de recuperação
                formModalRecuperar.reset(); // Limpa os campos do formulário
            } else {
                alert(resultado.erro || 'Erro ao redefinir senha.');
            }
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            alert('Não foi possível conectar ao servidor.');
        }
    });
}


// ==========================================
// LOGOUT GERAL DO SISTEMA
// ==========================================
// Função global para terminar sessão de qualquer tipo de utilizador e limpar o armazenamento local
function logoutGeral() {
    localStorage.removeItem('candidatoLogado'); // Apaga os dados de sessão do candidato
    localStorage.removeItem('adminLogado');     // Apaga os dados de sessão do administrador de RH
    localStorage.removeItem('rhLogado');        // Limpeza de compatibilidade para outras chaves de sessão
    window.location.href = 'index.html';        // Redireciona o utilizador de volta à página inicial
}


// ==========================================
// VERIFICAÇÃO DE SESSÃO AO CARREGAR A PÁGINA
// ==========================================
// Executado ao carregar a página inicial para verificar se existem utilizadores ativos e personalizar o cabeçalho
document.addEventListener('DOMContentLoaded', () => {
    // --- VERIFICAÇÃO DO CANDIDATO ---
    const candidatoLogado = JSON.parse(localStorage.getItem('candidatoLogado'));
    const linkCandidato = document.getElementById('link-candidato-header');

    // Se houver um candidato autenticado e o link existir no menu
    if (candidatoLogado && linkCandidato) {
        const primeiroNome = candidatoLogado.nome.split(' ')[0]; // Extrai apenas o primeiro nome do utilizador
        linkCandidato.textContent = `Olá, ${primeiroNome}`; // Substitui o texto do botão por uma saudação personalizada
        
        // Altera a ação do clique para redirecionar diretamente para a página de perfil
        linkCandidato.onclick = function(e) {
            e.preventDefault();
            window.location.href = 'perfil.html';
        };
        
        linkCandidato.classList.add('usuario-logado');
    }

    // --- VERIFICAÇÃO DO GESTOR RH ---
    const adminLogado = JSON.parse(localStorage.getItem('adminLogado'));
    const linkRh = document.getElementById('link-rh-header');

    // Se houver um administrador de RH autenticado e o link existir no menu
    if (adminLogado && linkRh) {
        const primeiroNomeAdmin = adminLogado.nome.split(' ')[0];
        linkRh.textContent = `Painel: ${primeiroNomeAdmin}`; // Personaliza o texto do menu para o gestor
        
        // Altera a ação do clique para redirecionar diretamente para o painel de RH
        linkRh.onclick = function(e) {
            e.preventDefault();
            window.location.href = 'rh.html';
        };
        
        linkRh.classList.add('usuario-logado');
    }
});


// ==========================================
// CARREGAR VAGAS RECENTES NA PÁGINA INICIAL
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    // Se o Gestor de RH estiver logado, esconde o botão/link do Banco Geral de Talentos da tela
    if (localStorage.getItem("adminLogado")) {
        const linkBancoTalentos = document.querySelector(".link-banco-talentos"); // Coloca aqui a classe ou ID exato do link no teu HTML
        if (linkBancoTalentos) {
            linkBancoTalentos.style.display = "none";
        }
    }
});

async function carregarVagasNaHome() {
    const gridVagas = document.querySelector(".grid-vagas");
    if (!gridVagas) return; // Se o container de vagas não existir na página, interrompe a execução

    try {
        const resposta = await fetch("/api/vagas"); // Requisição GET para buscar as vagas na API
        if (resposta.ok) {
            const vagas = await resposta.json();

            // Se não houver vagas cadastradas no banco de dados, exibe um aviso amigável
            if (vagas.length === 0) {
                gridVagas.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #666;">Nenhuma vaga ativa no momento.</p>`;
                return;
            }

            gridVagas.innerHTML = ""; // Limpa o container antes de inserir os novos elementos
            
            // Seleciona e exibe dinamicamente apenas as 3 primeiras vagas (mais recentes) cadastradas
            vagas.slice(0, 3).forEach(vaga => {
                const card = document.createElement("div");
                
                // Preenche o cartão HTML com as informações detalhadas da vaga vinda da base de dados e o novo botão centralizado
                card.innerHTML = `
                    <h3 class="vaga-titulo">${vaga.titulo}</h3>
                    <p class="vaga-info"><strong>Setor:</strong> ${vaga.setor}</p>
                    <p class="vaga-info">📍 ${vaga.localizacao || "Guarulhos / SP"}</p>
                    <p class="vaga-requisitos"><strong>Requisitos:</strong> ${vaga.requisitos || ""}</p>
                    <div class="vaga-acoes">
                     <button type="button" class="btn-candidatar" onclick="candidatarVaga(${vaga.id_vaga})">Candidatar-se</button>
                    </div>
                `;
                gridVagas.appendChild(card); // Adiciona o card gerado dentro da grelha na página
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

    // Se o candidato já estiver autenticado na plataforma, exibe um atalho inteligente de Envio Rápido em 1 clique
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

        // Configura o evento de clique no botão de envio rápido automatizado
        document.getElementById('btn-envio-rapido').addEventListener('click', async () => {
            try {
                const formData = new FormData();
                formData.append('nome', candidatoLogado.nome || '');
                formData.append('email', candidatoLogado.email || '');
                formData.append('telefone', candidatoLogado.telefone || '');
                formData.append('resumo', candidatoLogado.resumo || '');
                
                // Reaproveita o nome do ficheiro de currículo em PDF já guardado no perfil do utilizador
                const nomeCurriculo = candidatoLogado.curriculo_pdf || candidatoLogado.curriculoPdf || candidatoLogado.curriculo || 'curriculo_via_perfil.pdf';
                formData.append('curriculo_pdf_existente', nomeCurriculo);

                // Envia os dados do perfil atual diretamente para a API do Banco de Talentos via POST
                const resposta = await fetch('/api/banco-talentos', {
                    method: 'POST',
                    body: formData
                });

                const resultado = await resposta.json();

                if (resposta.ok) {
                    alert(resultado.mensagem);
                    fecharModalBancoTalentos(); // Fecha o modal após a conclusão bem-sucedida
                    window.location.reload();   // Atualiza a página
                } else {
                    alert(resultado.erro || 'Erro ao enviar o currículo.');
                }
            } catch (erro) {
                console.error('Erro de conexão:', erro);
                alert('Não foi possível conectar ao servidor.');
            }
        });
    }

    modal.style.display = 'flex'; // Exibe o modal na tela
    modal.classList.remove('oculto');
}

function fecharModalBancoTalentos() {
    const modal = document.getElementById('modal-banco-talentos');
    if (modal) {
        modal.style.display = 'none'; // Esconde o modal
        modal.classList.add('oculto');
    }
}


// ==========================================
// FORMULÁRIO DO BANCO DE TALENTOS (VISITANTES)
// ==========================================
// Adiciona o ouvinte para submissão manual de currículos por visitantes externos não logados
const formBancoTalentos = document.getElementById('form-banco-talentos');

if (formBancoTalentos) {
    formBancoTalentos.addEventListener('submit', async function(e) {
        e.preventDefault(); // Impede o recarregamento da página ao submeter o formulário

        const formData = new FormData();
        formData.append('nome', document.getElementById('talento-nome').value.trim());
        formData.append('email', document.getElementById('talento-email').value.trim());
        formData.append('telefone', document.getElementById('talento-telefone').value.trim());
        formData.append('resumo', document.getElementById('talento-resumo').value.trim());
        
        // Captura o ficheiro PDF de currículo anexado manualmente pelo visitante através do input type file
        const curriculoFile = document.getElementById('talento-curriculo').files[0];
        if (curriculoFile) {
            formData.append('curriculo', curriculoFile);
        }

        try {
            // Envia o formulário completo contendo os textos e o ficheiro binário para a API do backend
            const resposta = await fetch('/api/banco-talentos', {
                method: 'POST',
                body: formData
            });

            const resultado = await resposta.json();

            // Se o envio for processado com sucesso pelo servidor
            if (resposta.ok) {
                alert(resultado.mensagem);
                formBancoTalentos.reset();        // Limpa os campos preenchidos do formulário
                fecharModalBancoTalentos();        // Fecha a janela modal de talentos
            } else {
                alert(resultado.erro || 'Erro ao enviar o currículo.');
            }
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            alert('Não foi possível conectar ao servidor para enviar o currículo.');
        }
    });
}

// ==========================================
// FUNÇÃO DE CANDIDATURA À VAGA (CORRIGIDA)
// ==========================================
async function candidatarVaga(idVaga) {
    // Se por acaso o ID vier vazio, tenta obtê-lo do contexto do botão clicado
    if (!idVaga) {
        console.error("ID da vaga não foi fornecido.");
        alert("Erro: ID da vaga não identificado.");
        return;
    }

    const candidatoStr = localStorage.getItem('candidatoLogado');

    if (!candidatoStr) {
        alert('Você precisa estar logado para se candidatar a uma vaga.');
        abrirModalCandidato(); // Abre o modal de login automaticamente
        return;
    }

    let candidato;
    try {
        candidato = JSON.parse(candidatoStr);
    } catch (e) {
        alert('Erro nos dados do utilizador. Faça login novamente.');
        localStorage.removeItem('candidatoLogado');
        return;
    }

    const idCandidatoReal = candidato.id_candidato || candidato.id || candidato.usuario_id;

    if (!idCandidatoReal) {
        alert('ID do candidato não encontrado. Por favor, faça login novamente na sua conta.');
        localStorage.removeItem('candidatoLogado');
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
            alert(resultado.mensagem);
            window.location.href = 'perfil.html';
        } else {
            alert(resultado.erro || 'Erro ao efetuar a candidatura.');
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
}
