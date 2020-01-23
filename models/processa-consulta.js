const sha256 = require('sha256')
const fs = require('fs')
const path = require('path')

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
        this.variations = this.getVariations(this.left,this.right)        
        this.id = sha256(this.toString())
    }

    toString(){
        return this.dh + this.left + this.right
    }

    getCoefficient(left, right){
        return Math.abs(left - right)
    }

    getVariations(left, right){
        let coefficient = this.getCoefficient(left, right)
        return  [
            coefficient - 0.5,
            coefficient,
            coefficient + 0.5]
    }

    isSearchCoefficientMatches(left, right){
        let searchCoefficient = this.getCoefficient(left, right)
        return this.variations.includes(searchCoefficient)
    }
}

const createValuePairFromFile = function (){
    let values = []
    
    let file = fs.readFileSync(path.join(__dirname,'import.txt'),'utf8')
    file.split('\n').forEach(line => {
        values.push(new ValuePair(line))
    })
    return values
}
const getMatchesTotalFromSearch = function(arrayStored, arraySearch){    
    let matchesCount = 0    
    if(arrayStored.length >=  arraySearch.length){
        for(let i = 0; i < arraySearch.length; i++){
            if(arrayStored[i].isSearchCoefficientMatches(arraySearch[i][0], arraySearch[i][1])){
                matchesCount++
            }    
        }
    }
    console.log("Total matches found: " + matchesCount)
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
    }    
    let arraySearch = dataSearch
    let searchSize = config.searchSize
    let dataStored = createValuePairFromFile()               
    let resposta = JSON.parse(`{ "continuidade" : ["Nenhuma continuidade foi encontrada para busca realizada"]  }`)
    for(let mathchesCount = config.matchesRequiredMaximum; mathchesCount >= config.matchesRequiredMinimum; mathchesCount--){      
        console.log('continuitySize: ' + config.continuitySize)
        let rangeFirstIndex = config.continuitySize
        let rangeEndIndex = rangeFirstIndex + searchSize
        console.log('MatchCountRequired: ' + mathchesCount)
        while(true){
            console.log('Searching between Index: ' + rangeFirstIndex + ' - ' + rangeEndIndex) 
            arrayStored = dataStored.slice(rangeFirstIndex,rangeEndIndex)
            if(arrayStored.length < config.searchSize){
                break
            }
            if(getMatchesTotalFromSearch(arrayStored,arraySearch) >= mathchesCount){      
                console.log('Found between Index: ' + rangeFirstIndex + ' - ' + rangeEndIndex) 
                arrayStored.forEach(e=> console.log(e.dh + ' ' + e.left + ' ' + e.right))         
                if(rangeFirstIndex >= config.continuitySize){
                    rangeEndIndex = rangeFirstIndex
                    rangeFirstIndex = rangeFirstIndex - config.continuitySize
                    let result =
                    dataStored.slice(rangeFirstIndex,rangeEndIndex)
                    .reverse().map(r => {
                        return `{"dh": "${r.dh}", "min": "${r.left}", "max": "${r.right}"}`.replace(new RegExp('\\.', 'g'),',')
                    })
                    resposta = JSON.parse(`{ "continuidade" : [${result}]  }`)
                    return resposta
                }                
                console.log('matches were found between: First Index ' + rangeFirstIndex + ' - End Index ' + rangeEndIndex + '. However, it does not have continuity.')
                break
            }            
            rangeFirstIndex++
            rangeEndIndex++
        }
    }
    return resposta
}

module.exports = {
    processaConsulta
}
