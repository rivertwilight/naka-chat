const FIRST_NAMES = [
  "Alex",
  "Jamie",
  "Taylor",
  "Jordan",
  "Morgan",
  "Casey",
  "Riley",
  "Avery",
  "Skyler",
  "Quinn",
];

const LAST_NAMES = [
  "Chen",
  "Smith",
  "Lee",
  "Patel",
  "Kim",
  "Garcia",
  "Singh",
  "Khan",
  "Nguyen",
  "Yamamoto",
];

export function getRandomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function getRandomAvatar(name: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    name,
  )}`;
}
