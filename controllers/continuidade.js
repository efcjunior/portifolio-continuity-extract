const continuidade = require('../models/continuidade')

const index = (req, res) => {
    res.render('continuidade/index', {basededados: req.query.basededados})
}

const consulta = (req, res) => {
    let dataSearch = req.body.valor
    .replace(new RegExp('\n', 'g'),'')
    .replace(new RegExp(',', 'g'),'.')
    .trim().split('\r')
    .map(row => {
        return row.split('\t')
    })
    
    dataSearch.tipo = req.body.tipo
    dataSearch.basededados = req.body.basededados
    
    let resposta = continuidade.consulta(dataSearch) 
    res.render('continuidade/index', {resposta: resposta, basededados: dataSearch.basededados})
}

module.exports = {
    index,
    consulta
}