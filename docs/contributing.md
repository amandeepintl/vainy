# Contributing to Vainy

Thank you for contributing to Vainy! Follow these guidelines to ensure a smooth contribution workflow.

## Project Structure

```
apps/desktop/        # Tauri GUI Application
crates/              # Independent Rust libraries
daemon/              # Background privilege manager
docs/                # Documentation guides
```

## Developing Backend (Rust)

1. Ensure the Rust toolchain is installed.
2. Run `cargo check` to verify workspace compatibility.
3. Write clean, idiomatic Rust. Format using:
   ```bash
   cargo fmt
   ```
4. Run code quality checks:
   ```bash
   cargo clippy --all-targets -- -D warnings
   ```

## Developing Frontend (React)

1. Change directory to `apps/desktop`.
2. Run the frontend dev environment:
   ```bash
   npm run dev
   ```
3. Always verify compilation before committing:
   ```bash
   npm run build
   ```

## Pull Request Process

1. Fork the repository and create your feature branch: `git checkout -b feature/cool-new-thing`.
2. Commit your changes with descriptive messages.
3. Submit a Pull Request targeting the `main` branch.
4. Ensure all CI/CD workflows compile and pass checks.
