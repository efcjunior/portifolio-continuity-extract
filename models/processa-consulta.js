const sha256 = require('sha256')
const fs = require('fs')
const path = require('path')

//let logs = [];
//let log;
let totalEncontrado = 0

class Config {
    constructor(searchSize, continuitySize, matchesRequiredMinimum, matchesRequiredMaximum){
        this.searchSize = searchSize
        this.continuitySize = continuitySize
        this.matchesRequiredMinimum = matchesRequiredMinimum
        this.matchesRequiredMaximum = matchesRequiredMaximum
    }
}

class ValuePair {
    constructor(data){
        let fields = data.split(';')
        this.dh = fields[0]        
        this.left = parseFloat(fields[1].replace(/,/g, '.'))
        this.right = parseFloat(fields[2].replace(/,/g, '.'))
        this.a = parseFloat(fields[3].replace(/,/g, '.'))
        this.b = parseFloat(fields[4].replace(/,/g, '.'))
        this.variations = this.getVariations(this.right,this.left)        
        this.variationsAB = this.getVariations(this.a,this.b)   
        this.id = sha256(this.toString())
    }

    toString(){
        return this.dh + this.left + this.right
    }

    getCoefficient(right, left){
        return right - left
    }

    getVariations(right, left){
        let coefficient = this.getCoefficient(right, left)
        return  [
            //coefficient - 0.5,
            coefficient
            //,coefficient + 0.5
        ]
    }

    isSearchCoefficientMatches(arraySearch){
        
        return this.isSearchCoefficientMatchesMaxMin(arraySearch[1], arraySearch[0]) 
        && this.isSearchCoefficientMatchesAB(arraySearch[2], arraySearch[3])
    }

    isSearchCoefficientMatchesAB(right, left){
        let searchCoefficient = this.getCoefficient(right, left)
        return this.variationsAB.includes(searchCoefficient)
    }

    isSearchCoefficientMatchesMaxMin(right, left){
        let searchCoefficient = this.getCoefficient(right, left)
        return this.variations.includes(searchCoefficient)
    }
}

const createValuePairFromFile = function (basededados){
    let values = []
    let fileName = `import_${basededados}.txt`

    console.log(fileName)
    
    let file = fs.readFileSync(path.join(__dirname,fileName),'utf8')
    file.split('\n').forEach(line => {
        values.push(new ValuePair(line))
    })
    return values
}
const getMatchesTotalFromSearch = function(arrayStored, arraySearch){    
    let matchesCount = 0    
    if(arrayStored.length >=  arraySearch.length){
        for(let i = 0; i < arraySearch.length; i++){
            if(arrayStored[i].isSearchCoefficientMatches(arraySearch[i])){
                matchesCount++
            }    
        }
    }
    console.log("total encontrado: " + matchesCount)
    totalEncontrado = matchesCount
    //log["d"] = `"${matchesCount}"`
    return matchesCount
}

const processaConsulta = (dataSearch) => {
    let config
    switch(dataSearch.tipo){
        case '21':
            config = new Config(21,13,16,21)
            break;
        case '13':
            config = new Config(13,8,10,13)
            break;
        case '8':
            config = new Config(8,5,6,8)
            break;
        case '5':
            config = new Config(5,5,5,5)
            break;
        case '4':
            config = new Config(4,8,4,4)
            break;
        case '3':
            config = new Config(3,8,3,3)
            break;
        case '2':
            config = new Config(2,8,2,2)
            break;
    }    
    let arraySearch = dataSearch
    let searchSize = config.searchSize
    let dataStored = createValuePairFromFile(dataSearch.basededados)               
    let resposta = JSON.parse(`{ "continuidade" : ["Nenhuma continuidade foi encontrada para busca realizada"]  }`)
    //log = ["total continuidade", "total minimo requerido", "indices intervalo", "total encontrado", "indices intervalo encontrado"]
    for(let mathchesCount = config.matchesRequiredMaximum; mathchesCount >= config.matchesRequiredMinimum; mathchesCount--){               
        console.log('total continuidade: ' + config.continuitySize)
        //log = {}
        //log["a"] = `"${config.continuitySize}"`
        let rangeFirstIndex = config.continuitySize
        let rangeEndIndex = rangeFirstIndex + searchSize
        console.log('total minimo requerido: ' + mathchesCount)
        //log["b"] = `"${mathchesCount}"`
        while(true){
            log = {}
            console.log('indices intervalo: ' + rangeFirstIndex + ' - ' + rangeEndIndex) 
            //log["c"] = `"${rangeFirstIndex} - ${rangeEndIndex}"`
            arrayStored = dataStored.slice(rangeFirstIndex,rangeEndIndex)
            if(arrayStored.length < config.searchSize){
                break
            }
            if(getMatchesTotalFromSearch(arrayStored,arraySearch) >= mathchesCount){      
                console.log('indices intervalo encontrado: ' + rangeFirstIndex + ' - ' + rangeEndIndex) 
                //log["e"] = `"${rangeFirstIndex} - ${rangeEndIndex}"`
                //logs.push(log)
                arrayStored.forEach(e=> console.log(e.dh + ' ' + e.left + ' ' + e.right))         
                if(rangeFirstIndex >= config.continuitySize){
                    rangeEndIndex = rangeFirstIndex
                    rangeFirstIndex = rangeFirstIndex - config.continuitySize
                    let result =
                    dataStored.slice(rangeFirstIndex,rangeEndIndex)
                    .reverse().map(r => {
                        return `{"dh": "${r.dh}", "min": "${r.left}", "max": "${r.right}"}`.replace(new RegExp('\\.', 'g'),',')
                    })
                    console.log(`{ "continuidade" : [${result}], "log" : ${totalEncontrado}  }`)
                    
                    /*let logging = logs.map(e => {
                        console.log(e.a)
                        console.log(`${e.c}`)
                        return `{"a": ${e.a}, "b": ${e.b}, "c": ${e.c}, "d": ${e.d}, "e": ${e.e}}`
                    })*/
                    resposta = JSON.parse(`{ "continuidade" : [${result}], "log" : [${totalEncontrado}]  }`)
                    return resposta
                }                
                console.log('matches were found between: First Index ' + rangeFirstIndex + ' - End Index ' + rangeEndIndex + '. However, it does not have continuity.')
                break
            }        
            //logs.push(log)
            rangeFirstIndex++
            rangeEndIndex++
        }
    }
    return resposta
}

module.exports = {
    processaConsulta
}
