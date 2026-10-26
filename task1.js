
const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 8;
const MIN_DIGIT = 0;
const MAX_DIGIT = 9;

let secretCode = "";
let attemptsLeft = MAX_ATTEMPTS;
let gameOver = false;
let guessHistory = [];

const form = document.getElementById("guess-form");
const guessInput = document.getElementById("guess");
const attemptsText = document.getElementById("attempts");
const lengthText = document.getElementById("code-length");
const secretDisplay = document.getElementById("secret-display");
const message = document.getElementById("message");
const historyContainer = document.getElementById("history");
const checkButton = document.getElementById("check-btn");
const restartButton = document.getElementById("restart-btn");
const maxAttemptsText = document.getElementById("max-attempts");

guessInput.maxLength = CODE_LENGTH;

function randomDigit() {
  return Math.floor(
    Math.random() * (MAX_DIGIT - MIN_DIGIT + 1)
  ) + MIN_DIGIT;
}

function generateCode() {
  const availableDigits = MAX_DIGIT - MIN_DIGIT + 1;

  if (
    CODE_LENGTH > availableDigits ||
    CODE_LENGTH < 1 ||
    MIN_DIGIT < 0 ||
    MAX_DIGIT > 9 ||
    MIN_DIGIT > MAX_DIGIT ||
    !Number.isInteger(CODE_LENGTH) ||
    !Number.isInteger(MIN_DIGIT) ||
    !Number.isInteger(MAX_DIGIT) ||
    !Number.isInteger(MAX_ATTEMPTS) ||
    MAX_ATTEMPTS < 1
  ) {
    throw new Error("Invalid game configuration");
  }

  let code = "";

  while (code.length < CODE_LENGTH) {
    const digit = String(randomDigit());

    if (!code.includes(digit)) {
      code += digit;
    }
  }

  return code;
}

function validateGuess(guess) {
  if (guess.length !== CODE_LENGTH) {
    return `Enter exactly ${CODE_LENGTH} digits.`;
  }

  if (!/^[0-9]+$/.test(guess)) {
    return "Only digits are allowed.";
  }

  if (new Set(guess).size !== CODE_LENGTH) {
    return "Digits must not repeat.";
  }

  for (const digit of guess) {
    const number = Number(digit);

    if (number < MIN_DIGIT || number > MAX_DIGIT) {
      return `Use digits from ${MIN_DIGIT} to ${MAX_DIGIT}.`;
    }
  }

  return "";
}

function checkGuess(guess) {
  let correctPlace = 0;
  let wrongPlace = 0;

  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i] === secretCode[i]) {
      correctPlace++;
    } else if (secretCode.includes(guess[i])) {
      wrongPlace++;
    }
  }

  return { correctPlace, wrongPlace };
}

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = type;
}

function renderHistory() {
  historyContainer.replaceChildren();

  if (guessHistory.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "No guesses yet.";
    historyContainer.appendChild(empty);
    return;
  }

  for (const item of guessHistory) {
    const row = document.createElement("div");
    row.className = "history-item";

    const code = document.createElement("strong");
    code.textContent = item.guess;

    const result = document.createElement("span");
    result.textContent =
      `${item.correctPlace} right place, ${item.wrongPlace} wrong place`;

    row.append(code, result);
    historyContainer.appendChild(row);
  }
}

function renderSecret() {
  secretDisplay.replaceChildren();

  for (let i = 0; i < CODE_LENGTH; i++) {
    const box = document.createElement("span");
    box.textContent = gameOver ? secretCode[i] : "?";
    secretDisplay.appendChild(box);
  }
}

function render() {
  attemptsText.textContent = attemptsLeft;
  lengthText.textContent = CODE_LENGTH;
  maxAttemptsText.textContent = MAX_ATTEMPTS;

  guessInput.disabled = gameOver;
  checkButton.disabled = gameOver;

  renderSecret();
  renderHistory();
}

function submitGuess(event) {
  event.preventDefault();

  if (gameOver) {
    showMessage("The game is already finished.", "error");
    return;
  }

  const guess = guessInput.value.trim();
  const error = validateGuess(guess);

  if (error !== "") {
    showMessage(error, "error");
    return;
  }

  const result = checkGuess(guess);
  attemptsLeft--;

  guessHistory.push({
    guess: guess,
    correctPlace: result.correctPlace,
    wrongPlace: result.wrongPlace
  });

  if (result.correctPlace === CODE_LENGTH) {
    gameOver = true;
    showMessage("Congratulations! You cracked the code!", "win");
  } else if (attemptsLeft === 0) {
    gameOver = true;
    showMessage("Game Over! The secret code is revealed.", "loss");
  } else {
    showMessage("Keep trying! Use the hints.", "success");
  }

  guessInput.value = "";
  render();

  if (!gameOver) {
    guessInput.focus();
  }
}

function restartGame() {
  secretCode = generateCode();
  attemptsLeft = MAX_ATTEMPTS;
  gameOver = false;
  guessHistory = [];

  guessInput.value = "";
  showMessage("Enter your first guess!");
  render();
  guessInput.focus();
}

form.addEventListener("submit", submitGuess);
restartButton.addEventListener("click", restartGame);

restartGame();
