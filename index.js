// Importação do IsoApp
import { IsoApp } from './lib.js'

const app = IsoApp()
const width = window.innerWidth
const height = window.innerHeight

const boardSize = 20 // Ajuste o tamanho do grid para o chão

// Cria a cena
app.createScene({ width, height, boardSize })

// Adiciona o chão à cena
app.addGround({
  rows: boardSize,
  cols: boardSize,
  material: '#d5ded9',
  stroke: '#838689',
  strokeWidth: 2,
})

// Adiciona um tile e um bloco para demonstração
app.addTile({ x: 3, y: 3, material: 'blue' })
app.addBlock({ x: boardSize / 2, y: boardSize / 2, z: 1, material: 'red' })

// Funções de manipulação de elementos
// app.removeElement(block)
// app.clearScene()
