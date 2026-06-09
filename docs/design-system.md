# Vainy Design System

Vainy utilizes a futuristic Nothing OS and Zorin OS matching glassmorphic design system.

## Color Tokens

Colors are defined globally in `src/index.css` via CSS variables. Never hardcode colors in components.

| CSS Variable | Default Value | Usage |
| :--- | :--- | :--- |
| `--background` | `#090a0f` | Main background color |
| `--card` | `rgba(20, 22, 34, 0.45)` | Standard card/panel background |
| `--card-hover` | `rgba(30, 33, 50, 0.6)` | Card background during hover states |
| `--primary` | `#4f46e5` | Core brand color |
| `--cyan` | `#06b6d4` | Highlight and interactive indicators |
| `--violet` | `#7c3aed` | Secondary accent |
| `--danger` | `#ef4444` | Errors and warning temperatures |
| `--success` | `#10b981` | Green active badges and healthy battery status |
| `--glass` | `rgba(9, 10, 15, 0.7)` | Layout background panels |
| `--border` | `rgba(255, 255, 255, 0.08)` | Standard board dividers |

## Typography

- **Headings (H1 - H6)**: `Outfit`, sans-serif (Geometric, modern, high-readability).
- **Body & Paragraphs**: `Inter`, sans-serif (Clean, humanist design).
- **Console & Metrics**: Monospace font stack.

## Glassmorphism Guidelines

To apply glass panel aesthetics:
- Class `.glass-panel`: Applies `--glass` background with `blur(24px)` and standard `--border`.
- Class `.glass-card`: Applies `--card` background with `blur(12px)` and standard `--border`. Hover states transition smoothly to `--card-hover` and `--border-hover`.
