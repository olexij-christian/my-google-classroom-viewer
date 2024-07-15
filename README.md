# Google Classroom Viewer

[українською мовою](README-uk.md)

[screenshot][screenshot.png]

## Overview
**my-google-classroom-viewer** is a simple graphical application designed to help educators view tasks assigned to students across all their Google Classroom courses. This tool aggregates tasks from various courses linked to your Google account, providing an organized and user-friendly interface.

## Features
- **Course Overview:** Displays a list of all courses linked to your Google account.
- **Task Management:** View tasks assigned to students in each course.
- **User-Friendly Interface:** Simple and intuitive graphical user interface for easy navigation and use.

## Installation

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/olexij-christian/my-google-classroom-viewer.git
   cd my-google-classroom-viewer
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Set up Google API credentials:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing project.
   - Enable the Google Classroom API for your project.
   - Create OAuth 2.0 Client IDs and download the credentials JSON file.
   - Save the credentials JSON file in the project directory and rename it to `credentials.json`.

4. Build the application for your target platform:

   For Linux:
   ```bash
   npm run build-linux-x64
   ```

   For Windows:
   ```bash
   npm run build-windows-portable-x64
   ```

## Usage
1. Launch the application by running the appropriate build for your platform.
2. Log in using your Google account credentials.
3. View all tasks

## License
This project is licensed under the GPLv3 License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments
I am grateful to my savior Jesus Christ for the time, the laptop and the opportunity to write such programs

