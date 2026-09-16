/** @type {import("stylelint").Config} */
const config = {
  extends: ["stylelint-config-standard-scss"],
  ignoreFiles: [".next/**", "node_modules/**", "out/**", "coverage/**"],
  rules: {
    "selector-class-pattern": [
      "^[a-z][a-zA-Z0-9]*$",
      {
        message: "CSS Module 클래스 이름은 camelCase로 작성해주세요.",
      },
    ],
  },
};

export default config;
