let
  session = null,
  player = false;

const socket = io();

socket.on("moveTo", moveTo);
socket.on("reset", reset);
socket.on("ajuste", ajuste);
socket.on("eat", eat);

document.addEventListener("DOMContentLoaded", () => {
  
  session = prompt("Veuillez choisir une session.")
  socket.emit("login", session)
  document.getElementById("session").innerText = session
  
  socket.on("userCountUpdate", userCount => {
    document.getElementById("userCount").innerText = `👁️ ${Math.max(0,userCount - 2)} viewers | ♟️ ${Math.min(2,userCount)} players`
  })
  
  socket.on("player", (isPlayer) => {
    player = isPlayer
    if(!player){
      document.querySelectorAll("#panel > button, #panel > label").forEach(e => {
        e.style.display = "none"
      })
    }
  })
  
  socket.on("boardRequest", () => {
    socket.emit("boardResponse", document.getElementById("board").innerHTML)
  })
  
  socket.on("boardUpdate", board => {
    document.getElementById("board").innerHTML = board
    Array.from(document.getElementById("board").children).forEach(e => {
      e.onclick = onPieceClick
    })
  })
  
  socket.once("init", reset)
  
  const boardElement = document.getElementById("board")
  
  boardElement.onclick = event => {
    if(!player) return
    const drag = document.getElementsByClassName("drag")[0]
    if(drag && event.target.id === "board") {
      moveTo_emit(drag.id, event)
    }
  }
  
  ;['b','w'].forEach(team => {
    'BBKNNPPPPPPPPQRR'.split('').forEach((piece, index) => {
      const pieceElement = document.createElement('img')
      pieceElement.src = `img/${team}${piece}.png`
      pieceElement.id = team + piece + index
      pieceElement.onclick = onPieceClick
      boardElement.appendChild(pieceElement)
    })
  })
})

/**
 * Ajuste les pieces posées à la mon au milieu de
 * leur case pour une meilleur visibilité
 */
function ajusteAll(){
  const boardElement = document.getElementById("board")
  Array.from(boardElement.children)
    .map(e => e.id)
    .forEach(ajuste)
}

function ajusteAll_emit(){
  const boardElement = document.getElementById("board")
  Array.from(boardElement.children)
    .map(e => e.id)
    .forEach(ajuste_emit)
}

function ajuste(id) {
  const pieceElement = document.getElementById(id)
  pieceElement.style.left = (Math.floor((parseInt(pieceElement.style.left,10) + 40) / 80) * 80) + "px"
  pieceElement.style.top = (Math.floor((parseInt(pieceElement.style.top,10) + 40) / 80) * 80) + "px"
}

function ajuste_emit(id){
  ajuste(id)
  socket.emit("ajuste", id)
}

/**
 * Remet les pièces à leur place d'origine
 */
function reset(){
  ;['b','w'].forEach(team => {
    'BBKNNPPPPPPPPQRR'.split('').forEach((piece, index) => {
      const pieceElement = document.getElementById(team + piece + index)
      let y = team === 'b' ? 120 : 520
      y += piece === 'P' ? 0 : 80 * (team === 'b' ? -1 : 1)
      pieceElement.style.top = (y - 40) + 'px'
    })
  })
  
  setTimeout(() => {
    ;['b','w'].forEach(team => {
      let realIndex = 0
      'BBKNNPPPPPPPPQRR'.split('').forEach((piece, index) => {
        if(piece !== "P") return
        const pieceElement = document.getElementById(team + piece + index)
        pieceElement.style.left = (realIndex * 80) + 'px'
        realIndex ++
      })
    })
  }, 500)
  
  setTimeout(() => {
    ;['b','w'].forEach(team => {
      'BBKNNPPPPPPPPQRR'.split('').forEach((piece, index) => {
        if(piece === "P") return
        const pieceElement = document.getElementById(team + piece + index)
        
        let x = 80
        
        switch (index) {
          case 0:
            x *= 2
            break
          case 1:
            x *= 5
            break
          case 2:
            x *= 4
            break
          case 4:
            x *= 6
            break
          case 13:
            x *= 3
            break
          case 14:
            x *= 0
            break
          case 15:
            x *= 7
            break
        }
        
        pieceElement.style.left = x + 'px'
      })
    })
  }, 1000)
}

function reset_emit(){
  reset()
  socket.emit("reset")
}

function moveTo(id, position) {
  const pieceElement = document.getElementById(id)
  // move drag on target position
  pieceElement.style.left = (position.x - 40) + "px"
  pieceElement.style.top = (position.y - 40) + "px"
  // remove focus
  pieceElement.classList.remove("drag")
  // ajuste
  if(document.getElementById("auto-ajuste").checked)
    ajuste(pieceElement.id)
}

function moveTo_emit(id, position){
  moveTo(id, position)
  socket.emit("moveTo", id, {
    x: position.x,
    y: position.y
  })
  if(document.getElementById("auto-ajuste").checked)
    ajuste_emit(id)
}

function eat(eaterId, id){
  const pieceElement = document.getElementById(id)
  const eaterElement = document.getElementById(eaterId)
  if(eaterElement.id[0] === 'b'){
    pieceElement.style.left = `${shifting(800, 50)}px`
    pieceElement.style.top = `${shifting(400, 50)}px`
  }else{
    pieceElement.style.left = `${shifting(800, 50)}px`
    pieceElement.style.top = `${shifting(566, 50)}px`
  }
}

function eat_emit(eaterId, id){
  eat(eaterId, id)
  socket.emit("eat", eaterId, id)
}

function onPieceClick(event){
  if(!player) return
  const drag = document.getElementsByClassName("drag")[0]
  if(drag){
    if(drag === event.target) {
      drag.classList.remove("drag")
    }else{
      if(drag.id[0] !== event.target.id[0]){
        // eat target
        eat_emit(drag.id, event.target.id)
      }else {
        drag.classList.remove("drag")
        return
      }
      moveTo_emit(drag.id, event)
    }
  }else{
    event.target.classList.add("drag")
  }
}

function shifting(x, shift){
  shift = (Math.random() * shift * 2) - shift
  return x + shift
}
