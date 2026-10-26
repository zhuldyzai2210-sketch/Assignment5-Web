
const TOTAL_POINTS = 20;
const MIN_SKILL = 1;
const MAX_SKILL = 10;

const TAKEN_NAMES = ["admin", "legend", "shadow", "dragon"];

const DEFAULT_CHARACTER = {
  name: "Luna",
  className: "mage",
  color: "purple",
  strength: 3,
  magic: 8,
  agility: 5,
  defense: 4
};

const CLASS_RULES = {
  mage: { skill: "magic", minimum: 5 },
  warrior: { skill: "strength", minimum: 5 },
  archer: { skill: "agility", minimum: 5 }
};

const CLASS_ICONS = {
  mage: "🧙‍♀️",
  warrior: "⚔️",
  archer: "🏹"
};

const form = document.getElementById("character-form");
const preview = document.getElementById("character-preview");
const finalCharacter = document.getElementById("final-character");
const pointsLeft = document.getElementById("points-left");
const pointsError = document.getElementById("points-error");
const errorSummary = document.getElementById("error-summary");

const randomButton = document.getElementById("random-btn");
const resetButton = document.getElementById("reset-btn");

const fields = {
  name: document.getElementById("character-name"),
  className: document.getElementById("character-class"),
  color: document.getElementById("outfit-color"),
  strength: document.getElementById("strength"),
  magic: document.getElementById("magic"),
  agility: document.getElementById("agility"),
  defense: document.getElementById("defense")
};

const skillNames = ["strength", "magic", "agility", "defense"];

const errorElements = {
  name: document.getElementById("name-error"),
  className: document.getElementById("class-error"),
  color: document.getElementById("color-error"),
  strength: document.getElementById("strength-error"),
  magic: document.getElementById("magic-error"),
  agility: document.getElementById("agility-error"),
  defense: document.getElementById("defense-error")
};

const touchedFields = new Set();
const createdNames = new Set();

let submitted = false;

form.noValidate = true;

function getCharacter() {
  return {
    name: fields.name.value.trim(),
    className: fields.className.value,
    color: fields.color.value,
    strength: Number(fields.strength.value),
    magic: Number(fields.magic.value),
    agility: Number(fields.agility.value),
    defense: Number(fields.defense.value)
  };
}

function validateField(key, character) {
  const value = character[key];

  if (key === "name") {
    if (value.length < 3 || value.length > 20) {
      return "Name must contain 3 to 20 characters.";
    }

    if (!/^[a-zA-Z ]+$/.test(value)) {
      return "Use English letters and spaces only.";
    }

    const normalized = value.toLowerCase();

    if (
      TAKEN_NAMES.includes(normalized) ||
      createdNames.has(normalized)
    ) {
      return "This character name is already taken.";
    }

    return "";
  }

  if (key === "className") {
    if (!Object.hasOwn(CLASS_RULES, value)) {
      return "Choose a valid character class.";
    }

    return "";
  }

  if (key === "color") {
    if (!["purple", "blue", "pink", "green"].includes(value)) {
      return "Choose a valid outfit color.";
    }

    return "";
  }

  if (skillNames.includes(key)) {
    const raw = fields[key].value.trim();

    if (raw === "") {
      return "This skill is required.";
    }

    if (!Number.isInteger(value)) {
      return "Enter a whole number.";
    }

    if (value < MIN_SKILL || value > MAX_SKILL) {
      return `Enter a value from ${MIN_SKILL} to ${MAX_SKILL}.`;
    }

    return "";
  }

  return "";
}

function validatePoints(character) {
  const validSkills = skillNames.every(
    key => validateField(key, character) === ""
  );

  if (!validSkills) {
    return "Enter valid skill values first.";
  }

  const total = skillNames.reduce(
    (sum, key) => sum + character[key],
    0
  );

  if (total !== TOTAL_POINTS) {
    return `Allocate exactly ${TOTAL_POINTS} points. Current: ${total}.`;
  }

  return "";
}

function validateClassRule(character) {
  if (!Object.hasOwn(CLASS_RULES, character.className)) {
    return "";
  }

  const rule = CLASS_RULES[character.className];

  if (validateField(rule.skill, character) !== "") {
    return "";
  }

  if (character[rule.skill] < rule.minimum) {
    return `${character.className} requires ${rule.skill} >= ${rule.minimum}.`;
  }

  return "";
}

function setFieldError(key, error) {
  errorElements[key].textContent = error;
  fields[key].setAttribute(
    "aria-invalid",
    error === "" ? "false" : "true"
  );
}

function validateAll(showAll = false) {
  const character = getCharacter();
  const errors = {};

  for (const key of Object.keys(fields)) {
    errors[key] = validateField(key, character);
  }

  const pointsMessage = validatePoints(character);
  const classMessage = validateClassRule(character);

  if (classMessage) {
    const rule = CLASS_RULES[character.className];
    if (rule && !errors[rule.skill]) {
      errors[rule.skill] = classMessage;
    }
  }

  for (const key of Object.keys(fields)) {
    if (showAll || submitted || touchedFields.has(key)) {
      setFieldError(key, errors[key]);
    }
  }

  if (showAll || submitted || skillNames.some(
    key => touchedFields.has(key)
  )) {
    pointsError.textContent = pointsMessage;
  }

  const validFields = Object.values(errors).every(
    error => error === ""
  );

  return {
    valid: validFields && pointsMessage === "",
    errors,
    pointsMessage,
    character
  };
}

function updatePoints(character) {
  const total = skillNames.reduce(
    (sum, key) => sum + character[key],
    0
  );

  const remaining = TOTAL_POINTS - total;

  pointsLeft.textContent =
    remaining === 0
      ? "20/20 points allocated"
      : remaining > 0
        ? `${remaining} points left`
        : `${Math.abs(remaining)} points over limit`;

  pointsLeft.classList.toggle("invalid", remaining !== 0);
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function buildCharacterCard(character) {
  const card = makeElement("div", "character-card");

  const avatar = makeElement(
    "div",
    `character-avatar ${character.color}`,
    CLASS_ICONS[character.className] || "✨"
  );

  const name = makeElement(
    "div",
    "character-name",
    character.name || "Unnamed Hero"
  );

  const classLabel = makeElement(
    "span",
    "character-class",
    character.className
  );

  const skillsContainer = makeElement(
    "div",
    "character-skills"
  );

  for (const key of skillNames) {
    const skillCard = makeElement("div", "skill-card");
    const label = makeElement("span", "", key);
    const value = makeElement(
      "strong",
      "",
      String(character[key])
    );

    skillCard.append(label, value);
    skillsContainer.appendChild(skillCard);
  }

  card.append(avatar, name, classLabel, skillsContainer);
  return card;
}

function renderPreview() {
  const character = getCharacter();

  preview.replaceChildren(buildCharacterCard(character));
  updatePoints(character);
}

function updateForm() {
  renderPreview();
  validateAll();
}

function fillForm(character) {
  for (const key of Object.keys(fields)) {
    fields[key].value = character[key];
  }

  touchedFields.clear();
  submitted = false;
  errorSummary.textContent = "";
  pointsError.textContent = "";

  for (const key of Object.keys(fields)) {
    errorElements[key].textContent = "";
    fields[key].removeAttribute("aria-invalid");
  }

  renderPreview();
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCharacter() {
  const classes = Object.keys(CLASS_RULES);
  const colors = ["purple", "blue", "pink", "green"];
  const names = ["Nova", "Aurora", "Stella", "Phoenix", "Iris"];

  const availableNames = names.filter(
    name => !createdNames.has(name.toLowerCase())
  );

  const name = availableNames.length
    ? availableNames[randomInteger(0, availableNames.length - 1)]
    : "New Hero";

  const className = classes[randomInteger(0, classes.length - 1)];
  const color = colors[randomInteger(0, colors.length - 1)];

  const character = {
    name,
    className,
    color,
    strength: 1,
    magic: 1,
    agility: 1,
    defense: 1
  };

  const rule = CLASS_RULES[className];
  character[rule.skill] = rule.minimum;

  let remaining = TOTAL_POINTS - (
    skillNames.reduce((sum, key) => sum + character[key], 0)
  );

  while (remaining > 0) {
    const available = skillNames.filter(
      key => character[key] < MAX_SKILL
    );

    const key = available[randomInteger(0, available.length - 1)];
    character[key]++;
    remaining--;
  }

  fillForm(character);
}

function createCharacter(event) {
  event.preventDefault();

  submitted = true;
  const result = validateAll(true);

  if (!result.valid) {
    errorSummary.textContent =
      "Please fix the highlighted fields before creating your character.";

    const firstInvalidKey = Object.keys(fields).find(
      key => result.errors[key] !== ""
    );

    if (firstInvalidKey) {
      fields[firstInvalidKey].focus();
    } else if (result.pointsMessage) {
      fields.strength.focus();
    }

    return;
  }

  const character = result.character;

  createdNames.add(character.name.toLowerCase());

  const finalCard = makeElement("div", "final-card");
  const heading = makeElement(
    "h3",
    "",
    "✨ Character Created Successfully!"
  );

  finalCard.append(
    heading,
    buildCharacterCard(character)
  );

  finalCharacter.replaceChildren(finalCard);

  fillForm(DEFAULT_CHARACTER);

  if (createdNames.has(DEFAULT_CHARACTER.name.toLowerCase())) {
    fields.name.value = "";
    renderPreview();
  }

  errorSummary.textContent = "";
}

for (const [key, field] of Object.entries(fields)) {
  field.addEventListener("blur", function() {
    touchedFields.add(key);
    updateForm();
  });

  field.addEventListener("input", updateForm);
  field.addEventListener("change", updateForm);
}

randomButton.addEventListener("click", randomCharacter);

resetButton.addEventListener("click", function() {
  fillForm(DEFAULT_CHARACTER);
});

form.addEventListener("submit", createCharacter);

fillForm(DEFAULT_CHARACTER);
