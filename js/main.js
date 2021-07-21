'use strict';


//Global variables

//gBoard - A Matrix containing cell objects:

// Each cell: 
// { minesAroundCount: 4, 
//   isShown: true, 
//   isMine: false, 
//   isMarked: true 
// }



// gLevel - This is an object by which the board size is set (in this case: 4x4 board and how many mines to put)
// gLevel = { 
//     SIZE: 4, 
//     MINES: 2 
// };



// gGame - This is an object in which you can keep and update the current game state: 
// isOn: Boolean, when true we let the user play 
// shownCount: How many cells are shown 
// markedCount: How many cells are marked (with a flag)
// secsPassed: How many seconds passed
// gGame = { 
//     isOn: false, 
//     shownCount: 0, 
//     markedCount: 0, 
//     secsPassed: 0 
// }

var sizeToMineMap = {
    '4': 2,
    '8': 12,
    '12': 30
}

var statusToClassMap = {
    '0': 'hd_type0',
    '1': 'hd_type1',
    '2': 'hd_type2',
    '3': 'hd_type3',
    '4': 'hd_type4',
    '5': 'hd_type5',
    '6': 'hd_type6',
    '7': 'hd_type7',
    '8': 'hd_type8',
    '9': 'hd_type9',
    'isExploded': 'hd_mine_red',
    'isShownFalse': 'hd_closed',
    'isMine': 'hd_mine',
    'isMarked': 'hd_flag',
    'isOff': 'face_lost',
    'isOn': 'face_unpressed',
}

var gLevel;
var gBoard;
var gGame;
var gIsFirstPress;

// This is called when page loads 
function initGame() {
    gIsFirstPress = true;
    gGame = createGame();
    if (!gLevel) gLevel = createLevel(4, 2);
    gBoard = buildBoard();
    console.log('gBoard',gBoard);

    renderBoard(gBoard);
}

function createGame() {
    return {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0
    };
}

function createLevel(size, mines) {
    return {
        SIZE: size,
        MINES: mines
    };
}

function createCell(minesAroundCount, isShown, isMine, isMarked, isExploded = false) {
    return {
        minesAroundCount: minesAroundCount,
        isShown: isShown,
        isMine: isMine,
        isMarked: isMarked,
        isExploded: isExploded
    }
}

// Builds the board 
// Set mines at random locations Call 
// Return the created board 
function buildBoard() {
    var board = createMat(gLevel.SIZE, gLevel.SIZE);

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            board[i][j] = createCell(0, false, false, false);
        }
    }

    var emptyCells = getEmptyCells(board);

    //Add mines in empty cells
    for (var i = 0; i < gLevel.MINES; i++) {
        var emptyCellIdx = drawObject(emptyCells);
        board[emptyCellIdx.i][emptyCellIdx.j] = createCell(0, false, true, false);
    }

    return board;
}

// Render the board as a <table> to the page 
function renderBoard(board) {

    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            var cellClass = '';

            if (!currCell.isShown && gGame.isOn) {
                cellClass = statusToClassMap['isShownFalse'];
            } else if ((currCell.isShown || !gGame.isOn) && !currCell.isMine) {
                cellClass = statusToClassMap[currCell.minesAroundCount + ''];
            } else if ((currCell.isShown || !gGame.isOn) && currCell.isMine && !currCell.isExploded) {
                cellClass = statusToClassMap['isMine'];
            } else if ((currCell.isShown || !gGame.isOn) && currCell.isMine && currCell.isExploded) {
                cellClass = statusToClassMap['isExploded'];
            } else if (gGame.isOn && !currCell.isShown && currCell.isMarked) {
                cellClass = statusToClassMap['isMarked'];
            } else if (!gGame.isOn && !currCell.isShown && currCell.isMarked) {
                cellClass = (currCell.isMine) ? statusToClassMap['isMarked'] : statusToClassMap[currCell.minesAroundCount + ''];
            } 

            strHTML += `\t<td class="cell size24 cell-${i}-${j} ${cellClass}" onclick="cellClicked(this,${i},${j})" >\n \t</td>\n`;
        }
        strHTML += '</tr>\n';
    }
    // console.log('strHTML is:');
    // console.log(strHTML);
    var elBoard = document.querySelector('.board');
   
    elBoard.innerHTML = strHTML;
}

function chooseLevel(size) {
    gLevel = createLevel(size, sizeToMineMap[size + ''])
    initGame();
}

// Count mines around each cell and set the cell's minesAroundCount.
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            {
                var currCell = board[i][j];
                if (!currCell.isMine) {
                    currCell.minesAroundCount = countMinesNeighbors(i, j, board);
                }
            }
        }
    }
}

function countMinesNeighbors(cellI, cellJ, board) {
    var neighborsMinesCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= board[i].length) continue;
            var currCell = board[i][j]
            if (currCell.isMine) neighborsMinesCount++;
        }
    }
    return neighborsMinesCount;
}

function showNeighbors(cellI, cellJ, board) {
    var neighborsMinesCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= board[i].length) continue;
            var currCell = board[i][j];
            if (currCell.isShown) continue
            if (!currCell.isMine) {
                var elCell = document.querySelector('.'+getClassName(i,j));
                renderCellReplaceClass(elCell, statusToClassMap['isShownFalse'], statusToClassMap[currCell.minesAroundCount+'']);
            }
        }
    }
    return neighborsMinesCount;
}

//Called when a cell (td) is clicked
function cellClicked(elCell, i, j) {
    var currCell = gBoard[i][j];

    if (gIsFirstPress) {
        gIsFirstPress = false;
        if (gBoard[i][j].isMine) {
            var emptyCells = getEmptyCells(gBoard);
            var emptyCellIdx = drawObject(emptyCells);
            gBoard[emptyCellIdx.i][emptyCellIdx.j] = createCell(0, false, true, false);
            currCell = createCell(0, false, false, false);
        }

        setMinesNegsCount(gBoard);
        console.table(gBoard);
    }

    if (currCell.isMarked) return
    if (currCell.isShown) return

    currCell.isShown = true;

    if (currCell.isMine) {
        gGame.isOn = false;
        currCell.isExploded = true;
        renderBoard(gBoard);
    }

    if (!currCell.isMine) {
        renderCellReplaceClass(elCell, statusToClassMap['isShownFalse'], statusToClassMap[currCell.minesAroundCount+'']);

        if(currCell.minesAroundCount === 0) showNeighbors(i, j, gBoard);
    } 

    checkGameOver();
}

function renderCell(elCell, location, value) {
	var cellSelector = '.' + getClassName(location) // .cell-i-j
	var elCell = document.querySelector(cellSelector);
	elCell.class = value;
}

//Called on right click to mark a cell (suspected to be a mine) 
//Search the web (and implement) how to hide the context menu on right click
function cellMarked(elCell) {


    
}

//Game ends when all mines are marked, and all the other cells are shown
function checkGameOver() {
    

}


//When user clicks a cell with no mines around, 
//we need to open not only that cell, but also its neighbors. 
//NOTE: start with a basic implementation that only opens the non-mine 1st degree neighbors 
//BONUS: if you have the time later, try to work more like 
//the real algorithm (see description at the Bonuses section below)
function expandShown(board, elCell, i, j) {

}

function getEmptyCells(board) {
    var res = [];

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            if (!(currCell.isMine || currCell.isMarked || currCell.isShown)) {
                res.push({ i: i, j: j });
            }
        }
    }

    return res;
}
