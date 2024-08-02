// index.js

const IsometricNS = 'http://www.w3.org/2000/svg'

function setupZoomAndDrag(svg, scene) {
  let isDragging = false
  let startX, startY
  let viewBox = svg.viewBox.baseVal
  let zoomFactor = 1
  let dragStartX, dragStartY

  function updateViewBox() {
    svg.setAttribute(
      'viewBox',
      `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
    )
  }

  function onWheel(event) {
    event.preventDefault()

    // Posição do mouse dentro do SVG
    const svgRect = svg.getBoundingClientRect()
    const mouseX = event.clientX - svgRect.left
    const mouseY = event.clientY - svgRect.top

    // Calcula o ponto no sistema de coordenadas do SVG
    const svgPoint = svg.createSVGPoint()
    svgPoint.x = mouseX
    svgPoint.y = mouseY
    const pt = svgPoint.matrixTransform(svg.getScreenCTM().inverse())

    // Ajusta o fator de zoom
    const zoomSpeed = 0.2
    zoomFactor *= event.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed
    zoomFactor = Math.max(0.1, Math.min(zoomFactor, 10)) // Limita o fator de zoom

    // Atualiza as dimensões da caixa de visualização
    viewBox.width = scene.width / zoomFactor
    viewBox.height = scene.height / zoomFactor

    // Calcula a nova posição da caixa de visualização para manter o ponto do mouse no mesmo local
    viewBox.x = pt.x - mouseX / zoomFactor
    viewBox.y = pt.y - mouseY / zoomFactor

    updateViewBox()
  }

  function onMouseDown(event) {
    isDragging = true
    startX = event.clientX
    startY = event.clientY
    dragStartX = viewBox.x
    dragStartY = viewBox.y
  }

  function onMouseMove(event) {
    if (isDragging) {
      const dx = startX - event.clientX // Inverte a direção horizontal
      const dy = startY - event.clientY // Inverte a direção vertical
      viewBox.x = dragStartX + dx / zoomFactor
      viewBox.y = dragStartY + dy / zoomFactor
      updateViewBox()
    }
  }

  function onMouseUp() {
    isDragging = false
  }

  svg.addEventListener('wheel', onWheel)
  svg.addEventListener('mousedown', onMouseDown)
  svg.addEventListener('mousemove', onMouseMove)
  svg.addEventListener('mouseup', onMouseUp)
  svg.addEventListener('mouseleave', onMouseUp)
}

function createScene({ width, height, boardSize }) {
  const size = Math.min(width / boardSize, (2 * height) / boardSize)
  const origin = [width * 0.5 - boardSize * 0.5 * size, height * 0.5]

  const svg = document.createElementNS(IsometricNS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.setAttribute('width', `${width}px`)
  svg.setAttribute('height', `${height}px`)
  document.body.appendChild(svg)

  // Configure zoom and drag
  setupZoomAndDrag(svg, { width, height, size, origin })

  return {
    width,
    height,
    boardSize,
    size,
    origin,
    svg,
    elements: [],

    addElement(element) {
      this.svg.appendChild(element)
      this.elements.push(element)
    },

    removeElement(element) {
      this.svg.removeChild(element)
      this.elements = this.elements.filter(el => el !== element)
    },

    clear() {
      this.elements.forEach(el => this.svg.removeChild(el))
      this.elements = []
    },
  }
}

function _getCoord(scene, x, y) {
  return [
    scene.origin[0] + (x + y) * scene.size * 0.5,
    scene.origin[1] + (y - x) * scene.size * 0.25,
  ]
}

function _createElementNS(tag, attributes) {
  const element = document.createElementNS(IsometricNS, tag)
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value)
  }
  return element
}

function createTile(
  scene,
  { x, y, material = 'lightgrey', stroke = 'none', strokeWidth = 0 }
) {
  const points = `
    0,0 
    ${scene.size * 0.5},${-scene.size * 0.25} 
    ${scene.size},0 
    ${scene.size * 0.5},${scene.size * 0.25}`
  const tile = _createElementNS('polygon', {
    points,
    fill: material,
    stroke: stroke,
    'stroke-width': strokeWidth,
  })
  const coord = _getCoord(scene, x, y)
  tile.style.transform = `translate(${coord[0]}px,${coord[1]}px)`
  return {
    element: tile,
    addToScene() {
      scene.addElement(tile)
    },
    removeFromScene() {
      scene.removeElement(tile)
    },
  }
}

function createBlock(scene, params) {
  params.strokeWidth = params.strokeWidth || 2
  params.stroke = params.stroke || 'black'
  params.material = params.material || 'grey'

  const leftWall = createWall(scene, {
    ...params,
    type: 'left',
  })
  const rightWall = createWall(scene, {
    ...params,
    type: 'right',
  })
  const top = createWall(scene, {
    ...params,
    type: 'top',
  })

  let me = {
    elements: [leftWall.element, rightWall.element, top.element],
    addToScene() {
      leftWall.addToScene()
      rightWall.addToScene()
      top.addToScene()
    },
    removeFromScene() {
      leftWall.removeFromScene()
      rightWall.removeFromScene()
      top.removeFromScene()
    },
    params,
  }

  me.update = callBackParams => {
    me.removeFromScene()
    me = createBlock(scene, { ...me.params, ...callBackParams(me.params) })
    me.addToScene()
  }

  return me
}

function createWall(scene, { x, y, z, material, stroke, strokeWidth, type }) {
  let points
  switch (type) {
    case 'left':
      points = `0,0 
        0,${-z * scene.size * 0.5} 
        ${scene.size * 0.5},${-z * scene.size * 0.5 + scene.size * 0.25}
        ${scene.size * 0.5},${scene.size * 0.25}`
      break
    case 'right':
      points = `
        ${scene.size * 0.5},${scene.size * 0.25} 
        ${scene.size * 0.5},${scene.size * 0.25 - z * scene.size * 0.5} 
        ${scene.size},${-z * scene.size * 0.5}
        ${scene.size},0`
      break
    case 'top':
      points = `0,0 
        ${scene.size * 0.5},${-scene.size * 0.25} 
        ${scene.size},0 
        ${scene.size * 0.5},${scene.size * 0.25}`
      break
  }
  const coord = _getCoord(scene, x, y)
  const wall = _createElementNS('polygon', {
    points,
    fill: material,
    stroke: stroke,
    'stroke-width': strokeWidth,
  })
  if (type === 'top') {
    wall.style.transform = `translate(${coord[0]}px,${
      coord[1] - z * scene.size * 0.5
    }px)`
  } else {
    wall.style.transform = `translate(${coord[0]}px,${coord[1]}px)`
  }
  return {
    element: wall,
    addToScene() {
      scene.addElement(wall)
    },
    removeFromScene() {
      scene.removeElement(wall)
    },
  }
}

function createGround(
  scene,
  { rows, cols, material = 'lightgrey', stroke = 'none', strokeWidth = 0 }
) {
  const tiles = []
  for (let x = 0; x < rows; x++) {
    for (let y = 0; y < cols; y++) {
      const tile = createTile(scene, { x, y, material, stroke, strokeWidth })
      tile.addToScene()
      tiles.push(tile)
    }
  }
  return tiles
}

function createImage(
  scene,
  {
    x,
    y,
    widthBlockSize,
    heightBlockSize,
    href,
    offsetX = 0,
    offsetY = 0,
    borderWidth = 1,
    borderColor = 'black',
  }
) {
  // Converte o tamanho dos blocos para pixels
  const width = widthBlockSize * scene.size
  const height = heightBlockSize * scene.size

  const coord = _getCoord(scene, x, y)

  // Cria o elemento de imagem
  const image = _createElementNS('image', {
    href,
    width: `${width}px`,
    height: `${height}px`,
    x: coord[0] + offsetX * scene.size,
    y: coord[1] - height + offsetY * scene.size,
  })

  // Cria um retângulo para a borda
  const border = _createElementNS('rect', {
    x: coord[0] + offsetX * scene.size,
    y: coord[1] - height + offsetY * scene.size,
    width: `${width}px`,
    height: `${height}px`,
    fill: 'none', // Sem preenchimento
    stroke: borderColor, // Cor da borda
    'stroke-width': borderWidth, // Largura da borda
  })

  return {
    elements: [image, border],
    addToScene() {
      scene.addElement(image)
      scene.addElement(border)
    },
    removeFromScene() {
      scene.removeElement(image)
      scene.removeElement(border)
    },
  }
}

export function IsoApp() {
  let scene = null

  return {
    createScene({ width, height, boardSize }) {
      scene = createScene({ width, height, boardSize })
    },

    addTile(options) {
      if (scene) {
        return createTile(scene, options)
      } else {
        throw new Error('Scene not initialized')
      }
    },

    addBlock(options) {
      if (scene) {
        return createBlock(scene, options)
      } else {
        throw new Error('Scene not initialized')
      }
    },

    addGround(options) {
      if (scene) {
        return createGround(scene, options)
      } else {
        throw new Error('Scene not initialized')
      }
    },

    addImage(options) {
      if (scene) {
        return createImage(scene, options)
      } else {
        throw new Error('Scene not initialized')
      }
    },

    clearScene() {
      if (scene) {
        scene.clear()
      } else {
        throw new Error('Scene not initialized')
      }
    },

    removeElement(element) {
      if (scene) {
        scene.removeElement(element)
      } else {
        throw new Error('Scene not initialized')
      }
    },
  }
}
