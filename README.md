# NeumaWave Shaper

> LiveWebApp -> https://dovvnloading.github.io/NeumaWave-Shaper/

<img width="1110" height="858" alt="Screenshot 2025-12-25 100417" src="https://github.com/user-attachments/assets/3b20f1df-b0ea-4e85-83fb-5ad84abd33f3" />

---

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

NeumaWave Shaper is a browser-based, polyphonic wavetable synthesizer built on the Web Audio API. It features a fully neumorphic user interface designed for tactile responsiveness and integrates a custom waveform editor allowing users to draw and manipulate oscillator shapes in real-time.

The engine utilizes pure mathematical signal generation without reliance on external audio samples, ensuring a lightweight footprint and infinite sonic possibilities.

## Features

### Core Synthesis
*   **Triple Oscillator Engine:** Three independent oscillators (A, B, C) with individual volume, octave, and fine-tune controls.
*   **Custom Waveform Editor:** Interactive HTML5 Canvas visualizer allowing freehand drawing of waveform cycles.
*   **Algorithmic Generators:** Context-menu tools to generate standard shapes (Sine, Saw, Square, Triangle, Noise) or modify existing shapes (Normalize, Smooth, Invert, Rectify, Bitcrush).
*   **Spectral Unison:** Advanced unison stack supporting up to 9 voices per oscillator with spread, detune, and blend controls. Includes multiple distribution modes (Classic, Uniform, Fifth, Octave).

### Signal Processing & FX
*   **State Variable Filter:** Resonant filter with Lowpass, Highpass, and Bandpass topologies.
*   **Stereo Delay:** BPM-synced or free-running delay with feedback and wet/dry mix.
*   **Convolution Reverb:** Algorithmic impulse response generation for creating realistic or unnatural spaces.
*   **Dynamics Processing:** Integrated master compressor and soft-clipping limiter to manage headroom and add analog-style saturation.

### User Interface
*   **Neumorphic Design System:** Custom CSS implementation of Soft UI principles using complex shadow layering for depth perception.
*   **Virtual Input:** Fully mapped QWERTY keyboard support (FL Studio layout) and an on-screen touch-capable piano.
*   **Preset Management:** JSON-based preset system with save functionality and a digital monitor display.

## Architecture

NeumaWave is built using **React 19** and **TypeScript**, leveraging **Vite** for the build toolchain.

### Audio Engine
The audio core (`audioEngine.ts`) is a singleton class wrapping the browser's `AudioContext`. It abstracts the node graph management:

1.  **Oscillator Node Generation:** When a note is triggered, the engine creates a cluster of `OscillatorNodes` based on the active unison settings.
2.  **PeriodicWave Creation:** Custom waveforms drawn on the canvas are converted into Real and Imaginary Fourier coefficients using FFT, generating a `PeriodicWave` object that prevents aliasing.
3.  **Signal Chain:**
    ```
    Oscillators -> Panners -> Envelope Gain -> FX Bus -> Filter -> Delay -> Reverb -> Soft Clipper -> Master Gain -> Compressor -> Destination
    ```

### State Management
React handles the UI state (knob positions, active menus), while the Audio Engine maintains the imperative audio graph state. Unidirectional data flow ensures that UI updates (e.g., dragging a knob) immediately propagate to the `AudioParam` targets (e.g., `filterNode.frequency.setTargetAtTime`).

## Installation and Setup

### Prerequisites
*   Node.js (v18.0.0 or higher)
*   npm or yarn

### Local Development

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/neumawave-shaper.git
    cd neumawave-shaper
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## Usage Guide

### Waveform Editing
*   **Draw:** Left-click and drag inside the visualizer window to draw a single cycle of the waveform.
*   **Context Menu:** Right-click the visualizer to access algorithmic generators (Sine, Triangle, etc.) and modifiers (Smooth, Fold, Drive).

### Controls
*   **Knobs:** Click and drag vertically to adjust values. Double-click to type a specific value.
*   **Inputs:** Supports both mouse/touch interaction and keyboard input.
*   **Keyboard Shortcut:** The middle row (ASDF...) controls the lower octave, and the top row (QWERTY...) controls the upper octave.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
