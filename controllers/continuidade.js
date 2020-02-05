const continuidade = require('../models/continuidade')

const index = (req, res) => {
    res.render('continuidade/index')
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
    
    let resposta = continuidade.consulta(dataSearch) 
    res.render('continuidade/index', {resposta: resposta})
}

module.exports = {
    index,
    consulta
}