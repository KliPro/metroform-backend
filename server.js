// 1. IMPORTAÇÃO DE DEPENDÊNCIAS
// Importa o framework Express para criar e gerenciar o servidor web e as rotas da API.
const express = require('express');

// Importa o pacote 'mysql2' para permitir que o Node.js converse com o banco de dados MySQL.
const mysql = require('mysql2');

// Importa o 'cors' para permitir que o front-end (o site HTML/JS) faça pedidos para este servidor sem bloqueios de segurança do navegador.
const cors = require('cors');


// 2. INICIALIZAÇÃO DA APLICAÇÃO
// Cria uma instância do Express para começarmos a configurar o servidor.
const app = express();

// Configura o servidor para entender dados enviados no formato JSON (necessário para receber dados de formulários do site).
app.use(express.json());

// Ativa o CORS no servidor.
app.use(cors());


// 3. CONFIGURAÇÃO DA CONEXÃO COM O BANCO DE DADOS
// Define os parâmetros de acesso ao MySQL que criamos no XAMPP.
const db = mysql.createConnection({
    host: 'localhost',      // Onde o banco está rodando (no seu próprio computador)
    user: 'root',           // Utilizador padrão do MySQL no XAMPP
    password: '',           // Palavra-passe (geralmente vazia no XAMPP padrão)
    database: 'metroform_db' // Nome da base de dados que criámos no phpMyAdmin
});


// 4. TESTE DA CONEXÃO COM O MYSQL
// Tenta efetivamente conectar ao banco de dados usando as configurações acima.
db.connect((err) => {
    // Se acontecer algum erro na ligação (ex: banco apagado ou nome errado)
    if (err) {
        console.error('Erro ao conectar ao banco de dados MySQL:', err);
        return;
    }
    // Se der tudo certo, exibe esta mensagem de sucesso no terminal
    console.log('Conectado ao banco de dados MySQL com sucesso!');
});


// 5. INICIALIZAÇÃO DO SERVIDOR WEB
// Define a porta (3000) onde o servidor vai ficar "escutando" os pedidos do site.
app.listen(3000, () => {
    // Mensagem exibida no terminal quando o servidor estiver pronto e ativo
    console.log('Servidor a correr na porta 3000 (http://localhost:3000)');
});

// Rota para receber os dados do formulário de cadastro do site e salvar no MySQL
app.post('/api/candidatos', (req, res) => {
    const { nome, email, senha } = req.body;

    // Comando SQL para inserir o candidato na base de dados
    const query = 'INSERT INTO Candidato (nome, email, senha) VALUES (?, ?, ?)';

    db.query(query, [nome, email, senha], (err, resultado) => {
        if (err) {
            console.error('Erro ao inserir candidato:', err);
            return res.status(500).json({ erro: 'Erro ao cadastrar candidato. Verifique se o e-mail já está em uso.' });
        }
        res.status(201).json({ mensagem: 'Candidato cadastrado com sucesso na base de dados!' });
    });
});

// Rota para autenticar o login do candidato
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    // Consulta SQL para verificar se existe um candidato com este e-mail e senha
    const query = 'SELECT * FROM Candidato WHERE email = ? AND senha = ?';

    db.query(query, [email, senha], (err, resultados) => {
        if (err) {
            console.error('Erro ao tentar fazer login:', err);
            return res.status(500).json({ erro: 'Erro interno no servidor ao processar o login.' });
        }

        // Se encontrar exatamente 1 registo, o login é válido
        if (resultados.length > 0) {
            res.status(200).json({ 
                mensagem: 'Login efetuado com sucesso!', 
                candidato: {
                    id: resultados[0].id_candidato,
                    nome: resultados[0].nome,
                    email: resultados[0].email
                }
            });
        } else {
            // Se não encontrar, os dados estão incorretos
            res.status(401).json({ erro: 'E-mail ou senha incorretos. Tente novamente.' });
        }
    });
});

// Rota para buscar todas as vagas disponíveis na base de dados
app.get('/api/vagas', (req, res) => {
    const query = 'SELECT * FROM Vaga';

    db.query(query, (err, resultados) => {
        if (err) {
            console.error('Erro ao buscar vagas:', err);
            return res.status(500).json({ erro: 'Erro ao carregar as vagas disponíveis.' });
        }
        // Retorna a lista de vagas em formato JSON para o site
        res.status(200).json(resultados);
    });
});