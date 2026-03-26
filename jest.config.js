/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true,
          target: "esnext",
          lib: ["esnext"],
          types: ["node", "jest"],
          strict: true,
          skipLibCheck: true,
          resolveJsonModule: true,
          isolatedModules: false,
          noUncheckedIndexedAccess: true,
        },
      },
    ],
  },
};