//importar módulo express
const express = require('express');

//importar fileupload
const fileupload = require('express-fileupload');

// importar express-handlebars
const { engine } = require('express-handlebars');

//importar mysql
const mysql = require('mysql2');

//file systems
const fs = require('fs');
//app
const app = express();

//habilitando upload
app.use(fileupload());

//adicionar bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));

//adicionar css
app.use('/css', express.static('./css'));

//pasta imagens
app.use('/imagens', express.static('./imagens'));

//config express-handlebars
app.engine('handlebars', engine({ 
    helpers: {
     condicionalIgualdade: function (parametro1, parametro2, options) { 
        return parametro1 === parametro2 ? options.fn(this) : options.inverse(this); 
    } 
} 
}));
app.set('view engine', 'handlebars');
app.set('views','./views');

// manipulação via rotas
app.use(express.json());
app.use(express.urlencoded({extended:false}));

//config conexão
const conexao = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'12345',
    database:'projeto'
});

// teste conection
conexao.connect(function(erro){
    if(erro) throw erro;
    console.log('Conexão estabelecida')

});
//rota principal
app.get('/', function(req, res){

    let sql = 'SELECT * FROM conteudos';

    conexao.query(sql, function(erro, retorno){
        res.render('formulario', {conteudos:retorno});
    });
   
});

// rota principal com a situação
app.get('/:situacao', function(req, res){

    let sql = 'SELECT * FROM conteudos';

    conexao.query(sql, function(erro, retorno){
        res.render('formulario', {conteudos:retorno, situacao:req.params.situacao});
    });
   
});

//rota de cadastro
app.post('/cadastrar',function(req,res){
    try{

    let nome = req.body.nome;
    let imagem = req.files.imagem.name;
    let categoria = req.body.categoria;
    let descricao = req.body.descricao;

    //validação
    if(nome == '' || categoria == '' || descricao == ''){
        res.redirect('/falhaCadastro');
    }else{

        //SQL
    let sql = `INSERT INTO conteudos (nome, imagem, categoria, descricao) VALUES('${nome}', '${imagem}', '${categoria}', '${descricao}')`;

    //executar comando sql
    conexao.query(sql, function(erro, retorno){
        if(erro) throw erro;

        req.files.imagem.mv(__dirname+'/imagens/'+req.files.imagem.name);
        console.log(retorno);

    });

    res.redirect('/okCadastro');

    }

    }catch(erro){
        res.redirect('/falhaCadastro');
    }

 
});

//rota remoção
app.get('/remover/:codigo&:imagem',function(req, res){

    let sql = `DELETE FROM conteudos WHERE codigo = ${req.params.codigo}`;

    conexao.query(sql, function(erro, retorno){
        if(erro) throw erro;

        fs.unlink(__dirname + '/imagens/' + req.params.imagem, (erro_imagem) => {
            console.log('imagem removida');
        });
    });

    //redirecionamento
    res.redirect('/');
});

// rota para o form de editar
app.get('/formularioEditar/:codigo', function(req, res){
    let sql = `SELECT * FROM conteudos WHERE codigo = ${req.params.codigo}`;

    conexao.query(sql, function(erro, retorno){
        if(erro) throw erro;

        res.render('formularioEditar', {produto:retorno[0]});
    });
    
});

//rota para editar
app.post('/editar', function(req,res){
    let nome = req.body.nome;
    let categoria = req.body.categoria;
    let descricao = req.body.descricao;
    let codigo = req.body.codigo;
    let nomeImagem = req.body.nomeImagem;

    try{
        //objeto
        let imagem = req.files.imagem;

        let sql = `UPDATE conteudos SET nome='${nome}', categoria='${categoria}', descricao='${descricao}', imagem='${imagem.name}' WHERE codigo=${codigo}`;

        conexao.query(sql, function(erro, retorno){
            if(erro) throw erro;

            fs.unlink(__dirname + '/imagens/' +nomeImagem, (erro_imagem) => {
                console.log('falha ao remover');
            });

            imagem.mv(__dirname +'/imagens/'+imagem.name);

        });
    }catch(erro){
        let sql = `UPDATE conteudos SET nome='${nome}', categoria='${categoria}', descricao='${descricao}' WHERE codigo=${codigo}`;

        conexao.query(sql, function(erro,retorno){
            if(erro) throw erro;
        });
    }

    res.redirect('/');

});

//Servidor
app.listen(8080);