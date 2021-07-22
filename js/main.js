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

var sizeToLivesMap = {
    '4': 1,
    '8': 2,
    '12': 3
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
    'face_lost': 'face_lost',
    'face_unpressed': 'face_unpressed',
    'face_win': 'face_win'
}

var gLevel;
var gBoard;
var gGame;
var gIsFirstPress;
var gStartTime;
var gTimerInterval;


// This is called when page loads 
function initGame() {

    gIsFirstPress = true;
    if (!gLevel) gLevel = createLevel(4, 2);

    gGame = createGame();
    gBoard = buildBoard();

    renderBoard(gBoard);
    clearTimerInterval();
    renderTimerToZero();
    renderLives();
    renderBombsLeft();
}

function createGame() {
    return {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: sizeToLivesMap[gLevel.SIZE],
        minesExploded: 0
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

            strHTML += `\t<td class="cell size24 cell-${i}-${j} ${cellClass}"
                        oncontextmenu="cellMarked(event,this,${i},${j})"
                        onclick="cellClicked(this,${i},${j})" >\n \t</td>\n`;
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


//Called when a cell (td) is clicked
function cellClicked(elCell, i, j) {
    if(!gGame.isOn)  return;

    if (!gTimerInterval) startTimer();

    var currCell = gBoard[i][j];
    if (currCell.isMarked) return;
    if (currCell.isShown) return;
    currCell.isShown = true;
    gGame.shownCount++;

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

    if (currCell.isMine) {
        currCell.isExploded = true;
        gGame.minesExploded++;
        gGame.markedCount++;

        if (gGame.lives > 0) {
            gGame.lives--;
            renderLives();
            renderBombsLeft();
        } else {
            gGame.isOn = false;
        }

        if (!gGame.isOn) {
            debugger;
            faceChange('face_lose');
            clearTimerInterval();
            renderBoard(gBoard);
        } else {
            renderReplaceClass(elCell, statusToClassMap['isShownFalse'], statusToClassMap['isExploded']);
        }

        renderLives();
    }

    if (!currCell.isMine) expandShown(gBoard, elCell, i, j);

    checkGameOver();
}

//Called on right click to mark a cell (suspected to be a mine) 
//Search the web (and implement) how to hide the context menu on right click
function cellMarked(event, elCell, i, j) {
    event.preventDefault();

    if (!gTimerInterval) startTimer();
    if (!gTimerInterval) startTimer();
  

    var currCell = gBoard[i][j];
    if (currCell.isShown) return;
    if (!currCell.isMarked) {
        if (gLevel.MINES - gGame.markedCount <= 0) return;
        gGame.markedCount++;
        currCell.isMarked = true;
        renderReplaceClass(elCell, statusToClassMap['isShownFalse'], statusToClassMap['isMarked']);
        renderBombsLeft();
    } else {
        gGame.markedCount--;
        currCell.isMarked = false;
        renderReplaceClass(elCell, statusToClassMap['isMarked'], statusToClassMap['isShownFalse']);
        renderBombsLeft();
    }
}


//Game ends when all mines are marked, and all the other cells are shown
function checkGameOver() {
    debugger;

    if (checkIsGameWinned()) {
        clearTimerInterval();
        faceChange('face_win');
    }
}

function checkIsGameWinned() {
    debugger;
    if (!gGame.isOn) return false;

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var currCell = gBoard[i][j];
            if (currCell.isMarked && !currCell.isMine) return false;
            if (!currCell.isShown && !currCell.isMine) return false;
            if (!currCell.isMarked && currCell.isMine && !currCell.isExploded) return false;
        }
    }

    return true;
}

//When user clicks a cell with no mines around, 
//we need to open not only that cell, but also its neighbors. 
//NOTE: start with a basic implementation that only opens the non-mine 1st degree neighbors 
//BONUS: if you have the time later, try to work more like 
//the real algorithm (see description at the Bonuses section below)
function expandShown(board, elCell, i, j) {
    var currCell = gBoard[i][j];
    renderReplaceClass(elCell, statusToClassMap['isShownFalse'], statusToClassMap[currCell.minesAroundCount + '']);
    if (currCell.minesAroundCount === 0) showNeighbors(i, j, board);
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
                currCell.isShown = true;
                gGame.shownCount = true;
                var elCell = document.querySelector('.' + getClassName(i, j));
                renderReplaceClass(elCell, statusToClassMap['isShownFalse'], statusToClassMap[currCell.minesAroundCount + '']);
            }
        }
    }
    return neighborsMinesCount;
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

function startTimer() {
    renderTimerToZero();
    gStartTime = Date.now();
    gTimerInterval = setInterval(function () {
        var msDiff = Date.now() - gStartTime;
        gGame.secsPassed = msDiff / 1000;

        var secs = '' + parseInt((msDiff / 1000) % 60);
        if (secs.length === 1) secs = '0' + secs;
        var min = '' + parseInt(msDiff / 1000 / 60);
        if (min.length === 1) min = '0' + min;

        var strMsDiff = '' + msDiff;

        var miliSecs = strMsDiff.charAt(strMsDiff.length - 3) +
            strMsDiff.charAt(strMsDiff.length - 2);

        if (miliSecs.length === 1) miliSecs = '0' + miliSecs;

        var passedTime = `${min}:${secs}.${miliSecs}`;
        var elTimer = document.querySelector('.timer');
        elTimer.innerText = passedTime;
    },
        10);
}

function renderTimerToZero() {
    var elTimer = document.querySelector('.timer');
    if (!gTimerInterval)
        elTimer.innerText = '00:00.00';
}

function renderLives() {
    var elLives = document.querySelector('.lives');
    elLives.innerText = gGame.lives;
}

function clearTimerInterval() {
    if (gTimerInterval) {
        clearInterval(gTimerInterval);
        gTimerInterval = null;
    }
}

function renderBombsLeft() {
    var elBombsLeft = document.querySelector('.bombs-left');
    elBombsLeft.innerText = (gLevel.MINES - gGame.markedCount <= 0) ? 0 : gLevel.MINES - gGame.markedCount;
}

function faceClicked() {
    faceChange('face_unpressed');
    initGame();
}

function faceChange(face_class) {
    var elFace = document.querySelector('.face');

    elFace.classList.remove('face_unpressed');
    elFace.classList.remove('face_lose');
    elFace.classList.remove('face_win');
    elFace.classList.add(face_class);
}
