const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Coloca aqui diretamente os teus dados do Aiven para correres o setup localmente
const db = mysql.createConnection({
    host: 'metroform-db-klissiaclaudia.a.aivencloud.com', // Ex: mysql-xxxx.aivencloud.com
    user: 'avnadmin',
    password: 'AVNS_SUhWhIFhZh1JbNVSvVo',
    database: 'defaultdb',
    port: 15678, // A tua porta numérica do Aiven
    multipleStatements: true,
    ssl: {
        rejectUnauthorized: false
    }
});

const schemaPath = path.join(__dirname, 'database', 'schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

db.connect((err) => {
    if (err) {
        console.error('❌ ERRO COMPLETO DE CONEXÃO:', err);
        return;
    }
    console.log('✅ Conectado ao Aiven com sucesso! A preparar a base de dados...');

    // Desativa temporariamente a exigência de chave primária para esta sessão
    db.query('SET SESSION sql_require_primary_key = OFF;', (err) => {
        if (err) {
            console.log('⚠️ Aviso ao ajustar configuração:', err.message);
        }

        // Executa o script SQL para criar as tabelas
        db.query(sql, (err, results) => {
            if (err) {
                console.error('❌ Erro ao executar o script SQL:', err.message);
            } else {
                console.log('✅ Tabelas criadas com sucesso na nuvem!');
            }
            db.end();
        });
    });
});