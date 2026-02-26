# Graph Renderer ⬡

A high-performance, single-page diagramming tool for turning text into visual architecture. Built to support both **Mermaid** and **PlantUML** with a sleek, developer-centric interface.

![demo image](demo.png)


## ✨ Features

* **Dual-Engine Support**: Seamlessly toggle between **Mermaid** (client-side) and **PlantUML** (server-side) rendering.
* **Dynamic Resizable Layout**:
* **Custom Split Panes**: Use the `useResizableSplit` hook for fluid horizontal (Left/Right) and vertical (Top/Bottom) resizing.
* **Triple-View Workflow**:
* **Top-Left**: Requirements & Specs for easy reference.
* **Bottom-Left**: High-fidelity code editor for diagram syntax.
* **Right Pane**: Real-time diagram preview.




* **Interactive Inspection**:
* **Zoom & Pan**: Smooth zoom controls (+/- or Ctrl+Scroll) and drag-to-pan for complex diagrams.
* **Snap Reset**: Instantly return to 100% scale and center focus.


* **Advanced Export System**:
* **Smart Image Export**: Saves the current diagram as a high-resolution PNG with engine-specific naming.
* **Full Project Bundle (.zip)**: Exports a complete package including `requirements.md`, the source code for both engines, and the rendered PNGs.


* **Persistence & Versioning**: Automatically saves session state to `localStorage` with bumped storage keys to ensure data integrity across updates.
* **CI/CD Ready**: Integrated GitHub Actions for automated deployment to GitHub Pages.

## 🚀 Tech Stack

* **Core**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Modern flex-based split layouts)
* **Diagramming**: [Mermaid.js](https://mermaid.js.org/) & [PlantUML](https://plantuml.com/)
* **Utilities**: [Pako](https://github.com/nodeca/pako) (PlantUML URL encoding), [JSZip](https://stuk.github.io/jszip/) (Advanced exporting)
* **Deployment**: [GitHub Actions](https://github.com/features/actions)

## 🛠️ Architecture Notes

The application uses a modular `DiagramPane` architecture.

* **Mermaid**: Rendered directly in the DOM using the Mermaid API.
* **PlantUML**: Encodes text into a compressed format via `Pako` to fetch images from the official PlantUML server.
* **State Management**: Uses a custom `useResizableSplit` hook to manage layout proportions via mouse-drag events on vertical and horizontal "gutter" handles.

## 🏁 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v20 or higher recommended)
* [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/JosephPham324/graph-renderer.git
cd graph-renderer

```


2. **Install dependencies:**
```bash
npm install

```


3. **Start the development server:**
```bash
npm run dev

```



## 📦 Deployment

This project is pre-configured for **GitHub Pages** via GitHub Actions.

1. Push your code to the `main` branch.
2. Ensure your repository settings under **Settings > Pages > Source** is set to **GitHub Actions**.
3. The build workflow will automatically deploy the app to `https://<username>.github.io/graph-renderer`.

---

Built with ⚡ by [Joseph Pham](https://www.google.com/search?q=https://github.com/JosephPham324)