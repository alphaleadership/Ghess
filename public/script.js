(() => {
  let
    session = null,
    player = false;
  
  const socket = io();
  
  socket.on("moveTo", moveTo);
  socket.on("reset", reset);
  socket.on("ajuste", ajuste);
  socket.on("eat", eat);
  socket.on("message", log);
  
  document.addEventListener("DOMContentLoaded", () => {
    
    socket.once("connection", sessions => {
      const indication = Object.keys(sessions).length > 0 ?
        "Veuillez choisir une partie parmi les suivantes ou en créer une." :
        "Veuillez créer une partie."
      session = prompt(`${indication}\n
${Object.keys(sessions).map(name => `id: ${name}, users: ${sessions[name]}`).join('\n')}
      `.trim())
      if(session.length === 0)
        session = "General"
      socket.emit("login", session)
      document.getElementById("session").innerText = session
    })
    
    document.getElementById("reset").onclick = () => socket.emit('reset');
    document.getElementById("field").onkeydown = event => {
      if(event.key === "Enter") {
        const emoji = document.getElementById("emoji").value
        const color = document.getElementById("color").value
        const text = event.target.value
        const message = `${emoji} ${text}`
        socket.emit("message", message, color);
        event.target.value = ""
      }
    }
    
    socket.on("userCountUpdate", userCount => {
      document.getElementById("userCount").innerText = `👁️ ${Math.max(0, userCount - 2)} viewers | ♟️ ${Math.min(2, userCount)} players`
    })
    
    socket.on("player", (isPlayer) => {
      player = isPlayer
      if (!player) {
        document.querySelectorAll("#panel > button, #panel > label, #panel > input").forEach(e => {
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
      if (!player) return
      const drag = document.getElementsByClassName("drag")[0]
      if (drag && event.target.id === "board") {
        socket.emit("moveTo", drag.id, {
          x: event.x,
          y: event.y
        })
      }
    }
    
    ;['b', 'w'].forEach(team => {
      'BBKNNPPPPPPPPQRR'.split('').forEach((piece, index) => {
        const pieceElement = document.createElement('img')
        pieceElement.src = `img/${team}${piece}.png`
        pieceElement.id = team + piece + index
        pieceElement.onclick = onPieceClick
        boardElement.appendChild(pieceElement)
      })
    })
  })
  
  function ajuste(id) {
    const pieceElement = document.getElementById(id)
    pieceElement.style.left = (Math.floor((parseInt(pieceElement.style.left, 10) + 40) / 80) * 80) + "px"
    pieceElement.style.top = (Math.floor((parseInt(pieceElement.style.top, 10) + 40) / 80) * 80) + "px"
  }
  
  /**
   * Remet les pièces à leur place d'origine
   */
  function reset() {
    log(`Reset.`)
    document.querySelectorAll("#trash > *").forEach(e => {
      e.classList.remove("eaten")
      document.getElementById("board").appendChild(e)
    })
    
    ;['b', 'w'].forEach(team => {
      'BBKNNPPPPPPPPQRR'.split('').forEach((piece, index) => {
        const pieceElement = document.getElementById(team + piece + index)
        let y = team === 'b' ? 120 : 520
        y += piece === 'P' ? 0 : 80 * (team === 'b' ? -1 : 1)
        pieceElement.style.top = (y - 40) + 'px'
      })
    })
    
    setTimeout(() => {
      ;['b', 'w'].forEach(team => {
        let realIndex = 0
        'BBKNNPPPPPPPPQRR'.split('').forEach((piece, index) => {
          if (piece !== "P") return
          const pieceElement = document.getElementById(team + piece + index)
          pieceElement.style.left = (realIndex * 80) + 'px'
          realIndex++
        })
      })
    }, 500)
    
    setTimeout(() => {
      ;['b', 'w'].forEach(team => {
        'BBKNNPPPPPPPPQRR'.split('').forEach((piece, index) => {
          if (piece === "P") return
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
  
  function moveTo(id, position, disableLog) {
    const pieceElement = document.getElementById(id)
    if(!disableLog) log(`${icon(pieceElement)} move.`)
    // move drag on target position
    pieceElement.style.left = (position.x - 40) + "px"
    pieceElement.style.top = (position.y - 40) + "px"
    // remove focus
    pieceElement.classList.remove("drag")
    // ajuste
    socket.emit("ajuste", pieceElement.id)
  }
  
  function eat(eaterId, id) {
    const pieceElement = document.getElementById(id)
    const eaterElement = document.getElementById(eaterId)
    log(`${icon(eaterElement)} eat ${icon(pieceElement)}.`)
    pieceElement.classList.add("eaten")
    document.getElementById("trash").appendChild(pieceElement);
  }
  
  function onPieceClick(event) {
    if (!player) return
    if(event.target.classList.contains("eaten")){
      event.target.classList.remove("eaten")
      document.getElementById("board").appendChild(event.target)
      return
    }
    const drag = document.getElementsByClassName("drag")[0]
    if (drag) {
      if (drag === event.target) {
        drag.classList.remove("drag")
      } else {
        if (drag.id[0] !== event.target.id[0]) {
          // eat target
          socket.emit("eat", drag.id, event.target.id)
        } else {
          drag.classList.remove("drag")
          return
        }
        socket.emit("moveTo", drag.id, {
          x: event.x,
          y: event.y
        }, true)
      }
    } else {
      event.target.classList.add("drag")
    }
  }
  
  function shifting(x, shift) {
    shift = (Math.random() * shift * 2) - shift
    return x + shift
  }
  
  function log(text, color){
    const div = document.createElement("div")
    div.innerHTML = text
    if(color) div.style.color = color
    document.getElementById("console").appendChild(div)
  }
  
  function icon(pieceElement){
    return `<img
      src="${pieceElement.src}"
      height="15"
      alt="${pieceElement.id.slice(0,2)}"
      title="${pieceElement.id.slice(0,2)}">`
  }
})();