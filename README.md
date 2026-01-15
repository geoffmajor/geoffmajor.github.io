# Geoffrey Major - QA Engineer

Welcome to the repo for my personal portfolio. This site is designed to be a fast, clean representation of my work in Quality Assurance and Test Automation.

## Tech Stack
I built this site with a focus on **performance** and **maintainability**, avoiding heavy frameworks in favor of native web technologies:
- **HTML5**: Semantic structure and accessibility (ARIA).
- **CSS3**: Modern variables (CSS Custom Properties) and Flexbox/Grid layouts.
- **Vanilla JavaScript**: Zero dependencies to keep the bundle size minimal and the site blazing fast.

## Key Feature: Interactive Automation Sandbox
To demonstrate my approach to automation without requiring a backend, I built a custom **Playwright Simulator** directly into the "Projects" section. 

This component allows visitors to:
- **View Code**: Toggle between Spec, Page Object, and Utility files.
- **Run Tests**: Execute a simulated test suite (`npx playwright test`) inside a mock terminal.
- **Visualize Patterns**: See how I use the **Page Object Model (POM)** and shared utilities to create scalable, readable test code.

The simulator itself is written in pure JavaScript, managing state and DOM updates efficiently to mimic a real terminal environment.

## Accessibility
I strive to build inclusive software. This site includes:
- Semantic HTML headers and landmarks.
- Focus management for keyboard navigation.
- `aria-live` regions for dynamic content (like the terminal output).
- High contrast colors (WCAG AA/AAA compliant).

---
*Feel free to poke around the code to see how I structure my projects.*
