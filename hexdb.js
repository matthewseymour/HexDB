//Matthew Seymour, matthew dot seymour at gmail.com
"use strict";

Array.prototype.foreach = function (loopFunction) {
	for(var i = 0; i < this.length; i++) 
		loopFunction(this[i]);
}

Number.prototype.squared = function () {
	return this * this;
}
/////////////
// Globals //
/////////////
var WIDTH = 870;
var HEIGHT = 540;
var SCALE = 43;
var SWAP_ROW = 8;
var SWAP_COL = -4;
var OFFSET_X = 1.3;
var OFFSET_Y = 1.3;
var BOARD_SIZE = 13;
var FIRST_MOVE_CUTOFF = 1;//20;
var GAME_NUM_CUTOFF = 1600000; //This is the real one
var BACK_BUTTON_X = (BOARD_SIZE + 3);
var BACK_BUTTON_Y = (2);
var PLAYER_ENUM = {BLACK: 1, WHITE: 2};
var ALPHABET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
var ALPHA_LOOKUP = [];
for(var i = 0; i < ALPHABET.length; i++)
	ALPHA_LOOKUP[ALPHABET[i]] = i;

var swapCheckBox = document.getElementById("swap");
var transCheckBox = document.getElementById("trans");

var defaultFilter = function(game) {return true;};

var recentGameFilter = function(game) {
	if(parseInt(game.game) >= GAME_NUM_CUTOFF)
		return true;
	else
		return false;
}

var veryGoodPlayerFilter = function(game) {
	var names = ["Maciej Celuch", "Arek Kulczycki", "Daniel Sepczuk", "shalev", "lazyplayer", "leela_bot", "gzero_bot", "mootwo"];
	if(names.indexOf(game.black) != -1 || names.indexOf(game.white) != -1) {
		if(parseInt(game.game) > GAME_NUM_CUTOFF) {
			return true;
		}
	}
	return false;
}

var onlyGoodPlayerFilter = function(game) {
	var names = ["Maciej Celuch", "Arek Kulczycki", "Daniel Sepczuk", "shalev", "lazyplayer", "leela_bot", "gzero_bot", "mootwo"];
	if(names.indexOf(game.black) != -1 && names.indexOf(game.white) != -1) {
		if(parseInt(game.game) > GAME_NUM_CUTOFF) {
			return true;
		}
	}
	return false;
}

var computerFilter = function(game) {
	var names = ["gzero_bot", "mootwo", "leela_bot"];
	if(names.indexOf(game.black) != -1 || names.indexOf(game.white) != -1) {
		if(parseInt(game.game) > GAME_NUM_CUTOFF) {
			return true;
		}
	}
	return false;
}

var onlyComputerFilter = function(game) {
	var names = ["gzero_bot", "mootwo", "leela_bot"];
	if(names.indexOf(game.black) != -1 && names.indexOf(game.white) != -1) {
		if(parseInt(game.game) > GAME_NUM_CUTOFF) {
			return true;
		}
	}
	return false;
}
var gameFilter = computerFilter;

function makeColorString(red, green, blue) {
	return "rgb(" + red.toString() + "," + green.toString() + "," + blue.toString() + ")";
}

function makeColorStringAlpha(red, green, blue, alpha) {
	return "rgba(" + red.toString() + "," + green.toString() + "," + blue.toString() + "," + alpha.toString() + ")";
}

function getMousePosition(e, canvas) {
	var x;
    var y;
    if (e.pageX || e.pageY) {
      x = e.pageX;
      y = e.pageY;
    }
    else {
      x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;
	return {x: x, y:y};
}

function getX(row, col) { return col + row / 2;}
function getY(row, col) { return row * .866;}

function refreshView() {
	if(currentNode.num == 1) {
        gameInfo.innerHTML = "1 game in database"
	} else {
		gameInfo.innerHTML = currentNode.num.toString() + " games in database";
	}
	if(gameFilter != defaultFilter) {
		gameInfo.innerHTML += "<br><span style='color:red'>Non-default filter in use!</span>";
	}
    if(currentNode.gameList) {
        for(var i = 0; i < currentNode.gameList.length && i < 50; i++) {
            gameInfo.innerHTML += "<br>" + gameInfoString(currentNode.gameList[i]);
        }
    }
    
	moveList.innerHTML = getMoveListToNode(currentNode);
	drawBoard(getPiecesFromNode(currentNode), currentNode.num);
}

function gameInfoString(game) {
    return "Game <A href=\"http://www.littlegolem.net/jsp/game/game.jsp?gid=" + game.name + "\" target=\"_blank\">#" + game.name + "</A> (<A href=\"" + getTrmphLink(game.gameData) + "\" target=\"_blank\">Trmph</A>) " + game.players + " " + game.winner;
}

function resetClick() {
	currentNode = root;
	refreshView();
}

function backClick() {
	if(currentNode != root)
		currentNode = currentNode.parent;
	refreshView();
}

function swapBoxClicked() {
    if(swapCheckBox.checked) { 
        root = rootSwap;
    } else {
        root = rootNoSwap;
    }
	currentNode = root;
	refreshView();
}

function transBoxClicked() {
    refreshView();
}

function onClick(e) {
	var pos = getMousePosition(e, canvas);
	for(var row = 0; row < BOARD_SIZE; row++) {
		for(var col = SWAP_COL; col < BOARD_SIZE; col++) {
			var x = (getX(row, col) + OFFSET_X) * SCALE;
			var	y = (getY(row, col) + OFFSET_Y) * SCALE;
			var dist2 = (pos.x - x).squared() + (pos.y - y).squared();
			if(dist2 < (SCALE / 2).squared()) {
				//currentNode.branches.push({branches: [], isWhite: !currentNode.isWhite, row: row, col: col});
				currentNode.branches.foreach(function (node) {
					if(node.row == row && node.col == col) {
						currentNode = node;
					}
				});
			}
		}
	}
	refreshView();
}

function drawBoard(pieces, totalGames) {
	canvasContext.fillStyle = makeColorString(255, 255, 255);
	canvasContext.fillRect(0, 0, WIDTH, HEIGHT);
	//Draw the coordinates
	canvasContext.fillStyle = makeColorString(0, 0, 0);
	canvasContext.font = (SCALE / 2).toString() + 'px sans-serif';
	canvasContext.textBaseline = 'middle';
	canvasContext.textAlign = 'center';
	for(var row = 0; row < BOARD_SIZE; row++) {
		canvasContext.fillText((row + 1).toString(), (getX(row, -1) + OFFSET_X) * SCALE, (getY(row, -1) + OFFSET_Y + .1) * SCALE);
	}
	
	for(var col = 0; col < BOARD_SIZE; col++) {
		canvasContext.fillText(ALPHABET[col], (getX(-1, col) + OFFSET_X) * SCALE, (getY(-1, col) + OFFSET_Y) * SCALE);
	}
	
	canvasContext.save();
	canvasContext.scale(SCALE, SCALE);
	canvasContext.translate(OFFSET_X, OFFSET_Y);
	
	//Draw the board
	function drawBack(size, style1, style2, style3) {
		for(var row = 0; row < BOARD_SIZE; row++) {
			for(var col = 0; col < BOARD_SIZE; col++) {
				if((row + col * 2) % 3 == 0)
					canvasContext.fillStyle = style1;
				if((row + col * 2) % 3 == 1)
					canvasContext.fillStyle = style2;
				if((row + col * 2) % 3 == 2)
					canvasContext.fillStyle = style3;
				canvasContext.save();
				canvasContext.translate(getX(row, col), getY(row, col));
				canvasContext.beginPath();
				canvasContext.moveTo(0, size / Math.sqrt(3));
				for(var i = 0; i < 5; i++) {
					canvasContext.rotate(Math.PI / 3);
					canvasContext.lineTo(0, size / Math.sqrt(3));
				}
				canvasContext.closePath();
				
				canvasContext.fill();
				canvasContext.restore();
			}
		}
	}
	drawBack(1.4, makeColorString(200, 150, 90), makeColorString(200, 150, 90), makeColorString(200, 150, 90));
	drawBack(1, makeColorString(240, 190, 130), makeColorString(225, 175, 115), makeColorString(210, 160, 100));
	
	//Draw the lines:
	canvasContext.strokeStyle = makeColorString(100, 70, 50);
	canvasContext.lineWidth = .05;
	canvasContext.beginPath();
			
	for(var row = 0; row < BOARD_SIZE; row++) {
		for(var col = 0; col < BOARD_SIZE; col++) {
			canvasContext.save();
			canvasContext.translate(getX(row, col), getY(row, col));
			canvasContext.moveTo(0, 1 / Math.sqrt(3));
			for(var i = 0; i < 6; i++) {
				canvasContext.rotate(Math.PI / 3);
				canvasContext.lineTo(0, 1 / Math.sqrt(3));
			}
			
			canvasContext.restore();
		}
	}
	canvasContext.stroke();
			
	
	//Draw the edge lines:
	canvasContext.lineWidth = .1;
	canvasContext.lineCap = 'square';
			
	for(var side = 0; side < 6; side++) {
		canvasContext.strokeStyle = side % 3 == 0 ? makeColorString(255, 255, 255)
		                                          : makeColorString(  0,   0,   0);
		if(side % 3 == 1)
			continue;
			
		canvasContext.save();
		canvasContext.beginPath();
		canvasContext.translate(getX((BOARD_SIZE - 1) / 2, (BOARD_SIZE - 1) / 2), getY((BOARD_SIZE - 1) / 2, (BOARD_SIZE - 1) / 2));
		canvasContext.rotate(side * Math.PI / 3);
		canvasContext.translate(-getX((BOARD_SIZE - 1) / 2, (BOARD_SIZE - 1) / 2), -getY((BOARD_SIZE - 1) / 2, (BOARD_SIZE - 1) / 2));
		
		if(side % 3 != 0)
			canvasContext.translate(getX((BOARD_SIZE - 1) / 2, 0), getY((BOARD_SIZE - 1) / 2, 0));
			
		canvasContext.translate(-.08 * .866, .08 / 2);
		
		var col = 0;
		var dist = 1;
		for(var row = BOARD_SIZE - 1; row >= 0; row--) {
			canvasContext.save();
			canvasContext.translate(getX(row, col), getY(row, col));
			if(row == BOARD_SIZE - 1 && col == 0)
				canvasContext.moveTo(0, dist / Math.sqrt(3));
				
			for(var i = 0; i < 2; i++) {
				if(row == 0 && side % 3 != 0 && i == 1) {
					canvasContext.rotate(Math.PI / 6);
					canvasContext.lineTo(0, dist / 2);
				} else if(row == BOARD_SIZE - 1 && side % 3 == 0 && i == 0) {
					canvasContext.rotate(Math.PI / 6);
					canvasContext.moveTo(0, dist / 2);
					canvasContext.rotate(Math.PI / 6);
					canvasContext.lineTo(0, dist / Math.sqrt(3));
				} else {
					canvasContext.rotate(Math.PI / 3);
					canvasContext.lineTo(0, dist / Math.sqrt(3));
				}
			}
			
			canvasContext.restore();
		}
		canvasContext.stroke();
		canvasContext.restore();
	}
    
    var maxNum = 1;
    pieces.foreach(function (piece) {
        if(piece.info) {
            maxNum = Math.max(maxNum, piece.num);
        }
    });
	maxNum = Math.min(maxNum, 600);
	
	pieces.foreach(function (piece) {
		canvasContext.save();
        if(piece.info && transCheckBox.checked) {
            canvasContext.globalAlpha = 0.35 + 0.65 * piece.num / maxNum;
        }
		canvasContext.translate(getX(piece.row, piece.col), getY(piece.row, piece.col));
		if(piece.swap) {
			canvasContext.fillStyle = makeColorString(0, 0, 0);
			canvasContext.beginPath();
			canvasContext.moveTo(0, 0);
			canvasContext.arc(0, 0, .5, 0, 2 * Math.PI);
			canvasContext.fill();
			
			canvasContext.save();
			canvasContext.scale(1/ SCALE, 1/SCALE);
			canvasContext.font = (SCALE / 2).toString() + 'px sans-serif';
			canvasContext.textBaseline = 'middle';
			canvasContext.textAlign = 'center';
			canvasContext.fillText("Swap", 0, -SCALE * .8);
			canvasContext.restore();
		}
		
		canvasContext.fillStyle = (piece.player == PLAYER_ENUM.WHITE ? makeColorString(255, 255, 255) : makeColorString(0, 0, 0));
		canvasContext.beginPath();
		canvasContext.moveTo(0, 0);
		canvasContext.arc(0, 0, .45, 0, 2 * Math.PI);
		canvasContext.fill();
		if(piece.info) {
			canvasContext.scale(1/ SCALE, 1/SCALE);
			canvasContext.fillStyle = (piece.player == PLAYER_ENUM.WHITE ? makeColorString(0, 0, 0) : makeColorString(255, 255, 255));
			canvasContext.font = (SCALE / 3).toString() + 'px sans-serif';
			canvasContext.textBaseline = 'middle';
			canvasContext.textAlign = 'center';
			canvasContext.fillText(piece.num.toString(), 0, -SCALE / 6);
			//canvasContext.fillText((Math.round(1000 * piece.num/totalGames)/10).toString(), 0, -SCALE / 6);
			if(piece.win == piece.num)
				canvasContext.scale(.8, 1);
			canvasContext.fillText(Math.round(100 * piece.win / piece.num).toString() + "%", 0, SCALE / 6);
		}
		canvasContext.restore();
	});
	
	
	canvasContext.restore();
}

function getPiecesFromNode(node) {
	var pieces = [];
    node.branches.foreach(function (subNode) {
        if(!node.isRoot || subNode.num >= FIRST_MOVE_CUTOFF)
		    pieces.push(subNode);
	});
	while(!node.isRoot) {
		if(node.swap) {
			pieces.push({player: node.player, row: node.parent.col, col: node.parent.row});
			break;
		}
		pieces.push({player: node.player, row: node.row, col: node.col});
		
		node = node.parent;
	}
	
	return pieces;
}

function getMoveListToNode(node) {
	var moves = [];
	var moveNum = getMoveNum(node);
	function getMoveNum(node) {
		moveNum = 0;
		while(!node.isRoot) {
			moveNum++;
			node = node.parent;
		}
		return moveNum;
	}
	while(!node.isRoot) {
		if(node.swap) {
			moves.push({num: moveNum.toString(), body: "swap"});
		} else {
			moves.push({num: moveNum.toString(), body: ALPHABET[node.col] + (node.row + 1).toString()});
		}
		moveNum--;
		node = node.parent;
	}
	var moveString = "<table class = \"table-movelist\"><tbody>";
	for(var i = moves.length - 1; i >= 0; i--) {
		moveString += "<tr><td class=\"td-turn\">" + moves[i].num + ".</td><td class=\"td-move\">" + moves[i].body + "</td>";
	}
	return moveString + "</tbody></table>";
}

function getGameFromNode(node) {
	while(node.branches.length > 0)
		node = node.branches[0];
	return node.gameList[0];
}

function gameHasSwap(game) {
	for(var i = 0; i < game.length; i += 2) {
		var char1 = game[i];
		var char2 = game[i + 1];
		if(char1 == '.') {
			if(char2 == 's') {
                return true;
            }
        }
    }
}

function getTrmphLink(game) {
    //Ex: http://www.trmph.com/hex/board#13,d1d1k10k12h6i7f7f3j5k2k3f10e9d11g9g11c10b12h10h12j12j11k11j10k9j9k8j8k7j6l5k5l4k4l3m1j3j2h3g2i1i3h5h4g4g5f5f6
    var moveListString = "";
    var firstMoveSwapped = "";
	for(var i = 0; i < game.length; i += 2) {
		var char1 = game[i];
		var char2 = game[i + 1];
		if(char1 == '.') {
			if(char2 == 's') { 
                //swap
                moveListString = firstMoveSwapped + firstMoveSwapped; //This is how trmph does it...
			} else if(char2 == 'r') {
				break;
			}
		} else {
			var col = ALPHA_LOOKUP[char1];
			var row = ALPHA_LOOKUP[char2];
			moveListString += ALPHABET[col] + (row+1).toString();
            firstMoveSwapped = ALPHABET[row] + (col+1).toString();
		}
	}
    return "http://www.trmph.com/hex/board#13," + moveListString.toLowerCase();
}

function addGame(root, game, winner, gameName, playerBlack, playerWhite, rotate, noswap) {
	var player = PLAYER_ENUM.BLACK;
	var node = root;
    var swapMoves = false;
    var players = playerBlack + "(B)" + " vs " + playerWhite + "(W)";
    if(gameHasSwap(game) && noswap) {
        winner = (winner == PLAYER_ENUM.BLACK ? PLAYER_ENUM.WHITE : PLAYER_ENUM.BLACK);
        players = playerWhite + "(B)" + " vs " + playerBlack + "(W)";
        
    }
    
	for(var i = 0; i < game.length; i += 2) {
		var char1 = game[i];
		var char2 = game[i + 1];
		var branch = null;
		if(char1 == '.') {
			if(char2 == 's') {
				if(noswap) { //Pretend this move doesn't exist
                    swapMoves = true;
                    continue;
                }
				for(var j = 0; j < node.branches.length; j++) {
					if(node.branches[j].swap) {
						branch = node.branches[j];
						break;
					}
				}
				if(branch == null) {
					branch = {branches: [], parent: node, player: player, swap: true, row: SWAP_ROW, col: SWAP_COL, info: true, num: 0, win: 0};
					node.branches.push(branch);
				}
			} else if(char2 == 'r') {
				break;
			}
		} else {
			var col = ALPHA_LOOKUP[char1];
			var row = ALPHA_LOOKUP[char2];
            if(swapMoves) {
                var tempRow = row;
                row = col;
                col = tempRow;
            }
			if(rotate) {
				row = BOARD_SIZE - 1 - row;
				col = BOARD_SIZE - 1 - col;
			}
			for(var j = 0; j < node.branches.length; j++) {
				if(node.branches[j].row == row && node.branches[j].col == col) {
					branch = node.branches[j];
					break;
				}
			}
			if(branch == null) {
				branch = {branches: [], parent: node, player: player, row: row, col: col, info: true, num: 0, win: 0};
				node.branches.push(branch);
			}
		}
		branch.num++;
		if(player == winner)
			branch.win++;
		
		node = branch;
    	
        if(!node.gameList)
    		node.gameList = [];
		
    	node.gameList.push({name: gameName, players: players, gameData: game, winner: winner == PLAYER_ENUM.BLACK ? "1-0" : "0-1"});
        
        player = (player == PLAYER_ENUM.BLACK ? PLAYER_ENUM.WHITE : PLAYER_ENUM.BLACK);
	
	}
}

//////////
// Init //
//////////
var canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;

var gameInfo = document.getElementById("gameInfo");
var moveList = document.getElementById("moveList");


canvas.addEventListener("click", onClick, false);

var canvasContext = canvas.getContext("2d");

var rootSwap = {branches: [], isRoot: true, num: 0};
var rootNoSwap = {branches: [], isRoot: true, num: 0};

var numGames = 0;

games.foreach(function(game) {
    //if(parseInt(game.game) >= GAME_NUM_CUTOFF) {
	if(gameFilter(game)) {
        numGames++;
    	addGame(rootSwap, game.data, game.win_b ? PLAYER_ENUM.BLACK : PLAYER_ENUM.WHITE, game.game, game.black, game.white, true , false);
    	addGame(rootSwap, game.data, game.win_b ? PLAYER_ENUM.BLACK : PLAYER_ENUM.WHITE, game.game, game.black, game.white, false, false);
    	addGame(rootNoSwap, game.data, game.win_b ? PLAYER_ENUM.BLACK : PLAYER_ENUM.WHITE, game.game, game.black, game.white, true , true);
    	addGame(rootNoSwap, game.data, game.win_b ? PLAYER_ENUM.BLACK : PLAYER_ENUM.WHITE, game.game, game.black, game.white, false, true);
    }
});
rootSwap.num = numGames;
rootNoSwap.num = numGames;


var root;
if(swapCheckBox.checked) { 
    root = rootSwap;
} else {
    root = rootNoSwap;
}
var currentNode = root;
refreshView();



