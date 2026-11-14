// Importa o framework Express para a criação e gestão de servidores e rotas HTTP
const express = require('express');
// Importa a biblioteca mysql2 para permitir a conexão e execução de queries na base de dados MySQL
const mysql = require('mysql2');
// Importa o middleware CORS para permitir requisições de diferentes origens (front-end e back-end)
const cors = require('cors');
// Importa a biblioteca Multer para gerenciar o upload de ficheiros multipart/form-data
const multer = require('multer');
// Importa o módulo nativo path para o tratamento e normalização de caminhos de diretórios e ficheiros
const path = require('path');

// Inicializa a aplicação Express e atribui à constante app
const app = express();

// Configura o Express para interpretar requisições recebidas com corpos em formato JSON
app.use(express.json());
// Ativa o middleware CORS em todas as rotas da aplicação
app.use(cors());

// Configura uma pasta estática ('/uploads') para servir publicamente os ficheiros guardados na pasta local 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configura o armazenamento em disco utilizando o Multer para definir onde e como os ficheiros serão guardados
const storage = multer.diskStorage({
    // Define o diretório de destino onde os ficheiros carregados serão guardados localmente
    destination: './uploads/',
    // Define a regra para renomear o ficheiro recebido para evitar conflitos de nomes iguais
    filename: (req, file, cb) => {
        // Gera um nome único combinando o timestamp atual com o nome original do ficheiro
        cb(null, Date.now() + '-' + file.originalname);
    }
});
// Inicializa o middleware do multer com a configuração de armazenamento definida
const upload = multer({ storage: storage });

// Cria a conexão com a base de dados MySQL (suportando variáveis de ambiente para a nuvem ou valores locais do XAMPP)
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'metroform_db',
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false
    }
});

// Estabelece a conexão efetiva com a base de dados MySQL
db.connect((err) => {
    // Verifica se ocorreu algum erro crítico ao tentar ligar à base de dados
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados MySQL:', err.message);
        console.error('Código do erro:', err.code);
        return; // Interrompe a execução caso a ligação falhe
    }
    // Confirma no terminal que a ligação foi bem-sucedida
    console.log('✅ Conectado ao banco de dados MySQL com sucesso!');
});

// 1. Rota POST para o Cadastro de Candidato
app.post('/api/candidatos', (req, res) => {
    // Extrai o nome, email e senha do corpo da requisição HTTP (payload)
    const { nome, email, senha } = req.body;
    // Define a query SQL parametrizada para inserir um novo registo na tabela candidato
    const query = 'INSERT INTO candidato (nome, email, senha) VALUES (?, ?, ?)';

    // Executa a query de inserção na base de dados com os parâmetros fornecidos
    db.query(query, [nome, email, senha], (err, resultado) => {
        if (err) {
            console.error('Erro ao inserir candidato:', err);
            // Retorna o código de erro HTTP 500 informando falha no cadastro
            return res.status(500).json({ erro: 'Erro ao cadastrar candidato: ' + err.message });
        }
        // Retorna o código HTTP 201 (Created) com mensagem de sucesso
        res.status(201).json({ mensagem: 'Candidato cadastrado com sucesso!' });
    });
});

// 2. Rota POST para o Login de Candidato
app.post('/api/login', (req, res) => {
    // Extrai o email e a senha enviados pelo cliente no corpo da requisição
    const { email, senha } = req.body;
    // Define a query SQL para procurar um candidato com o email e senha correspondentes
    const query = 'SELECT * FROM candidato WHERE email = ? AND senha = ?';

    // Executa a consulta de autenticação na base de dados
    db.query(query, [email, senha], (err, resultados) => {
        if (err) {
            console.error('Erro no login:', err);
            return res.status(500).json({ erro: 'Erro interno no servidor.' });
        }

        // Se encontrar algum registo correspondente, significa que o login foi bem-sucedido
        if (resultados.length > 0) {
            // Retorna status HTTP 200 com os dados do candidato serializados
            res.status(200).json({ 
                mensagem: 'Login efetuado com sucesso!', 
                candidato: {
                    id: resultados[0].id_candidato,
                    id_candidato: resultados[0].id_candidato,
                    nome: resultados[0].nome,
                    email: resultados[0].email,
                    telefone: resultados[0].telefone,
                    resumo: resultados[0].resumo,
                    formacao: resultados[0].formacao,
                    cidade: resultados[0].cidade,
                    foto_perfil: resultados[0].foto_perfil,
                    curriculo_pdf: resultados[0].curriculo_pdf
                }
            });
        } else {
            // Se nenhum registo corresponder, retorna status HTTP 401 (Não autorizado)
            res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }
    });
});

// 3. Rota GET para Listar Vagas disponíveis
app.get('/api/vagas', (req, res) => {
    // Define a query SQL para selecionar todas as vagas ordenadas do ID mais recente para o mais antigo
    const query = 'SELECT * FROM vaga ORDER BY id_vaga DESC';
    // Executa a busca de vagas na base de dados
    db.query(query, (err, resultados) => {
        if (err) {
            console.error('Erro ao buscar vagas:', err);
            return res.status(500).json({ erro: 'Erro ao carregar as vagas.' });
        }
        // Retorna a lista de vagas encontrada com status HTTP 200
        res.status(200).json(resultados);
    });
});

// 4. Rota POST para Cadastrar Vaga (Perspetiva do RH)
app.post('/api/vagas', (req, res) => {
    // Extrai os campos da nova vaga do corpo da requisição
    const { titulo, setor, localizacao, requisitos } = req.body;
    // Define a query SQL para inserir os dados da nova vaga na tabela correspondente
    const query = `INSERT INTO vaga (titulo, setor, localizacao, requisitos) VALUES (?, ?, ?, ?)`;

    // Executa a inserção utilizando valores padrão caso a localização ou os requisitos venham vazios
    db.query(query, [titulo, setor, localizacao || 'Guarulhos / SP', requisitos || ''], (err, resultado) => {
        if (err) {
            console.error('Erro ao cadastrar vaga:', err);
            return res.status(500).json({ erro: 'Erro ao cadastrar a vaga: ' + err.message });
        }
        // Retorna status HTTP 201 confirmando o cadastro da vaga
        res.status(201).json({ mensagem: 'Vaga cadastrada com sucesso!' });
    });
});

// 5. Rota DELETE para Excluir Vaga (Perspetiva do RH)
app.delete('/api/vagas/:id', (req, res) => {
    // Obtém o ID da vaga através dos parâmetros da rota (URL)
    const idVaga = req.params.id;
    
    // Primeiro, apaga todas as candidaturas associadas a esta vaga para manter a integridade referencial
    db.query('DELETE FROM candidatura WHERE id_vaga = ?', [idVaga], (errCand) => {
        if (errCand) console.error('Aviso ao limpar candidaturas da vaga:', errCand);

        // Em seguida, executa a exclusão da própria vaga na tabela vaga
        db.query('DELETE FROM vaga WHERE id_vaga = ?', [idVaga], (err, resultado) => {
            if (err) {
                console.error('Erro ao excluir vaga:', err);
                return res.status(500).json({ erro: 'Erro ao excluir a vaga: ' + err.message });
            }
            // Retorna status HTTP 200 confirmando a remoção bem-sucedida
            res.status(200).json({ mensagem: 'Vaga excluída com sucesso!' });
        });
    });
});

// 6. Rotas para o Banco de Talentos (Listar, Inserir e Excluir)
app.get('/api/banco-talentos', (req, res) => {
    // Consulta todos os currículos no banco de talentos ordenados pela data de envio mais recente
    db.query('SELECT * FROM banco_talentos ORDER BY data_envio DESC', (err, resultados) => {
        if (err) return res.status(500).json({ erro: 'Erro ao carregar banco de talentos.' });
        res.status(200).json({ talentos: resultados });
    });
});

// Rota POST para adicionar ou atualizar currículo no banco de talentos (com upload de ficheiro PDF único)
app.post('/api/banco-talentos', upload.single('curriculo'), (req, res) => {
    const { nome, email, telefone, resumo, curriculo_pdf_existente } = req.body;
    const nomeFinal = nome || 'Candidato Metroform';
    const emailFinal = email || 'candidato@exemplo.com';
    // Define o nome do ficheiro PDF considerando o upload novo ou mantendo o existente
    const curriculoPdf = req.file ? req.file.filename : (curriculo_pdf_existente || 'curriculo_via_perfil.pdf');

    // Verifica se já existe um registo com este e-mail no banco de talentos
    db.query('SELECT id_talento FROM banco_talentos WHERE email = ?', [emailFinal], (errCheck, rows) => {
        if (errCheck) {
            console.error('Erro ao verificar e-mail:', errCheck);
            return res.status(500).json({ erro: 'Erro no servidor ao processar currículo.' });
        }

        // Se já existir, atualiza os dados do talento existente
        if (rows.length > 0) {
            const queryUpdate = `UPDATE banco_talentos SET nome = ?, telefone = ?, resumo = ?, curriculo_pdf = ?, data_envio = NOW() WHERE email = ?`;
            db.query(queryUpdate, [nomeFinal, telefone || '', resumo || '', curriculoPdf, emailFinal], (errUp) => {
                if (errUp) return res.status(500).json({ erro: 'Erro ao atualizar currículo.' });
                return res.status(200).json({ mensagem: 'Currículo atualizado com sucesso no Banco de Talentos!' });
            });
        } else {
            // Caso contrário, insere um novo registo no banco de talentos
            const queryInsert = `INSERT INTO banco_talentos (nome, email, telefone, resumo, curriculo_pdf, data_envio) VALUES (?, ?, ?, ?, ?, NOW())`;
            db.query(queryInsert, [nomeFinal, emailFinal, telefone || '', resumo || '', curriculoPdf], (errIns) => {
                if (errIns) return res.status(500).json({ erro: 'Erro ao gravar currículo.' });
                return res.status(201).json({ mensagem: 'Currículo enviado com sucesso para o Banco Geral de Talentos!' });
            });
        }
    });
});

// Rota DELETE para remover um currículo específico do banco de talentos pelo ID
app.delete('/api/banco-talentos/:id', (req, res) => {
    const idTalento = req.params.id;
    
    db.query('DELETE FROM banco_talentos WHERE id_talento = ?', [idTalento], (err, resultado) => {
        if (err) {
            console.error('Erro ao excluir talento:', err);
            return res.status(500).json({ erro: 'Erro ao excluir currículo do banco de talentos.' });
        }
        res.status(200).json({ mensagem: 'Currículo excluído com sucesso do Banco de Talentos!' });
    });
});

// 7. Rotas para Gestão de Candidaturas
app.get('/api/candidaturas/:id_candidato', (req, res) => {
    // Define a query SQL fazendo JOIN entre candidaturas e vagas para um candidato específico
    const query = `
        SELECT c.id_candidatura, c.data_candidatura, c.status_candidatura, v.titulo, v.setor, v.localizacao 
        FROM candidatura c
        JOIN vaga v ON c.id_vaga = v.id_vaga
        WHERE c.id_candidato = ?
    `;
    db.query(query, [req.params.id_candidato], (err, resultados) => {
        if (err) return res.status(500).json({ erro: 'Erro ao carregar as candidaturas.' });
        res.status(200).json(resultados);
    });
});

// Rota POST para submeter uma nova candidatura a uma vaga
app.post('/api/candidaturas', (req, res) => {
    const { id_candidato, id_vaga } = req.body;
    if (!id_candidato || !id_vaga) {
        return res.status(400).json({ erro: 'Dados insuficientes para efetuar a candidatura.' });
    }

    // Insere a candidatura definindo a data atual (NOW()) e o status inicial como 'Em Análise'
    const query = `INSERT INTO candidatura (id_candidato, id_vaga, data_candidatura, status_candidatura) VALUES (?, ?, NOW(), 'Em Análise')`;

    db.query(query, [id_candidato, id_vaga], (err) => {
        if (err) {
            // Trata o erro de duplicado caso o candidato já se tenha candidatado à mesma vaga
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ erro: 'Você já se candidatou a esta vaga anteriormente.' });
            }
            return res.status(500).json({ erro: 'Erro ao efetuar candidatura: ' + err.message });
        }
        res.status(201).json({ mensagem: 'Candidatura efetuada com sucesso!' });
    });
});

// 8. Rota PUT para Atualizar Perfil do Candidato (com suporte a upload opcional de foto e currículo)
app.put('/api/candidatos/:id', upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'curriculo', maxCount: 1 }
]), (req, res) => {
    const idCandidato = req.params.id;
    const { nome, telefone, resumo, formacao, cidade } = req.body;

    // Extrai os nomes dos ficheiros carregados, caso existam na requisição
    const foto = req.files && req.files['foto'] ? req.files['foto'][0].filename : null;
    const curriculo = req.files && req.files['curriculo'] ? req.files['curriculo'][0].filename : null;

    // Constrói dinamicamente a query de atualização SQL baseada nos campos enviados
    let query = `UPDATE candidato SET nome = ?, telefone = ?, resumo = ?, formacao = ?, cidade = ?`;
    let params = [nome || '', telefone || '', resumo || '', formacao || '', cidade || ''];

    if (foto) {
        query += `, foto_perfil = ?`;
        params.push(foto);
    }
    if (curriculo) {
        query += `, curriculo_pdf = ?`;
        params.push(curriculo);
    }

    query += ` WHERE id_candidato = ?`;
    params.push(idCandidato);

    db.query(query, params, (err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao atualizar perfil: ' + err.message });
        res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!' });
    });
});

// 9. Rotas de Gestão de Candidaturas para o Painel do RH
app.get('/api/candidaturas-rh', (req, res) => {
    // Consulta complexa juntando tabelas de candidaturas, candidatos e vagas para visualização global do gestor
    const query = `
        SELECT c.id_candidatura, c.data_candidatura, c.status_candidatura,
               cand.id_candidato, cand.nome as candidato_nome, cand.email as candidato_email, 
               cand.telefone as candidato_telefone, cand.resumo as candidato_resumo,
               cand.cidade as candidato_cidade, cand.formacao as candidato_formacao,
               cand.curriculo_pdf, v.titulo as vaga_titulo, v.setor as vaga_setor
        FROM candidatura c
        JOIN candidato cand ON c.id_candidato = cand.id_candidato
        JOIN vaga v ON c.id_vaga = v.id_vaga
        ORDER BY c.data_candidatura DESC
    `;
    db.query(query, (err, resultados) => {
        if (err) return res.status(500).json({ erro: 'Erro ao carregar candidaturas do RH.' });
        res.status(200).json(resultados);
    });
});

// Rota PUT para atualizar o status de uma candidatura específica (ex: Aprovado, Reprovado)
app.put('/api/candidaturas/:id/status', (req, res) => {
    db.query('UPDATE candidatura SET status_candidatura = ? WHERE id_candidatura = ?', [req.body.status, req.params.id], (err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao atualizar status.' });
        res.status(200).json({ mensagem: 'Status atualizado com sucesso!' });
    });
});

// 10. Rota GET para Estatísticas do Painel do RH
app.get('/api/estatisticas-rh', (req, res) => {
    const queryVagas = 'SELECT COUNT(*) as total FROM vaga';
    const queryCandidaturas = 'SELECT COUNT(*) as total FROM candidatura';

    // Executa a contagem total de vagas cadastradas
    db.query(queryVagas, (errVagas, resVagas) => {
        if (errVagas) return res.status(500).json({ erro: 'Erro ao contar vagas.' });

        // Em seguida, executa a contagem total de candidaturas submetidas
        db.query(queryCandidaturas, (errCand, resCand) => {
            if (errCand) return res.status(500).json({ erro: 'Erro ao contar candidaturas.' });

            // Retorna um objeto JSON consolidadando as métricas estatísticas para o painel
            res.status(200).json({
                vagasAtivas: resVagas[0].total,
                candidatosInscritos: resCand[0].total,
                matchesAltos: Math.floor(resCand[0].total * 0.7)
            });
        });
    });
});

// 11. Rotas de Autenticação e Gestão de Contas (Recuperação e Login do RH)
app.post('/api/recuperar-senha', (req, res) => {
    const { email, novaSenha } = req.body;
    db.query('UPDATE candidato SET senha = ? WHERE email = ?', [novaSenha, email], (err, result) => {
        if (err || result.affectedRows === 0) {
            return res.status(404).json({ erro: 'E-mail não encontrado.' });
        }
        res.json({ mensagem: 'Senha redefinida com sucesso!' });
    });
});

app.post('/api/login-rh', (req, res) => {
    const { email, senha } = req.body;
    // Consulta a tabela de administradores de RH para autenticação credenciada
    db.query('SELECT * FROM administrador_rh WHERE email = ? AND senha = ?', [email, senha], (err, resultados) => {
        if (err) return res.status(500).json({ erro: 'Erro interno.' });
        if (resultados.length > 0) {
            res.status(200).json({ mensagem: 'Login do RH efetuado com sucesso!', admin: resultados[0] });
        } else {
            res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }
    });
});

// --- CONFIGURAÇÃO DO FRONTEND ESTÁTICO ---
// Diz ao Express para servir todos os ficheiros estáticos da raiz
app.use(express.static(__dirname));

// Rota explícita para abrir o index.html na raiz (evita o "Cannot GET /")
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicia o servidor HTTP por último
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor a correr na porta ${PORT}`);
});