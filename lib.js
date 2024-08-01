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

function createScene(width, height, boardSize) {
  const size = Math.min(width / boardSize, (2 * height) / boardSize)
  const origin = [width * 0.5 - boardSize * 0.5 * size, height * 0.5]

  const svg = document.createElementNS(IsometricNS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.setAttribute('width', `${width}px`)
  svg.setAttribute('height', `${height}px`)
  document.body.appendChild(svg)

  // Configure zoom and drag
  setupZoomAndDrag(svg, { width, height, size, origin })

  return { width, height, boardSize, size, origin, svg, elements: [] }
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

function addTile(
  scene,
  x,
  y,
  material = 'lightgrey',
  stroke = 'none',
  strokeWidth = 0
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
  scene.svg.appendChild(tile)
  scene.elements.push(tile)
}

function _addWall(scene, points, coord, material) {
  const wall = _createElementNS('polygon', {
    points,
    fill: material,
    stroke: material,
  })
  wall.style.transform = `translate(${coord[0]}px,${coord[1]}px)`
  scene.svg.appendChild(wall)
  scene.elements.push(wall)
}

function _addLeftWall(scene, x, y, z, material) {
  const points = `0,0 
    0,${-z * scene.size * 0.5} 
    ${scene.size * 0.5},${-z * scene.size * 0.5 + scene.size * 0.25}
    ${scene.size * 0.5},${scene.size * 0.25}`
  const coord = _getCoord(scene, x, y)
  _addWall(scene, points, coord, material)
}

function _addRightWall(scene, x, y, z, material) {
  const points = `
    ${scene.size * 0.5},${scene.size * 0.25} 
    ${scene.size * 0.5},${scene.size * 0.25 - z * scene.size * 0.5} 
    ${scene.size},${-z * scene.size * 0.5}
    ${scene.size},0`
  const coord = _getCoord(scene, x, y)
  _addWall(scene, points, coord, material)
}

function _addTop(scene, x, y, z, material) {
  const points = `0,0 
    ${scene.size * 0.5},${-scene.size * 0.25} 
    ${scene.size},0 
    ${scene.size * 0.5},${scene.size * 0.25}`
  const coord = _getCoord(scene, x, y)
  const tile = _createElementNS('polygon', {
    points,
    fill: material,
    stroke: material,
  })
  tile.style.transform = `translate(${coord[0]}px,${
    coord[1] - z * scene.size * 0.5
  }px)`
  scene.svg.appendChild(tile)
  scene.elements.push(tile)
}

function addBlock(scene, x, y, z, material = 'grey') {
  _addLeftWall(scene, x, y, z, material)
  _addRightWall(scene, x, y, z, material)
  _addTop(scene, x, y, z, material)
}

function removeElement(scene, element) {
  scene.svg.removeChild(element)
  scene.elements = scene.elements.filter(el => el !== element)
}

function clearScene(scene) {
  scene.elements.forEach(el => scene.svg.removeChild(el))
  scene.elements = []
}

export function addGround(
  scene,
  rows,
  cols,
  material = 'lightgrey',
  stroke = 'none',
  strokeWidth = 0
) {
  for (let x = 0; x < rows; x++) {
    for (let y = 0; y < cols; y++) {
      addTile(scene, x, y, material, stroke, strokeWidth)
    }
  }
}

export function IsoApp() {
  let scene = null

  return {
    createScene: (width, height, boardSize) => {
      scene = createScene(width, height, boardSize)
      return scene
    },
    addTile: (x, y, material, stroke, strokeWidth) =>
      addTile(scene, x, y, material, stroke, strokeWidth),
    addBlock: (x, y, z, material) => addBlock(scene, x, y, z, material),
    addLeftWall: (x, y, z, material) => _addLeftWall(scene, x, y, z, material),
    addRightWall: (x, y, z, material) =>
      _addRightWall(scene, x, y, z, material),
    addTop: (x, y, z, material) => _addTop(scene, x, y, z, material),
    removeElement: element => removeElement(scene, element),
    clearScene: () => clearScene(scene),
    getCoord: (x, y) => _getCoord(scene, x, y),
    getScene: () => scene,
    getSvg: () => scene?.svg,
    addGround: (rows, cols, material, stroke, strokeWidth) =>
      addGround(scene, rows, cols, material, stroke, strokeWidth),
  }
}
