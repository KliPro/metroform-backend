// 1. IMPORTAÇÃO DE DEPENDÊNCIAS
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// 2. INICIALIZAÇÃO DA APLICAÇÃO
const app = express();

app.use(express.json());
app.use(cors());

// Configuração para servir os ficheiros enviados (uploads de fotos e currículos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do armazenamento de ficheiros via Multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });


// 3. CONFIGURAÇÃO DA CONEXÃO COM O BANCO DE DADOS
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'metroform_db'
});


// 4. TESTE DA CONEXÃO COM O MYSQL
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados MySQL:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL com sucesso!');
});


// 5. ROTAS DA API

// Cadastro de Candidato
app.post('/api/candidatos', (req, res) => {
    const { nome, email, senha } = req.body;
    const query = 'INSERT INTO Candidato (nome, email, senha) VALUES (?, ?, ?)';

    db.query(query, [nome, email, senha], (err, resultado) => {
        if (err) {
            console.error('Erro ao inserir candidato:', err);
            return res.status(500).json({ erro: 'Erro ao cadastrar candidato. Verifique se o e-mail já está em uso.' });
        }
        res.status(201).json({ mensagem: 'Candidato cadastrado com sucesso na base de dados!' });
    });
});

// Login de Candidato
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    const query = 'SELECT * FROM Candidato WHERE email = ? AND senha = ?';

    db.query(query, [email, senha], (err, resultados) => {
        if (err) {
            console.error('Erro ao tentar fazer login:', err);
            return res.status(500).json({ erro: 'Erro interno no servidor ao processar o login.' });
        }

        if (resultados.length > 0) {
            res.status(200).json({ 
                mensagem: 'Login efetuado com sucesso!', 
                candidato: {
                    id: resultados[0].id_candidato,
                    nome: resultados[0].nome,
                    email: resultados[0].email,
                    telefone: resultados[0].telefone,
                    resumo: resultados[0].resumo,
                    foto_perfil: resultados[0].foto_perfil,
                    curriculo_pdf: resultados[0].curriculo_pdf
                }
            });
        } else {
            res.status(401).json({ erro: 'E-mail ou senha incorretos. Tente novamente.' });
        }
    });
});

// Buscar Vagas Disponíveis
app.get('/api/vagas', (req, res) => {
    const query = 'SELECT * FROM Vaga';

    db.query(query, (err, resultados) => {
        if (err) {
            console.error('Erro ao buscar vagas:', err);
            return res.status(500).json({ erro: 'Erro ao carregar as vagas disponíveis.' });
        }
        res.status(200).json(resultados);
    });
});

// Buscar Candidaturas de um Candidato Específico
app.get('/api/candidaturas/:id_candidato', (req, res) => {
    const idCandidato = req.params.id_candidato;

    const query = `
        SELECT c.id_candidatura, c.data_candidatura, c.status_candidatura, 
               v.titulo, v.setor, v.localizacao 
        FROM Candidatura c
        JOIN Vaga v ON c.id_vaga = v.id_vaga
        WHERE c.id_candidato = ?
    `;

    db.query(query, [idCandidato], (err, resultados) => {
        if (err) {
            console.error('Erro ao buscar candidaturas:', err);
            return res.status(500).json({ erro: 'Erro ao carregar as candidaturas.' });
        }
        res.status(200).json(resultados);
    });
});

// Registar Nova Candidatura
app.post('/api/candidaturas', (req, res) => {
    const { id_candidato, id_vaga } = req.body;
    const query = `INSERT INTO Candidatura (id_candidato, id_vaga, data_candidatura, status_candidatura) VALUES (?, ?, NOW(), 'Em Análise')`;

    db.query(query, [id_candidato, id_vaga], (err, resultado) => {
        if (err) {
            console.error('Erro ao candidatar:', err);
            return res.status(500).json({ erro: 'Erro ao efetuar a candidatura. Verifique se já se candidatou a esta vaga.' });
        }
        res.status(201).json({ mensagem: 'Candidatura efetuada com sucesso!' });
    });
});

// Atualizar Dados e Ficheiros do Perfil (Foto e Currículo PDF)
app.put('/api/candidatos/:id', upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'curriculo', maxCount: 1 }
]), (req, res) => {
    const idCandidato = req.params.id;
    const { nome, telefone, resumo } = req.body;
    
    const foto = req.files['foto'] ? req.files['foto'][0].filename : null;
    const curriculo = req.files['curriculo'] ? req.files['curriculo'][0].filename : null;

    let query = `UPDATE Candidato SET nome = ?, telefone = ?, resumo = ?`;
    let params = [nome, telefone, resumo];

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

    db.query(query, params, (err, resultado) => {
        if (err) {
            console.error('Erro ao atualizar perfil:', err);
            return res.status(500).json({ erro: 'Erro ao atualizar os dados.' });
        }
        res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!' });
    });
});


// 6. INICIALIZAÇÃO DO SERVIDOR WEB
app.listen(3000, () => {
    console.log('Servidor a correr na porta 3000 (http://localhost:3000)');
});