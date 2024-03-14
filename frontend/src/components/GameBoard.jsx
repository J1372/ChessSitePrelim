import { useEffect, useRef } from "react";
import { Color } from "chessgameplay";

export function convertSquare(square, board, perspective) {
    if (perspective === Color.White) {
        return { row: (board.rows - 1) - square.row, col: square.col};
    } else {
        return { row: square.row, col: (board.cols - 1) - square.col};
    }
}

// ClickHandler will receive the square clicked on.
export default function GameBoard({ board, perspective, moveUpdate, clickHandler, selected }) {
    const canvas = useRef(null);

    // Translates x, y event coords into a square on the canvas and calls provided clickhandler.
    // Passes in calculated square and also canvas for further rendering extension.
    function callClickHandler(event) {
        const canvasBoard = canvas.current;
        
        // translate click coords to square.
        // normal board, width == height, but calculating separately width and height more extensible.
        const squareWidth = canvasBoard.width / board.cols;
        const file = Math.floor(event.nativeEvent.offsetX / squareWidth);
        const squareHeight = canvasBoard.height / board.cols;
        const rank = Math.floor(event.nativeEvent.offsetY / squareHeight);

        // Not taking into account perspective.
        const clickedGraphical = {
            row: rank,
            col: file
        };
    
        // Convert based on perspective.
        const clickedSquare = convertSquare(clickedGraphical, board, perspective);
        clickHandler(clickedSquare, canvasBoard);
    }

    
    // Custom canvas re-render logic, since it does not work very well with React.
    useEffect(() => {

        function renderMoves(moves, board) {
            const canvasBoard = canvas.current;
            const ctx = canvasBoard.getContext('2d');

            const squareWidth = canvasBoard.width / board.cols;
            const squareHeight = canvasBoard.height / board.rows;
            const radius = Math.min(squareWidth, squareHeight) / 4;
    
            for (const square of moves) {
                const center = [square.col * squareWidth + squareWidth / 2, square.row * squareHeight + squareHeight / 2];
    
                ctx.fillStyle = 'green';
                ctx.beginPath();
                ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI, false);
                ctx.fill();
            }
        }
    
        function renderSelected(board) {
            if (selected) {
                const piece = board.getPiece(selected.row, selected.col);
                const moves = piece.getMoves(selected, board).map((square => convertSquare(square, board, perspective)));
                const renderSelected = convertSquare(selected, board, perspective);

                const canvasBoard = canvas.current;
                const squareWidth = canvasBoard.width / board.cols;
                const squareHeight = canvasBoard.height / board.rows;

                renderSquare(renderSelected, squareWidth, squareHeight, 'green');
                renderPiece(renderSelected, piece, squareWidth, squareHeight);
                renderMoves(moves, board);
            }
        }

        function renderSquare(square, squareWidth, squareHeight, color) {
            const canvasBoard = canvas.current;
            const ctx = canvasBoard.getContext('2d');

            const start = { x: square.col * squareWidth, y: square.row * squareHeight };
            ctx.fillStyle = color;
            ctx.fillRect(start.x, start.y, squareWidth, squareHeight);
        }
        
        function renderBoardBackground(board) {
            const colors = ['darkgrey', 'grey']; // could allow customizing later.

            const canvasBoard = canvas.current;
            const squareWidth = canvasBoard.width / board.cols;
            const squareHeight = canvasBoard.height / board.rows;
            for (let i = 0; i < board.rows; i++) {
                for (let j = 0; j < board.cols; j++) {
                    renderSquare({ col: j, row: i }, squareWidth, squareHeight, colors[(i + j) % 2]);
                }
            }
        }
        
        function renderPiece(square, piece, squareWidth, squareHeight) {
            const canvasBoard = canvas.current;
            const ctx = canvasBoard.getContext('2d');

            const start = { x: square.col * squareWidth + squareWidth / 4, y: square.row * squareHeight + (squareHeight * 0.75)};
            
            const pieceRep = piece.pieceName.toUpperCase();
            ctx.font = "32px Arial"; // todo adjust based on square sizes.
            ctx.lineWidth = 2;
            if (piece.color === Color.White) {
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
            } else {
                ctx.fillStyle = 'black';
                ctx.strokeStyle = 'white';
            }
        
            ctx.strokeText(pieceRep, start.x, start.y);
            ctx.fillText(pieceRep, start.x, start.y);
        }
        
        
        
        function renderBoardForeground(board) {
            const canvasBoard = canvas.current;

            const squareWidth = canvasBoard.width / board.cols;
            const squareHeight = canvasBoard.height / board.rows;
            for (let i = 0; i < board.rows; i++) {
                for (let j = 0; j < board.cols; j++) {
                    const piece = board.getPiece(i, j);
                    if (piece) {
                        renderPiece(convertSquare({ row: i, col: j }, board, perspective), piece, squareWidth, squareHeight);
                    }
                }
            }
        }

        if (canvas.current) {
            canvas.current.height = canvas.current.width; // make prop.
            renderBoardBackground(board);
            renderBoardForeground(board);
            renderSelected(board);
        }

    }, [board, perspective, moveUpdate, selected]);

    return (
        <canvas ref={canvas} onClick={clickHandler ? callClickHandler : undefined}></canvas>
    )

}
