// ==========================================
// FUNÇÃO GLOBAL DE TOAST NOTIFICATIONS (Atualizada para não empilhar)
// ==========================================
function mostrarToast(mensagem, tipo = 'erro') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    } else {
        container.innerHTML = ''; // Limpa toasts anteriores para nunca misturar verde e vermelho
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
// FUNÇÕES DE CONTROLE DE MODAIS (ABRIR E FECHAR)
// ==========================================
function abrirModalCandidato() {
    document.getElementById('modal-candidato').style.display = 'flex';
}

function fecharModalCandidato() {
    document.getElementById('modal-candidato').style.display = 'none';
}

function abrirModalRH() {
    document.getElementById('modal-rh').style.display = 'flex';
}

function fecharModalRH() {
    document.getElementById('modal-rh').style.display = 'none';
}

function abrirModalRecuperar(event) {
    event.preventDefault();
    document.getElementById('modal-recuperar').style.display = 'flex';
}

function fecharModalRecuperar() {
    document.getElementById('modal-recuperar').style.display = 'none';
}


// ==========================================
// ALTERNÂNCIA DE ABAS NO MODAL DE CANDIDATO
// ==========================================
function mudarAbaCand(tipo) {
    const btnEntrar = document.getElementById('aba-cand-entrar');
    const btnCadastrar = document.getElementById('aba-cand-cadastrar');
    const formLogin = document.getElementById('form-login-candidato');
    const formCadastro = document.getElementById('form-cadastro-candidato');

    if (tipo === 'login') {
        btnEntrar.style.background = 'white';
        btnEntrar.style.color = '#7A0000';
        btnCadastrar.style.background = 'transparent';
        btnCadastrar.style.color = '#555';
        formLogin.style.display = 'block';
        formCadastro.style.display = 'none';
    } else {
        btnCadastrar.style.background = 'white';
        btnCadastrar.style.color = '#7A0000';
        btnEntrar.style.background = 'transparent';
        btnEntrar.style.color = '#555';
        formCadastro.style.display = 'block';
        formLogin.style.display = 'none';
    }
}


// ==========================================
// FORMULÁRIO DE CADASTRO DE CANDIDATO
// ==========================================
document.getElementById('form-cadastro-candidato').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const dadosCandidato = {
        nome: document.getElementById('nome-cad-cand').value,
        email: document.getElementById('email-cad-cand').value,
        senha: document.getElementById('senha-cad-cand').value
    };

    try {
        const resposta = await fetch('/api/candidatos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCandidato)
        });
        const resultado = await resposta.json();

        if (resposta.ok) {
            mostrarToast(resultado.mensagem, 'sucesso');
            document.getElementById('form-cadastro-candidato').reset();
            mudarAbaCand('login');
        } else {
            mostrarToast(resultado.erro || 'Erro ao cadastrar candidato.', 'erro');
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        mostrarToast('Não foi possível conectar ao servidor backend.', 'erro');
    }
});


// ==========================================
// FORMULÁRIO DE LOGIN DE CANDIDATO
// ==========================================
document.getElementById('form-login-candidato').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const dadosLogin = {
        email: document.getElementById('email-login-cand').value,
        senha: document.getElementById('senha-login-cand').value
    };

    try {
        const resposta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosLogin)
        });
        const resultado = await resposta.json();

        if (resposta.ok) {
            localStorage.removeItem('adminLogado');
            localStorage.setItem('candidatoLogado', JSON.stringify(resultado.candidato));
            window.location.href = 'perfil.html';
        } else {
            mostrarToast(resultado.erro || 'E-mail ou senha incorretos.', 'erro');
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        mostrarToast('Não foi possível conectar ao servidor backend.', 'erro');
    }
});


// ==========================================
// VALIDAÇÃO E LOGIN DO GESTOR RH
// ==========================================
const formLoginRhModal = document.getElementById("form-login-rh-modal");

if (formLoginRhModal) {
    formLoginRhModal.addEventListener("submit", (e) => {
        e.preventDefault();

        const emailInput = document.getElementById("email-rh-modal").value.trim();
        const senhaInput = document.getElementById("senha-rh-modal").value.trim();

        if (emailInput === "rh@metroform.com" && senhaInput === "123456") {
            localStorage.removeItem('candidatoLogado');
            
            const dadosAdmin = {
                nome: "Gestor RH",
                email: emailInput
            };
            localStorage.setItem('adminLogado', JSON.stringify(dadosAdmin));
            window.location.href = 'rh.html';
        } else {
            mostrarToast("E-mail ou senha incorretos!", 'erro');
        }
    });
}


// ==========================================
// RECUPERAÇÃO DE SENHA
// ==========================================
const formModalRecuperar = document.getElementById('form-modal-recuperar');
if (formModalRecuperar) {
    formModalRecuperar.addEventListener('submit', async function(e) {
        e.preventDefault(); // Evita o recarregamento padrão
        
        const email = document.getElementById('email-recuperar').value.trim();
        const novaSenhaInput = document.getElementById('nova-senha-recuperar');
        const novaSenha = novaSenhaInput ? novaSenhaInput.value.trim() : '';

        if (!email || !novaSenha) {
            mostrarToast('Preencha o e-mail e a nova senha.', 'erro');
            return;
        }

        // Validação de tamanho mínimo (ex: pelo menos 15 caracteres)
        if (novaSenha.length < 15) {
            mostrarToast('A nova senha deve ter pelo menos 15 caracteres.', 'erro');
            return;
        }

        try {
            // Envia solicitação de recuperação para a API do backend
            const resposta = await fetch('/api/recuperar-senha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, novaSenha })
            });
            const resultado = await resposta.json();
            
            if (resposta.ok) {
                mostrarToast(resultado.mensagem || 'Senha redefinida com sucesso!', 'sucesso'); // Toast verde elegante
                fecharModalRecuperar(); // Fecha o modal automaticamente
                formModalRecuperar.reset(); // Limpa os campos do formulário
            } else {
                mostrarToast(resultado.erro || 'Erro ao redefinir senha.', 'erro'); // Toast vermelho de erro
            }
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            mostrarToast('Não foi possível conectar ao servidor.', 'erro');
        }
    });
}


// ==========================================
// LOGOUT GERAL DO SISTEMA
// ==========================================
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
    const candidatoLogado = JSON.parse(localStorage.getItem('candidatoLogado'));
    const linkCandidato = document.getElementById('link-candidato-header');

    if (candidatoLogado && linkCandidato) {
        const primeiroNome = candidatoLogado.nome.split(' ')[0]; 
        linkCandidato.textContent = `Olá, ${primeiroNome}`; 
        
        linkCandidato.onclick = function(e) {
            e.preventDefault();
            window.location.href = 'perfil.html';
        };
        
        linkCandidato.classList.add('usuario-logado');
    }

    const adminLogado = JSON.parse(localStorage.getItem('adminLogado'));
    const linkRh = document.getElementById('link-rh-header');

    if (adminLogado && linkRh) {
        const primeiroNomeAdmin = adminLogado.nome.split(' ')[0];
        linkRh.textContent = `Painel: ${primeiroNomeAdmin}`; 
        
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
    if (localStorage.getItem("adminLogado")) {
        const linkBancoTalentos = document.querySelector(".link-banco-talentos"); 
        if (linkBancoTalentos) {
            linkBancoTalentos.style.display = "none";
        }
    }

    carregarVagasNaHome();
});

async function carregarVagasNaHome() {
    const gridVagas = document.querySelector(".grid-vagas");
    if (!gridVagas) return;

    try {
        const resposta = await fetch("/api/vagas");
        if (resposta.ok) {
            const vagas = await resposta.json();

            if (vagas.length === 0) {
                gridVagas.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #666;">Nenhuma vaga ativa no momento.</p>`;
                return;
            }

            gridVagas.innerHTML = "";
            
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
                gridVagas.appendChild(card);
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar vagas na home:", erro);
    }
}

// ==========================================
// BANCO GERAL DE TALENTOS (MODAL COM SEGURANÇA E 1 CLIQUE)
// ==========================================
function abrirModalBancoTalentos() {
    const modal = document.getElementById('modal-banco-talentos');
    if (!modal) return;

    const candidatoLogado = JSON.parse(localStorage.getItem('candidatoLogado'));
    const conteudoModal = modal.querySelector('.modal-box');

    // 1. SE NÃO ESTIVER LOGADO: Bloqueia, avisa com Toast e abre o modal de login/cadastro
    if (!candidatoLogado) {
        mostrarToast('Você precisa estar cadastrado e logado para enviar o currículo ao Banco de Talentos.', 'erro');
        abrirModalCandidato(); // Abre a área do candidato para entrar ou criar conta
        return;
    }

    // 2. SE ESTIVER LOGADO: Renderiza o modal de 1 clique personalizado com o nome
    conteudoModal.innerHTML = `
        <button type="button" id="btn-fechar-talentos" class="modal-close">&times;</button>
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

    // Botão X de fechar funcional
    document.getElementById('btn-fechar-talentos').addEventListener('click', fecharModalBancoTalentos);

    // Evento de clique protegido contra duplicações (envio único)
    document.getElementById('btn-envio-rapido').addEventListener('click', async function() {
        const botaoEnvio = this;
        
        botaoEnvio.disabled = true;
        botaoEnvio.style.opacity = '0.7';
        botaoEnvio.style.cursor = 'not-allowed';
        botaoEnvio.innerText = 'A enviar perfil...';

        try {
            const formData = new FormData();
            formData.append('nome', candidatoLogado.nome || '');
            formData.append('email', candidatoLogado.email || '');
            formData.append('telefone', candidatoLogado.telefone || '');
            formData.append('resumo', candidatoLogado.resumo || '');
            
            const nomeCurriculo = candidatoLogado.curriculo_pdf || candidatoLogado.curriculoPdf || candidatoLogado.curriculo || 'curriculo_via_perfil.pdf';
            formData.append('curriculo_pdf_existente', nomeCurriculo);

            const resposta = await fetch('/api/banco-talentos', {
                method: 'POST',
                body: formData
            });

            const resultado = await resposta.json();

            if (resposta.ok) {
                mostrarToast(resultado.mensagem, 'sucesso');
                fecharModalBancoTalentos();
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                mostrarToast(resultado.erro || 'Erro ao enviar o currículo.', 'erro');
                botaoEnvio.disabled = false;
                botaoEnvio.style.opacity = '1';
                botaoEnvio.innerText = '🚀 Enviar Meu Perfil Atual com 1 Clique';
            }
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            mostrarToast('Não foi possível conectar ao servidor.', 'erro');
            botaoEnvio.disabled = false;
            botaoEnvio.style.opacity = '1';
            botaoEnvio.innerText = '🚀 Enviar Meu Perfil Atual com 1 Clique';
        }
    });

    modal.style.display = 'flex';
    modal.classList.remove('oculto');
}

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

if (formBancoTalentos) {
    formBancoTalentos.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nome', document.getElementById('talento-nome').value.trim());
        formData.append('email', document.getElementById('talento-email').value.trim());
        formData.append('telefone', document.getElementById('talento-telefone').value.trim());
        formData.append('resumo', document.getElementById('talento-resumo').value.trim());
        
        const curriculoFile = document.getElementById('talento-curriculo').files[0];
        if (curriculoFile) {
            formData.append('curriculo', curriculoFile);
        }

        try {
            const resposta = await fetch('/api/banco-talentos', {
                method: 'POST',
                body: formData
            });

            const resultado = await resposta.json();

            if (resposta.ok) {
                mostrarToast(resultado.mensagem, 'sucesso');
                formBancoTalentos.reset();
                fecharModalBancoTalentos();
            } else {
                mostrarToast(resultado.erro || 'Erro ao enviar o currículo.', 'erro');
            }
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            mostrarToast('Não foi possível conectar ao servidor para enviar o currículo.', 'erro');
        }
    });
}


// ==========================================
// FUNÇÃO DE CANDIDATURA À VAGA
// ==========================================
async function candidatarVaga(idVaga) {
    if (!idVaga) {
        console.error("ID da vaga não foi fornecido.");
        mostrarToast("Erro: ID da vaga não identificado.", 'erro');
        return;
    }

    const candidatoStr = localStorage.getItem('candidatoLogado');

    if (!candidatoStr) {
        mostrarToast('Você precisa estar logado para se candidatar a uma vaga.', 'erro');
        abrirModalCandidato();
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
            mostrarToast(resultado.mensagem, 'sucesso');
            setTimeout(() => {
                window.location.href = 'perfil.html';
            }, 1000);
        } else {
            mostrarToast(resultado.erro || 'Erro ao efetuar a candidatura.', 'erro');
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        mostrarToast('Não foi possível conectar ao servidor.', 'erro');
    }
}


// ==========================================
// CONTADOR DE CARACTERES DO RESUMO PROFISSIONAL
// ==========================================
function atualizarContadorResumo(textarea) {
    const max = textarea.getAttribute('maxlength');
    const atual = textarea.value.length;
    const restantes = max - atual;
    
    const contadorEl = document.getElementById('contador-resumo');
    if (contadorEl) {
        contadorEl.innerText = `${restantes} caracteres restantes`;
        
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
    let valor = input.value.replace(/\D/g, '');
    
    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }

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

// ==========================================
// FORÇAR A PÁGINA A INICIAR SEMPRE NO TOPO
// ==========================================

// Desativa a restauração automática de rolagem do navegador ao atualizar
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Garante que ao carregar a página o scroll vai direto para o topo (0, 0)
window.addEventListener('load', function() {
    window.scrollTo(0, 0);
});