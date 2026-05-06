const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// SERVIR FRONTEND
// ==========================
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ==========================
// CONEXÃO MYSQL
// ==========================
const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});

db.connect((err) => {
    if (err) {
        console.log("❌ Erro ao conectar no MySQL");
        console.log(err);
    } else {
        console.log("✅ MySQL conectado");
    }
});

// ==========================
// CRIAR PEDIDO
// ==========================
app.post("/pedido", (req, res) => {

    const { numero, cliente, itens } = req.body;

    db.query(
        "INSERT INTO pedidos (numero, cliente) VALUES (?, ?)",
        [numero, cliente],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    erro: "Erro ao criar pedido"
                });
            }

            const pedidoId = result.insertId;

            itens.forEach(item => {

                const previsaoFinal =
                    item.previsao && item.previsao !== ""
                        ? item.previsao
                        : null;

                const localizacaoFinal =
                    item.localizacao && item.localizacao !== ""
                        ? item.localizacao
                        : null;

                db.query(
                    `INSERT INTO itens 
                    (pedido_id, produto, codigo, status, previsao, localizacao) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        pedidoId,
                        item.produto,
                        item.codigo,
                        item.status,
                        previsaoFinal,
                        localizacaoFinal
                    ]
                );
            });

            res.json({ ok: true });
        }
    );
});

// ==========================
// LISTAR PEDIDOS
// ==========================
app.get("/pedidos", (req, res) => {

    db.query(`
        SELECT 
            p.numero,
            p.cliente,
            i.*
        FROM pedidos p
        JOIN itens i
            ON p.id = i.pedido_id
    `, (err, result) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                erro: "Erro ao buscar dados"
            });
        }

        res.json(result);
    });
});

// ==========================
// ATUALIZAR ITEM
// ==========================
app.post("/atualizar", (req, res) => {

    const { id, status, previsao } = req.body;

    const previsaoFinal =
        previsao && previsao !== ""
            ? previsao
            : null;

    db.query(
        "UPDATE itens SET status=?, previsao=? WHERE id=?",
        [status, previsaoFinal, id],
        (err) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    erro: "Erro ao atualizar"
                });
            }

            res.json({ ok: true });
        }
    );
});

// ==========================
// INICIAR SERVIDOR
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Servidor rodando na porta " + PORT);
});
