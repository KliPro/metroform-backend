const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'metroform_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados MySQL:', err);
        return;
    }
    console.log('✅ Conectado ao banco de dados MySQL com sucesso!');
});

// 1. Cadastro de Candidato
app.post('/api/candidatos', (req, res) => {
    const { nome, email, senha } = req.body;
    const query = 'INSERT INTO candidato (nome, email, senha) VALUES (?, ?, ?)';

    db.query(query, [nome, email, senha], (err, resultado) => {
        if (err) {
            console.error('Erro ao inserir candidato:', err);
            return res.status(500).json({ erro: 'Erro ao cadastrar candidato: ' + err.message });
        }
        res.status(201).json({ mensagem: 'Candidato cadastrado com sucesso!' });
    });
});

// 2. Login de Candidato
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    const query = 'SELECT * FROM candidato WHERE email = ? AND senha = ?';

    db.query(query, [email, senha], (err, resultados) => {
        if (err) {
            console.error('Erro no login:', err);
            return res.status(500).json({ erro: 'Erro interno no servidor.' });
        }

        if (resultados.length > 0) {
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
            res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }
    });
});

// 3. Listar Vagas
app.get('/api/vagas', (req, res) => {
    const query = 'SELECT * FROM vaga ORDER BY id_vaga DESC';
    db.query(query, (err, resultados) => {
        if (err) {
            console.error('Erro ao buscar vagas:', err);
            return res.status(500).json({ erro: 'Erro ao carregar as vagas.' });
        }
        res.status(200).json(resultados);
    });
});

// 4. Cadastrar Vaga (RH)
app.post('/api/vagas', (req, res) => {
    const { titulo, setor, localizacao, requisitos } = req.body;
    const query = `INSERT INTO vaga (titulo, setor, localizacao, requisitos) VALUES (?, ?, ?, ?)`;

    db.query(query, [titulo, setor, localizacao || 'Guarulhos / SP', requisitos || ''], (err, resultado) => {
        if (err) {
            console.error('Erro ao cadastrar vaga:', err);
            return res.status(500).json({ erro: 'Erro ao cadastrar a vaga: ' + err.message });
        }
        res.status(201).json({ mensagem: 'Vaga cadastrada com sucesso!' });
    });
});

// 5. Excluir Vaga (RH)
app.delete('/api/vagas/:id', (req, res) => {
    const idVaga = req.params.id;
    
    db.query('DELETE FROM candidatura WHERE id_vaga = ?', [idVaga], (errCand) => {
        if (errCand) console.error('Aviso ao limpar candidaturas da vaga:', errCand);

        db.query('DELETE FROM vaga WHERE id_vaga = ?', [idVaga], (err, resultado) => {
            if (err) {
                console.error('Erro ao excluir vaga:', err);
                return res.status(500).json({ erro: 'Erro ao excluir a vaga: ' + err.message });
            }
            res.status(200).json({ mensagem: 'Vaga excluída com sucesso!' });
        });
    });
});

// 6. Banco de Talentos (Listar, Inserir e Excluir)
app.get('/api/banco-talentos', (req, res) => {
    db.query('SELECT * FROM banco_talentos ORDER BY data_envio DESC', (err, resultados) => {
        if (err) return res.status(500).json({ erro: 'Erro ao carregar banco de talentos.' });
        res.status(200).json({ talentos: resultados });
    });
});

app.post('/api/banco-talentos', upload.single('curriculo'), (req, res) => {
    const { nome, email, telefone, resumo, curriculo_pdf_existente } = req.body;
    const nomeFinal = nome || 'Candidato Metroform';
    const emailFinal = email || 'candidato@exemplo.com';
    const curriculoPdf = req.file ? req.file.filename : (curriculo_pdf_existente || 'curriculo_via_perfil.pdf');

    db.query('SELECT id_talento FROM banco_talentos WHERE email = ?', [emailFinal], (errCheck, rows) => {
        if (errCheck) {
            console.error('Erro ao verificar e-mail:', errCheck);
            return res.status(500).json({ erro: 'Erro no servidor ao processar currículo.' });
        }

        if (rows.length > 0) {
            const queryUpdate = `UPDATE banco_talentos SET nome = ?, telefone = ?, resumo = ?, curriculo_pdf = ?, data_envio = NOW() WHERE email = ?`;
            db.query(queryUpdate, [nomeFinal, telefone || '', resumo || '', curriculoPdf, emailFinal], (errUp) => {
                if (errUp) return res.status(500).json({ erro: 'Erro ao atualizar currículo.' });
                return res.status(200).json({ mensagem: 'Currículo atualizado com sucesso no Banco de Talentos!' });
            });
        } else {
            const queryInsert = `INSERT INTO banco_talentos (nome, email, telefone, resumo, curriculo_pdf, data_envio) VALUES (?, ?, ?, ?, ?, NOW())`;
            db.query(queryInsert, [nomeFinal, emailFinal, telefone || '', resumo || '', curriculoPdf], (errIns) => {
                if (errIns) return res.status(500).json({ erro: 'Erro ao gravar currículo.' });
                return res.status(201).json({ mensagem: 'Currículo enviado com sucesso para o Banco Geral de Talentos!' });
            });
        }
    });
});

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

// 7. Candidaturas
app.get('/api/candidaturas/:id_candidato', (req, res) => {
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

app.post('/api/candidaturas', (req, res) => {
    const { id_candidato, id_vaga } = req.body;
    if (!id_candidato || !id_vaga) {
        return res.status(400).json({ erro: 'Dados insuficientes para efetuar a candidatura.' });
    }

    const query = `INSERT INTO candidatura (id_candidato, id_vaga, data_candidatura, status_candidatura) VALUES (?, ?, NOW(), 'Em Análise')`;

    db.query(query, [id_candidato, id_vaga], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ erro: 'Você já se candidatou a esta vaga anteriormente.' });
            }
            return res.status(500).json({ erro: 'Erro ao efetuar candidatura: ' + err.message });
        }
        res.status(201).json({ mensagem: 'Candidatura efetuada com sucesso!' });
    });
});

// 8. Atualizar Perfil do Candidato
app.put('/api/candidatos/:id', upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'curriculo', maxCount: 1 }
]), (req, res) => {
    const idCandidato = req.params.id;
    const { nome, telefone, resumo, formacao, cidade } = req.body;

    const foto = req.files && req.files['foto'] ? req.files['foto'][0].filename : null;
    const curriculo = req.files && req.files['curriculo'] ? req.files['curriculo'][0].filename : null;

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

// 9. Gestão de Candidaturas para o RH
app.get('/api/candidaturas-rh', (req, res) => {
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

app.put('/api/candidaturas/:id/status', (req, res) => {
    db.query('UPDATE candidatura SET status_candidatura = ? WHERE id_candidatura = ?', [req.body.status, req.params.id], (err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao atualizar status.' });
        res.status(200).json({ mensagem: 'Status atualizado com sucesso!' });
    });
});

// 10. Estatísticas para o Painel do RH
app.get('/api/estatisticas-rh', (req, res) => {
    const queryVagas = 'SELECT COUNT(*) as total FROM vaga';
    const queryCandidaturas = 'SELECT COUNT(*) as total FROM candidatura';

    db.query(queryVagas, (errVagas, resVagas) => {
        if (errVagas) return res.status(500).json({ erro: 'Erro ao contar vagas.' });

        db.query(queryCandidaturas, (errCand, resCand) => {
            if (errCand) return res.status(500).json({ erro: 'Erro ao contar candidaturas.' });

            res.status(200).json({
                vagasAtivas: resVagas[0].total,
                candidatosInscritos: resCand[0].total,
                matchesAltos: Math.floor(resCand[0].total * 0.7)
            });
        });
    });
});

// 11. Login e Recuperação RH
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
    db.query('SELECT * FROM administrador_rh WHERE email = ? AND senha = ?', [email, senha], (err, resultados) => {
        if (err) return res.status(500).json({ erro: 'Erro interno.' });
        if (resultados.length > 0) {
            res.status(200).json({ mensagem: 'Login do RH efetuado com sucesso!', admin: resultados[0] });
        } else {
            res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }
    });
});

app.listen(3000, () => {
    console.log('🚀 Servidor a correr na porta 3000 (http://localhost:3000)');
});