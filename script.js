let game = new Chess();
let board = null;
let playAgainstAI = false;
let aiDepth = 2;
const $status = $('#status');

function startGame(againstAI) {
    playAgainstAI = againstAI;
    $('#game-mode').hide();
    $('#board').show();
    $('#status').show();

    board = Chessboard('board', config());
    updateStatus();
}

function makeAIMove() {
    if (playAgainstAI) {
        const bestMove = getBestMove(aiDepth);
        game.move(bestMove);
        board.position(game.fen());
        updateStatus();
    }
}

function onDragStart(source, piece) {
    if (game.game_over()) {
        return false;
    }
    if (playAgainstAI && piece.search(/^b/) !== -1) {
        return false;
    }
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });

    if (move === null) {
        return 'snapback';
    }

    updateStatus();

    if (playAgainstAI) {
        window.setTimeout(makeAIMove, 250);
    }
}

function updateStatus() {
    let status = '';
    const moveColor = game.turn() === 'b' ? 'Black' : 'White';

    if (game.in_checkmate()) {
        status = `Game over, ${moveColor} is in checkmate.`;
    } else if (game.in_draw()) {
        status = 'Game over, drawn position.';
    } else {
        status = `${moveColor} to move`;
        if (game.in_check()) {
            status += `, ${moveColor} is in check`;
        }
    }

    $status.html(status);
}

function config() {
    return {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        orientation: 'white',
        pieceTheme: '{piece}.png'
    };
}

function getBestMove(depth) {
    let bestMove = null;
    let bestValue = -Infinity;
    const moves = game.moves();

    for (const move of moves) {
        game.move(move);
        const boardValue = minimax(depth - 1, -Infinity, Infinity, false);
        game.undo();

        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }

    return bestMove;
}

function minimax(depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0 || game.game_over()) {
        return evaluateBoard();
    }

    const moves = game.moves();

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const eval = minimax(depth - 1, alpha, beta, false);
            game.undo();
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                break;
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const eval = minimax(depth - 1, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                break;
            }
        }
        return minEval;
    }
}

function evaluateBoard() {
    let totalEvaluation = 0;
    const board = game.board();
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece !== null) {
                totalEvaluation += getPieceValue(piece);
            }
        }
    }
    return totalEvaluation;
}

function getPieceValue(piece) {
    let value = 0;
    switch (piece.type) {
        case 'p': value = 10; break; // Pawn
        case 'r': value = 50; break; // Rook
        case 'n': value = 30; break; // Knight
        case 'b': value = 30; break; // Bishop
        case 'q': value = 90; break; // Queen
        case 'k': value = 900; break; // King
    }
    return piece.color === 'w' ? value : -value;
}

$('#human').on('click', function () {
    startGame(false);
});

$('#computer').on('click', function () {
    startGame(true);
});
