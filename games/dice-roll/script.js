const displayIcon = document.getElementById("displayIcon");
const resultText = document.getElementById("resultText");
const rollDiceBtn = document.getElementById("rollDiceBtn");
const flipCoinBtn = document.getElementById("flipCoinBtn");

const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

// Roll Dice
rollDiceBtn.addEventListener("click", () => {
  animateAction();
  setTimeout(() => {
    const diceNumber = Math.floor(Math.random() * 6);
    displayIcon.textContent = diceFaces[diceNumber];
    resultText.textContent = `You rolled a ${diceNumber + 1}!`;
    resultText.className = "text-sm font-semibold text-orange-400 mb-6 h-6";
  }, 300);
});

// Flip Coin
flipCoinBtn.addEventListener("click", () => {
  animateAction();
  setTimeout(() => {
    const isHeads = Math.random() < 0.5;
    displayIcon.textContent = isHeads ? "🪙" : "👑";
    resultText.textContent = isHeads ? "It's Heads!" : "It's Tails!";
    resultText.className = "text-sm font-semibold text-amber-400 mb-6 h-6";
  }, 300);
});

// Bounce Animation
function animateAction() {
  displayIcon.classList.add("scale-75", "rotate-12");
  resultText.textContent = "Rolling...";
  resultText.className = "text-sm font-semibold text-slate-400 mb-6 h-6";
  setTimeout(() => {
    displayIcon.classList.remove("scale-75", "rotate-12");
  }, 300);
}