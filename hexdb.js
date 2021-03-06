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
var gameFilter = defaultFilter;

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

function refreshView(showAll) {
	if(currentNode.num == 1) {
        gameInfo.textContent = "1 game in database"
	} else {
		gameInfo.textContent = currentNode.num.toString() + " games in database";
	}
	if(gameFilter != defaultFilter) {
		gameInfo.appendChild(document.createElement("br"));
		var ndfSpan = document.createElement("span");
		ndfSpan.setAttribute("style", "color:red");
		ndfSpan.textContent = "Non-default filter in use!";
		gameInfo.appendChild(ndfSpan);
	}
    if(currentNode.gameList) {
		currentNode.gameList.sort(function(a, b) {return parseInt(a.name, 10) - parseInt(b.name, 10);})
		var MAX_SHOWN = 50;
		if(showAll) {
			MAX_SHOWN = Number.MAX_VALUE;
		}
        for(var i = 0; i < currentNode.gameList.length && (i < MAX_SHOWN); i++) {
			var game = currentNode.gameList[i];
            gameInfo.appendChild(document.createElement("br"));
			
			gameInfo.insertAdjacentText('beforeend', "Game ");

			var lgLink = document.createElement("a");
			lgLink.setAttribute("href", "http://www.littlegolem.net/jsp/game/game.jsp?gid=" + game.name);
			lgLink.setAttribute("target", "_blank");
			lgLink.textContent = "#" + game.name;
			gameInfo.appendChild(lgLink);
			gameInfo.insertAdjacentText('beforeend', " (");
			
			var trmphLink = document.createElement("a");
			//trmphLink.setAttribute("href", getTrmphLink(game.gameData));
			trmphLink.setAttribute("href", "https://www.trmph.com/hex/game/lg-" + game.name);
			trmphLink.setAttribute("target", "_blank");
			trmphLink.textContent = "Trmph";
			gameInfo.appendChild(trmphLink);
			
			gameInfo.insertAdjacentText('beforeend', ") " + game.players + " " + game.winner);

        }
		if(i == MAX_SHOWN && currentNode.gameList.length > MAX_SHOWN) {
			gameInfo.appendChild(document.createElement("br"));
			
			var showAllLink = document.createElement("a");
			showAllLink.classList.add("showall");
			showAllLink.textContent = "(Show all)";
			showAllLink.addEventListener("click", function() {refreshView(true);});
			gameInfo.appendChild(showAllLink);
		}
    }
    
	moveList.innerHTML = getMoveListToNode(currentNode);
	drawBoard(getPiecesFromNode(currentNode), currentNode.num);
}


function resetClick() {
	currentNode = root;
	refreshView(false);
}

function backClick() {
	if(currentNode != root)
		currentNode = currentNode.parent;
	refreshView(false);
}

function swapBoxClicked() {
    init();
	refreshView(false);
}

document.getElementById("selectSize").onchange = function (e) {
	switch(e.target.value) {
		case "11": BOARD_SIZE = 11; break;
		case "13": BOARD_SIZE = 13; break;
		case "15": BOARD_SIZE = 15; break;
		case "19": BOARD_SIZE = 19; break;
	}
	init();
	refreshView(false);
}

function transBoxClicked() {
    refreshView(false);
}

function getClickHandler(row, col) {
	return function(e) {
		currentNode.branches.foreach(function (node) {
			if(node.row == row && node.col == col) {
				currentNode = node;
			}
		});
		refreshView(false);
	}
}

function drawBoard(pieces, totalGames) {
	var boardElem = document.getElementById("board");
	boardElem.textContent = "";
	var boardBuilder = getBuilder(boardElem);

	for(var row = 0; row < BOARD_SIZE; row++) {
		for(var col = 0; col < BOARD_SIZE; col++) {
			var hexClass = "";
			if((row + col * 2) % 3 == 0)
				hexClass = "hexagon1";
			if((row + col * 2) % 3 == 1)
				hexClass = "hexagon2";
			if((row + col * 2) % 3 == 2)
				hexClass = "hexagon3";
			boardBuilder.hex(row, col, {"class": hexClass}, {})
		}
	}

	boardBuilder.edge(0, 0, 0, BOARD_SIZE, Colors.BLACK, EdgeEnds.ACUTE, EdgeEnds.OBTUSE, {}, {});
	boardBuilder.edge(1, 0, BOARD_SIZE-1, BOARD_SIZE, Colors.WHITE, EdgeEnds.OBTUSE, EdgeEnds.ACUTE, {}, {});
	boardBuilder.edge(3, BOARD_SIZE-1, BOARD_SIZE-1, BOARD_SIZE, Colors.BLACK, EdgeEnds.ACUTE, EdgeEnds.OBTUSE, {}, {});
	boardBuilder.edge(4, BOARD_SIZE-1, 0, BOARD_SIZE, Colors.WHITE, EdgeEnds.OBTUSE, EdgeEnds.ACUTE, {}, {});

	for(var col = 0; col < BOARD_SIZE; col++) {
		boardBuilder.drawLabel(ALPHABET[col], -.65, col - .1, {"class": "labelBlackStone"}, {});
		
	}
	for(var row = 0; row < BOARD_SIZE; row++) {
		boardBuilder.drawLabel((row + 1).toString(), row - .1, -.65, {"class": "labelWhiteStone"}, {});
	}

	var maxNum = 1;
    pieces.foreach(function (piece) {
        if(piece.info) {
            maxNum = Math.max(maxNum, piece.num);
        }
    });
	maxNum = Math.min(maxNum, 600);
	
	pieces.foreach(function (piece) {
		if(piece.swap) {
			boardBuilder.text("Swap", getX(piece.row, piece.col), getY(piece.row, piece.col) + UPSCALE * .7, {"class": "labelSwap"}, {});
		}

		var opacity = 1;
		if(piece.info && transCheckBox.checked) {
			opacity = 0.35 + 0.65 * piece.num / maxNum;
		}
		boardBuilder.startGroup({"opacity": opacity}, {"click": getClickHandler(piece.row, piece.col)});
		

		boardBuilder.stone(piece.row, piece.col, 
			{
				"class": piece.player == PLAYER_ENUM.WHITE ? "whiteStone" : "blackStone",
			}, 
			{
				
			}
		);
		if(piece.info) {
			boardBuilder.drawLabelTop(piece.num.toString(), piece.row, piece.col, 
				{
					"class": piece.player == PLAYER_ENUM.WHITE ? "labelWhiteStone" : "labelBlackStone"

				}, 
				{}
			);

			boardBuilder.drawLabelBottom(Math.round(100 * piece.win / piece.num).toString() + "%", piece.row, piece.col, 
				{
					"class": piece.player == PLAYER_ENUM.WHITE ? "labelWhiteStone" : "labelBlackStone",
					"style": piece.win == piece.num ? "letter-spacing: -1px" : ""
				}, 
				{}
			);
		}
		boardBuilder.endGroup();
	});
	

	var boundingBox = getInitBoundingBox();
	updateBoundingBox(boundingBox, getX(-1, -1), getY(-1, -1));
	updateBoundingBox(boundingBox, getX(-1, BOARD_SIZE), getY(-1, BOARD_SIZE));
	updateBoundingBox(boundingBox, getX(BOARD_SIZE, BOARD_SIZE), getY(BOARD_SIZE, BOARD_SIZE));
	updateBoundingBox(boundingBox, getX(BOARD_SIZE, -1), getY(BOARD_SIZE, -1));
	
	var width = (boundingBox.right - boundingBox.left);
	var height = (boundingBox.bottom - boundingBox.top);
	
	boardElem.setAttribute("viewBox", boundingBox.left.toString() + " " + boundingBox.top.toString() + " " + width.toString() + " " + height.toString() );

	return;
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
    return "http://www.trmph.com/hex/board#" + BOARD_SIZE.toString() + "," + moveListString.toLowerCase();
}

function addGame(root, game, winner, gameName, playerBlack, playerWhite, rotate, noswap, boardSize) {
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
				row = boardSize - 1 - row;
				col = boardSize - 1 - col;
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
var gameInfo = document.getElementById("gameInfo");
var moveList = document.getElementById("moveList");

var rootSwap11;
var rootNoSwap11;
var rootSwap13;
var rootNoSwap13;
var rootSwap15;
var rootNoSwap15;
var rootSwap19;
var rootNoSwap19;
var root;
var currentNode;

function loadData() {
	function getEmptyRoot() {return {branches: [], isRoot: true, num: 0};}
	function addGamesToRoot(games, rootSwap, rootNoSwap, boardSize) {
		var numGames = 0;

		games.foreach(function(game) {
			//if(parseInt(game.game) >= GAME_NUM_CUTOFF) {
			if(gameFilter(game)) {
				numGames++;
				addGame(rootSwap, game.data, game.win_b ? PLAYER_ENUM.BLACK : PLAYER_ENUM.WHITE, game.game, game.black, game.white, true , false, boardSize);
				addGame(rootSwap, game.data, game.win_b ? PLAYER_ENUM.BLACK : PLAYER_ENUM.WHITE, game.game, game.black, game.white, false, false, boardSize);
				addGame(rootNoSwap, game.data, game.win_b ? PLAYER_ENUM.BLACK : PLAYER_ENUM.WHITE, game.game, game.black, game.white, true , true, boardSize);
				addGame(rootNoSwap, game.data, game.win_b ? PLAYER_ENUM.BLACK : PLAYER_ENUM.WHITE, game.game, game.black, game.white, false, true, boardSize);
			}
		});
		rootSwap.num = numGames;
		rootNoSwap.num = numGames;
	}

	rootSwap11  = getEmptyRoot();
	rootNoSwap11  = getEmptyRoot();
	rootSwap13  = getEmptyRoot();
	rootNoSwap13  = getEmptyRoot();
	rootSwap15  = getEmptyRoot();
	rootNoSwap15  = getEmptyRoot();
	rootSwap19  = getEmptyRoot();
	rootNoSwap19  = getEmptyRoot();

	addGamesToRoot(games11, rootSwap11, rootNoSwap11, 11);
	addGamesToRoot(games  , rootSwap13, rootNoSwap13, 13);
	addGamesToRoot(games15, rootSwap15, rootNoSwap15, 15);
	addGamesToRoot(games19, rootSwap19, rootNoSwap19, 19);
}

function init() {
	if(swapCheckBox.checked) { 
		switch (BOARD_SIZE) {
			case 11:
				root = rootSwap11;
				break;
			case 13:
				root = rootSwap13;
				break;
			case 15:
				root = rootSwap15;
				break;
			case 19:
				root = rootSwap19;
				break;
 	   		default:
				throw "Unknown size";
		}
	} else {
		switch (BOARD_SIZE) {
			case 11:
				root = rootNoSwap11;
				break;
			case 13:
				root = rootNoSwap13;
				break;
			case 15:
				root = rootNoSwap15;
				break;
			case 19:
				root = rootNoSwap19;
				break;
 	   		default:
				throw "Unknown size";
		}
	}
	currentNode = root;
}

loadData();
init();
refreshView(false);

window.onload = function () {
	var a = "matt", d = "hew.seymour", b = "&#064;", f = "gma", c = "il.com";
	var e = document.getElementById("questions");
	e.innerHTML = "Questions or comments? Contact me at <a href='mailto:" + a + d + b + f + c + "'>" + a + d + b + f + c + "</a>";
}


