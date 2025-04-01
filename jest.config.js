module.exports = {
  // The root directory where Jest should look for test files
  rootDir: ".",
  
  // The test environment that will be used for testing
  testEnvironment: "node",
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/tests/**/*.test.js"
  ],
  
  // An array of regexp pattern strings that are matched against all test paths
  // before executing the test
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  
  // A list of paths to directories that Jest should use to search for files in
  roots: [
    "<rootDir>"
  ],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // A list of paths to modules that run some code to configure or set up
  // the testing environment
  setupFilesAfterEnv: [
    "<rootDir>/tests/setup.js"
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  
  // An array of glob patterns indicating a set of files for which coverage 
  // information should be collected
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!**/node_modules/**"
  ],
  
  // The minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Stop running tests after the first failure
  bail: false,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false
}; 