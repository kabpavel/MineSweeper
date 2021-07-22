'use strict';

function createMat(ROWS, COLS) {
    var mat = []
    for (var i = 0; i < ROWS; i++) {
        var row = []
        for (var j = 0; j < COLS; j++) {
            row.push('')
            console.log('row',row)
        }
        mat.push(row)
    }
    return mat
}

function renderReplaceClass(element,remove,add) {
    element.classList.remove(remove);
    element.classList.add(add);
}

function drawObject(arr) {
    if (arr.length === 0) return null;

    var idx = getRandomInteger(0, arr.length);
    var object = arr.splice(idx, 1)[0];

    return object;
}

function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    var randomNum = Math.floor(Math.random() * (max - min) + min);
    return randomNum;
}

function getClassName(cellI, cellJ) {
	var cellClass = `cell-${cellI}-${cellJ}`;
	return cellClass;
}



