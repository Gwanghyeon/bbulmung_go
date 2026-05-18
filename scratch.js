const Board = require('@sabaki/go-board');
const b = new Board([[0,0],[0,0]]);
const nb = b.makeMove(1, [0,0]);
console.log(nb.getCaptures(1));
