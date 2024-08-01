// Importação do IsoApp
import { IsoApp } from './lib.js'

const app = IsoApp()
const width = window.innerWidth
const height = window.innerHeight

const boardSize = 20 // Ajuste o tamanho do grid para o chão

// Cria a cena
app.createScene(width, height, boardSize)

// Adiciona o chão à cena
app.addGround(boardSize, boardSize, '#d5ded9', '#838689', 2)

// Adiciona um tile e um bloco para demonstração
app.addTile(3, 3, 'blue')
app.addBlock(boardSize / 2, boardSize / 2, 1, 'red')

// Funções de manipulação de elementos
// app.removeElement(block)
// app.clearScene()
