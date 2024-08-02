// index.js

import { IsoApp } from './lib.js'

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const app = IsoApp()
const width = window.innerWidth
const height = window.innerHeight

const boardSize = 10 // Ajuste o tamanho do grid para o chão

// Cria a cena
app.createScene({ width, height, boardSize })

function updateBlock(block, params) {
  block.removeFromScene()

  const newBlock = app.addBlock(params)
  newBlock.addToScene()

  return newBlock
}

app.addGround({
  rows: boardSize,
  cols: boardSize,
  material: '#d5ded9',
  stroke: '#838689',
  strokeWidth: 2,
})

const tile = app.addTile({ x: 3, y: 3, material: 'blue' })
let block = app.addBlock({
  x: 0,
  y: 1,
  z: 1,
  material: 'rgb(255, 66, 66)',
  stroke: 'rgba(0, 0, 0, 0.2)',
  strokeWidth: 2,
})

const assets = ['assets/Olgath-art.png', 'assets/crassio-nobg-508x1024.png']

for (const asset of assets) {
  const img = app.addImage({
    x: random(0, boardSize / 2),
    y: random(0, boardSize / 2),
    widthBlockSize: random(1, 2), // largura em blocos
    heightBlockSize: random(1, 2), // altura em blocos
    href: asset,
    offsetX: 0.5, // offset horizontal (em blocos)
    offsetY: -0.5, // offset vertical (em blocos)
    borderWidth: 2, // largura da borda
    borderColor: 'red', // cor da borda
  })
  img.addToScene()
}

const img = app.addImage({
  x: 2,
  y: 2,
  widthBlockSize: 1, // largura em blocos
  heightBlockSize: 1, // altura em blocos
  href: 'assets/Olgath-art.png',
  offsetX: 0.5, // offset horizontal (em blocos)
  offsetY: -0.5, // offset vertical (em blocos)
})
img.addToScene()

block.addToScene() // Adiciona o bloco à cena
// tile.addToScene() // Adiciona o tile à cena

// block.removeFromScene() // Remove o bloco da cena
// tile.removeFromScene() // Remove o tile da cena
// app.clearScene() // Limpa a cena

document.addEventListener('keydown', event => {
  if (event.key === 'a') {
    block.update(prev => ({
      x: prev.x - 1,
      // y: prev.y - 1,
    }))
  } else if (event.key === 'd') {
    block.update(prev => ({
      x: prev.x + 1,
      // y: prev.y + 1,
    }))
  } else if (event.key === 'w') {
    block.update(prev => ({
      y: prev.y - 1,
      // x: prev.x + 1,
    }))
  } else if (event.key === 's') {
    block.update(prev => ({
      y: prev.y + 1,
      // x: prev.x - 1,
    }))
  } else if (event.key === 'Shift') {
    event.preventDefault()
    block.update(prev => ({
      z: prev.z + 1,
    }))
  } else if (event.key === 'Control') {
    block.update(prev => ({
      z: prev.z - 1,
    }))
  }
})
