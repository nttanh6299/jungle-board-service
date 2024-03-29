import * as gameLogic from './gameLogic'
import * as ai from './ai'
import { klona } from 'klona'

export enum GameStatus {
  READY = 'Ready',
  PLAYING = 'Playing',
  PAUSE = 'Pause',
  END = 'End',
  TIE = 'Tie',
}

type History = {
  moves: gameLogic.Board[]
}

export class Game {
  state: gameLogic.IState = { board: [] }
  playerTurn = ''
  moveCount = 0
  maxMove = 0

  gameStatus: GameStatus = GameStatus.READY
  isSinglePlay = false

  history: History = { moves: [] }

  constructor() {
    this.initBoard()
  }

  initBoard() {
    this.state.board = gameLogic.getEmptyBoard()
    this.gameStatus = GameStatus.READY
  }

  startGame(maxMove: number, isSinglePlay?: boolean): void {
    this.gameStatus = GameStatus.PLAYING
    this.state.board = gameLogic.getInitialBoard()
    this.history = { moves: [] }
    this.playerTurn = gameLogic.PlayerSymbol.B
    this.isSinglePlay = Boolean(isSinglePlay)
    this.maxMove = maxMove
    this.moveCount = 0
  }

  getAllMoves(board: gameLogic.Board): gameLogic.AllPossibleMoves {
    return gameLogic.getAllMoves(board, this.playerTurn)
  }

  getRotatedBoard(): gameLogic.Board {
    const rotatedBoard = klona(this.state.board).reverse()
    for (let row = 0; row < gameLogic.ROWS; row++) {
      for (let col = 0; col < gameLogic.COLS / 2; col++) {
        const oppositeCol = gameLogic.COLS - col - 1
        const piece = rotatedBoard[row][col]
        const oppositePiece = rotatedBoard[row][oppositeCol]

        if (piece.includes(gameLogic.PlayerSymbol.B)) {
          rotatedBoard[row][col] = gameLogic.PlayerSymbol.W + piece.substring(1)
        } else if (piece.includes(gameLogic.PlayerSymbol.W)) {
          rotatedBoard[row][col] = gameLogic.PlayerSymbol.B + piece.substring(1)
        }

        if (oppositePiece.includes(gameLogic.PlayerSymbol.B)) {
          rotatedBoard[row][oppositeCol] = gameLogic.PlayerSymbol.W + oppositePiece.substring(1)
        } else if (oppositePiece.includes(gameLogic.PlayerSymbol.W)) {
          rotatedBoard[row][oppositeCol] = gameLogic.PlayerSymbol.B + oppositePiece.substring(1)
        }

        const temp = rotatedBoard[row][col]
        rotatedBoard[row][col] = rotatedBoard[row][oppositeCol]
        rotatedBoard[row][oppositeCol] = temp
      }
    }
    return rotatedBoard
  }

  move(deltaFrom: gameLogic.BoardDelta, deltaTo: gameLogic.BoardDelta, shouldRotateBoard?: boolean): boolean {
    if (!this.state.board) {
      return false
    }

    const moveFrom = { ...deltaFrom }
    const moveTo = { ...deltaTo }
    if (shouldRotateBoard) {
      moveFrom.row = gameLogic.ROWS - moveFrom.row - 1
      moveFrom.col = gameLogic.COLS - moveFrom.col - 1
      moveTo.row = gameLogic.ROWS - moveTo.row - 1
      moveTo.col = gameLogic.COLS - moveTo.col - 1
    }

    const isInvalidPiece = gameLogic.noChessPiece(this.state.board, moveFrom)
    if (isInvalidPiece) {
      return false
    }

    const { nextBoard, winner } = gameLogic.makeMove(this.state.board, moveFrom, moveTo)
    // const { prevBoard, nextBoard, winner } = gameLogic.makeMove(this.state.board, deltaFrom, deltaTo)

    // this.history.moves.push(prevBoard)
    this.state.board = nextBoard
    this.moveCount += 1

    if (winner !== '') {
      if (winner === this.playerTurn || winner === gameLogic.getOpponentTurn(this.playerTurn)) {
        this.gameStatus = GameStatus.END
      }
    } else if (this.moveCount === this.maxMove) {
      this.gameStatus = GameStatus.TIE
    }

    return true
  }

  computerMove(): void {
    setTimeout(() => {
      if (this.state.board) {
        const [deltaFrom, deltaTo] = ai.createComputerMove(this.state.board, gameLogic.PlayerSymbol.W)
        const { prevBoard, nextBoard, winner } = gameLogic.makeMove(this.state.board, deltaFrom, deltaTo)

        this.history.moves.push(prevBoard)
        this.state.board = nextBoard

        if (winner !== '') {
          if (winner === this.playerTurn || winner === gameLogic.getOpponentTurn(this.playerTurn)) {
            this.gameStatus = GameStatus.END
          } else {
            this.gameStatus = GameStatus.TIE
          }
          return
        }
      }
    }, 1000)
  }
}
